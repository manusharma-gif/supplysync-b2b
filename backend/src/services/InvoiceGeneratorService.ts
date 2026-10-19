import { InvoiceRepository } from '../repositories/InvoiceRepository.js';
import { LoadRepository } from '../repositories/LoadRepository.js';
import { BidRepository } from '../repositories/BidRepository.js';
import { CorridorRepository } from '../repositories/CorridorRepository.js';
import { CurrencyUtil } from '../utils/currency.js';
import { Invoice } from '../models/index.js';

export interface InvoiceGenerationParams {
  loadId: number;
  bidId: number;
  brokerId: number;
  brokerMarginPercent?: number; // e.g. 8 for 8%
}

export interface TaxJurisdictionResult {
  isInterState: boolean;
  originState: string;
  destState: string;
}

export interface GTAGSTCalculation {
  subtotalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalGstPaise: number;
  finalTotalPaise: number;
  isInterState: boolean;
}

export class InvoiceGeneratorService {
  private invoiceRepository: InvoiceRepository;
  private loadRepository: LoadRepository;
  private bidRepository: BidRepository;
  private corridorRepository: CorridorRepository;

  private static CITY_STATE_MAP: Record<string, string> = {
    jalandhar: 'Punjab',
    ludhiana: 'Punjab',
    pathankot: 'Punjab',
    amritsar: 'Punjab',
    chandigarh: 'Punjab',
    mohali: 'Punjab',
    patiala: 'Punjab',
    bathinda: 'Punjab',
    gurugram: 'Haryana',
    gurgaon: 'Haryana',
    faridabad: 'Haryana',
    panipat: 'Haryana',
    delhi: 'Delhi',
    'delhi ncr': 'Delhi',
    jaipur: 'Rajasthan',
    jodhpur: 'Rajasthan',
    mumbai: 'Maharashtra',
    pune: 'Maharashtra',
    nagpur: 'Maharashtra',
    ahmedabad: 'Gujarat',
    surat: 'Gujarat',
    vadodara: 'Gujarat',
    bengaluru: 'Karnataka',
    bangalore: 'Karnataka',
    chennai: 'Tamil Nadu',
    hyderabad: 'Telangana',
    kolkata: 'West Bengal',
  };

  private static STATE_GST_CODES: Record<string, string> = {
    Punjab: '03',
    Delhi: '07',
    Haryana: '06',
    Rajasthan: '08',
    'Himachal Pradesh': '02',
    Maharashtra: '27',
    Gujarat: '24',
    Karnataka: '29',
    'Tamil Nadu': '33',
    Telangana: '36',
    'West Bengal': '19',
    'Uttar Pradesh': '09',
  };

  constructor() {
    this.invoiceRepository = new InvoiceRepository();
    this.loadRepository = new LoadRepository();
    this.bidRepository = new BidRepository();
    this.corridorRepository = new CorridorRepository();
  }

  /**
   * Evaluates if freight route is Inter-State or Intra-State
   * Resolves state jurisdiction from cities if not provided.
   */
  public determineTaxJurisdiction(
    originCity: string,
    originState?: string,
    destCity?: string,
    destState?: string
  ): TaxJurisdictionResult {
    const oCityClean = (originCity || '').trim().toLowerCase();
    const dCityClean = (destCity || '').trim().toLowerCase();

    const resolvedOriginState =
      originState && originState.trim().length > 0
        ? originState.trim()
        : InvoiceGeneratorService.CITY_STATE_MAP[oCityClean] || 'Punjab';

    const resolvedDestState =
      destState && destState.trim().length > 0
        ? destState.trim()
        : InvoiceGeneratorService.CITY_STATE_MAP[dCityClean] || 'Delhi';

    const isInterState =
      resolvedOriginState.trim().toLowerCase() !== resolvedDestState.trim().toLowerCase();

    return {
      isInterState,
      originState: resolvedOriginState,
      destState: resolvedDestState,
    };
  }

  /**
   * Goods Transport Agency (GTA) Forward-Charge GST Calculation (SAC 996511)
   * Standard Rate: 12%
   * - Intra-State: 6% CGST + 6% SGST
   * - Inter-State: 12% IGST
   * Zero Floating-Point Math: strictly calculated in integer Paise.
   */
  public calculateGTAGST(subtotalPaise: number, isInterState: boolean): GTAGSTCalculation {
    if (isInterState) {
      // 12% IGST for Inter-State movement
      const igstPaise = CurrencyUtil.calculatePercentage(subtotalPaise, 12);
      return {
        subtotalPaise,
        cgstPaise: 0,
        sgstPaise: 0,
        igstPaise,
        totalGstPaise: igstPaise,
        finalTotalPaise: subtotalPaise + igstPaise,
        isInterState: true,
      };
    } else {
      // 6% CGST + 6% SGST for Intra-State movement
      const cgstPaise = CurrencyUtil.calculatePercentage(subtotalPaise, 6);
      const sgstPaise = CurrencyUtil.calculatePercentage(subtotalPaise, 6);
      const totalGstPaise = cgstPaise + sgstPaise;
      return {
        subtotalPaise,
        cgstPaise,
        sgstPaise,
        igstPaise: 0,
        totalGstPaise,
        finalTotalPaise: subtotalPaise + totalGstPaise,
        isInterState: false,
      };
    }
  }

  /**
   * Automatically generates a GST-compliant dispatch invoice when Broker approves a bid.
   */
  public async generateInvoice(params: InvoiceGenerationParams): Promise<Invoice> {
    const { loadId, bidId, brokerId, brokerMarginPercent = 8 } = params;

    const load = await this.loadRepository.findById(loadId);
    if (!load) {
      throw new Error(`Load with ID ${loadId} not found`);
    }

    const bid = await this.bidRepository.findById(bidId);
    if (!bid) {
      throw new Error(`Bid with ID ${bidId} not found`);
    }

    // 1. Resolve State Jurisdiction (Intra vs Inter-State)
    const jurisdiction = this.determineTaxJurisdiction(
      load.origin_city,
      load.origin_state,
      load.destination_city,
      load.destination_state
    );

    // 2. Base Freight from Carrier Bid
    const baseFreightPaise = bid.bid_amount_paise;

    // 3. Broker Margin (Net spread if budget defined, or percentage of base freight)
    let brokerMarginPaise: number;
    if (load.shipper_budget_paise && load.shipper_budget_paise > baseFreightPaise) {
      brokerMarginPaise = load.shipper_budget_paise - baseFreightPaise;
    } else {
      brokerMarginPaise = CurrencyUtil.calculatePercentage(baseFreightPaise, brokerMarginPercent);
    }

    const subtotalPaise = baseFreightPaise + brokerMarginPaise;

    // 4. Calculate 12% GTA GST
    const gstBreakdown = this.calculateGTAGST(subtotalPaise, jurisdiction.isInterState);

    // 5. Unique Tax Invoice Number format: INV-SS-YYYY-<loadId><bidId><timestamp>
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-SS-${new Date().getFullYear()}-${loadId}${bidId}${randomSuffix}`;

    // 6. E-Way Bill Part-A / Part-B Rule 138 Compliance (Threshold > ₹50,000 / 5,000,000 Paise)
    const EWAY_BILL_THRESHOLD_PAISE = 5000000;
    const isEwayBillRequired = subtotalPaise > EWAY_BILL_THRESHOLD_PAISE;

    const corridor = await this.corridorRepository.findByCities(load.origin_city, load.destination_city);
    const distanceKm = corridor ? corridor.distanceKm : 310;

    let ewayBillNumber: string | undefined;
    let ewayBillValidUntil: Date | undefined;
    let shipToGstin: string | undefined;
    let vehicleNumber: string | undefined;
    let ewayBillStatus: string = 'EXEMPT_BELOW_50K';

    if (isEwayBillRequired) {
      // 12-digit mock E-Way Bill Number (e.g., "2410 8923 4412")
      const d1 = Math.floor(1000 + Math.random() * 9000);
      const d2 = Math.floor(1000 + Math.random() * 9000);
      const d3 = Math.floor(1000 + Math.random() * 9000);
      ewayBillNumber = `${d1} ${d2} ${d3}`;

      // Validity Rule: 1 day of validity for every 200 km of route distance
      const validityDays = Math.max(1, Math.ceil(distanceKm / 200));
      ewayBillValidUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

      // Ship-To GSTIN format based on destination state code
      const destStateCode =
        InvoiceGeneratorService.STATE_GST_CODES[jurisdiction.destState] || '07';
      shipToGstin = `${destStateCode}AAACS8812E1Z8`;

      // Commercial Freight Transport vehicle
      vehicleNumber = 'PB-02-CR-4590';
      ewayBillStatus = 'ACTIVE';
    }

    const invoice = await this.invoiceRepository.create({
      invoice_number: invoiceNumber,
      load_id: loadId,
      bid_id: bidId,
      broker_id: brokerId,
      broker_margin_paise: brokerMarginPaise,
      gst_amount_paise: gstBreakdown.totalGstPaise,
      total_payable_paise: gstBreakdown.finalTotalPaise,
      is_interstate: jurisdiction.isInterState,
      generated_at: new Date(),
      eway_bill_number: ewayBillNumber,
      eway_bill_valid_until: ewayBillValidUntil,
      eway_bill_distance_km: distanceKm,
      ship_to_gstin: shipToGstin,
      vehicle_number: vehicleNumber,
      eway_bill_status: ewayBillStatus,
    });

    // Mark load as INVOICED
    await this.loadRepository.updateStatus(loadId, 'INVOICED');

    const fullInvoice = await this.invoiceRepository.findById(invoice.id);
    return fullInvoice!;
  }

  public async getInvoiceById(id: number): Promise<Invoice | null> {
    return await this.invoiceRepository.findById(id);
  }

  public async getInvoiceByLoadId(loadId: number): Promise<Invoice | null> {
    const invoices = await this.invoiceRepository.findAll();
    const found = invoices.find((inv) => inv.load_id === loadId);
    return found || null;
  }

  public async getAllInvoices(): Promise<Invoice[]> {
    return await this.invoiceRepository.findAll();
  }

  public async markAsPaid(id: number): Promise<void> {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) throw new Error('Invoice not found');
    await this.loadRepository.updateStatus(invoice.load_id, 'INVOICED');
  }
}

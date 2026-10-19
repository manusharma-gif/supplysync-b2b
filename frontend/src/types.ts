export type UserRole = 'SHIPPER' | 'CARRIER' | 'BROKER';
export type DemoPersona = 'SHIPPER' | 'CARRIER_A' | 'CARRIER_B' | 'BROKER' | 'CARRIER';
export type LoadStatus = 'OPEN' | 'BIDDING' | 'ASSIGNED' | 'INVOICED' | 'IN_TRANSIT' | 'DELIVERED';
export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  company_name?: string;
  companyName?: string;
  reliability_score?: number;
  onTimeRating?: number;
  gstin?: string;
  state?: string;
}

export interface Load {
  id: number;
  shipper_id?: number;
  shipperId?: number;
  origin_city?: string;
  originCity?: string;
  destination_city?: string;
  destCity?: string;
  origin_state?: string;
  originState?: string;
  destination_state?: string;
  destState?: string;
  weight_tons?: number;
  weightMetricTons?: number;
  vehicle_type?: string;
  vehicleType?: string;
  shipper_budget_paise?: number;
  targetRatePaise?: number;
  status: LoadStatus;
  description?: string;
  created_at?: string;
  createdAt?: string;
  shipper?: {
    id: number;
    name: string;
    company_name?: string;
    companyName?: string;
    state?: string;
  };
  bids?: Bid[];
}

export interface Bid {
  id: number;
  load_id?: number;
  loadId?: number;
  carrier_id?: number;
  carrierId?: number;
  bid_amount_paise?: number;
  amountPaise?: number;
  estimated_transit_hours?: number;
  transitTimeHours?: number;
  status: BidStatus;
  notes?: string;
  created_at?: string;
  createdAt?: string;
  carrier?: {
    id: number;
    name: string;
    company_name?: string;
    companyName?: string;
    reliability_score?: number;
    onTimeRating?: number;
  };
  load?: Load;
}

export interface ScoredBid {
  bid: Bid;
  costScore: number;
  reliabilityScore: number;
  compositeScore: number;
  brokerMarginPaise: number;
  totalWithMarginPaise: number;
  isRecommended: boolean;
}

export interface Invoice {
  id: number;
  invoice_number?: string;
  invoiceNumber?: string;
  load_id?: number;
  loadId?: number;
  bid_id?: number;
  bidId?: number;
  broker_id?: number;
  brokerId?: number;
  baseFreightPaise?: number;
  broker_margin_paise?: number;
  brokerMarginPaise?: number;
  brokerMarginPercent?: number;
  gst_amount_paise?: number;
  total_payable_paise?: number;
  subtotalPaise?: number;
  totalAmountPaise?: number;
  is_interstate?: boolean;
  isInterState?: boolean;
  gstRatePercent?: number;
  cgstPaise?: number;
  sgstPaise?: number;
  igstPaise?: number;
  status?: string;
  generated_at?: string;
  createdAt?: string;
  // Module Expansion: E-Way Bill Part-A / Part-B
  eway_bill_number?: string;
  ewayBillNumber?: string;
  eway_bill_valid_until?: string;
  ewayBillValidUntil?: string;
  eway_bill_distance_km?: number;
  ewayBillDistanceKm?: number;
  ship_to_gstin?: string;
  shipToGstin?: string;
  vehicle_number?: string;
  vehicleNumber?: string;
  eway_bill_status?: string;
  ewayBillStatus?: string;
  load?: Load;
  bid?: Bid;
  broker?: {
    id: number;
    name: string;
    company_name?: string;
    companyName?: string;
    gstin?: string;
  };
}

export interface VahanFitnessDetails {
  isValid: boolean;
  ownerName: string;
  makerModel: string;
  vehicleClass: string;
  fuelType: string;
  emissionNorms: string;
  commercialRcNumber: string;
  registeredRTO: string;
  fitnessValidUntil: string;
  insuranceValidUntil: string;
  insurancePolicyNumber: string;
  pucValidUntil: string;
  nationalPermitValidUntil: string;
  permitType: string;
  grossVehicleWeightKg: number;
  unladenWeightKg: number;
}

export interface FastagTollCheckpoint {
  plazaName: string;
  highwayNumber: string;
  laneId: string;
  timestamp: string;
  timeAgo: string;
  tollFeePaise: number;
  status: 'CLEARED' | 'FLAGGED' | 'IN_TRANSIT';
}

export interface FastagDetails {
  tagId: string;
  bankName: string;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'LOW_BALANCE';
  lowBalanceAlert: boolean;
  walletBalancePaise: number;
  lastTollPlaza: string;
  lastSeenTime: string;
}

export interface UlipVerificationResponse {
  vehicleNumber: string;
  stateCode: string;
  stateName: string;
  isCompliant: boolean;
  vahan: VahanFitnessDetails;
  fastag: FastagDetails;
  tollCheckpoints: FastagTollCheckpoint[];
  verifiedAt: string;
  error?: string;
}

export interface ParsedDispatchPayload {
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  weightMetricTons: number;
  vehicleType: string;
  targetRateRupees: number;
  targetRatePaise: number;
  rawText: string;
  confidenceScore: number;
  matchedCorridor?: string;
  extractedItems: {
    originFound: boolean;
    destFound: boolean;
    weightFound: boolean;
    vehicleFound: boolean;
    rateFound: boolean;
  };
}

export interface Corridor {
  id: number;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  distanceKm: number;
  avgRatePerTonPaise: number;
}

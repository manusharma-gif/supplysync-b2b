import { BidRepository } from '../repositories/BidRepository.js';
import { LoadRepository } from '../repositories/LoadRepository.js';
import { MarginCalculatorService, BrokerMarginResult } from './MarginCalculatorService.js';
import { InvoiceService } from './InvoiceService.js';
import { Bid, BidCreationAttributes, Invoice } from '../models/index.js';

export interface ScoredBid {
  bid: Bid;
  costScore: number;
  reliabilityScore: number;
  compositeScore: number;
  // Financial Margin Analytics (Zero Floating Point - Paise Integers)
  brokerMarginPaise: number;
  netMarginPaise: number;
  marginPercentage: number;
  isProfitable: boolean;
  totalWithMarginPaise: number;
  isRecommended: boolean;
  isRankOne: boolean;
  recommendationLabel?: string;
}

export class BiddingService {
  private bidRepository: BidRepository;
  private loadRepository: LoadRepository;
  private marginCalculator: MarginCalculatorService;
  private invoiceService: InvoiceService;

  constructor() {
    this.bidRepository = new BidRepository();
    this.loadRepository = new LoadRepository();
    this.marginCalculator = new MarginCalculatorService();
    this.invoiceService = new InvoiceService();
  }

  public async placeBid(data: BidCreationAttributes): Promise<Bid> {
    const load = await this.loadRepository.findById(data.load_id);
    if (!load) {
      throw new Error('Load not found');
    }
    if (load.status !== 'OPEN' && load.status !== 'BIDDING') {
      throw new Error(`Cannot bid on load with status ${load.status}`);
    }

    const bid = await this.bidRepository.create(data);

    // If load was OPEN, advance to BIDDING
    if (load.status === 'OPEN') {
      await this.loadRepository.updateStatus(load.id, 'BIDDING');
    }

    return bid;
  }

  /**
   * Quote & Bidding Engine: Smart Carrier Recommendation Algorithm
   * Composite Score: 70% Weight on Lowest Bid Price (Cost) + 30% Weight on Carrier Reliability Rating.
   * Net Margin: (shipper_budget_paise - carrier_bid_paise) in exact integer Paise without floating-point errors.
   */
  public async getScoredBidsForLoad(
    load_id: number,
    brokerMarginPercent: number = 8
  ): Promise<ScoredBid[]> {
    const bids = await this.bidRepository.findByLoadId(load_id);
    const load = await this.loadRepository.findById(load_id);

    if (bids.length === 0) {
      return [];
    }

    const shipperBudgetPaise = load?.shipper_budget_paise || 0;

    // Find the minimum bid amount across all carriers on this load
    const minBidPaise = Math.min(...bids.map((b) => b.bid_amount_paise));

    const scoredBids: ScoredBid[] = bids.map((bid) => {
      // 1. Cost Score (0 - 100): Lower bid = higher cost score
      const costScore = this.marginCalculator.calculateCostScore(
        bid.bid_amount_paise,
        minBidPaise
      );

      // 2. Reliability Score (0 - 100) from carrier model
      const carrier = (bid as any).carrier;
      const reliabilityScore = carrier?.reliability_score ?? 85;

      // 3. Composite Weighted Score: 70% Cost + 30% Reliability
      const compositeScore = this.marginCalculator.calculateCompositeScore(
        costScore,
        reliabilityScore
      );

      // 4. Exact Net Profit Margin Analytics (Integer Paise Math)
      const marginResult: BrokerMarginResult = this.marginCalculator.calculateBrokerMargin(
        shipperBudgetPaise,
        bid.bid_amount_paise
      );

      const netMarginPaise = marginResult.netMarginPaise;
      const marginPercentage = marginResult.marginPercentage;
      const isProfitable = marginResult.isProfitable;

      // Backward compatible fee calculation
      const standardMarginPaise = Math.round((bid.bid_amount_paise * brokerMarginPercent) / 100);

      return {
        bid,
        costScore,
        reliabilityScore,
        compositeScore,
        brokerMarginPaise: netMarginPaise > 0 ? netMarginPaise : standardMarginPaise,
        netMarginPaise,
        marginPercentage,
        isProfitable,
        totalWithMarginPaise: shipperBudgetPaise > 0 ? shipperBudgetPaise : bid.bid_amount_paise + standardMarginPaise,
        isRecommended: false,
        isRankOne: false,
      };
    });

    // Rank descending by composite score
    scoredBids.sort((a, b) => b.compositeScore - a.compositeScore);

    // Tag the #1 ranked carrier with the Best Value Carrier recommendation badge
    if (scoredBids.length > 0) {
      scoredBids[0].isRecommended = true;
      scoredBids[0].isRankOne = true;
      scoredBids[0].recommendationLabel = 'Best Value Carrier';
    }

    return scoredBids;
  }

  /**
   * Broker Accepts/Approves Carrier Bid:
   * 1. Marks selected bid as ACCEPTED
   * 2. Marks load as ASSIGNED
   * 3. Rejects competing bids (REJECTED)
   * 4. Auto-generates GST dispatch invoice
   */
  public async acceptBid(
    bidId: number,
    brokerId: number,
    marginPercent: number = 8
  ): Promise<{ bid: Bid; invoice: Invoice }> {
    const bid = await this.bidRepository.findById(bidId);
    if (!bid) {
      throw new Error('Bid not found');
    }

    // Update statuses
    await this.bidRepository.updateStatus(bidId, 'ACCEPTED');
    await this.loadRepository.updateStatus(bid.load_id, 'ASSIGNED');
    await this.bidRepository.rejectOtherBidsForLoad(bid.load_id, bidId);

    // Generate GST invoice
    const invoice = await this.invoiceService.generateInvoice({
      loadId: bid.load_id,
      bidId: bid.id,
      brokerId,
      brokerMarginPercent: marginPercent,
    });

    const updatedBid = await this.bidRepository.findById(bidId);

    return {
      bid: updatedBid!,
      invoice,
    };
  }

  /**
   * Alias for approveBid
   */
  public async approveBid(
    bidId: number,
    brokerId: number = 1,
    marginPercent: number = 8
  ): Promise<{ bid: Bid; invoice: Invoice }> {
    return this.acceptBid(bidId, brokerId, marginPercent);
  }
}

import { Request, Response } from 'express';
import { BiddingService } from '../services/BiddingService.js';
import { BidRepository } from '../repositories/BidRepository.js';
import { CurrencyUtil } from '../utils/currency.js';

export class BidController {
  private biddingService: BiddingService;
  private bidRepository: BidRepository;

  constructor() {
    this.biddingService = new BiddingService();
    this.bidRepository = new BidRepository();
  }

  public placeBid = async (req: Request, res: Response): Promise<void> => {
    try {
      const carrier_id = req.user!.id;
      const {
        load_id,
        loadId,
        amountRupees,
        amountPaise,
        bid_amount_paise,
        estimated_transit_hours,
        transitTimeHours,
        notes,
      } = req.body;

      const finalAmountPaise = bid_amount_paise
        ? parseInt(bid_amount_paise, 10)
        : amountPaise
        ? parseInt(amountPaise, 10)
        : CurrencyUtil.rupeesToPaise(amountRupees);

      const bid = await this.biddingService.placeBid({
        load_id: parseInt(load_id || loadId, 10),
        carrier_id,
        bid_amount_paise: finalAmountPaise,
        estimated_transit_hours: parseInt(estimated_transit_hours || transitTimeHours || '24', 10),
        status: 'PENDING',
        notes,
      });

      res.status(201).json(bid);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  public getRankedBids = async (req: Request, res: Response): Promise<void> => {
    try {
      const loadId = parseInt(String(req.params.loadId), 10);
      const marginPercent = req.query.margin ? parseInt(req.query.margin as string, 10) : 8;

      const scored = await this.biddingService.getScoredBidsForLoad(loadId, marginPercent);
      res.json(scored);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public getScoredBids = async (req: Request, res: Response): Promise<void> => {
    return this.getRankedBids(req, res);
  };

  public acceptBid = async (req: Request, res: Response): Promise<void> => {
    try {
      const bidId = parseInt(String(req.params.bidId), 10);
      const brokerId = req.user!.id;
      const marginPercent = req.body.marginPercent ? parseInt(req.body.marginPercent, 10) : 8;

      const result = await this.biddingService.acceptBid(bidId, brokerId, marginPercent);

      res.json({
        message: 'Bid accepted and GST invoice generated',
        bid: result.bid,
        invoice: result.invoice,
      });
    } catch (err: any) {
      console.error('[BidController.acceptBid Error]:', err);
      res.status(400).json({ error: err.message });
    }
  };

  public approveBid = async (req: Request, res: Response): Promise<void> => {
    return this.acceptBid(req, res);
  };

  public getMyBids = async (req: Request, res: Response): Promise<void> => {
    try {
      const carrierId = req.user!.id;
      const bids = await this.bidRepository.findByCarrierId(carrierId);
      res.json(bids);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}

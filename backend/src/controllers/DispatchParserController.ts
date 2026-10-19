import { Request, Response } from 'express';
import { DispatchParserService } from '../services/DispatchParserService.js';
import { LoadRepository } from '../repositories/LoadRepository.js';

export class DispatchParserController {
  private parserService: DispatchParserService;
  private loadRepository: LoadRepository;

  constructor() {
    this.parserService = new DispatchParserService();
    this.loadRepository = new LoadRepository();
  }

  public parseInquiry = async (req: Request, res: Response): Promise<void> => {
    try {
      const text = req.body.text || req.body.inquiry || req.body.rawText;
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Text inquiry is required' });
        return;
      }

      const parsed = await this.parserService.parseInquiry(text);
      res.json(parsed);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public createLoadFromParsed = async (req: Request, res: Response): Promise<void> => {
    try {
      const shipper_id = req.user!.id;
      const {
        origin_city,
        originCity,
        origin_state,
        originState,
        destination_city,
        destCity,
        destination_state,
        destState,
        weight_tons,
        weightMetricTons,
        vehicle_type,
        vehicleType,
        shipper_budget_paise,
        targetRatePaise,
        rawText,
      } = req.body;

      const origin = origin_city || originCity || 'Jalandhar';
      const dest = destination_city || destCity || 'Gurugram';
      const origState = origin_state || originState || 'Punjab';
      const destinationState = destination_state || destState || 'Haryana';
      const weight = parseFloat(weight_tons || weightMetricTons || '16');
      const vehicle = vehicle_type || vehicleType || '32ft Multi-Axle';
      const budget = parseInt(shipper_budget_paise || targetRatePaise || '3000000', 10);

      const load = await this.loadRepository.create({
        shipper_id,
        origin_city: origin,
        origin_state: origState,
        destination_city: dest,
        destination_state: destinationState,
        weight_tons: weight,
        vehicle_type: vehicle,
        shipper_budget_paise: budget,
        status: 'OPEN',
        description: `Created via AI Dispatch Parser from inquiry: "${(rawText || '').slice(0, 80)}..."`,
      });

      res.status(201).json(load);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };
}

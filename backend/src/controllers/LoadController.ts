import { Request, Response } from 'express';
import { LoadRepository } from '../repositories/LoadRepository.js';
import { CurrencyUtil } from '../utils/currency.js';
import { LoadStatus } from '../models/index.js';

export class LoadController {
  private loadRepository: LoadRepository;

  constructor() {
    this.loadRepository = new LoadRepository();
  }

  public createLoad = async (req: Request, res: Response): Promise<void> => {
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
        targetRateRupees,
        targetRatePaise,
        description,
      } = req.body;

      // Ensure monetary values are stored in Paise (Zero Floating Point)
      const finalPaise = shipper_budget_paise
        ? parseInt(shipper_budget_paise, 10)
        : targetRatePaise
        ? parseInt(targetRatePaise, 10)
        : CurrencyUtil.rupeesToPaise(targetRateRupees);

      const load = await this.loadRepository.create({
        shipper_id,
        origin_city: origin_city || originCity,
        origin_state: origin_state || originState || 'Punjab',
        destination_city: destination_city || destCity,
        destination_state: destination_state || destState || 'Delhi',
        weight_tons: parseFloat(weight_tons || weightMetricTons),
        vehicle_type: vehicle_type || vehicleType,
        shipper_budget_paise: finalPaise,
        status: 'OPEN',
        description,
      });

      res.status(201).json(load);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  public getLoads = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, onlyMine } = req.query;
      const filter: { shipper_id?: number; status?: LoadStatus } = {};

      if (status) {
        filter.status = status as LoadStatus;
      }

      if (onlyMine === 'true' && req.user?.role === 'SHIPPER') {
        filter.shipper_id = req.user.id;
      }

      const loads = await this.loadRepository.findAll(filter);
      res.json(loads);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public getLoadById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const load = await this.loadRepository.findById(id);
      if (!load) {
        res.status(404).json({ error: 'Load not found' });
        return;
      }
      res.json(load);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}

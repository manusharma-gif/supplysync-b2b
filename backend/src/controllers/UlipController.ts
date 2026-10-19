import { Request, Response } from 'express';
import { UlipSimulatorService } from '../services/UlipSimulatorService.js';

export class UlipController {
  private ulipSimulatorService: UlipSimulatorService;

  constructor() {
    this.ulipSimulatorService = new UlipSimulatorService();
  }

  /**
   * GET /api/ulip/verify-vehicle/:vehicleNumber
   * Simulates India's ULIP (Unified Logistics Interface Platform) API:
   * 1. Validates standard Indian commercial vehicle registration format
   * 2. Returns authenticated VAHAN RC data (Fitness, Insurance, PUC, National Permit)
   * 3. Returns sequence of 3 sequential FASTag toll plaza checkpoints tailored to load corridor
   */
  public verifyVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
      const vehicleNumber = String(req.params.vehicleNumber || '');
      const originCity = typeof req.query.originCity === 'string' ? req.query.originCity : undefined;
      const destCity = typeof req.query.destCity === 'string' ? req.query.destCity : undefined;

      if (!vehicleNumber) {
        res.status(400).json({
          isValid: false,
          error: 'Vehicle registration number is required',
        });
        return;
      }

      const verification = this.ulipSimulatorService.verifyVehicle(vehicleNumber, {
        originCity,
        destCity,
      });

      res.json(verification);
    } catch (err: any) {
      res.status(400).json({
        isValid: false,
        error: err.message || 'Invalid Indian vehicle registration number format',
      });
    }
  };
}

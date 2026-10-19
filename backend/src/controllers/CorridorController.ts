import { Request, Response } from 'express';
import { CurrencyUtil } from '../utils/currency.js';

export class CorridorController {
  private static CORRIDORS = [
    {
      id: 1,
      originCity: 'Pathankot',
      originState: 'Punjab',
      destCity: 'Chandigarh',
      destState: 'Punjab',
      distanceKm: 240,
      avgRatePerTonPaise: CurrencyUtil.rupeesToPaise(1450),
    },
    {
      id: 2,
      originCity: 'Ludhiana',
      originState: 'Punjab',
      destCity: 'Delhi',
      destState: 'Delhi',
      distanceKm: 310,
      avgRatePerTonPaise: CurrencyUtil.rupeesToPaise(1800),
    },
    {
      id: 3,
      originCity: 'Amritsar',
      originState: 'Punjab',
      destCity: 'Jaipur',
      destState: 'Rajasthan',
      distanceKm: 590,
      avgRatePerTonPaise: CurrencyUtil.rupeesToPaise(2200),
    },
    {
      id: 4,
      originCity: 'Mumbai',
      originState: 'Maharashtra',
      destCity: 'Pune',
      destState: 'Maharashtra',
      distanceKm: 150,
      avgRatePerTonPaise: CurrencyUtil.rupeesToPaise(1200),
    },
  ];

  public getCorridors = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json(CorridorController.CORRIDORS);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}

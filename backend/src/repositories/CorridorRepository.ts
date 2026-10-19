export interface Corridor {
  id: number;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  distanceKm: number;
  avgRatePerTonPaise: number;
}

export type CorridorCreationAttributes = Omit<Corridor, 'id'>;

export class CorridorRepository {
  private static corridors: Corridor[] = [
    {
      id: 1,
      originCity: 'Pathankot',
      originState: 'Punjab',
      destCity: 'Chandigarh',
      destState: 'Punjab',
      distanceKm: 240,
      avgRatePerTonPaise: 145000,
    },
    {
      id: 2,
      originCity: 'Ludhiana',
      originState: 'Punjab',
      destCity: 'Delhi',
      destState: 'Delhi',
      distanceKm: 310,
      avgRatePerTonPaise: 180000,
    },
    {
      id: 3,
      originCity: 'Amritsar',
      originState: 'Punjab',
      destCity: 'Jaipur',
      destState: 'Rajasthan',
      distanceKm: 590,
      avgRatePerTonPaise: 220000,
    },
    {
      id: 4,
      originCity: 'Mumbai',
      originState: 'Maharashtra',
      destCity: 'Pune',
      destState: 'Maharashtra',
      distanceKm: 150,
      avgRatePerTonPaise: 120000,
    },
  ];

  public async findAll(): Promise<Corridor[]> {
    return CorridorRepository.corridors;
  }

  public async findByCities(originCity: string, destCity: string): Promise<Corridor | null> {
    const o = originCity.toLowerCase();
    const d = destCity.toLowerCase();
    const found = CorridorRepository.corridors.find(
      (c) =>
        c.originCity.toLowerCase().includes(o) &&
        c.destCity.toLowerCase().includes(d)
    );
    return found || null;
  }

  public async create(data: CorridorCreationAttributes): Promise<Corridor> {
    const newCorridor: Corridor = {
      id: CorridorRepository.corridors.length + 1,
      ...data,
    };
    CorridorRepository.corridors.push(newCorridor);
    return newCorridor;
  }
}

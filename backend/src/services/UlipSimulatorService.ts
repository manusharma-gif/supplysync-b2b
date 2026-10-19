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
}

export class UlipSimulatorService {
  private static STATE_CODES: Record<string, string> = {
    PB: 'Punjab',
    HP: 'Himachal Pradesh',
    DL: 'Delhi',
    HR: 'Haryana',
    RJ: 'Rajasthan',
    MH: 'Maharashtra',
    GJ: 'Gujarat',
    KA: 'Karnataka',
    TN: 'Tamil Nadu',
    UP: 'Uttar Pradesh',
    UK: 'Uttarakhand',
    WB: 'West Bengal',
    TS: 'Telangana',
    AP: 'Andhra Pradesh',
  };

  /**
   * Validates standard Indian Vehicle Registration Number format:
   * e.g. PB-02-CR-4590, HP-38-E-9911, DL-01-AB-1234, HR-55-A-1122
   */
  public validateRegistrationNumber(rawNumber: string): {
    isValid: boolean;
    normalized: string;
    stateCode: string;
    error?: string;
  } {
    if (!rawNumber || typeof rawNumber !== 'string') {
      return {
        isValid: false,
        normalized: '',
        stateCode: '',
        error: 'Vehicle registration number is required',
      };
    }

    const clean = rawNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Match 2 letters, 1-2 digits, 1-3 letters, 4 digits
    const regex = /^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{4})$/;
    const match = clean.match(regex);

    if (!match) {
      return {
        isValid: false,
        normalized: rawNumber.trim().toUpperCase(),
        stateCode: '',
        error: 'Invalid Indian vehicle registration format. Expected format: PB-02-CR-4590 or HP-38-E-9911',
      };
    }

    const stateCode = match[1];
    const rtoCode = match[2].padStart(2, '0');
    const series = match[3];
    const digits = match[4];

    const normalized = `${stateCode}-${rtoCode}-${series}-${digits}`;

    return {
      isValid: true,
      normalized,
      stateCode,
    };
  }

  /**
   * Simulates India's Unified Logistics Interface Platform (ULIP) API:
   * Returns authenticated VAHAN RC fitness and 3 sequential FASTag highway checkpoints.
   */
  public verifyVehicle(
    vehicleNumber: string,
    corridor?: { originCity?: string; destCity?: string }
  ): UlipVerificationResponse {
    const validation = this.validateRegistrationNumber(vehicleNumber);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid Indian vehicle registration number format');
    }

    const stateCode = validation.stateCode;
    const stateName = UlipSimulatorService.STATE_CODES[stateCode] || 'National Territory';
    const normalized = validation.normalized;

    // 1. Mock VAHAN RC Data
    const vahan: VahanFitnessDetails = {
      isValid: true,
      ownerName: stateCode === 'PB' ? 'SpeedTrans Logistics Fleet Assets' : 'Northern Express Hauliers Pvt Ltd',
      makerModel: 'Tata Motors Signa 4825.TK (48T Multi-Axle)',
      vehicleClass: 'Heavy Goods Vehicle (HGV) / Commercial Freight',
      fuelType: 'DIESEL',
      emissionNorms: 'BS-VI OBD-II Compliant',
      commercialRcNumber: `RC-${stateCode}-2024-${normalized.slice(-4)}`,
      registeredRTO: `${stateCode}-${normalized.split('-')[1]} Regional Transport Office`,
      fitnessValidUntil: '2028-11-20',
      insuranceValidUntil: '2027-05-14',
      insurancePolicyNumber: `NI-${stateCode}-88492019`,
      pucValidUntil: '2027-03-10',
      nationalPermitValidUntil: '2029-08-31',
      permitType: 'National Permit (Goods) - All India Authorization',
      grossVehicleWeightKg: 48000,
      unladenWeightKg: 12500,
    };

    // 2. Mock FASTag Toll Checkpoints along Corridor
    const checkpoints = this.generateCorridorCheckpoints(corridor?.originCity, corridor?.destCity);

    // 3. FASTag Wallet Details
    const fastag: FastagDetails = {
      tagId: `34161FA8${stateCode}90${normalized.slice(-4)}A0`,
      bankName: 'ICICI Bank FASTag / NETC National Clearinghouse',
      accountStatus: 'ACTIVE',
      lowBalanceAlert: false,
      walletBalancePaise: 485000, // ₹4,850.00
      lastTollPlaza: checkpoints[checkpoints.length - 1].plazaName,
      lastSeenTime: checkpoints[checkpoints.length - 1].timestamp,
    };

    return {
      vehicleNumber: normalized,
      stateCode,
      stateName,
      isCompliant: true,
      vahan,
      fastag,
      tollCheckpoints: checkpoints,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates a sequence of 3 realistic FASTag toll-plaza timestamps
   * tailored to the specific origin-to-destination corridor.
   */
  private generateCorridorCheckpoints(
    originCity?: string,
    destCity?: string
  ): FastagTollCheckpoint[] {
    const o = (originCity || '').toLowerCase().trim();
    const d = (destCity || '').toLowerCase().trim();

    const now = Date.now();
    const isoHoursAgo = (hours: number) => new Date(now - hours * 3600 * 1000).toISOString();

    // Corridor 1: Ludhiana -> Delhi
    if ((o.includes('ludhiana') || o.includes('punjab')) && (d.includes('delhi') || d.includes('gurgaon') || d.includes('gurugram'))) {
      return [
        {
          plazaName: 'Shambhu Toll Plaza (NH-44, KM 212, Punjab-Haryana Border)',
          highwayNumber: 'NH-44',
          laneId: 'Lane 04 - FASTag ETC Dedicated',
          timestamp: isoHoursAgo(3.5),
          timeAgo: '3.5 hours ago',
          tollFeePaise: 42000, // ₹420.00
          status: 'CLEARED',
        },
        {
          plazaName: 'Karnal Toll Plaza (NH-44, KM 128, Haryana Core)',
          highwayNumber: 'NH-44',
          laneId: 'Lane 02 - FASTag Multi-Axle ETC',
          timestamp: isoHoursAgo(1.8),
          timeAgo: '1.8 hours ago',
          tollFeePaise: 38000, // ₹380.00
          status: 'CLEARED',
        },
        {
          plazaName: 'Murthal / Kundli Toll Plaza (NH-44, KM 51, Delhi NCR Border)',
          highwayNumber: 'NH-44',
          laneId: 'Lane 06 - FASTag High-Speed Gate',
          timestamp: isoHoursAgo(0.4),
          timeAgo: '25 mins ago',
          tollFeePaise: 34000, // ₹340.00
          status: 'CLEARED',
        },
      ];
    }

    // Corridor 2: Pathankot -> Chandigarh
    if (o.includes('pathankot') || d.includes('chandigarh')) {
      return [
        {
          plazaName: 'Cholang Toll Plaza (NH-44, Hoshiarpur Corridor)',
          highwayNumber: 'NH-44',
          laneId: 'Lane 02 - FASTag Commercial Trucking',
          timestamp: isoHoursAgo(2.6),
          timeAgo: '2.6 hours ago',
          tollFeePaise: 29000,
          status: 'CLEARED',
        },
        {
          plazaName: 'Behram Toll Plaza (NH-344A, Nawanshahr Bypass)',
          highwayNumber: 'NH-344A',
          laneId: 'Lane 03 - FASTag Dedicated',
          timestamp: isoHoursAgo(1.2),
          timeAgo: '1.2 hours ago',
          tollFeePaise: 26000,
          status: 'CLEARED',
        },
        {
          plazaName: 'Gharuan Toll Plaza (NH-205A, Mohali-Chandigarh Entry)',
          highwayNumber: 'NH-205A',
          laneId: 'Lane 05 - FASTag High-Speed Gate',
          timestamp: isoHoursAgo(0.3),
          timeAgo: '20 mins ago',
          tollFeePaise: 22000,
          status: 'CLEARED',
        },
      ];
    }

    // Corridor 3: Jalandhar -> Gurugram
    if (o.includes('jalandhar') || d.includes('gurugram')) {
      return [
        {
          plazaName: 'Ladowal Toll Plaza (NH-44, Sutlej River Crossing, Ludhiana)',
          highwayNumber: 'NH-44',
          laneId: 'Lane 04 - FASTag Dedicated ETC',
          timestamp: isoHoursAgo(4.1),
          timeAgo: '4 hours ago',
          tollFeePaise: 39000,
          status: 'CLEARED',
        },
        {
          plazaName: 'Panipat Elevated Tollway (NH-44, KM 96, Haryana)',
          highwayNumber: 'NH-44',
          laneId: 'Lane 03 - Multi-Axle FASTag',
          timestamp: isoHoursAgo(2.0),
          timeAgo: '2 hours ago',
          tollFeePaise: 45000,
          status: 'CLEARED',
        },
        {
          plazaName: 'Kherki Daula Toll Plaza (NH-48, KM 42, Gurugram Gateway)',
          highwayNumber: 'NH-48',
          laneId: 'Lane 07 - FASTag Express ETC',
          timestamp: isoHoursAgo(0.5),
          timeAgo: '30 mins ago',
          tollFeePaise: 41000,
          status: 'CLEARED',
        },
      ];
    }

    // Corridor 4: Mumbai -> Pune
    if (o.includes('mumbai') || d.includes('pune')) {
      return [
        {
          plazaName: 'Khalapur Toll Plaza (Mumbai-Pune Expressway, KM 32)',
          highwayNumber: 'YCEW',
          laneId: 'Lane 05 - FASTag Expressway ETC',
          timestamp: isoHoursAgo(2.2),
          timeAgo: '2.2 hours ago',
          tollFeePaise: 48000,
          status: 'CLEARED',
        },
        {
          plazaName: 'Kusgaon Toll Plaza (Lonavala Ghat Section, KM 58)',
          highwayNumber: 'YCEW',
          laneId: 'Lane 03 - FASTag Dedicated',
          timestamp: isoHoursAgo(1.1),
          timeAgo: '1.1 hours ago',
          tollFeePaise: 32000,
          status: 'CLEARED',
        },
        {
          plazaName: 'Talegaon Toll Plaza (Pune Metropolitan Entry, KM 85)',
          highwayNumber: 'YCEW',
          laneId: 'Lane 08 - FASTag High-Speed Gate',
          timestamp: isoHoursAgo(0.3),
          timeAgo: '18 mins ago',
          tollFeePaise: 29000,
          status: 'CLEARED',
        },
      ];
    }

    // Default National Highway Corridors
    return [
      {
        plazaName: 'Origin State Border Toll Plaza (NH-44, North Hub)',
        highwayNumber: 'NH-44',
        laneId: 'Lane 03 - FASTag ETC Dedicated',
        timestamp: isoHoursAgo(3.0),
        timeAgo: '3 hours ago',
        tollFeePaise: 35000,
        status: 'CLEARED',
      },
      {
        plazaName: 'Interstate Junction Toll Plaza (NH-48, Transit Corridor)',
        highwayNumber: 'NH-48',
        laneId: 'Lane 02 - FASTag Commercial Multi-Axle',
        timestamp: isoHoursAgo(1.5),
        timeAgo: '1.5 hours ago',
        tollFeePaise: 42000,
        status: 'CLEARED',
      },
      {
        plazaName: 'Destination Ring Road Expressway Tollway (KM 14)',
        highwayNumber: 'NE-01',
        laneId: 'Lane 06 - High-Speed FASTag Gate',
        timestamp: isoHoursAgo(0.4),
        timeAgo: '25 mins ago',
        tollFeePaise: 31000,
        status: 'CLEARED',
      },
    ];
  }
}

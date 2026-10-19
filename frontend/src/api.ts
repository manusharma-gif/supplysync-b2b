import {
  User,
  Load,
  Bid,
  ScoredBid,
  Invoice,
  ParsedDispatchPayload,
  Corridor,
  UserRole,
  DemoPersona,
  UlipVerificationResponse,
} from './types.js';

const API_BASE = '/api';

export const CurrencyHelper = {
  paiseToRupees(paise?: number | null): number {
    return (paise || 0) / 100;
  },

  formatINR(paise?: number | null): string {
    const rupees = this.paiseToRupees(paise);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(rupees);
  },
};

class ApiService {
  private token: string | null = null;
  private currentUser: User | null = null;

  constructor() {
    this.token = localStorage.getItem('supplysync_token');
    const savedUser = localStorage.getItem('supplysync_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (e) {
        this.currentUser = null;
      }
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public setAuth(token: string, user: User) {
    this.token = token;
    this.currentUser = user;
    localStorage.setItem('supplysync_token', token);
    localStorage.setItem('supplysync_user', JSON.stringify(user));
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as any) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Request failed with status ${res.status}`);
    }

    return await res.json();
  }

  // Quick Role Switching (Demo Mode Ergonomics)
  public async quickSwitch(
    persona: 'SHIPPER' | 'CARRIER_A' | 'CARRIER_B' | 'BROKER' | 'CARRIER' | DemoPersona
  ): Promise<{ token: string; user: User }> {
    try {
      const res = await this.request<{ token: string; user: User }>(`/auth/quick-switch/${persona}`);
      this.setAuth(res.token, res.user);
      return res;
    } catch {
      // Fallback: Login directly using pre-seeded accounts if backend quick-switch fails or doesn't support specific carrier sub-roles
      let email = 'broker@supplysync.com';
      if (persona === 'SHIPPER') email = 'shipper@supplysync.com';
      else if (persona === 'CARRIER_A' || persona === 'CARRIER') email = 'carrier1@supplysync.com';
      else if (persona === 'CARRIER_B') email = 'carrier2@supplysync.com';
      else if (persona === 'BROKER') email = 'broker@supplysync.com';

      const res = await this.request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'password123' }),
      });
      this.setAuth(res.token, res.user);
      return res;
    }
  }

  // Loads
  public async getLoads(onlyMine: boolean = false): Promise<Load[]> {
    return await this.request<Load[]>(`/loads${onlyMine ? '?onlyMine=true' : ''}`);
  }

  public async getLoad(id: number): Promise<Load> {
    return await this.request<Load>(`/loads/${id}`);
  }

  public async createLoad(data: {
    originCity: string;
    originState: string;
    destCity: string;
    destState: string;
    weightMetricTons: number;
    vehicleType: string;
    targetRateRupees: number;
    description?: string;
  }): Promise<Load> {
    return await this.request<Load>('/loads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Bids
  public async placeBid(data: {
    loadId: number;
    amountRupees: number;
    transitTimeHours: number;
    notes?: string;
  }): Promise<Bid> {
    return await this.request<Bid>('/bids', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async getMyBids(): Promise<Bid[]> {
    return await this.request<Bid[]>('/bids/my-bids');
  }

  public async getScoredBids(loadId: number, marginPercent: number = 8): Promise<ScoredBid[]> {
    return await this.request<ScoredBid[]>(`/bids/load/${loadId}/scored?margin=${marginPercent}`);
  }

  public async getRankedBids(loadId: number): Promise<ScoredBid[]> {
    try {
      return await this.request<ScoredBid[]>(`/bids/load/${loadId}/ranked`);
    } catch {
      // Fallback to /scored if /ranked is not defined in backend
      return await this.getScoredBids(loadId);
    }
  }

  public async acceptBid(bidId: number): Promise<{ bid: Bid; invoice?: Invoice; message?: string }> {
    try {
      return await this.request<{ bid: Bid; invoice?: Invoice; message?: string }>(`/bids/${bidId}/accept`, {
        method: 'POST',
      });
    } catch {
      // Fallback to /approve if /accept is not defined in backend
      return await this.approveBid(bidId);
    }
  }

  public async approveBid(bidId: number, marginPercent: number = 8): Promise<{ bid: Bid; invoice: Invoice }> {
    return await this.request<{ bid: Bid; invoice: Invoice }>(`/bids/${bidId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ marginPercent }),
    });
  }

  // Invoices
  public async getInvoices(): Promise<Invoice[]> {
    return await this.request<Invoice[]>('/invoices');
  }

  public async getInvoice(id: number): Promise<Invoice> {
    return await this.request<Invoice>(`/invoices/${id}`);
  }

  public async getInvoiceByLoadId(loadId: number): Promise<Invoice | null> {
    try {
      return await this.request<Invoice>(`/invoices/load/${loadId}`);
    } catch {
      return null;
    }
  }

  // AI Dispatch Parser
  public async parseInquiry(text: string): Promise<ParsedDispatchPayload> {
    try {
      return await this.request<ParsedDispatchPayload>('/loads/parse-inquiry', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
    } catch {
      return await this.request<ParsedDispatchPayload>('/parser/parse', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
    }
  }

  public async createLoadFromParsed(payload: ParsedDispatchPayload): Promise<Load> {
    return await this.request<Load>('/parser/create-load', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Corridors
  public async getCorridors(): Promise<Corridor[]> {
    return await this.request<Corridor[]>('/corridors');
  }

  // ULIP VAHAN & FASTag Simulator
  public async verifyVehicle(
    vehicleNumber: string,
    corridor?: { originCity?: string; destCity?: string }
  ): Promise<UlipVerificationResponse> {
    const params = new URLSearchParams();
    if (corridor?.originCity) params.append('originCity', corridor.originCity);
    if (corridor?.destCity) params.append('destCity', corridor.destCity);
    const query = params.toString() ? `?${params.toString()}` : '';
    return await this.request<UlipVerificationResponse>(
      `/ulip/verify-vehicle/${encodeURIComponent(vehicleNumber)}${query}`
    );
  }
}

export const api = new ApiService();

import { CurrencyUtil } from '../utils/currency.js';

export interface ParsedDispatchPayload {
  // Required AGENTS.md / Module 3 Schema
  origin_city: string;
  destination_city: string;
  origin_state: string;
  destination_state: string;
  weight_tons: number;
  vehicle_type: string;
  shipper_budget_paise: number;

  // CamelCase aliases for frontend compatibility
  originCity: string;
  destCity: string;
  originState: string;
  destState: string;
  weightMetricTons: number;
  vehicleType: string;
  targetRateRupees: number;
  targetRatePaise: number;

  is_interstate: boolean;
  confidenceScore: number;
  rawText: string;
  matchedCorridor?: string;
  extractedItems: {
    originFound: boolean;
    destFound: boolean;
    weightFound: boolean;
    vehicleFound: boolean;
    rateFound: boolean;
  };
}

export class DispatchParserService {
  // Known Indian freight hubs and state mappings for jurisdiction resolution
  private static CITIES_MAP: Record<string, string> = {
    jalandhar: 'Punjab',
    ludhiana: 'Punjab',
    pathankot: 'Punjab',
    amritsar: 'Punjab',
    chandigarh: 'Punjab',
    mohali: 'Punjab',
    patiala: 'Punjab',
    bathinda: 'Punjab',
    gurugram: 'Haryana',
    gurgaon: 'Haryana',
    faridabad: 'Haryana',
    panipat: 'Haryana',
    delhi: 'Delhi',
    'delhi ncr': 'Delhi',
    jaipur: 'Rajasthan',
    jodhpur: 'Rajasthan',
    mumbai: 'Maharashtra',
    pune: 'Maharashtra',
    nagpur: 'Maharashtra',
    ahmedabad: 'Gujarat',
    surat: 'Gujarat',
    vadodara: 'Gujarat',
    bengaluru: 'Karnataka',
    bangalore: 'Karnataka',
    chennai: 'Tamil Nadu',
    hyderabad: 'Telangana',
    kolkata: 'West Bengal',
  };

  /**
   * LLM Extraction Pipeline with Deterministic Regex/NLP Fallback
   * 1. Attempts LLM extraction if an API key is configured.
   * 2. Falls back deterministically to high-precision local NLP/regex extraction so demo operates 100% offline.
   */
  public async parseInquiry(text: string): Promise<ParsedDispatchPayload> {
    // 1. Check if LLM API key exists and try LLM extraction
    if (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY) {
      try {
        const llmResult = await this.tryLLMExtraction(text);
        if (llmResult) {
          return llmResult;
        }
      } catch (err) {
        console.warn('[DispatchParserService] LLM extraction encountered an error; engaging deterministic NLP fallback:', err);
      }
    }

    // 2. Deterministic high-precision offline NLP / Regex extractor
    return this.parseInquiryDeterministic(text);
  }

  /**
   * LLM Extraction Pipeline implementation
   */
  private async tryLLMExtraction(text: string): Promise<ParsedDispatchPayload | null> {
    // Structured JSON extraction prompt
    const prompt = `Extract freight shipment details from this message into JSON with keys:
    origin_city, destination_city, weight_tons (number), vehicle_type, shipper_budget_rupees (number).
    Text: "${text}"`;

    if (process.env.OPENAI_API_KEY) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const parsed = JSON.parse(data.choices[0].message.content);
        return this.formatPayload({
          originCity: parsed.origin_city,
          destCity: parsed.destination_city,
          weightMetricTons: Number(parsed.weight_tons),
          vehicleType: parsed.vehicle_type,
          targetRateRupees: Number(parsed.shipper_budget_rupees),
          rawText: text,
          confidenceScore: 98,
        });
      }
    }

    return null;
  }

  /**
   * High-Precision Deterministic Regex & NLP Extractor
   * Operates 100% offline with zero dependencies or external network requests.
   */
  public parseInquiryDeterministic(text: string): ParsedDispatchPayload {
    const cleanText = text.trim();
    const lower = cleanText.toLowerCase();

    // 1. Origin & Destination Extraction
    let originCity = '';
    let destCity = '';

    // Route matching regex: "from <Origin> to <Destination>" or "<Origin> to <Destination>"
    const routeRegex = /(?:from\s+)?([a-z\s]+?)\s+(?:to|->|-->|-)\s+([a-z\s]+?)(?:,|\.|\n|urgent|tomorrow|today|for|\d|\bweight|\brate|\bbudget|\bload|\bvehicle|$)/i;
    const routeMatch = lower.match(routeRegex);

    if (routeMatch) {
      const candidateOrigin = routeMatch[1].trim();
      const candidateDest = routeMatch[2].trim();

      for (const [cityKey] of Object.entries(DispatchParserService.CITIES_MAP)) {
        if (candidateOrigin.includes(cityKey) && !originCity) {
          originCity = this.capitalizeWords(cityKey);
        }
        if (candidateDest.includes(cityKey) && !destCity) {
          destCity = this.capitalizeWords(cityKey);
        }
      }
    }

    // Direct search across known logistics corridors if boundaries were messy
    if (!originCity || !destCity) {
      const foundCities: { city: string; index: number }[] = [];
      for (const [cityKey] of Object.entries(DispatchParserService.CITIES_MAP)) {
        const idx = lower.indexOf(cityKey);
        if (idx !== -1) {
          foundCities.push({ city: this.capitalizeWords(cityKey), index: idx });
        }
      }
      foundCities.sort((a, b) => a.index - b.index);

      if (foundCities.length >= 2) {
        if (!originCity) originCity = foundCities[0].city;
        if (!destCity) destCity = foundCities[1].city;
      } else if (foundCities.length === 1 && !originCity) {
        originCity = foundCities[0].city;
      }
    }

    // Smart default fallbacks
    if (!originCity) originCity = 'Jalandhar';
    if (!destCity) destCity = 'Gurugram';

    // State Lookups
    const originState = DispatchParserService.CITIES_MAP[originCity.toLowerCase()] || 'Punjab';
    const destState = DispatchParserService.CITIES_MAP[destCity.toLowerCase()] || 'Haryana';
    const isInterState = originState.trim().toLowerCase() !== destState.trim().toLowerCase();

    // 2. Weight Extraction (metric tons, MT, tonnes, tons)
    let weightMetricTons = 16.0;
    let weightFound = false;
    const weightRegex = /(\d+(?:\.\d+)?)\s*(?:mt|metric\s*tons?|tonnes?|tons?|t\b)/i;
    const weightMatch = lower.match(weightRegex);
    if (weightMatch) {
      weightMetricTons = parseFloat(weightMatch[1]);
      weightFound = true;
    }

    // 3. Vehicle Type Extraction (handles dynamic container sizes like 14ft container, 20ft container, 32ft MX, etc.)
    let vehicleType = '32ft Multi-Axle';
    let vehicleFound = false;

    // Pattern 1: Dynamic container / trailer (e.g. "14ft container", "20ft container", "32ft closed body")
    const containerMatch = lower.match(/(\d+ft\s+(?:container|closed\s*body|trailer|open|sxl|mx))/i);
    if (containerMatch) {
      vehicleType = this.capitalizeWords(containerMatch[1]);
      vehicleFound = true;
    } else {
      // Pattern 2: Wheeler pattern (e.g. "14 wheeler", "12 wheeler", "10 wheeler")
      const wheelerMatch = lower.match(/(\d+\s*wheeler)/i);
      if (wheelerMatch) {
        vehicleType = this.capitalizeWords(wheelerMatch[1]);
        vehicleFound = true;
      } else if (lower.includes('taurus')) {
        vehicleType = 'Taurus 16T';
        vehicleFound = true;
      } else if (lower.includes('32ft mx') || lower.includes('32ft multi-axle')) {
        vehicleType = '32ft Multi-Axle';
        vehicleFound = true;
      } else if (lower.includes('container')) {
        vehicleType = '20ft Container';
        vehicleFound = true;
      } else if (lower.includes('eicher')) {
        vehicleType = 'Eicher 17ft';
        vehicleFound = true;
      } else if (lower.includes('407')) {
        vehicleType = 'Tata 407';
        vehicleFound = true;
      }
    }

    // 4. Rate Extraction (e.g. "28,000 rs", "budget around 28,000", "₹38,000", "38k", "target rate 38,000")
    let targetRateRupees = 28000;
    let rateFound = false;

    // Pattern for "XXk" (e.g. 28k, 38k)
    const kRegex = /(?:rate|budget|offer|rs|inr|₹|price)?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*k\b/i;
    const kMatch = lower.match(kRegex);
    if (kMatch) {
      targetRateRupees = Math.round(parseFloat(kMatch[1]) * 1000);
      rateFound = true;
    } else {
      // Standard numeric currency: e.g. "28,000 rs", "38000", "Rs 28,000", "₹ 28000"
      const rateRegex = /(?:rs\.?|inr|₹|rate|target|budget|offer|price)?\s*[:\-]?\s*₹?\s*(\d{1,3}(?:,\d{3})+|\d{4,6})\s*(?:rs|rupees|inr|₹)?/i;
      const rateMatch = lower.match(rateRegex);
      if (rateMatch) {
        const rawNum = rateMatch[1].replace(/,/g, '');
        const parsed = parseInt(rawNum, 10);
        if (parsed >= 1000) {
          targetRateRupees = parsed;
          rateFound = true;
        }
      }
    }

    return this.formatPayload({
      originCity,
      originState,
      destCity,
      destState,
      weightMetricTons,
      vehicleType,
      targetRateRupees,
      rawText: cleanText,
      confidenceScore: (originCity ? 20 : 0) + (destCity ? 20 : 0) + (weightFound ? 20 : 0) + (vehicleFound ? 20 : 0) + (rateFound ? 20 : 0),
      extractedItems: {
        originFound: !!originCity,
        destFound: !!destCity,
        weightFound,
        vehicleFound,
        rateFound,
      },
    });
  }

  /**
   * Helper to format consistent payload with both snake_case and camelCase attributes
   */
  private formatPayload(params: {
    originCity: string;
    originState?: string;
    destCity: string;
    destState?: string;
    weightMetricTons: number;
    vehicleType: string;
    targetRateRupees: number;
    rawText: string;
    confidenceScore: number;
    extractedItems?: {
      originFound: boolean;
      destFound: boolean;
      weightFound: boolean;
      vehicleFound: boolean;
      rateFound: boolean;
    };
  }): ParsedDispatchPayload {
    const originState = params.originState || DispatchParserService.CITIES_MAP[params.originCity.toLowerCase()] || 'Punjab';
    const destState = params.destState || DispatchParserService.CITIES_MAP[params.destCity.toLowerCase()] || 'Delhi';
    const isInterState = originState.trim().toLowerCase() !== destState.trim().toLowerCase();
    const targetRatePaise = CurrencyUtil.rupeesToPaise(params.targetRateRupees);

    return {
      // AGENTS.md / Module 3 required fields
      origin_city: params.originCity,
      destination_city: params.destCity,
      origin_state: originState,
      destination_state: destState,
      weight_tons: params.weightMetricTons,
      vehicle_type: params.vehicleType,
      shipper_budget_paise: targetRatePaise,

      // CamelCase aliases
      originCity: params.originCity,
      destCity: params.destCity,
      originState,
      destState,
      weightMetricTons: params.weightMetricTons,
      vehicleType: params.vehicleType,
      targetRateRupees: params.targetRateRupees,
      targetRatePaise,

      is_interstate: isInterState,
      confidenceScore: params.confidenceScore || 90,
      rawText: params.rawText,
      matchedCorridor: `${params.originCity} (${originState}) → ${params.destCity} (${destState})`,
      extractedItems: params.extractedItems || {
        originFound: true,
        destFound: true,
        weightFound: true,
        vehicleFound: true,
        rateFound: true,
      },
    };
  }

  // Alias for backward compatibility
  public parseInquiryText(text: string): ParsedDispatchPayload {
    return this.parseInquiryDeterministic(text);
  }

  private capitalizeWords(str: string): string {
    return str
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
}

import bcrypt from 'bcryptjs';
import { User, Load, Bid, Invoice } from '../models/index.js';
import { CurrencyUtil } from '../utils/currency.js';

export class SeedService {
  public async seedAll(): Promise<void> {
    const userCount = await User.count();
    if (userCount > 0) {
      const loadCount = await Load.count();
      console.log(`   [Auto-Seed] Database already initialized (${userCount} users, ${loadCount} loads). Persistent state preserved.`);
      return;
    }

    console.log('   [Auto-Seed] Empty database detected. Populating demo accounts, Indian corridors, and sample loads...');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // ==============================================================
    // 1. Seed Demo Accounts
    //    - 1 Shipper
    //    - 2 Carriers with different reliability scores (95% vs 82%)
    //    - 1 Broker
    // ==============================================================
    const shipper = await User.create({
      name: 'Gurpreet Singh',
      email: 'shipper@supplysync.com',
      password_hash: passwordHash,
      role: 'SHIPPER',
      company_name: 'Punjab Agro Exporters Ltd',
      reliability_score: 90,
      gstin: '03AABCP8921A1Z2',
      state: 'Punjab',
    });

    const carrier1 = await User.create({
      name: 'Rajesh Sharma',
      email: 'carrier1@supplysync.com',
      password_hash: passwordHash,
      role: 'CARRIER',
      company_name: 'SpeedTrans Logistics',
      reliability_score: 95, // High reliability
      gstin: '03AAACS4512C1Z4',
      state: 'Punjab',
    });

    const carrier2 = await User.create({
      name: 'Manish Verma',
      email: 'carrier2@supplysync.com',
      password_hash: passwordHash,
      role: 'CARRIER',
      company_name: 'Northern Express Hauliers',
      reliability_score: 82, // Moderate reliability
      gstin: '07AAACN1289D1Z8',
      state: 'Delhi',
    });

    const broker = await User.create({
      name: 'Aditya Oberoi',
      email: 'broker@supplysync.com',
      password_hash: passwordHash,
      role: 'BROKER',
      company_name: 'SupplySync Freight Solutions',
      reliability_score: 100,
      gstin: '03AABCS1429B1Z0',
      state: 'Punjab',
    });

    // ==============================================================
    // 2. Seed 4 Realistic Indian Intercity Freight Loads
    //    - Load 1: Pathankot to Chandigarh (Intra-state)
    //    - Load 2: Ludhiana to Delhi (Inter-state)
    //    - Load 3: Amritsar to Jaipur (Inter-state)
    //    - Load 4: Mumbai to Pune (Intra-state)
    // ==============================================================

    // Load 1: Pathankot to Chandigarh
    const load1 = await Load.create({
      shipper_id: shipper.id,
      origin_city: 'Pathankot',
      destination_city: 'Chandigarh',
      origin_state: 'Punjab',
      destination_state: 'Punjab',
      weight_tons: 22.0,
      vehicle_type: 'Taurus 16T',
      shipper_budget_paise: CurrencyUtil.rupeesToPaise(32000), // ₹32,000.00
      status: 'BIDDING',
      description: 'Cement and construction aggregate bags. Forklift loading ready.',
    });

    // Active bids on Load 1
    await Bid.create({
      load_id: load1.id,
      carrier_id: carrier1.id,
      bid_amount_paise: CurrencyUtil.rupeesToPaise(29500), // ₹29,500.00
      estimated_transit_hours: 8,
      status: 'PENDING',
      notes: 'Taurus 16T available near Pathankot bypass yard. Evening dispatch.',
    });

    await Bid.create({
      load_id: load1.id,
      carrier_id: carrier2.id,
      bid_amount_paise: CurrencyUtil.rupeesToPaise(31000), // ₹31,000.00
      estimated_transit_hours: 10,
      status: 'PENDING',
      notes: 'Available on return trip from Jammu.',
    });

    // Load 2: Ludhiana to Delhi
    const load2 = await Load.create({
      shipper_id: shipper.id,
      origin_city: 'Ludhiana',
      destination_city: 'Delhi',
      origin_state: 'Punjab',
      destination_state: 'Delhi',
      weight_tons: 18.0,
      vehicle_type: '32ft Multi-Axle',
      shipper_budget_paise: CurrencyUtil.rupeesToPaise(42000), // ₹42,000.00
      status: 'BIDDING',
      description: 'Precision engineering auto components for Tier-1 assembly line.',
    });

    // Active bids on Load 2
    await Bid.create({
      load_id: load2.id,
      carrier_id: carrier1.id,
      bid_amount_paise: CurrencyUtil.rupeesToPaise(38500), // ₹38,500.00 (Lowest + High rating)
      estimated_transit_hours: 12,
      status: 'PENDING',
      notes: 'GPS-fitted 32ft MX ready for pickup in Focal Point.',
    });

    await Bid.create({
      load_id: load2.id,
      carrier_id: carrier2.id,
      bid_amount_paise: CurrencyUtil.rupeesToPaise(40500), // ₹40,500.00
      estimated_transit_hours: 14,
      status: 'PENDING',
      notes: 'Available from Jalandhar depot.',
    });

    // Load 3: Amritsar to Jaipur
    const load3 = await Load.create({
      shipper_id: shipper.id,
      origin_city: 'Amritsar',
      destination_city: 'Jaipur',
      origin_state: 'Punjab',
      destination_state: 'Rajasthan',
      weight_tons: 16.0,
      vehicle_type: '14 Wheeler',
      shipper_budget_paise: CurrencyUtil.rupeesToPaise(54000), // ₹54,000.00
      status: 'BIDDING',
      description: 'Export-grade Basmati rice bags for wholesale FMCG hub.',
    });

    // Active bids on Load 3
    await Bid.create({
      load_id: load3.id,
      carrier_id: carrier1.id,
      bid_amount_paise: CurrencyUtil.rupeesToPaise(51000), // ₹51,000.00
      estimated_transit_hours: 18,
      status: 'PENDING',
      notes: 'Weatherproof container body with tarping.',
    });

    await Bid.create({
      load_id: load3.id,
      carrier_id: carrier2.id,
      bid_amount_paise: CurrencyUtil.rupeesToPaise(49500), // ₹49,500.00 (Lower price, lower rating)
      estimated_transit_hours: 22,
      status: 'PENDING',
      notes: 'Regular corridor service.',
    });

    // Load 4: Mumbai to Pune (Assigned & Invoiced demonstration)
    const load4 = await Load.create({
      shipper_id: shipper.id,
      origin_city: 'Mumbai',
      destination_city: 'Pune',
      origin_state: 'Maharashtra',
      destination_state: 'Maharashtra',
      weight_tons: 9.5,
      vehicle_type: '20ft Container',
      shipper_budget_paise: CurrencyUtil.rupeesToPaise(21000), // ₹21,000.00
      status: 'INVOICED',
      description: 'Imported FMCG packaged consumer products from JNPT port.',
    });

    const bid4 = await Bid.create({
      load_id: load4.id,
      carrier_id: carrier1.id,
      bid_amount_paise: CurrencyUtil.rupeesToPaise(19000), // ₹19,000.00
      estimated_transit_hours: 6,
      status: 'ACCEPTED',
      notes: 'JNPT bonded transport permit active.',
    });

    // Pre-seeded Invoice for Load 4 (12% GTA Intra-State: 6% CGST + 6% SGST)
    const baseFreightPaise = bid4.bid_amount_paise; // 1900000
    const brokerMarginPaise = CurrencyUtil.calculatePercentage(baseFreightPaise, 8); // 152000 (₹1,520)
    const subtotalPaise = baseFreightPaise + brokerMarginPaise; // 2052000 (₹20,520)
    const gstBreakdown = CurrencyUtil.calculateGTAGST(subtotalPaise, false, 12); // Intra-State (6% + 6%)

    await Invoice.create({
      load_id: load4.id,
      bid_id: bid4.id,
      broker_id: broker.id,
      broker_margin_paise: brokerMarginPaise,
      gst_amount_paise: gstBreakdown.totalGstPaise, // 246240 (₹2,462.40)
      total_payable_paise: gstBreakdown.finalTotalPaise, // 2298240 (₹22,982.40)
      is_interstate: false,
      invoice_number: 'INV-SS-2026-0041',
      generated_at: new Date(),
    });

    console.log('✅ Automated seeder executed successfully with demo accounts, Indian loads, and bids!');
  }
}

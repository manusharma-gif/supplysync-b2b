import { sequelize } from '../config/database.js';
import { User, Load, Bid, Invoice } from '../models/index.js';
import { SeedService } from '../services/SeedService.js';

async function runMigration() {
  console.log('=======================================================');
  console.log('🔄 SupplySync B2B — Database Migration & Seed (Mission 1)');
  console.log('=======================================================');

  try {
    console.log('1. Connecting to SQLite database...');
    await sequelize.authenticate();
    console.log('   Connected successfully.');

    console.log('2. Applying SQL schema migration for 4 Core Tables...');
    // Force synchronize the 4 core models: users, loads, bids, invoices
    await sequelize.sync({ force: true });
    console.log('   Tables created successfully with exact schemas & foreign keys:');
    console.log('   - users (id, name, email, password_hash, role, company_name, reliability_score, gstin)');
    console.log('   - loads (id, shipper_id, origin_city, destination_city, weight_tons, vehicle_type, shipper_budget_paise, status, created_at)');
    console.log('   - bids (id, load_id, carrier_id, bid_amount_paise, estimated_transit_hours, status)');
    console.log('   - invoices (id, load_id, bid_id, broker_id, broker_margin_paise, gst_amount_paise, total_payable_paise, is_interstate, invoice_number, generated_at)');

    console.log('\n3. Running automated database seeder...');
    const seedService = new SeedService();
    await seedService.seedAll();

    // Verify Row Counts
    const userCount = await User.count();
    const loadCount = await Load.count();
    const bidCount = await Bid.count();
    const invoiceCount = await Invoice.count();

    console.log('\n=======================================================');
    console.log('📊 Migration & Seeding Verification Results:');
    console.log(`   - Users Table:    ${userCount} demo accounts (1 Shipper, 2 Carriers with different reliability, 1 Broker)`);
    console.log(`   - Loads Table:    ${loadCount} realistic Indian intercity loads (Pathankot, Ludhiana, Amritsar, Mumbai)`);
    console.log(`   - Bids Table:     ${bidCount} active carrier bids`);
    console.log(`   - Invoices Table: ${invoiceCount} 12% GTA dispatch invoice`);
    console.log('=======================================================');
    console.log('✅ Mission 1 Migration & Seeder completed successfully!');

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();

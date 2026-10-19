-- ====================================================================
-- SupplySync B2B Logistics & Freight Portal — Core SQL Schema
-- Standard: Zero Floating-Point Currency Math (All monetary fields in Paise)
-- Database: SQLite 3 / PostgreSQL Compatible
-- ====================================================================

-- 1. Users Table (Shippers, Carriers, Brokers)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK(role IN ('SHIPPER', 'CARRIER', 'BROKER')),
    company_name VARCHAR(255) NOT NULL,
    reliability_score INTEGER NOT NULL DEFAULT 85 CHECK(reliability_score BETWEEN 0 AND 100),
    gstin VARCHAR(50),
    state VARCHAR(100) DEFAULT 'Punjab',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Loads Table (Freight Shipments)
CREATE TABLE IF NOT EXISTS loads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipper_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_city VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    origin_state VARCHAR(100) DEFAULT 'Punjab',
    destination_state VARCHAR(100) DEFAULT 'Delhi',
    weight_tons REAL NOT NULL CHECK(weight_tons > 0),
    vehicle_type VARCHAR(100) NOT NULL,
    shipper_budget_paise INTEGER NOT NULL CHECK(shipper_budget_paise > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'BIDDING', 'ASSIGNED', 'INVOICED')),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bids Table (Carrier Quotes)
CREATE TABLE IF NOT EXISTS bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    load_id INTEGER NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    carrier_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bid_amount_paise INTEGER NOT NULL CHECK(bid_amount_paise > 0),
    estimated_transit_hours INTEGER NOT NULL CHECK(estimated_transit_hours > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Invoices Table (12% GTA GST Forward-Charge Dispatch Invoices)
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    load_id INTEGER NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    bid_id INTEGER REFERENCES bids(id) ON DELETE SET NULL,
    broker_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    broker_margin_paise INTEGER NOT NULL CHECK(broker_margin_paise >= 0),
    gst_amount_paise INTEGER NOT NULL CHECK(gst_amount_paise >= 0),
    total_payable_paise INTEGER NOT NULL CHECK(total_payable_paise > 0),
    is_interstate BOOLEAN NOT NULL DEFAULT 0,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-throughput query performance
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);
CREATE INDEX IF NOT EXISTS idx_loads_shipper_id ON loads(shipper_id);
CREATE INDEX IF NOT EXISTS idx_bids_load_id ON bids(load_id);
CREATE INDEX IF NOT EXISTS idx_bids_carrier_id ON bids(carrier_id);
CREATE INDEX IF NOT EXISTS idx_invoices_load_id ON invoices(load_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

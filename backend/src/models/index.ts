import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

export type UserRole = 'SHIPPER' | 'CARRIER' | 'BROKER';

// ==========================================
// 1. Users Model
// ==========================================
export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  company_name: string;
  reliability_score: number; // 0-100 scale for carrier reliability
  gstin?: string;
  state?: string;
}
export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'reliability_score' | 'gstin' | 'state'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare name: string;
  declare email: string;
  declare password_hash: string;
  declare role: UserRole;
  declare company_name: string;
  declare reliability_score: number;
  declare gstin?: string;
  declare state?: string;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false },
    company_name: { type: DataTypes.STRING, allowNull: false },
    reliability_score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 85 },
    gstin: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true, defaultValue: 'Punjab' },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
  }
);

// ==========================================
// 2. Loads Model
// ==========================================
export type LoadStatus = 'OPEN' | 'BIDDING' | 'ASSIGNED' | 'INVOICED';

export interface LoadAttributes {
  id: number;
  shipper_id: number;
  origin_city: string;
  destination_city: string;
  origin_state?: string;
  destination_state?: string;
  weight_tons: number;
  vehicle_type: string;
  shipper_budget_paise: number; // Integer in Paise
  status: LoadStatus;
  description?: string;
  created_at?: Date;
}
export interface LoadCreationAttributes
  extends Optional<LoadAttributes, 'id' | 'status' | 'description' | 'origin_state' | 'destination_state' | 'created_at'> {}

export class Load extends Model<LoadAttributes, LoadCreationAttributes> implements LoadAttributes {
  declare id: number;
  declare shipper_id: number;
  declare origin_city: string;
  declare destination_city: string;
  declare origin_state?: string;
  declare destination_state?: string;
  declare weight_tons: number;
  declare vehicle_type: string;
  declare shipper_budget_paise: number;
  declare status: LoadStatus;
  declare description?: string;
  declare created_at?: Date;
}

Load.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    shipper_id: { type: DataTypes.INTEGER, allowNull: false },
    origin_city: { type: DataTypes.STRING, allowNull: false },
    destination_city: { type: DataTypes.STRING, allowNull: false },
    origin_state: { type: DataTypes.STRING, allowNull: true, defaultValue: 'Punjab' },
    destination_state: { type: DataTypes.STRING, allowNull: true, defaultValue: 'Delhi' },
    weight_tons: { type: DataTypes.FLOAT, allowNull: false },
    vehicle_type: { type: DataTypes.STRING, allowNull: false },
    shipper_budget_paise: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'OPEN' },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'loads',
    timestamps: true,
    underscored: true,
  }
);

// ==========================================
// 3. Bids Model
// ==========================================
export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface BidAttributes {
  id: number;
  load_id: number;
  carrier_id: number;
  bid_amount_paise: number; // Integer in Paise
  estimated_transit_hours: number;
  status: BidStatus;
  notes?: string;
}
export interface BidCreationAttributes extends Optional<BidAttributes, 'id' | 'status' | 'notes'> {}

export class Bid extends Model<BidAttributes, BidCreationAttributes> implements BidAttributes {
  declare id: number;
  declare load_id: number;
  declare carrier_id: number;
  declare bid_amount_paise: number;
  declare estimated_transit_hours: number;
  declare status: BidStatus;
  declare notes?: string;
}

Bid.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    load_id: { type: DataTypes.INTEGER, allowNull: false },
    carrier_id: { type: DataTypes.INTEGER, allowNull: false },
    bid_amount_paise: { type: DataTypes.INTEGER, allowNull: false },
    estimated_transit_hours: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 24 },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'PENDING' },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'bids',
    timestamps: true,
    underscored: true,
  }
);

// ==========================================
// 4. Invoices Model
// ==========================================
export interface InvoiceAttributes {
  id: number;
  load_id: number;
  bid_id?: number;
  broker_id?: number;
  broker_margin_paise: number;
  gst_amount_paise: number;
  total_payable_paise: number;
  is_interstate: boolean;
  invoice_number: string;
  generated_at?: Date;
  // Module Expansion: E-Way Bill Part-A / Part-B
  eway_bill_number?: string;
  eway_bill_valid_until?: Date;
  eway_bill_distance_km?: number;
  ship_to_gstin?: string;
  vehicle_number?: string;
  eway_bill_status?: string;
}
export interface InvoiceCreationAttributes
  extends Optional<
    InvoiceAttributes,
    | 'id'
    | 'bid_id'
    | 'broker_id'
    | 'generated_at'
    | 'eway_bill_number'
    | 'eway_bill_valid_until'
    | 'eway_bill_distance_km'
    | 'ship_to_gstin'
    | 'vehicle_number'
    | 'eway_bill_status'
  > {}

export class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> implements InvoiceAttributes {
  declare id: number;
  declare load_id: number;
  declare bid_id?: number;
  declare broker_id?: number;
  declare broker_margin_paise: number;
  declare gst_amount_paise: number;
  declare total_payable_paise: number;
  declare is_interstate: boolean;
  declare invoice_number: string;
  declare generated_at?: Date;
  declare eway_bill_number?: string;
  declare eway_bill_valid_until?: Date;
  declare eway_bill_distance_km?: number;
  declare ship_to_gstin?: string;
  declare vehicle_number?: string;
  declare eway_bill_status?: string;
}

Invoice.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    load_id: { type: DataTypes.INTEGER, allowNull: false },
    bid_id: { type: DataTypes.INTEGER, allowNull: true },
    broker_id: { type: DataTypes.INTEGER, allowNull: true },
    broker_margin_paise: { type: DataTypes.INTEGER, allowNull: false },
    gst_amount_paise: { type: DataTypes.INTEGER, allowNull: false },
    total_payable_paise: { type: DataTypes.INTEGER, allowNull: false },
    is_interstate: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    invoice_number: { type: DataTypes.STRING, allowNull: false, unique: true },
    generated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    eway_bill_number: { type: DataTypes.STRING, allowNull: true },
    eway_bill_valid_until: { type: DataTypes.DATE, allowNull: true },
    eway_bill_distance_km: { type: DataTypes.INTEGER, allowNull: true },
    ship_to_gstin: { type: DataTypes.STRING, allowNull: true },
    vehicle_number: { type: DataTypes.STRING, allowNull: true },
    eway_bill_status: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    tableName: 'invoices',
    timestamps: true,
    underscored: true,
  }
);

// ==========================================
// Associations
// ==========================================
User.hasMany(Load, { foreignKey: 'shipper_id', as: 'loads' });
Load.belongsTo(User, { foreignKey: 'shipper_id', as: 'shipper' });

Load.hasMany(Bid, { foreignKey: 'load_id', as: 'bids' });
Bid.belongsTo(Load, { foreignKey: 'load_id', as: 'load' });

User.hasMany(Bid, { foreignKey: 'carrier_id', as: 'bids' });
Bid.belongsTo(User, { foreignKey: 'carrier_id', as: 'carrier' });

Load.hasOne(Invoice, { foreignKey: 'load_id', as: 'invoice' });
Invoice.belongsTo(Load, { foreignKey: 'load_id', as: 'load' });

Bid.hasOne(Invoice, { foreignKey: 'bid_id', as: 'invoice' });
Invoice.belongsTo(Bid, { foreignKey: 'bid_id', as: 'bid' });

User.hasMany(Invoice, { foreignKey: 'broker_id', as: 'broker_invoices' });
Invoice.belongsTo(User, { foreignKey: 'broker_id', as: 'broker' });

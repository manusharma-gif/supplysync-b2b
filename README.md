# SupplySync B2B - Enterprise Logistics & Freight Brokerage Portal

SupplySync is an enterprise-grade B2B freight brokerage and logistics execution MVP designed for Indian intercity transport corridors. It connects **Shippers** (who post freight loads), **Carriers** (who place competitive bids), and **Freight Brokers** (who analyze margins, rank carriers, and issue GST-compliant dispatch invoices).

---

## 1. System Modules Overview

### Module 1: Role-Based Auth & Dashboards (RBAC)
- **4 Demo Personas with 1-Click Quick Switcher**:
  - `SHIPPER`: **Punjab Agro Exporters Ltd** (Gurpreet Singh) — Punjab GSTIN `03AABCP8921A1Z2`
  - `CARRIER_A`: **SpeedTrans Logistics** (Rajesh Sharma) — **95% Reliability Rating**
  - `CARRIER_B`: **Northern Express Hauliers** (Manish Verma) — **82% Reliability Rating**
  - `BROKER`: **SupplySync Freight Solutions** (Aditya Oberoi) — Brokerage Command Center
- **Tailored Dashboards**:
  - **Shipper View**: Post new loads, inspect active bids drawer, and track live status (`OPEN`, `BIDDING`, `ASSIGNED`, `INVOICED`).
  - **Carrier View**: Marketplace board of open freight, reliability scorecards (95% vs 82%), and bidding modal with transit SLA commitments.
  - **Broker View**: Master command center with AI carrier ranking, profit margin inspection, and 1-click contract dispatching.

### Module 2: Quote, Bidding & Margin Engine
- **Carrier Ranking Engine (70% Cost + 30% Reliability)**:
  Bids are ranked dynamically using a composite score that balances cost efficiency with on-time reliability:
  $$\text{Cost Score} = \text{round}\left(\frac{\min(\text{Bids})}{\text{Bid}_{\text{carrier}}} \times 100\right)$$
  $$\text{Composite Score} = \text{round}(0.70 \times \text{Cost Score} + 0.30 \times \text{reliability\_score})$$
- The top-ranked carrier is tagged with the **"AI Best Value Carrier"** badge.
- **Exact Broker Margin**:
  $$\text{Net Broker Margin (Paise)} = \text{shipper\_budget\_paise} - \text{carrier\_bid\_paise}$$
  $$\text{Margin \%} = \frac{\text{Net Broker Margin}}{\text{shipper\_budget\_paise}} \times 100$$

### Module 3: Unstructured Dispatch Parser & GST Invoicing
- **Dual-Engine AI Dispatch Parser**:
  - Parses noisy WhatsApp messages and broker email inquiries into structured shipment payloads.
  - Features an **LLM-ready pipeline** paired with a **deterministic regex/NLP fallback** ensuring **100% offline operation** without API keys.
  - Extracts: `origin_city`, `destination_city`, `origin_state`, `destination_state`, `weight_tons`, `vehicle_type`, and `shipper_budget_paise`.
- **GST Freight Invoicing (`InvoiceGeneratorService`)**:
  - Automatic jurisdiction resolution:
    - **Intra-State** (e.g., Punjab $\rightarrow$ Punjab): **6% CGST + 6% SGST**
    - **Inter-State** (e.g., Punjab $\rightarrow$ Haryana / Delhi / Rajasthan): **12% IGST**
  - SAC code `996511` (Goods Transport Agency forward-charge).
  - Clean, printable tax invoice modal with native print formatting.

### Module 4: Enterprise Compliance & Tracking Expansion
- **ULIP VAHAN & FASTag Simulator (`UlipSimulatorService`)**:
  - Simulates India's **Unified Logistics Interface Platform (ULIP)** API: `GET /api/ulip/verify-vehicle/:vehicleNumber`.
  - Validates standard Indian commercial vehicle registration plates (e.g., `PB-02-CR-4590`, `HP-38-E-9911`, `DL-01-AB-1234`).
  - Returns **MoRTH VAHAN RC data**: Fitness validity, commercial insurance policy, BS-VI OBD-II emission compliance, and All-India National Permit.
  - Generates 3 sequential **FASTag Electronic Toll Collection (NETC)** checkpoints along the load corridor with timestamps, lane IDs, clearance fees, and live wallet balances.
  - Interactive **Live FASTag & ULIP Highway Tracking drawer** on Shipper and Broker dashboards.
- **E-Way Bill Part-A / Part-B Generator (CGST Rule 138)**:
  - Automatically triggers for consignments exceeding **₹50,000 (5,000,000 Paise)**.
  - Dynamic route validity calculation: **1 day of validity for every 200 km** of corridor distance ($\lceil D / 200 \rceil$ days).
  - Generates mock 12-digit E-Way Bill numbers (e.g., `8615 6160 5140`) and auto-populates **Part-A** (Supplier GSTIN, Ship-To GSTIN, Place of Delivery, Document No., Consignment Value) and **Part-B** (Assigned Truck Plate, Origin Place, Transporter Bilty Doc No.).
  - Renders live expiry countdown timer inside the Invoice Modal, alongside statutory exemption badges for consignments under ₹50,000.

---

## 2. Layered Architecture & OOP Design Patterns

SupplySync adheres to a strict **MVC / Layered Architecture**:

```text
HTTP Request
     │
     ▼
[ Routes Layer ]       ──> Route guards & role middleware (requireRole(['BROKER']))
     │
     ▼
[ Controllers Layer ]  ──> Request payload sanitization, HTTP status mapping
     │
     ▼
[ Services Layer ]     ──> Pure business logic (Scoring algorithm, GST math, Margin analysis)
     │
     ▼
[ Repositories Layer ] ──> Data access abstraction, database querying
     │
     ▼
[ Models / SQLite ]    ──> Sequelize ORM schemas (Users, Loads, Bids, Invoices)
```

### OOP & Design Patterns Used
1. **Service Layer Pattern**: Business logic (`MarginCalculatorService`, `BiddingService`, `DispatchParserService`, `InvoiceGeneratorService`) lives strictly in dedicated Service classes, decoupled from controllers.
2. **Repository Pattern**: `BidRepository`, `LoadRepository`, `UserRepository`, `InvoiceRepository` decouple business services from database operations.
3. **Strategy Pattern**: State jurisdiction resolver dynamically selects between Intra-State (`CGST + SGST`) and Inter-State (`IGST`) tax algorithms.
4. **Data Transfer Object (DTO) / Schema Sanitization**: Raw currency inputs (₹) are immediately normalized to integer Paise at controller boundaries before reaching domain models.

---

## 3. Financial Governance: Preventing Floating-Point Currency Bugs

### The IEEE-754 Vulnerability
Standard floating-point numbers in JavaScript (`Number`) use IEEE-754 double-precision representation. This causes well-known precision errors:
```javascript
// Floating point hazards in logistics finance:
0.1 + 0.2 === 0.30000000000000004
19.99 * 100 === 1998.9999999999998
```
In freight brokerage, small rounding errors in multi-crore logistics settlements lead to tax discrepancies, reconciliation failures, and regulatory non-compliance under Indian GST law.

### How AGENTS.md Enforced Zero Floating-Point Drift
`AGENTS.md` established strict financial governance rules:
1. **Integer Paise Storage**: All freight rates, carrier bids, broker margins, and GST amounts are stored in SQLite as **64-bit signed integers in Paise** ($1\text{ INR} = 100\text{ Paise}$). For example, ₹10,000.00 is stored as `1000000`.
2. **Integer Arithmetic**: Tax percentages are computed using integer multiplication before division:
   $$\text{taxPaise} = \text{round}\left(\frac{\text{basePaise} \times \text{ratePercent}}{100}\right)$$
3. **Display-Only Conversion**: Rupee symbols and decimal formatting (`Intl.NumberFormat('en-IN')`) are applied strictly at the UI presentation boundary.

---

## 4. Project Directory Structure

```text
supplysync-b2b/
├── AGENTS.md                           # Architectural constraints & governance rules
├── README.md                           # System overview & technical documentation
├── backend/
│   ├── src/
│   │   ├── config/                     # Database connection & SQL schema
│   │   ├── controllers/                # REST Controllers (Auth, Load, Bid, Invoice, Parser)
│   │   ├── middleware/                 # JWT Auth & Role-Based Access Control (RBAC)
│   │   ├── models/                     # Sequelize models (User, Load, Bid, Invoice)
│   │   ├── repositories/               # Repository layer for data persistence
│   │   ├── routes/                     # Express route declarations
│   │   ├── services/                   # OOP Services (Margin, Bidding, Invoicing, Parser)
│   │   ├── utils/                      # Currency & Integer Paise math helpers
│   │   ├── app.ts                      # Express application setup
│   │   └── server.ts                   # Server entrypoint (Port 5000)
│   └── test/
│       ├── verify-api.ts               # 26-point automated API test suite (Modules 1-4)
│       ├── run-e2e-browser.ts          # Playwright headless browser E2E test script
│       └── run-compliance-e2e.ts       # Playwright E2E test for ULIP & E-Way Bill
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIDispatchParserModal.tsx   # WhatsApp inquiry smart-paste modal
│   │   │   ├── BrokerView.tsx              # Ranking engine & broker command center
│   │   │   ├── CarrierView.tsx             # Load marketplace & bidding board
│   │   │   ├── GSTInvoiceModal.tsx         # Printable 12% GTA GST + E-Way Bill modal
│   │   │   ├── LiveTrackingDrawer.tsx      # FASTag & ULIP highway checkpoint tracker
│   │   │   ├── QuickRoleSwitcher.tsx       # 4-persona 1-click Demo Bar
│   │   │   └── ShipperView.tsx             # Freight demand posting & load tracker
│   │   ├── api.ts                          # Frontend API client (including ULIP methods)
│   │   ├── App.tsx                         # Main app root & state coordination
│   │   └── types.ts                        # TypeScript data contracts
│   └── vite.config.ts                      # Vite dev & build configuration (Port 5173)
└── docs/
    └── artifacts/
        ├── architecture.md                 # System architecture & Mermaid ER diagrams
        ├── module-1-and-2-verification.md  # Modules 1 & 2 verification report
        ├── module-3-verification.md        # Module 3 verification report
        ├── compliance-tracking-expansion.md # Enterprise Compliance & Tracking Report
        ├── e2e-verification-report.md      # Full browser E2E walkthrough report
        └── screenshots/                    # 11 captured browser E2E workflow screenshots
```

---

## 5. Getting Started & Verification

### Prerequisites
- Node.js (v18+)
- SQLite3 (included automatically via npm)

### Starting the Application
```bash
# Terminal 1: Backend Server (Port 5000)
cd backend
npm install
npm run dev

# Terminal 2: Frontend Server (Port 5173)
cd frontend
npm install
npm run dev
```

### Running the Automated API Verification Suite (26 Tests, 100% Pass)
```bash
cd backend
npm test
# or: npx tsx test/verify-api.ts
```

### Running the Headless Browser E2E Tests (with Screenshots)
```bash
cd backend
# Core Shipper -> Carrier -> Broker E2E workflow:
npx tsx test/run-e2e-browser.ts

# Enterprise Compliance & Tracking Expansion (E-Way Bill & ULIP):
npx tsx test/run-compliance-e2e.ts
```

---

## 6. Pre-Seeded Freight Corridors & Accounts

### Demo Accounts
| Role | Company | Name | Reliability Score | GSTIN |
| :--- | :--- | :--- | :--- | :--- |
| `SHIPPER` | Punjab Agro Exporters Ltd | Gurpreet Singh | 90% | `03AABCP8921A1Z2` |
| `CARRIER_A` | SpeedTrans Logistics | Rajesh Sharma | 95% | `03AAACS4512C1Z4` |
| `CARRIER_B` | Northern Express Hauliers | Manish Verma | 82% | `07AAACN1289D1Z8` |
| `BROKER` | SupplySync Freight Solutions | Aditya Oberoi | 100% | `03AABCS1429B1Z0` |

### Pre-Seeded Corridors
- **Pathankot $\rightarrow$ Chandigarh** (240 km, Punjab Intra-State, 6% CGST + 6% SGST)
- **Ludhiana $\rightarrow$ Delhi NCR** (310 km, Inter-State, 12% IGST)
- **Amritsar $\rightarrow$ Jaipur** (590 km, Inter-State, 12% IGST)
- **Mumbai $\rightarrow$ Pune** (150 km, Maharashtra Intra-State, 6% CGST + 6% SGST)
- **Jalandhar $\rightarrow$ Gurugram** (375 km, Inter-State, 12% IGST)

---

## 7. Cloud Deployment on Render.com (Single-Service Architecture)

SupplySync is fully optimized for **single-service cloud deployment** on platforms like **Render.com**, **Railway**, or **Fly.io**, consolidating the React frontend and Express backend into a single container and port.

### Architecture Highlights
1. **Single-Service Port Binding**:
   - The Express backend binds to `process.env.PORT || 5000`.
   - All API endpoints are mounted on `/api/...`.
   - The compiled React frontend static files (`frontend/dist`) are served from Express for all non-API routes (`app.get('{*path}', ...)`), providing seamless client-side SPA routing.
   - Dedicated API 404 guards guarantee unmatched API calls return JSON errors rather than index HTML.
2. **Relative API Networking**:
   - The frontend Axios/fetch client uses relative paths (`/api/...`), completely eliminating hardcoded `localhost` URLs and CORS issues in production.
3. **Auto-Seed on Startup**:
   - Because free cloud containers have ephemeral disk storage, the server bootstrap sequence automatically executes `sequelize.sync()` schema migrations and seeds the 4 demo accounts, Indian corridors, and freight loads if the SQLite database is empty.
4. **Zero-Config Blueprint (`render.yaml`)**:
   - A root `render.yaml` is provided for 1-click infrastructure-as-code deployment.

### Root npm Commands
| Command | Action |
| :--- | :--- |
| `npm run dev` | Runs backend (Port 5000) and frontend (Port 5173) concurrently in dev mode. |
| `npm run build` | Installs dependencies for both folders, builds the React frontend (`tsc -b && vite build`), and compiles backend TypeScript (`tsc`). |
| `npm start` | Launches the single-service Express production server (`node backend/dist/server.js`) and auto-seeds the database. |
| `npm test` | Runs the 26-test automated API verification suite. |

### Steps to Deploy on Render.com
1. **Push to GitHub / GitLab**.
2. **Create New Web Service**:
   - Select your repository on [Render Dashboard](https://dashboard.render.com).
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `PORT`: `10000` (assigned automatically by Render)
3. **Alternatively, use Blueprint Deploy**:
   - Render automatically detects `render.yaml` at the root of the repository for zero-touch configuration.


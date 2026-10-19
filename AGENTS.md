# AGENTS.md - SupplySync B2B Logistics & Freight Portal

## 1. Project Overview & Domain Context
SupplySync is an enterprise B2B Logistics and Freight-Brokerage MVP with three core modules:
1. **Role-Based Auth & Dashboards (RBAC):** Supports three personas: `SHIPPER` (posts loads), `CARRIER` (bids on loads), and `BROKER` (calculates margins, approves bids, generates GST invoices).
2. **Quote & Bidding Engine:** Manages load postings, carrier bids, automated broker margin calculation, and carrier scoring (weighted by cost and on-time reliability rating).
3. **AI Dispatch Parser & Invoice Generator:** Extracts structured shipment payloads (origin, destination, weight in metric tons, vehicle type, offered rate) from unstructured WhatsApp/Email text inquiries and generates GST-compliant dispatch invoices.

## 2. Tech Stack & Architecture Constraints
- **Architecture:** Strict MVC / Layered Architecture (Controllers -> Services -> Repositories/Data Access -> Models).
- **Backend:** Node.js with Express (TypeScript preferred) and SQLite via Prisma/Sequelize for zero-config portable execution during live demos.
- **Frontend:** React (Vite) + Tailwind CSS + Lucide Icons for an enterprise dashboard UI.
- **State & Auth:** JWT-based stateless authentication with role middleware (`requireRole(['BROKER'])`).

## 3. Strict Coding & Financial Governance Rules
- **NO Floating-Point Currency Math:** Never use standard IEEE 754 floating-point math for freight rates, broker margins, or GST calculations. Store all monetary values in the database as integers (in Paise, e.g., ₹10,000.00 = `1000000`) or use fixed-point decimal libraries.
- **Indian Logistics Standards:** 
  - Default currency is INR (`₹`).
  - Default GST rate on GTA (Goods Transport Agency) forward-charge invoices is 12% (6% CGST + 6% SGST for intra-state, or 12% IGST for inter-state).
  - Pre-seed realistic Indian freight corridors (e.g., Pathankot to Chandigarh, Ludhiana to Delhi NCR, Mumbai to Pune).
- **OOP & SOLID Principles:** Business logic (margin calculation, carrier ranking algorithm, GST breakdown) MUST live in dedicated Service classes—never inside Route/Controller handlers.
- **Demo Mode Ergonomics:** Always include a "Quick Role Switcher" toolbar at the top of the UI so an interviewer or presenter can switch between Shipper, Carrier, and Broker views in one click without re-typing passwords.

## 4. Verification & Artifact Requirements
- Every mission must verify backend API endpoints via automated test scripts or cURL checks before marking a task complete.
- UI missions must use the Antigravity built-in browser to verify the Shipper -> Carrier -> Broker workflow and save a visual Artifact in `/docs/artifacts/`.

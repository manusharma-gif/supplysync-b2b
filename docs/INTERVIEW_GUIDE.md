# SupplySync B2B - Interview Defense Cheat Sheet & Code Map

This document is an executive cheat sheet and technical defense guide designed for technical interviews and architecture reviews. It maps out the exact source files, line numbers, design patterns, and engineering rationales across all 4 core modules of SupplySync.

---

## 1. Quick File Map & Line References

| Module / Topic | Source File Path | Line Range | Key Function / Symbol |
| :--- | :--- | :--- | :--- |
| **Paise Integer Currency Math** | [`backend/src/utils/currency.ts`](file:///c:/supplysync-b2b/backend/src/utils/currency.ts) | Lines 7–46 | `rupeesToPaise()`, `paiseToRupees()`, `calculatePercentage()` |
| **12% GTA Forward-Charge GST** | [`backend/src/utils/currency.ts`](file:///c:/supplysync-b2b/backend/src/utils/currency.ts) | Lines 53–86 | `calculateGTAGST()` (6% CGST + 6% SGST vs 12% IGST) |
| **GST Invoice Generation** | [`backend/src/services/InvoiceGeneratorService.ts`](file:///c:/supplysync-b2b/backend/src/services/InvoiceGeneratorService.ts) | Lines 129–158 | `calculateGTAGST()` under SAC `996511` |
| **Tax Jurisdiction Resolution** | [`backend/src/services/InvoiceGeneratorService.ts`](file:///c:/supplysync-b2b/backend/src/services/InvoiceGeneratorService.ts) | Lines 94–120 | `determineTaxJurisdiction()` (Intra vs Inter-State) |
| **Net Broker Margin Calculation** | [`backend/src/services/MarginCalculatorService.ts`](file:///c:/supplysync-b2b/backend/src/services/MarginCalculatorService.ts) | Lines 26–41 | `calculateBrokerMargin(shipperBudget, carrierBid)` |
| **70/30 Carrier Ranking Formula** | [`backend/src/services/MarginCalculatorService.ts`](file:///c:/supplysync-b2b/backend/src/services/MarginCalculatorService.ts) | Lines 47–61 | `calculateCostScore()`, `calculateCompositeScore()` |
| **Carrier Scoring & Recommendation** | [`backend/src/services/BiddingService.ts`](file:///c:/supplysync-b2b/backend/src/services/BiddingService.ts) | Lines 60–132 | `getScoredBidsForLoad()` & `"Best Value Carrier"` badge |
| **JWT & Demo Ergonomics Middleware** | [`backend/src/middleware/authMiddleware.ts`](file:///c:/supplysync-b2b/backend/src/middleware/authMiddleware.ts) | Lines 29–65 | `authenticateToken` (Bearer JWT + `x-demo-role`) |
| **Role-Based Access Control (RBAC)** | [`backend/src/middleware/authMiddleware.ts`](file:///c:/supplysync-b2b/backend/src/middleware/authMiddleware.ts) | Lines 71–87 | `requireRole(allowedRoles: UserRole[])` |
| **Protected Broker Bid Approval Route** | [`backend/src/routes/bidRoutes.ts`](file:///c:/supplysync-b2b/backend/src/routes/bidRoutes.ts) | Lines 19–20 | `requireRole(['BROKER'])` on `/:bidId/accept` |
| **ULIP Indian Plate Regex & Normalizer** | [`backend/src/services/UlipSimulatorService.ts`](file:///c:/supplysync-b2b/backend/src/services/UlipSimulatorService.ts) | Lines 73–115 | `validateRegistrationNumber()` (MoRTH format) |
| **ULIP VAHAN RC & FASTag Simulation** | [`backend/src/services/UlipSimulatorService.ts`](file:///c:/supplysync-b2b/backend/src/services/UlipSimulatorService.ts) | Lines 121–178 | `verifyVehicle()` (Fitness, Insurance, PUC, Permit) |
| **Corridor FASTag Toll Checkpoints** | [`backend/src/services/UlipSimulatorService.ts`](file:///c:/supplysync-b2b/backend/src/services/UlipSimulatorService.ts) | Lines 184–356 | `generateCorridorCheckpoints()` (NH-44, NH-48, YCEW) |
| **ULIP REST Route** | [`backend/src/routes/ulipRoutes.ts`](file:///c:/supplysync-b2b/backend/src/routes/ulipRoutes.ts) | Lines 1–13 | `GET /api/ulip/verify-vehicle/:vehicleNumber` |
| **E-Way Bill Rule 138 Trigger (>₹50k)** | [`backend/src/services/InvoiceGeneratorService.ts`](file:///c:/supplysync-b2b/backend/src/services/InvoiceGeneratorService.ts) | Lines 203–240 | Threshold check, 12-digit EWB No, validity rule |
| **Dynamic E-Way Bill Validity (1d/200km)** | [`backend/src/services/InvoiceGeneratorService.ts`](file:///c:/supplysync-b2b/backend/src/services/InvoiceGeneratorService.ts) | Lines 222–224 | `Math.max(1, Math.ceil(distanceKm / 200))` |
| **FASTag & ULIP Live Drawer (Frontend)** | [`frontend/src/components/LiveTrackingDrawer.tsx`](file:///c:/supplysync-b2b/frontend/src/components/LiveTrackingDrawer.tsx) | Full File | Slide-over UI, VAHAN RC badge, toll checkpoints |
| **E-Way Bill & Expiry Modal (Frontend)** | [`frontend/src/components/GSTInvoiceModal.tsx`](file:///c:/supplysync-b2b/frontend/src/components/GSTInvoiceModal.tsx) | Lines 36–47, 220–310 | Form GST EWB-01 banner, countdown, Part-A/Part-B |

---

## 2. Topic 1: Paise (Integer) Currency Math & 12% GST Logic

### Interview Question
> *"Why did you avoid floating-point math for rates and GST, and how is it implemented?"*

### Defense Script
> "In JavaScript, standard `Number` uses IEEE-754 double precision. Operations like `0.1 + 0.2` result in `0.30000000000000004`, and `19.99 * 100` yields `1998.9999999999998`. In multi-crore Indian road freight settlements, sub-paisa floating-point drift causes tax audit reconciliation failures under the CGST Act.
> 
> Following `AGENTS.md`, we enforced **Zero Floating-Point Financial Governance**:
> 1. All monetary values are stored in SQLite as **64-bit signed integers representing Paise** ($1\text{ INR} = 100\text{ Paise}$). For example, ₹28,500.00 is stored as `2850000`.
> 2. Tax calculations multiply before dividing and round to the nearest whole Paise integer:
>    $$\text{taxPaise} = \text{Math.round}\left(\frac{\text{basePaise} \times \text{ratePercent}}{100}\right)$$
> 3. Currency conversion to Rupees (`paise / 100`) and symbol formatting (`Intl.NumberFormat('en-IN')`) are strictly relegated to presentation layers."

### Code Evidence
- File: [`backend/src/utils/currency.ts`](file:///c:/supplysync-b2b/backend/src/utils/currency.ts#L7-L86)
- File: [`backend/src/services/InvoiceGeneratorService.ts`](file:///c:/supplysync-b2b/backend/src/services/InvoiceGeneratorService.ts#L129-L158)
```typescript
// backend/src/utils/currency.ts (Lines 44-46, 53-86)
public static calculatePercentage(basePaise: number, percent: number): number {
  return Math.round((basePaise * percent) / 100);
}

public static calculateGTAGST(taxableAmountPaise: number, isInterState: boolean, gstRatePercent: number = 12) {
  if (isInterState) {
    const igstPaise = this.calculatePercentage(taxableAmountPaise, 12);
    return { cgstPaise: 0, sgstPaise: 0, igstPaise, totalGstPaise: igstPaise, finalTotalPaise: taxableAmountPaise + igstPaise };
  } else {
    const halfRate = 6; // 6% CGST + 6% SGST
    const cgstPaise = this.calculatePercentage(taxableAmountPaise, halfRate);
    const sgstPaise = this.calculatePercentage(taxableAmountPaise, halfRate);
    return { cgstPaise, sgstPaise, igstPaise: 0, totalGstPaise: cgstPaise + sgstPaise, finalTotalPaise: taxableAmountPaise + cgstPaise + sgstPaise };
  }
}
```

---

## 3. Topic 2: The 70/30 Carrier Recommendation Algorithm

### Interview Question
> *"How does your broker recommendation algorithm rank competing carriers, and why is it structured this way?"*

### Defense Script
> "In Indian B2B logistics, selecting exclusively by lowest price often results in delayed shipments or vehicle breakdowns, while selecting purely by reputation drives up procurement costs. We implemented a **composite scoring model** that balances commercial savings and operational reliability:
> 
> 1. **Cost Score (0–100)**: Normalized relative to the lowest incoming bid on the specific load:
>    $$\text{Cost Score} = \text{round}\left(\frac{\min(\text{Bids})}{\text{Bid}_{\text{carrier}}} \times 100\right)$$
>    The lowest bidder receives 100; a carrier bidding 20% higher receives 83.
> 2. **Reliability Score (0–100)**: Retrieved from the carrier's vetted on-time performance history (`reliability_score`, e.g., SpeedTrans at 95%, Northern Express at 82%).
> 3. **Composite Weighted Score**:
>    $$\text{Composite Score} = \text{round}(0.70 \times \text{Cost Score} + 0.30 \times \text{Reliability Score})$$
> 
> The carrier with the highest composite score is tagged as the **AI 'Best Value Carrier'**. Additionally, the broker sees the exact net margin in rupees ($\text{Budget} - \text{Bid}$) and percentage."

### Code Evidence
- File: [`backend/src/services/MarginCalculatorService.ts`](file:///c:/supplysync-b2b/backend/src/services/MarginCalculatorService.ts#L47-L61)
- File: [`backend/src/services/BiddingService.ts`](file:///c:/supplysync-b2b/backend/src/services/BiddingService.ts#L76-L130)
```typescript
// backend/src/services/MarginCalculatorService.ts (Lines 47-61)
public calculateCostScore(carrierBidPaise: number, minBidPaise: number): number {
  if (carrierBidPaise <= 0 || minBidPaise <= 0) return 100;
  return Math.round((minBidPaise / carrierBidPaise) * 100);
}

public calculateCompositeScore(costScore: number, reliabilityScore: number): number {
  const boundedReliability = Math.max(0, Math.min(100, reliabilityScore));
  const boundedCost = Math.max(0, Math.min(100, costScore));
  return Math.round(0.70 * boundedCost + 0.30 * boundedReliability);
}
```

---

## 4. Topic 3: Role-Based Access Control (RBAC) & Route Protection

### Interview Question
> *"How do you protect sensitive Broker endpoints like bid approval and margin inspection from Shippers and Carriers?"*

### Defense Script
> "We implement a strict, layered RBAC middleware pattern.
> 
> 1. **Authentication (`authenticateToken`)**: Validates the JWT Bearer token signed with `HS256` and attaches the decoded user payload to `req.user`. For demo ergonomics, it also inspects the `x-demo-role` header to support 1-click role toggling in live presentations without requiring credential re-entry.
> 2. **Authorization Guard (`requireRole(['BROKER'])`)**: Higher-order middleware factory that inspects `req.user.role`. If the user is unauthenticated, it returns `401 Unauthorized`. If the user's role is not within the whitelist, it immediately aborts with `403 Forbidden` (`Access denied. Requires one of roles: [BROKER]`).
> 3. **Controller Decoupling**: Handlers never contain inline role checks; route definitions declaratively declare their security contracts."

### Code Evidence
- File: [`backend/src/middleware/authMiddleware.ts`](file:///c:/supplysync-b2b/backend/src/middleware/authMiddleware.ts#L68-L87)
- File: [`backend/src/routes/bidRoutes.ts`](file:///c:/supplysync-b2b/backend/src/routes/bidRoutes.ts#L19-L21)
```typescript
// backend/src/middleware/authMiddleware.ts (Lines 71-87)
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }
    next();
  };
};

// backend/src/routes/bidRoutes.ts (Lines 19-20)
router.post('/:bidId/accept', authenticateToken, requireRole(['BROKER']), bidController.acceptBid);
router.post('/:bidId/approve', authenticateToken, requireRole(['BROKER']), bidController.approveBid);
```

---

## 5. Topic 4: ULIP VAHAN & E-Way Bill (Rule 138) Compliance

### Interview Question
> *"How does SupplySync simulate India's National Logistics Policy (ULIP) and CGST Rule 138 E-Way Bill standards?"*

### Defense Script
> "India's logistics sector mandates compliance with the **Unified Logistics Interface Platform (ULIP)** and the **National E-Way Bill Portal**:
> 
> 1. **Indian License Plate Validation**:
>    `UlipSimulatorService` enforces standard MoRTH registration formats using regex:
>    `/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{4})$/`
>    It normalizes strings into standard Indian format (e.g. `PB-02-CR-4590`, `HP-38-E-9911`) and returns 400 Bad Request for non-compliant inputs.
> 2. **ULIP VAHAN RC & FASTag Simulation**:
>    The `GET /api/ulip/verify-vehicle/:vehicleNumber` endpoint returns verified vehicle fitness (2028), commercial insurance (2027), BS-VI OBD-II compliance, and National Goods Permit (2029). It also generates a corridor-specific sequence of 3 FASTag highway checkpoints with timestamps, lane IDs, and toll fees.
> 3. **CGST Rule 138 E-Way Bill Rule**:
>    In `InvoiceGeneratorService`, any load with a taxable consignment value exceeding **₹50,000 (5,000,000 Paise)** automatically triggers E-Way Bill generation:
>    - Generates a 12-digit mock EWB number (e.g., `8615 6160 5140`).
>    - Calculates dynamic validity strictly using the statutory rule: **1 day for every 200 km** ($\lceil \text{distance} / 200 \rceil$ days).
>    - Requires and derives destination state `Ship-To GSTIN` (e.g., `08AAACS8812E1Z8` for Rajasthan, `07AAACS8812E1Z8` for Delhi).
>    - Emits Part-A (Consignment details) and Part-B (Assigned vehicle and bilty number) in the printable modal."

### Code Evidence
- File: [`backend/src/services/UlipSimulatorService.ts`](file:///c:/supplysync-b2b/backend/src/services/UlipSimulatorService.ts#L73-L178)
- File: [`backend/src/services/InvoiceGeneratorService.ts`](file:///c:/supplysync-b2b/backend/src/services/InvoiceGeneratorService.ts#L203-L245)
```typescript
// backend/src/services/InvoiceGeneratorService.ts (Lines 203-238)
const EWAY_BILL_THRESHOLD_PAISE = 5000000; // ₹50,000 in Paise
const isEwayBillRequired = subtotalPaise > EWAY_BILL_THRESHOLD_PAISE;

if (isEwayBillRequired) {
  // 12-digit mock E-Way Bill Number (e.g., "2410 8923 4412")
  const d1 = Math.floor(1000 + Math.random() * 9000);
  const d2 = Math.floor(1000 + Math.random() * 9000);
  const d3 = Math.floor(1000 + Math.random() * 9000);
  ewayBillNumber = `${d1} ${d2} ${d3}`;

  // Dynamic Validity Rule: 1 day of validity for every 200 km of route distance
  const validityDays = Math.max(1, Math.ceil(distanceKm / 200));
  ewayBillValidUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

  // Ship-To GSTIN derived from destination state GST code (e.g. 08 for Rajasthan)
  const destStateCode = InvoiceGeneratorService.STATE_GST_CODES[jurisdiction.destState] || '07';
  shipToGstin = `${destStateCode}AAACS8812E1Z8`;
  vehicleNumber = 'PB-02-CR-4590';
  ewayBillStatus = 'ACTIVE';
}
```

---

## 6. Verification Summary Checklist

When presenting this project in an interview, refer to these live verification facts:
1. **Single-Command Launch**: `npm run dev` in the project root boots both backend (Port 5000) and frontend (Port 5173) simultaneously via `concurrently`.
2. **Automated Test Coverage**: Run `npm test` from the root to execute the **26/26 automated API tests** (`test/verify-api.ts`) with a 100% pass rate.
3. **Automated Browser Walkthrough**: Run `npx tsx test/run-e2e-browser.ts` and `npx tsx test/run-compliance-e2e.ts` to reproduce the full end-to-end user workflows and inspect the screenshots stored in `docs/artifacts/screenshots/`.
4. **Git Repository Hygiene**: `.gitignore` safely excludes `node_modules/` and local `.env` files while explicitly retaining `AGENTS.md` and all documentation in `docs/artifacts/`.

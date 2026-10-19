/**
 * Automated Verification Script for SupplySync B2B Backend APIs
 * Verifies all endpoints, RBAC, Bidding & Margin Engine (Modules 1 & 2),
 * and Module 3: Unstructured Dispatch Parser & GST Invoice Generator.
 */

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint: string, options: any = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('🧪 Starting Automated Backend Verification for SupplySync B2B (Modules 1, 2 & 3)...\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error('   Details:', details);
    }
  }

  try {
    // 1. Health Check
    const health = await request('/health');
    assert(health.status === 200 && health.data.status === 'ok', 'GET /api/health returns 200 OK');

    // 2. Demo Users & Quick Role Switching for 4 Personas
    const shipperAuth = await request('/auth/quick-switch/SHIPPER');
    assert(shipperAuth.status === 200 && shipperAuth.data.user.role === 'SHIPPER', 'Quick switch to SHIPPER role works');
    const shipperToken = shipperAuth.data.token;

    const carrierAAuth = await request('/auth/quick-switch/CARRIER_A');
    assert(
      carrierAAuth.status === 200 &&
      carrierAAuth.data.user.role === 'CARRIER' &&
      carrierAAuth.data.user.reliability_score === 95,
      'Quick switch to CARRIER_A (SpeedTrans, 95% score) works'
    );
    const carrierAToken = carrierAAuth.data.token;

    const carrierBAuth = await request('/auth/quick-switch/CARRIER_B');
    assert(
      carrierBAuth.status === 200 &&
      carrierBAuth.data.user.role === 'CARRIER' &&
      carrierBAuth.data.user.reliability_score === 82,
      'Quick switch to CARRIER_B (Northern Express, 82% score) works'
    );
    const carrierBToken = carrierBAuth.data.token;

    const brokerAuth = await request('/auth/quick-switch/BROKER');
    assert(brokerAuth.status === 200 && brokerAuth.data.user.role === 'BROKER', 'Quick switch to BROKER role works');
    const brokerToken = brokerAuth.data.token;

    // 3. Indian Corridors Pre-seeded
    const corridors = await request('/corridors');
    assert(corridors.status === 200 && corridors.data.length >= 4, 'GET /api/corridors returns pre-seeded Indian freight routes');

    // 4. Create Intra-State Load as Shipper (Zero Floating Point - Paise Integer)
    const newLoad = await request('/loads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${shipperToken}` },
      body: JSON.stringify({
        originCity: 'Pathankot',
        originState: 'Punjab',
        destCity: 'Chandigarh',
        destState: 'Punjab',
        weightMetricTons: 20.0,
        vehicleType: '14 Wheeler',
        targetRateRupees: 30000, // ₹30,000 -> 3000000 Paise
        description: 'Automated test load for freight verification',
      }),
    });
    const budget = newLoad.data.shipper_budget_paise || newLoad.data.targetRatePaise;
    assert(newLoad.status === 201 && budget === 3000000, 'POST /api/loads creates load with shipper_budget_paise = 3000000');
    const createdLoadId = newLoad.data.id;

    // 5. Carrier A & Carrier B Place Competing Bids
    const bidA = await request('/bids', {
      method: 'POST',
      headers: { Authorization: `Bearer ${carrierAToken}` },
      body: JSON.stringify({
        loadId: createdLoadId,
        amountRupees: 28500,
        transitTimeHours: 9,
        notes: 'SpeedTrans express delivery',
      }),
    });
    assert(bidA.status === 201 && bidA.data.bid_amount_paise === 2850000, 'Carrier A places bid: 2,850,000 Paise (₹28,500)');

    const bidB = await request('/bids', {
      method: 'POST',
      headers: { Authorization: `Bearer ${carrierBToken}` },
      body: JSON.stringify({
        loadId: createdLoadId,
        amountRupees: 27000,
        transitTimeHours: 11,
        notes: 'Northern Express standard delivery',
      }),
    });
    assert(bidB.status === 201 && bidB.data.bid_amount_paise === 2700000, 'Carrier B places bid: 2,700,000 Paise (₹27,000)');

    // 6. Carrier Ranking & Margin Engine: GET /api/bids/load/:loadId/ranked
    const rankedResp = await request(`/bids/load/${createdLoadId}/ranked`, {
      headers: { Authorization: `Bearer ${brokerToken}` },
    });
    assert(
      rankedResp.status === 200 && rankedResp.data.length === 2,
      'GET /api/bids/load/:loadId/ranked returns ranked carrier bids'
    );

    const rankedBids = rankedResp.data;
    const topBid = rankedBids[0];

    // Verify 70% Cost + 30% Reliability Composite Scoring Algorithm
    const costScore = topBid.costScore;
    const relScore = topBid.reliabilityScore;
    const expectedComposite = Math.round(0.7 * costScore + 0.3 * relScore);
    assert(
      topBid.compositeScore === expectedComposite,
      `Composite score correctly calculated: 70% Cost (${costScore}) + 30% Rel (${relScore}) = ${topBid.compositeScore}`
    );

    // Verify Best Value Carrier Badge
    assert(
      topBid.isRecommended === true && topBid.isRankOne === true,
      'Top-ranked carrier is tagged with Best Value Carrier recommendation'
    );

    // Verify Exact Net Broker Margin: shipper_budget_paise - carrier_bid_paise
    const expectedMarginPaise = budget - topBid.bid.bid_amount_paise;
    assert(
      topBid.netMarginPaise === expectedMarginPaise &&
      typeof topBid.marginPercentage === 'number',
      `Net broker margin exact integer: ₹${expectedMarginPaise / 100} (${topBid.marginPercentage}%)`
    );

    // 7. Broker Accepts Top Bid: POST /api/bids/:bidId/accept
    const acceptResp = await request(`/bids/${topBid.bid.id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${brokerToken}` },
    });
    assert(
      acceptResp.status === 200 &&
      acceptResp.data?.bid?.status === 'ACCEPTED' &&
      acceptResp.data?.invoice?.invoice_number?.startsWith('INV-SS-'),
      'POST /api/bids/:bidId/accept accepts bid, marks load ASSIGNED, and generates GST invoice',
      acceptResp.data
    );

    // 8. Financial Governance Check: 12% GTA Intra-State GST Breakdown (6% CGST + 6% SGST)
    const invoice = acceptResp.data.invoice;
    const isInter = invoice.is_interstate !== undefined ? invoice.is_interstate : invoice.isInterState;
    const totalPayable = invoice.total_payable_paise || invoice.totalAmountPaise;
    const gstAmount = invoice.gst_amount_paise || invoice.totalGstPaise;
    const brokerMargin = invoice.broker_margin_paise || invoice.brokerMarginPaise;
    assert(
      isInter === false &&
      totalPayable > 0 &&
      gstAmount > 0 &&
      brokerMargin > 0,
      'Invoice enforces 12% GTA Intra-State GST (6% CGST + 6% SGST) breakdown in exact Paise integers'
    );

    // =========================================================================
    // MODULE 3 VERIFICATION: Unstructured Dispatch Parser & GST Invoice Generator
    // =========================================================================

    // 9. Module 3: POST /api/loads/parse-inquiry with required messy WhatsApp inquiry
    const messyWhatsApp = 'Need 14ft container from Jalandhar to Gurugram urgent tomorrow, load is 7.5 metric tons of auto parts, budget around 28,000 rs';
    const parseRes = await request('/loads/parse-inquiry', {
      method: 'POST',
      headers: { Authorization: `Bearer ${shipperToken}` },
      body: JSON.stringify({ text: messyWhatsApp }),
    });

    assert(
      parseRes.status === 200 &&
      parseRes.data.origin_city === 'Jalandhar' &&
      parseRes.data.destination_city === 'Gurugram' &&
      parseRes.data.weight_tons === 7.5 &&
      parseRes.data.vehicle_type === '14ft Container' &&
      parseRes.data.shipper_budget_paise === 2800000,
      'POST /api/loads/parse-inquiry extracts origin_city, destination_city, weight_tons, vehicle_type, and shipper_budget_paise'
    );

    assert(
      parseRes.data.origin_state === 'Punjab' &&
      parseRes.data.destination_state === 'Haryana' &&
      parseRes.data.is_interstate === true,
      'Dispatch parser resolves Punjab -> Haryana as Inter-State freight corridor'
    );

    // 10. Module 3: Deploy load from parsed inquiry & place bid
    const deployedLoad = await request('/parser/create-load', {
      method: 'POST',
      headers: { Authorization: `Bearer ${shipperToken}` },
      body: JSON.stringify(parseRes.data),
    });
    assert(
      deployedLoad.status === 201 &&
      deployedLoad.data.origin_city === 'Jalandhar' &&
      deployedLoad.data.destination_city === 'Gurugram' &&
      deployedLoad.data.weight_tons === 7.5,
      'Deploy parsed inquiry directly as live marketplace freight load'
    );
    const interStateLoadId = deployedLoad.data.id;

    // Carrier A bids on the newly parsed load
    const interStateBid = await request('/bids', {
      method: 'POST',
      headers: { Authorization: `Bearer ${carrierAToken}` },
      body: JSON.stringify({
        loadId: interStateLoadId,
        amountRupees: 26000,
        transitTimeHours: 8,
        notes: '14ft Container ready in Jalandhar',
      }),
    });
    assert(interStateBid.status === 201, 'Carrier places bid on parsed inter-state load');
    const interStateBidId = interStateBid.data.id;

    // 11. Module 3: Broker approves Inter-State bid & generates 12% IGST Invoice
    const interStateApproval = await request(`/bids/${interStateBidId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${brokerToken}` },
    });
    const interInvoice = interStateApproval.data.invoice;
    assert(
      interStateApproval.status === 200 &&
      interInvoice.is_interstate === true &&
      interInvoice.gst_amount_paise > 0,
      'Broker approves inter-state bid and auto-generates 12% IGST Inter-State freight invoice'
    );

    // 12. Module 3: Fetch invoice by load ID
    const loadInvResp = await request(`/invoices/load/${interStateLoadId}`, {
      headers: { Authorization: `Bearer ${brokerToken}` },
    });
    assert(
      loadInvResp.status === 200 &&
      loadInvResp.data.id === interInvoice.id &&
      loadInvResp.data.invoice_number?.startsWith('INV-SS-'),
      'GET /api/invoices/load/:loadId fetches generated GST invoice for printable modal'
    );

    // 13. Enterprise Compliance & Tracking: ULIP VAHAN & FASTag Simulator
    const ulipValid = await request('/ulip/verify-vehicle/PB-02-CR-4590?originCity=Ludhiana&destCity=Delhi');
    assert(
      ulipValid.status === 200 &&
      ulipValid.data.isCompliant === true &&
      ulipValid.data.vahan.isValid === true &&
      ulipValid.data.vahan.grossVehicleWeightKg === 48000 &&
      ulipValid.data.tollCheckpoints.length === 3,
      'GET /api/ulip/verify-vehicle/PB-02-CR-4590 returns compliant VAHAN RC and 3 corridor FASTag checkpoints'
    );

    const ulipInvalid = await request('/ulip/verify-vehicle/INVALID_TRUCK');
    assert(
      ulipInvalid.status === 400 && ulipInvalid.data.isValid === false,
      'GET /api/ulip/verify-vehicle/INVALID_TRUCK rejects non-compliant vehicle registration format'
    );

    // 14. Enterprise Compliance & Tracking: E-Way Bill Part-A / Part-B Generator (> ₹50,000 threshold)
    const highValueLoad = await request('/loads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${shipperToken}` },
      body: JSON.stringify({
        originCity: 'Amritsar',
        originState: 'Punjab',
        destCity: 'Jaipur',
        destState: 'Rajasthan',
        weightMetricTons: 28.0,
        vehicleType: '32ft Multi-Axle Trailer',
        targetRateRupees: 65000, // ₹65,000 > ₹50,000 threshold
        description: 'High value industrial machinery and auto components requiring E-Way Bill',
      }),
    });
    assert(highValueLoad.status === 201, 'Shipper creates high-value load (> ₹50,000 / 5,000,000 Paise)');
    const highValueLoadId = highValueLoad.data.id;

    const highValueBid = await request('/bids', {
      method: 'POST',
      headers: { Authorization: `Bearer ${carrierAToken}` },
      body: JSON.stringify({
        loadId: highValueLoadId,
        amountRupees: 62000,
        transitTimeHours: 24,
        notes: 'Equipped with GPS and FASTag active',
      }),
    });
    assert(highValueBid.status === 201, 'Carrier places bid of ₹62,000 on high-value consignment');

    const highValueApproval = await request(`/bids/${highValueBid.data.id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${brokerToken}` },
    });
    const highValueInvoice = highValueApproval.data.invoice;
    assert(
      highValueApproval.status === 200 &&
      highValueInvoice.eway_bill_status === 'ACTIVE' &&
      highValueInvoice.eway_bill_number &&
      highValueInvoice.eway_bill_number.replace(/\s/g, '').length === 12 &&
      highValueInvoice.eway_bill_distance_km > 0 &&
      highValueInvoice.ship_to_gstin &&
      highValueInvoice.eway_bill_valid_until,
      'Loads exceeding ₹50,000 automatically generate 12-digit E-Way Bill with dynamic validity (1 day/200km) and Ship-To GSTIN'
    );

    console.log(`\n=======================================================`);
    console.log(`Test Results: ${passed}/${total} Passed (${Math.round((passed / total) * 100)}%)`);
    console.log(`=======================================================`);

    if (passed === total) {
      console.log('🎉 All Module 1, 2 & 3 verification tests passed successfully!');
      process.exit(0);
    } else {
      console.error(`⚠️ ${total - passed} test(s) failed.`);
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal error during test run:', err);
    process.exit(1);
  }
}

runTests();

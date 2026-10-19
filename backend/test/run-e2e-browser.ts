import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function runBrowserE2E() {
  console.log('🚀 Launching Playwright Browser End-to-End Verification Test...');

  const screenshotsDir = path.resolve('..', 'docs', 'artifacts', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  try {
    // 1. Navigate to SupplySync Portal
    console.log('📍 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 2. Switch to Shipper Persona
    console.log('👤 Step 1: Switching to Shipper persona (Punjab Agro Exporters)...');
    await page.click('button:has-text("Shipper")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '1-shipper-dashboard.png') });

    // 3. Open Smart Paste Inquiry Modal
    console.log('✨ Step 2: Opening Smart Paste Inquiry (WhatsApp/Email) modal...');
    await page.click('button:has-text("Smart Paste Inquiry")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, '2-smart-paste-modal.png') });

    // 4. Select WhatsApp Sample Inquiry and Parse
    console.log('📱 Step 3: Selecting WhatsApp 14ft container sample message and parsing...');
    await page.click('button:has-text("WhatsApp (Jalandhar → Gurugram 14ft Container)")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Parse Unstructured Text")');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(screenshotsDir, '3-parsed-payload.png') });

    // 5. Deploy Load as Live Marketplace Load
    console.log('🚚 Step 4: Deploying parsed inquiry directly to marketplace...');
    await page.click('button:has-text("Deploy as Live Marketplace Load")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '4-load-deployed.png') });

    // 6. Switch to Carrier A Persona
    console.log('🚛 Step 5: Switching to Carrier A persona (SpeedTrans, 95% rating)...');
    await page.click('button:has-text("Carrier A")');
    await page.waitForTimeout(1500);

    // 7. Find Open Load and Click Submit Bid
    console.log('💰 Step 6: Placing carrier bid on Jalandhar -> Gurugram load...');
    const submitBidBtn = page.locator('button:has-text("Submit Bid")').first();
    await submitBidBtn.waitFor({ state: 'visible', timeout: 10000 });
    await submitBidBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, '5-carrier-bidding-modal.png') });

    // Fill Bidding Form
    await page.fill('input[type="number"] >> nth=0', '26500'); // ₹26,500
    await page.fill('input[type="number"] >> nth=1', '10'); // 10 Hours
    await page.fill('textarea', '14ft container dedicated vehicle available at Jalandhar transport hub. Express SLA guaranteed.');
    await page.click('button:has-text("Confirm & Place Bid")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '6-carrier-bid-submitted.png') });

    // 8. Switch to Freight Broker Persona
    console.log('📊 Step 7: Switching to Freight Broker persona (SupplySync command center)...');
    await page.click('button:has-text("Freight Broker")');
    await page.waitForTimeout(1500);

    // Select the Jalandhar -> Gurugram load in Broker left list
    const brokerLoadItem = page.locator('span:has-text("Jalandhar → Gurugram")').first();
    await brokerLoadItem.waitFor({ state: 'visible', timeout: 10000 });
    await brokerLoadItem.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '7-broker-ranking-engine.png') });

    // 9. Approve & Dispatch Load
    console.log('📑 Step 8: Approving bid and generating GST Freight Invoice...');
    const approveBtn = page.locator('button:has-text("Approve & Dispatch")').first();
    await approveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await approveBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '8-gst-dispatch-invoice.png') });

    console.log('🎉 Browser E2E verification test completed with 100% success!');
    console.log(`📸 8 Screenshots saved to: ${screenshotsDir}`);
  } catch (err) {
    console.error('❌ Browser E2E Test Failed:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runBrowserE2E();

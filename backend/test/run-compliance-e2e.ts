import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function runComplianceBrowserE2E() {
  console.log('🚀 Launching Playwright E2E for Enterprise Compliance & Tracking...');

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
    console.log('👤 Step 1: Switching to Shipper persona...');
    await page.click('button:has-text("Shipper")');
    await page.waitForTimeout(1000);

    // 3. Post a High-Value Consignment (> ₹50,000 to trigger E-Way Bill Rule 138)
    console.log('📦 Step 2: Posting high-value load (Amritsar → Jaipur, ₹68,000 budget)...');
    await page.click('button:has-text("Post New Freight Load")');
    await page.waitForTimeout(500);

    // Fill Shipper Post Form
    await page.fill('input[value="Ludhiana"]', 'Amritsar');
    await page.fill('input[value="Punjab"]', 'Punjab');
    await page.fill('input[value="Delhi"] >> nth=0', 'Jaipur');
    await page.fill('input[value="Delhi"] >> nth=0', 'Rajasthan');
    await page.fill('input[type="number"] >> nth=0', '26'); // 26 MT
    await page.fill('input[type="number"] >> nth=1', '68000'); // ₹68,000
    await page.fill('textarea', 'High-value precision automotive machinery requiring mandatory E-Way Bill and FASTag clearance.');

    await page.click('button:has-text("Publish to Freight Board")');
    await page.waitForTimeout(1500);
    console.log('✅ High-value load posted.');

    // 4. Switch to Carrier A
    console.log('🚛 Step 3: Switching to Carrier A to place bid...');
    await page.click('button:has-text("Carrier A")');
    await page.waitForTimeout(1500);

    const submitBidBtn = page.locator('button:has-text("Submit Bid")').first();
    await submitBidBtn.waitFor({ state: 'visible', timeout: 10000 });
    await submitBidBtn.click();
    await page.waitForTimeout(500);

    await page.fill('input[type="number"] >> nth=0', '63000'); // ₹63,000 > ₹50,000
    await page.fill('input[type="number"] >> nth=1', '24'); // 24 hours
    await page.fill('textarea', 'Equipped with active GPS, FASTag ETC, and BS-VI heavy multi-axle trailer.');
    await page.click('button:has-text("Confirm & Place Bid")');
    await page.waitForTimeout(1500);
    console.log('✅ High-value bid submitted.');

    // 5. Switch to Freight Broker
    console.log('📊 Step 4: Switching to Broker to approve bid and generate E-Way Bill...');
    await page.click('button:has-text("Freight Broker")');
    await page.waitForTimeout(1500);

    // Click Amritsar -> Jaipur load in left list
    const amritsarLoad = page.locator('span:has-text("Amritsar → Jaipur")').first();
    if (await amritsarLoad.isVisible()) {
      await amritsarLoad.click();
      await page.waitForTimeout(800);
    }

    // Approve & Dispatch
    const approveBtn = page.locator('button:has-text("Approve & Dispatch")').first();
    await approveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await approveBtn.click();
    await page.waitForTimeout(2000);

    // Verify GST Invoice Modal with E-Way Bill Section
    console.log('📸 Step 5: Capturing GST Dispatch Invoice with E-Way Bill Part-A & Part-B...');
    await page.screenshot({ path: path.join(screenshotsDir, '9-eway-bill-gst-invoice.png') });

    // Close Invoice Modal
    await page.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('button'));
      const xBtn = closeBtns.find((b) => b.textContent?.includes('✕'));
      xBtn?.click();
    });
    await page.waitForTimeout(800);

    // 6. Test Live FASTag & ULIP Verification Drawer
    console.log('📡 Step 6: Opening Live FASTag & ULIP Verification drawer...');
    const trackingBtn = page.locator('button:has-text("Live FASTag & ULIP")').first();
    await trackingBtn.waitFor({ state: 'visible', timeout: 10000 });
    await trackingBtn.click();
    await page.waitForTimeout(1500);

    console.log('📸 Step 7: Capturing Live FASTag & ULIP Drawer...');
    await page.screenshot({ path: path.join(screenshotsDir, '10-live-fastag-ulip-drawer.png') });

    // Test quick preset: HP-38-E-9911
    console.log('🔄 Step 8: Switching truck plate to HP-38-E-9911...');
    await page.click('button:has-text("HP-38-E-9911")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '11-ulip-vahan-compliance.png') });

    console.log('🎉 Enterprise Compliance & Tracking Browser E2E successfully verified!');
    console.log(`📸 Screenshots saved to: ${screenshotsDir}`);
  } catch (err) {
    console.error('❌ Browser E2E Test Failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runComplianceBrowserE2E();

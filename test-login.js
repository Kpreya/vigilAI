const pw = require('playwright');

(async () => {
  console.log('Starting headless browser test...');
  const browser = await pw.chromium.launch();
  const page = await browser.newPage();
  
  // Track console messages
  page.on('console', msg => {
    console.log(`[Browser Console ${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  // Track page errors
  page.on('pageerror', error => {
    console.log(`[Browser PageError] ${error.message}`);
  });
  
  // Catch unhandled promise rejections in the page
  await page.exposeFunction('logUnhandledRejection', (reason) => {
    console.log(`[Unhandled Rejection in Page] ${reason}`);
  });
  await page.addInitScript(() => {
    window.addEventListener('unhandledrejection', event => {
      window.logUnhandledRejection(event.reason?.message || event.reason || 'Unknown rejection');
    });
  });

  page.on('requestfailed', request => {
    console.log(`[Request Failed] ${request.url()}: ${request.failure().errorText}`);
  });

  console.log('Navigating to login.html...');
  await page.goto('http://localhost:8000/login.html');
  
  console.log('Waiting for load...');
  await page.waitForTimeout(2000);
  
  console.log('Filling out form...');
  try {
    await page.fill('#email', 'admin@vigilai.com');
    await page.fill('#password', 'TestPass123!');
  } catch (e) {
    console.log('Could not fill form:', e.message);
  }
  
  console.log('Clicking submit...');
  try {
    await page.click('button[type="submit"]');
  } catch (e) {
    console.log('Could not click submit:', e.message);
  }
  
  await page.waitForTimeout(2000);
  
  console.log('Current URL:', page.url());
  
  await browser.close();
  console.log('Test complete.');
})();

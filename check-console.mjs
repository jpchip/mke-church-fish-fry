import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  const logs = [];
  const errors = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    logs.push({ type, text });
    console.log(`[${type.toUpperCase()}]`, text);
  });
  
  page.on('pageerror', error => {
    errors.push(error.toString());
    console.log('[PAGE ERROR]', error.toString());
  });
  
  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      failure: request.failure()?.errorText
    });
    console.log('[NETWORK ERROR]', request.url(), request.failure()?.errorText);
  });
  
  try {
    console.log('Navigating to http://localhost:4173/browse...');
    await page.goto('http://localhost:4173/browse', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Wait a bit for any async operations
    await page.waitForTimeout(2000);
    
    console.log('\n=== PAGE CONTENT ===');
    const content = await page.evaluate(() => document.body.innerText);
    console.log(content.substring(0, 500));
    
    console.log('\n=== FINAL URL ===');
    console.log(page.url());
    
    console.log('\n=== SUMMARY ===');
    console.log('Console logs:', logs.length);
    console.log('Page errors:', errors.length);
    console.log('Network errors:', networkErrors.length);
    
  } catch (error) {
    console.error('Navigation error:', error.message);
  }
  
  await browser.close();
})();

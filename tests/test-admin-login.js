const path = require('path');

(async () => {
  const fs = require('fs');
  const puppeteerModule = await import('puppeteer');
  const puppeteer = puppeteerModule.default || puppeteerModule;

  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  const execPath = candidates.find(p => fs.existsSync(p));
  const launchOpts = execPath ? { headless: true, executablePath: execPath, args: ['--disable-web-security'] } : { headless: true };

  const browser = await puppeteer.launch(launchOpts);
  const page = await browser.newPage();
  const filePath = 'file:' + path.resolve(__dirname, '..', 'admin.html');

  try {
    await page.goto(filePath);

    // Set credentials via localStorage (same as console snippet)
    await page.evaluate(() => {
      return (async () => {
        const hash = async s => {
          const enc = new TextEncoder();
          const buf = await crypto.subtle.digest('SHA-256', enc.encode(s));
          return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
        };
        localStorage.setItem('kareroAdminUserHash', await hash('Fred'));
        localStorage.setItem('kareroAdminPassHash', await hash('1234'));
        return true;
      })();
    });

    // Refresh to let script pick up credentials
    await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] });

    // Fill form (script sets autocomplete but no autofill now)
    await page.type('#adminUsername', 'Fred');
    await page.type('#adminPassword', '1234');
    await Promise.all([
      page.click('#adminLoginForm button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 3000 }).catch(() => {})
    ]);

    // Check if dashboard visible
    const dashboardVisible = await page.evaluate(() => {
      const dash = document.getElementById('adminDashboard');
      return dash && !dash.classList.contains('hidden');
    });

    console.log('Dashboard visible:', dashboardVisible);
    await browser.close();
    process.exit(dashboardVisible ? 0 : 2);
  } catch (err) {
    console.error(err);
    await browser.close();
    process.exit(1);
  }
})();

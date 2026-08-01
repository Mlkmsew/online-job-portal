const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  const htmlPath = path.join(__dirname, '..', 'sample_resume.html');
  if (!fs.existsSync(htmlPath)) {
    console.error('sample_resume.html not found. Run the generator first.');
    process.exit(1);
  }

  // Attempt to use a local Chrome if provided via CHROME_PATH or common install paths,
  // otherwise fall back to Puppeteer's bundled Chromium.
  const findLocalChrome = () => {
    const envPath = process.env.CHROME_PATH || process.env.LOCAL_CHROME_PATH;
    if (envPath && fs.existsSync(envPath)) return envPath;
    const platform = process.platform;
    const candidates = [];
    if (platform === 'win32') {
      candidates.push('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
      candidates.push('C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe');
    } else if (platform === 'darwin') {
      candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
    } else {
      candidates.push('/usr/bin/google-chrome');
      candidates.push('/usr/bin/chromium-browser');
      candidates.push('/usr/bin/chrome');
    }
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  };

  const localChrome = findLocalChrome();
  const launchOptions = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };
  if (localChrome) {
    console.log('Using local Chrome at', localChrome);
    launchOptions.executablePath = localChrome;
    launchOptions.headless = true;
  } else {
    console.log('No local Chrome found; using Puppeteer bundled Chromium (if available).');
  }

  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
    const out = path.join(__dirname, '..', 'sample_resume.pdf');
    await page.pdf({ path: out, format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });
    console.log('PDF generated at', out);
  } finally {
    await browser.close();
  }
})();

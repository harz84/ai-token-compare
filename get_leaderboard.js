const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://arena.ai/leaderboard/agent', { waitUntil: 'networkidle' });
  // Wait for the table/list to render. The skeleton has aria-busy="true"
  await page.waitForTimeout(5000); // Give it 5s to load data
  
  // Extract all text that looks like model names or just dump the text of the page
  const text = await page.evaluate(() => document.body.innerText);
  console.log(text);
  await browser.close();
})();

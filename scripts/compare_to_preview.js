// Screenshot each page on the Letter preview and on a local copy, then count differing pixels.
// usage: node scripts/compare_to_preview.js <preview-url> <local-url> [/path ...]
// Pages default to "/". "/404" is compared against <local>/404.html.
// Needs playwright, pngjs and pixelmatch; if they live elsewhere, set NODE_PATH to that node_modules.
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch').default || require('pixelmatch');

const [preview, local, ...paths] = process.argv.slice(2);
const WIDTHS = [1440, 1000, 390];

async function shoot(browser, url, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const problems = [];
  page.on('pageerror', (e) => problems.push(e.message));
  page.on('response', (r) => r.status() >= 400 && !r.url().includes('does-not-exist') && problems.push(`${r.status()} ${r.url()}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  for (let y = 0; y < 30000; y += 600) { // trigger every scroll reveal
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(100);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  const png = PNG.sync.read(await page.screenshot({ fullPage: true }));
  await page.close();
  return { png, problems };
}

(async () => {
  const browser = await chromium.launch();
  let failed = false;
  for (const path of paths.length ? paths : ['/']) {
    for (const width of WIDTHS) {
      const [a, b] = await Promise.all([
        shoot(browser, preview + (path === '/404' ? '/does-not-exist' : path), width),
        shoot(browser, local + (path === '/404' ? '/404.html' : path), width),
      ]);
      let result;
      if (a.png.width !== b.png.width || a.png.height !== b.png.height) {
        result = `SIZE ${a.png.width}x${a.png.height} vs ${b.png.width}x${b.png.height}`;
        failed = true;
      } else {
        const n = pixelmatch(a.png.data, b.png.data, null, a.png.width, a.png.height, { threshold: 0.1 });
        result = `${n} px differ (${((100 * n) / (a.png.width * a.png.height)).toFixed(3)}%)`;
        if (n) failed = true;
      }
      if (b.problems.length) failed = true;
      console.log(`${path.padEnd(20)} ${String(width).padStart(4)}px  ${result}${b.problems.length ? '  local problems: ' + b.problems.join('; ') : ''}`);
    }
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();

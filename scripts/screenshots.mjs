import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT =
  process.env.SHOT_DIR ||
  '/private/tmp/claude-501/-Users-bobby-lab-website/c08e15ea-56a0-432e-ae89-5f8e497f3cc2/scratchpad/shots';
mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:4321';

const routes = [
  ['home', '/'],
  ['research', '/research'],
  ['publications', '/publications'],
  ['software', '/software'],
  ['software-taco', '/software/taco'],
  ['people', '/people'],
  ['person-fk', '/people/fredrik-kjolstad'],
  ['pub-detail', '/publications/oopsla17'],
  ['join', '/join'],
  ['about', '/about'],
  ['accessibility', '/accessibility'],
  ['notfound', '/nope-404'],
];

const viewports = { desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 } };

const problems = [];
const browser = await chromium.launch();

for (const [vname, vp] of Object.entries(viewports)) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  for (const [name, path] of routes) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
    const resp = await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${OUT}/${vname}-${name}.png`, fullPage: vname === 'desktop' });
    if (errors.length) problems.push(`${vname} ${path} [${resp?.status()}]: ${errors.join(' | ')}`);
    await page.close();
  }
  await ctx.close();
}

// Dark theme home + publications
const dctx = await browser.newContext({ viewport: viewports.desktop, colorScheme: 'dark' });
for (const [name, path] of [
  ['home', '/'],
  ['publications', '/publications'],
  ['software', '/software'],
  ['people', '/people'],
]) {
  const page = await dctx.newPage();
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('theme', 'dark'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/dark-${name}.png`, fullPage: true });
  await page.close();
}
await dctx.close();

await browser.close();

console.log('SHOTS_DIR=' + OUT);
if (problems.length) {
  console.log('CONSOLE_PROBLEMS:');
  for (const p of problems) console.log('  - ' + p);
} else {
  console.log('No console errors on any route.');
}

// Regression harness for the mobile hero bugs (URL-bar viewport dynamics).
// Run: node hero-mobile-test.mjs   (expects preview on :4399)
import { chromium, devices } from 'playwright';

const URL = 'http://localhost:4399/';
const browser = await chromium.launch();
let failures = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

// Wait out the home intro (html[data-home-intro] present while it runs).
async function ready(page) {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute('data-home-intro'),
    null, { timeout: 15000 },
  );
  await page.waitForTimeout(300);
}

// Scroll instantly to progress≈0.5 inside the transition band.
async function toMidBand(page) {
  await page.evaluate(() => {
    const section = document.querySelector('.hero-scroll');
    const stage = document.querySelector('.hero-stage');
    const headerH = parseFloat(getComputedStyle(stage).top) || 72;
    const pinned = window.innerHeight - headerH; // same math as metrics()
    const travel = Math.max(1, section.offsetHeight - pinned);
    const scrub = Math.max(1, travel * 0.8);
    const start = section.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top: start + scrub * 0.5, behavior: 'instant' });
  });
  await page.waitForTimeout(60); // let update() run, but beat the 110ms settle
}

const progressOf = (page) =>
  page.evaluate(() =>
    parseFloat(getComputedStyle(document.querySelector('.hero-scroll'))
      .getPropertyValue('--hero-progress')),
  );

// ---- Test 1: progress must not depend on window.innerHeight -----------------
// Fake the URL-bar collapse: innerHeight grows 80px, resize fires. Progress
// (and scrollY, 500ms later) must be unchanged.
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await ready(page);
  await toMidBand(page);
  const before = await progressOf(page);
  const yBefore = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => {
    // Cancel the settle legitimately pending from the scroll above (wheel =
    // real user intent), so any glide observed below is resize-caused.
    window.dispatchEvent(new WheelEvent('wheel'));
    Object.defineProperty(window, 'innerHeight', {
      value: window.innerHeight + 80, configurable: true,
    });
    window.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(50);
  const after = await progressOf(page);
  check('T1a progress stable across innerHeight change',
    Math.abs(after - before) < 0.005, `before=${before} after=${after}`);
  await page.waitForTimeout(600); // would-be settle window
  const yAfter = await page.evaluate(() => window.scrollY);
  check('T1b resize does not trigger a programmatic settle scroll',
    Math.abs(yAfter - yBefore) < 2, `y ${yBefore} -> ${yAfter}`);
  await page.close();
}

// ---- Test 2: no idle-settle on touch devices --------------------------------
// Mid-band on an emulated iPhone: scrollY must rest where the user left it
// (no programmatic glide that would re-show the URL bar).
{
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  await ready(page);
  await toMidBand(page);
  const y0 = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(900);
  const y1 = await page.evaluate(() => window.scrollY);
  check('T2  no settle glide on touch device',
    Math.abs(y1 - y0) < 2, `y ${y0} -> ${y1}`);
  await ctx.close();
}

// ---- Test 3: desktop settle still works --------------------------------------
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await ready(page);
  await toMidBand(page);
  await page.waitForTimeout(1200); // idle 110ms + smooth glide
  const p = await progressOf(page);
  check('T3  desktop settle commits to an endpoint',
    p < 0.02 || p > 0.98, `p=${p}`);
  await page.close();
}

await browser.close();
console.log(failures ? `\n${failures} failure(s)` : '\nall green');
process.exit(failures ? 1 : 0);

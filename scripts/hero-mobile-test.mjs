// Regression harness for the mobile hero bugs (URL-bar viewport dynamics).
// Run: node hero-mobile-test.mjs   (expects preview on :4399)
import { chromium, devices } from "playwright";

const URL = "http://localhost:4399/";
const browser = await chromium.launch();
let failures = 0;
const check = (name, ok, detail) => {
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`,
  );
  if (!ok) failures++;
};

// Wait out the home intro (html[data-home-intro] present while it runs).
async function ready(page) {
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-home-intro"),
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(300);
}

// Scroll instantly to progress≈0.5 inside the transition band.
async function toMidBand(page) {
  await page.evaluate(() => {
    const section = document.querySelector(".hero-scroll");
    const stage = document.querySelector(".hero-stage");
    const headerH = parseFloat(getComputedStyle(stage).top) || 72;
    const pinned = window.innerHeight - headerH; // same math as metrics()
    const travel = Math.max(1, section.offsetHeight - pinned);
    const scrub = Math.max(1, travel * 0.8);
    const start =
      section.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top: start + scrub * 0.5, behavior: "instant" });
  });
  await page.waitForTimeout(60); // let update() run, but beat the 110ms settle
}

const progressOf = (page) =>
  page.evaluate(() =>
    parseFloat(
      getComputedStyle(document.querySelector(".hero-scroll")).getPropertyValue(
        "--hero-progress",
      ),
    ),
  );

// ---- Test 1: progress must not depend on window.innerHeight -----------------
// Fake the URL-bar collapse: innerHeight grows 80px, resize fires. Progress
// (and scrollY, 500ms later) must be unchanged.
{
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  await ready(page);
  await toMidBand(page);
  const before = await progressOf(page);
  const yBefore = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => {
    // Cancel the settle legitimately pending from the scroll above (wheel =
    // real user intent), so any glide observed below is resize-caused.
    window.dispatchEvent(new WheelEvent("wheel"));
    Object.defineProperty(window, "innerHeight", {
      value: window.innerHeight + 80,
      configurable: true,
    });
    window.dispatchEvent(new Event("resize"));
  });
  await page.waitForTimeout(50);
  const after = await progressOf(page);
  check(
    "T1a progress stable across innerHeight change",
    Math.abs(after - before) < 0.005,
    `before=${before} after=${after}`,
  );
  await page.waitForTimeout(600); // would-be settle window
  const yAfter = await page.evaluate(() => window.scrollY);
  check(
    "T1b resize does not trigger a programmatic settle scroll",
    Math.abs(yAfter - yBefore) < 2,
    `y ${yBefore} -> ${yAfter}`,
  );
  await page.close();
}

// ---- Test 2: two-phase touch settle ------------------------------------------
// Phase 1 (idle, no finger): visuals tween to an endpoint, scrollY does NOT
// move (any programmatic scroll with no finger down re-shows the mobile URL
// bar). Phase 2 (next touchstart): scrollY commits invisibly. Plus: no settle
// at all while a finger is held down.
{
  const ctx = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await ctx.newPage();
  const progress = () =>
    page.evaluate(() =>
      parseFloat(
        getComputedStyle(
          document.querySelector(".hero-scroll"),
        ).getPropertyValue("--hero-progress"),
      ),
    );
  await ready(page);
  await toMidBand(page);
  const y0 = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(700);
  const yIdle = await page.evaluate(() => window.scrollY);
  const pIdle = await progress();
  check(
    "T2a settle tweens visuals WITHOUT moving scrollY",
    Math.abs(yIdle - y0) < 2 && (pIdle < 0.02 || pIdle > 0.98),
    `y ${y0} -> ${yIdle}, p=${pIdle}`,
  );
  await page.touchscreen.tap(195, 400);
  await page.waitForTimeout(150);
  const ySnap = await page.evaluate(() => window.scrollY);
  check(
    "T2b next touch commits the deferred snap",
    Math.abs(ySnap - y0) > 50,
    `y ${y0} -> ${ySnap}`,
  );

  // Held finger: touchStart via CDP (no touchEnd), scroll mid-band, idle out.
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 195, y: 400 }],
  });
  await toMidBand(page);
  await page.waitForTimeout(800);
  const pHeld = await progress();
  check(
    "T2c no settle while the finger is held down",
    pHeld > 0.2 && pHeld < 0.8,
    `p=${pHeld}`,
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForTimeout(700);
  const pReleased = await progress();
  check(
    "T2d settle fires on release",
    pReleased < 0.02 || pReleased > 0.98,
    `p=${pReleased}`,
  );
  await ctx.close();
}

// ---- Test 3: desktop settle still works --------------------------------------
{
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  await ready(page);
  await toMidBand(page);
  await page.waitForTimeout(1200); // idle 110ms + smooth glide
  const p = await progressOf(page);
  check(
    "T3  desktop settle commits to an endpoint",
    p < 0.02 || p > 0.98,
    `p=${p}`,
  );
  await page.close();
}

await browser.close();
console.log(failures ? `\n${failures} failure(s)` : "\nall green");
process.exit(failures ? 1 : 0);

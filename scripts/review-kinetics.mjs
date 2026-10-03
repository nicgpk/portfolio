import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, rename, writeFile } from "node:fs/promises";

process.env.PLAYWRIGHT_BROWSERS_PATH = new URL(
  "../node_modules/.cache/ms-playwright",
  import.meta.url,
).pathname.replace(/^\/(\w:)/, "$1");
const browser = await chromium.launch({ headless: true });
await mkdir("review/after", { recursive: true });
await mkdir(".local-preview/motion-recording", { recursive: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "no-preference",
  recordVideo: {
    dir: ".local-preview/motion-recording",
    size: { width: 1440, height: 900 },
  },
});
await context.addInitScript(() => {
  window.__rafRequests = 0;
  const request = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) => {
    window.__rafRequests++;
    return request(callback);
  };
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const checks = [];
const nojs = await browser.newContext({ javaScriptEnabled: false });
const staticPage = await nojs.newPage();
await staticPage.goto("http://127.0.0.1:4183/projects.html");
await expect(staticPage.locator("#graphic-rate")).toBeDisabled();
await expect(
  staticPage.locator("[data-rate-graphic] noscript .rate-explanation"),
).toContainText("Static example");
await expect(staticPage.locator("[data-rate-net]")).toHaveText("$114.75");
await nojs.close();
checks.push(
  "No-JavaScript rate inputs are inactive and the fixed calculation is explicitly labeled.",
);
await page.goto("http://127.0.0.1:4183/projects.html");
await page.evaluate(() => document.fonts.ready);
const disc = page.locator(".kinetic-disc");
await page.waitForTimeout(1300);
const idleFrames = await page.evaluate(() => window.__rafRequests);
await page.waitForTimeout(350);
assert.equal(await page.evaluate(() => window.__rafRequests), idleFrames);
const beforePointer = await disc.evaluate(
  (el) => getComputedStyle(el).transform,
);
const box = await disc.boundingBox();
await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.25);
await expect
  .poll(() => disc.evaluate((el) => getComputedStyle(el).transform))
  .not.toBe(beforePointer);
await page.waitForTimeout(1300);
const settledFrames = await page.evaluate(() => window.__rafRequests);
await page.waitForTimeout(350);
assert.equal(await page.evaluate(() => window.__rafRequests), settledFrames);
checks.push(
  "Pointer spring changes the graphic, then animation frames stop at rest.",
);
const initialScroll = await page.evaluate(() => scrollY);
await page.mouse.wheel(0, 600);
await expect
  .poll(() => page.evaluate(() => scrollY))
  .toBeGreaterThan(initialScroll + 400);
checks.push(
  "Native wheel scrolling advances the document without interception.",
);

for (let i = 0; i < 8; i++) {
  const button = page.locator(`[data-program-select="${i}"]`);
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(`[data-program-panel="${i}"]`)).toBeVisible();
  assert.equal(await page.locator("[data-program-panel]:visible").count(), 1);
  assert.equal(
    await page.locator(`.program-node.selected[data-symbol="${i}"]`).count(),
    1,
  );
}
checks.push(
  "All eight programs are keyboard selectable; descriptions and highlighted glyphs agree.",
);
await page.locator('[data-program-select="2"]').click();
await page.waitForTimeout(900);

const rate = page.locator("[data-rate-graphic]");
await rate.scrollIntoViewIfNeeded();
await page.waitForTimeout(900);
await expect(rate.locator("[data-rate-net]")).toHaveText("$114.75");
await rate.locator("[name=mobile]").uncheck();
await expect(rate.locator("[data-rate-net]")).toHaveText("$127.50");
await rate.locator("[name=mega]").uncheck();
await expect(rate.locator("[data-rate-net]")).toHaveText("$150.00");
await rate.locator("[name=mobile]").check();
await expect(rate.locator("[data-rate-net]")).toHaveText("$135.00");
await rate.locator("[name=mega]").check();
await rate.locator("#graphic-rate").fill("19.99");
await expect(rate.locator("[data-rate-net]")).toHaveText("$15.29");
await rate.locator("#graphic-rate").fill("0");
await expect(rate.locator("[data-rate-net]")).toHaveText("$0.00");
assert.equal(
  await rate.locator("[data-net-bar]").evaluate((el) => el.style.width),
  "0%",
);
for (const value of ["", "-1", "1.111", "1000001"]) {
  await rate.locator("#graphic-rate").fill(value);
  await expect(rate.locator("[data-rate-net]")).toHaveText("—");
  await expect(rate.locator("#graphic-rate")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
}
await rate.locator("#graphic-rate").fill("150");
await expect(rate.locator("[data-rate-net]")).toHaveText("$114.75");
checks.push(
  "Work-index rate graphic handles both toggles, sequential cents, zero, empty, negative, precision and upper limits.",
);

const flow = page.locator("[data-flow-preview]");
await flow.scrollIntoViewIfNeeded();
for (const index of [1, 2, 0]) {
  const control = flow.locator(`[data-flow-select="${index}"]`);
  await control.focus();
  await page.keyboard.press("Space");
  await expect(control).toHaveAttribute("aria-pressed", "true");
  await expect(flow.locator(`[data-flow-panel="${index}"]`)).toBeVisible();
  await page.waitForTimeout(950);
  const x = await flow
    .locator(".flow-signal")
    .evaluate(
      (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41,
    );
  assert.ok(Math.abs(x - index * 220) < 0.1);
}
checks.push(
  "Keyboard workflow selection moves the signal to the matching environment, rollout and review example.",
);

const motion = page.locator("[data-motion-toggle]");
await motion.focus();
await page.keyboard.press("Enter");
await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
await expect(motion).toHaveText("Resume motion");
assert.equal(
  await disc.evaluate((el) => getComputedStyle(el).transform),
  "none",
);
await page.reload();
await expect(motion).toHaveText("Resume motion");
const pausedFrames = await page.evaluate(() => window.__rafRequests);
await page.mouse.move(1100, 500);
await page.mouse.wheel(0, 200);
await page.waitForTimeout(350);
assert.equal(await page.evaluate(() => window.__rafRequests), pausedFrames);
await motion.click();
await expect(page.locator("html")).toHaveAttribute("data-motion", "on");
await page.emulateMedia({ reducedMotion: "reduce" });
await expect(motion).toBeDisabled();
await expect(motion).toHaveText("Motion off");
assert.equal(
  await disc.evaluate((el) => getComputedStyle(el).transform),
  "none",
);
await page.locator('[data-program-select="7"]').focus();
await page.keyboard.press("Enter");
await expect(page.locator('[data-program-panel="7"]')).toBeVisible();
checks.push(
  "Keyboard pause persists after reload, stops animation frames and resumes; OS reduced motion disables effects while controls still work.",
);

assert.deepEqual(errors, []);
await writeFile(
  "review/kinetic-checks.json",
  JSON.stringify(
    {
      browser: "Chromium on Windows",
      checks,
      errors,
      limitation:
        "Recorded interactions are a local review, not real-device or screen-reader validation.",
    },
    null,
    2,
  ),
);
const videoPath = await page.video().path();
await context.close();
await rename(videoPath, "review/after/motion-demo.webm");
await browser.close();
console.log(JSON.stringify({ checks, errors }, null, 2));

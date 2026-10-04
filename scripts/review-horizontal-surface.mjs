import { chromium, expect } from "./review-browser.mjs";
import { writeFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const report = { passed: false, errors: [] };
page.on("pageerror", (error) => report.errors.push(error.message));
await mkdir("review/horizontal-surface", { recursive: true });
try {
  await page.goto("http://127.0.0.1:4183/");
  await page.evaluate(() => document.fonts.ready);
  const root = page.locator(".project-showcase"),
    rail = page.locator(".showcase-track"),
    position = page.locator("[data-showcase-position]");
  const geometry = () =>
    root.evaluate((el) => {
      const stage = el.querySelector(".showcase-stage");
      return {
        height: el.getBoundingClientRect().height,
        y: scrollY,
        tailSpace:
          el.getBoundingClientRect().bottom -
          stage.getBoundingClientRect().bottom -
          parseFloat(getComputedStyle(el).paddingBottom),
        position: getComputedStyle(stage).position,
        runway:
          el.querySelector(".showcase-runway")?.getBoundingClientRect()
            .height || 0,
      };
    });
  const initial = await geometry();
  report.initial = initial;
  assert.equal(
    initial.runway,
    0,
    "The gallery must not reserve a vertical scroll runway.",
  );
  assert.ok(
    initial.tailSpace < 2,
    "The section must end after its content and normal padding.",
  );
  assert.notEqual(initial.position, "sticky");
  await page.setViewportSize({ width: 1379, height: 1244 });
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => scrollY), 0);
  await page.setViewportSize({ width: 1440, height: 900 });
  const align = () =>
    rail.evaluate((el) =>
      scrollTo({
        top: scrollY + el.getBoundingClientRect().top - 120,
        behavior: "instant",
      }),
    );
  await rail.focus();
  await page.keyboard.press("Home");
  await align();
  const entry = await geometry();
  await page.mouse.move(12, 500);
  await page.mouse.wheel(0, 120);
  await expect(position).toHaveText("2 of 3");
  await page.waitForTimeout(550);
  const after = await geometry();
  assert.ok(
    Math.abs(after.y - entry.y) < 1,
    "Margin wheel input must move only the horizontal rail.",
  );
  assert.ok(
    Math.abs(after.height - entry.height) < 1,
    "Scrolling must not grow the section.",
  );
  const nativeInputs = await rail.evaluate((el) =>
    ["ctrlKey", "metaKey", "altKey", "shiftKey", "horizontal"].map((key) => {
      const event = new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        clientY: 400,
        deltaY: 120,
        ...(key === "horizontal" ? { deltaX: 120 } : { [key]: true }),
      });
      el.dispatchEvent(event);
      return { key, prevented: event.defaultPrevented };
    }),
  );
  assert.ok(
    nativeInputs.every((input) => !input.prevented),
    "Modified and horizontal input must remain native.",
  );
  await page.mouse.wheel(0, 120);
  await expect(position).toHaveText("3 of 3");
  await page.waitForTimeout(550);
  const endY = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 120);
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(endY + 20);
  await rail.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  await expect(position).toHaveText("2 of 3");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(position).toHaveText("2 of 3");
  assert.equal((await geometry()).runway, 0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(position).toHaveText("2 of 3");
  await rail.focus();
  await page.keyboard.press("Home");
  const details = page.locator("#home-evidence-growth details");
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
  assert.ok(
    (await geometry()).height > entry.height,
    "Source context may grow the actual content.",
  );
  await align();
  await page.mouse.move(12, 500);
  const readingY = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 120);
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(readingY + 20);
  await expect(position).toHaveText("1 of 3");
  await details.locator("summary").click();
  assert.ok(Math.abs((await geometry()).height - entry.height) < 1);
  await page.locator("[data-motion-toggle]").click();
  assert.equal((await geometry()).runway, 0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal((await geometry()).runway, 0);
  await page.setViewportSize({ width: 1440, height: 600 });
  assert.equal((await geometry()).runway, 0);
  assert.deepEqual(report.errors, []);
  Object.assign(report, {
    passed: true,
    noRunway: true,
    noStickyStage: true,
    marginWheel: { before: entry, after },
    nativeInputs,
    boundaryRelease: true,
    rapidKeyboard: true,
    responsiveSelection: true,
    resizeOutsideGallery: true,
    expandedContextScrollsNormally: true,
    preferencesAndShortScreen: true,
  });
  console.log(JSON.stringify(report));
} finally {
  await writeFile(
    "review/horizontal-surface/checks.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  await browser.close();
}

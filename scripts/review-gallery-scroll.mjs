import { chromium, expect } from "./review-browser.mjs";
import { writeFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://127.0.0.1:4183/");
await page.evaluate(() => document.fonts.ready);
const root = page.locator(".project-showcase"),
  rail = page.locator(".showcase-track"),
  position = page.locator("[data-showcase-position]");
await expect(root).toHaveClass(/is-scroll-gallery/);
// Responsive changes outside the gallery must not pull the visitor into it.
await page.setViewportSize({ width: 1379, height: 1244 });
await page.waitForTimeout(300);
assert.equal(await page.evaluate(() => scrollY), 0);
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(300);
assert.equal(await page.evaluate(() => scrollY), 0);
await rail.focus();
await page.keyboard.press("Home");
const entry = await page.evaluate(() => scrollY);
await page.mouse.move(12, 500);
await page.mouse.wheel(0, 630);
await expect(position).toHaveText("2 of 3");
await expect
  .poll(() => rail.evaluate((el) => Math.round(el.getBoundingClientRect().top)))
  .toBe(190);
const afterWheel = await page.evaluate(() => scrollY);
assert.ok(
  afterWheel > entry + 500,
  "Margin wheel should progress the native page scene.",
);
// Keyboard commands must work without waiting for a rendering frame between keys.
await rail.focus();
await page.keyboard.press("Home");
await page.keyboard.press("ArrowRight");
await expect(position).toHaveText("2 of 3");
await page.setViewportSize({ width: 390, height: 844 });
await expect(root).not.toHaveClass(/is-scroll-gallery/);
await expect(position).toHaveText("2 of 3");
await page.setViewportSize({ width: 1440, height: 900 });
await expect(root).toHaveClass(/is-scroll-gallery/);
await expect(position).toHaveText("2 of 3");
// Taller source context must become ordinary readable page content.
await rail.focus();
await page.keyboard.press("Home");
await expect(position).toHaveText("1 of 3");
const details = page.locator("#home-evidence-growth details");
await details.locator("summary").click();
await expect(details).toHaveAttribute("open", "");
await expect(root).not.toHaveClass(/is-scroll-gallery/);
const expanded = await details.evaluate((el) => ({
  height: el.clientHeight,
  tableWidth: el.querySelector("table").scrollWidth,
  width: el.querySelector("table").clientWidth,
}));
assert.ok(expanded.height > 100 && expanded.tableWidth <= expanded.width + 1);
await details.locator("summary").click();
await expect(root).toHaveClass(/is-scroll-gallery/);
await expect(position).toHaveText("1 of 3");
await page.locator("[data-motion-toggle]").click();
await expect(root).not.toHaveClass(/is-scroll-gallery/);
await page.locator("[data-motion-toggle]").click();
await expect(root).toHaveClass(/is-scroll-gallery/);
await page.emulateMedia({ reducedMotion: "reduce" });
await expect(root).not.toHaveClass(/is-scroll-gallery/);
await page.emulateMedia({ reducedMotion: "no-preference" });
await expect(root).toHaveClass(/is-scroll-gallery/);
await page.setViewportSize({ width: 1440, height: 600 });
await expect(root).not.toHaveClass(/is-scroll-gallery/);
assert.deepEqual(errors, []);
const report = {
  passed: true,
  marginWheel: { entry, afterWheel },
  rapidKeyboard: true,
  responsiveSelection: true,
  resizeOutsideGallery: true,
  expandedContext: expanded,
  livePauseAndPreferences: true,
  shortViewport: true,
  errors,
};
await mkdir("review/gallery-refinement", { recursive: true });
await writeFile(
  "review/gallery-refinement/scroll-checks.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(report);
await browser.close();

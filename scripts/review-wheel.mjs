import { chromium, expect } from "./review-browser.mjs";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
process.env.PLAYWRIGHT_BROWSERS_PATH = fileURLToPath(
  new URL("../node_modules/.cache/ms-playwright", import.meta.url),
);
const browser = await chromium.launch();
const results = [];
try {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion,
    });
    await page.goto("http://127.0.0.1:4183/");
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".showcase-track").evaluate((el) =>
      window.scrollTo({
        top: scrollY + el.getBoundingClientRect().top - 120,
        behavior: "instant",
      }),
    );
    const track = page.locator(".showcase-track");
    const box = await track.boundingBox();
    const pinned = await page
      .locator(".project-showcase")
      .evaluate((root) => root.classList.contains("is-scroll-gallery"));
    if (pinned)
      await page
        .locator(".showcase-intro")
        .evaluate((el) =>
          window.scrollTo({
            top:
              scrollY +
              el.getBoundingClientRect().bottom -
              document.querySelector(".site-nav").getBoundingClientRect()
                .bottom -
              16,
            behavior: "instant",
          }),
        );
    await page.mouse.move(
      pinned ? 12 : box.x + box.width / 2,
      Math.min(600, box.y + 220),
    );
    const start = await page.evaluate(() => scrollY);
    const step = pinned ? 630 : 120;
    await page.mouse.wheel(0, step);
    await expect(page.locator("[data-showcase-position]")).toHaveText("2 of 3");
    await page.waitForTimeout(550);
    if (pinned)
      assert.ok(
        (await page.evaluate(() => scrollY)) > start + 500,
        "Page-margin wheel input advances native page progress through the pinned gallery.",
      );
    else
      assert.ok(
        Math.abs((await page.evaluate(() => scrollY)) - start) < 2,
        "Reduced-motion wheel keeps the native horizontal fallback.",
      );
    await page.mouse.wheel(0, step);
    await expect(page.locator("[data-showcase-position]")).toHaveText("3 of 3");
    await page.waitForTimeout(550);
    const end = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 120);
    await expect
      .poll(() => page.evaluate(() => scrollY))
      .toBeGreaterThan(end + 20);
    await track.focus();
    await page.keyboard.press("Home");
    await expect(page.locator("[data-showcase-position]")).toHaveText("1 of 3");
    await track.evaluate((el) =>
      window.scrollTo({
        top: scrollY + el.getBoundingClientRect().top - 120,
        behavior: "instant",
      }),
    );
    await page.mouse.move(box.x + box.width / 2, 300);
    await page.waitForTimeout(500);
    const beginning = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, -120);
    await expect
      .poll(() => page.evaluate(() => scrollY))
      .toBeLessThan(beginning - 20);
    results.push({
      reducedMotion,
      nativeScrollScene: pinned,
      wheelAdvances: true,
      endReleasesToPage: true,
      startReleasesToPage: true,
      keyboardHome: true,
    });
    await page.close();
  }
  await writeFile(
    "review/browserbase-revision/wheel-after.json",
    JSON.stringify({ passed: true, results }, null, 2),
  );
  console.log(JSON.stringify({ passed: true, results }));
} finally {
  await browser.close();
}

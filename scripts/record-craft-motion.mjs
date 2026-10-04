import { chromium, expect } from "./review-browser.mjs";
import { rename } from "node:fs/promises";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  recordVideo: {
    dir: "review/craft-motion",
    size: { width: 1440, height: 1000 },
  },
});
const page = await context.newPage();
try {
  await page.goto("http://127.0.0.1:4183/");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  const stage = await page.locator(".hero-stage").boundingBox();
  await page.mouse.move(
    stage.x + stage.width * 0.15,
    stage.y + stage.height * 0.85,
  );
  await page.mouse.move(
    stage.x + stage.width * 0.85,
    stage.y + stage.height * 0.85,
    { steps: 30 },
  );
  await page.waitForTimeout(800);
  await page.locator("#project-gallery").scrollIntoViewIfNeeded();
  await page.locator('[data-preview-choice="1"]').first().click();
  await page.waitForTimeout(700);
  await page.locator('[data-preview-choice="2"]').first().click();
  await page.waitForTimeout(700);
  await page.locator("#project-gallery").focus();
  await page.keyboard.press("ArrowRight");
  const mega = page.locator("[data-discount-preview] [name=mega]");
  await mega.uncheck();
  await expect(page.locator("[data-preview-net]")).toHaveText("$135.00");
  await page.waitForTimeout(900);
  await mega.check();
  await page.waitForTimeout(900);
  await page.locator("#project-gallery").focus();
  await page.keyboard.press("ArrowRight");
  const dev = page.locator(".showcase-card--dev");
  await dev.locator('[data-preview-choice="0"]').click();
  await page.waitForTimeout(700);
  await dev.locator('[data-preview-choice="1"]').click();
  await page.waitForTimeout(700);
  await dev.locator('[data-preview-choice="2"]').click();
  await page.waitForTimeout(1200);
} finally {
  const video = page.video();
  await context.close();
  await rename(await video.path(), "review/craft-motion/motion.webm");
  await browser.close();
}

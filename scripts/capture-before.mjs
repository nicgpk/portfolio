import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
process.env.PLAYWRIGHT_BROWSERS_PATH = new URL(
  "../node_modules/.cache/ms-playwright",
  import.meta.url,
).pathname.replace(/^\/(\w:)/, "$1");
await mkdir("review/before", { recursive: true });
const browser = await chromium.launch({ headless: true });
for (const width of [1440, 390]) {
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    reducedMotion: "reduce",
  });
  for (const name of [
    "index",
    "projects",
    "partner-growth-programs",
    "discounting",
    "dev-portal",
  ]) {
    await page.goto(`http://127.0.0.1:4183/originals/${name}.html`);
    await page.waitForTimeout(700);
    await page.evaluate(() =>
      document
        .querySelectorAll(".reveal")
        .forEach((e) => e.classList.add("visible")),
    );
    await page.screenshot({
      path: `review/before/${name}-${width}.png`,
      fullPage: true,
    });
    if (name === "index")
      await page.screenshot({
        path: `review/before/first-viewport-${width}.png`,
      });
  }
  await page.close();
}
await browser.close();
console.log("Before screenshots captured at 1440 and 390 pixels.");

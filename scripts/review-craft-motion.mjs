import { chromium } from "./review-browser.mjs";
import { mkdir, writeFile } from "node:fs/promises";
const phase = process.argv[2] || "after";
const browser = await chromium.launch();
await mkdir(`review/craft-motion/${phase}`, { recursive: true });
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    for (const route of [
      "index",
      "projects",
      "partner-growth-programs",
      "discounting",
      "dev-portal",
      "resume",
    ]) {
      await page.goto(`http://127.0.0.1:4183/${route}.html`);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `review/craft-motion/${phase}/${route}-${width}.png`,
        fullPage: true,
      });
      if (route === "index") {
        await page.screenshot({
          path: `review/craft-motion/${phase}/opening-${width}.png`,
        });
        for (const kind of ["growth", "discount", "dev"])
          await page
            .locator(`.showcase-card--${kind} .concept-preview`)
            .screenshot({
              path: `review/craft-motion/${phase}/${kind}-preview-${width}.png`,
            });
      }
    }
    await page.close();
  }
  await writeFile(
    `review/craft-motion/${phase}/capture.json`,
    JSON.stringify({ phase, widths: [390, 1440] }, null, 2),
  );
} finally {
  await browser.close();
}

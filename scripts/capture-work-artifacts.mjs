import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";

process.env.PLAYWRIGHT_BROWSERS_PATH = new URL(
  "../node_modules/.cache/ms-playwright",
  import.meta.url,
).pathname.replace(/^\/(\w:)/, "$1");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const captures = [
  ["partner-growth-programs", ".hero-product-frame", "growth"],
  ["discounting", ".disc-product-frame", "discount"],
  ["dev-portal", '.dev-ui[aria-label="Review and deploy confirmation"]', "dev"],
];
const evidence = [];
for (const [route, selector, name] of captures) {
  await page.goto(`http://127.0.0.1:4183/originals/${route}.html`);
  await page.evaluate(() => document.fonts.ready);
  const artifact = page.locator(selector).first();
  await artifact.scrollIntoViewIfNeeded();
  await artifact.locator("img").evaluateAll(async (images) => {
    await Promise.all(
      images.map(async (img) => {
        img.loading = "eager";
        await img.decode();
      }),
    );
  });
  const rect = await artifact.boundingBox();
  const path = `images/work-${name}-original.jpg`;
  await artifact.screenshot({
    path,
    type: "jpeg",
    quality: 90,
    animations: "disabled",
    style: ".header,.scroll-progress,.skip-link {visibility:hidden}",
  });
  evidence.push({
    path,
    source: `originals/${route}.html`,
    selector,
    width: Math.ceil(rect.width),
    height: Math.ceil(rect.height),
    note: "Rendered original portfolio artifact; existing illustrative UI data, not measured outcomes.",
  });
}
await browser.close();
await writeFile(
  "review/work-artifacts.json",
  JSON.stringify(evidence, null, 2),
);
console.log(JSON.stringify(evidence, null, 2));

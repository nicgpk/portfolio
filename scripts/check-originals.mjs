import { chromium, expect } from "./review-browser.mjs";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
process.env.PLAYWRIGHT_BROWSERS_PATH = new URL(
  "../node_modules/.cache/ms-playwright",
  import.meta.url,
).pathname.replace(/^\/(\w:)/, "$1");
const browser = await chromium.launch();
const report = { artifacts: [], brokenLinks: [] };
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    await page.goto(
      "http://127.0.0.1:4183/originals/partner-growth-programs.html",
    );
    const triggers = page.locator("[data-pb-open]");
    for (let i = 0; i < (await triggers.count()); i++) {
      await triggers.nth(i).click();
      await expect(page.locator("[data-pb-modal]")).toBeVisible();
      const images = await page
        .locator("[data-pb-ex] img")
        .evaluateAll((els) => els.map((el) => el.src));
      for (const url of images) {
        const response = await page.request.get(url);
        report.artifacts.push({
          width,
          pattern: i,
          url,
          status: response.status(),
        });
        assert.equal(response.status(), 200, `Original playbook image ${url}`);
      }
      await page.keyboard.press("Escape");
      await expect(triggers.nth(i)).toBeFocused();
    }
    await page.close();
  }
  const page = await browser.newPage();
  for (const name of [
    "index",
    "projects",
    "partner-growth-programs",
    "discounting",
    "dev-portal",
  ]) {
    await page.goto(`http://127.0.0.1:4183/originals/${name}.html`);
    const urls = await page
      .locator("a[href],img[src],script[src],link[href]")
      .evaluateAll((els) =>
        els
          .map((e) => e.href || e.src)
          .filter((u) => u.startsWith(location.origin)),
      );
    for (const url of [...new Set(urls)]) {
      const response = await page.request.get(url);
      if (response.status() !== 200)
        report.brokenLinks.push({ name, url, status: response.status() });
    }
  }
  assert.equal(report.brokenLinks.length, 0);
  console.log(
    "Original artifact links, seven playbook patterns, dynamic images and Escape/focus restoration passed at 390 and 1440 pixels.",
  );
} finally {
  await writeFile(
    "review/original-artifact-checks.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  await browser.close();
}

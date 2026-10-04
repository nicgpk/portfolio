import { chromium } from "./review-browser.mjs";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const phase = process.argv[2] || "after";
assert.ok(["before", "after"].includes(phase));
const browser = await chromium.launch();
const checks = [];
await mkdir(`review/link-colors/${phase}`, { recursive: true });
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
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
      const links = page.locator(
        ".text-link, .case-scroll, .showcase-case-link, .hero-footnote > a, .case-section-nav a, .footer-email",
      );
      const colors = await links.evaluateAll((els) =>
        els.map((el) => ({
          text: el.textContent.trim(),
          color: getComputedStyle(el).color,
        })),
      );
      if (phase === "after") {
        for (const link of colors) {
          const rgb = link.color.match(/\d+/g).slice(0, 3).map(Number);
          assert.ok(
            Math.max(...rgb) - Math.min(...rgb) <= 6,
            `${route}: secondary accent on ${link.text}: ${link.color}`,
          );
        }
        if (route === "discounting") {
          const link = page.locator(".case-scroll");
          await link.hover();
          assert.equal(
            await link.evaluate((el) => getComputedStyle(el).color),
            "rgb(32, 32, 32)",
          );
          assert.equal(
            await link.evaluate((el) => getComputedStyle(el).borderBottomColor),
            "rgb(255, 81, 10)",
          );
          await link.focus();
          assert.equal(
            await link.evaluate((el) => getComputedStyle(el).outlineStyle),
            "solid",
          );
          await link.blur();
        }
      }
      checks.push({ route, width, links: colors });
      if (route === "discounting") {
        await page.mouse.move(0, 0);
        await page.screenshot({
          path: `review/link-colors/${phase}/discounting-opening-${width}.png`,
        });
        await page
          .locator(".case-framing")
          .screenshot({
            path: `review/link-colors/${phase}/discounting-links-${width}.png`,
          });
      }
    }
    await page.close();
  }
  await writeFile(
    `review/link-colors/${phase}/checks.json`,
    JSON.stringify(checks, null, 2),
  );
  console.log(`${phase}: checked text links on six routes at two widths`);
} finally {
  await browser.close();
}

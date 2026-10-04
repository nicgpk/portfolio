import { chromium, expect } from "./review-browser.mjs";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
const browser = await chromium.launch();
const report = { viewports: [], errors: [], passed: false };
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    page.on("pageerror", (error) => report.errors.push(error.message));
    await page.goto("http://127.0.0.1:4183/index.html");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("#hero-title")).toContainText("Nicholas Gwee.");
    await expect(page.locator("#hero-title")).toContainText(
      "Product Design Lead.",
    );
    await expect(page.locator(".landscape-label,.studio-divider")).toHaveCount(
      0,
    );
    await expect(page.locator(".footer-landscape")).toBeVisible();
    await page.locator(".footer-email").scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        page
          .locator(".footer-landscape")
          .evaluate((img) => img.complete && img.naturalWidth > 0),
      )
      .toBe(true);
    const panels = [
      ["growth", ["$521M+", "12%", "8", "4", "7"]],
      ["discount", ["10–12%", "−3%", "#1", "1.5 yrs"]],
      ["dev", ["6m 8s", "68.8", "4.4/5"]],
    ];
    for (let index = 0; index < panels.length; index++) {
      const [kind, values] = panels[index];
      await page.locator("#project-gallery").focus();
      await page.keyboard.press("Home");
      for (let i = 0; i < index; i++) await page.keyboard.press("ArrowRight");
      const card = page.locator(`.showcase-card--${kind}`);
      assert.deepEqual(
        await card.locator(".evidence-metrics dd").allTextContents(),
        values,
      );
      await card.locator(".evidence-card summary").press("Enter");
      await expect(card.locator(".evidence-card details")).toHaveAttribute(
        "open",
        "",
      );
      await expect
        .poll(() =>
          card.evaluate((card) => {
            const rail = card
                .closest(".showcase-track")
                .getBoundingClientRect(),
              box = card.getBoundingClientRect();
            return (
              box.bottom <= rail.bottom &&
              box.left >= rail.left - 1 &&
              box.right <= rail.right + 1
            );
          }),
        )
        .toBe(true);
      if (kind === "growth") {
        const text = await card.locator(".evidence-card details").innerText();
        for (const metric of [
          "$233M",
          "755M+",
          "$89.7M",
          "$29M",
          "$114.2M",
          "72%",
          "$131M",
          "+10%",
          "1.8×",
          "$120M",
          "$75M",
          "$54M",
          "10,000+",
          "$67M",
          "$17M",
          "$7.5M",
          "30×",
          "+29%",
          "+32%",
          "160k+",
        ])
          assert.ok(text.includes(metric), metric);
      }
      await card.locator(".evidence-card summary").press("Enter");
    }
    report.viewports.push({
      width,
      metrics: true,
      completeCards: true,
      expandedEvidence: true,
      personalHero: true,
      footerLandscape: true,
    });
    await page.close();
  }
  for (const route of [
    "partner-growth-programs",
    "discounting",
    "dev-portal",
  ]) {
    const page = await browser.newPage({ reducedMotion: "reduce" });
    await page.goto(`http://127.0.0.1:4183/${route}.html`);
    await expect(page.locator("#evidence details")).toHaveAttribute("open", "");
    await page.close();
  }
  assert.deepEqual(report.errors, []);
  report.passed = true;
  console.log(JSON.stringify(report));
} finally {
  await writeFile(
    "review/personal-landing/checks.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  await browser.close();
}

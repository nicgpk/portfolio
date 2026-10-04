import { chromium, expect } from "./review-browser.mjs";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch(),
  report = { layouts: [], workflows: [], passed: false };
await mkdir("review/concept-expansion/after", { recursive: true });
try {
  for (const width of [320, 390, 768, 1440]) {
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
    ]) {
      await page.goto(`http://127.0.0.1:4183/${route}.html`);
      await page.evaluate(() => document.fonts.ready);
      await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
      const failures = await page.evaluate(async () =>
        (
          await axe.run(document, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
          })
        ).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      );
      assert.deepEqual(failures, [], `${width} ${route}`);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      const overflow = await page
        .locator(".concept-shell")
        .evaluateAll((els) =>
          els.some((el) => el.scrollWidth > el.clientWidth + 1),
        );
      assert.equal(overflow, false, `${route} ${width} shell overflow`);
      if (["index", "projects"].includes(route)) {
        const sizes = await page
          .locator(".preview-header h4")
          .evaluateAll((els) => els.map((el) => getComputedStyle(el).font));
        assert.equal(new Set(sizes).size, 1);
        const choices = page.locator(
          ".showcase-card--growth [data-preview-choice]",
        );
        assert.equal(await choices.count(), 8);
        for (let i = 0; i < 8; i++) {
          await choices.nth(i).click();
          await expect(
            page.locator(`.showcase-card--growth [data-preview-panel="${i}"]`),
          ).toBeVisible();
        }
        await choices.nth(7).press("Home");
        await expect(choices.first()).toBeFocused();
        await page.locator("#project-gallery").focus();
        await page.keyboard.press("ArrowRight");
        const calc = page.locator("[data-discount-preview]"),
          rate = calc.locator("[name=rate]");
        await rate.fill("200");
        await expect(calc.locator("[data-preview-net]")).toHaveText("$153.00");
        await expect(calc.locator("[data-preview-total]")).toHaveText("$47.00");
        await rate.fill("0");
        await expect(calc.locator("[data-preview-net]")).toHaveText("$0.00");
        await expect(calc.locator("[data-preview-effective]")).toHaveText("0%");
        await rate.fill("-1");
        await expect(rate).toHaveAttribute("aria-invalid", "true");
        await expect(calc.locator(".preview-rate-error")).not.toBeEmpty();
        await expect(calc.locator("[data-preview-net]")).toHaveText("$0.00");
        await rate.fill("");
        await expect(rate).toHaveAttribute("aria-invalid", "true");
        await rate.fill("150.01");
        await expect(calc.locator("[data-preview-net]")).toHaveText("$114.76");
        await rate.fill("1000000");
        await expect(calc.locator("[data-preview-net]")).toHaveText(
          "$765,000.00",
        );
        assert.equal(
          await calc.evaluate((el) => el.scrollWidth > el.clientWidth + 1),
          false,
        );
        await rate.fill("1000001");
        await expect(rate).toHaveAttribute("aria-invalid", "true");
        await rate.fill("0.01");
        await expect(calc.locator("[data-preview-net]")).toHaveText("$0.01");
        await expect(calc.locator("[data-preview-effective]")).toHaveText("0%");
        await rate.fill("150");
        await expect(calc.locator("[data-preview-total]")).toHaveText("$35.25");
        await page.locator("#project-gallery").focus();
        await page.keyboard.press("End");
        const targets = page.locator(".showcase-card--dev .preview-targets");
        await expect(targets).toContainText("#devops_safe_app");
        await expect(targets.locator("tbody tr")).toHaveCount(3);
        await expect(targets).toContainText("900s");
        report.workflows.push({
          route,
          width,
          programs: 8,
          rateValidation: true,
          centRounding: true,
          originalTargets: true,
        });
      }
      report.layouts.push({ route, width, axe: 0, overflow: false });
    }
    await page.close();
  }
  report.passed = true;
} finally {
  await writeFile(
    "review/concept-expansion/checks.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  await browser.close();
}
console.log(JSON.stringify(report));

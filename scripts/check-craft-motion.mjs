import { chromium, expect } from "./review-browser.mjs";
import assert from "node:assert/strict";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { normalizedContentText } from "./content-normalization.mjs";

const browser = await chromium.launch();
const report = {
  layouts: [],
  interactions: [],
  source: [],
  errors: [],
  passed: false,
};
const root = "review/craft-motion";
await mkdir(root, { recursive: true });
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    page.on("pageerror", (e) => report.errors.push(e.message));
    for (const route of ["index", "projects"]) {
      await page.goto(`http://127.0.0.1:4183/${route}.html`);
      await page.evaluate(() => document.fonts.ready);
      const heights = () =>
        page
          .locator(".showcase-card")
          .evaluateAll((els) =>
            els.map((el) => el.getBoundingClientRect().height),
          );
      const initial = await heights();
      assert.ok(Math.max(...initial) - Math.min(...initial) < 1);
      const growth = page.locator(".showcase-card--growth");
      const choices = growth.locator("[data-preview-choice]");
      await choices.nth(1).click();
      await expect(growth.locator('[data-preview-panel="1"]')).toBeVisible();
      await expect(
        growth.locator('[data-preview-panel="0"]'),
      ).not.toBeVisible();
      await expect(growth.locator('[data-preview-panel="1"]')).toContainText(
        "Agoda Growth Program",
      );
      await choices.nth(1).press("ArrowDown");
      await expect(choices.nth(2)).toBeFocused();
      await expect(choices.nth(2)).toHaveAttribute("aria-selected", "true");
      await choices.nth(2).press("Home");
      const after = await heights();
      after.forEach((height, i) =>
        assert.ok(
          Math.abs(height - initial[i]) < 1,
          "Selection preserves all card heights",
        ),
      );
      const discount = page.locator("[data-discount-preview]");
      await page.locator("#project-gallery").focus();
      await page.keyboard.press("Home");
      await page.keyboard.press("ArrowRight");
      const mega = discount.locator("[name=mega]"),
        mobile = discount.locator("[name=mobile]");
      await mega.uncheck();
      await expect(discount.locator("[data-preview-net]")).toHaveText(
        "$135.00",
      );
      await mobile.uncheck();
      await expect(discount.locator("[data-preview-net]")).toHaveText(
        "$150.00",
      );
      await mega.check();
      await expect(discount.locator("[data-preview-net]")).toHaveText(
        "$127.50",
      );
      await mobile.check();
      await expect(discount.locator("[data-preview-net]")).toHaveText(
        "$114.75",
      );
      await expect(discount.locator("[data-preview-effective]")).toHaveText(
        "23.5%",
      );
      assert.equal(
        await discount
          .locator("[data-preview-net-bar]")
          .evaluate((el) => el.style.getPropertyValue("--rate-width")),
        "76.5%",
      );
      const dev = page.locator(".showcase-card--dev");
      await page.locator("#project-gallery").focus();
      await page.keyboard.press("End");
      await dev.locator('[data-preview-choice="2"]').click();
      await expect(dev.locator('[data-preview-panel="2"]')).toBeVisible();
      await expect(dev.locator(".preview-review > div")).toHaveCount(6);
      await expect(dev.locator(".preview-review")).toContainText(
        "#devops_safe_app",
      );
      await dev.locator('[data-preview-choice="2"]').press("Home");
      await expect(dev.locator('[data-preview-choice="0"]')).toBeFocused();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      report.layouts.push({
        route,
        width,
        equalCards: true,
        stableSelections: true,
        overflow: false,
      });
    }
    if (width === 1440) {
      await page.goto("http://127.0.0.1:4183/");
      assert.ok(
        (await page.locator(".showcase-card").first().boundingBox()).y < 900,
        "First project appears in laptop viewport",
      );
    }
    await page.close();
  }
  report.interactions.push(
    "Program selection and keyboard tabs; all four discount combinations; deployment tabs with six source-backed review groups",
  );
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.goto("http://127.0.0.1:4183/");
  await page.evaluate(() => document.fonts.ready);
  await page.locator("#project-gallery").focus();
  await page.keyboard.press("ArrowRight");
  const mega = page.locator("[data-discount-preview] [name=mega]");
  await mega.uncheck();
  await expect
    .poll(() =>
      page
        .locator("[data-preview-net-bar]")
        .evaluate((el) => el.getAnimations().length),
    )
    .toBe(1);
  await page.locator("[data-motion-toggle]").click();
  assert.equal(
    await page
      .locator("[data-preview-net-bar]")
      .evaluate((el) => el.getAnimations().length),
    0,
  );
  await mega.check();
  await expect(page.locator("[data-preview-net]")).toHaveText("$114.75");
  assert.equal(
    await page
      .locator("[data-preview-net-bar]")
      .evaluate((el) => el.getAnimations().length),
    0,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page
      .locator(".choice-indicator")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration),
    "0s",
  );
  await page.close();
  report.interactions.push(
    "Animated bars cancel on user pause; selections and final values work with reduced motion",
  );
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto("http://127.0.0.1:4183/");
  assert.equal(
    await staticPage
      .locator(
        "[data-preview-choice]:not(:disabled),[data-discount-preview] input:not(:disabled)",
      )
      .count(),
    0,
  );
  await expect(staticPage.locator("[data-preview-net]")).toHaveText("$114.75");
  assert.equal(
    await staticPage
      .locator(".evidence-linework path")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  await context.close();
  report.interactions.push(
    "No-JavaScript examples and linework remain static and readable",
  );
  const sourcePage = await browser.newPage();
  for (const route of [
    "index",
    "projects",
    "partner-growth-programs",
    "discounting",
    "dev-portal",
    "resume",
  ]) {
    const baseline = execFileSync("git", ["show", `e2a917d:${route}.html`], {
      encoding: "utf8",
    });
    const content = await sourcePage.evaluate(
      ({ html, normalize }) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        return {
          text: (0, eval)(`(${normalize})`)(doc.body),
          links: [...doc.querySelectorAll("a[href]")]
            .map((el) => el.getAttribute("href"))
            .sort(),
        };
      },
      { html: baseline, normalize: normalizedContentText.toString() },
    );
    const current = await sourcePage.evaluate(
      ({ html, normalize }) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        return {
          text: (0, eval)(`(${normalize})`)(doc.body),
          links: [...doc.querySelectorAll("a[href]")]
            .map((el) => el.getAttribute("href"))
            .sort(),
        };
      },
      {
        html: await readFile(`${route}.html`, "utf8"),
        normalize: normalizedContentText.toString(),
      },
    );
    assert.equal(
      current.text,
      content.text,
      `${route}: narrative, roles and every reported metric/context preserved`,
    );
    assert.deepEqual(
      current.links,
      content.links,
      `${route}: all destinations preserved`,
    );
    report.source.push(route);
  }
  await sourcePage.close();
  assert.deepEqual(report.errors, []);
  report.passed = true;
  console.log(JSON.stringify(report));
} finally {
  await writeFile(`${root}/checks.json`, JSON.stringify(report, null, 2));
  await browser.close();
}

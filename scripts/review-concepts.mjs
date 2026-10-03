import { chromium, expect } from "./review-browser.mjs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
process.env.PLAYWRIGHT_BROWSERS_PATH = fileURLToPath(
  new URL("../node_modules/.cache/ms-playwright", import.meta.url),
);
const baseline =
  process.env.CONCEPT_BASELINE || "63d1ff9e3236cb743e27875ee358c1b9c7a99692";
const base = "http://127.0.0.1:4183";
const directory = "review/concept-refinement/after";
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const report = {
  baseline,
  fonts: [],
  content: [],
  interactions: [],
  static: [],
  errors: [],
  passed: false,
};
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: "reduce",
  });
  const externalFonts = [];
  page.on("request", (request) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(request.url()))
      externalFonts.push(request.url());
  });
  page.on("pageerror", (error) => report.errors.push(error.message));
  for (const route of [
    "index",
    "projects",
    "partner-growth-programs",
    "discounting",
    "dev-portal",
    "resume",
  ]) {
    await page.goto(`${base}/${route}.html`);
    await page.evaluate(() => document.fonts.ready);
    const fonts = await page.evaluate(() => ({
      body: getComputedStyle(document.querySelector(".nav-identity"))
        .fontFamily,
      mono: getComputedStyle(
        document.querySelector(".eyebrow") ||
          document.querySelector(".resume-kicker") ||
          document.querySelector(".header-logo-mark"),
      ).fontFamily,
      loaded: [...document.fonts]
        .filter((f) => f.status === "loaded")
        .map((f) => ({ family: f.family, weight: f.weight })),
    }));
    assert.match(fonts.body, /Manrope/);
    assert.ok(
      fonts.loaded.some((f) => f.family === "Manrope"),
      route,
    );
    assert.ok(
      fonts.loaded.some(
        (f) => f.family === '"Ubuntu Mono"' || f.family === "Ubuntu Mono",
      ),
      route,
    );
    report.fonts.push({ route, ...fonts });
    const before = execFileSync("git", ["show", `${baseline}:${route}.html`], {
      encoding: "utf8",
    });
    const after = await readFile(`${route}.html`, "utf8");
    const audit = await page.evaluate(
      ({ before, after, route }) => {
        const parse = (text) =>
          new DOMParser().parseFromString(text, "text/html");
        const a = parse(before),
          b = parse(after);
        const text = (e) => e.textContent.replace(/\s+/g, " ").trim();
        const selectors =
          route === "index"
            ? [
                ".studio-hero",
                ".showcase-card-link",
                ".showcase-caption",
                ".about-section",
                ".archive",
                ".folio-footer",
              ]
            : route === "projects" || route === "resume"
              ? ["body"]
              : [
                  ".case-hero",
                  ".case-framing",
                  ".decisions-section",
                  ".evidence-card",
                  ".supporting-artifacts",
                  ".case-next",
                  ".folio-footer",
                ];
        const sections = selectors.map((selector) => ({
          selector,
          unchanged:
            JSON.stringify([...a.querySelectorAll(selector)].map(text)) ===
            JSON.stringify([...b.querySelectorAll(selector)].map(text)),
        }));
        const links = (doc) =>
          [...doc.querySelectorAll("a[href]")].map((e) =>
            e.getAttribute("href"),
          );
        const programs = (doc) =>
          [...doc.querySelectorAll("[data-program]")].map((e) => ({
            name: e.dataset.name,
            category: e.dataset.category,
            title: text(e.querySelector(".growth-row-main strong")),
            description: text(e.querySelector(".growth-row-description")),
            mechanics: text(e.querySelector(".program-detail")),
          }));
        const values = (doc) =>
          [
            ...doc.querySelectorAll(
              "[data-developer] input,[data-developer] select",
            ),
          ].map((e) => ({
            name: e.name,
            value: e.getAttribute("value"),
            min: e.getAttribute("min"),
            max: e.getAttribute("max"),
            // Normalize the escaped literal hyphen: intended allowed names stay the same.
            pattern: e.getAttribute("pattern")?.replace(/\\-/g, "-"),
            options: [...e.querySelectorAll("option")].map(text),
          }));
        return {
          route,
          sections,
          linksUnchanged: JSON.stringify(links(a)) === JSON.stringify(links(b)),
          programsUnchanged:
            JSON.stringify(programs(a)) === JSON.stringify(programs(b)),
          developerSettingsUnchanged:
            JSON.stringify(values(a)) === JSON.stringify(values(b)),
          ...(route === "index"
            ? {
                heroMarkupUnchanged:
                  a.querySelector(".studio-hero").outerHTML ===
                  b.querySelector(".studio-hero").outerHTML,
              }
            : {}),
        };
      },
      { before, after, route },
    );
    assert.ok(
      audit.sections.every((s) => s.unchanged) &&
        audit.linksUnchanged &&
        audit.programsUnchanged &&
        audit.developerSettingsUnchanged,
      JSON.stringify(audit),
    );
    if (route === "index") assert.ok(audit.heroMarkupUnchanged);
    report.content.push(audit);
  }
  assert.deepEqual(externalFonts, []);
  for (const font of [
    "manrope-latin.woff2",
    "ubuntu-mono-regular.woff2",
    "ubuntu-mono-bold.woff2",
  ]) {
    const file = await stat(`fonts/${font}`);
    report.fonts.push({ file: font, bytes: file.size });
  }
  await page.goto(`${base}/partner-growth-programs.html`);
  await page.locator("[data-program-search]").fill("10–15%");
  await expect(page.locator("[data-program]:visible")).toHaveCount(1);
  await expect(page.locator("[data-program-heading]")).toHaveText(
    "Matching programs",
  );
  await page.locator("[data-program]:visible summary").press("Enter");
  await expect(page.locator("[data-program]:visible")).toHaveAttribute(
    "open",
    "",
  );
  await page.locator("[data-program]:visible summary").press("Enter");
  assert.equal(
    await page.locator("[data-program]:visible").getAttribute("open"),
    null,
  );
  await page.locator("[data-program-search]").fill("does not exist");
  await expect(page.locator("[data-program-empty]")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).press("Enter");
  await expect(page.locator("[data-program]:visible")).toHaveCount(8);
  await expect(page.locator("[data-program-search]")).toBeFocused();
  await expect(page.locator("[data-program-heading]")).toHaveText(
    "All programs",
  );
  await expect(page.locator("[data-program-empty]")).toBeHidden();
  const detailsLabel = page.locator(".program-open-label .sr-only").first();
  assert.ok(
    (await detailsLabel.boundingBox()).width <= 1,
    "Disclosure accessibility label must be visually hidden.",
  );
  report.interactions.push(
    "Program mechanics search, Enter disclosure/collapse, visible empty state, clear filters and returned focus passed.",
  );
  await page.goto(`${base}/discounting.html`);
  await expect(page.locator("[data-ledger] strong")).toHaveText([
    "$150.00",
    "$127.50",
    "$114.75",
  ]);
  await expect(page.locator("[data-ledger] small")).toHaveText([
    "Starting balance",
    "15% of $150.00 · −$22.50",
    "10% of $127.50 · −$12.75",
  ]);
  await expect(page.locator("[data-total-cut]")).toHaveText(
    "Total discount · $35.25",
  );
  for (const [rate, balances, detail] of [
    ["19.99", ["$19.99", "$16.99", "$15.29"], "10% of $16.99 · −$1.70"],
    ["0", ["$0.00", "$0.00", "$0.00"], "10% of $0.00 · −$0.00"],
    [
      "1000000",
      ["$1,000,000.00", "$850,000.00", "$765,000.00"],
      "10% of $850,000.00 · −$85,000.00",
    ],
  ]) {
    await page.locator("#room-rate").fill(rate);
    await expect(page.locator("[data-ledger] strong")).toHaveText(balances);
    await expect(page.locator("[data-ledger] small").last()).toHaveText(detail);
    const proportions = await page
      .locator("[data-ledger] i")
      .evaluateAll((es) =>
        es.map((e) =>
          Number.parseFloat(e.style.getPropertyValue("--rate-width")),
        ),
      );
    for (let i = 0; i < proportions.length; i++) {
      const value = Number(balances[i].replace(/[$,]/g, ""));
      const expected = Number(rate) ? (value / Number(rate)) * 100 : 0;
      assert.ok(Math.abs(proportions[i] - expected) < 0.0001);
    }
  }
  await page.locator("#room-rate").fill("150");
  await page.locator("[name=mega]").uncheck();
  await expect(page.locator("[data-ledger] strong")).toHaveText([
    "$150.00",
    "$135.00",
  ]);
  await expect(page.locator("[data-ledger] small").last()).toHaveText(
    "10% of $150.00 · −$15.00",
  );
  await page.locator("#room-rate").fill("150.001");
  await expect(page.locator("[data-net]")).toHaveText("—");
  await expect(page.locator("[data-total-cut]")).toHaveText(
    "Total discount unavailable",
  );
  await expect(page.locator("[data-ledger] > div")).toHaveCount(0);
  await page.getByRole("button", { name: "Reset example" }).click();
  await expect(page.locator("[data-net]")).toHaveText("$114.75");
  report.interactions.push(
    "Remaining-balance ledger, calculation bases, cuts, totals and exact bar proportions passed at zero, cent-rounded rates and the maximum; invalid values clear stale results.",
  );
  await page.goto(`${base}/dev-portal.html`);
  await page.locator("[name=environment]").fill("space invalid");
  await page.locator("[data-deploy-next]").click();
  await expect(page.locator('[data-step="0"]')).toBeVisible();
  await expect(page.locator("[data-deploy-status]")).toContainText(
    "highlighted field",
  );
  await page.locator("[name=environment]").fill("staging-mesh");
  await page.locator("[data-deploy-next]").click();
  await expect(page.locator("[data-step-label][aria-current]")).toHaveText(
    /Rollout/,
  );
  await expect(page.locator("[data-step-label][data-complete]")).toHaveCount(1);
  await page.locator("[data-deploy-next]").click();
  await expect(page.locator("[data-deploy-review] > div")).toHaveCount(6);
  await expect(page.locator("[data-deploy-review]")).toContainText(
    "HK: 10 · SG: 10 · AM: 10 replicas",
  );
  await page.locator("[data-deploy-back]").click();
  await page.locator("[data-deploy-back]").click();
  await expect(page.locator("[data-step-label][data-complete]")).toHaveCount(0);
  await expect(page.locator("[name=environment]")).toHaveValue("staging-mesh");
  report.interactions.push(
    "Invalid-name guidance, current/completed steps, complete six-row review and back-navigation with values retained passed.",
  );
  const staticPage = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 900 },
  });
  await staticPage.goto(`${base}/partner-growth-programs.html`);
  await expect(staticPage.locator("[data-program-search]")).toBeDisabled();
  await expect(staticPage.locator("[data-program]:visible")).toHaveCount(8);
  await staticPage.locator("[data-program]").first().locator("summary").click();
  await expect(staticPage.locator("[data-program]").first()).toHaveAttribute(
    "open",
    "",
  );
  await staticPage.goto(`${base}/discounting.html`);
  await expect(staticPage.locator("[data-ledger] strong")).toHaveText([
    "$150.00",
    "$127.50",
    "$114.75",
  ]);
  await staticPage.goto(`${base}/dev-portal.html`);
  await expect(staticPage.locator(".deploy-stage:visible")).toHaveCount(3);
  await expect(staticPage.locator("[data-deploy-review] > div")).toHaveCount(6);
  report.static.push(
    "Eight native disclosures, honest disabled filtering, ordered static balances and all three developer stages with a complete review passed without JavaScript.",
  );
  await staticPage.close();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const route of [
      "partner-growth-programs",
      "discounting",
      "dev-portal",
    ]) {
      await page.goto(`${base}/${route}.html`);
      await page.evaluate(() => document.fonts.ready);
      await page.locator(".concept-section").screenshot({
        path: `${directory}/concept-${route}-${width}.png`,
        style: ".site-nav,.skip-link,.motion-control{visibility:hidden}",
      });
    }
    await page.goto(`${base}/partner-growth-programs.html`);
    await page.locator("[data-program]").nth(1).locator("summary").click();
    await page.locator(".discovery-ui").screenshot({
      path: `${directory}/growth-details-${width}.png`,
      style: ".site-nav,.skip-link,.motion-control{visibility:hidden}",
    });
    await page.goto(`${base}/dev-portal.html`);
    await page.locator("[data-deploy-next]").click();
    await page.locator(".developer-ui").screenshot({
      path: `${directory}/developer-rollout-${width}.png`,
      style: ".site-nav,.skip-link,.motion-control{visibility:hidden}",
    });
    await page.locator("[data-deploy-next]").click();
    await page.locator(".developer-ui").screenshot({
      path: `${directory}/developer-review-${width}.png`,
      style: ".site-nav,.skip-link,.motion-control{visibility:hidden}",
    });
  }
  assert.deepEqual(report.errors, []);
  report.passed = true;
  report.limitations =
    "Windows Chromium and emulated mobile; real devices, Safari, Firefox, real screen-reader announcements and 200% browser zoom remain unverified.";
  console.log(
    JSON.stringify({
      passed: true,
      routes: report.content.length,
      interactions: report.interactions,
      static: report.static,
    }),
  );
} catch (error) {
  report.failure = error.message;
  throw error;
} finally {
  await writeFile(
    "review/concept-refinement/checks.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  await browser.close();
}

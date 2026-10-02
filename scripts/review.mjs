import { chromium, expect } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
process.env.PLAYWRIGHT_BROWSERS_PATH = new URL(
  "../node_modules/.cache/ms-playwright",
  import.meta.url,
).pathname.replace(/^\/(\w:)/, "$1");
const base = "http://127.0.0.1:4183";
const axe = await readFile("node_modules/axe-core/axe.min.js", "utf8");
const report = {
  layouts: [],
  accessibility: [],
  interactions: [],
  requests: [],
  performance: [],
  errors: [],
  links: [],
  limitations: [],
};
await mkdir("review/after", { recursive: true });
const browser = await chromium.launch({ headless: true });
for (const width of [320, 390, 768, 1440]) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  for (const name of [
    "index",
    "projects",
    "partner-growth-programs",
    "discounting",
    "dev-portal",
    "resume",
  ]) {
    page.on("pageerror", (e) =>
      report.errors.push({ name, width, message: e.message }),
    );
    const response = await page.goto(`${base}/${name}.html`);
    assert.equal(response.status(), 200);
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(() => ({
      viewport: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: [...document.querySelectorAll("main *")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return (
            r.width &&
            (r.left < -0.5 || r.right > innerWidth + 0.5) &&
            getComputedStyle(el).position !== "absolute"
          );
        })
        .slice(0, 10)
        .map((el) => ({ tag: el.tagName, cls: el.className })),
    }));
    report.layouts.push({ name, width, ...layout });
    await page.addScriptTag({ content: axe });
    const audit = await page.evaluate(async () => {
      const result = await axe.run({
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        },
      });
      return result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      }));
    });
    report.accessibility.push({ name, width, violations: audit });
    if (width === 390 || width === 1440) {
      await page.screenshot({
        path: `review/after/${name}-${width}.png`,
        fullPage: true,
      });
      if (name === "index")
        await page.screenshot({
          path: `review/after/first-viewport-${width}.png`,
        });
      if (
        ["partner-growth-programs", "discounting", "dev-portal"].includes(name)
      )
        await page.locator(".concept-section").screenshot({
          path: `review/after/concept-${name}-${width}.png`,
          style: ".site-nav,.skip-link {visibility:hidden}",
        });
    }
  }
  await context.close();
}
await writeFile(
  "review/layout-checks.json",
  JSON.stringify(
    { layouts: report.layouts, accessibility: report.accessibility },
    null,
    2,
  ),
);
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${base}/partner-growth-programs.html`);
await page.locator("[data-program-search]").fill("Boost Rank");
assert.equal(await page.locator("[data-program]:visible").count(), 1);
await page.locator("[data-program]:visible summary").click();
assert.match(
  await page.locator("[data-program]:visible .program-detail").innerText(),
  /per booking/,
);
await page.locator("[data-program-search]").fill("no such program");
assert.match(
  await page.locator("[data-program-count]").innerText(),
  /No matching/,
);
await page.locator("[data-program-search]").fill("");
await page.locator("[data-program-category]").selectOption("Prepaid");
assert.equal(await page.locator("[data-program]:visible").count(), 1);
report.interactions.push(
  "Program search, category filter, empty state and details passed.",
);
await page.goto(`${base}/discounting.html`);
assert.equal(await page.locator("[data-net]").innerText(), "$114.75");
await page.locator("[name=mobile]").uncheck();
assert.equal(await page.locator("[data-net]").innerText(), "$127.50");
await page.locator("[name=mega]").uncheck();
assert.equal(await page.locator("[data-net]").innerText(), "$150.00");
await page.locator("#room-rate").fill("-1");
assert.equal(await page.locator("[data-net]").innerText(), "—");
await page.getByRole("button", { name: "Reset example" }).click();
await expect(page.locator("[data-net]")).toHaveText("$114.75");
await page.locator("#room-rate").fill("0");
assert.equal(await page.locator("[data-net]").innerText(), "$0.00");
await page.locator("#room-rate").fill("19.99");
assert.equal(await page.locator("[data-net]").innerText(), "$15.29");
report.interactions.push(
  "Sequential calculator, toggles, invalid rate, reset, zero and rounding passed.",
);
await page.goto(`${base}/dev-portal.html`);
await page.locator("[name=environment]").fill("");
await page.locator("[data-deploy-next]").click();
assert.equal(await page.locator('[data-step="0"]').isVisible(), true);
await page.locator("[name=environment]").fill("review-example");
await page.locator("[data-deploy-next]").click();
assert.equal(await page.locator('[data-step="1"]').isVisible(), true);
await page.locator("[name=strategy]").selectOption("Rolling update");
await page.locator("[data-deploy-next]").click();
assert.match(
  await page.locator("[data-deploy-review]").innerText(),
  /review-example/,
);
assert.match(
  await page.locator("[data-deploy-review]").innerText(),
  /Rolling update/,
);
await page.locator("[data-deploy-back]").click();
assert.equal(
  await page.locator("[name=strategy]").inputValue(),
  "Rolling update",
);
await page.locator("[data-deploy-next]").click();
await page.locator("[data-deploy-next]").click();
assert.match(
  await page.locator("[data-deploy-status]").innerText(),
  /No service was deployed/,
);
report.interactions.push(
  "Developer validation, forward/back, preserved values, review and preview-only completion passed.",
);
await page.emulateMedia({ reducedMotion: "reduce" });
for (const width of [390, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${base}/dev-portal.html`);
  for (const control of [
    "[data-deploy-next]",
    "[data-deploy-next]",
    "[data-deploy-back]",
  ]) {
    await page.locator(control).focus();
    await page.keyboard.press("Enter");
    const focused = await page.evaluate(() => {
      const rect = document.activeElement.getBoundingClientRect();
      return {
        tag: document.activeElement.tagName,
        top: rect.top,
        bottom: rect.bottom,
        navBottom: document.querySelector(".site-nav").getBoundingClientRect()
          .bottom,
      };
    });
    assert.equal(focused.tag, "H2");
    assert.ok(
      focused.top >= focused.navBottom && focused.bottom <= 900,
      `Focused heading visible at ${width}px: ${JSON.stringify(focused)}`,
    );
  }
}
report.interactions.push(
  "Keyboard forward/back step titles stay visible below the navigation at 390 and 1440 pixels.",
);
for (const name of [
  "index",
  "projects",
  "partner-growth-programs",
  "discounting",
  "dev-portal",
  "resume",
]) {
  await page.goto(`${base}/${name}.html`);
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
      report.links.push({ name, url, status: response.status() });
  }
}
const nojs = await browser.newContext({
  javaScriptEnabled: false,
  viewport: { width: 390, height: 900 },
});
for (const name of [
  "index",
  "partner-growth-programs",
  "discounting",
  "dev-portal",
]) {
  const p = await nojs.newPage();
  await p.goto(`${base}/${name}.html`);
  assert.ok(await p.locator("h1").isVisible());
  if (name === "dev-portal")
    assert.equal(await p.locator(".deploy-stage:visible").count(), 3);
  if (name === "discounting")
    assert.equal(await p.locator("[data-net]").innerText(), "$114.75");
  await p.close();
}
await nojs.close();
report.interactions.push(
  "No-JavaScript content and static examples remain readable.",
);
await page.goto(`${base}/index.html`);
await page.keyboard.press("Tab");
assert.match(
  await page.evaluate(() => document.activeElement.textContent),
  /Skip to content/,
);
await page.keyboard.press("Enter");
assert.equal(await page.evaluate(() => location.hash), "#main");
report.interactions.push("Keyboard skip navigation passed.");
await page.emulateMedia({ reducedMotion: "reduce" });
assert.equal(
  await page
    .locator("html")
    .evaluate((e) => getComputedStyle(e).scrollBehavior),
  "auto",
);
assert.equal(
  await page
    .locator(".hero-interface")
    .evaluate((e) => getComputedStyle(e).transform),
  "none",
);
const session = await page.context().newCDPSession(page);
await session.send("Emulation.setEmulatedMedia", {
  features: [
    { name: "prefers-reduced-transparency", value: "reduce" },
    { name: "prefers-reduced-motion", value: "reduce" },
  ],
});
assert.equal(
  await page
    .locator(".site-nav")
    .evaluate((e) => getComputedStyle(e).backdropFilter),
  "none",
);
assert.equal(
  await page
    .locator(".site-nav")
    .evaluate((e) => getComputedStyle(e).backgroundColor),
  "rgb(248, 249, 252)",
);
report.interactions.push(
  "Reduced motion and opaque reduced-transparency fallback passed.",
);
await session.send("Emulation.setEmulatedMedia", { features: [] });
const requests = [];
page.on("response", async (res) => {
  requests.push({ url: res.url(), status: res.status() });
});
await session.send("Network.enable");
await session.send("Network.setCacheDisabled", { cacheDisabled: true });
await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await session.send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
});
await page.addInitScript(() => {
  window.__lcp = 0;
  window.__cls = 0;
  new PerformanceObserver((list) =>
    list.getEntries().forEach((e) => (window.__lcp = e.startTime)),
  ).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) =>
    list.getEntries().forEach((e) => {
      if (!e.hadRecentInput) window.__cls += e.value;
    }),
  ).observe({ type: "layout-shift", buffered: true });
});
await page.setViewportSize({ width: 390, height: 900 });
await page.goto(`${base}/index.html`);
await page.waitForTimeout(2200);
report.performance.push(
  await page.evaluate(() => ({
    scenario:
      "Chromium, 390px, cold cache, 4x CPU, 1.6Mbps, 150ms RTT; laboratory observation only",
    lcpMs: window.__lcp,
    cls: window.__cls,
    resourceBytes: performance
      .getEntriesByType("resource")
      .reduce((sum, r) => sum + r.encodedBodySize, 0),
    requestCount: performance.getEntriesByType("resource").length,
  })),
);
report.requests = requests;
await writeFile("review/checks.json", JSON.stringify(report, null, 2));
await browser.close();
const issues =
  report.layouts.filter((l) => l.scrollWidth > l.width).length +
  report.accessibility.filter((a) => a.violations.length).length +
  report.links.length +
  report.errors.length;
console.log(
  JSON.stringify(
    {
      layoutOverflows: report.layouts.filter((l) => l.scrollWidth > l.width),
      accessibility: report.accessibility.filter((a) => a.violations.length),
      brokenLinks: report.links,
      errors: report.errors,
      interactions: report.interactions,
      performance: report.performance,
    },
    null,
    2,
  ),
);
if (issues) process.exitCode = 1;

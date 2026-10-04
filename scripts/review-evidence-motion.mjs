import { chromium, expect } from "./review-browser.mjs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
const root = "review/evidence-motion";
await mkdir(`${root}/before`, { recursive: true });
await mkdir(`${root}/after`, { recursive: true });
const browser = await chromium.launch();
const report = { layouts: [], motion: [], passed: false };
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
      await expect(
        page.locator(".showcase-caption,.concept-context,.diagram-kicker"),
      ).toHaveCount(0);
      assert.ok(
        !/Updated concept|Existing example settings|Existing example values/.test(
          await page.locator("body").innerText(),
        ),
        "Repeated metadata removed",
      );
      const icons = await page
        .locator("[data-evidence-icon]")
        .evaluateAll((els) =>
          els.map((el) => ({
            color: getComputedStyle(el).color,
            hidden: el.getAttribute("aria-hidden"),
            width: el.getBoundingClientRect().width,
            playing: el.classList.contains("is-playing"),
          })),
        );
      assert.equal(icons.length, ["index", "projects"].includes(route) ? 3 : 1);
      icons.forEach((icon) => {
        assert.equal(icon.color, "rgb(237, 41, 57)");
        assert.equal(icon.hidden, "true");
        assert.equal(icon.width, 40);
        assert.equal(icon.playing, false);
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      if (["index", "projects"].includes(route)) {
        const heights = await page
          .locator(".showcase-card")
          .evaluateAll((els) =>
            els.map((el) => el.getBoundingClientRect().height),
          );
        heights.forEach((h) => assert.ok(Math.abs(h - heights[0]) < 1));
      }
      report.layouts.push({
        route,
        width,
        icons: icons.length,
        metadataRemoved: true,
      });
      if ([390, 1440].includes(width) && route === "index") {
        for (const kind of ["growth", "discount", "dev"])
          await page
            .locator(`#home-evidence-${kind}`)
            .screenshot({ path: `${root}/after/${kind}-${width}.png` });
      }
    }
    await page.close();
  }
  for (const width of process.argv.includes("--capture-before")
    ? [390, 1440]
    : []) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const source = execFileSync("git", ["show", "18e5018:index.html"], {
      encoding: "utf8",
    });
    await page.route("**/index.html", (route) =>
      route.fulfill({ contentType: "text/html", body: source }),
    );
    await page.goto("http://127.0.0.1:4183/index.html");
    await page.evaluate(() => document.fonts.ready);
    for (const kind of ["growth", "discount", "dev"])
      await page
        .locator(`#home-evidence-${kind}`)
        .screenshot({ path: `${root}/before/${kind}-${width}.png` });
    await page.close();
  }
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.goto("http://127.0.0.1:4183/index.html");
  const icon = page.locator("#home-evidence-growth [data-evidence-icon]");
  await icon.scrollIntoViewIfNeeded();
  await expect(icon).toHaveClass(/is-playing/);
  const state = () =>
    icon.evaluate(
      (el) => el.querySelector("svg").getAnimations()[0]?.currentTime,
    );
  const start = await state();
  await page.waitForTimeout(250);
  assert.ok((await state()) > start);
  assert.equal(
    await icon.evaluate(
      (el) =>
        el.querySelector("svg").getAnimations()[0].effect.getTiming()
          .iterations,
    ),
    2,
  );
  await page.locator("[data-motion-toggle]").click();
  await expect(icon).not.toHaveClass(/is-playing/);
  const paused = await state();
  await page.waitForTimeout(250);
  assert.equal(await state(), paused);
  await page.locator("[data-motion-toggle]").click();
  await expect(icon).toHaveClass(/is-playing/);
  await page.evaluate(() => scrollTo(0, 0));
  await expect(icon).not.toHaveClass(/is-playing/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await icon.scrollIntoViewIfNeeded();
  assert.equal(
    await icon.evaluate((el) => el.querySelector("svg").getAnimations().length),
    0,
  );
  report.motion = [
    "Visible icon advances through two bounded cycles",
    "User pause freezes and resume continues",
    "Offscreen icons pause",
    "Reduced motion is static",
  ];
  await page.close();
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 1000 },
  });
  const staticPage = await context.newPage();
  await staticPage.goto("http://127.0.0.1:4183/index.html");
  assert.equal(
    await staticPage.locator("[data-evidence-icon].is-playing").count(),
    0,
  );
  await expect(staticPage.locator("#home-evidence-growth")).toContainText(
    "$521M+",
  );
  await context.close();
  report.motion.push("No-JavaScript metrics and static icon remain readable");
  report.passed = true;
  console.log(JSON.stringify(report));
} finally {
  await writeFile(`${root}/checks.json`, JSON.stringify(report, null, 2));
  await browser.close();
}

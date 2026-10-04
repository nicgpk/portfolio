import { chromium, expect } from "./review-browser.mjs";
import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
const phase = process.argv[2] || "after";
const root = `review/link-system/${phase}`;
await mkdir(root, { recursive: true });
const browser = await chromium.launch();
const report = { layouts: [], passed: false };
try {
  for (const width of phase === "before"
    ? [390, 1440]
    : [320, 390, 768, 1440]) {
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
      if (phase === "after") {
        const links = await page
          .locator(
            ".text-link,.hero-secondary,.case-scroll,.back-link,.footer-email,.footer-bottom a,.case-next a,.case-section-nav a,.showcase-case-link,.nav-contact,.studio-button",
          )
          .evaluateAll((els) =>
            els
              .filter((el) => el.getBoundingClientRect().width)
              .map((el) => ({
                font: getComputedStyle(el).fontSize,
                height: el.getBoundingClientRect().height,
                text: el.textContent.trim(),
              })),
          );
        links.forEach((link) => {
          assert.equal(link.font, "16px", `${route}: ${link.text}`);
          assert.ok(link.height >= 48, `${route}: ${link.text} hit area`);
        });
        const icons = await page
          .locator("a .ui-icon,.showcase-case-link .ui-icon")
          .evaluateAll((els) =>
            els
              .filter((el) => el.getBoundingClientRect().width)
              .map((el) => ({
                width: el.getBoundingClientRect().width,
                height: el.getBoundingClientRect().height,
                hidden: el.getAttribute("aria-hidden"),
                focus: el.getAttribute("focusable"),
                drawn: el.querySelector("use").getBBox().width,
              })),
          );
        icons.forEach((icon) => {
          assert.equal(icon.width, 24);
          assert.equal(icon.height, 24);
          assert.equal(icon.hidden, "true");
          assert.equal(icon.focus, "false");
          assert.ok(icon.drawn > 0, "Icon symbol resolves");
        });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        await expect(page.locator(".header-logo-mark")).toHaveText(">");
        const contact = await page.locator(".nav-contact").boundingBox();
        assert.equal(contact.height, 48, `${route}: contact stays one line`);
        if (route === "partner-growth-programs") {
          const rows = await page
            .locator(".growth-studio .program-tile > summary")
            .evaluateAll((els) =>
              els.map((el) => {
                const glyph = el
                  .querySelector(".catalog-glyph")
                  .getBoundingClientRect();
                const copy = el
                  .querySelector(".growth-row-main")
                  .getBoundingClientRect();
                const svg = el
                  .querySelector(".catalog-glyph svg")
                  .getBoundingClientRect();
                return {
                  width: glyph.width,
                  icon: svg.width,
                  gap: copy.left - glyph.right,
                };
              }),
            );
          assert.equal(rows.length, 8);
          rows.forEach((row) => {
            assert.equal(row.width, 44);
            assert.equal(row.icon, 32);
            assert.ok(row.gap >= 10, "Program icon clears its label");
          });
        }
        if (route === "index") {
          const sizes = await page
            .locator(".hero-actions > a")
            .evaluateAll((els) =>
              els.map((el) => el.getBoundingClientRect().height),
            );
          assert.deepEqual(sizes, [48, 48]);
        }
        report.layouts.push({
          route,
          width,
          links: links.length,
          icons: icons.length,
          overflow: false,
        });
      }
      if ([390, 1440].includes(width) && route === "index") {
        await page.screenshot({ path: `${root}/home-${width}.png` });
        await page
          .locator(".hero-actions")
          .screenshot({ path: `${root}/actions-${width}.png` });
        await page
          .locator(".folio-footer")
          .screenshot({ path: `${root}/footer-${width}.png` });
      }
      if ([390, 1440].includes(width) && route === "discounting")
        await page
          .locator(".case-framing")
          .screenshot({ path: `${root}/case-links-${width}.png` });
    }
    await page.close();
  }
  if (phase === "after") {
    const page = await browser.newPage();
    await page.goto("http://127.0.0.1:4183/dev-portal.html");
    await page.locator("[data-deploy-next]").click();
    await expect(
      page.locator("[data-deploy-next] .ui-icon use"),
    ).toHaveAttribute("href", "images/interface-icons.svg#arrow-right");
    await page.locator("[data-deploy-next]").click();
    await expect(
      page.locator("[data-deploy-next] .ui-icon use"),
    ).toHaveAttribute("href", "images/interface-icons.svg#check");
    await page.close();
    const source = await readFile("images/interface-icons.svg", "utf8");
    assert.equal((source.match(/<symbol /g) || []).length, 17);
  }
  report.passed = true;
  console.log(
    JSON.stringify({ phase, passed: true, layouts: report.layouts.length }),
  );
} finally {
  await writeFile(`${root}/checks.json`, JSON.stringify(report, null, 2));
  await browser.close();
}

import { chromium, expect } from "./review-browser.mjs";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const phase = process.argv[2] || "after";
const root = `review/work-page/${phase}`;
await mkdir(root, { recursive: true });
const browser = await chromium.launch();
const axe = await readFile("node_modules/axe-core/axe.min.js", "utf8");
const report = { layouts: [], sharedCards: false, passed: false };
try {
  for (const width of phase === "before"
    ? [390, 1440]
    : [320, 390, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    await page.goto("http://127.0.0.1:4183/projects.html");
    await page.evaluate(() => document.fonts.ready);
    if (phase === "after") {
      const home = await readFile("index.html", "utf8");
      const work = await readFile("projects.html", "utf8");
      const shared = await page.evaluate(
        ({ home, work }) => {
          const parse = (text) =>
            new DOMParser().parseFromString(text, "text/html");
          const docs = [parse(home), parse(work)];
          return [".showcase-card", ".archive"].every((selector) => {
            const html = (doc) =>
              [...doc.querySelectorAll(selector)].map((el) => el.outerHTML);
            return (
              JSON.stringify(html(docs[0])) === JSON.stringify(html(docs[1]))
            );
          });
        },
        { home, work },
      );
      assert.ok(
        shared,
        "Work must reuse the complete homepage cards, metrics, concepts and archive",
      );
      report.sharedCards = shared;
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator(".site-nav a[aria-current=page]")).toHaveText(
        "Work",
      );
      await expect(
        page.locator(".work-sequence,.kinetic-disc,#graphic-rate"),
      ).toHaveCount(0);
      const geometry = await page
        .locator("#project-gallery")
        .evaluate((el) => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          heights: [...el.querySelectorAll(".showcase-card")].map(
            (card) => card.getBoundingClientRect().height,
          ),
          scrollbar: getComputedStyle(el).scrollbarWidth,
          concepts: [...el.querySelectorAll(".concept-preview")].map(
            (shell) => ({
              background: getComputedStyle(shell).backgroundColor,
              radius: getComputedStyle(shell).borderRadius,
            }),
          ),
        }));
      assert.equal(geometry.overflow, false);
      assert.ok(
        Math.max(...geometry.heights) - Math.min(...geometry.heights) < 1,
      );
      assert.equal(geometry.scrollbar, "none");
      assert.ok(
        geometry.concepts.every(
          (shell) =>
            shell.background === "rgb(28, 28, 28)" && shell.radius === "12px",
        ),
      );
      await page.addScriptTag({ content: axe });
      const violations = await page.evaluate(async () =>
        (
          await axe.run({
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
            },
          })
        ).violations.map((v) => v.id),
      );
      assert.deepEqual(violations, [], `Work accessibility at ${width}px`);
      const gallery = page.locator("#project-gallery");
      await gallery.focus();
      await page.keyboard.press("End");
      await expect(page.locator("[data-showcase-position]")).toHaveText(
        "3 of 3",
      );
      await page.keyboard.press("Home");
      await expect(page.locator("[data-showcase-position]")).toHaveText(
        "1 of 3",
      );
      await page.getByRole("button", { name: "Next project" }).click();
      await expect(page.locator("[data-showcase-position]")).toHaveText(
        "2 of 3",
      );
      if (width === 1440) {
        await gallery.focus();
        await page.keyboard.press("Home");
        await gallery.scrollIntoViewIfNeeded();
        const box = await gallery.boundingBox();
        const y = await page.evaluate(() => scrollY);
        await page.mouse.move(
          box.x + 100,
          Math.max(150, Math.min(650, box.y + 200)),
        );
        await page.mouse.wheel(0, 180);
        await expect(page.locator("[data-showcase-position]")).toHaveText(
          "2 of 3",
        );
        assert.equal(await page.evaluate(() => scrollY), y);
      }
      await gallery.focus();
      await page.keyboard.press("Home");
      report.layouts.push({ width, ...geometry });
    }
    if ([390, 1440].includes(width)) {
      await page.evaluate(() => document.activeElement?.blur());
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: `${root}/projects-opening-${width}.png` });
      await page
        .locator("#work")
        .screenshot({ path: `${root}/projects-work-${width}.png` });
    }
    await page.close();
  }
  if (phase === "after") {
    const page = await browser.newPage({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 900 },
    });
    await page.goto("http://127.0.0.1:4183/projects.html");
    await expect(page.locator(".showcase-card")).toHaveCount(3);
    await expect(
      page.getByRole("button", { name: "Next project" }),
    ).toBeHidden();
    await page
      .locator("#project-gallery")
      .evaluate((el) => (el.scrollLeft = el.scrollWidth));
    await expect(
      page.locator(".showcase-card--dev .evidence-card"),
    ).toContainText("6m 8s");
    await page.close();
  }
  report.passed = true;
  console.log(JSON.stringify(report));
} finally {
  await writeFile(`${root}/checks.json`, JSON.stringify(report, null, 2));
  await browser.close();
}

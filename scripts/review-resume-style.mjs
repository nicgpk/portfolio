import { chromium, expect } from "./review-browser.mjs";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { normalizedContentText } from "./content-normalization.mjs";
const root = "review/resume-style";
await mkdir(`${root}/after`, { recursive: true });
const browser = await chromium.launch();
const report = { layouts: [], content: false, print: false, passed: false };
try {
  const axe = await readFile("node_modules/axe-core/axe.min.js", "utf8");
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    await page.goto("http://127.0.0.1:4183/resume.html");
    await page.evaluate(() => document.fonts.ready);
    await page.addScriptTag({ content: axe });
    const accessibility = await page.evaluate(() =>
      axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
      }),
    );
    assert.deepEqual(
      accessibility.violations.map((v) => v.id),
      [],
    );
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      overflow: document.documentElement.scrollWidth > innerWidth,
      font: getComputedStyle(document.querySelector(".resume-header h1"))
        .fontFamily,
      background: getComputedStyle(document.body).backgroundColor,
      link: getComputedStyle(document.querySelector(".resume-contact-link"))
        .color,
      download: document
        .querySelector(".resume-download-btn")
        .getBoundingClientRect().height,
    }));
    assert.equal(layout.overflow, false);
    assert.ok(layout.font.includes("Manrope"));
    assert.equal(layout.background, "rgb(255, 255, 255)");
    assert.equal(layout.link, "rgb(21, 25, 24)");
    assert.equal(layout.download, 48);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    await page.keyboard.press("Enter");
    assert.ok(
      await page
        .locator("#main")
        .evaluate(
          (el) =>
            el.contains(document.activeElement) ||
            el === document.activeElement,
        ),
    );
    report.layouts.push({ ...layout, axeViolations: 0 });
    if ([390, 1440].includes(width)) {
      await page.evaluate(() => document.activeElement.blur());
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: `${root}/after/resume-${width}.png`,
        fullPage: true,
      });
      await page.screenshot({ path: `${root}/after/opening-${width}.png` });
    }
    await page.close();
  }
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:4183/resume.html");
  await page.addScriptTag({
    content: `window.resumeText = ${normalizedContentText.toString()}`,
  });
  const source = execFileSync("git", ["show", "f8ba6b7:resume.html"], {
    encoding: "utf8",
  });
  const audit = await page.evaluate((before) => {
    const old = new DOMParser().parseFromString(before, "text/html");
    const text = (doc) =>
      window.resumeText(doc.querySelector("#resume-content"));
    const links = (doc) =>
      [...doc.querySelectorAll("a[href]")].map((el) => ({
        href: el.getAttribute("href"),
        download: el.getAttribute("download"),
      }));
    return {
      text: text(old) === text(document),
      links: JSON.stringify(links(old)) === JSON.stringify(links(document)),
      jobs: document.querySelectorAll(".resume-item").length,
    };
  }, source);
  assert.equal(audit.text, true);
  assert.equal(audit.links, true);
  assert.equal(audit.jobs, 5);
  report.content = audit;
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator(".site-nav").isVisible(), false);
  assert.equal(await page.locator(".resume-download").isVisible(), false);
  await expect(page.locator(".resume-header h1")).toBeVisible();
  assert.equal(await page.locator(".resume-section li").count(), 19);
  await page.pdf({
    path: `${root}/after/browser-print.pdf`,
    format: "A4",
    printBackground: false,
  });
  await page.screenshot({
    path: `${root}/after/print-layout.png`,
    fullPage: true,
  });
  report.print = true;
  await page.close();
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 1000 },
  });
  const nojs = await context.newPage();
  await nojs.goto("http://127.0.0.1:4183/resume.html");
  await expect(nojs.locator(".resume-download-btn")).toBeVisible();
  await expect(nojs.locator(".resume-item").first()).toContainText(
    "Product Design Lead",
  );
  await context.close();
  report.noJavaScript = true;
  report.passed = true;
  console.log(JSON.stringify(report));
} finally {
  await writeFile(`${root}/checks.json`, JSON.stringify(report, null, 2));
  await browser.close();
}

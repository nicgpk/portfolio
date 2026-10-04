import { chromium, expect } from "./review-browser.mjs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const directory = "review/concept-system";
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const report = {
  baseline: "c53f0e8",
  previews: [],
  fields: [],
  content: [],
  errors: [],
  passed: false,
};
const routes = ["partner-growth-programs", "discounting", "dev-portal"];
const signature = (element) => {
  const style = getComputedStyle(element);
  return Object.fromEntries(
    [
      "fontFamily",
      "fontSize",
      "fontWeight",
      "lineHeight",
      "color",
      "backgroundColor",
      "borderColor",
      "borderRadius",
    ].map((key) => [key, style[key]]),
  );
};
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    page.on("pageerror", (error) => report.errors.push(error.message));
    await page.goto("http://127.0.0.1:4183/");
    await page.evaluate(() => document.fonts.ready);
    const headings = await page
      .locator(".concept-preview .preview-header h4")
      .evaluateAll((elements) =>
        elements.map((el) => {
          const s = getComputedStyle(el);
          return { font: s.font, color: s.color, margin: s.margin };
        }),
      );
    assert.equal(headings.length, 3);
    headings.forEach((heading) => assert.deepEqual(heading, headings[0]));
    const shells = await page
      .locator(".concept-preview")
      .evaluateAll((elements) =>
        elements.map((el) => {
          const s = getComputedStyle(el),
            box = el.getBoundingClientRect();
          return {
            padding: s.padding,
            border: s.border,
            radius: s.borderRadius,
            background: s.backgroundColor,
            top: box.top,
            height: box.height,
            overflow: el.scrollWidth > el.clientWidth + 1,
          };
        }),
      );
    shells.forEach((shell) => {
      assert.equal(shell.padding, shells[0].padding);
      assert.equal(shell.border, shells[0].border);
      assert.equal(shell.radius, shells[0].radius);
      assert.equal(shell.background, shells[0].background);
      assert.equal(shell.overflow, false);
    });
    if (width === 1440) {
      assert.ok(
        Math.max(...shells.map((s) => s.top)) -
          Math.min(...shells.map((s) => s.top)) <
          1,
      );
      assert.ok(
        Math.max(...shells.map((s) => s.height)) -
          Math.min(...shells.map((s) => s.height)) <
          1,
      );
    }
    const footers = await page
      .locator(".concept-preview .preview-note")
      .evaluateAll((els) =>
        els.map((el) => ({
          bottom: el.getBoundingClientRect().bottom,
          shellBottom: el.closest(".concept-preview").getBoundingClientRect()
            .bottom,
          font: getComputedStyle(el).font,
        })),
      );
    assert.equal(footers.length, 3);
    footers.forEach((footer) => assert.equal(footer.font, footers[0].font));
    if (width === 1440)
      assert.ok(
        Math.max(...footers.map((f) => f.bottom)) -
          Math.min(...footers.map((f) => f.bottom)) <
          1,
      );
    report.previews.push({
      width,
      commonHeadings: true,
      commonShells: true,
      alignedDesktopFrames: width === 1440,
      noOverflow: true,
    });
    const fields = [],
      fieldFrames = [],
      headers = [];
    for (const [index, route] of routes.entries()) {
      await page.goto(`http://127.0.0.1:4183/${route}.html`);
      await page.evaluate(() => document.fonts.ready);
      const input = page.locator(
        ["[data-program-search]", "#room-rate", '[name="environment"]'][index],
      );
      fields.push(await input.evaluate(signature));
      headers.push(
        await page.locator(".concept-shell-header").evaluate((el) => {
          const s = getComputedStyle(el);
          return {
            padding: s.padding,
            background: s.backgroundColor,
            border: s.borderBottom,
          };
        }),
      );
      const frame = page.locator(
        [".growth-input-wrap", ".input-money", '[name="environment"]'][index],
      );
      fieldFrames.push(await frame.evaluate(signature));
      assert.ok(
        Math.abs((await frame.boundingBox()).height - 44) < 1,
        `${route}: a field must have the shared 44px height.`,
      );
      if (index === 0) {
        const spacing = await input.evaluate((el) => {
          const wrapper = el.closest(".growth-input-wrap"),
            icon = wrapper.querySelector("svg").getBoundingClientRect();
          return {
            textStart:
              el.getBoundingClientRect().left +
              parseFloat(getComputedStyle(el).paddingLeft),
            iconRight: icon.right,
          };
        });
        assert.ok(
          spacing.textStart >= spacing.iconRight + 4,
          "Search text must clear its icon.",
        );
        await input.fill("zzzzzz");
        await expect(page.locator("[data-program-empty]")).toBeVisible();
        await page.locator("[data-program-clear]").click();
        await expect(input).toBeFocused();
      }
      await expect(page.locator(".concept-shell")).toHaveCSS(
        "background-color",
        "rgb(28, 28, 28)",
      );
    }
    for (const field of fields) {
      for (const key of ["fontFamily", "fontSize", "lineHeight", "color"])
        assert.equal(
          field[key],
          fields[0][key],
          `Shared field ${key} at ${width}px.`,
        );
    }
    for (const frame of fieldFrames) {
      for (const key of ["backgroundColor", "borderColor", "borderRadius"])
        assert.equal(
          frame[key],
          fieldFrames[0][key],
          `Shared visible field ${key} at ${width}px.`,
        );
    }
    headers.forEach((header) => assert.deepEqual(header, headers[0]));
    report.fields.push({
      width,
      commonFields: true,
      commonHeaders: true,
      searchIconSpacing: true,
    });
    await page.close();
  }
  const page = await browser.newPage();
  for (const route of ["index", "projects", ...routes, "resume"]) {
    await page.goto(`http://127.0.0.1:4183/${route}.html`);
    if (route === "projects") {
      const home = await readFile("index.html", "utf8");
      const work = await readFile("projects.html", "utf8");
      const shared = await page.evaluate(
        ({ home, work }) => {
          const parse = (text) =>
            new DOMParser().parseFromString(text, "text/html");
          const cards = (text) =>
            [...parse(text).querySelectorAll(".showcase-card")].map(
              (el) => el.outerHTML,
            );
          return JSON.stringify(cards(home)) === JSON.stringify(cards(work));
        },
        { home, work },
      );
      assert.ok(
        shared,
        "Work reuses the current home cards, metrics and previews",
      );
      report.content.push({ route, sharedHomeCards: true });
      continue;
    }
    const before = execFileSync("git", ["show", `c53f0e8:${route}.html`], {
      encoding: "utf8",
    });
    const after = await readFile(`${route}.html`, "utf8");
    const audit = await page.evaluate(
      ({ before, after }) => {
        const parse = (source) =>
          new DOMParser().parseFromString(source, "text/html");
        const docs = [parse(before), parse(after)];
        const text = (doc) => {
          const main = doc.querySelector("main").cloneNode(true);
          main
            .querySelectorAll(".showcase-art,.hero-footnote")
            .forEach((el) => el.remove());
          return main.textContent.replace(/\s+/g, " ").trim();
        };
        const links = (doc) =>
          [...doc.querySelectorAll("a[href]")]
            .filter((el) => !el.closest(".hero-footnote"))
            .map((el) => el.getAttribute("href"));
        return {
          textUnchanged: text(docs[0]) === text(docs[1]),
          linksUnchanged:
            JSON.stringify(links(docs[0])) === JSON.stringify(links(docs[1])),
        };
      },
      { before, after },
    );
    assert.ok(audit.textUnchanged && audit.linksUnchanged, route);
    report.content.push({ route, ...audit });
  }
  assert.deepEqual(report.errors, []);
  report.passed = true;
  console.log(JSON.stringify(report));
} finally {
  await writeFile(
    `${directory}/checks.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
  await browser.close();
}

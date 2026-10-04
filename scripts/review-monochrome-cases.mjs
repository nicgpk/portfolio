import { chromium, expect } from "./review-browser.mjs";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { normalizedContentText } from "./content-normalization.mjs";
const baseline = "78c8646153e797789c0ec022ceeddc8d87098aa8",
  base = "http://127.0.0.1:4183";
const directory = "review/monochrome-cases";
await mkdir(`${directory}/after`, { recursive: true });
const browser = await chromium.launch();
const report = {
  baseline,
  content: [],
  layouts: [],
  palettes: [],
  navigation: [],
  states: [],
  errors: [],
  passed: false,
};
async function palette(page, route, state) {
  const invalid = await page.evaluate(() => {
    const out = [];
    const color = (value) => {
      let m = value.match(
        /^rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\)$/,
      );
      if (!m || m[4] === "0") return true;
      const rgb = m.slice(1, 4).map(Number);
      if (Math.max(...rgb) - Math.min(...rgb) <= 2) return true;
      let [r, g, b] = rgb.map((x) => x / 255),
        max = Math.max(r, g, b),
        min = Math.min(r, g, b),
        d = max - min;
      let h =
        max === r
          ? ((g - b) / d) % 6
          : max === g
            ? (b - r) / d + 2
            : (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
      return h >= 5 && h <= 28;
    };
    function inspect(el, s, pseudo = "") {
      const props = ["backgroundColor"];
      if (
        pseudo ||
        ["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName) ||
        [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
      )
        props.push("color");
      for (const side of ["Top", "Right", "Bottom", "Left"])
        if (
          parseFloat(s[`border${side}Width`]) > 0 &&
          s[`border${side}Style`] !== "none"
        )
          props.push(`border${side}Color`);
      if (parseFloat(s.outlineWidth) > 0 && s.outlineStyle !== "none")
        props.push("outlineColor");
      if (
        el instanceof SVGElement &&
        [
          "path",
          "circle",
          "rect",
          "text",
          "ellipse",
          "line",
          "polyline",
          "polygon",
          "use",
        ].includes(el.tagName)
      )
        props.push("fill", "stroke");
      if (["INPUT", "SELECT"].includes(el.tagName)) props.push("accentColor");
      for (const prop of props)
        if (!color(s[prop]))
          out.push({
            element: el.tagName + "." + el.classList.toString(),
            pseudo,
            property: prop,
            color: s[prop],
          });
    }
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect(),
        s = getComputedStyle(el);
      if (
        !r.width ||
        !r.height ||
        s.visibility === "hidden" ||
        s.display === "none"
      )
        continue;
      inspect(el, s);
      for (const pseudo of ["::before", "::after"]) {
        const p = getComputedStyle(el, pseudo);
        if (p.content !== "none" && p.content !== "normal")
          inspect(el, p, pseudo);
      }
    }
    return out;
  });
  report.palettes.push({ route, state, invalid });
  return invalid;
}
for (const route of ["partner-growth-programs", "discounting", "dev-portal"]) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (e) => report.errors.push(e.message));
  await page.goto(`${base}/${route}.html`);
  await page.evaluate(() => document.fonts.ready);
  const before = execFileSync("git", ["show", `${baseline}:${route}.html`], {
      encoding: "utf8",
    }),
    after = await readFile(`${route}.html`, "utf8");
  await page.addScriptTag({
    content: `window.portfolioContentText = ${normalizedContentText.toString()}`,
  });
  const audit = await page.evaluate(
    ({ before, after }) => {
      const a = new DOMParser().parseFromString(before, "text/html"),
        b = new DOMParser().parseFromString(after, "text/html");
      const text = (d) => {
        const clone = d.body.cloneNode(true);
        clone
          .querySelectorAll(
            ".case-diagram,.case-project-label,.research-tone-note",
          )
          .forEach((n) => n.remove());
        return window.portfolioContentText(clone);
      };
      const links = (d) =>
        [...d.querySelectorAll("a[href]")].map((n) => n.getAttribute("href"));
      return {
        textUnchanged: text(a) === text(b),
        linksUnchanged: JSON.stringify(links(a)) === JSON.stringify(links(b)),
      };
    },
    { before, after },
  );
  assert.ok(
    audit.textUnchanged && audit.linksUnchanged,
    JSON.stringify({ route, ...audit }),
  );
  report.content.push({ route, ...audit });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.evaluate(() => scrollTo(0, 0));
    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      heroFits: [...document.querySelectorAll(".case-hero-layout > *")].every(
        (el) => {
          const r = el.getBoundingClientRect();
          return r.left >= 0 && r.right <= innerWidth + 1;
        },
      ),
      researchMonochrome: [
        ...document.querySelectorAll(".research-figure img"),
      ].every((el) => getComputedStyle(el).filter === "grayscale(1)"),
    }));
    assert.ok(
      !layout.overflow && layout.heroFits && layout.researchMonochrome,
      JSON.stringify({ route, width, ...layout }),
    );
    report.layouts.push({ route, width, ...layout });
    await palette(page, route, `${width}px default`);
    if (width === 1440 || width === 390) {
      await page.screenshot({
        path: `${directory}/after/${route}-${width}.png`,
        fullPage: true,
      });
      await page.screenshot({
        path: `${directory}/after/${route}-opening-${width}.png`,
      });
      await page.addStyleTag({
        content:
          ".site-nav,.motion-control,.skip-link,.case-section-nav{visibility:hidden!important}",
      });
      await page.locator(".concept-canvas").screenshot({
        path: `${directory}/after/${route}-concept-${width}.png`,
      });
      await page.locator(".evidence-card").screenshot({
        path: `${directory}/after/${route}-evidence-${width}.png`,
      });
      await page.evaluate(() =>
        [...document.querySelectorAll("style")].at(-1).remove(),
      );
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const href of ["#decisions", "#choices", "#evidence", "#concept"]) {
    await page.locator(`.case-section-nav a[href="${href}"]`).focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(150);
    const nav = await page.locator(".case-section-nav").boundingBox(),
      heading = await page
        .locator(href)
        .getByRole("heading")
        .first()
        .boundingBox();
    assert.ok(
      heading.y >= nav.y + nav.height - 1,
      JSON.stringify({ route, href, nav, heading }),
    );
    report.navigation.push({ route, href, headingVisible: true });
  }
  if (route === "partner-growth-programs") {
    await page.locator("[data-program]").first().locator("summary").focus();
    await page.keyboard.press("Enter");
    await palette(page, route, "expanded program and focused control");
    report.states.push({ route, expanded: true });
  }
  if (route === "discounting") {
    await page.locator("#room-rate").fill("-1");
    await palette(page, route, "invalid rate");
    await expect(page.locator("[data-calc-error]")).not.toBeEmpty();
    await page.locator(".calc-reset").click();
    await palette(page, route, "reset");
    report.states.push({ route, invalidAndReset: true });
  }
  if (route === "dev-portal") {
    for (let i = 0; i < 3; i++) {
      await palette(page, route, `workflow step ${i + 1}`);
      if (i > 0) {
        const heading = await page
          .locator(`[data-step="${i}"] h2`)
          .boundingBox();
        const sticky = await page.locator(".case-section-nav").boundingBox();
        assert.ok(
          heading.y >= sticky.y + sticky.height + 12,
          JSON.stringify({ heading, sticky }),
        );
      }
      if (i < 2) await page.locator("[data-deploy-next]").click();
    }
    report.states.push({ route, allWorkflowSteps: true });
  }
  await page.emulateMedia({ forcedColors: "active" });
  await expect(page.locator(".case-diagram")).not.toBeVisible();
  await page.emulateMedia({ forcedColors: "none" });
  await page.close();
}
report.passed =
  report.errors.length === 0 &&
  report.palettes.every((p) => p.invalid.length === 0);
await writeFile(
  `${directory}/checks.json`,
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      passed: report.passed,
      layouts: report.layouts.length,
      content: report.content,
      invalidColors: [
        ...new Set(
          report.palettes.flatMap((p) =>
            p.invalid.map((i) => JSON.stringify(i)),
          ),
        ),
      ],
    },
    null,
    2,
  ),
);
await browser.close();
assert.ok(
  report.passed,
  "All rendered case-study colors must be neutral or orange.",
);

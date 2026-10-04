import { chromium } from "./review-browser.mjs";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const phase = process.argv[2] || "after";
const browser = await chromium.launch();
const report = [];
const activeStyles = [
  "folio",
  "editorial",
  "showcase",
  "growth-ui",
  "discount-ui",
  "studio",
  "concepts",
  "project-system",
  "personal-landing",
  "case-studies",
  "concept-system",
  "link-system",
  "evidence-motion",
  "resume-portfolio",
  "teletype",
  "resume",
];
if (phase === "after") {
  const source = (
    await Promise.all(
      activeStyles.map((name) => readFile(`css/${name}.css`, "utf8")),
    )
  ).join("\n");
  assert.equal(
    (source.match(/--accent:\s*#[\da-f]+/gi) || []).length,
    1,
    "One authored accent value",
  );
  assert.ok(
    !/--(?:cobalt|orange|orchid|lime|coral|signal|ui-accent|workspace-accent|growth-accent|discount-accent)\b/.test(
      source,
    ),
    "No historical accent aliases",
  );
}
await mkdir(`review/accent-system/${phase}`, { recursive: true });
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
      if (phase === "after")
        assert.equal(
          await page.evaluate(() =>
            getComputedStyle(document.documentElement)
              .getPropertyValue("--accent")
              .trim(),
          ),
          "#ed2939",
        );
      if (phase === "after") {
        await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
        const axe = await page.evaluate(async () =>
          (
            await axe.run(document, {
              runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21aa"],
              },
            })
          ).violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })),
        );
        const palette = await page.evaluate(() => {
          const bad = [],
            references = [];
          const red = "rgb(237, 41, 57)";
          for (const el of document.querySelectorAll("body *")) {
            if (!el.getClientRects().length) continue;
            const s = getComputedStyle(el);
            const props = ["backgroundColor"];
            if (
              [...el.childNodes].some(
                (n) => n.nodeType === 3 && n.textContent.trim(),
              ) ||
              el.matches("input,select,textarea,svg,use")
            )
              props.push("color");
            for (const side of ["Top", "Right", "Bottom", "Left"])
              if (
                parseFloat(s[`border${side}Width`]) &&
                s[`border${side}Style`] !== "none"
              )
                props.push(`border${side}Color`);
            if (el.matches("input[type=checkbox]")) props.push("accentColor");
            for (const prop of props) {
              const v = s[prop],
                m = v.match(
                  /^rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\)$/,
                );
              if (!m || m[4] === "0") continue;
              const rgb = m.slice(1, 4).map(Number);
              if (v === red) references.push({ el, prop });
              else if (Math.max(...rgb) - Math.min(...rgb) > 6)
                bad.push({
                  element: el.className?.baseVal ?? el.className,
                  prop,
                  value: v,
                });
            }
          }
          document.documentElement.style.setProperty("--accent", "#7f00ff");
          const unlinked = references
            .filter(
              ({ el, prop }) =>
                getComputedStyle(el)[prop] !== "rgb(127, 0, 255)",
            )
            .map(({ el, prop }) => ({
              element: el.className?.baseVal ?? el.className,
              prop,
            }));
          document.documentElement.style.removeProperty("--accent");
          return { bad, unlinked, linkedAccentProperties: references.length };
        });
        report.push({ route, width, axe, palette });
        await writeFile(
          "review/accent-system/after/checks.json",
          JSON.stringify(report, null, 2),
        );
      }
      if ([390, 1440].includes(width))
        await page.screenshot({
          path: `review/accent-system/${phase}/${route}-${width}.png`,
          fullPage: true,
        });
      if (phase === "before") report.push({ route, width });
    }
    await page.close();
  }
  await writeFile(
    `review/accent-system/${phase}/checks.json`,
    JSON.stringify(report, null, 2),
  );
  if (phase === "after")
    assert.deepEqual(
      report.filter((r) => r.axe?.length),
      [],
      "All six routes must pass accessibility",
    );
  if (phase === "after")
    assert.deepEqual(
      report.filter((r) => r.palette.bad.length || r.palette.unlinked.length),
      [],
      "Every chromatic accent must inherit the one token",
    );
  console.log(
    `${phase}: six routes; ${report.length} checked layouts; two capture widths`,
  );
} finally {
  await browser.close();
}

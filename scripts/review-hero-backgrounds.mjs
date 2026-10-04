import { chromium, expect } from "./review-browser.mjs";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
const root = "review/hero-backgrounds";
await mkdir(root, { recursive: true });
const browser = await chromium.launch();
const axe = await readFile("node_modules/axe-core/axe.min.js", "utf8");
const report = { layouts: [], interactions: [], errors: [], passed: false };
try {
  for (const name of ["current", "horizon", "dune", "orbit"]) {
    const url = `http://127.0.0.1:4183/?background=${name}`;
    for (const width of [320, 390, 768, 1440]) {
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      page.on("pageerror", (error) => report.errors.push(error.message));
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator(".cloud-field")).not.toHaveClass(/is-active/);
      const poster = await page
        .locator(".cloud-poster")
        .evaluate(async (el) => {
          await el.decode();
          return { source: el.currentSrc, loaded: el.naturalWidth > 0 };
        });
      assert.ok(poster.loaded);
      assert.ok(
        poster.source.includes(
          name === "current" ? "hero-halftone" : `hero-${name}-`,
        ),
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
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
      assert.deepEqual(violations, []);
      if (width === 390 || width === 1440)
        await page
          .locator(".hero-stage")
          .screenshot({ path: `${root}/${name}-${width}.png` });
      report.layouts.push({ name, width, poster, violations });
      await page.close();
    }
    if (name === "current") continue;
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await page.addInitScript(() => {
      const upload = WebGLRenderingContext.prototype.texImage2D;
      WebGLRenderingContext.prototype.texImage2D = function (...args) {
        const source = args.at(-1);
        if (source instanceof HTMLCanvasElement) {
          const data = source
            .getContext("2d")
            .getImageData(0, 0, source.width, source.height).data;
          window.__brushInk = data.some((value, i) => i % 4 === 3 && value > 0);
        }
        return upload.apply(this, args);
      };
    });
    await page.goto(url);
    await expect(page.locator(".cloud-field")).toHaveClass(/is-active/);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        document
          .querySelector("#hero-title")
          .getAnimations()
          .map((a) => a.finished),
      );
    });
    const textBox = await page.locator("#hero-title").boundingBox();
    const box = await page.locator(".hero-stage").boundingBox();
    await page.mouse.move(box.x + box.width * 0.82, box.y + box.height * 0.85);
    await expect.poll(() => page.evaluate(() => window.__brushInk)).toBe(true);
    assert.deepEqual(await page.locator("#hero-title").boundingBox(), textBox);
    await page
      .locator(".hero-stage")
      .screenshot({ path: `${root}/${name}-cursor-1440.png` });
    await page.mouse.move(1, 1);
    await expect
      .poll(() => page.evaluate(() => window.__brushInk), { timeout: 5000 })
      .toBe(false);
    const delta = await page.evaluate(async (name) => {
      const { createHalftoneRenderer } = await import("/js/halftone.mjs");
      const mode = { horizon: 1, dune: 2, orbit: 3 }[name];
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 650;
      const renderer = createHalftoneRenderer(canvas, null, mode);
      const copy = document.createElement("canvas");
      copy.width = 1280;
      copy.height = 650;
      const ctx = copy.getContext("2d");
      const pixels = (points) => {
        renderer.draw(1280, 650, 3, points);
        ctx.drawImage(canvas, 0, 0);
        return ctx.getImageData(960, 540, 160, 100).data;
      };
      const a = pixels([]),
        b = pixels([{ x: 1040, y: 590, time: 3 }]);
      let delta = 0;
      for (let i = 0; i < a.length; i += 4) delta += Math.abs(a[i] - b[i]);
      renderer.dispose();
      return delta / (a.length / 4);
    }, name);
    assert.ok(
      delta > 6,
      `${name}: cursor must visibly change the halftone at a fixed phase`,
    );
    await page.locator("[data-motion-toggle]").click();
    await expect(page.locator(".cloud-field")).not.toHaveClass(/is-active/);
    await page.locator("[data-motion-toggle]").click();
    await expect(page.locator(".cloud-field")).toHaveClass(/is-active/);
    await page
      .locator(".cloud-canvas")
      .evaluate((c) =>
        c.getContext("webgl").getExtension("WEBGL_lose_context").loseContext(),
      );
    await expect(page.locator(".cloud-field")).not.toHaveClass(/is-active/);
    await expect(page.locator(".cloud-poster")).toBeVisible();
    const bytes = (await stat(`images/hero-${name}-1600.png`)).size;
    report.interactions.push({
      name,
      cursorPixelDelta: delta,
      stableText: true,
      pauseResume: true,
      contextLossFallback: true,
      desktopPosterBytes: bytes,
    });
    await page.close();
  }
  // Unknown options retain the authored Horizon; no-JS uses its matching poster.
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.goto("http://127.0.0.1:4183/?background=horizon");
  await expect(page.locator(".cloud-poster")).toBeVisible();
  await page.close();
  const fallback = await browser.newPage();
  await fallback.goto("http://127.0.0.1:4183/?background=unknown");
  assert.equal(
    await fallback.locator(".cloud-field").getAttribute("data-background"),
    "horizon",
  );
  await fallback.close();
  assert.deepEqual(report.errors, []);
  report.passed = true;
  console.log(JSON.stringify(report.interactions));
} finally {
  await writeFile(`${root}/checks.json`, JSON.stringify(report, null, 2));
  await browser.close();
}

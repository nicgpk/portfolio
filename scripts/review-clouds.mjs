import { chromium, expect } from "./review-browser.mjs";
import assert from "node:assert/strict";
import { mkdir, writeFile, rename, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
process.env.PLAYWRIGHT_BROWSERS_PATH = fileURLToPath(
  new URL("../node_modules/.cache/ms-playwright", import.meta.url),
);
await mkdir("review/etch-revision/after", { recursive: true });
const browser = await chromium.launch();
const checks = [],
  errors = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    recordVideo: {
      dir: ".local-preview/etch-video",
      size: { width: 1440, height: 1000 },
    },
  });
  await context.addInitScript(() => {
    window.__frames = 0;
    const raf = requestAnimationFrame;
    window.requestAnimationFrame = (cb) => {
      window.__frames++;
      return raf(cb);
    };
    const upload = WebGLRenderingContext.prototype.texImage2D;
    WebGLRenderingContext.prototype.texImage2D = function (...args) {
      const source = args.at(-1);
      if (source instanceof HTMLCanvasElement) {
        const pixels = source
          .getContext("2d")
          .getImageData(0, 0, source.width, source.height).data;
        let alpha = 0;
        for (let i = 3; i < pixels.length; i += 4) alpha += pixels[i];
        window.__brushInk = alpha;
      }
      return upload.apply(this, args);
    };
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4183/");
  await page.evaluate(() => document.fonts.ready);
  const field = page.locator(".cloud-field"),
    canvas = page.locator(".cloud-canvas");
  await expect(field).toHaveClass(/is-active/);
  const reading = await page.locator("#hero-title").boundingBox();
  const label = await page.locator(".hero-actions").boundingBox();
  await page.screenshot({
    path: "review/etch-revision/after/opening-1440.png",
  });
  await page.screenshot({
    path: "review/after/index-1440.png",
    fullPage: true,
  });
  const phase1 = await canvas.evaluate((c) => {
    const gl = c.getContext("webgl"),
      p = gl.getParameter(gl.CURRENT_PROGRAM);
    return gl.getUniform(p, gl.getUniformLocation(p, "time"));
  });
  await page.waitForTimeout(350);
  const phase2 = await canvas.evaluate((c) => {
    const gl = c.getContext("webgl"),
      p = gl.getParameter(gl.CURRENT_PROGRAM);
    return gl.getUniform(p, gl.getUniformLocation(p, "time"));
  });
  assert.ok(phase2 > phase1, "Visible ambient phase must advance.");
  const stageBox = await page.locator(".hero-stage").boundingBox();
  for (let x = 200; x < 1190; x += 24) {
    await page.mouse.move(
      x,
      stageBox.y + stageBox.height * 0.88 + Math.sin(x / 120) * 12,
    );
    await page.waitForTimeout(12);
  }
  assert.ok(
    await page.evaluate(() => window.__brushInk > 2000),
    "Mouse movement must upload a nonempty brush texture.",
  );
  assert.deepEqual(await page.locator("#hero-title").boundingBox(), reading);
  assert.deepEqual(await page.locator(".hero-actions").boundingBox(), label);
  await page.screenshot({ path: "review/etch-revision/after/trail-1440.png" });
  checks.push(
    "Full-hero WebGL halftone advances its ambient phase; real mouse input uploads visible brush ink while text and actions stay stationary.",
  );
  await page.mouse.move(10, 20);
  await page.waitForTimeout(2100);
  assert.equal(await page.evaluate(() => window.__brushInk), 0);
  checks.push("Cursor trails dissolve after pointer exit.");
  await page.locator("[data-motion-toggle]").click();
  await expect(field).not.toHaveClass(/is-active/);
  await page.waitForTimeout(200);
  const pausedFrames = await page.evaluate(() => window.__frames);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => window.__frames), pausedFrames);
  await page.reload();
  await expect(page.locator("[data-motion-toggle]")).toHaveText(
    "Resume motion",
  );
  await expect(field).not.toHaveClass(/is-active/);
  await page.locator("[data-motion-toggle]").click();
  await expect(field).toHaveClass(/is-active/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(field).not.toHaveClass(/is-active/);
  await expect(page.locator("[data-motion-toggle]")).toHaveText("Motion off");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(field).toHaveClass(/is-active/);
  checks.push(
    "Persistent pause and live reduced-motion changes switch to the poster and stop frame requests; resume restarts safely.",
  );
  await page.locator("#about").scrollIntoViewIfNeeded();
  await expect(field).not.toHaveClass(/is-active/);
  await page.waitForTimeout(250);
  const offscreen = await page.evaluate(() => window.__frames);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => window.__frames), offscreen);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(field).toHaveClass(/is-active/);
  checks.push(
    "Offscreen artwork stops requesting frames and resumes on return; vertical scrolling stays native.",
  );
  await page.emulateMedia({ forcedColors: "active" });
  await expect(field).not.toBeVisible();
  await page.emulateMedia({ forcedColors: "none" });
  await expect(field).toHaveClass(/is-active/);
  await canvas.evaluate((c) =>
    c.getContext("webgl").getExtension("WEBGL_lose_context").loseContext(),
  );
  await expect(field).not.toHaveClass(/is-active/);
  await expect(page.locator(".cloud-poster")).toBeVisible();
  checks.push(
    "Forced colors hides the decoration; WebGL context loss leaves an intact static poster and working content.",
  );
  const video = page.video();
  await context.close();
  await rename(
    await video.path(),
    "review/etch-revision/after/cursor-demo.webm",
  );

  // Compare the actual shader output at a fixed phase, avoiding ambient movement as a false positive.
  const p = await browser.newPage();
  await p.goto("http://127.0.0.1:4183/");
  const ink = await p.evaluate(async () => {
    const { createHalftoneRenderer } = await import("/js/halftone.mjs");
    const source = new Image();
    source.src = "/images/hero-clouds-1600.webp";
    await source.decode();
    const c = document.createElement("canvas");
    c.width = 1280;
    c.height = 650;
    const r = createHalftoneRenderer(c, source);
    const copy = document.createElement("canvas");
    copy.width = 1280;
    copy.height = 650;
    const ctx = copy.getContext("2d");
    const pixels = (points) => {
      r.draw(1280, 650, 3, points);
      ctx.drawImage(c, 0, 0);
      return ctx.getImageData(960, 540, 160, 100).data;
    };
    const a = pixels([]),
      b = pixels([{ x: 1040, y: 590, time: 3 }]);
    let delta = 0;
    for (let i = 0; i < a.length; i += 4) delta += Math.abs(a[i] - b[i]);
    r.dispose();
    return delta / (a.length / 4);
  });
  assert.ok(ink > 12, `Brush must visibly change ink pixels, observed ${ink}.`);
  checks.push(
    `At a fixed animation phase, the cursor brush changes the sampled ink by ${ink.toFixed(1)} levels per pixel; the effect is visible, not just pointer bookkeeping.`,
  );
  await p.close();
  for (const width of [320, 390, 768, 1440]) {
    const ctx = await browser.newContext({
      viewport: { width, height: 1000 },
      isMobile: width < 900,
      hasTouch: width < 900,
      reducedMotion: "reduce",
    });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://127.0.0.1:4183/");
    await p.evaluate(() => document.fonts.ready);
    await expect(p.locator(".cloud-poster")).toBeVisible();
    assert.ok(
      await p
        .locator(".cloud-poster")
        .evaluate((e) => e.complete && e.naturalWidth > 0),
    );
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
    );
    await expect(p.locator(".cloud-field")).not.toHaveClass(/is-active/);
    if (width === 390) {
      await p.screenshot({
        path: "review/etch-revision/after/opening-390.png",
      });
      await p.screenshot({
        path: "review/after/index-390.png",
        fullPage: true,
      });
    }
    await ctx.close();
  }
  const touch = await browser.newContext({
    viewport: { width: 390, height: 1000 },
    isMobile: true,
    hasTouch: true,
  });
  const touchPage = await touch.newPage();
  await touchPage.goto("http://127.0.0.1:4183/");
  await touchPage.mouse.move(290, 500);
  await expect(touchPage.locator(".cloud-field")).not.toHaveClass(/is-active/);
  await touch.close();
  checks.push(
    "320/390/768/1440 reduced-motion layouts and touch views retain readable static halftone with no document overflow.",
  );
  for (const disable of ["javascript", "webgl"]) {
    const ctx = await browser.newContext({
      javaScriptEnabled: disable !== "javascript",
      viewport: { width: 1440, height: 1000 },
    });
    if (disable === "webgl")
      await ctx.addInitScript(() => {
        const get = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          return type.startsWith("webgl")
            ? null
            : get.call(this, type, ...args);
        };
      });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://127.0.0.1:4183/");
    await expect(p.locator(".cloud-poster")).toBeVisible();
    assert.ok(
      await p
        .locator(".cloud-poster")
        .evaluate((e) => e.complete && e.naturalWidth > 0),
    );
    await expect(
      p.locator(".showcase-card--growth .showcase-card-link"),
    ).toHaveAttribute("href", "partner-growth-programs.html");
    await ctx.close();
  }
  checks.push(
    "No-JavaScript and unavailable-WebGL paths retain the complete poster and first project's case link.",
  );
  assert.deepEqual(errors, []);
  for (const width of [1440, 390])
    await copyFile(
      `review/etch-revision/after/opening-${width}.png`,
      `review/after/first-viewport-${width}.png`,
    );
  await copyFile(
    "review/etch-revision/after/opening-1440.png",
    "review/after/showcase-opening-1440.png",
  );
  await writeFile(
    "review/etch-revision/checks.json",
    JSON.stringify({ passed: true, checks, errors }, null, 2) + "\n",
  );
  console.log(JSON.stringify({ passed: true, checks }));
} finally {
  await browser.close();
}

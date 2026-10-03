import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile, rename, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
process.env.PLAYWRIGHT_BROWSERS_PATH = fileURLToPath(
  new URL("../node_modules/.cache/ms-playwright", import.meta.url),
);
await mkdir("review/cloud-revision/after", { recursive: true });
const browser = await chromium.launch();
const checks = [];
const errors = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    recordVideo: {
      dir: ".local-preview/cloud-video",
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
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:4183/");
  await page.evaluate(() => document.fonts.ready);
  const art = page.locator(".cloud-atmosphere");
  const heading = page.locator("#hero-title");
  const label = page.locator(".landscape-label--three");
  const initial = await heading.boundingBox();
  const labelInitial = await label.boundingBox();
  await page.screenshot({
    path: "review/cloud-revision/after/opening-1440.png",
  });
  await page.screenshot({
    path: "review/after/index-1440.png",
    fullPage: true,
  });
  await page.mouse.move(1180, 640);
  await expect
    .poll(() => art.evaluate((el) => getComputedStyle(el).transform))
    .not.toBe("none");
  await expect
    .poll(() =>
      page
        .locator(".cloud-light")
        .evaluate((el) => Number(getComputedStyle(el).opacity)),
    )
    .toBeGreaterThan(0.25);
  assert.deepEqual(await heading.boundingBox(), initial);
  assert.deepEqual(await label.boundingBox(), labelInitial);
  await page.waitForTimeout(1800);
  const frames = await page.evaluate(() => window.__frames);
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => window.__frames), frames);
  await page.screenshot({
    path: "review/cloud-revision/after/cursor-1440.png",
  });
  checks.push(
    "Cursor changes cloud position and light while headings and program labels remain stationary; frames stop at rest.",
  );
  await page.mouse.move(240, 600);
  await page.waitForTimeout(700);
  await page.mouse.move(10, 20);
  await expect
    .poll(() => art.evaluate((el) => getComputedStyle(el).transform))
    .toBe("matrix(1, 0, 0, 1, 0, 0)");
  await expect
    .poll(() =>
      page
        .locator(".cloud-light")
        .evaluate((el) => Number(getComputedStyle(el).opacity)),
    )
    .toBe(0);
  checks.push(
    "Leaving the hero returns the cloud to neutral and fades the light.",
  );
  await page.mouse.move(1180, 640);
  await page.locator("[data-motion-toggle]").click();
  await expect(art).not.toHaveAttribute("style", /transform/);
  await page.mouse.move(240, 600);
  await page.waitForTimeout(250);
  await expect(art).not.toHaveAttribute("style", /transform/);
  await page.reload();
  await expect(page.locator("[data-motion-toggle]")).toHaveText(
    "Resume motion",
  );
  await page.mouse.move(1180, 640);
  await expect(art).not.toHaveAttribute("style", /transform/);
  await page.locator("[data-motion-toggle]").click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.mouse.move(240, 600);
  await expect(page.locator("[data-motion-toggle]")).toHaveText("Motion off");
  await expect(art).not.toHaveAttribute("style", /transform/);
  checks.push(
    "Persistent pause and live OS reduced-motion changes reset and disable cursor effects.",
  );
  await page.emulateMedia({ forcedColors: "active" });
  await expect(page.locator(".hero-landscape")).not.toBeVisible();
  checks.push("Forced colors hides decorative cloud art.");
  const video = page.video();
  await context.close();
  await rename(
    await video.path(),
    "review/cloud-revision/after/cursor-demo.webm",
  );
  for (const width of [320, 390, 768, 1440]) {
    const mobile = width < 900;
    const ctx = await browser.newContext({
      viewport: { width, height: 1000 },
      isMobile: mobile,
      hasTouch: mobile,
    });
    const p = await ctx.newPage();
    p.on("pageerror", (error) => errors.push(error.message));
    await p.goto("http://127.0.0.1:4183/");
    await p.evaluate(() => document.fonts.ready);
    const image = p.locator(".cloud-atmosphere img");
    assert.ok(await image.evaluate((el) => el.complete && el.naturalWidth > 0));
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
    );
    if (mobile) {
      await p.mouse.move(width * 0.75, 540);
      await expect(p.locator(".cloud-atmosphere")).not.toHaveAttribute(
        "style",
        /transform/,
      );
    }
    if (width === 390) {
      await p.screenshot({
        path: "review/cloud-revision/after/opening-390.png",
      });
      await p.screenshot({
        path: "review/after/index-390.png",
        fullPage: true,
      });
    }
    await ctx.close();
  }
  checks.push(
    "320/390/768/1440 layouts load the responsive cloud image with no document overflow; touch views remain static.",
  );
  const staticContext = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 1000 },
  });
  const p = await staticContext.newPage();
  await p.goto("http://127.0.0.1:4183/");
  await expect(p.locator(".cloud-atmosphere img")).toBeVisible();
  assert.ok(
    await p
      .locator(".cloud-atmosphere img")
      .evaluate((el) => el.complete && el.naturalWidth > 0),
  );
  await expect(
    p.getByRole("link", { name: "Explore Partner Growth Programs" }),
  ).toHaveAttribute("href", "partner-growth-programs.html");
  await staticContext.close();
  checks.push(
    "No-JavaScript cloud image and flagship case link remain available.",
  );
  assert.deepEqual(errors, []);
  for (const width of [1440, 390])
    await copyFile(
      `review/cloud-revision/after/opening-${width}.png`,
      `review/after/first-viewport-${width}.png`,
    );
  await copyFile(
    "review/cloud-revision/after/opening-1440.png",
    "review/after/showcase-opening-1440.png",
  );
  await writeFile(
    "review/cloud-revision/checks.json",
    JSON.stringify({ passed: true, checks, errors }, null, 2) + "\n",
  );
  console.log(JSON.stringify({ passed: true, checks }));
} finally {
  await browser.close();
}

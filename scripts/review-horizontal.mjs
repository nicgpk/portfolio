import { chromium, expect } from "@playwright/test";
import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";

process.env.PLAYWRIGHT_BROWSERS_PATH = new URL(
  "../node_modules/.cache/ms-playwright",
  import.meta.url,
).pathname.replace(/^\/(\w:)/, "$1");
const browser = await chromium.launch();
const axe = await readFile("node_modules/axe-core/axe.min.js", "utf8");
await mkdir(".local-preview/horizontal-recording", { recursive: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: {
    dir: ".local-preview/horizontal-recording",
    size: { width: 1440, height: 900 },
  },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const checks = [];
await page.goto("http://127.0.0.1:4183/");
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);
assert.equal(
  await page.evaluate(() => scrollY),
  0,
  "Loading the gallery must not scroll past the identity.",
);
await expect(page.locator(".project-rail")).toHaveClass(/is-scroll-linked/);
await page.screenshot({ path: "review/after/horizontal-opening-1440.png" });
await page.addScriptTag({ content: axe });
assert.deepEqual(
  await page.evaluate(async () =>
    (
      await axe.run({
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        },
      })
    ).violations.map((v) => v.id),
  ),
  [],
);
checks.push(
  "The normal-motion desktop gallery starts at the top with visible identity and passes automated WCAG A/AA rules.",
);
await page.mouse.move(500, 450);
await page.mouse.wheel(0, 750);
await expect
  .poll(() =>
    page.locator("[data-rail-viewport]").evaluate((el) => el.scrollLeft),
  )
  .toBeGreaterThan(500);
assert.equal(await page.evaluate(() => scrollX), 0);
await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(600);
checks.push(
  "Native vertical wheel movement advances the horizontal row while the document has no horizontal overflow.",
);
const viewport = page.locator("[data-rail-viewport]");
await viewport.focus();
for (const [key, index, name] of [
  ["Home", 0, "growth"],
  ["ArrowRight", 1, "discount"],
  ["End", 2, "developer"],
]) {
  await page.keyboard.press(key);
  await expect(page.locator("[data-rail-status]")).toHaveText(
    `${index + 1} of 3`,
  );
  await page.waitForTimeout(900);
  await page.locator(".rail-stage").screenshot({
    path: `review/after/horizontal-${name}-1440.png`,
    style: ".site-nav,.motion-control {visibility:hidden}",
  });
}
await expect(page.locator("[data-rail-next]")).toBeDisabled();
await page.setViewportSize({ width: 390, height: 844 });
await expect(page.locator("[data-rail-status]")).toHaveText("3 of 3");
await expect(page.locator(".project-rail")).not.toHaveClass(/is-scroll-linked/);
await page.setViewportSize({ width: 1440, height: 900 });
await expect(page.locator("[data-rail-status]")).toHaveText("3 of 3");
await expect(page.locator(".project-rail")).toHaveClass(/is-scroll-linked/);
checks.push(
  "Resizing desktop to mobile and back retains the selected Developer Portal card.",
);
await page.getByRole("button", { name: "Previous project" }).click();
await expect(page.locator("[data-rail-status]")).toHaveText("2 of 3");
await page.waitForTimeout(700);
await page.keyboard.press("Tab");
for (const link of await page.locator(".rail-card-link").all()) {
  await link.focus();
  await page.waitForTimeout(100);
  const box = await link.boundingBox();
  assert.ok(
    box.x >= 50 &&
      box.x + box.width <= 1390 &&
      box.y >= 104 &&
      box.y + box.height <= 900,
    `Focused card fully visible: ${JSON.stringify(box)}`,
  );
  assert.equal(await link.evaluate((el) => el.matches(":focus-visible")), true);
}
checks.push(
  "Arrow keys, Home/End, Previous/Next and card focus reveal all three complete cards below the navigation.",
);
await page.keyboard.press("Home");
await expect(page.locator(".rail-card-link").first()).toBeFocused();
await expect(page.locator("[data-rail-status]")).toHaveText("1 of 3");
await page.keyboard.press("End");
await expect(page.locator(".rail-card-link").last()).toBeFocused();
await expect(page.locator("[data-rail-status]")).toHaveText("3 of 3");
checks.push(
  "Shortcuts from a card link move keyboard focus to the newly visible project.",
);
await page.locator("[data-motion-toggle]").click();
await expect(page.locator(".project-rail")).not.toHaveClass(/is-scroll-linked/);
await expect(page.locator("[data-rail-status]")).toHaveText("3 of 3");
await page.getByRole("button", { name: "Previous project" }).click();
await expect(page.locator("[data-rail-status]")).toHaveText("2 of 3");
await page.locator("[data-motion-toggle]").click();
await expect(page.locator(".project-rail")).toHaveClass(/is-scroll-linked/);
await expect(page.locator("[data-rail-status]")).toHaveText("2 of 3");
// Change preference while a pointer spring is active, not only when settled.
const movingArt = await page
  .locator(".rail-card--discount .graphic-scene")
  .boundingBox();
await page.mouse.move(movingArt.x + movingArt.width * 0.9, movingArt.y + 30);
await page.emulateMedia({ reducedMotion: "reduce" });
await expect(page.locator(".project-rail")).not.toHaveClass(/is-scroll-linked/);
await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
await viewport.focus();
await page.keyboard.press("End");
await expect(page.locator("[data-rail-status]")).toHaveText("3 of 3");
await page.locator(".rail-card-link").last().focus();
await page.keyboard.press("Home");
await expect(page.locator(".rail-card-link").first()).toBeFocused();
await page.keyboard.press("End");
await expect(page.locator(".rail-card-link").last()).toBeFocused();
checks.push(
  "Pause/resume retains the current project; reduced motion uses an unpinned native horizontal gallery with instant controls.",
);
await page.emulateMedia({ reducedMotion: "no-preference" });
await viewport.focus();
await page.keyboard.press("End");
await page.mouse.wheel(0, 1300);
await page.waitForTimeout(800);
const aboutTop = await page
  .locator("#about")
  .evaluate((el) => el.getBoundingClientRect().top);
assert.ok(aboutTop < 900);
checks.push(
  "Scrolling beyond the final project reaches the rest of the document; there is no scroll trap.",
);

const mobile = await browser.newContext({
  viewport: { width: 390, height: 900 },
  isMobile: true,
  hasTouch: true,
});
const phone = await mobile.newPage();
await phone.goto("http://127.0.0.1:4183/");
await phone.evaluate(() => document.fonts.ready);
await expect(phone.locator(".project-rail")).not.toHaveClass(
  /is-scroll-linked/,
);
await phone.locator("[data-rail-viewport]").scrollIntoViewIfNeeded();
const touch = await mobile.newCDPSession(phone);
const touchBox = await phone.locator("[data-rail-viewport]").boundingBox();
const y = Math.min(750, touchBox.y + 380);
await touch.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ x: 330, y }],
});
for (let x = 305; x >= 55; x -= 25) {
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x, y }],
  });
}
await touch.send("Input.dispatchTouchEvent", {
  type: "touchEnd",
  touchPoints: [],
});
await expect
  .poll(() =>
    phone.locator("[data-rail-viewport]").evaluate((el) => el.scrollLeft),
  )
  .toBeGreaterThan(80);
await phone.getByRole("button", { name: "Next project" }).click();
await expect(phone.locator("[data-rail-status]")).toHaveText("3 of 3");
for (const [index, name] of [
  [0, "growth"],
  [1, "discount"],
  [2, "developer"],
]) {
  await phone.locator(".rail-card-link").nth(index).focus();
  await phone.waitForTimeout(150);
  await phone.locator(".rail-stage").screenshot({
    path: `review/after/horizontal-${name}-390.png`,
    style: ".site-nav,.motion-control {visibility:hidden}",
  });
  assert.equal(
    await phone.evaluate(() => document.documentElement.scrollWidth),
    390,
  );
}
checks.push(
  "Emulated touch swipe advances the mobile gallery; buttons and focus reach every project without page overflow.",
);
await mobile.close();

const nojs = await browser.newContext({
  javaScriptEnabled: false,
  viewport: { width: 1440, height: 900 },
});
const staticPage = await nojs.newPage();
await staticPage.goto("http://127.0.0.1:4183/");
await expect(staticPage.locator(".project-rail")).not.toHaveClass(
  /is-scroll-linked/,
);
await staticPage.locator(".rail-card-link").last().focus();
const staticBox = await staticPage
  .locator(".rail-card-link")
  .last()
  .boundingBox();
assert.ok(staticBox.x >= 0 && staticBox.x + staticBox.width <= 1440);
await nojs.close();
checks.push(
  "Without JavaScript the native horizontal gallery and all case-study links remain accessible.",
);
assert.deepEqual(errors, []);
await writeFile(
  "review/horizontal-checks.json",
  JSON.stringify(
    {
      checks,
      errors,
      limitations:
        "Chromium desktop and emulated touch only; real devices and screen readers are untested.",
    },
    null,
    2,
  ),
);
const video = await page.video().path();
await context.close();
await rename(video, "review/after/horizontal-motion.webm");
await browser.close();
console.log(JSON.stringify({ checks, errors }, null, 2));

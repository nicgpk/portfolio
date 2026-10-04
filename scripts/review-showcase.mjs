import { chromium, expect } from "./review-browser.mjs";
import assert from "node:assert/strict";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const afterDirectory = join(projectRoot, "review", "after");
const recordingDirectory = join(
  projectRoot,
  ".local-preview",
  "showcase-recording",
);
const reportPath = join(projectRoot, "review", "showcase-checks.json");
const previewUrl =
  process.env.PORTFOLIO_PREVIEW_URL || "http://127.0.0.1:4183/";
process.env.PLAYWRIGHT_BROWSERS_PATH = join(
  projectRoot,
  "node_modules",
  ".cache",
  "ms-playwright",
);

const projects = [
  {
    name: "growth",
    route: "partner-growth-programs.html",
    heading: /Partner\s*Growth/i,
  },
  { name: "discount", route: "discounting.html", heading: /Discounting/i },
  { name: "developer", route: "dev-portal.html", heading: /Developer/i },
];
const viewports = [
  { width: 320, height: 800, mobile: true },
  { width: 390, height: 844, mobile: true },
  { width: 768, height: 900, mobile: true },
  { width: 1440, height: 900, mobile: false },
  { width: 844, height: 390, mobile: true },
  { width: 1440, height: 600, mobile: false },
];
const report = {
  checkedAt: new Date().toISOString(),
  browser: "Project-local Chromium on Windows",
  viewports: [],
  noJavaScript: [],
  preferences: [],
  resizing: [],
  deepSwipe: [],
  captures: [],
  errors: [],
  limitations:
    "Desktop and emulated mobile Chromium; real devices, Safari, Firefox and screen-reader announcements are not verified.",
};
const contexts = new Set();
let browser;

async function createPage(viewport, extra = {}) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.mobile,
    hasTouch: viewport.mobile,
    ...extra,
  });
  contexts.add(context);
  const page = await context.newPage();
  page.on("pageerror", (error) =>
    report.errors.push({ viewport, message: error.message }),
  );
  await page.goto(previewUrl);
  await page.evaluate(() => document.fonts.ready);
  return { context, page };
}

async function closeContext(context) {
  await context.close();
  contexts.delete(context);
}

async function assertReadable(page) {
  await expect(page.locator(".project-showcase")).toHaveCount(1);
  const cards = page.locator(".project-showcase .showcase-card");
  await expect(cards).toHaveCount(3);
  const links = page.locator(".project-showcase .showcase-card-link");
  await expect(links).toHaveCount(3);
  const evidence = [];
  for (let i = 0; i < projects.length; i++) {
    const link = links.nth(i);
    await expect(link).toHaveAttribute("href", projects[i].route);
    const heading = link.getByRole("heading").first();
    await expect(heading).toContainText(projects[i].heading);
    await expect(heading).toBeVisible();
    const readable = await heading.evaluate((element) => {
      for (let current = element; current; current = current.parentElement) {
        const style = getComputedStyle(current);
        if (
          style.visibility !== "visible" ||
          style.display === "none" ||
          Number(style.opacity) < 0.1
        )
          return false;
      }
      return true;
    });
    assert.ok(
      readable,
      `${projects[i].name} heading must be readable before interaction.`,
    );
    evidence.push({
      route: projects[i].route,
      heading: await heading.innerText(),
    });
  }
  await expect(page.locator("[data-showcase-prev]")).toHaveCount(1);
  await expect(page.locator("[data-showcase-next]")).toHaveCount(1);
  return evidence;
}

async function assertRailLayout(page) {
  const rail = page.getByRole("region", {
    name: "Selected projects",
    exact: true,
  });
  await expect(rail).toHaveCount(1);
  await expect(page.locator(".showcase-track")).toHaveCount(1);
  await expect(rail).toHaveClass(/showcase-track/);
  await expect(rail).toHaveAttribute("tabindex", "0");
  const metrics = await page.evaluate(() => {
    const root = document.querySelector(".project-showcase");
    const rail = root.querySelector(".showcase-track");
    const railStyle = getComputedStyle(rail);
    const railBox = rail.getBoundingClientRect();
    const instructions = (rail.getAttribute("aria-describedby") || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => document.getElementById(id)?.textContent.trim());
    const horizontalContainers = [root, ...root.querySelectorAll("*")]
      .filter((element) => element instanceof HTMLElement)
      .filter(
        (element) =>
          /^(auto|scroll)$/.test(getComputedStyle(element).overflowX) &&
          element.scrollWidth > element.clientWidth + 1,
      )
      .map((element) => ({
        tag: element.tagName,
        class: element.className,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
    const cards = [...root.querySelectorAll(".showcase-card")].map(
      (element) => {
        const box = element.getBoundingClientRect();
        return {
          left: box.left,
          right: box.right,
          top: box.top,
          bottom: box.bottom,
          position: getComputedStyle(element).position,
        };
      },
    );
    return {
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      scrollX,
      horizontalContainers,
      cards,
      rail: {
        left: railBox.left,
        right: railBox.right,
        clientWidth: rail.clientWidth,
        scrollWidth: rail.scrollWidth,
        scrollLeft: rail.scrollLeft,
        scrollbarWidth: railStyle.scrollbarWidth,
        webkitScrollbarDisplay: getComputedStyle(rail, "::-webkit-scrollbar")
          .display,
        instructions,
      },
      horizontalModuleLoaded: performance
        .getEntriesByType("resource")
        .some((entry) => /\/horizontal-work\.mjs(?:[?#]|$)/.test(entry.name)),
      dimensionalResources: performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((url) =>
          /\/images\/dimensional\/|\/[^/?#]*dimensional[^/?#]*\.css(?:[?#]|$)/i.test(
            url,
          ),
        ),
    };
  });
  assert.ok(
    metrics.documentWidth <= metrics.viewportWidth + 1,
    `Global overflow: ${JSON.stringify(metrics)}`,
  );
  assert.ok(
    Math.abs(metrics.scrollX) < 1,
    "The document must not scroll horizontally.",
  );
  assert.equal(
    metrics.horizontalContainers.length,
    1,
    "The project track must be the only horizontal scrolling region in the showcase.",
  );
  assert.match(metrics.horizontalContainers[0].class, /showcase-track/);
  assert.ok(
    metrics.rail.left >= -1 && metrics.rail.right <= metrics.viewportWidth + 1,
  );
  assert.ok(metrics.rail.scrollWidth > metrics.rail.clientWidth + 1);
  assert.equal(
    metrics.rail.scrollbarWidth,
    "none",
    "The native rail scrollbar must be hidden.",
  );
  assert.equal(metrics.rail.webkitScrollbarDisplay, "none");
  assert.ok(
    metrics.rail.instructions.length &&
      metrics.rail.instructions.every(Boolean),
    "The focusable rail needs visible instructions linked by aria-describedby.",
  );
  assert.equal(
    metrics.horizontalModuleLoaded,
    false,
    "The home must not load horizontal scroll-linking code.",
  );
  assert.deepEqual(
    metrics.dimensionalResources,
    [],
    "Home must not load the superseded 3D assets or dimensional stylesheet.",
  );
  for (let i = 0; i < metrics.cards.length; i++) {
    assert.ok(
      !["fixed", "sticky"].includes(metrics.cards[i].position),
      "Project covers must remain in ordinary document flow.",
    );
    if (i)
      assert.ok(
        metrics.cards[i].left >= metrics.cards[i - 1].right - 1 &&
          Math.abs(metrics.cards[i].top - metrics.cards[0].top) < 1,
        "Project covers must form a horizontal sequence.",
      );
  }
  return metrics;
}

async function expectProject(page, index) {
  const rail = page.locator(".showcase-track");
  await expect(page.locator("[data-showcase-position]")).toHaveText(
    `${index + 1} of 3`,
  );
  let revealGeometry;
  try {
    await expect
      .poll(
        async () => {
          const track = await rail.boundingBox();
          const card = await page
            .locator(".showcase-card")
            .nth(index)
            .boundingBox();
          revealGeometry = {
            project: projects[index].name,
            viewport: page.viewportSize(),
            track,
            card,
            scrollLeft: await rail.evaluate((element) => element.scrollLeft),
          };
          return (
            !!track &&
            !!card &&
            card.x >= track.x - 1 &&
            card.x + card.width <= track.x + track.width + 1
          );
        },
        {
          message: `Selected ${projects[index].name} card must fit inside the rail.`,
        },
      )
      .toBe(true);
  } catch (error) {
    error.message += `\nReveal geometry: ${JSON.stringify(revealGeometry)}`;
    throw error;
  }
  const previous = page.locator("[data-showcase-prev]");
  const next = page.locator("[data-showcase-next]");
  if (index === 0) await expect(previous).toBeDisabled();
  else await expect(previous).toBeEnabled();
  if (index === 2) await expect(next).toBeDisabled();
  else await expect(next).toBeEnabled();
  return rail.evaluate((element) => ({
    left: element.scrollLeft,
    max: element.scrollWidth - element.clientWidth,
  }));
}

async function assertRailNavigation(page) {
  const rail = page.locator(".showcase-track");
  const previous = page.getByRole("button", {
    name: "Previous project",
    exact: true,
  });
  const next = page.getByRole("button", { name: "Next project", exact: true });
  await expect(previous).toBeVisible();
  await expect(next).toBeVisible();
  await expect(page.locator("[data-showcase-status]")).toBeVisible();
  await rail.focus();
  await expect(rail).toBeFocused();
  const steps = [];
  for (const [key, index] of [
    ["Home", 0],
    ["ArrowRight", 1],
    ["ArrowLeft", 0],
    ["End", 2],
    ["Home", 0],
  ]) {
    await page.keyboard.press(key);
    steps.push({
      action: key,
      project: projects[index].name,
      ...(await expectProject(page, index)),
    });
    await expect(rail).toBeFocused();
  }
  for (const [control, index] of [
    [next, 1],
    [next, 2],
    [previous, 1],
    [previous, 0],
  ]) {
    await control.click();
    steps.push({
      action: await control.getAttribute("aria-label"),
      project: projects[index].name,
      ...(await expectProject(page, index)),
    });
  }
  const firstLink = page.locator(".showcase-card-link").first();
  await firstLink.focus();
  await expectProject(page, 0);
  await page.evaluate(() => {
    window.showcaseLinkKeyProbe = null;
    document.addEventListener(
      "keydown",
      (event) => {
        window.showcaseLinkKeyProbe = {
          key: event.key,
          prevented: event.defaultPrevented,
        };
      },
      { once: true },
    );
  });
  await page.keyboard.press("ArrowRight");
  assert.deepEqual(
    await page.evaluate(() => window.showcaseLinkKeyProbe),
    { key: "ArrowRight", prevented: false },
    "Gallery shortcuts must not intercept keys from a case-study link.",
  );
  await expect(firstLink).toBeFocused();
  await settleRail(page);
  return steps;
}

async function settleRail(page) {
  let previous;
  let stable = 0;
  await expect
    .poll(
      async () => {
        const current = await page
          .locator(".showcase-track")
          .evaluate((rail) => ({ x: rail.scrollLeft, y: scrollY }));
        stable =
          previous &&
          Math.abs(current.x - previous.x) < 0.5 &&
          Math.abs(current.y - previous.y) < 0.5
            ? stable + 1
            : 0;
        previous = current;
        return stable >= 3;
      },
      {
        timeout: 5000,
        intervals: [100],
        message:
          "Native fling/snap must settle before the next navigation action.",
      },
    )
    .toBe(true);
}

async function expectActiveHeight(page, index) {
  let geometry;
  try {
    await expect
      .poll(
        async () => {
          geometry = await page
            .locator(".showcase-track")
            .evaluate((track, index) => {
              const card = track.querySelectorAll(".showcase-card")[index];
              const style = getComputedStyle(track);
              return {
                railHeight: track.getBoundingClientRect().height,
                cardHeight: card.getBoundingClientRect().height,
                allCardHeights: [
                  ...track.querySelectorAll(".showcase-card"),
                ].map((card) => card.getBoundingClientRect().height),
                padding:
                  parseFloat(style.paddingTop) +
                  parseFloat(style.paddingBottom),
              };
            }, index);
          return (
            Math.abs(
              geometry.railHeight -
                Math.ceil(geometry.cardHeight) -
                geometry.padding,
            ) < 2 &&
            Math.max(...geometry.allCardHeights) -
              Math.min(...geometry.allCardHeights) <
              1
          );
        },
        {
          message: `The rail must fit all equal-height cards after selecting ${projects[index].name}.`,
        },
      )
      .toBe(true);
  } catch (error) {
    error.message += `\nHeight geometry: ${JSON.stringify({ project: projects[index].name, viewport: page.viewportSize(), ...geometry })}`;
    throw error;
  }
  return geometry;
}

async function assertDeepSwipe(page) {
  const rail = page.locator(".showcase-track");
  await rail.focus();
  await page.keyboard.press("Home");
  await expectProject(page, 0);
  await expectActiveHeight(page, 0);
  await rail.evaluate((element) =>
    scrollTo({
      top: scrollY + element.getBoundingClientRect().bottom - 110,
      behavior: "instant",
    }),
  );
  const beforeY = await page.evaluate(() => scrollY);
  assert.ok(
    beforeY > 0,
    "The deep-swipe probe must begin near the bottom of the Growth card.",
  );
  await page.keyboard.press("End");
  await expectProject(page, 2);
  const height = await expectActiveHeight(page, 2);
  const visible = await page
    .locator(".showcase-card")
    .nth(2)
    .evaluate((card) => {
      const box = card.getBoundingClientRect();
      const heading = card.querySelector("h3").getBoundingClientRect();
      const nav = document.querySelector(".site-nav").getBoundingClientRect();
      return {
        top: box.top,
        bottom: box.bottom,
        headingTop: heading.top,
        headingBottom: heading.bottom,
        navBottom: nav.bottom,
        viewportHeight: innerHeight,
      };
    });
  assert.ok(
    visible.headingTop >= visible.navBottom - 1 &&
      visible.headingBottom <= visible.viewportHeight + 1 &&
      visible.bottom > visible.navBottom + 80,
    `Selecting Developer Portal deep in Growth must reveal its heading: ${JSON.stringify(visible)}`,
  );
  return {
    beforeY,
    afterY: await page.evaluate(() => scrollY),
    visible,
    height,
  };
}

async function assertResponsiveSelection(page) {
  const rail = page.locator(".showcase-track");
  await rail.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  await expectProject(page, 1);
  const results = [];
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await expectProject(page, 1);
    const height = await expectActiveHeight(page, 1);
    await assertRailLayout(page);
    results.push({ viewport, project: "discount", height });
  }
  return results;
}

async function prepareRailPointer(page) {
  const rail = page.locator(".showcase-track");
  await rail.evaluate((element) => {
    element.scrollTo({ left: 0, behavior: "instant" });
    element.scrollIntoView({
      block: "start",
      inline: "nearest",
      behavior: "instant",
    });
  });
  const box = await rail.boundingBox();
  const nav = await page.getByRole("banner").boundingBox();
  const point = {
    x: box.x + box.width / 2,
    y: Math.min(
      page.viewportSize().height - 24,
      Math.max(nav.y + nav.height + 24, box.y + 72),
    ),
  };
  await page.mouse.move(point.x, point.y);
  await settleRail(page);
  return { rail, point };
}

async function assertNativeGestures(
  page,
  { shift = false, touch = false } = {},
) {
  const { rail } = await prepareRailPointer(page);
  const state = () =>
    rail.evaluate((element) => ({
      y: scrollY,
      left: element.scrollLeft,
      top: element.querySelector(".showcase-card").getBoundingClientRect().top,
    }));
  const before = await state();
  const pinned = await page
    .locator(".project-showcase")
    .evaluate((root) => root.classList.contains("is-scroll-gallery"));
  const desktopWheel = await rail.evaluate(
    (el) =>
      el.classList.contains("is-gallery-ready") &&
      innerWidth >= 900 &&
      matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  await page.mouse.wheel(0, 240);
  if (desktopWheel) {
    await expect
      .poll(async () => (await state()).left)
      .toBeGreaterThan(before.left + 10);
  } else {
    await expect
      .poll(async () => (await state()).y)
      .toBeGreaterThan(before.y + 100);
  }
  await settleRail(page);
  let afterVertical = await state();
  if (desktopWheel) {
    if (pinned)
      assert.ok(
        afterVertical.y > before.y,
        "Native vertical scrolling drives the pinned desktop gallery.",
      );
    else
      assert.ok(
        Math.abs(afterVertical.y - before.y) < 2,
        "Short/reduced desktop wheel moves the gallery while over its content.",
      );
    await prepareRailPointer(page);
    afterVertical = await state();
  } else {
    assert.ok(
      Math.abs(afterVertical.left - before.left) < 1,
      "Mobile and no-JavaScript wheel input keeps native vertical page scrolling.",
    );
    assert.ok(
      Math.abs(before.top - afterVertical.top - (afterVertical.y - before.y)) <
        2,
    );
  }
  const box = await rail.boundingBox();
  const nav = await page.getByRole("banner").boundingBox();
  await page.mouse.move(
    box.x + box.width / 2,
    Math.min(
      page.viewportSize().height - 24,
      Math.max(nav.y + nav.height + 24, box.y + 72),
    ),
  );
  await page.mouse.wheel(240, 0);
  await expect
    .poll(async () => (await state()).left)
    .toBeGreaterThan(afterVertical.left + 10);
  await settleRail(page);
  const afterHorizontal = await state();
  if (!pinned)
    assert.ok(
      Math.abs(afterHorizontal.y - afterVertical.y) < 2,
      "Native horizontal wheel scrolling keeps ordinary document position.",
    );
  assert.ok(Math.abs(await page.evaluate(() => scrollX)) < 1);
  const evidence = {
    verticalWheelDelta: afterVertical.y - before.y,
    horizontalWheelDelta: afterHorizontal.left - afterVertical.left,
  };
  if (shift) {
    await prepareRailPointer(page);
    const shiftedBefore = await state();
    await page.keyboard.down("Shift");
    try {
      await page.mouse.wheel(0, 240);
    } finally {
      await page.keyboard.up("Shift");
    }
    await expect
      .poll(async () => (await state()).left)
      .toBeGreaterThan(shiftedBefore.left + 10);
    await settleRail(page);
    const shiftedAfter = await state();
    if (!pinned) assert.ok(Math.abs(shiftedAfter.y - shiftedBefore.y) < 2);
    evidence.shiftWheelDelta = shiftedAfter.left - shiftedBefore.left;
  }
  if (touch) {
    const { point } = await prepareRailPointer(page);
    const touchBefore = await state();
    const touchBox = await rail.boundingBox();
    const startX = touchBox.x + touchBox.width - 28;
    const session = await page.context().newCDPSession(page);
    try {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: startX, y: point.y }],
      });
      for (let step = 1; step <= 6; step++) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: startX - (240 * step) / 6, y: point.y }],
        });
        await page.waitForTimeout(20);
      }
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await expect
        .poll(async () => (await state()).left)
        .toBeGreaterThan(touchBefore.left + 10);
      await settleRail(page);
      const touchAfter = await state();
      assert.ok(
        Math.abs(touchAfter.y - touchBefore.y) < 3,
        "An emulated horizontal touch swipe must pan the rail without moving the document.",
      );
      evidence.touchSwipeDelta = touchAfter.left - touchBefore.left;
    } finally {
      await session.detach();
    }
  }
  return evidence;
}

async function assertCoverGraphics(page) {
  const covers = page.locator(".project-showcase .showcase-art");
  await expect(covers).toHaveCount(3);
  for (const cover of await covers.all()) {
    assert.notEqual(
      await cover.getAttribute("aria-hidden"),
      "true",
      "Interactive examples remain accessible",
    );
    assert.ok(
      (await cover.locator("button,input").count()) > 0,
      "Every preview has a working task control",
    );
  }
  const rate = await page
    .locator(".rate-preview-steps > div")
    .evaluateAll((rows) =>
      rows.map((row) => {
        const bar = row.querySelector("i");
        return {
          amount: Number(
            row.querySelector("strong").textContent.replace(/[^0-9.]/g, ""),
          ),
          declaredWidth: bar.style.getPropertyValue("--rate-width"),
          widthPercent:
            (parseFloat(getComputedStyle(bar).width) /
              parseFloat(getComputedStyle(row).width)) *
            100,
        };
      }),
    );
  assert.deepEqual(
    rate.map(({ declaredWidth }) => declaredWidth),
    ["100%", "85%", "76.5%"],
  );
  assert.deepEqual(
    rate.map(({ amount }) => amount),
    [150, 127.5, 114.75],
  );
  for (const [index, expected] of [100, 85, 76.5].entries())
    assert.ok(
      Math.abs(rate[index].widthPercent - expected) < 0.1,
      `Rate bar ${index + 1} must represent the remaining balance: ${JSON.stringify(rate[index])}`,
    );
  return { interactivePreviews: 3, rate };
}

async function assertNoCoverAnimations(page) {
  const animations = await page.locator(".project-showcase").evaluate((root) =>
    [...root.querySelectorAll("*")]
      .flatMap((element) =>
        [null, "::before", "::after"].map((pseudo) => ({
          element: element.className,
          pseudo,
          name: getComputedStyle(element, pseudo).animationName,
        })),
      )
      .filter(({ name }) =>
        name.split(",").some((part) => part.trim() !== "none"),
      ),
  );
  assert.deepEqual(
    animations,
    [],
    "Paused/reduced cover elements and pseudo-elements must not animate.",
  );
  return animations;
}

async function focusCards(page) {
  const results = [];
  const rail = page.locator(".showcase-track");
  await rail.evaluate((element) =>
    element.scrollTo({ left: 0, behavior: "instant" }),
  );
  await rail.focus();
  for (let i = 0; i < projects.length; i++) {
    const link = page.locator(".project-showcase .showcase-card-link").nth(i);
    // Use native Tab focus so the browser's own reveal behavior is covered,
    // including the fallback when page JavaScript is disabled.
    for (let tab = 0; tab < 40; tab++) {
      if (await link.evaluate((element) => element === document.activeElement))
        break;
      await page.keyboard.press("Tab");
    }
    await expect(link).toBeFocused();
    const visibleFocus = await link.evaluate((element) =>
      element.matches(":focus-visible"),
    );
    assert.ok(
      visibleFocus,
      `${projects[i].name} needs a visible keyboard focus indicator.`,
    );
    let focusGeometry;
    try {
      await expect
        .poll(
          async () => {
            const nav = await page.getByRole("banner").boundingBox();
            const title = await link.getByRole("heading").first().boundingBox();
            const box = await link.boundingBox();
            const track = await rail.boundingBox();
            const viewport = page.viewportSize();
            focusGeometry = {
              project: projects[i].name,
              nav,
              title,
              box,
              track,
              viewport,
            };
            return (
              !!nav &&
              !!title &&
              !!box &&
              !!track &&
              title.y >= nav.y + nav.height - 1 &&
              title.y + title.height <= viewport.height + 1 &&
              box.x >= -1 &&
              box.x + box.width <= viewport.width + 1 &&
              title.x >= track.x - 1 &&
              title.x + title.width <= track.x + track.width + 1
            );
          },
          {
            message: `${projects[i].name} keyboard focus must reveal its full heading below the fixed nav.`,
          },
        )
        .toBe(true);
    } catch (error) {
      error.message += `\nFocused geometry: ${JSON.stringify(focusGeometry)}`;
      throw error;
    }
    const nav = await page.getByRole("banner").boundingBox();
    const box = await link.boundingBox();
    const viewport = page.viewportSize();
    results.push({
      project: projects[i].name,
      box,
      title: focusGeometry.title,
      navBottom: nav.y + nav.height,
      viewport,
    });
  }
  return results;
}

async function runAxe(page) {
  const axe = await readFile(
    join(projectRoot, "node_modules", "axe-core", "axe.min.js"),
    "utf8",
  );
  await page.addScriptTag({ content: axe });
  const violations = await page.evaluate(async () =>
    (
      await axe.run({
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        },
      })
    ).violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      nodes: nodes.map(({ target, failureSummary }) => ({
        target,
        failureSummary,
      })),
    })),
  );
  assert.deepEqual(
    violations,
    [],
    `WCAG A/AA violations: ${JSON.stringify(violations)}`,
  );
  return violations;
}

async function captureCards(page, width) {
  const originalSizes = await page
    .locator(".showcase-card")
    .evaluateAll((cards) =>
      cards.map((card) => card.getBoundingClientRect().height),
    );
  // Mobile Chromium may leave the below-viewport part of an element screenshot
  // unpainted. Keep the entire article in a dedicated tall capture viewport.
  // This leaves the interaction test viewport and its video unchanged.
  const captureViewport = {
    width,
    height: Math.max(
      page.viewportSize().height,
      Math.ceil(Math.max(...originalSizes)) + 200,
    ),
    mobile: width === 390,
  };
  const capture = await createPage(captureViewport, {
    reducedMotion: "reduce",
  });
  await capture.page.addStyleTag({
    content:
      ".site-nav,.motion-control,.skip-link{visibility:hidden!important}",
  });
  try {
    for (let i = 0; i < projects.length; i++) {
      const card = capture.page.locator(".showcase-card").nth(i);
      const rail = capture.page.locator(".showcase-track");
      await rail.focus();
      await capture.page.keyboard.press("Home");
      for (let step = 0; step < i; step++)
        await capture.page.keyboard.press("ArrowRight");
      await expectProject(capture.page, i);
      await expectActiveHeight(capture.page, i);
      await rail.evaluate((element) =>
        element.scrollIntoView({
          block: "start",
          inline: "nearest",
          behavior: "instant",
        }),
      );
      await capture.page.evaluate(() => document.activeElement?.blur());
      await card.evaluate((element) => {
        const top = element.getBoundingClientRect().top;
        if (top < 12) window.scrollBy(0, top - 12);
      });
      await capture.page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      const geometry = await card.evaluate((element) => {
        const bounds = (node) => {
          const box = node.getBoundingClientRect();
          return {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            bottom: box.bottom,
          };
        };
        const art = element.querySelector(".showcase-art");
        return {
          article: bounds(element),
          art: bounds(art),
          panel: bounds(art.firstElementChild),
          fonts: document.fonts.status,
          viewportHeight: innerHeight,
        };
      });
      assert.equal(geometry.fonts, "loaded");
      assert.ok(
        Math.abs(geometry.article.height - originalSizes[i]) < 1,
        "A taller capture viewport must preserve the tested article layout.",
      );
      assert.ok(
        geometry.article.y >= 0 &&
          geometry.article.bottom <= geometry.viewportHeight,
        `The whole article must be painted in the capture viewport: ${JSON.stringify(geometry)}`,
      );
      assert.ok(
        geometry.article.x >= 0 &&
          geometry.article.x + geometry.article.width <= width + 1,
        "The whole selected article must be painted horizontally in the capture viewport.",
      );
      assert.ok(
        geometry.panel.y >= geometry.art.y &&
          geometry.panel.bottom <= geometry.art.bottom,
        "The artwork panel must fit inside its cover.",
      );
      assert.equal(
        await card.locator(".showcase-caption").count(),
        0,
        "Repeated concept captions are removed from the project cards.",
      );
      const imagePath = join(
        afterDirectory,
        `showcase-${projects[i].name}-${width}.png`,
      );
      const png = await card.screenshot({
        path: imagePath,
        animations: "disabled",
        style:
          ".site-nav,[data-motion-toggle] { visibility:hidden !important; }",
      });
      const imageSize = {
        width: png.readUInt32BE(16),
        height: png.readUInt32BE(20),
      };
      assert.ok(
        Math.abs(imageSize.width - geometry.article.width) <= 2 &&
          Math.abs(imageSize.height - geometry.article.height) <= 2,
        "The screenshot must cover the entire article bounds.",
      );
      report.captures.push({
        project: projects[i].name,
        width,
        imageSize,
        geometry,
      });
    }
  } finally {
    await closeContext(capture.context);
  }
}

async function main() {
  await mkdir(afterDirectory, { recursive: true });
  await mkdir(recordingDirectory, { recursive: true });
  browser = await chromium.launch({ headless: true });
  const desktop = viewports.find(
    ({ width, height }) => width === 1440 && height === 900,
  );
  const primary = await createPage(desktop, {
    recordVideo: {
      dir: recordingDirectory,
      size: { width: 1440, height: 900 },
    },
  });
  const page = primary.page;
  assert.equal(
    await page.evaluate(() => scrollY),
    0,
    "Loading must retain the opening identity.",
  );
  await assertReadable(page);
  await page.screenshot({
    path: join(afterDirectory, "showcase-opening-1440.png"),
  });

  for (const viewport of viewports) {
    const current = viewport === desktop ? primary : await createPage(viewport);
    const currentPage = current.page;
    const content = await assertReadable(currentPage);
    const graphics = await assertCoverGraphics(currentPage);
    const layout = await assertRailLayout(currentPage);
    await expectActiveHeight(currentPage, 0);
    assert.ok(
      Math.abs(layout.rail.scrollLeft) < 1,
      "The opening project must load at the start of the rail.",
    );
    assert.ok(
      layout.cards[0].left >= layout.rail.left &&
        layout.cards[0].right <= layout.rail.right &&
        layout.cards[1].left >= layout.rail.right,
      "The selected card must fit in full, without a clipped neighboring card.",
    );
    const gestures = await assertNativeGestures(currentPage, {
      shift: viewport === desktop,
      touch: viewport.width === 390,
    });
    const navigation = await assertRailNavigation(currentPage);
    const focus = await focusCards(currentPage);
    await expectActiveHeight(currentPage, 2);
    await assertRailLayout(currentPage);
    const axeViolations = await runAxe(currentPage);
    report.viewports.push({
      viewport,
      content,
      graphics,
      layout,
      gestures,
      navigation,
      focus,
      axeViolations,
    });
    if (viewport.width === 390 || viewport === desktop)
      await captureCards(currentPage, viewport.width);
    if (viewport.width === 390)
      report.deepSwipe.push(await assertDeepSwipe(currentPage));
    if (current !== primary) await closeContext(current.context);
  }

  report.resizing.push(...(await assertResponsiveSelection(page)));

  const toggle = page.locator("[data-motion-toggle]");
  await page.locator(".showcase-card-link").first().focus();
  await expectProject(page, 0);
  const beforePause = await page
    .locator(".showcase-track")
    .evaluate((rail) => ({
      left: rail.scrollLeft,
      height: rail.getBoundingClientRect().height,
    }));
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await assertReadable(page);
  const pausedAnimations = await page
    .locator(".project-showcase")
    .evaluate(
      (root) =>
        root
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === "running").length,
    );
  assert.equal(pausedAnimations, 0);
  await assertNoCoverAnimations(page);
  await expectProject(page, 0);
  const afterPause = await page.locator(".showcase-track").evaluate((rail) => ({
    left: rail.scrollLeft,
    height: rail.getBoundingClientRect().height,
  }));
  assert.ok(
    Math.abs(afterPause.left - beforePause.left) < 1 &&
      Math.abs(afterPause.height - beforePause.height) < 1,
    "Pausing motion must preserve the selected card and its layout.",
  );
  await page.screenshot({
    path: join(afterDirectory, "showcase-motion-paused-1440.png"),
  });
  report.preferences.push({
    preference: "User pause",
    readable: true,
    runningAnimations: pausedAnimations,
  });
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "on");
  const firstBox = await page.locator(".showcase-card").first().boundingBox();
  await page.mouse.move(
    firstBox.x + firstBox.width * 0.8,
    Math.max(110, firstBox.y + firstBox.height * 0.3),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect(toggle).toBeDisabled();
  await assertReadable(page);
  const transforms = await page
    .locator(".project-showcase [data-kinetic]")
    .evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).transform),
    );
  assert.ok(transforms.every((transform) => transform === "none"));
  const reducedAnimations = await assertNoCoverAnimations(page);
  await expectProject(page, 0);
  const reducedNavigation = await assertRailNavigation(page);
  await page.screenshot({
    path: join(afterDirectory, "showcase-reduced-motion-1440.png"),
  });
  report.preferences.push({
    preference: "Reduced motion during interaction",
    readable: true,
    transforms,
    animations: reducedAnimations,
    navigation: reducedNavigation,
  });

  const media = await primary.context.newCDPSession(page);
  await media.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-reduced-motion", value: "reduce" },
      { name: "prefers-reduced-transparency", value: "reduce" },
    ],
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => matchMedia("(prefers-reduced-transparency: reduce)").matches,
      ),
    )
    .toBe(true);
  await expect(page.getByRole("banner")).toHaveCSS("backdrop-filter", "none");
  const navBackground = await page
    .getByRole("banner")
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  const alpha = navBackground.startsWith("rgba(")
    ? Number(navBackground.slice(navBackground.lastIndexOf(",") + 1, -1))
    : navBackground.includes("/")
      ? Number(navBackground.slice(navBackground.lastIndexOf("/") + 1, -1))
      : 1;
  assert.ok(
    alpha >= 0.99,
    `Reduced transparency requires an opaque nav: ${navBackground}`,
  );
  await assertReadable(page);
  await page.screenshot({
    path: join(afterDirectory, "showcase-reduced-transparency-1440.png"),
  });
  report.preferences.push({
    preference: "Reduced transparency",
    readable: true,
    navBackground,
    backdropFilter: "none",
  });
  await media.detach();

  for (const viewport of [viewports[0], viewports[1], viewports[4], desktop]) {
    const staticPage = await createPage(viewport, { javaScriptEnabled: false });
    const content = await assertReadable(staticPage.page);
    const graphics = await assertCoverGraphics(staticPage.page);
    const layout = await assertRailLayout(staticPage.page);
    await expect(staticPage.page.locator("[data-showcase-prev]")).toBeHidden();
    await expect(staticPage.page.locator("[data-showcase-next]")).toBeHidden();
    await expect(
      staticPage.page.locator("[data-showcase-status]"),
    ).toBeHidden();
    const gestures = await assertNativeGestures(staticPage.page);
    const focus = await focusCards(staticPage.page);
    report.noJavaScript.push({
      viewport,
      content,
      graphics,
      layout,
      gestures,
      focus,
    });
    await closeContext(staticPage.context);
  }

  assert.deepEqual(report.errors, []);
  const video = await page.video().path();
  await closeContext(primary.context);
  await rename(video, join(afterDirectory, "showcase-motion.webm"));
  report.passed = true;
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        passed: true,
        viewportCases: report.viewports.length,
        noJavaScriptCases: report.noJavaScript.length,
        preferences: report.preferences.map(({ preference }) => preference),
        errors: report.errors,
      },
      null,
      2,
    ),
  );
}

main()
  .catch(async (error) => {
    report.passed = false;
    report.failure = error.message;
    await mkdir(join(projectRoot, "review"), { recursive: true });
    await writeFile(reportPath, JSON.stringify(report, null, 2));
    console.error(error.stack || error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([...contexts].map((context) => context.close()));
    await browser?.close();
  });

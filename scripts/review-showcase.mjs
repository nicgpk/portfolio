import { chromium, expect } from "@playwright/test";
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
  await expect(
    page.getByRole("button", { name: /^(Previous|Next) project$/i }),
  ).toHaveCount(0);
  return evidence;
}

async function assertNoHorizontalScroll(page) {
  const metrics = await page.evaluate(() => {
    const root = document.querySelector(".project-showcase");
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
  assert.deepEqual(
    metrics.horizontalContainers,
    [],
    "Project covers must not contain a horizontal scrolling region.",
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
      "Project covers must follow native vertical document scrolling.",
    );
    if (i)
      assert.ok(
        metrics.cards[i].top >= metrics.cards[i - 1].bottom - 1,
        "Project covers must form a vertical sequence.",
      );
  }
  return metrics;
}

async function assertCoverGraphics(page) {
  const covers = page.locator(".project-showcase .showcase-art");
  await expect(covers).toHaveCount(3);
  for (const cover of await covers.all()) {
    await expect(cover).toHaveAttribute("aria-hidden", "true");
    assert.equal(
      await cover.locator("a,button,input,select,textarea,[tabindex]").count(),
      0,
      "Decorative cover artwork must not contain keyboard controls.",
    );
  }
  const rate = await page
    .locator(".cover-rate-ledger > div")
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
  return { decorativeCovers: 3, rate };
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
            const viewport = page.viewportSize();
            focusGeometry = {
              project: projects[i].name,
              nav,
              title,
              box,
              viewport,
            };
            return (
              !!nav &&
              !!title &&
              !!box &&
              title.y >= nav.y + nav.height - 1 &&
              title.y + title.height <= viewport.height + 1 &&
              box.x >= -1 &&
              box.x + box.width <= viewport.width + 1
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
  const capture = await createPage(captureViewport);
  try {
    for (let i = 0; i < projects.length; i++) {
      const card = capture.page.locator(".showcase-card").nth(i);
      await card.evaluate((element) =>
        element.scrollIntoView({ block: "start", behavior: "instant" }),
      );
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
          caption: bounds(element.querySelector(".showcase-caption")),
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
        geometry.panel.y >= geometry.art.y &&
          geometry.panel.bottom <= geometry.art.bottom,
        "The artwork panel must fit inside its cover.",
      );
      assert.ok(
        geometry.caption.bottom <= geometry.article.bottom + 1,
        "The article capture must include its concept caption.",
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
    const layout = await assertNoHorizontalScroll(currentPage);
    const before = await currentPage.evaluate(() => ({
      y: scrollY,
      top: document.querySelector(".showcase-card").getBoundingClientRect().top,
    }));
    await currentPage.mouse.move(
      viewport.width / 2,
      Math.min(viewport.height - 20, viewport.height * 0.75),
    );
    await currentPage.mouse.wheel(0, 420);
    await expect
      .poll(() => currentPage.evaluate(() => scrollY))
      .toBeGreaterThan(before.y + 200);
    const after = await currentPage.evaluate(() => ({
      y: scrollY,
      top: document.querySelector(".showcase-card").getBoundingClientRect().top,
    }));
    assert.ok(
      Math.abs(before.top - after.top - (after.y - before.y)) < 2,
      "Native vertical scroll must move the cover with the document.",
    );
    await currentPage.mouse.wheel(250, 0);
    await assertNoHorizontalScroll(currentPage);
    const focus = await focusCards(currentPage);
    const axeViolations = await runAxe(currentPage);
    report.viewports.push({
      viewport,
      content,
      graphics,
      layout,
      nativeWheelDelta: after.y - before.y,
      focus,
      axeViolations,
    });
    if (viewport.width === 390 || viewport === desktop)
      await captureCards(currentPage, viewport.width);
    if (current !== primary) await closeContext(current.context);
  }

  const toggle = page.locator("[data-motion-toggle]");
  await page.locator(".showcase-card-link").first().focus();
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
  await page.screenshot({
    path: join(afterDirectory, "showcase-reduced-motion-1440.png"),
  });
  report.preferences.push({
    preference: "Reduced motion during interaction",
    readable: true,
    transforms,
    animations: reducedAnimations,
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
    const layout = await assertNoHorizontalScroll(staticPage.page);
    const focus = await focusCards(staticPage.page);
    report.noJavaScript.push({ viewport, content, graphics, layout, focus });
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

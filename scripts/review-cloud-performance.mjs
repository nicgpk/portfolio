import { chromium } from "./review-browser.mjs";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.addInitScript(() => {
    window.__draws = 0;
    const draw = WebGLRenderingContext.prototype.drawArrays;
    WebGLRenderingContext.prototype.drawArrays = function (...args) {
      window.__draws++;
      return draw.apply(this, args);
    };
  });
  await page.goto("http://127.0.0.1:4183/");
  await page.locator(".cloud-field.is-active").waitFor();
  await page.waitForTimeout(1200);
  const hero = await page.locator(".hero-stage").boundingBox();
  const session = await page.context().newCDPSession(page);
  await session.send("Performance.enable");
  const sample = async () => {
    const { metrics } = await session.send("Performance.getMetrics");
    return {
      draws: await page.evaluate(() => window.__draws),
      ...Object.fromEntries(
        metrics
          .filter((m) =>
            ["TaskDuration", "ScriptDuration", "Timestamp"].includes(m.name),
          )
          .map((m) => [m.name, m.value]),
      ),
    };
  };
  const a = await sample();
  for (let i = 0; i < 55; i++) {
    await page.mouse.move(
      hero.x + hero.width * (0.08 + (i % 40) * 0.021),
      hero.y + hero.height * 0.85 + Math.sin(i / 5) * 20,
    );
    await page.waitForTimeout(60);
  }
  const b = await sample();
  const duration = b.Timestamp - a.Timestamp;
  const report = {
    scenario:
      "One warm local Windows Chromium desktop observation, 1440 x 1000, unthrottled, moving the pointer across the visible hero. GPU frame time is not measured.",
    durationSeconds: +duration.toFixed(3),
    canvasDraws: b.draws - a.draws,
    observedDrawsPerSecond: +((b.draws - a.draws) / duration).toFixed(1),
    mainThreadTaskMilliseconds: +(
      (b.TaskDuration - a.TaskDuration) *
      1000
    ).toFixed(1),
    scriptMilliseconds: +((b.ScriptDuration - a.ScriptDuration) * 1000).toFixed(
      1,
    ),
    drawRateCap: 24,
    canvasWidth: await page.locator(".cloud-canvas").evaluate((c) => c.width),
    canvasHeight: await page.locator(".cloud-canvas").evaluate((c) => c.height),
    limitations:
      "Main-thread activity includes browser work and automation. Draw submission rate is not a guaranteed visual frame rate. Actual hardware, GPU time and power consumption remain unmeasured.",
  };
  await writeFile(
    "review/etch-revision/performance.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}

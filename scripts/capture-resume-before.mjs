import { chromium } from "./review-browser.mjs";
import { mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const source = execFileSync("git", ["show", "f8ba6b7:resume.html"], {
  encoding: "utf8",
});
await mkdir("review/resume-style/before", { recursive: true });
const browser = await chromium.launch();
for (const width of [390, 1440]) {
  const page = await browser.newPage({
    viewport: { width, height: 1000 },
    reducedMotion: "reduce",
  });
  await page.route("**/resume.html", (route) =>
    route.fulfill({ contentType: "text/html", body: source }),
  );
  await page.goto("http://127.0.0.1:4183/resume.html");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `review/resume-style/before/resume-${width}.png`,
    fullPage: true,
  });
  await page.screenshot({
    path: `review/resume-style/before/opening-${width}.png`,
  });
  await page.close();
}
await browser.close();

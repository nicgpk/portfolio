import { fileURLToPath } from "node:url";

// Set the cache before loading Playwright: its registry is created at import time.
process.env.PLAYWRIGHT_BROWSERS_PATH = fileURLToPath(
  new URL("../node_modules/.cache/ms-playwright", import.meta.url),
);
const playwright = await import("@playwright/test");
export const chromium = playwright.chromium;
export const expect = playwright.expect;

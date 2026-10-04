import { chromium } from "./review-browser.mjs";
import { writeFile } from "node:fs/promises";
import { png } from "./halftone-png.mjs";
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:4183/");
  for (const [name, mode] of [
    ["horizon", 1],
    ["dune", 2],
    ["orbit", 3],
  ]) {
    for (const [width, height, cssWidth, cssHeight] of [
      [1600, 758, 1280, 606],
      [800, 1100, 390, 536],
    ]) {
      const data = await page.evaluate(
        async ({ width, height, cssWidth, cssHeight, mode }) => {
          const { createHalftoneRenderer } = await import("/js/halftone.mjs");
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const renderer = createHalftoneRenderer(canvas, null, mode);
          if (!renderer)
            throw new Error("Background poster renderer unavailable");
          renderer.draw(cssWidth, cssHeight, 0);
          const pixels = document.createElement("canvas");
          pixels.width = width;
          pixels.height = height;
          pixels.getContext("2d").drawImage(canvas, 0, 0);
          const rgba = pixels
            .getContext("2d")
            .getImageData(0, 0, width, height).data;
          let binary = "";
          for (let i = 0; i < rgba.length; i += 16384)
            binary += String.fromCharCode(...rgba.subarray(i, i + 16384));
          const data = btoa(binary);
          renderer.dispose();
          return data;
        },
        { width, height, cssWidth, cssHeight, mode },
      );
      const bytes = png(width, height, Buffer.from(data, "base64"));
      await writeFile(`images/hero-${name}-${width}.png`, bytes);
      console.log(`${name} ${width}: ${bytes.length} bytes`);
    }
  }
} finally {
  await browser.close();
}

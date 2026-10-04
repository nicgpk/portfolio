import { motionPaused } from "./kinetics.mjs";
import {
  heroBackgrounds,
  selectedHeroBackground,
} from "./hero-backgrounds.mjs";

const hero = document.querySelector("[data-cloud-scene]");
if (hero) {
  const stage = hero.querySelector(".hero-stage");
  const field = hero.querySelector(".cloud-field");
  const canvas = field.querySelector("canvas");
  const background = selectedHeroBackground();
  if (background) {
    field.dataset.background = background;
    field.querySelector("source").srcset = `images/hero-${background}-800.png`;
    field.querySelector(".cloud-poster").src =
      `images/hero-${background}-1600.png`;
  } else {
    field.querySelector("source").srcset = "images/hero-halftone-800.png";
    field.querySelector(".cloud-poster").src = "images/hero-halftone-1600.png";
  }
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const forced = matchMedia("(forced-colors: active)");
  let visible = false,
    renderer = null,
    loading = false,
    failed = false;
  let frame = 0,
    lastDraw = -100,
    time = 0,
    lastTick = 0,
    rect;
  let points = [];
  const canAnimate = () =>
    visible &&
    fine.matches &&
    innerWidth >= 900 &&
    !forced.matches &&
    !motionPaused() &&
    !document.hidden &&
    !failed;
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTick = 0;
    points = [];
    field.classList.remove("is-active");
  }
  function dimensions() {
    rect = stage.getBoundingClientRect();
    const scale = Math.min(devicePixelRatio || 1, 1.25, 1440 / rect.width);
    canvas.width = Math.round(rect.width * scale);
    canvas.height = Math.round(rect.height * scale);
    lastDraw = -100;
  }
  function schedule() {
    if (renderer && canAnimate() && !frame) frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = 0;
    if (!canAnimate()) return stop();
    time += lastTick ? Math.min(now - lastTick, 100) / 1000 : 0;
    lastTick = now;
    if (now - lastDraw >= 1000 / 24) {
      points = points.filter((p) => time - p.time < 1.8);
      if (!renderer.draw(rect.width, rect.height, time, points)) {
        failed = true;
        return stop();
      }
      field.classList.add("is-active");
      lastDraw = now;
    }
    schedule();
  }
  async function sync() {
    if (!canAnimate()) return stop();
    if (!renderer && !loading) {
      loading = true;
      try {
        const [{ createHalftoneRenderer }, image] = await Promise.all([
          import("./halftone.mjs"),
          background
            ? Promise.resolve(null)
            : new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = reject;
                image.src = "images/hero-clouds-1600.webp";
              }),
        ]);
        renderer = createHalftoneRenderer(
          canvas,
          image,
          heroBackgrounds[background] || 0,
        );
        failed = !renderer;
        if (renderer) dimensions();
      } catch {
        failed = true;
      }
      loading = false;
    }
    schedule();
  }
  stage.addEventListener(
    "pointermove",
    (event) => {
      if (!canAnimate() || !renderer || event.pointerType === "touch") return;
      if (!rect) dimensions();
      const p = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        time,
      };
      const previous = points[0];
      if (previous) {
        const steps = Math.min(
          16,
          Math.ceil(Math.hypot(p.x - previous.x, p.y - previous.y) / 28),
        );
        for (let i = 1; i <= steps; i++) {
          const f = i / steps;
          points.unshift({
            x: previous.x + (p.x - previous.x) * f,
            y: previous.y + (p.y - previous.y) * f,
            time,
          });
        }
      } else points.unshift(p);
      points = points.slice(0, 16);
    },
    { passive: true },
  );
  // Leaving lets the trail decay naturally; scrolling never maps to the artwork.
  addEventListener(
    "scroll",
    () => {
      rect = stage.getBoundingClientRect();
      points = [];
    },
    { passive: true },
  );
  new ResizeObserver(() => {
    if (renderer) dimensions();
    sync();
  }).observe(stage);
  for (const preference of [fine, forced])
    preference.addEventListener("change", sync);
  document.addEventListener("portfolio:motionchange", sync);
  document.addEventListener("visibilitychange", sync);
  canvas.addEventListener("webglcontextlost", () => {
    failed = true;
    stop();
  });
  addEventListener("pagehide", () => {
    stop();
    renderer?.dispose();
    renderer = null;
  });
  addEventListener("pageshow", sync);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.02 },
    ).observe(stage);
  } else {
    visible = true;
    sync();
  }
}

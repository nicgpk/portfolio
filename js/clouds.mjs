import { motionPaused } from "./kinetics.mjs";

// Decorative, event-driven cloud drift. No canvas loop, scroll capture or custom cursor.
const hero = document.querySelector("[data-cloud-scene]");
if (hero) {
  const art = hero.querySelector(".cloud-atmosphere");
  const light = hero.querySelector(".cloud-light");
  const field = hero.querySelector(".hero-landscape");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const contrast = matchMedia("(forced-colors: active)");
  let visible = true;
  let frame = 0;
  let lastTime = 0;
  let rect;
  let fieldRect;
  let pointer = null;
  let current = [0, 0, 0, 0, 0];
  let target = [...current];
  const enabled = () =>
    visible &&
    fine.matches &&
    !contrast.matches &&
    !motionPaused() &&
    !document.hidden;

  function paint() {
    art.style.transform = `translate3d(${current[0].toFixed(2)}px,${current[1].toFixed(2)}px,0)`;
    light.style.transform = `translate3d(${current[2].toFixed(2)}px,${current[3].toFixed(2)}px,0) translate(-50%,-50%)`;
    light.style.opacity = current[4].toFixed(3);
  }
  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    pointer = null;
    current = [0, 0, 0, 0, 0];
    target = [...current];
    art.style.removeProperty("transform");
    light.style.removeProperty("transform");
    light.style.removeProperty("opacity");
  }
  function schedule() {
    if (enabled() && !frame) frame = requestAnimationFrame(tick);
  }
  function tick(time) {
    frame = 0;
    if (!enabled()) return reset();
    if (pointer) {
      if (!rect) {
        rect = hero.getBoundingClientRect();
        fieldRect = field.getBoundingClientRect();
      }
      const x = Math.max(
        -1,
        Math.min(1, ((pointer.x - rect.left) / rect.width) * 2 - 1),
      );
      const y = Math.max(
        -1,
        Math.min(1, ((pointer.y - rect.top) / rect.height) * 2 - 1),
      );
      target = [
        -x * 28,
        -y * 12,
        pointer.x - fieldRect.left,
        pointer.y - fieldRect.top,
        0.32,
      ];
    }
    const ease =
      1 - Math.exp(-Math.min(time - (lastTime || time - 16), 40) / 100);
    lastTime = time;
    let moving = false;
    current = current.map((value, i) => {
      const difference = target[i] - value;
      if (Math.abs(difference) < (i === 4 ? 0.002 : 0.05)) return target[i];
      moving = true;
      return value + difference * ease;
    });
    paint();
    if (moving) schedule();
    else lastTime = 0;
  }
  hero.addEventListener(
    "pointermove",
    (event) => {
      if (!enabled() || event.pointerType === "touch") return;
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    },
    { passive: true },
  );
  hero.addEventListener("pointerleave", () => {
    pointer = null;
    target = [0, 0, current[2], current[3], 0];
    schedule();
  });
  // Scrolling should not move the art or keep a cursor highlight behind.
  addEventListener(
    "scroll",
    () => {
      rect = null;
      reset();
    },
    { passive: true },
  );
  addEventListener(
    "resize",
    () => {
      rect = null;
      reset();
    },
    { passive: true },
  );
  for (const preference of [fine, contrast])
    preference.addEventListener("change", reset);
  document.addEventListener("portfolio:motionchange", reset);
  document.addEventListener("visibilitychange", reset);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) reset();
    }).observe(hero);
  }
}

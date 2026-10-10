// A single spring language for the portfolio's three factual diagrams.
export const motion = matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = motion.matches;
let userPaused = false;
// Short reveal previews replace the old persistent pause UI on current pages.
// Keep the historical original pages' controls and preference behavior intact.
const revealPreviews = Boolean(
  document.querySelector('script[src*="glass-demos.mjs"]'),
);
try {
  userPaused =
    !revealPreviews && localStorage.getItem("portfolio-motion") === "off";
} catch {}
// Read stable state in the frame loop; media-change events update the preference.
export const motionPaused = () => reducedMotion || userPaused;
const controls = [...document.querySelectorAll("[data-motion-toggle]")];
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const states = [...document.querySelectorAll("[data-kinetic-scene]")].map(
  (scene) => ({
    scene,
    art: scene.querySelector("[data-kinetic]"),
    visible: false,
    pointer: { x: 0, y: 0 },
    current: [0, 0, 0],
    velocity: [0, 0, 0],
  }),
);
let frame = 0;
let needsGeometry = true;
const target = new WeakMap();
function schedule(geometry = false) {
  needsGeometry ||= geometry;
  if (!motionPaused() && !document.hidden && !frame)
    frame = requestAnimationFrame(tick);
}
function tick() {
  frame = 0;
  if (motionPaused() || document.hidden) return;
  let unsettled = false;
  for (const state of states) {
    if (!state.visible || !state.art) continue;
    if (needsGeometry) {
      const rect = state.scene.getBoundingClientRect();
      const progress = Math.max(
        -1,
        Math.min(
          1,
          (innerHeight / 2 - (rect.top + rect.height / 2)) / innerHeight,
        ),
      );
      const numeric =
        state.scene.hasAttribute("data-rate-graphic") ||
        state.scene.hasAttribute("data-kinetic-numeric");
      target.set(state, [
        state.pointer.x * (numeric ? 7 : 20),
        state.pointer.y * 12 + progress * 12,
        numeric ? 0 : state.pointer.x * 3 + progress * 6,
      ]);
    }
    const desired = target.get(state) || [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      state.velocity[i] =
        (state.velocity[i] + (desired[i] - state.current[i]) * 0.105) * 0.74;
      state.current[i] += state.velocity[i];
      if (
        Math.abs(desired[i] - state.current[i]) > 0.01 ||
        Math.abs(state.velocity[i]) > 0.01
      )
        unsettled = true;
      else {
        state.current[i] = desired[i];
        state.velocity[i] = 0;
      }
    }
    state.art.style.setProperty(
      "--kinetic-x",
      `${state.current[0].toFixed(2)}px`,
    );
    state.art.style.setProperty(
      "--kinetic-y",
      `${state.current[1].toFixed(2)}px`,
    );
    state.art.style.setProperty(
      "--kinetic-turn",
      `${state.current[2].toFixed(2)}deg`,
    );
  }
  needsGeometry = false;
  if (unsettled) schedule();
}
function reset() {
  cancelAnimationFrame(frame);
  frame = 0;
  states.forEach((state) => {
    state.current = [0, 0, 0];
    state.velocity = [0, 0, 0];
    ["--kinetic-x", "--kinetic-y", "--kinetic-turn"].forEach((name) =>
      state.art?.style.removeProperty(name),
    );
  });
}
function syncMotion() {
  document.documentElement.dataset.motion = motionPaused() ? "off" : "on";
  controls.forEach((control) => {
    control.disabled = reducedMotion;
    control.setAttribute("aria-pressed", String(motionPaused()));
    control.textContent = reducedMotion
      ? "Motion off"
      : userPaused
        ? "Resume motion"
        : "Pause motion";
  });
  if (motionPaused()) reset();
  else schedule(true);
  document.dispatchEvent(new Event("portfolio:motionchange"));
}
controls.forEach((control) =>
  control.addEventListener("click", () => {
    userPaused = !userPaused;
    try {
      localStorage.setItem("portfolio-motion", userPaused ? "off" : "on");
    } catch {}
    syncMotion();
  }),
);
motion.addEventListener("change", (event) => {
  reducedMotion = event.matches;
  syncMotion();
});
syncMotion();
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const state = states.find((s) => s.scene === entry.target);
        state.visible = entry.isIntersecting;
        state.scene.classList.toggle("is-inview", state.visible);
      });
      schedule(true);
    },
    { threshold: 0.06 },
  );
  states.forEach((state) => observer.observe(state.scene));
} else {
  states.forEach((state) => {
    state.visible = true;
    state.scene.classList.add("is-inview");
  });
  schedule(true);
}
states.forEach((state) => {
  state.scene.addEventListener(
    "pointermove",
    (event) => {
      if (
        !finePointer.matches ||
        event.pointerType === "touch" ||
        motionPaused()
      )
        return;
      const rect = state.scene.getBoundingClientRect();
      state.pointer.x = Math.max(
        -1,
        Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
      );
      state.pointer.y = Math.max(
        -1,
        Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
      );
      schedule(true);
    },
    { passive: true },
  );
  state.scene.addEventListener("pointerleave", () => {
    state.pointer = { x: 0, y: 0 };
    schedule(true);
  });
});
addEventListener("scroll", () => schedule(true), { passive: true });
addEventListener("resize", () => schedule(true), { passive: true });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) reset();
  else schedule(true);
});

document.querySelectorAll("[data-program-browser]").forEach((root) => {
  const article = root.closest("article");
  root.querySelectorAll("[data-program-select]").forEach((button) => {
    button.disabled = false;
    button.addEventListener("click", () => {
      const index = button.dataset.programSelect;
      root
        .querySelectorAll("[data-program-select]")
        .forEach((control) =>
          control.setAttribute("aria-pressed", String(control === button)),
        );
      root.querySelectorAll("[data-program-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.programPanel !== index;
      });
      article
        .querySelectorAll("[data-symbol],[data-ray]")
        .forEach((node) =>
          node.classList.toggle(
            "selected",
            (node.dataset.symbol ?? node.dataset.ray) === index,
          ),
        );
    });
  });
});
document.querySelectorAll("[data-flow-preview]").forEach((root) => {
  root.querySelectorAll("[data-flow-select]").forEach((button) => {
    button.disabled = false;
    button.addEventListener("click", () => {
      const index = button.dataset.flowSelect;
      root.style.setProperty("--flow-step", index);
      root
        .querySelectorAll("[data-flow-select]")
        .forEach((control) =>
          control.setAttribute("aria-pressed", String(control === button)),
        );
      root.querySelectorAll("[data-flow-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.flowPanel !== index;
      });
    });
  });
});

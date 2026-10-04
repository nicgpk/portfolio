import { motionPaused } from "./kinetics.mjs";

// Shared feedback: contents stay visible, values are final before any animation.
const active = new Set();
const byElement = new WeakMap();
const ease = "cubic-bezier(.16,1,.3,1)";
export function animateFeedback(element, frames, duration = 220) {
  if (!element) return;
  byElement.get(element)?.cancel();
  if (motionPaused() || document.hidden || !element.animate) return;
  const animation = element.animate(frames, { duration, easing: ease });
  byElement.set(element, animation);
  active.add(animation);
  const done = () => active.delete(animation);
  animation.addEventListener("finish", done, { once: true });
  animation.addEventListener("cancel", done, { once: true });
  return animation;
}
export const revealFeedback = (element, direction = 1) =>
  animateFeedback(element, [
    { opacity: 0.8, transform: `translateX(${direction * 8}px)` },
    { opacity: 1, transform: "translateX(0)" },
  ]);
export function animateRateBar(bar, previous, next) {
  if (next > 0)
    animateFeedback(
      bar,
      [
        { transform: `scaleX(${Math.max(0, previous) / next})` },
        { transform: "scaleX(1)" },
      ],
      360,
    );
}
export function attachIndicator(
  container,
  selector,
  selected,
  vertical = false,
) {
  if (!container) return;
  const indicator = document.createElement("i");
  indicator.className = `choice-indicator ${vertical ? "choice-indicator--vertical" : ""}`;
  indicator.setAttribute("aria-hidden", "true");
  container.append(indicator);
  const sync = () => {
    const choice = container.querySelector(selected);
    if (!choice) return;
    const c = container.getBoundingClientRect(),
      r = choice.getBoundingClientRect();
    indicator.style.transform = vertical
      ? `translateY(${r.top - c.top}px)`
      : `translateX(${r.left - c.left}px)`;
    indicator.style.width = vertical ? "2px" : `${r.width}px`;
    indicator.style.height = vertical ? `${r.height}px` : "2px";
  };
  new ResizeObserver(sync).observe(container);
  new MutationObserver(sync).observe(container, {
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-selected", "aria-current"],
  });
  sync();
}
function stop() {
  for (const animation of active) animation.cancel();
  active.clear();
}
document.addEventListener("portfolio:motionchange", () => {
  if (motionPaused()) stop();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
});

const hero = document.querySelector(".hero-message");
if (hero) {
  animateFeedback(
    hero.querySelector("h1"),
    [
      { opacity: 0.85, transform: "translateY(8px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    550,
  );
  animateFeedback(
    hero.querySelector(".hero-actions"),
    [
      { opacity: 0.85, transform: "translateY(5px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    700,
  );
}

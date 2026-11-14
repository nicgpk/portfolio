import { motionPaused } from "./kinetics.mjs?v=2178cec3bf8c";

const icons = [...document.querySelectorAll("[data-evidence-icon]")];
const visible = new WeakSet();
function sync() {
  for (const icon of icons)
    icon.classList.toggle(
      "is-playing",
      visible.has(icon) && !document.hidden && !motionPaused(),
    );
}
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      sync();
    },
    { threshold: 0.5 },
  );
  icons.forEach((icon) => {
    icon.dataset.evidenceReady = "";
    observer.observe(icon);
  });
}
document.addEventListener("portfolio:motionchange", sync);
document.addEventListener("visibilitychange", sync);

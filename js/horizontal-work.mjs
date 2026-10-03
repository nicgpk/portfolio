import { motionPaused } from "./kinetics.mjs";

// The document keeps native scrolling. Only the project row follows its position.
for (const root of document.querySelectorAll("[data-project-rail]")) {
  const viewport = root.querySelector("[data-rail-viewport]");
  const stage = root.querySelector(".rail-stage");
  const cards = [...root.querySelectorAll("[data-rail-card]")];
  const previous = root.querySelector("[data-rail-prev]");
  const next = root.querySelector("[data-rail-next]");
  const status = root.querySelector("[data-rail-status]");
  const hint = root.querySelector(".rail-scroll-hint");
  let linked = false;
  let start = 0;
  let distance = 0;
  let assigned = viewport.scrollLeft;
  let active = -1;
  let frame = 0;
  let initialized = false;
  let measuredWidth = 0;
  const stickyTop = 104;
  const leftFor = (index) =>
    Math.min(distance, cards[index].offsetLeft - cards[0].offsetLeft);
  function updateStatus() {
    const nearest = cards.reduce(
      (best, card, index) =>
        Math.abs(leftFor(index) - viewport.scrollLeft) <
        Math.abs(leftFor(best) - viewport.scrollLeft)
          ? index
          : best,
      0,
    );
    if (nearest !== active) {
      active = nearest;
      status.textContent = `${active + 1} of ${cards.length}`;
    }
    previous.disabled = active === 0;
    next.disabled = active === cards.length - 1;
  }
  function followDocument() {
    frame = 0;
    if (linked) {
      assigned = Math.max(0, Math.min(distance, scrollY - start));
      viewport.scrollLeft = assigned;
    }
    updateStatus();
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(followDocument);
  }
  function measure() {
    const oldLinked = linked;
    const oldDistance = distance;
    const oldLeft = viewport.scrollLeft;
    const resized = measuredWidth !== viewport.clientWidth;
    const retainedIndex = Math.max(0, active);
    const rect = stage.getBoundingClientRect();
    const visible = rect.bottom > stickyTop && rect.top < innerHeight;
    linked = innerWidth >= 1024 && innerHeight >= 700 && !motionPaused();
    root.classList.toggle("is-scroll-linked", linked);
    distance = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    start = root.getBoundingClientRect().top + scrollY - stickyTop;
    if (linked) root.style.height = `${stage.offsetHeight + distance}px`;
    else root.style.removeProperty("height");
    hint.textContent = linked
      ? "Scroll to explore →"
      : "Swipe or scroll sideways to explore →";
    const retainedLeft = resized
      ? leftFor(retainedIndex)
      : oldDistance
        ? (oldLeft / oldDistance) * distance
        : oldLeft;
    if (
      initialized &&
      visible &&
      (oldLinked !== linked || oldDistance !== distance)
    ) {
      assigned = Math.min(distance, retainedLeft);
      viewport.scrollLeft = assigned;
      if (linked)
        window.scrollTo({
          top: Math.max(0, start + assigned),
          behavior: "instant",
        });
      else if (oldLinked)
        window.scrollTo({ top: Math.max(0, start), behavior: "instant" });
    }
    followDocument();
    initialized = true;
    measuredWidth = viewport.clientWidth;
  }
  function go(index, smooth = true) {
    index = Math.max(0, Math.min(cards.length - 1, index));
    const left = leftFor(index);
    const behavior = smooth && !motionPaused() ? "smooth" : "instant";
    if (linked) window.scrollTo({ top: Math.max(0, start + left), behavior });
    else viewport.scrollTo({ left, behavior });
  }
  previous.addEventListener("click", () => go(active - 1));
  next.addEventListener("click", () => go(active + 1));
  viewport.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const keys = {
      ArrowLeft: active - 1,
      ArrowRight: active + 1,
      Home: 0,
      End: cards.length - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const index = Math.max(0, Math.min(cards.length - 1, keys[event.key]));
    go(index, false);
    if (event.target.closest("[data-rail-card]"))
      cards[index]
        .querySelector(".rail-card-link")
        .focus({ preventScroll: true });
  });
  viewport.addEventListener("focusin", (event) => {
    const card = event.target.closest("[data-rail-card]");
    if (card) go(cards.indexOf(card), false);
  });
  viewport.addEventListener(
    "scroll",
    () => {
      // Responsive CSS can clamp scrollLeft before the resize event is handled.
      if (viewport.clientWidth !== measuredWidth) return;
      // Native horizontal gestures and keyboard focus also move document progress.
      if (linked && Math.abs(viewport.scrollLeft - assigned) > 2) {
        assigned = viewport.scrollLeft;
        window.scrollTo({
          top: Math.max(0, start + assigned),
          behavior: "instant",
        });
      }
      updateStatus();
    },
    { passive: true },
  );
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", measure, { passive: true });
  document.addEventListener("portfolio:motionchange", measure);
  document.fonts.ready.then(measure);
  measure();
}

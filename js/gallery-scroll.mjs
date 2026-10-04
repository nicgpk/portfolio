import { motionPaused } from "./kinetics.mjs";

// Native page position drives the desktop gallery, including from page margins.
export function createGalleryScroll(root, track, cards, getSelected) {
  const stage = root.querySelector(".showcase-stage");
  const runway = root.querySelector(".showcase-runway");
  const desktop = matchMedia(
    "(min-width: 1100px) and (hover: hover) and (pointer: fine)",
  );
  let enabled = false,
    start = 0,
    travel = 0,
    frame = 0,
    syncing = false;
  let viewportWidth = innerWidth,
    viewportHeight = innerHeight,
    resizingUntil = 0;
  let configured = false,
    previousHeight = 0;
  const maxLeft = () => track.scrollWidth - track.clientWidth;
  function locate() {
    const top =
      document.querySelector(".site-nav").getBoundingClientRect().bottom + 16;
    // The intro stays in normal flow; a sticky element's offsetTop can move.
    start =
      root.querySelector(".showcase-intro").getBoundingClientRect().bottom +
      scrollY -
      top;
    root.style.setProperty("--gallery-top", `${Math.ceil(top)}px`);
    return top;
  }
  function sync() {
    frame = 0;
    if (!enabled) return;
    locate();
    const progress = Math.max(0, Math.min(1, (scrollY - start) / travel));
    syncing = true;
    track.scrollTo({ left: progress * maxLeft(), behavior: "instant" });
    requestAnimationFrame(() => {
      syncing = false;
    });
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(sync);
  }
  function configure() {
    const wasInside = enabled && scrollY >= start && scrollY <= start + travel;
    const wasReading =
      configured &&
      scrollY >= start - 100 &&
      scrollY <= start + (enabled ? travel : previousHeight);
    const resized =
      viewportWidth !== innerWidth || viewportHeight !== innerHeight;
    if (resized) {
      viewportWidth = innerWidth;
      viewportHeight = innerHeight;
      resizingUntil = performance.now() + 250;
    }
    const top = locate();
    const height =
      Math.max(...cards.map((card) => card.getBoundingClientRect().height)) +
      20 +
      stage.querySelector(".showcase-toolbar").getBoundingClientRect().height;
    const next =
      desktop.matches && !motionPaused() && height <= innerHeight - top - 12;
    root.style.setProperty("--gallery-stage-height", `${Math.ceil(height)}px`);
    const changing = enabled !== next;
    const selected = resized
      ? getSelected() / (cards.length - 1)
      : maxLeft() > 0
        ? track.scrollLeft / maxLeft()
        : 0;
    enabled = next;
    travel = Math.max(
      1000,
      Math.min(innerHeight * 0.7, 700) * (cards.length - 1),
    );
    root.classList.toggle("is-scroll-gallery", enabled);
    runway.style.height = enabled ? `${travel}px` : "0px";
    const enteringVisibleScene =
      enabled &&
      changing &&
      (wasReading || (scrollY >= start - 100 && scrollY <= start + height));
    if (
      (changing && (wasInside || enteringVisibleScene)) ||
      (resized && enabled && wasReading)
    ) {
      window.scrollTo({
        top: enabled ? start + selected * travel : start,
        behavior: "instant",
      });
    }
    if (resized && !enabled) {
      const index = getSelected();
      track.scrollTo({
        left: Math.min(
          maxLeft(),
          cards[index].offsetLeft - cards[0].offsetLeft,
        ),
        behavior: "instant",
      });
    }
    previousHeight = height;
    configured = true;
    if (enabled) schedule();
  }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", configure);
  desktop.addEventListener("change", configure);
  document.addEventListener("portfolio:motionchange", configure);
  // A native sideways gesture also updates its position along the scroll scene.
  track.addEventListener("scrollend", () => {
    if (
      !enabled ||
      syncing ||
      performance.now() < resizingUntil ||
      scrollY < start ||
      scrollY > start + travel
    )
      return;
    const expected =
      Math.max(0, Math.min(1, (scrollY - start) / travel)) * maxLeft();
    if (Math.abs(expected - track.scrollLeft) > 2) {
      window.scrollTo({
        top: start + (track.scrollLeft / maxLeft()) * travel,
        behavior: "instant",
      });
    }
  });
  new ResizeObserver(configure).observe(stage);
  cards.forEach((card) => new ResizeObserver(configure).observe(card));
  document.fonts.ready.then(configure);
  configure();
  return {
    active: () => enabled,
    select(index, smooth, preserveOutside = false) {
      if (!enabled) return false;
      locate();
      if (preserveOutside && (scrollY < start || scrollY > start + travel))
        return true;
      window.scrollTo({
        top: start + (index / (cards.length - 1)) * travel,
        behavior: smooth && !motionPaused() ? "smooth" : "instant",
      });
      if (smooth && !motionPaused()) schedule();
      else sync();
      return true;
    },
  };
}

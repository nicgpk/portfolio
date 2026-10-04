import { motionPaused } from "./kinetics.mjs";

// Native overflow for touch/trackpads, with scoped mouse-wheel paging on desktop.
for (const root of document.querySelectorAll(".project-showcase")) {
  const track = root.querySelector(".showcase-track");
  track.classList.add("is-gallery-ready");
  const cards = [...track.querySelectorAll(".showcase-card")];
  const previous = root.querySelector("[data-showcase-prev]");
  const next = root.querySelector("[data-showcase-next]");
  const status = root.querySelector("[data-showcase-status]");
  const position = root.querySelector("[data-showcase-position]");
  let active = 0;
  let frame = 0;
  let settleTimer = 0;
  let fitted = 0;
  let width = track.clientWidth;
  const leftFor = (index) =>
    Math.min(
      track.scrollWidth - track.clientWidth,
      cards[index].offsetLeft - cards[0].offsetLeft,
    );
  const nearest = () =>
    cards.reduce(
      (best, card, index) =>
        Math.abs(leftFor(index) - track.scrollLeft) <
        Math.abs(leftFor(best) - track.scrollLeft)
          ? index
          : best,
      0,
    );
  function update() {
    frame = 0;
    // Reflow can emit scroll before ResizeObserver restores the selected project.
    if (track.clientWidth !== width) return;
    active = nearest();
    const label = `${active + 1} of ${cards.length}`;
    if (position.textContent !== label) position.textContent = label;
    previous.disabled = active === 0;
    next.disabled = active === cards.length - 1;
  }
  function fit(index, reveal = false) {
    const card = cards[index];
    const navBottom = document
      .querySelector(".site-nav")
      .getBoundingClientRect().bottom;
    const readingAreaPassed =
      card.getBoundingClientRect().bottom < navBottom + 80;
    fitted = index;
    // At the foot of a card, a new project should reveal its title and ownership.
    if (reveal && readingAreaPassed)
      card.querySelector(".showcase-card-link").scrollIntoView({
        block: "start",
        inline: "nearest",
        behavior: "instant",
      });
  }
  function settled() {
    clearTimeout(settleTimer);
    if (track.clientWidth !== width) return;
    update();
    fit(active, active !== fitted);
  }
  function go(index, smooth = true, reveal = true) {
    index = Math.max(0, Math.min(cards.length - 1, index));
    fit(index, reveal);
    track.scrollTo({
      left: leftFor(index),
      behavior: smooth && !motionPaused() ? "smooth" : "instant",
    });
  }
  for (const control of [previous, next, status]) control.hidden = false;
  previous.addEventListener("click", () => go(nearest() - 1));
  next.addEventListener("click", () => go(nearest() + 1));
  const wheelPointer = matchMedia("(hover: hover) and (pointer: fine)");
  let wheelLockedUntil = 0;
  let wheelDirection = 0;
  let wheelTarget = 0;
  window.addEventListener(
    "wheel",
    (event) => {
      // Keep zoom, modified input and horizontal trackpad gestures native.
      if (
        event.defaultPrevented ||
        !wheelPointer.matches ||
        innerWidth < 900 ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        Math.abs(event.deltaX) > 0.5 ||
        !event.deltaY
      )
        return;
      const box = track.getBoundingClientRect();
      const navBottom = document
        .querySelector(".site-nav")
        .getBoundingClientRect().bottom;
      const overTrack = track.contains(event.target);
      // Side margins share the gallery's wheel area, without adding page height.
      const overMargin =
        event.clientY >= Math.max(box.top, navBottom) &&
        event.clientY <= Math.min(box.bottom, innerHeight);
      if (
        (!overTrack && !overMargin) ||
        cards.some((card) => card.querySelector("details[open]"))
      )
        return;
      const direction = Math.sign(event.deltaY);
      const now = performance.now();
      // A wheel burst advances one project rather than skipping every case.
      if (now < wheelLockedUntil && direction === wheelDirection) {
        event.preventDefault();
        return;
      }
      const current = now < wheelLockedUntil ? wheelTarget : nearest();
      const target = current + direction;
      // At either end, the same wheel gesture continues normal page scrolling.
      if (target < 0 || target >= cards.length) return;
      event.preventDefault();
      wheelDirection = direction;
      wheelTarget = target;
      wheelLockedUntil = now + 450;
      go(target, true, false);
    },
    { passive: false },
  );
  track.addEventListener(
    "scroll",
    () => {
      if (!frame) frame = requestAnimationFrame(update);
      const lastFitted = fitted;
      fit(nearest());
      fitted = lastFitted;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settled, 160);
    },
    { passive: true },
  );
  track.addEventListener("scrollend", settled);
  track.addEventListener("keydown", (event) => {
    if (
      event.target !== track ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return;
    const keys = {
      ArrowLeft: nearest() - 1,
      ArrowRight: nearest() + 1,
      Home: 0,
      End: cards.length - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    go(keys[event.key], false);
    // Keyboard navigation must bring the new title into the reading area.
    const index = Math.max(0, Math.min(cards.length - 1, keys[event.key]));
    const link = cards[index].querySelector(".showcase-card-link");
    const heading = link.querySelector("h3").getBoundingClientRect();
    const nav = document.querySelector(".site-nav").getBoundingClientRect();
    if (heading.top < nav.bottom + 16 || heading.bottom > innerHeight - 24)
      link.scrollIntoView({
        block: "start",
        inline: "nearest",
        behavior: "instant",
      });
  });
  track.addEventListener("focusin", (event) => {
    const card = event.target.closest(".showcase-card");
    if (card) go(cards.indexOf(card), false);
  });
  // Preserve the selected project when responsive columns change width.
  new ResizeObserver(() => {
    if (track.clientWidth === width) return;
    width = track.clientWidth;
    go(active, false, false);
    update();
    fit(active);
  }).observe(track);
  document.addEventListener("portfolio:motionchange", () => {
    if (motionPaused())
      track.scrollTo({ left: track.scrollLeft, behavior: "instant" });
  });
  update();
  fit(active);
  // CSS stretches the intrinsic row; fonts and disclosures grow all cards together.
}

// Entry details enhance fully visible cover content; document scrolling stays native.
const covers = [...document.querySelectorAll("[data-cover-scene]")];
document.querySelectorAll(".showcase-card-link").forEach((link) => {
  link.addEventListener("focus", () => {
    if (!link.matches(":focus-visible")) return;
    const title = link.querySelector("h3").getBoundingClientRect();
    const nav = document.querySelector(".site-nav").getBoundingClientRect();
    if (title.top < nav.bottom + 16 || title.bottom > innerHeight - 24)
      link.scrollIntoView({ block: "start", behavior: "instant" });
  });
});
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-cover-visible");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.2 },
  );
  covers.forEach((cover) => observer.observe(cover));
}

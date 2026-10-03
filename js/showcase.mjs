import { motionPaused } from "./kinetics.mjs";

// The gallery uses native overflow. Its position never follows document scrolling.
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
    track.style.height = `${Math.ceil(card.getBoundingClientRect().height) + 20}px`;
    fitted = index;
    // A deep sideways swipe to a shorter project must not leave an empty viewport.
    if (reveal && readingAreaPassed)
      card.querySelector(".showcase-card-link").scrollIntoView({
        block: "start",
        inline: "nearest",
        behavior: "instant",
      });
  }
  function settled() {
    clearTimeout(settleTimer);
    update();
    if (active !== fitted) fit(active, true);
  }
  function go(index, smooth = true) {
    index = Math.max(0, Math.min(cards.length - 1, index));
    fit(index, true);
    track.scrollTo({
      left: leftFor(index),
      behavior: smooth && !motionPaused() ? "smooth" : "instant",
    });
  }
  for (const control of [previous, next, status]) control.hidden = false;
  previous.addEventListener("click", () => go(nearest() - 1));
  next.addEventListener("click", () => go(nearest() + 1));
  track.addEventListener(
    "scroll",
    () => {
      if (!frame) frame = requestAnimationFrame(update);
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
  });
  track.addEventListener("focusin", (event) => {
    const card = event.target.closest(".showcase-card");
    if (card) go(cards.indexOf(card), false);
  });
  // Preserve the selected project when responsive columns change width.
  new ResizeObserver(() => {
    if (track.clientWidth === width) return;
    width = track.clientWidth;
    go(active, false);
    update();
    fit(active);
  }).observe(track);
  document.addEventListener("portfolio:motionchange", () => {
    if (motionPaused())
      track.scrollTo({ left: track.scrollLeft, behavior: "instant" });
  });
  update();
  fit(active);
  // Local font loading can change a card's height without changing its width.
  document.fonts.ready.then(() => fit(fitted));
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

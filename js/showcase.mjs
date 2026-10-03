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

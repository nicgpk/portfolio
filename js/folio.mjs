import { stackDiscounts } from "./calculations.mjs";

// Native scroll, readable text, and decorative transforms only. No hidden reveals.
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const stage = document.querySelector("[data-depth]");
let frame = 0;
function depth() {
  frame = 0;
  if (!stage) return;
  if (motion.matches || innerWidth < 651) {
    ["--depth-y", "--depth-rotate", "--depth-scale"].forEach((property) =>
      stage.style.removeProperty(property),
    );
    return;
  }
  const rect = stage.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > innerHeight) return;
  const shift = Math.max(
    -16,
    Math.min(16, (innerHeight / 2 - rect.top) * 0.035),
  );
  stage.style.setProperty("--depth-y", `${shift}px`);
  const progress = Math.max(
    0,
    Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)),
  );
  stage.style.setProperty("--depth-rotate", `${-4 + progress * 4}deg`);
  stage.style.setProperty("--depth-scale", `${0.97 + progress * 0.04}`);
}
function schedule() {
  if (!frame) frame = requestAnimationFrame(depth);
}
if (stage) {
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  motion.addEventListener("change", schedule);
  schedule();
}
// Layered reveal applies a brief positional settling to artwork, never to text.
const art = document.querySelectorAll(".growth-map,.discount-art,.dev-art");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (!motion.matches)
          entry.target.animate(
            [{ transform: "translateY(18px)" }, { transform: "translateY(0)" }],
            { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)" },
          );
        observer.unobserve(entry.target);
      }),
    { threshold: 0.12 },
  );
  art.forEach((el) => observer.observe(el));
  motion.addEventListener("change", () => {
    if (motion.matches)
      art.forEach((el) =>
        el.getAnimations().forEach((animation) => animation.cancel()),
      );
  });
}
document.querySelectorAll("[data-discovery]").forEach((root) => {
  const search = root.querySelector("[data-program-search]"),
    category = root.querySelector("[data-program-category]");
  function filter() {
    const term = search.value.trim().toLowerCase();
    let count = 0;
    root.querySelectorAll("[data-program]").forEach((tile) => {
      const show =
        tile.textContent.toLowerCase().includes(term) &&
        (category.value === "all" || tile.dataset.category === category.value);
      tile.hidden = !show;
      if (show) count++;
    });
    root.querySelector("[data-program-count]").textContent = count
      ? `${count} program${count === 1 ? "" : "s"}`
      : "No matching programs. Try another search or choose All categories.";
  }
  search.addEventListener("input", filter);
  category.addEventListener("change", filter);
});
const calculator = document.querySelector("[data-calculator]");
if (calculator) {
  const form = calculator.querySelector("form");
  const money = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  function update() {
    const rate = form.elements.rate;
    const error = calculator.querySelector("[data-calc-error]");
    if (!rate.validity.valid || rate.value === "") {
      calculator.querySelector("[data-net]").textContent = "—";
      calculator.querySelector("[data-effective]").textContent =
        "Enter a valid room rate to calculate.";
      calculator.querySelector("[data-ledger]").replaceChildren();
      calculator.querySelector(".calc-formula").textContent =
        "Calculation paused";
      error.textContent =
        "Enter a room rate from $0 to $1,000,000, with at most two decimal places.";
      rate.setAttribute("aria-invalid", "true");
      return;
    }
    error.textContent = "";
    rate.removeAttribute("aria-invalid");
    const selected = [
      { name: "Mega Sale", value: 15, on: form.elements.mega.checked },
      { name: "Mobile Exclusive", value: 10, on: form.elements.mobile.checked },
    ].filter((p) => p.on);
    const result = stackDiscounts(
      Number(rate.value),
      selected.map((p) => p.value),
    );
    calculator.querySelector("[data-net]").textContent = money(result.net);
    calculator.querySelector("[data-effective]").textContent =
      `${result.effective}% effective discount`;
    const ledger = calculator.querySelector("[data-ledger]");
    ledger.replaceChildren();
    const rows = [
      ["Room rate", money(Number(rate.value))],
      ...selected.map((p, i) => [
        `${p.name} · ${p.value}%`,
        `−${money(result.cuts[i])}`,
      ]),
    ];
    rows.forEach(([label, value]) => {
      const row = document.createElement("div"),
        s = document.createElement("span"),
        b = document.createElement("strong");
      s.textContent = label;
      b.textContent = value;
      row.append(s, b);
      ledger.append(row);
    });
    calculator.querySelector(".calc-formula").textContent =
      `${Number(rate.value)}${selected.map((p) => ` × ${1 - p.value / 100}`).join("")} = ${result.net.toFixed(2)}`;
  }
  form.addEventListener("input", update);
  form.addEventListener("reset", () => requestAnimationFrame(update));
  form.addEventListener("submit", (e) => e.preventDefault());
  update();
}
const developer = document.querySelector("[data-developer]");
if (developer) {
  const form = developer.querySelector("form"),
    stages = [...form.querySelectorAll("[data-step]")],
    next = form.querySelector("[data-deploy-next]"),
    back = form.querySelector("[data-deploy-back]"),
    status = form.querySelector("[data-deploy-status]");
  let step = 0;
  function review() {
    const f = form.elements;
    const rows = [
      ["Environment", `${f.environment.value} · ${f.pool.value}`],
      ["Image", `${f.repository.value} · ${f.image.value}`],
      ["Resources", `${f.cpu.value} cores · ${f.memory.value} Gi`],
      [
        "Strategy",
        f.strategy.value === "Canary"
          ? "Canary · 10% → 20% → 30%"
          : "Rolling update",
      ],
      [
        "Targets",
        `HK: ${f.hk.value} · SG: ${f.sg.value} · AM: ${f.am.value} replicas`,
      ],
      ["Monitoring", `${f.slack.value} · 300s ramp up · 900s monitoring`],
    ];
    const list = form.querySelector("[data-deploy-review]");
    list.replaceChildren();
    rows.forEach(([label, value]) => {
      const row = document.createElement("div"),
        dt = document.createElement("dt"),
        dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      row.append(dt, dd);
      list.append(row);
    });
  }
  function render(focus = false) {
    stages.forEach((stage, i) => {
      stage.hidden = i !== step;
    });
    form.querySelectorAll("[data-step-label]").forEach((el, i) => {
      if (i === step) el.setAttribute("aria-current", "step");
      else el.removeAttribute("aria-current");
    });
    back.disabled = step === 0;
    next.disabled = false;
    next.textContent = step === 2 ? "Preview deployment" : "Continue →";
    form.querySelector("[data-step-count]").textContent =
      `Step ${step + 1} of 3`;
    if (step === 2) review();
    if (focus) {
      const title = stages[step].querySelector("h2");
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
      title.scrollIntoView({
        block: "start",
        behavior: motion.matches ? "instant" : "smooth",
      });
    }
  }
  next.addEventListener("click", () => {
    const invalid = [...stages[step].querySelectorAll("input,select")].find(
      (input) => !input.validity.valid,
    );
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    if (step < 2) {
      step++;
      status.textContent = "";
      render(true);
    } else {
      status.textContent =
        "Preview complete. No service was deployed and no data was saved.";
    }
  });
  back.addEventListener("click", () => {
    if (step > 0) {
      step--;
      status.textContent = "";
      render(true);
    }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    next.click();
  });
  form.elements.strategy.addEventListener("change", () => {
    form.querySelector("[data-canary]").textContent =
      form.elements.strategy.value === "Canary"
        ? "10% → 20% → 30%"
        : "Rolling update · existing deployment strategy";
  });
  render();
}

import { stackDiscounts } from "./calculations.mjs";
import {
  attachIndicator,
  revealFeedback,
  animateRateBar,
} from "./interaction-motion.mjs";

for (const root of document.querySelectorAll("[data-preview-picker]")) {
  const controls = [...root.querySelectorAll("[data-preview-choice]")];
  const panels = [...root.querySelectorAll("[data-preview-panel]")];
  let current = controls.findIndex(
    (button) => button.getAttribute("aria-selected") === "true",
  );
  function select(index, focus = false) {
    const previous = current;
    current = index;
    controls.forEach((button, i) => {
      button.setAttribute("aria-selected", String(i === index));
      button.tabIndex = i === index ? 0 : -1;
      button.classList.toggle("is-selected", i === index);
      button.classList.toggle("cover-stage-active", i === index);
    });
    panels.forEach((panel, i) => (panel.hidden = i !== index));
    if (previous !== index)
      revealFeedback(panels[index], index > previous ? 1 : -1);
    if (focus) controls[index].focus({ preventScroll: true });
  }
  controls.forEach((button, i) => {
    button.disabled = false;
    button.addEventListener("click", () => select(i));
  });
  const list = root.querySelector(".preview-choices");
  const vertical = root.dataset.pickerDirection === "vertical";
  attachIndicator(
    list,
    "[data-preview-choice]",
    '[aria-selected="true"]',
    vertical,
  );
  list.addEventListener("keydown", (event) => {
    const forward = vertical ? "ArrowDown" : "ArrowRight",
      back = vertical ? "ArrowUp" : "ArrowLeft";
    let next =
      event.key === forward
        ? (current + 1) % controls.length
        : event.key === back
          ? (current + controls.length - 1) % controls.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? controls.length - 1
              : null;
    if (next !== null) {
      event.preventDefault();
      select(next, true);
    }
  });
}

const money = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
for (const root of document.querySelectorAll("[data-discount-preview]")) {
  const form = root.querySelector("form");
  const megaBar = root.querySelector("[data-preview-mega-bar]"),
    netBar = root.querySelector("[data-preview-net-bar]");
  form.querySelectorAll("input").forEach((input) => (input.disabled = false));
  function update() {
    const mega = form.elements.mega.checked,
      mobile = form.elements.mobile.checked;
    const intermediate = stackDiscounts(150, mega ? [15] : []).net;
    const result = stackDiscounts(150, [
      ...(mega ? [15] : []),
      ...(mobile ? [10] : []),
    ]);
    const beforeMega = parseFloat(
        megaBar.style.getPropertyValue("--rate-width"),
      ),
      beforeNet = parseFloat(netBar.style.getPropertyValue("--rate-width"));
    root.querySelector("[data-preview-net]").textContent = money(result.net);
    root.querySelector("[data-preview-effective]").textContent =
      `${result.effective}%`;
    root.querySelector("[data-preview-mega]").textContent = money(intermediate);
    root.querySelector("[data-preview-mobile]").textContent = money(result.net);
    root.querySelector("[data-preview-mega-cut]").textContent =
      `−${money(150 - intermediate)}`;
    root.querySelector("[data-preview-mobile-cut]").textContent =
      `−${money(intermediate - result.net)}`;
    root.querySelector("[data-preview-mega-label]").textContent = mega
      ? "Mega Sale · 15%"
      : "Mega Sale off";
    root.querySelector("[data-preview-mobile-label]").textContent = mobile
      ? "Mobile Exclusive · 10%"
      : "Mobile Exclusive off";
    root.querySelector("[data-preview-formula]").textContent =
      `150${mega ? " × 0.85" : ""}${mobile ? " × 0.90" : ""} = ${result.net.toFixed(2)}`;
    const megaWidth = (intermediate / 150) * 100,
      netWidth = (result.net / 150) * 100;
    megaBar.style.setProperty("--rate-width", `${megaWidth}%`);
    netBar.style.setProperty("--rate-width", `${netWidth}%`);
    animateRateBar(megaBar, beforeMega, megaWidth);
    animateRateBar(netBar, beforeNet, netWidth);
  }
  form.addEventListener("input", update);
  form.addEventListener("submit", (event) => event.preventDefault());
}

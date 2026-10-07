export function setActionLabel(control, label, name = "arrow-right") {
  const text = document.createElement("span");
  text.textContent = label;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "ui-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `images/interface-icons.svg#${name}`);
  svg.append(use);
  control.replaceChildren(text, svg);
}

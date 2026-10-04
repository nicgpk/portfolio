// Compare factual content and destinations independently of decorative icon glyphs.
export function normalizedContentText(element) {
  const clone = element.cloneNode(true);
  clone
    .querySelectorAll('[aria-hidden="true"],svg')
    .forEach((node) => node.remove());
  // These presentation-only labels were explicitly removed in the caption pass.
  clone
    .querySelectorAll(
      ".showcase-caption,.concept-context,.concept-heading .eyebrow,.diagram-kicker,.app-side-note,.sample-label,.terminal-pill,.growth-preview-note,.discount-app-footer > span:first-child",
    )
    .forEach((node) => node.remove());
  clone.querySelectorAll("a,button").forEach((control) => {
    const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
    while (walker.nextNode())
      walker.currentNode.nodeValue = walker.currentNode.nodeValue.replace(
        /[↗←↓]|→(?=\s*$)/g,
        "",
      );
  });
  return clone.textContent
    .replace(/\s+/g, " ")
    .replace(
      "These are reported outcomes from the existing portfolio, not measured results of this updated concept.",
      "Reported outcomes from the original portfolio.",
    )
    .replace(" No new measurements are attributed to the updated concept.", "")
    .replace(" Existing example settings.", "")
    .replace(
      "Promotion breakdown · updated calculation example",
      "Promotion breakdown · per-night example",
    )
    .trim();
}

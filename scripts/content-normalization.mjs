// Compare factual content and destinations independently of decorative icon glyphs.
export function normalizedContentText(element) {
  const clone = element.cloneNode(true);
  clone
    .querySelectorAll('[aria-hidden="true"],svg')
    .forEach((node) => node.remove());
  clone.querySelectorAll("a,button").forEach((control) => {
    const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
    while (walker.nextNode())
      walker.currentNode.nodeValue = walker.currentNode.nodeValue.replace(
        /[↗←↓]|→(?=\s*$)/g,
        "",
      );
  });
  return clone.textContent.replace(/\s+/g, " ").trim();
}

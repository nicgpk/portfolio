import { mkdir, writeFile } from "node:fs/promises";
const commit = "500620a2e8123f8d1db191538886dc0c223f69a9";
const names = [
  "arrow-up-right",
  "arrow-right",
  "arrow-left",
  "arrow-down",
  "chevron-down",
  "search",
  "check",
  "code-xml",
  "layers",
  "percent",
  "megaphone",
  "trending-up",
  "wallet",
  "network",
  "panel-top",
  "refresh-cw",
  "store",
];
const base = `https://raw.githubusercontent.com/lucide-icons/lucide/${commit}`;
const directory = "images/icons/lucide";
await mkdir(directory, { recursive: true });
const entries = await Promise.all(
  names.map(async (name) => {
    const response = await fetch(`${base}/icons/${name}.svg`);
    if (!response.ok) throw new Error(`${name}: ${response.status}`);
    const source = await response.text();
    await writeFile(`${directory}/${name}.svg`, source);
    const body = source.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/)?.[1];
    if (!body) throw new Error(`Invalid SVG: ${name}`);
    return [name, body.trim()];
  }),
);
const license = await fetch(`${base}/LICENSE`);
if (!license.ok) throw new Error("Icon license unavailable");
await writeFile(`${directory}/LICENSE`, await license.text());
await writeFile(
  `${directory}/SOURCE.json`,
  JSON.stringify(
    {
      repository: "https://github.com/lucide-icons/lucide",
      commit,
      icons: names,
    },
    null,
    2,
  ),
);
const symbol = (id, body) =>
  `<symbol id="${id}" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</g></symbol>`;
await writeFile(
  "images/interface-icons.svg",
  `<svg xmlns="http://www.w3.org/2000/svg">${entries.map(([name, body]) => symbol(name, body)).join("\n")}</svg>`,
);
const programs = {
  promotion: "percent",
  growth: "megaphone",
  boost: "trending-up",
  prepaid: "wallet",
  distribution: "network",
  placement: "panel-top",
  rates: "refresh-cw",
  storefront: "store",
};
const paths = Object.fromEntries(entries);
await writeFile(
  "images/program-symbols.svg",
  `<svg xmlns="http://www.w3.org/2000/svg">${Object.entries(programs)
    .map(([id, name]) => symbol(id, paths[name]))
    .join("\n")}</svg>`,
);
console.log(`Vendored ${entries.length} Lucide SVGs and license at ${commit}`);

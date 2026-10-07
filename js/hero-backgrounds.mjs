// Horizon is authored into the homepage, including the no-JavaScript poster.
export const heroBackgrounds = Object.freeze({ horizon: 1, dune: 2, orbit: 3 });
export function selectedHeroBackground(search = location.search) {
  const choice = new URLSearchParams(search).get("background");
  if (choice === "cloud" || choice === "current") return null;
  return Object.hasOwn(heroBackgrounds, choice) ? choice : "horizon";
}

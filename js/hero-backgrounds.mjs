// Explicit preview choices; ordinary visits retain the existing cloud artwork.
export const heroBackgrounds = Object.freeze({ horizon: 1, dune: 2, orbit: 3 });
export function selectedHeroBackground(search = location.search) {
  const choice = new URLSearchParams(search).get("background");
  return Object.hasOwn(heroBackgrounds, choice) ? choice : null;
}

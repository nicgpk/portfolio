/** Illustrative sequential discounts, in cents. Excludes commission and taxes. */
export function stackDiscounts(rate, discounts) {
  if (
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 1000000 ||
    !Array.isArray(discounts) ||
    discounts.some((d) => !Number.isFinite(d) || d < 0 || d > 100)
  )
    throw new RangeError(
      "Enter a valid room rate and discounts from 0 to 100.",
    );
  let cents = Math.round(rate * 100);
  const original = cents,
    cuts = [],
    balances = [];
  for (const percent of discounts) {
    const cut = Math.round((cents * percent) / 100);
    cents -= cut;
    cuts.push(cut / 100);
    balances.push(cents / 100);
  }
  return {
    net: cents / 100,
    cuts,
    balances,
    effective: original ? Math.round((1 - cents / original) * 10000) / 100 : 0,
  };
}

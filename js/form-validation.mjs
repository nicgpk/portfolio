/** Required text must contain meaningful characters; normalization is boundary-only. */
export function normalizeRequiredText(value) {
  const normalized=String(value).trim();
  return {value:normalized,valid:normalized.length>0};
}

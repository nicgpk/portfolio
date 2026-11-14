import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

// Inline preference/fallback code runs before the module graph. Syntax errors
// here (including typographic punctuation) must not evade module-only checks.
for (const route of ['index.html', 'partner-growth-programs.html', 'discounting.html', 'dev-portal.html', 'resume.html']) {
  test(`${route} has valid inline initialization and fallback scripts`, () => {
    const html = readFileSync(new URL(`../${route}`, import.meta.url), 'utf8');
    for (const [, attributes, source] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/\btype\s*=\s*["'](?:module|application\/ld\+json)["']/i.test(attributes)) continue;
      new Script(source, { filename: route });
    }
  });
}

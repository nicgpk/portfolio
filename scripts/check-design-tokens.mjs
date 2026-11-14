import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {declarations, mapValue, colorLiteral, tokenDefinitions, resolveDesignTokens} from './css-values.mjs';

export function checkStylesheet(css, tokens, {tokenFile = false} = {}) {
  const issues = [];
  for (const item of declarations(css)) {
    if (tokenFile && !item.property.startsWith('--') && item.property !== 'color-scheme') {
      issues.push({line: item.line, message: 'Token files must contain custom properties only.'});
    }
    if (!tokenFile) mapValue(item.value, text => {
      const colors = [...text.matchAll(colorLiteral)].map(match => match[0]);
      if (colors.length) issues.push({line: item.line, message: `Use a design token instead of ${colors.join(', ')} in ${item.property}.`});
      return text;
    });
    const missing = [...new Set([...item.value.matchAll(/var\(\s*(--ds-[\w-]+)/g)].map(match=>match[1]))].filter(name=>!tokens.has(name));
    if (missing.length) issues.push({line:item.line,message:`Undefined design token: ${missing.join(', ')}`});
    else try { resolveDesignTokens(item.value, tokens); }
    catch (error) { issues.push({line: item.line, message: error.message}); }
    if (/var\(\s*--[^,)\s]*\(/.test(item.value)) issues.push({line:item.line, message:'Invalid variable name in var().'});
  }
  return issues;
}

export function checkDesignTokens(root = fileURLToPath(new URL('../', import.meta.url))) {
  const read = file => readFileSync(path.join(root, file), 'utf8');
  const tokenFile = 'css/design-tokens.css';
  const tokenCss = read(tokenFile);
  const tokens = tokenDefinitions(tokenCss);
  const manifest = JSON.parse(read('css/bundles.manifest.json'));
  const files = [...new Set([...manifest.sourceDependencies, 'css/glass.css'])];
  const issues = [];
  const seen = new Set();
  for (const item of declarations(tokenCss)) {
    if (seen.has(item.property)) issues.push({file:tokenFile,line:item.line,message:`Duplicate token ${item.property}.`});
    seen.add(item.property);
  }
  for (const file of files) {
    // Vesper's generated theme file is already a token source; keep its
    // independently scoped theme values and third-party provenance intact.
    const tokenFile = ['css/design-tokens.css', 'css/vesper-tokens.css'].includes(file);
    for (const issue of checkStylesheet(read(file), tokens, {tokenFile})) issues.push({file,...issue});
  }
  for (const [name,bundle] of Object.entries(manifest.bundles)) {
    if (['shared-base','resume-layout'].includes(name) && bundle.sources[0] !== tokenFile) {
      issues.push({file:bundle.file,line:1,message:'Load design tokens before component styles.'});
    }
  }
  return {files:files.length,tokens:tokens.size,issues};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkDesignTokens();
  for (const issue of result.issues) console.error(`${issue.file}:${issue.line}: ${issue.message}`);
  if (result.issues.length) process.exitCode = 1;
  else console.log(`Verified ${result.tokens} design tokens across ${result.files} source stylesheets.`);
}

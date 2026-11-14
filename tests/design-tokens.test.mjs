import {test} from 'node:test';
import assert from 'node:assert/strict';
import {declarations, mapValue, tokenDefinitions, resolveDesignTokens} from '../scripts/css-values.mjs';
import {checkStylesheet, checkDesignTokens} from '../scripts/check-design-tokens.mjs';

test('token checks inspect declarations without misreading selectors, strings or assets', () => {
  const css = `@media (min-width: 767px) { #abc:hover { color: var(--ds-ink); content: "white;{}"; background-image: url('icon.svg#fff'); } }`;
  assert.deepEqual(declarations(css).map(item=>item.property), ['color','content','background-image']);
  assert.deepEqual(checkStylesheet(css,new Map([['--ds-ink','#fff']])),[]);
  assert.equal(mapValue('url(icon.svg#fff) "black" #fff',text=>text.replaceAll('#fff','TOKEN')), 'url(icon.svg#fff) "black" TOKEN');
});

test('component colors must use tokens, including local aliases and shadows', () => {
  const issues=checkStylesheet('.card { --card-bg:#123; color: white; box-shadow:0 1px 4px rgb(0 0 0 / .2); }',new Map());
  assert.equal(issues.length,3);
  assert.equal(checkStylesheet('.card {color:tomato;}',new Map()).length,1);
  assert.deepEqual(checkStylesheet('.card { color:var(--color-background-blue); border-color:Highlight; fill:currentColor; background:transparent; }',new Map()),[]);
});

test('token aliases resolve transitively and preserve contextual fallbacks', () => {
  const tokens=tokenDefinitions(':root { --ds-space:24px; --ds-panel:var(--ds-space); }');
  assert.equal(resolveDesignTokens('var(--local, var(--ds-panel))',tokens),'var(--local, 24px)');
  assert.throws(()=>resolveDesignTokens('var(--ds-missing)',tokens),/Undefined design token/);
  assert.equal(checkStylesheet('.card {color:var(--ds-missing, currentColor);}',tokens).length,1);
  assert.throws(()=>resolveDesignTokens('var(--ds-a)',new Map([['--ds-a','var(--ds-b)'],['--ds-b','var(--ds-a)']])) ,/Cyclic design token/);
});

test('CSS scanner rejects unbalanced source and checker rejects malformed variable names', () => {
  assert.throws(()=>declarations('.card {color:var(--ds-ink);'),/Unbalanced/);
  assert.equal(checkStylesheet('.card {color:var(--color-var(--ds-ink));}',new Map([['--ds-ink','#fff']])).some(issue=>issue.message.includes('Invalid variable')),true);
});

test('all shipped routes load valid tokens and component styles contain no color literals', () => {
  assert.deepEqual(checkDesignTokens().issues,[]);
});

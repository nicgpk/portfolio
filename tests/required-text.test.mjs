import {test} from 'node:test';import assert from 'node:assert/strict';import {normalizeRequiredText} from '../js/form-validation.mjs';
for(const value of ['', '   ', '\t\n', '\u00a0\u2003'])test('reject empty-after-trim '+JSON.stringify(value),()=>assert.equal(normalizeRequiredText(value).valid,false));
for(const [value,expected] of [[' release-23 ','release-23'],['  #devops_safe_app  ','#devops_safe_app'],[' staging-mesh ','staging-mesh']])test('trim '+value,()=>assert.deepEqual(normalizeRequiredText(value),{value:expected,valid:true}));
test('does not invent restrictions on meaningful internal text',()=>assert.deepEqual(normalizeRequiredText(' release candidate '),{value:'release candidate',valid:true}));

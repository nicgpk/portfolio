import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {getShaderColorFromString} from '../js/vendor/paper/get-shader-color-from-string.js';
const source=readFileSync(new URL('../js/paper-wave.mjs',import.meta.url),'utf8');
const factory=new Function('middle','compact','getShaderColorFromString','showcase',source.slice(source.indexOf(' const composition='),source.indexOf(' const start='))+';return {composition,pixelBudget};');
for(const width of [320,390,430,767,768,1180])for(const middle of [false,true])test(`${width}px ${middle?'middle':'hero'} composition preserves noise-independent budget`,()=>{
 const compact={matches:width<=767};const x=factory(middle,compact,getShaderColorFromString);const c=x.composition();
 assert.equal(x.pixelBudget(),width<=767?(middle?350000:450000):(middle?500000:800000));
 assert.equal(c.u_colors.length,4);assert.ok(Number.isFinite(c.u_scale));
 const warm=c.u_colors[middle?1:2];assert.equal(warm[3],width<=767?.4:1);
 assert.equal(c.u_rotation,width<=767?(middle?112:18):(middle?128:18));
});
test('breakpoint changes preserve separate desktop composition',()=>{const compact={matches:true};const x=factory(true,compact,getShaderColorFromString);assert.equal(x.pixelBudget(),350000);compact.matches=false;assert.equal(x.pixelBudget(),500000);assert.equal(x.composition().u_scale,.9);});
test('requested grain levels remain unchanged',()=>{assert.match(source,/u_noise:\.0308/);assert.match(readFileSync(new URL('../css/glass.css',import.meta.url),'utf8'),/opacity:\.112;mix-blend-mode:soft-light/);});

test("showcase background has its own capped budget",()=>{for(const phone of [false,true]){const x=factory(false,{matches:phone},getShaderColorFromString,true);assert.equal(x.pixelBudget(),phone?300000:450000);assert.equal(x.composition().u_rotation,48);}});

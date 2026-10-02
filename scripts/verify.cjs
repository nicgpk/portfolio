const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('node:fs');
const assert = require('node:assert/strict');
const pages=['index.html','projects.html','partner-growth-programs.html','discounting.html','dev-portal.html','resume.html'];
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 fs.mkdirSync('review/final',{recursive:true});
 const report=[];
 for(const theme of ['light','dark']) for(const width of [390,1440]) for(const route of pages){
  const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const failures=[]; page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1:4173')&&r.status()>=400)failures.push(r.url());});
  await page.route('https://**/*',r=>r.abort());
  await page.goto('http://127.0.0.1:4173/'+route,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{document.querySelectorAll('img').forEach(i=>i.loading='eager');});
  await page.evaluate(()=>Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{}))));
  const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,brokenImages:Array.from(document.images).filter(i=>i.getAttribute('src')&&!i.naturalWidth).map(i=>i.getAttribute('src')),heading:document.querySelector('h1')?.textContent,main:document.querySelectorAll('main').length,links:Array.from(document.querySelectorAll('a[href^="#"]')).filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash)}));
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  const entry={route,theme,width,layout,errors,failures,violations:axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))};
  report.push(entry);
  if(theme==='light'||width===390&&route==='index.html')await page.screenshot({path:`review/final/${route.replace('.html','')}-${width}-${theme}.png`,fullPage:true});
  console.log(`${route} ${width} ${theme}: overflow=${layout.scroll>width}, broken=${layout.brokenImages.length}, axe=${entry.violations.length}, errors=${errors.length}`);
  await context.close();
 }
 fs.writeFileSync('review/checks.json',JSON.stringify({report,date:new Date().toISOString()},null,2));
 // Check navigation without JavaScript and the theme control's actual state change.
 const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
 await nojs.route('https://**/*',r=>r.abort()); await nojs.goto('http://127.0.0.1:4173/');
 assert.equal(await nojs.locator('h1').textContent(),'Product Design Lead');
 await nojs.locator('.hero-actions .btn').click(); assert.match(nojs.url(),/projects\.html$/); await nojs.close();
 const keyboard=await browser.newPage();await keyboard.route('https://**/*',r=>r.abort());
 await keyboard.goto('http://127.0.0.1:4173/partner-growth-programs.html');
 await keyboard.keyboard.press('Tab');assert.equal(await keyboard.locator(':focus').innerText(),'Skip to content');
 await keyboard.locator('.theme-toggle').click();assert.equal(await keyboard.locator('.theme-toggle').getAttribute('aria-pressed'),'true');
 const trigger=keyboard.locator('[data-pb-open]').first();await trigger.click();
 assert.ok(await keyboard.locator('dialog[open], [role="dialog"][aria-modal="true"]').count());
 await keyboard.keyboard.press('Escape');assert.equal(await keyboard.locator('dialog[open]').count(),0);
 await keyboard.close();await browser.close();
 fs.writeFileSync('review/checks.json',JSON.stringify({report,interactionChecks:'No-JS navigation, theme toggle, pattern dialog open/Escape',date:new Date().toISOString()},null,2));
 const bad=report.filter(e=>e.layout.scroll>e.width||e.layout.brokenImages.length||e.layout.links.length||e.errors.length||e.failures.length||e.violations.length);
 if(bad.length)process.exitCode=1;
})();

const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const dir=process.argv[2]||'review'; fs.mkdirSync(dir,{recursive:true});
for (const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]) {
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
 await page.route('https://**/*',route=>route.abort());
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>{document.querySelectorAll('img').forEach(i=>i.loading='eager');});
 await page.evaluate(()=>Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{}))));
 await page.waitForTimeout(800);
 await page.screenshot({path:dir+'/'+name+'.png',fullPage:true});
 await page.close();
}
await browser.close();
})();

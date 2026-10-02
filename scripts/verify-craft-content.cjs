const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict');
const base='001ecfee8e2ac8f6c54c7eef0f06555cf4d38aee';
const old=f=>cp.execFileSync('git',['show',`${base}:${f}`],{encoding:'utf8',env:{...process.env,GIT_CONFIG_GLOBAL:'NUL',GIT_CONFIG_NOSYSTEM:'1'}});
const text=s=>s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const reports=[];
for(const f of ['partner-growth-programs.html','discounting.html','dev-portal.html']){
 const narrative=s=>text(s.slice(s.indexOf('<section class="case-brief"'),s.indexOf('</main>')));
 assert.equal(narrative(fs.readFileSync(f,'utf8')),narrative(old(f)));reports.push({route:f,originalCaseNarrative:'exact normalized match',characters:narrative(old(f)).length});
}
for(const f of ['index.html','projects.html'])for(const cl of ['work-evidence','work-context']){
 const values=s=>Array.from(s.matchAll(new RegExp(`<[^>]+class="${cl}"[^>]*>([\\s\\S]*?)<\\/[^>]+>`,'g')),m=>text(m[1]));
 assert.deepEqual(values(fs.readFileSync(f,'utf8')),values(old(f)));reports.push({route:f,class:cl,originalEvidence:'exact match'});
}
assert.equal(cp.execFileSync('git',['diff','--name-only',base,'--','images'],{encoding:'utf8'}).trim(),'');
fs.writeFileSync('review/craft-motion/content-preservation.json',JSON.stringify({base,reports,originalImageAssets:'unchanged'},null,2));console.log('Original case narratives, metrics, qualifications and image assets preserved.');

const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
function setup(){
 let now=0,id=0,paused=false;const timers=new Map(),listeners={};
 const control={matches:s=>s.includes('focus-visible'),closest:()=>control};
 const element={dataset:{},classList:{add(){},remove(){}},closest:()=>null,querySelector:()=>null,contains:x=>x===control,getAnimations:()=>[],addEventListener:(type,fn)=>listeners[type]=fn};
 const document={hidden:false,activeElement:null};
 const ctx={controllers:[],performance:{now:()=>now},setTimeout:(fn,delay)=>{timers.set(++id,{fn,at:now+delay});return id;},clearTimeout:i=>timers.delete(i),motionPaused:()=>paused,document,queueMicrotask:fn=>fn()};
 vm.createContext(ctx);const source=fs.readFileSync('js/glass-demos.mjs','utf8');vm.runInContext(source.slice(source.indexOf('function register('),source.indexOf('const hero =')),ctx);
 const seen=[];const state=ctx.register(element,3000,[{at:0,run:()=>seen.push(0)},{at:1000,run:()=>seen.push(1)},{at:2000,run:()=>seen.push(2)}]);
 const tick=ms=>{const end=now+ms;while(true){let next=[...timers.entries()].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;timers.delete(next[0]);now=next[1].at;next[1].fn();}now=end;};
 return {state,seen,tick,document,control,element,listeners,pause:v=>paused=v,timers};
}
test('offscreen hold resumes remaining timeline then settles once',()=>{const x=setup();x.state.visible=true;x.state.sync();x.tick(1100);assert.deepEqual(x.seen,[0,1]);x.state.visible=false;x.state.sync();x.tick(5000);assert.deepEqual(x.seen,[0,1]);x.state.visible=true;x.state.sync();x.tick(2000);assert.deepEqual(x.seen,[0,1,2]);assert.equal(x.state.completed,true);assert.equal(x.timers.size,0);x.state.visible=false;x.state.sync();x.state.visible=true;x.state.sync();assert.deepEqual(x.seen,[0,1,2]);});
test('manual editing stops preview permanently',()=>{const x=setup();x.state.visible=true;x.state.sync();x.tick(500);x.listeners.input({type:'input',target:x.control});x.tick(5000);assert.equal(x.state.manual,true);assert.deepEqual(x.seen,[0]);assert.equal(x.timers.size,0);});
test('reduced motion and hidden documents freeze without resetting',()=>{const x=setup();x.pause(true);x.state.visible=true;x.state.sync();x.tick(4000);assert.deepEqual(x.seen,[]);x.pause(false);x.state.sync();x.tick(1100);x.document.hidden=true;x.state.sync();x.tick(5000);assert.deepEqual(x.seen,[0,1]);x.document.hidden=false;x.state.sync();x.tick(2100);assert.equal(x.state.completed,true);});
test('keyboard focus holds preview until focus leaves',()=>{const x=setup();x.state.visible=true;x.state.sync();x.tick(500);x.document.activeElement=x.control;x.state.sync();x.tick(4000);assert.deepEqual(x.seen,[0]);x.document.activeElement=null;x.state.sync();x.tick(2700);assert.equal(x.state.completed,true);});

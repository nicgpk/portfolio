import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

async function setup({width = 1440, height = 1305, coarse = false, stageHeight = 1000, listHeight = 940, heights = [940,940,940], naturalTop = 504} = {}) {
  let now = 0, id = 0, writes = 0, scrollCalls = 0;
  const frames = new Map(), events = {}, documentEvents = {}, notices = [];
  const style = () => new Proxy({setProperty(name, value) {this[name] = value;}, removeProperty(name) {delete this[name.startsWith('--') ? name : name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())];}}, {
    set(target, key, value) {writes++; target[key] = value; return true;},
  });
  const status = {};
  const cards = Array.from({length:3}, (_, i) => ({style:style(), inert:false, offsetHeight:heights[i],
    setAttribute() {writes++;}, removeAttribute() {}, contains:() => false,
    scrollIntoView() {}, querySelector:() => ({focus() {}}),
  }));
  const navEvents = {};
  const projectNav = {hidden:true, addEventListener:(type, fn) => {navEvents[type] = fn;}};
  const projectButtons = Array.from({length:3}, () => ({style:style(), attributes:{}, events:{},
    setAttribute(name, value) {this.attributes[name] = value;},
    removeAttribute(name) {delete this.attributes[name];},
    addEventListener(type, fn) {this.events[type] = fn;}, focus() {this.focused = true;},
  }));
  const atmosphere = {style:style(), classList:{toggle() {}}};
  const stage = {offsetHeight:stageHeight};
  const list = {offsetHeight:listHeight, style:style(), dataset:{}};
  const root = {style:style(), classList:{toggle() {}},
    contains:element => element === document.activeElement,
    dispatchEvent:event => notices.push({type:event.type,transforms:cards.map(card=>card.style.transform)}),
    addEventListener:(type, fn) => {documentEvents[type] = fn;},
    querySelector:s => s === '.work-project-nav' ? projectNav : s.includes('stage') ? stage : s.includes('list') ? list : status,
    querySelectorAll:s => s === '[data-work-index]' ? projectButtons : cards, closest:() => ({querySelector:() => atmosphere}),
    getBoundingClientRect:() => ({top:naturalTop - context.scrollY}),
  };
  const document = {hidden:false, activeElement:null, documentElement:{dataset:{motion:'on'}},
    fonts:{ready:Promise.resolve()}, querySelector:() => root,
    addEventListener:(type, fn) => {documentEvents[type] = fn;},
  };
  const context = {document, scrollY:400, innerWidth:width, innerHeight:height, performance:{now:() => now},
    Event:class {constructor(type) {this.type=type;}},
    matchMedia:query => ({matches:query.includes('pointer') && coarse, addEventListener() {}}),
    requestAnimationFrame:fn => {frames.set(++id, fn); return id;},
    cancelAnimationFrame:key => frames.delete(key),
    addEventListener:(type, fn) => {events[type] = fn;},
    ResizeObserver:class {observe() {}}, MutationObserver:class {observe() {}},
  };
  context.window = {scrollTo:({top}) => {scrollCalls++; context.scrollY = top;}};
  vm.runInNewContext(readFileSync(new URL('../js/work-scroll.mjs', import.meta.url), 'utf8'), context);
  await Promise.resolve();
  const stickyTop = () => Number.parseFloat(root.style['--work-sticky-top']) || (context.innerWidth < 768 ? 88 : 104);
  const scrollStart = () => naturalTop - stickyTop();
  return {cards, status, list, frames, root, notices, document, documentEvents, atmosphere, projectButtons, projectNav, navEvents,
    stickyTop, scrollStart,
    scrollPosition:() => context.scrollY,
    scrollCalls:() => scrollCalls,
    scroll(progress) {context.scrollY = scrollStart() + Math.round(context.innerHeight * .85) * progress; events.scroll();},
    resize({width:nextWidth=context.innerWidth,height:nextHeight=context.innerHeight,stageHeight=stage.offsetHeight,listHeight=list.offsetHeight}={}) {
      context.innerWidth=nextWidth;
      context.innerHeight=nextHeight;
      stage.offsetHeight=stageHeight;
      list.offsetHeight=listHeight;
      events.resize();
    },
    tick(ms) {now += ms; const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(now));},
    writes:() => writes,
  };
}

const verticalOffset = card => Number(card.style.transform.match(/translate3d\(0,([^p]+)px/)[1]);

test('coarse wheel steps slide over frames, reverse continuously, and settle without idle work', async () => {
  const x = await setup();
  x.scroll(.65);
  for (let i=0; i<60; i++) x.tick(1000/60);
  x.scroll(.95); x.scroll(.95);
  assert.equal(x.frames.size, 1, 'scroll events share a frame');
  x.tick(1000/60);
  const first = verticalOffset(x.cards[1]);
  assert(first > 470 && first < 940, 'first frame should soften the wheel jump');
  x.tick(1000/60);
  const second = verticalOffset(x.cards[1]);
  assert(second < first);
  x.scroll(.65); x.tick(1000/60);
  assert(verticalOffset(x.cards[1]) > second, 'reversal should start immediately');
  for (let i=0; i<100; i++) x.tick(1000/60);
  assert.equal(x.frames.size, 0);
  const writes = x.writes();
  x.scroll(.65); x.tick(1000/60);
  assert.equal(x.writes(), writes, 'unchanged scroll position should not rewrite styles or accessibility state');
});

test('project navigation follows reading progress and supports direct and keyboard jumps', async () => {
  const x = await setup();
  assert.equal(x.projectNav.hidden, false);
  assert.equal(x.projectButtons[0].attributes['aria-current'], 'step');
  x.scroll(.4);
  for (let i = 0; i < 100; i++) x.tick(1000 / 60);
  assert.equal(x.projectButtons[0].style['--project-progress'], '0.4000');
  assert.equal(x.projectButtons[1].style['--project-progress'], '0.0000');
  x.projectButtons[2].events.click();
  assert.equal(x.scrollPosition(), x.scrollStart() + 2 * Math.round(1305 * .85));
  let prevented = false;
  x.navEvents.keydown({target:x.projectButtons[2], key:'Home', preventDefault() {prevented = true;}});
  assert.equal(prevented, true);
  assert.equal(x.projectButtons[0].focused, true);
  assert.equal(x.scrollPosition(), x.scrollStart());
  x.document.documentElement.dataset.motion = 'off';
  x.documentEvents['portfolio:motionchange']();
  assert.equal(x.projectNav.hidden, true);
  assert(x.projectButtons.every(button => button.attributes['aria-current'] === undefined));
});

test('native scrolling announces each selected project', async () => {
  const x = await setup();
  assert.equal(x.status.textContent, '1 of 3');
  x.scroll(1);
  for (let i = 0; i < 100; i++) x.tick(1000 / 60);
  assert.equal(x.status.textContent, '2 of 3');
  x.scroll(2);
  for (let i = 0; i < 100; i++) x.tick(1000 / 60);
  assert.equal(x.status.textContent, '3 of 3');
  x.document.documentElement.dataset.motion = 'off';
  x.documentEvents['portfolio:motionchange']();
  assert.equal(x.status.textContent, '');
});

test('very short landscape windows retain natural reading flow', async () => {
  const x = await setup({height:360, stageHeight:232, listHeight:100});
  assert.equal(x.projectNav.hidden, true);
  assert(x.cards.every(card => !card.inert && card.style.transform === undefined));
  x.scroll(.5);
  assert.equal(x.frames.size, 0);
});

test('short desktop viewports read every full card before advancing the stack', async () => {
  const x = await setup({height:800,stageHeight:672,listHeight:612,heights:[940,1000,900]});
  const settle = () => {for(let i=0;i<100;i++)x.tick(1000/60);};
  // First card: 374px reading hold, 328px to expose its complete bottom.
  x.scroll(702/680);settle();
  assert.equal(verticalOffset(x.cards[0]),-328);
  assert.equal(x.cards[0].style.clipPath,undefined);
  assert.equal(x.cards[0].inert,false);
  // The next card enters from its beginning, then gets its own reading travel.
  x.scroll(1008/680);settle();
  assert.equal(verticalOffset(x.cards[1]),0);
  assert.equal(x.cards[1].inert,false);
  x.scroll((1008+374+388)/680);settle();
  assert.ok(Math.abs(verticalOffset(x.cards[1])+388)<.001);
  // Final card: 374px opening hold before panning 288px, then 136px closing hold.
  x.scroll((1008+1068+187)/680);settle();
  assert.equal(verticalOffset(x.cards[2]),0);
  assert.equal(x.cards[2].inert,false);
  x.scroll((1008+1068+374+288)/680);settle();
  assert.ok(Math.abs(verticalOffset(x.cards[2])+288)<.001);
  assert.equal(x.cards[2].inert,false);
  x.scroll((1008+1068+374+288+136)/680);settle();
  assert.ok(Math.abs(verticalOffset(x.cards[2])+288)<.001);
  assert.equal(x.cards[2].inert,false);
  assert.equal(x.frames.size,0);
});

test('background geometry stays unchanged through forward and reverse scrolling', async () => {
  const x = await setup();
  const geometry = {...x.atmosphere.style};
  assert.equal(geometry['--work-pin-distance'], '2827.95px');
  assert.equal(geometry['--work-atmosphere-top'], '-320px');
  for (const progress of [0, .8, 1, 2, 1, 0]) {
    x.scroll(progress);
    for (let i=0; i<60; i++) x.tick(1000/60);
    assert.deepEqual({...x.atmosphere.style}, geometry);
  }
});

test('elapsed-time easing has the same position at 60Hz and 120Hz', async () => {
  const a = await setup(), b = await setup();
  a.scroll(.95); b.scroll(.95);
  for (let i=0; i<12; i++) a.tick(1000/60);
  for (let i=0; i<24; i++) b.tick(1000/120);
  assert(Math.abs(verticalOffset(a.cards[1]) - verticalOffset(b.cards[1])) < 1e-10);
});

test('hiding a tab cancels the pending scroll frame and resumes from the same position', async () => {
  const x = await setup();
  x.scroll(.95); x.tick(160);
  const position = verticalOffset(x.cards[1]);
  x.document.hidden = true;
  x.documentEvents.visibilitychange();
  x.scroll(.95);
  assert.equal(x.frames.size, 0);
  x.tick(5000);
  assert.equal(verticalOffset(x.cards[1]), position);
  x.document.hidden = false;
  x.documentEvents.visibilitychange();
  assert.equal(x.frames.size, 1);
  x.tick(16);
  assert(verticalOffset(x.cards[1]) < position);
  assert(verticalOffset(x.cards[1]) > 0, 'a hidden interval must not jump straight to the target');
});

test('turning motion off cancels a pending blend and restores all cards', async () => {
  const x = await setup();
  x.scroll(.95); x.tick(16);
  assert.equal(x.frames.size, 1);
  x.document.documentElement.dataset.motion = 'off';
  x.documentEvents['portfolio:motionchange']();
  assert.equal(x.frames.size, 0);
  assert.equal(x.atmosphere.style['--work-pin-distance'], undefined);
  assert.equal(x.atmosphere.style['--work-atmosphere-top'], undefined);
  assert.equal(x.list.style['--work-fade-top'], undefined);
  assert.equal(x.list.style['--work-fade-bottom'], undefined);
  assert.equal(x.list.style.maskImage, undefined);
  assert.equal(x.list.dataset.workFade, undefined);
  for (const card of x.cards) {
    assert.equal(card.inert, false);
    assert.equal(card.style.opacity, undefined);
    assert.equal(card.style.transform, undefined);
    assert.equal(card.style.clipPath, undefined);
    assert.equal(card.style.willChange, undefined);
  }
});

for (const [width,height,stageHeight,listHeight] of [[320,640,528,442],[390,844,732,672],[768,1024,896,836]]) {
  test(`touch showcase at ${width}px reads each full card and follows the finger`, async () => {
    const heights=[1500,1400,1600];
    const x=await setup({width,height,coarse:true,stageHeight,listHeight,heights});
    assert.equal(x.projectNav.hidden,false);
    assert.equal(x.root.style['--work-sticky-top'],width<768?'88px':'104px');
    const step=Math.round(height*.85);
    let start=0;
    for(let i=0;i<3;i++) {
      const reading=heights[i]-listHeight;
      x.scroll((start+step*.2+reading)/step);x.tick(16);
      assert.ok(Math.abs(verticalOffset(x.cards[i])+reading)<.01,'native document scroll exposes the full card');
      assert.equal(x.cards[i].inert,false);
      assert.equal(x.frames.size,0,'touch positions have no trailing wheel smoothing');
      start+=reading+(i<2?step:step*.4);
    }
    x.scroll(0);x.tick(16);
    assert.equal(verticalOffset(x.cards[0]),0);
    assert.equal(x.cards[0].inert,false);
  });
}

test('a resize with the same stage geometry preserves native touch momentum', async () => {
  const x=await setup({width:390,height:844,coarse:true,stageHeight:732,listHeight:672,heights:[1500,1400,1600]});
  x.scroll(1);x.tick(16);
  const before={scroll:x.scrollPosition(),transform:x.cards[0].style.transform,runway:x.root.style.height};
  x.resize({height:920});
  assert.equal(x.root.style.height,before.runway);
  assert.equal(x.scrollPosition(),before.scroll);
  assert.equal(x.cards[0].style.transform,before.transform);
  assert.equal(x.scrollCalls(),0,'unchanged stage geometry needs no scroll correction');
});

test('mobile toolbar collapse expands the stage without shifting the text being read', async () => {
  const x=await setup({width:390,height:748,coarse:true,stageHeight:636,listHeight:576,heights:[1500,1400,1600]});
  const step=Math.round(748*.85);
  x.scroll(.2+260/step);x.tick(16);
  const oldHeight=x.root.style.height;
  x.resize({height:844,stageHeight:732,listHeight:672});
  assert.notEqual(x.root.style.height,oldHeight);
  assert.ok(Math.abs(verticalOffset(x.cards[0])+260)<.01);
  assert.equal(x.cards[0].inert,false);
  x.resize({height:748,stageHeight:636,listHeight:576});
  assert.equal(x.root.style.height,oldHeight);
  assert.ok(Math.abs(verticalOffset(x.cards[0])+260)<.01);
});

test('mobile toolbar collapse preserves the active project during a handoff', async () => {
  const x=await setup({width:390,height:748,coarse:true,stageHeight:636,listHeight:576,heights:[1500,1400,1600]});
  const step=Math.round(748*.85);
  x.scroll(.2+(1500-576)/step+.8*.473);x.tick(16);
  const tilt=card=>Number(card.style.transform.match(/rotateX\(([^d]+)deg\)/)[1]);
  const before=tilt(x.cards[0]);
  assert.equal(x.cards[0].inert,false);
  x.resize({height:844,stageHeight:732,listHeight:672});
  assert.equal(x.cards[0].inert,false);
  assert.ok(Math.abs(tilt(x.cards[0])-before)<.001);
});

test('touch card movement notifies reveal observers after the new positions are painted', async () => {
  const x=await setup({width:390,height:844,coarse:true,stageHeight:732,listHeight:672,heights:[1500,1400,1600]});
  const initial=x.notices.length;
  x.scroll(1);x.tick(16);
  assert.equal(x.notices.length,initial+1);
  assert.equal(x.notices.at(-1).type,'portfolio:workframe');
  assert.deepEqual(x.notices.at(-1).transforms,x.cards.map(card=>card.style.transform));
  x.scroll(1);x.tick(16);
  assert.equal(x.notices.length,initial+1,'settled positions do not schedule extra geometry checks');
});

test('a mobile keyboard does not dismantle an active demo; reduced motion still applies', async () => {
  const x=await setup({width:390,height:844,coarse:true,stageHeight:732,listHeight:672});
  x.document.activeElement={matches:()=>true};
  x.resize({height:330});
  assert.equal(x.projectNav.hidden,false);
  x.document.documentElement.dataset.motion='off';x.documentEvents['portfolio:motionchange']();
  assert.equal(x.projectNav.hidden,true);
  assert(x.cards.every(card=>!card.inert));
});

test('whole glass cards stay separated throughout both handoffs and reverse without a cut line', async () => {
  for (const heights of [[940,940,940], [1200,1100,1000], [700,800,900]]) {
    const x = await setup({heights});
    const step = Math.round(1305 * .85);
    let start = 0;
    for (let index = 0; index < 2; index++) {
      const reading = Math.max(0, heights[index] - 940);
      for (const fraction of [.05,.25,.5,.75,.95,.75,.5,.25,.05]) {
        x.scroll(start + .55 + reading / step + .45 * fraction);
        for (let i=0; i<100; i++) x.tick(1000/60);
        const outgoing = x.cards[index], incoming = x.cards[index + 1];
        const scale = Number(outgoing.style.transform.match(/scale\(([^)]+)/)[1]);
        // Negative tilt recedes further; this unprojected bound is conservative.
        const outgoingBottom = verticalOffset(outgoing) + heights[index] * scale;
        assert(outgoingBottom <= verticalOffset(incoming), 'whole surfaces never overlap');
        assert(x.cards.every(card => card.style.clipPath === undefined), 'no moving clip slices content');
        assert.equal(incoming.style.opacity, '1');
        assert.equal(x.cards.filter(card => !card.inert).length, 1);
        assert(Number.parseFloat(x.list.style['--work-fade-top']) > 0, 'content leaves through a soft top edge');
      }
      start += 1 + reading / step;
      x.scroll(start);
      for (let i=0; i<100; i++) x.tick(1000/60);
      assert.equal(x.cards[index].style.visibility, 'hidden');
      assert.equal(x.cards[index + 1].style.transform, 'translate3d(0,0px,0) perspective(1600px) rotateX(0deg) scale(1)');
      const nextOverflows = heights[index + 1] > 940;
      assert.equal(x.list.style['--work-fade-top'], '0.00px', 'settled titles are not faded');
      assert.equal(x.list.dataset.workFade, nextOverflows ? 'bottom' : undefined);
      assert.equal(x.list.style.maskImage, nextOverflows ? '' : 'none', 'only active fades apply a mask');
      if (nextOverflows) assert(Number.parseFloat(x.list.style['--work-fade-bottom']) > 0, 'overflowing card keeps a soft bottom mask');
      else assert.equal(x.list.style['--work-fade-bottom'], '0.00px', 'fitting card has no bottom fade');
    }
  }
});

test('last card holds on desktop even when it fits without overflow', async () => {
  const x = await setup({width: 1920, height: 1080, stageHeight: 800, listHeight: 740, heights: [740, 740, 740]});
  const settle = () => {for (let i = 0; i < 100; i++) x.tick(1000 / 60);};
  const step = Math.round(1080 * .85);
  assert.equal(Number.parseFloat(x.root.style.height), 800 + step * 2 + step * .55);
  x.scroll(2); settle();
  assert.equal(x.cards[2].style.visibility, 'visible');
  assert.equal(x.cards[2].inert, false);
  assert.equal(verticalOffset(x.cards[2]), 0);
  assert.equal(x.projectButtons[2].style['--project-progress'], '0.0000');
  x.scroll(2 + .55 * .5); settle();
  assert.equal(x.cards[2].style.visibility, 'visible');
  assert.equal(x.cards[2].inert, false);
  assert.equal(verticalOffset(x.cards[2]), 0);
  assert.equal(x.projectButtons[2].style['--project-progress'], '0.5000');
  x.scroll(2 + .55); settle();
  assert.equal(x.cards[2].inert, false);
  assert.equal(x.projectButtons[2].style['--project-progress'], '1.0000');
});

test('last card preserves opening hold, reading pan, and closing hold across resizes', async () => {
  const x = await setup({width: 1440, height: 800, stageHeight: 672, listHeight: 612, heights: [700, 700, 900]});
  const settle = () => {for (let i = 0; i < 100; i++) x.tick(1000 / 60);};
  const step = 680;
  const s2 = (88 + step) * 2;
  // Opening hold
  x.scroll((s2 + 187) / step); settle();
  assert.equal(verticalOffset(x.cards[2]), 0);
  assert.equal(x.cards[2].inert, false);
  x.resize({height: 760, stageHeight: 632, listHeight: 572});
  assert.equal(verticalOffset(x.cards[2]), 0);
  assert.equal(x.cards[2].inert, false);
  // Restore 800px and test closing hold
  x.resize({height: 800, stageHeight: 672, listHeight: 612});
  x.scroll((s2 + 374 + 288 + 68) / step); settle();
  assert.equal(verticalOffset(x.cards[2]), -288);
  assert.equal(x.cards[2].inert, false);
  const progress = Number.parseFloat(x.projectButtons[2].style['--project-progress']);
  assert(progress > .8 && progress < 1);
  x.resize({height: 760, stageHeight: 632, listHeight: 572});
  assert.equal(verticalOffset(x.cards[2]), -(900 - 572));
  assert.equal(x.cards[2].inert, false);
});

test('tall desktop viewports center shorter stages while tight and compact viewports stay at baseTop', async () => {
  const tall = await setup({width: 1920, height: 1200, stageHeight: 780, listHeight: 720, heights: [720, 720, 720], naturalTop: 540});
  assert.equal(tall.root.style['--work-sticky-top'], '235px');
  assert.equal(tall.scrollStart(), 540 - 235);
  const nearTop = await setup({width: 1920, height: 1200, stageHeight: 780, listHeight: 720, heights: [720, 720, 720], naturalTop: 150});
  assert.equal(nearTop.root.style['--work-sticky-top'], '150px');
  assert.equal(nearTop.scrollStart(), 0);
  const tight = await setup({width: 1440, height: 800, stageHeight: 672, listHeight: 612, heights: [612, 612, 612]});
  assert.equal(tight.root.style['--work-sticky-top'], '104px');
  const mobile = await setup({width: 390, height: 844, coarse: true, stageHeight: 600, listHeight: 540, heights: [540, 540, 540]});
  assert.equal(mobile.root.style['--work-sticky-top'], '88px');
});

test('bottom fade ramps smoothly without clipping the outgoing card and transitions across tall card phases', async () => {
  const settle = x => {for (let i = 0; i < 100; i++) x.tick(1000 / 60);};

  const fitting = await setup({width: 1920, height: 1080, stageHeight: 800, listHeight: 740, heights: [740, 740, 740]});
  assert.equal(fitting.list.style['--work-fade-bottom'], '0.00px');
  assert.equal(fitting.list.dataset.workFade, undefined);
  assert.equal(fitting.list.style.maskImage, 'none');

  fitting.scroll(.55 + .45 * .01); settle(fitting);
  const earlyFadeBottom = Number.parseFloat(fitting.list.style['--work-fade-bottom']);
  const outgoingScale = Number(fitting.cards[0].style.transform.match(/scale\(([^)]+)/)[1]);
  const outgoingBottom = verticalOffset(fitting.cards[0]) + 740 * outgoingScale;
  assert(earlyFadeBottom > 0);
  assert(earlyFadeBottom <= 740 - outgoingBottom + 1e-6, 'bottom fade must not clip into the outgoing card');

  fitting.scroll(.55 + .45 * .5); settle(fitting);
  assert.equal(fitting.list.dataset.workFade, 'both');
  assert.equal(fitting.list.style['--work-fade-bottom'], '64.00px');

  fitting.scroll(1); settle(fitting);
  assert.equal(fitting.list.style['--work-fade-bottom'], '0.00px');
  assert.equal(fitting.list.dataset.workFade, undefined);
  assert.equal(fitting.list.style.maskImage, 'none');

  const tall = await setup({height: 800, stageHeight: 672, listHeight: 612, heights: [940, 1000, 900]});
  assert.equal(tall.list.dataset.workFade, 'bottom');
  assert.equal(tall.list.style['--work-fade-bottom'], '64.00px');
  assert.equal(tall.list.style['--work-fade-top'], '0.00px');

  tall.scroll((374 + 160) / 680); settle(tall);
  assert.equal(tall.list.dataset.workFade, 'both');
  assert.equal(tall.list.style['--work-fade-bottom'], '64.00px');
  assert.equal(tall.list.style['--work-fade-top'], '48.00px');

  tall.scroll((374 + 328) / 680); settle(tall);
  assert.equal(tall.list.dataset.workFade, 'top');
  assert.equal(tall.list.style['--work-fade-bottom'], '0.00px');
  assert.equal(tall.list.style['--work-fade-top'], '48.00px');
});

test('work cards avoid backdrop-filter color shifts and opaque bottom overlay seams', () => {
  const css = readFileSync(new URL('../css/work-index.css', import.meta.url), 'utf8');
  const cardRule = css.match(/\.work-feature-list\s+\.work-feature\s*\{[^}]*\}/);
  assert.ok(cardRule, 'expected .work-feature-list .work-feature rule');
  assert.equal(/backdrop-filter/i.test(cardRule[0]), false, 'work cards must not depend on backdrop-filter brightness');
  assert.equal(/#work\.is-work-pinned\s+\.work-feature-list::after/.test(css), false, 'opaque ::after overlay must be removed');
});

import { stackDiscounts } from "./calculations.mjs?v=a0235d2fae86";
import { motionPaused } from "./kinetics.mjs?v=2178cec3bf8c";
import { animateFeedback } from "./interaction-motion.mjs?v=ccec8d8cb84c";
import "./demo-scenes.mjs?v=0ff3773ee94e";
import './section-reveals.mjs?v=240eaa00245e';
import { observeDemoReveals } from './demo-reveal.mjs?v=74b6932daa6c';

// Preserve increase semantics while using the shared arrow icon instead of '+'.
function renderGrowthText(target, text) {
  target.replaceChildren();
  let cursor = 0;
  for (const match of text.matchAll(/\+(\d+(?:\.\d+)?%)/g)) {
    target.append(document.createTextNode(text.slice(cursor, match.index)));
    const group = document.createElement('span'); group.className = 'growth-metric';
    const spoken = document.createElement('span'); spoken.className = 'sr-only'; spoken.textContent = 'Increase ';
    const value = document.createElement('span'); value.textContent = match[1];
    const icon = document.createElementNS('http://www.w3.org/2000/svg','svg');
    icon.setAttribute('class','ui-icon growth-icon'); icon.setAttribute('viewBox','0 0 24 24'); icon.setAttribute('aria-hidden','true'); icon.setAttribute('focusable','false');
    const use = document.createElementNS('http://www.w3.org/2000/svg','use'); use.setAttribute('href','images/interface-icons.svg#arrow-down'); icon.append(use);
    group.append(spoken,value,icon); target.append(group); cursor = match.index + match[0].length;
  }
  target.append(document.createTextNode(text.slice(cursor)));
}

// A selection gets one brief border sweep; the steady frosted state is CSS-only.
const selectionEffects = new Map();
function stopSelectionEffect(button) {
  const effect=selectionEffects.get(button);
  if(effect){cancelAnimationFrame(effect.frame);clearTimeout(effect.timer);}
  button.classList.remove('program-select-flash');
  selectionEffects.delete(button);
}
function selectProgram(buttons,index) {
  buttons.forEach((button,i)=>{
    if(!button.querySelector('.selection-check')) {
      const check=document.createElement('span');check.className='selection-check';check.setAttribute('aria-hidden','true');
      check.innerHTML='<svg class="ui-icon" viewBox="0 0 24 24" focusable="false"><use href="images/interface-icons.svg#check"/></svg>';
      button.append(check);
    }
    const selected=i===index,changed=button.getAttribute('aria-pressed')!==String(selected);
    button.setAttribute('aria-pressed',String(selected));
    if(!selected){stopSelectionEffect(button);return;}
    if(!changed||motionPaused()||document.hidden)return;
    flashProgramSelection(button,()=>button.getAttribute('aria-pressed')==='true');
  });
}


function flashProgramSelection(button,isSelected) {
  stopSelectionEffect(button);
  if(motionPaused()||document.hidden||!isSelected())return;
  const effect={frame:0,timer:0};selectionEffects.set(button,effect);
  effect.frame=requestAnimationFrame(()=>{
    effect.frame=0;
    if(!isSelected()||motionPaused()||document.hidden){stopSelectionEffect(button);return;}
    const box=button.getBoundingClientRect();
    if(box.bottom<=0||box.top>=innerHeight){stopSelectionEffect(button);return;}
    button.classList.add('program-select-flash');
    effect.timer=setTimeout(()=>stopSelectionEffect(button),1600);
  });
}

const controllers = [];
const arrivals = new Set();
const ease = "cubic-bezier(.25,.1,.25,1)";

function settlePhase(element) {
  if (motionPaused() || document.hidden) return;
  const box = element.getBoundingClientRect();
  if (box.bottom <= 0 || box.top >= innerHeight) return;
  // One layer of motion follows the new information in reading order. Moving
  // both the panel and its rows compounded the offset and dimmed readable text.
  const parts = [...element.children].flatMap(node => node.matches('dl') ? [...node.children] : [node]);
  parts.forEach((node, index) => animateFeedback(node,
    [{ opacity: .8, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }],
    420, Math.min(index * 55, 220),
  ));
}

// Each reveal plays once, then settles. A new reveal restarts the walkthrough;
// actual activation/editing preserves the visitor's own example.
function register(element, duration, phases, delay = 0) {
  const host = element.closest(".glass-feature,.glass-hero-product") || element;
  const project = element.closest(".work-feature");
  const state = {
    element,
    host,
    target: element.querySelector(".program-hub-panels,.receipt-promotions,[data-mini-deploy-detail]")
      || element.querySelector(".hero-programs,.mini-window") || element,
    duration,
    phases,
    elapsed: -delay,
    started: 0,
    timer: 0,
    running: false,
    visible: false,
    manual: false,
    completed: false,
    phaseKey: null,
  };
  let revealed = false;
  const clock = () =>
    state.elapsed + (state.running ? performance.now() - state.started : 0);
  const freeze = () => {
    const wasRunning = state.running;
    if (state.running) state.elapsed = clock();
    state.running = false;
    clearTimeout(state.timer);
    element.classList.remove("is-demo-playing");
    if (wasRunning) element
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.cancel());
  };
  const schedule = () => {
    if (!state.running) return;
    const elapsed = clock();
    if (elapsed < 0) {
      state.timer = setTimeout(schedule, -elapsed);
      return;
    }
    const time = Math.min(elapsed, duration);
    let index = phases.findLastIndex((phase) => phase.at <= time);
    index = Math.max(0, index);
    const key = index;
    if (key !== state.phaseKey) {
      state.phaseKey = key;
      phases[index].run();
      element.dataset.demoPhase = String(index);
    }
    if (elapsed >= duration) {
      freeze();
      state.elapsed = duration;
      state.completed = true;
      state.sync();
      return;
    }
    const next = phases[index + 1]?.at ?? duration;
    state.timer = setTimeout(schedule, Math.max(20, next - time + 1));
  };
  const controlSelector =
    "button:not([data-motion-toggle]),input,select,textarea";
  state.sync = () => {
    const inView = state.visible && !project?.inert && project?.getAttribute("aria-hidden") !== "true";
    if (inView && !revealed && !state.manual) {
      state.elapsed = -delay;
      state.phaseKey = null;
      state.completed = false;
    }
    revealed = inView;
    const focused =
      element.contains(document.activeElement) &&
      document.activeElement.matches(
        ":is(" + controlSelector + "):focus-visible",
      );
    const allowed =
      inView &&
      !state.manual &&
      !state.completed &&
      !focused &&
      !document.hidden &&
      !motionPaused();
    if (!allowed) freeze();
    else if (!state.running) {
      state.running = true;
      state.started = performance.now();
      element.classList.add("is-demo-playing");
      schedule();
    }
    element.dataset.demoMode = motionPaused()
      ? "reduced"
      : state.manual
        ? "manual"
        : state.completed
          ? "settled"
          : focused
            ? "focused"
            : allowed
              ? "reveal"
              : "offscreen";
    const status = host.querySelector("[data-demo-status]");
    if (status)
      status.textContent = motionPaused()
        ? "Reduced motion enabled · Use the controls"
        : state.manual
          ? "Your example · Values preserved"
          : state.completed
            ? "Explore the controls"
            : focused
              ? "Paused while using the controls"
              : allowed
                ? "Playing preview · Try the controls"
                : "Preview plays when revealed";
  };
  const takeControl = (event) => {
    if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
    const control = event.target.closest(controlSelector);
    if (!control || !element.contains(control)) return;
    if (event.type === "click" && !control.matches("button")) return;
    state.manual = true;
    state.sync();
    element
      .querySelector("[data-mini-net]")
      ?.setAttribute("aria-live", "polite");
  };
  // Freeze the preview before target handlers apply the visitor's action and
  // start feedback. Bubbling here would cancel that new feedback immediately.
  element.addEventListener("click", takeControl, true);
  element.addEventListener("pointerdown", takeControl, true);
  element.addEventListener("keydown", takeControl, true);
  element.addEventListener("input", takeControl, true);
  element.addEventListener("change", takeControl, true);
  element.addEventListener("focusin", state.sync);
  element.addEventListener("focusout", () => queueMicrotask(state.sync));
  // IntersectionObserver reports geometry, including cards hidden by the pinned
  // stack. Their previews must wait for the card to become active too.
  if (project) {
    new MutationObserver(state.sync).observe(project, {
      attributes: true,
      attributeFilter: ["inert", "aria-hidden"],
    });
  }
  controllers.push(state);
  state.sync();
  return state;
}

const hero = document.querySelector("[data-hero-program-demo]");
if (hero) {
  const buttons = [...hero.querySelectorAll("[data-hero-program]")];
  const content = [
    [
      "Promotions",
      "Launch a discount and get deal badges, ranking lift, and email/push distribution across Agoda channels.",
      "+15% room nights · +24% net revenue",
    ],
    [
      "Marketing Program",
      "Full marketing suite with ranking boost, ad spend, and Preferred Partner badge.",
      "+10% booking uplift · 14% penetration",
    ],
    [
      "Boost Rank",
      "Target specific audiences and stay dates — only pay when a booking lands. No lock-in.",
      "12% est. revenue · +18% search lift",
    ],
  ];
  const select = (index) => {
    hero.dataset.selectedTone = ["conversion", "marketing", "visibility"][
      index
    ];
    selectProgram(buttons, index);
    ["title", "copy", "metrics"].forEach((key, i) => {
      const target = hero.querySelector("[data-hero-" + key + "]");
      if (key === "metrics") renderGrowthText(target, content[index][i]);
      else target.textContent = content[index][i];
    });
  };
  buttons.forEach((button, i) => {
    button.disabled = false;
    button.addEventListener("click", () => select(i));
  });
  register(hero, 7600, [
    { at: 0, run: () => select(0) },
    { at: 2200, run: () => select(1) },
    { at: 4400, run: () => select(2) },
    { at: 6600, run: () => select(0) },
  ]);

  const figures = [...hero.querySelectorAll(".hero-overview dd")]
    .map((dd) => {
      const walker = document.createTreeWalker(dd, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parts = node.textContent.match(/^(\D*)(\d+)(.*)$/s);
        if (parts && !node.parentElement.closest(".sr-only"))
          return { node, prefix: parts[1], value: +parts[2], suffix: parts[3] };
      }
      return null;
    })
    .filter(Boolean);
  const countUp = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      countUp.disconnect();
      if (motionPaused() || document.hidden) return;
      const start = performance.now();
      const write = (figure, progress) =>
        (figure.node.textContent =
          figure.prefix + Math.round(figure.value * progress) + figure.suffix);
      const tick = (now) => {
        let running = false;
        figures.forEach((figure, i) => {
          const t = Math.min(Math.max((now - start - 420 - i * 90) / 1100, 0), 1);
          if (motionPaused()) return write(figure, 1);
          write(figure, 1 - Math.pow(1 - t, 4));
          running ||= t < 1;
        });
        if (running && !motionPaused()) requestAnimationFrame(tick);
      };
      figures.forEach((figure) => write(figure, 0));
      requestAnimationFrame(tick);
    },
    { threshold: 0.35 },
  );
  if (figures.length) countUp.observe(hero);
}

const growth = document.querySelector("[data-mini-growth]");
if (growth) {
  const buttons = [...growth.querySelectorAll("[data-mini-program]")];
  const panels = [...growth.querySelectorAll("[data-mini-program-panel]")];
  let shown = 0;
  const select = (index) => {
    selectProgram(buttons, index);
    if (index === shown) return;
    panels[shown].classList.remove("is-shown");
    panels[index].classList.add("is-shown");
    const direction = index > shown ? 1 : -1;
    shown = index;
    settlePhase(panels[index], direction);
  };
  buttons.forEach((button, i) => {
    button.disabled = false;
    button.addEventListener("click", () => select(i));
  });
  register(growth.closest("[data-glass-demo]"), 6000, [
    { at: 0, run: () => select(0) },
    { at: 1200, run: () => select(1) },
    { at: 3000, run: () => select(2) },
    { at: 4800, run: () => select(0) },
  ]);
}

for (const receipt of document.querySelectorAll('[data-receipt]')) {
  const input=receipt.querySelector('[data-receipt-rate]');
  const promos=[...receipt.querySelectorAll('[data-receipt-promo]')];
  const rows=[...receipt.querySelectorAll('[data-receipt-row]')];
  const formatter=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
  const money=n=>formatter.format(n);
  let receiptReady = false;
  const update=()=>{
    const start=input.valueAsNumber;
    const valid=input.validity.valid&&Number.isFinite(start);
    input.setAttribute('aria-invalid',String(!valid));
    receipt.querySelector('.receipt-error').textContent=valid?'':'Enter a rate from $0 to $1,000,000, with up to two decimal places.';
    if(!valid){
      receipt.querySelector('[data-receipt-net]').getAnimations().forEach(animation=>animation.cancel());
      receipt.querySelector('[data-receipt-net]').textContent='—';
      receipt.querySelector('[data-receipt-savings]').textContent='Result unavailable';
      rows.forEach(row=>{row.querySelector('[data-receipt-cut]').textContent='—';row.querySelector('[data-receipt-detail]').textContent='Check the starting rate';});return;
    }
    let balance=start;
    promos.forEach((toggle,i)=>{
      const previous = rows[i].querySelector('[data-receipt-detail]').textContent;
      const percent=Number(toggle.dataset.receiptPromo),before=balance;
      const result=stackDiscounts(before,toggle.checked?[percent]:[]);
      balance=result.net;
      rows[i].classList.toggle('is-receipt-inactive',!toggle.checked);
      rows[i].querySelector('[data-receipt-cut]').textContent=toggle.checked?'−'+money(result.cuts[0]):'—';
      rows[i].querySelector('[data-receipt-detail]').textContent=toggle.checked?`${percent}% of ${money(before)} · Remaining ${money(balance)}`:'Not applied · Balance unchanged';
      if (receiptReady && previous !== rows[i].querySelector('[data-receipt-detail]').textContent) {
        animateFeedback(rows[i].querySelector('[data-receipt-cut]'), [{opacity:.8,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}], 280, i * 35);
      }
    });
    const total=stackDiscounts(start,promos.filter(x=>x.checked).map(x=>Number(x.dataset.receiptPromo)));
    const net=receipt.querySelector('[data-receipt-net]');
    const nextNet=money(total.net);
    const changed=net.textContent!==nextNet;
    net.textContent=nextNet;
    receipt.querySelector('[data-receipt-savings]').textContent=`You save ${money(start-total.net)} · ${total.effective}% effective discount`;
    if(changed){
      animateFeedback(net,
        [{opacity:.85,transform:'translateY(2px)'},{opacity:1,transform:'translateY(0)'}],
        320
      );
    }
    receiptReady = true;
  };
  [input,...promos].forEach(control=>{control.disabled=false;control.addEventListener('input',()=>{receipt.querySelector('[data-receipt-net]').setAttribute('aria-live','polite');update();});});
  update();
  const example=count=>{
    promos.forEach((toggle,i)=>toggle.checked=i<count);update();
    if(count>0) animateFeedback(rows[count-1],
      [{opacity:.85,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],
      360
    );
  };
  register(receipt.closest('[data-glass-demo]')||receipt,6400,[
    {at:0,run:()=>example(0)},
    {at:1000,run:()=>example(1)},
    {at:2600,run:()=>example(2)},
    {at:4200,run:()=>example(3)},
  ]);
}

const deploy = document.querySelector("[data-mini-deploy]");
if (deploy) {
  // Keep the optional graph enhancement independent of the rollout controls.
  import('./deployment-topology.mjs?v=4818473a33a5').then(({ initDeploymentTopology }) => {
    initDeploymentTopology(deploy.querySelector('.topology-canvas'));
  }).catch(() => {});
  let step = 0,
    renderedStep = -1;
  const next = deploy.querySelector("[data-mini-next]"),
    back = deploy.querySelector("[data-mini-back]"),
    detail = deploy.querySelector("[data-mini-deploy-detail]");
  const content = [
    [
      "Environment",
      "staging-mesh",
      [
        ["Cluster pool", "Mesh"],
        ["CPU requests", "24 cores"],
        ["Memory requests", "24 Gi"],
        ["Repository", "actions/ansible-runner"],
        ["Image tag", "98ds12df"],
        ["Environment", "staging-mesh"],
      ],
    ],
    [
      "Rollout",
      "Canary",
      [
        ["Sequence", "10% → 20% → 30%"],
        ["Hong Kong", "10 replicas"],
        ["Singapore", "10 replicas"],
        ["Amsterdam", "10 replicas"],
        ["Ramp up", "300 seconds"],
        ["Monitoring", "900 seconds"],
      ],
    ],
    [
      "Review",
      "Ready to inspect",
      [
        ["Environment", "staging-mesh"],
        ["Image tag", "98ds12df"],
        ["Resources", "24 cores · 24 Gi"],
        ["Strategy", "Canary"],
        ["Monitoring", "900 seconds"],
        ["Channel", "#devops_safe_app"],
      ],
    ],
  ];
  const render = () => {
    const [label, title, rows] = content[step];
    deploy.dataset.topologyStep = String(step);
    deploy.querySelectorAll('[data-topology-node]').forEach((node, index) => {
      node.classList.toggle('is-active', step > 0 || index === 0);
    });
    detail.replaceChildren();
    const p = document.createElement("p"),
      strong = document.createElement("strong"),
      dl = document.createElement("dl");
    p.textContent = label;
    strong.textContent = title;
    for (const [name, value] of rows) {
      const div = document.createElement("div"),
        dt = document.createElement("dt"),
        dd = document.createElement("dd");
      dt.textContent = name;
      dd.textContent = value;
      div.append(dt, dd);
      dl.append(div);
    }
    detail.append(p, strong, dl);
    deploy
      .querySelectorAll(".mini-stages li")
      .forEach((el, i) =>
        i === step
          ? el.setAttribute("aria-current", "step")
          : el.removeAttribute("aria-current"),
      );
    back.disabled = step === 0;
    next.disabled = false;
    next.textContent = ["Show rollout", "Show review", "Restart example"][step];
    if (renderedStep >= 0 && renderedStep !== step) settlePhase(detail, step > renderedStep ? 1 : -1);
    renderedStep = step;
  };
  next.addEventListener("click", () => {
    step = (step + 1) % 3;
    render();
  });
  back.addEventListener("click", () => {
    step = Math.max(0, step - 1);
    render();
  });
  render();
  const show = (i) => {
    step = i;
    render();
  };
  register(
    deploy.closest("[data-glass-demo]"),
    5000,
    [
      { at: 0, run: () => show(0) },
      { at: 1200, run: () => show(1) },
      { at: 3000, run: () => show(2) },
    ],
    0,
  );
}

const language = document.querySelector("[data-mini-language]");
if (language) {
  const content = [
    [
      "Discovery",
      "Make the next step clear.",
      "Bring the program catalog into one partner experience.",
    ],
    [
      "Activation",
      "Build confidence first.",
      "Align discovery, pre-activation confidence and activation with shared patterns.",
    ],
    [
      "Retention",
      "Keep the journey connected.",
      "Connect settings, analytics, deactivation and retention across programs.",
    ],
  ];
  const select = (index) => {
    language
      .querySelectorAll("[data-mini-pattern]")
      .forEach((el, i) => el.setAttribute("aria-pressed", String(index === i)));
    ["name", "title", "copy"].forEach(
      (key, i) =>
        (language.querySelector("[data-mini-pattern-" + key + "]").textContent =
          content[index][i]),
    );
    language.style.setProperty("--pattern-progress", String(index / 2));
    language.querySelectorAll(".mini-pattern-rail i").forEach((el, i) => {
      el.classList.toggle("is-current", i === index);
      el.classList.toggle("is-complete", i < index);
    });
  };
  language.querySelectorAll("[data-mini-pattern]").forEach((button, i) => {
    button.disabled = false;
    button.addEventListener("click", () => select(i));
  });
  register(
    language.closest("[data-glass-demo]"),
    7200,
    [
      { at: 0, run: () => select(0) },
      { at: 2400, run: () => select(1) },
      { at: 4800, run: () => select(2) },
    ],
    450,
  );
}

function syncMotion() {
  controllers.forEach((state) => state.sync());
  if (motionPaused() || document.hidden) {
    selectionEffects.forEach((effect,button)=>stopSelectionEffect(button));
    arrivals.forEach((animation) => animation.cancel());
    arrivals.clear();
  }
}
observeDemoReveals(controllers.map(state => ({
  target: state.target,
  onVisible(visible) { state.visible = visible; state.sync(); },
})));
document.addEventListener("portfolio:motionchange", syncMotion);
document.addEventListener("visibilitychange", syncMotion);

// One opening sequence, then four product siblings. Failed scripts leave every
// element visible; pause/reduced motion settle immediately to the final UI.
const entered = new WeakSet();
const entrances = document.body.hasAttribute("data-instant-content") ? [] : [
  ...document.querySelectorAll(
    "[data-glass-enter],[data-glass-demo]",
  ),
].filter(
  (element) =>
    !(element.matches("[data-glass-demo]") && element.closest("[data-section-rise]")),
);
function entranceFor(element) {
  if (element.classList.contains("glass-hero-product")) {
    return {
      keyframes: [
        { opacity: 0, transform: "translateY(42px) scale(0.985)" },
        { opacity: 1, transform: "none" },
      ],
      options: { duration: 920, delay: 140, easing: ease, fill: "backwards" },
    };
  }
  if (element.closest(".glass-hero")) {
    const order = [...element.parentElement.children]
      .filter((node) => node.matches?.("[data-glass-enter]"))
      .indexOf(element);
    return {
      keyframes: [
        { opacity: 0, transform: "translateY(14px)" },
        { opacity: 1, transform: "none" },
      ],
      options: {
        duration: 620,
        delay: 30 + Math.max(order, 0) * 90,
        easing: ease,
        fill: "backwards",
      },
    };
  }
  if (element.classList.contains("work-feature")) {
    return {
      keyframes: [
        { opacity: 0, transform: "translateY(32px)" },
        { opacity: 1, transform: "none" },
      ],
      options: { duration: 820, easing: ease, fill: "backwards" },
      parts: [
        ...[...element.querySelectorAll(".glass-feature-copy > *")].map(
          (node, i) => ({
            node,
            keyframes: [
              { opacity: 0, transform: "translateY(12px)" },
              { opacity: 1, transform: "none" },
            ],
            options: {
              duration: 560,
              delay: 120 + i * 60,
              easing: ease,
              fill: "backwards",
            },
          }),
        ),
        {
          node: element.querySelector(".glass-demo-stage"),
          keyframes: [
            { opacity: 0, transform: "translateY(20px) scale(0.985)" },
            { opacity: 1, transform: "none" },
          ],
          options: { duration: 900, delay: 220, easing: ease, fill: "backwards" },
        },
      ].filter((part) => part.node),
    };
  }
  return {
    keyframes: [
      { opacity: 0, transform: "translateY(22px)" },
      { opacity: 1, transform: "none" },
    ],
    options: { duration: 700, easing: ease, fill: "backwards" },
  };
}
const enter = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting || entered.has(entry.target)) continue;
      entered.add(entry.target);
      enter.unobserve(entry.target);
      entry.target.classList.add("is-entered");
      if (entry.target.classList.contains("glass-hero-product")) {
        entry.target.classList.add("is-choreographed");
      }
      if (motionPaused() || document.hidden) continue;
      const motion = entranceFor(entry.target);
      const animations = [
        entry.target.animate(motion.keyframes, motion.options),
        ...(motion.parts || []).map((part) =>
          part.node.animate(part.keyframes, part.options),
        ),
      ];
      for (const animation of animations) {
        arrivals.add(animation);
        animation.finished
          .catch(() => {})
          .finally(() => arrivals.delete(animation));
      }
    }
  },
  { threshold: 0.12 },
);
entrances.forEach((element) => enter.observe(element));

// Later sections stay hidden until they enter, then rise once. Without this
// script, or with motion paused, the sections stay in their normal visible state.
const rises = [...document.querySelectorAll("[data-section-rise]")];
if (rises.length && !motionPaused()) {
  if (!("IntersectionObserver" in window)) {
    rises.forEach((element) => element.classList.add("is-risen"));
  } else {
    const rise = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.target.classList.contains("is-risen")) continue;
          rise.unobserve(entry.target);
          entry.target.classList.add("is-risen");
        }
      },
      { rootMargin: "0px 0px -24% 0px", threshold: 0.15 },
    );
    rises.forEach((element) => rise.observe(element));
  }
}

// The capsule's active links use CSS; no invisible marker needs measuring.
const header = document.querySelector(".site-nav"),
  nav = header?.querySelector("nav");
if (nav) {
  const links = [...nav.querySelectorAll("a")];
  // A disclosure on compact screens; without JS the existing route links stay visible.
  const compact = matchMedia("(max-width:767px)");
  const menuButton = document.createElement("button");
  menuButton.type = "button";
  menuButton.className = "nav-menu-toggle";
  menuButton.setAttribute("aria-expanded", "false");
  nav.id = "portfolio-navigation";
  menuButton.setAttribute("aria-controls", nav.id);
  menuButton.innerHTML =
    'Menu <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="images/interface-icons.svg#chevron-down"/></svg>';
  header.insertBefore(menuButton, nav);
  const contact = header.querySelector(".nav-contact")?.cloneNode(true);
  if (contact) {
    contact.className = "nav-menu-contact";
    nav.append(contact);
  }
  header.classList.add("nav-has-menu");
  const setMenu = (open, returnFocus = false) => {
    open = open && compact.matches;
    header.classList.toggle("is-menu-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    nav.inert = compact.matches && !open;
    if (returnFocus) menuButton.focus();
    if (open) {
      animateFeedback(nav,
        [
          { opacity: 0.8, transform: "translateY(-6px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        360,
      );
    } else nav.getAnimations().forEach(animation => animation.cancel());
  };
  menuButton.addEventListener("click", () =>
    setMenu(menuButton.getAttribute("aria-expanded") !== "true"),
  );
  menuButton.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setMenu(true);
      links[0]?.focus();
    }
  });
  header.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.classList.contains("is-menu-open")) {
      event.preventDefault();
      setMenu(false, true);
    }
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false, compact.matches);
  });
  header.addEventListener("focusout", () => queueMicrotask(() => {
    if (!header.contains(document.activeElement)) setMenu(false);
  }));
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (!header.contains(event.target)) setMenu(false);
    },
    { passive: true },
  );
  compact.addEventListener("change", () => setMenu(false));
  setMenu(false);
  let navFrame=0;
  const scroll = () => {
    navFrame=0;
    // Finish the necessary geometry read before changing the header's layout.
    syncCurrent();
    header.classList.toggle("nav-is-scrolled", scrollY > 24);
  };
  const scheduleNavigation = () => {if(!navFrame)navFrame=requestAnimationFrame(scroll);};
  addEventListener("scroll", scheduleNavigation, { passive: true });
  addEventListener("resize", scheduleNavigation, { passive: true });
  const home = location.pathname.endsWith("/") || /\/index(?:\.html)?$/.test(location.pathname);
  const about = home ? document.querySelector('#about') : null;
  const destinations = links.map(link => ({link,url:new URL(link.href)}));
  const syncCurrent = () => {
    if (home && about) {
      // Read geometry once before updating any attributes.
      const bounds=about.getBoundingClientRect();
      const inAbout=bounds.top < innerHeight*.5 && bounds.bottom > 112;
      destinations.forEach(({link,url}) => {
        const current=inAbout && url.hash === "#about" ? "location"
          : !inAbout && url.pathname.endsWith("/index.html") && !url.hash ? "page" : null;
        if(link.getAttribute("aria-current")===current)return;
        if(current)link.setAttribute("aria-current",current);
        else link.removeAttribute("aria-current");
      });
    }
  };
  const restoreNavigation = () => {
    setMenu(false);
    scheduleNavigation();
  };
  addEventListener("hashchange", restoreNavigation);
  addEventListener("popstate", restoreNavigation);
  addEventListener("pageshow", restoreNavigation);
  document.fonts.ready.then(scheduleNavigation);
  scroll();
  if (!motionPaused()) {
    const animation = header.animate(
      [
        {
          opacity: 0.6,
          transform: "translateX(-50%) translateY(-12px)",
          filter: "blur(3px)",
        },
        {
          opacity: 1,
          transform: "translateX(-50%) translateY(0)",
          filter: "blur(0)",
        },
      ],
      { duration: 650, easing: ease },
    );
    arrivals.add(animation);
    animation.finished
      .catch(() => {})
      .finally(() => arrivals.delete(animation));
  }
}

// Card chrome opens its case study; the product examples keep their own input.
for (const card of document.querySelectorAll('.work-feature')) {
  const link = card.querySelector('.work-case-link');
  if (!link) continue;
  card.classList.add('is-card-linked');
  const interactive = '.glass-demo-stage,a,button,input,select,textarea,label,summary,[role="button"],[role="link"],[contenteditable]';
  let origin = null;
  const release = () => card.classList.remove('is-card-pressed');
  card.addEventListener('pointerdown', event => {
    origin = null;
    if (event.button !== 0 || event.target.closest('.glass-demo-stage,button,input,select,textarea,label,summary,[contenteditable]')) return;
    origin = {x:event.clientX,y:event.clientY};
    card.classList.add('is-card-pressed');
  });
  // Touch emits pointerleave before its synthesized click; cancellation still
  // clears the origin when the gesture becomes scrolling instead of a tap.
  card.addEventListener('pointerleave', event => {release();if(event.pointerType!=='touch')origin=null;});
  card.addEventListener('pointercancel', () => {release();origin=null;});
  window.addEventListener('pointerup', release);
  card.addEventListener('click', event => {
    const start = origin;
    origin = null;
    release();
    if (event.defaultPrevented || event.button !== 0 || event.target.closest(interactive)
      || getSelection()?.toString() || !start || Math.hypot(event.clientX-start.x,event.clientY-start.y)>6) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey) window.open(link.href,'_blank','noopener');
    else link.click();
  });
  document.addEventListener('visibilitychange', () => {if(document.hidden){release();origin=null;}});
  addEventListener('pagehide', () => {release();origin=null;});
}

// One finite result-strip reveal. Final numbers remain readable throughout.
const projectMetrics = document.querySelectorAll('[data-project-metrics]');
if (projectMetrics.length) {
  const metricsObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || entry.intersectionRatio < .6 || document.hidden) continue;
      const strip = entry.target;
      metricsObserver.unobserve(strip);
      strip.dataset.metricsRevealed = 'true';
      if (motionPaused() || document.documentElement.dataset.motion === 'off') continue;
      for (const icon of strip.querySelectorAll('.project-metric-icon')) {
        animateFeedback(icon, [{clipPath:'inset(0 100% 0 0)'}, {clipPath:'inset(0 0 0 0)'}], 500);
      }
      for (const value of strip.querySelectorAll('dd > span')) {
        animateFeedback(value, [{opacity:.6,filter:'blur(2px)'}, {opacity:1,filter:'blur(0)'}], 500);
      }
    }
  }, {threshold:.6});
  projectMetrics.forEach(strip => metricsObserver.observe(strip));
}

// Preserve the marquee's position while it is offscreen or the tab is hidden.
for (const reel of document.querySelectorAll('.employer-reel')) {
  const track=reel.querySelector('.employer-reel-track');
  let visible=false;
  const sync=()=>{track.style.animationPlayState=visible&&!document.hidden&&!motionPaused()?'running':'paused';};
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();});
  observer.observe(reel);
  document.addEventListener('visibilitychange',sync);
  document.addEventListener('portfolio:motionchange',sync);
  sync();
}

// The requested slow frame glow is separate from the finite product previews.
// The current-role pulse only runs while its row is visible and motion is allowed.
const currentExperience = document.querySelector('.experience-current');
if (currentExperience) {
  let visible = false;
  const sync = () => currentExperience.classList.toggle('is-current-visible', visible && !document.hidden && !motionPaused());
  new IntersectionObserver(([entry]) => {visible = entry.isIntersecting; sync();}).observe(currentExperience);
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('portfolio:motionchange', sync);
}

const rim = document.querySelector('.glass-hero-product');
if (rim) {
  let rimVisible = false;
  const syncRim = () => rim.classList.toggle('is-rim-visible', rimVisible && !document.hidden && !motionPaused());
  new IntersectionObserver(([entry]) => {rimVisible = entry.isIntersecting; syncRim();}).observe(rim);
  document.addEventListener('visibilitychange', syncRim);
  document.addEventListener('portfolio:motionchange', syncRim);
}


// Detailed concept tabs keep their native roles and keyboard logic, sharing the
// landing's one-pass feedback when their existing selected state actually changes.
for(const control of document.querySelectorAll('.concept-shell [data-preview-choice]')) {
  const selected=()=>control.getAttribute('aria-selected')==='true';
  if(control.classList.contains('lean-program')) {
    const check=document.createElement('span');check.className='selection-check';check.setAttribute('aria-hidden','true');
    check.innerHTML='<svg class="ui-icon" viewBox="0 0 24 24" focusable="false"><use href="images/interface-icons.svg#check"/></svg>';
    control.append(check);
  }
  new MutationObserver(records=>{
    if(!selected()){stopSelectionEffect(control);return;}
    if(records.some(record=>record.oldValue!=='true'))flashProgramSelection(control,selected);
  }).observe(control,{attributes:true,attributeOldValue:true,attributeFilter:['aria-selected']});
}
for(const tile of document.querySelectorAll('.concept-shell .program-tile')) {
  const summary=tile.querySelector(':scope > summary');
  if(!summary)continue;
  tile.addEventListener('toggle',()=>{
    if(tile.open)flashProgramSelection(summary,()=>tile.open);
    else stopSelectionEffect(summary);
  });
}

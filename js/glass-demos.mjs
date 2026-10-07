import { stackDiscounts } from "./calculations.mjs";
import { motionPaused } from "./kinetics.mjs";

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
const ease = "cubic-bezier(.16,1,.3,1)";

function settlePhase(element) {
  if (motionPaused() || document.hidden) return;
  const box = element.getBoundingClientRect();
  if (box.bottom <= 0 || box.top >= innerHeight) return;
  element.animate(
    [
      { opacity: 0.65, transform: "translateX(6px)", filter: "blur(1.5px)" },
      { opacity: 1, transform: "translateX(0)", filter: "blur(0)" },
    ],
    { duration: 400, easing: ease },
  );
}

// A reveal plays once, then settles. Offscreen, hidden and focus holds retain
// its clock; actual activation/editing preserves the visitor's own example.
function register(element, duration, phases, delay = 0) {
  const host = element.closest(".glass-feature,.glass-hero-product") || element;
  const state = {
    element,
    host,
    target: element.querySelector(".hero-programs,.mini-window") || element,
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
  const clock = () =>
    state.elapsed + (state.running ? performance.now() - state.started : 0);
  const freeze = () => {
    if (state.running) state.elapsed = clock();
    state.running = false;
    clearTimeout(state.timer);
    element.classList.remove("is-demo-playing");
    element
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
    const focused =
      element.contains(document.activeElement) &&
      document.activeElement.matches(
        ":is(" + controlSelector + "):focus-visible",
      );
    const allowed =
      state.visible &&
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
    const control = event.target.closest(controlSelector);
    if (!control || !element.contains(control)) return;
    if (event.type === "click" && !control.matches("button")) return;
    state.manual = true;
    state.sync();
    element
      .querySelector("[data-mini-net]")
      ?.setAttribute("aria-live", "polite");
  };
  element.addEventListener("click", takeControl);
  element.addEventListener("input", takeControl);
  element.addEventListener("change", takeControl);
  element.addEventListener("focusin", state.sync);
  element.addEventListener("focusout", () => queueMicrotask(state.sync));
  controllers.push(state);
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
  register(hero, 4500, [
    { at: 0, run: () => select(0) },
    { at: 1100, run: () => select(1) },
    { at: 2400, run: () => select(2) },
    { at: 3500, run: () => select(0) },
  ]);
}

const growth = document.querySelector("[data-mini-growth]");
if (growth) {
  const buttons = [...growth.querySelectorAll("[data-mini-program]")];
  const filter = growth.querySelector("[data-mini-filter]");
  const descriptions = [
    "Property sets a discount. Agoda adds a deal badge and amplifies its reach.",
    "Choose an audience and budget. Pay only when a booking lands, with no lock-in.",
    "Share wholesale rates across airlines, banks, loyalty apps and OTAs.",
  ];
  const facts = [
    ['Promotions','Set a flexible discount','Deal badge and marketing reach'],
    ['Boost Rank','Choose an audience and budget','Search visibility; pay when a booking lands'],
    ['Maximum Gain','Share wholesale rates','Airlines, banks, loyalty apps and OTAs'],
  ];
  const select = (index) => {
    selectProgram(buttons, index);
    growth.querySelector("[data-mini-program-detail]").textContent =
      descriptions[index];
    growth.querySelector('[data-mini-program-name]').textContent=facts[index][0];
    const list=growth.querySelector('[data-mini-program-facts]');list.replaceChildren();
    [['Partner action',facts[index][1]],['Agoda support',facts[index][2]]].forEach(([label,value])=>{
      const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);list.append(row);
    });
  };
  const show = (filtered, index) => {
    filter.setAttribute("aria-pressed", String(filtered));
    growth.querySelector('.mini-window-bar > span:last-child').textContent=filtered?'1 matching program':'3 of 8 examples';
    filter.querySelector("span").textContent = filtered
      ? "Show all sample programs"
      : "Show visibility programs";
    buttons.forEach((button, i) => (button.hidden = filtered && i !== 1));
    select(index);
  };
  buttons.forEach((button, i) => {
    button.disabled = false;
    button.addEventListener("click", () => select(i));
  });
  filter.disabled = false;
  filter.setAttribute("aria-pressed", "false");
  filter.addEventListener("click", () => {
    const active = filter.getAttribute("aria-pressed") !== "true";
    show(active, active ? 1 : 0);
  });
  register(growth.closest("[data-glass-demo]"), 4500, [
    { at: 0, run: () => show(false, 0) },
    { at: 1100, run: () => show(true, 1) },
    { at: 2400, run: () => show(false, 2) },
    { at: 3500, run: () => show(false, 0) },
  ]);
}

for (const receipt of document.querySelectorAll('[data-receipt]')) {
  const input=receipt.querySelector('[data-receipt-rate]');
  const promos=[...receipt.querySelectorAll('[data-receipt-promo]')];
  const rows=[...receipt.querySelectorAll('[data-receipt-row]')];
  const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
  const update=()=>{
    const start=input.valueAsNumber;
    const valid=input.validity.valid&&Number.isFinite(start);
    input.setAttribute('aria-invalid',String(!valid));
    receipt.querySelector('.receipt-error').textContent=valid?'':'Enter a rate from $0 to $1,000,000, with up to two decimal places.';
    if(!valid){
      receipt.querySelector('[data-receipt-net]').textContent='—';
      receipt.querySelector('[data-receipt-savings]').textContent='Result unavailable';
      rows.forEach(row=>{row.querySelector('[data-receipt-cut]').textContent='—';row.querySelector('[data-receipt-detail]').textContent='Check the starting rate';});return;
    }
    let balance=start;
    promos.forEach((toggle,i)=>{
      const percent=Number(toggle.dataset.receiptPromo),before=balance;
      const result=stackDiscounts(before,toggle.checked?[percent]:[]);
      balance=result.net;
      rows[i].classList.toggle('is-receipt-inactive',!toggle.checked);
      rows[i].querySelector('[data-receipt-cut]').textContent=toggle.checked?'−'+money(result.cuts[0]):'—';
      rows[i].querySelector('[data-receipt-detail]').textContent=toggle.checked?`${percent}% of ${money(before)} · Remaining ${money(balance)}`:'Not applied · Balance unchanged';
    });
    const total=stackDiscounts(start,promos.filter(x=>x.checked).map(x=>Number(x.dataset.receiptPromo)));
    receipt.querySelector('[data-receipt-net]').textContent=money(total.net);
    receipt.querySelector('[data-receipt-savings]').textContent=`You save ${money(start-total.net)} · ${total.effective}% effective discount`;
  };
  [input,...promos].forEach(control=>{control.disabled=false;control.addEventListener('input',()=>{receipt.querySelector('[data-receipt-net]').setAttribute('aria-live','polite');update();});});
  update();
  const example=count=>{
    promos.forEach((toggle,i)=>toggle.checked=i<count);update();
    if(count>0&&!motionPaused()&&!document.hidden) rows[count-1].animate(
      [{backgroundColor:'rgba(156,221,176,.12)'},{backgroundColor:'rgba(156,221,176,0)'}],
      {duration:240,easing:ease}
    );
  };
  register(receipt.closest('[data-glass-demo]')||receipt,4350,[
    {at:0,run:()=>example(0)},
    {at:900,run:()=>example(1)},
    {at:1950,run:()=>example(2)},
    {at:3100,run:()=>example(3)},
  ],150);
}

const deploy = document.querySelector("[data-mini-deploy]");
if (deploy) {
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
    if (renderedStep >= 0 && renderedStep !== step) settlePhase(detail);
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
    4200,
    [
      { at: 0, run: () => show(0) },
      { at: 1300, run: () => show(1) },
      { at: 2800, run: () => show(2) },
    ],
    300,
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
    4050,
    [
      { at: 0, run: () => select(0) },
      { at: 1000, run: () => select(1) },
      { at: 2500, run: () => select(2) },
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
const scenes = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const state = controllers.find((item) => item.target === entry.target);
      if (state) {
        state.visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        state.sync();
      }
    }
  },
  { threshold: 0.5 },
);
controllers.forEach((state) => scenes.observe(state.target));
document.addEventListener("portfolio:motionchange", syncMotion);
document.addEventListener("visibilitychange", syncMotion);

// One opening sequence, then four product siblings. Failed scripts leave every
// element visible; pause/reduced motion settle immediately to the final UI.
const entered = new WeakSet();
const entrances = [
  ...document.querySelectorAll("[data-glass-enter],[data-glass-demo]"),
];
const enter = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting || entered.has(entry.target)) continue;
      entered.add(entry.target);
      enter.unobserve(entry.target);
      if (motionPaused() || document.hidden) continue;
      const index = entrances.indexOf(entry.target);
      const animation = entry.target.animate(
        [
          { opacity: 0, transform: "translateY(28px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 650, delay: Math.min((index % 2) * 70, 70), easing: ease, fill: "backwards" },
      );
      arrivals.add(animation);
      animation.finished
        .catch(() => {})
        .finally(() => arrivals.delete(animation));
    }
  },
  { threshold: 0.12 },
);
entrances.forEach((element) => enter.observe(element));

// The capsule keeps its size. Only its visual focus/active marker travels.
const header = document.querySelector(".site-nav"),
  nav = header?.querySelector("nav");
if (nav) {
  const links = [...nav.querySelectorAll("a")],
    indicator = document.createElement("span");
  indicator.className = "nav-motion-indicator";
  indicator.setAttribute("aria-hidden", "true");
  indicator.hidden = true;
  nav.prepend(indicator);
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
  const contact = header
    .querySelector(":scope > .nav-contact")
    ?.cloneNode(true);
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
    if (open && !motionPaused()) {
      const animation = nav.animate(
        [
          { opacity: 0.65, transform: "translateY(-6px)", filter: "blur(2px)" },
          { opacity: 1, transform: "translateY(0)", filter: "blur(0)" },
        ],
        { duration: 250, easing: ease },
      );
      arrivals.add(animation);
      animation.finished
        .catch(() => {})
        .finally(() => arrivals.delete(animation));
    }
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
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (!header.contains(event.target)) setMenu(false);
    },
    { passive: true },
  );
  compact.addEventListener("change", () => setMenu(false));
  setMenu(false);
  let pointed = null;
  const position = () => {
    const focused = links.includes(document.activeElement)
      ? document.activeElement
      : null;
    const selected =
      focused ||
      pointed ||
      links.find((link) => link.hasAttribute("aria-current"));
    if (!selected) {
      indicator.style.opacity = "0";
      return;
    }
    const box = selected.getBoundingClientRect(),
      parent = nav.getBoundingClientRect();
    indicator.hidden = false;
    indicator.style.opacity = "1";
    indicator.style.width = box.width + "px";
    indicator.style.transform =
      "translateX(" + (box.left - parent.left) + "px)";
  };
  links.forEach((link) => {
    link.addEventListener("pointerenter", () => {
      pointed = link;
      position();
    });
    link.addEventListener("focus", position);
    link.addEventListener("blur", () => requestAnimationFrame(position));
  });
  nav.addEventListener("pointerleave", () => {
    pointed = null;
    position();
  });
  let navFrame=0;
  const scroll = () => {
    navFrame=0;
    header.classList.toggle("nav-is-scrolled", scrollY > 24);
    syncCurrent();
  };
  addEventListener("scroll", () => {if(!navFrame)navFrame=requestAnimationFrame(scroll);}, { passive: true });
  addEventListener("resize", position, { passive: true });
  new ResizeObserver(position).observe(nav);
  const home = location.pathname.endsWith("/") || /\/index(?:\.html)?$/.test(location.pathname);
  const about = home ? document.querySelector('#about') : null;
  const syncCurrent = () => {
    if (home)
      links.forEach((link) => {
        const bounds=about?.getBoundingClientRect();
        if (new URL(link.href).hash === "#about" && bounds && bounds.top < innerHeight*.5 && bounds.bottom > 112)
          link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    position();
  };
  const restoreNavigation = () => {
    setMenu(false);
    syncCurrent();
    requestAnimationFrame(scroll);
  };
  addEventListener("hashchange", restoreNavigation);
  addEventListener("popstate", restoreNavigation);
  addEventListener("pageshow", restoreNavigation);
  document.fonts.ready.then(syncCurrent);
  syncCurrent();
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

// The requested slow frame glow is separate from the finite product previews.
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

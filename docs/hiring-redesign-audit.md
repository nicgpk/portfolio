# Hiring portfolio redesign audit

Baseline: `9cd719f1b2480bcd48ac3b6317a285079d3e5050` (main). Review branch: `codex/portfolio-hiring-redesign`.

## Existing evidence and constraints

The site is static HTML/CSS/JavaScript with no application build step. Six primary pages share IBM Plex, a `>` identity, olive accent, light/dark themes, and persistent About / Projects / Resume navigation. `partner-programs.html` is a redirect. Canonical URLs, structured data, contact details, resume download, verification file, robots and sitemap remain in place. No repository AGENTS.md or checkout skill files were found. PRODUCT.md and existing playbook design specifications were read.

The original home placed a long experience and process sequence before its project index. Its animated headline could conceal essential information. Listing pages used reconstructed miniature product UI; originals existed but were not prominently used. Several `project_*` images are decorative stock photographs, not product evidence.

## Content ledger

| Project | Evidence retained | Prominent source assets | Limits |
| --- | --- | --- | --- |
| Partner Growth Programs | Eight programs; ownership across 5+ business owners; four co-owned tenets; seven patterns; MVP Q1 2026; 12% activating within 24 hours | `images/detail_partner_overview.png`; source case problem/process/results | $521M+ is 2025 program portfolio revenue. It does not establish incremental revenue from the 2026 hub. 12% is an absolute activation figure, not a lift. |
| Discounting | Senior Product Designer; 12 partner tests; feature flags; support-ticket iteration; 3% handle time reduction; 1.5 years refinement | `images/detail_discounting.png`; source case problem/process/results | Homepage activation lift lacked case-study support. Complaint ranking conflicted (#1 versus Top 3). These are not amplified in the new summaries. |
| Developer Portal | First designer in DevOps; 15+ interviews; 47 usability issues; phased delivery; service creation 2 days to 6m 8s; SUS 61.9 to 68.8; deployment ease 4.4/5 | `images/dev_ideation+landing.png`; original research and annotated workflow images | No invented percent improvement. Existing research does not specify a complete measurement methodology. |

The resume's eight-pattern claim conflicts with the Partner case's seven. Preserve the resume as supplied; record this unresolved factual discrepancy for the owner. The listing-only 82% usefulness claim is omitted from the new summaries. Program revenues are not summed or represented as mutually exclusive components. Interactive reconstructions carry an explicit sample-data label. Illustrative discount arithmetic was corrected: 10% of $150 is $15, leaving $135.

## Reference research

Reviewed current portfolio references for immediate identity, artifact scale, and concrete project context: [Alex Cornell](https://www.alexcornell.com/), [Tobias van Schneider](https://vanschneider.com/), and [Pablo Stanley](https://www.pablostanley.com/). The independent source audit supplied these verified references. [Femke](https://femke.design/) was also read for emphasis on strategic influence; its current site is education-focused rather than a case-study portfolio. No reference assets or layouts were copied.

## Current direction contract

The user explicitly superseded editorial restraint with a modern, minimal glass UI redesign. Experience mode for recruiter scanning and hiring-team evidence. Native CSS retains IBM Plex and the supplied identity; no framework migration. Wide display type, floating frosted navigation, cool neutral depth and original large-scale artifacts replace the initial split-hero visual system. Glass frames source evidence; it never overlays screenshot content. Default and reduced-transparency fills are solid.

The opening uses the existing Developer Portal catalog (images/dev_ideation+catalog+screen.png), with400/700/1000px lossless WebP derivatives. The Partner overview remains the first feature; Discounting and Developer Portal have distinct lighter and darker compositions. Case facts and results remain visible. Native disclosures retain dense research, program details and reconstructed product examples, with no-JavaScript and keyboard access. No original source asset is removed.

Visual variance7, motion intensity2, density3. Priority artwork stays still; color feedback supports control interaction. Original artifacts have varying resolution, so case hero links expose full-size source files.

## Verification scope

Review artifacts and machine-readable results live in `review/`. Browser checks cover six pages at 390px and 1440px in light/dark and reduced motion. Tests also exercise no-JavaScript navigation, skip navigation, theme state, and pattern-dialog keyboard closing. HTML validation permits incumbent inline styling, slashless void tags, and SVG conventions while enforcing document structure, names, labels, and unique landmarks. Automated axe checks do not constitute a full manual WCAG certification. Lighthouse measurements are local lab results, not production Core Web Vitals.

No production publication or main merge is authorized or performed.
## Updated project concepts and motion — October 2, 2026

The user's latest pinned reference is Tobias van Schneider (https://vanschneider.com): oversized expressive type and independently composed project canvases. This is a direction reference, not a source of copied imagery, branding, text, or layouts. Nicholas's supported identity and narrative remain intact. Minimal glass stays in the navigation; the work receives generous green, lavender, and midnight canvases.

Project concepts are explicitly labeled new visual explorations, not shipped outcomes. The original project image links and case artifacts stay accessible. No metrics, AI features, additional commercial actions, projects, or ownership claims were introduced. Partner discovery uses eight existing program descriptions, developer catalog uses existing illustrative component content, and discount simulation uses the source's sequential $150 → $127.50 → $114.75 example. Controls operate locally only.

Primary operating references: Shopify Growth organization (https://changelog.shopify.com/posts/the-marketing-tab-is-now-the-growth-tab and https://www.shopify.com/blog/analytics-spring-2026); Stripe invoice editor control/result separation (https://docs.stripe.com/invoicing/dashboard); Vercel deployment identity/structure (https://vercel.com/docs/deployments/managing-deployments). These are design inferences from official sources. No reference product assets are shipped.

Motion plan: one native-scroll authored arrival on the lead project canvas (650ms, already visible); local feedback immediately updates values and then emphasizes the result (220ms); developer panels settle after direct input (300ms), with previous animations canceled on repeated input. Essential headings and hero content never wait for animation. No scroll hijacking, autoplay, or animated numeric counting. Reduced motion disables effects, including when changed during the session. References: Apple HIG Motion (https://developer.apple.com/design/human-interface-guidelines/motion), Apple reduced-motion evaluation (https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria/), and Rauno Freiberg's interaction design observations (https://rauno.me/craft/interaction-design). Durations are our implementation choices, not Apple specifications.

## Owner-directed bold hero/color revision

The owner rejected the muted palette, Developer Portal hero substitution, and overly safe art direction. Partner Growth Programs is restored as the hero, with a focused three-program composition distinct from the selected-work catalog. Original project design remains linked. No project facts or ownership changed.

Fresh browser inspection of https://vanschneider.com shows a stark black/white opening and decisive red accent, rather than pastel frames. The revised interpretation uses a black opening, oversized white identity, red Partner field, violet pricing field and blue developer field, with large project typography and asymmetric operating surfaces. No reference assets, branding, textures, or layouts are imported. Private reference captures are outside the repository.

Motion is now a single 780ms lateral-to-rest operating-surface arrival inside the lead project canvas. It expresses the relationship between the project title and its interface. Essential text and surfaces stay visible by default, controls interrupt the animation immediately, and live reduced motion cancels it. Other local feedback is unchanged. Before/after evidence preserves abf55fd in review/color-revision/before-*.png.

## Evidence cards, interface craft, navigation and scroll storytelling

The owner requested one colored metrics card per selected project, distinct Partner selected work, more refined interface concepts and stronger glass navigation. Existing evidence/context text is grouped without rewriting metric claims: launch and qualified portfolio scale, handle-time change over its stated period, service-creation time and SUS. Partner selected work now explores existing Promotions mechanics/types; the hero remains program discovery. Pricing adds the existing intermediate calculation; Developer catalog and configuration have explicit column/field hierarchy. No commercial actions or new functionality claims.

Motion thesis: natural scrolling links each project title to a distinct operating detail. Partner responsibilities enter laterally, pricing calculation arrives from its controls, and deployment details settle within anchored identity. Decorative oversized titles follow bounded scroll progress with different directions. Once-only operating reveals are already visible; focus/pointer input interrupts them. Reduced motion restores static composition. Scroll handlers are passive, requestAnimationFrame is scheduled only on changes, and offscreen scenes are excluded. No looping, wheel interception or scroll repositioning. Header blur is confined to a compact fixed navigation layer; opaque control surfaces preserve contrast over changing backgrounds, with a solid reduced-transparency fallback.

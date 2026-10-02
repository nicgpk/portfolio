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

## Direction contract

Experience mode. Audience: recruiters scanning quickly and design teams evaluating ownership and judgment. Seven considered systems: project monograph, exhibition catalog, typographic design journal, annotated systems atlas, editorial product dossier, process storyboard, and comparative design review. The Impeccable concept seed assigned candidate five (key `3b82474a`): editorial product dossier. The downloaded engine worked from a workspace cache after the default cache failed. Its unrelated sculpture/alphabet/rail challengers were declined for weaker recruiter identification and product clarity; retain their discipline of purposeful sequencing, typographic commitment, and clear navigation without importing their visual motifs.

Visual variance 7, motion intensity 3, density 3. Native CSS with retained IBM Plex; no framework migration. First viewport: immediate name and role beside a large original program artifact, with work and resume actions. Visitor path: selected work, experience, working principles, archive, contact. Case studies: original artifact, ownership / choice / evidence summary, existing detailed process and product examples, qualified results. Signature interaction: modest image magnification on hover and one immediately-visible artifact entrance, both respecting reduced motion. Risk: original artifacts have varying age/resolution; precise screenshot text requires opening the original image.

## Verification scope

Review artifacts and machine-readable results live in `review/`. Browser checks cover six pages at 390px and 1440px in light/dark and reduced motion. Tests also exercise no-JavaScript navigation, skip navigation, theme state, and pattern-dialog keyboard closing. HTML validation permits incumbent inline styling, slashless void tags, and SVG conventions while enforcing document structure, names, labels, and unique landmarks. Automated axe checks do not constitute a full manual WCAG certification. Lighthouse measurements are local lab results, not production Core Web Vitals.

No production publication or main merge is authorized or performed.

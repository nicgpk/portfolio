# Cleaner interfaces and evidence signatures

The homepage and Work gallery no longer repeat a concept caption beneath each preview. Individual cases use concise workflow headings, and the interface chrome omits repeated redesign/source labels and the long concept explanation. Functional boundaries remain where useful: the calculator does not save setup and Developer Portal previews a deployment without connecting to infrastructure. Original artifacts and factual metric context stay accessible.

Each project's evidence panel has a decorative orange Lucide signature: layers for Partner Growth Programs, percent for Discounting and code brackets for Developer Portal. The same signature appears on the homepage, Work and its individual case. The 24px icon sits in a 40px frame; the evidence surface remains neutral gray. No animated numbers or implied new outcomes are introduced.

Icons run two gentle 2.8-second cycles when visible. The layers lift slightly, percent tilts and code brackets shift horizontally; a thin surrounding ring contracts subtly. CSS animates only transforms and opacity. Offscreen/hidden-document icons pause, the global pause control freezes/resumes them, reduced motion disables animation, and no JavaScript leaves a static icon. No animation frame loop or runtime dependency is added.

`scripts/evidence_design.py`, `css/evidence-motion.css` and `js/evidence-motion.mjs` provide the shared implementation. Caption removal also removes the extra gallery grid row. Factual source comparisons explicitly normalize only the removed presentation labels and revised attribution wording; values, metric labels, study context, workflows and links remain audited.

`review/evidence-motion/checks.json` covers 20 page/viewport layouts, metadata removal, orange icons, equal card heights, visible animation, bounded cycles, pause/resume, offscreen behavior, reduced motion and no JavaScript. Before/after evidence captures at 390/1440px use committed `18e5018` as the baseline. Broader route, source-content and gallery reviews remain separate. Real devices, screen-reader sessions and production performance remain unverified.

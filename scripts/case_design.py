"""Decorative case diagrams drawn from the existing project content."""
from math import cos, sin, pi


def case_diagram(kind):
    if kind == 'growth':
        symbols = ['promotion', 'growth', 'boost', 'prepaid', 'distribution', 'placement', 'rates', 'storefront']
        paths, nodes = [], []
        for i, symbol in enumerate(symbols):
            angle = -pi / 2 + i * pi / 4
            x, y = 240 + 155 * cos(angle), 180 + 124 * sin(angle)
            paths.append(f'<path d="M240 180 L{x:.1f} {y:.1f}"/>')
            nodes.append(f'<g class="hub-node {"is-highlighted" if i == 0 else ""}" transform="translate({x:.1f} {y:.1f})"><circle r="27"/><use href="images/program-symbols.svg#{symbol}" x="-16" y="-16" width="32" height="32"/></g>')
        graphic = f'''<svg class="hub-map" viewBox="0 0 480 360"><g class="hub-paths">{''.join(paths)}</g><ellipse class="hub-orbit" cx="240" cy="180" rx="155" ry="124"/>{''.join(nodes)}<g class="hub-center"><circle cx="240" cy="180" r="51"/><path d="M220 185v-20h40v20m-36 10h32m-16-30v30m-20-10h40"/><text x="240" y="218" text-anchor="middle">One hub</text></g></svg><p class="diagram-caption"><span>8 existing programs</span><span>One partner experience</span></p>'''
    elif kind == 'discount':
        graphic = '''<div class="diagram-rate"><div class="diagram-rate-row"><span>Starting room rate</span><strong>$150.00</strong><i style="--balance:100%"></i></div><div class="diagram-rate-row"><span>Mega Sale <b>15%</b></span><strong>$127.50</strong><i style="--balance:85%"></i></div><div class="diagram-rate-row is-final"><span>Mobile Exclusive <b>10%</b></span><strong>$114.75</strong><i style="--balance:76.5%"></i></div><p>150 × 0.85 × 0.90 = 114.75</p></div><p class="diagram-caption"><span>Illustrative calculation</span><span>Before commission &amp; taxes</span></p>'''
    else:
        graphic = '''<div class="diagram-workflow"><div><span class="workflow-node" aria-hidden="true">⌘</span><p><small>Environment</small><strong>staging-mesh</strong><span>24 cores · 24 Gi</span></p></div><div><span class="workflow-node" aria-hidden="true">↗</span><p><small>Rollout</small><strong>Canary</strong><span>10% → 20% → 30%</span></p></div><div><span class="workflow-node is-highlighted" aria-hidden="true">✓</span><p><small>Review</small><strong>See the whole decision</strong><span>Hong Kong · Singapore · Amsterdam</span></p></div></div><p class="diagram-caption"><span>Deployment workflow</span><span>Canary rollout</span></p>'''
    return f'<div class="case-diagram case-diagram--{kind}" aria-hidden="true">{graphic}</div>'

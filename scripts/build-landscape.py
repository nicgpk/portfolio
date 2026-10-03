"""Build an original, small vector pixel landscape. No raster dependencies."""
from pathlib import Path
from math import sin, exp
import random

rng=random.Random(27)
paths={color:[] for color in ['#111919','#ff510a','#f6ba48','#29b6e7','#6acaa3','#b6cee0']}
for x in range(0,1200,4):
    surface=246-120*exp(-((x-165)/120)**2)-185*exp(-((x-995)/170)**2)-38*sin(x/67)**2
    for y in range(40,301,4):
        if y<surface or rng.random() < .18 + max(0,y-265)/55:
            continue
        texture=sin(x*.062+y*.041)+sin(x*.022-y*.076)+rng.random()*.9
        if y>surface+100 and rng.random()<.5: color='#b6cee0'
        elif texture>1.65: color='#29b6e7'
        elif texture>1: color='#6acaa3'
        elif texture>.45: color='#f6ba48'
        elif texture>-.35: color='#ff510a'
        else: color='#111919'
        size=3 if rng.random()<.8 else 2
        paths[color].append(f'M{x} {y}h{size}v{size}h-{size}z')
svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" fill="none"><title>Original pixel landscape for Partner Growth Programs</title>'
svg+=''.join(f'<path fill="{color}" d="{"".join(points)}"/>' for color,points in paths.items())
svg+='</svg>'
(Path(__file__).resolve().parent.parent/'images/program-landscape.svg').write_text(svg,encoding='utf-8')

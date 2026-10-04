"""Decorative, locally hosted Lucide icons for existing controls and links."""
import re

GLYPHS = {'↗': 'arrow-up-right', '→': 'arrow-right', '←': 'arrow-left', '↓': 'arrow-down', '✓': 'check', '⌘': 'code-xml', '%': 'percent', '↺': 'refresh-cw'}

def icon(name, extra_class=''):
    return f'<svg class="ui-icon {extra_class}" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="images/interface-icons.svg#{name}"/></svg>'

def standardize_icons(body):
    # Existing hidden glyphs keep their surrounding layout and accessibility semantics.
    body = re.sub(r'(<span\b[^>]*aria-hidden="true"[^>]*>)([↗→←↓✓⌘%↺])(</span>)', lambda m: m[1] + icon(GLYPHS[m[2]]) + m[3], body)
    def action(match):
        parts = re.split(r'(<[^>]+>)', match[0])
        for i in range(0, len(parts), 2):
            parts[i] = re.sub(r'[↗→←↓]', lambda m: icon(GLYPHS[m[0]]), parts[i])
        return ''.join(parts)
    body = re.sub(r'<a\b[^>]*>.*?</a>|<button\b[^>]*>.*?</button>', action, body, flags=re.S)
    # Replace the existing search and disclosure paths with the same family.
    for wrapper, name in [('lean-search', 'search'), ('growth-input-wrap', 'search'), ('growth-empty', 'search'), ('program-open-label', 'chevron-down')]:
        body = re.sub(r'(<(?:div|label|span)\b[^>]*class="' + wrapper + r'"[^>]*>.*?)<svg\b[^>]*>.*?</svg>', lambda m: m[1] + icon(name), body, flags=re.S)
    # A shrinkable label keeps long email addresses readable beside the fixed icon frame.
    body = re.sub(r'(<a\b[^>]*class="footer-email"[^>]*>)([^<]+)', lambda m: m[1] + '<span class="ui-link-label">' + m[2] + '</span>', body)
    return body

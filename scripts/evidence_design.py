"""Small decorative signatures for each project's evidence panel."""
from interface_icons import icon

def evidence_icon(kind):
    name = {'growth': 'layers', 'discount': 'percent', 'dev': 'code-xml'}[kind]
    return f'<span class="evidence-icon evidence-icon--{kind}" data-evidence-icon aria-hidden="true">{icon(name)}<span class="evidence-icon-orbit"></span></span>'

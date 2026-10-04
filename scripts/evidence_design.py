"""One measurement symbol for every project's evidence panel."""

def evidence_icon(kind):
    paths = '<path d="M5 5v22h22M11 21v-7M18 21V8M25 21v-10"/>'
    return f'<span class="evidence-icon evidence-icon--{kind}" data-evidence-icon aria-hidden="true"><svg class="ui-icon evidence-linework" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{paths}</svg></span>'

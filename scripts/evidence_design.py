"""Small decorative signatures for each project's evidence panel."""

def evidence_icon(kind):
    paths = {
      'growth': '<path d="M5 7h6v6H5zM21 5h6v6h-6zM20 23h6v6h-6zM16 16l-5-6m5 6 8-8m-8 8 7 10"/><circle cx="16" cy="16" r="3"/>',
      'discount': '<path d="M3 7h9v6h8v6h9M3 25h9M12 25h8M20 25h9"/>',
      'dev': '<path d="M3 16h6m4 0h6m4 0h6m-21-3 3 3-3 3m12-6 3 3-3 3"/><circle cx="5" cy="16" r="2"/><circle cx="16" cy="16" r="2"/><circle cx="27" cy="16" r="2"/>'
    }[kind]
    return f'<span class="evidence-icon evidence-icon--{kind}" data-evidence-icon aria-hidden="true"><svg class="ui-icon evidence-linework" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{paths}</svg></span>'

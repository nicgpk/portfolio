// Read declaration values without treating selectors, strings, comments, URLs,
// or delimiters inside functions as CSS declarations. No CSS rewriting happens here.
export function declarations(css) {
  const result = [];
  const blocks = [];
  let start = 0, quote = '', comment = false, depth = 0;
  function declaration(end) {
    if (!blocks.length) return;
    const segment = css.slice(start, end);
    const clean = segment.replace(/\/\*[\s\S]*?\*\//g, match => ' '.repeat(match.length));
    const match = clean.match(/^\s*([\w-]+)\s*:\s*/);
    if (!match) return;
    const valueStart = start + match[0].length;
    result.push({property: match[1], value: css.slice(valueStart, end), start: valueStart, end,
      selector: blocks.at(-1), context: [...blocks], line: css.slice(0, valueStart).split('\n').length});
  }
  for (let i = 0; i < css.length; i++) {
    const char = css[i], next = css[i + 1];
    if (comment) { if (char === '*' && next === '/') { comment = false; i++; } continue; }
    if (quote) { if (char === '\\') i++; else if (char === quote) quote = ''; continue; }
    if (char === '/' && next === '*') { comment = true; i++; continue; }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === '(' || char === '[') depth++;
    else if (char === ')' || char === ']') { if (--depth < 0) throw new Error('Unbalanced CSS syntax'); }
    else if (!depth && char === '{') {
      blocks.push(css.slice(start, i).replace(/\/\*[\s\S]*?\*\//g, '').trim());
      start = i + 1;
    } else if (!depth && char === ';') { declaration(i); start = i + 1; }
    else if (!depth && char === '}') { if (!blocks.length) throw new Error('Unbalanced CSS syntax'); declaration(i); blocks.pop(); start = i + 1; }
  }
  if (blocks.length || quote || comment || depth) throw new Error('Unbalanced CSS syntax');
  return result;
}

// Protect asset fragments and content strings from color checks/replacements.
export function mapValue(value, transform) {
  const protectedValue = /\/\*[\s\S]*?\*\/|url\((?:[^()'"\\]|\\.|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")*\)|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/gi;
  let output = '', start = 0;
  for (const match of value.matchAll(protectedValue)) {
    output += transform(value.slice(start, match.index)) + match[0];
    start = match.index + match[0].length;
  }
  return output + transform(value.slice(start));
}

const namedColors = `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgrey darkgreen darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray grey green greenyellow honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgrey lightgreen lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`.split(' ');
export const colorLiteral = new RegExp(`#[\\da-f]{3,8}\\b|\\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\(|(?<![\\w-])(?:${namedColors.join('|')})\\b`, 'gi');

export function tokenDefinitions(css) {
  return new Map(declarations(css).filter(item => item.property.startsWith('--ds-'))
    .map(item => [item.property, item.value.trim()]));
}

// The ds namespace is global and intentionally contains no contextual values.
// Existing component-local variables remain scoped and are not resolved here.
export function resolveDesignTokens(value, tokens, chain = []) {
  return value.replace(/var\((--ds-[\w-]+)\)/g, (_, name) => {
    if (chain.includes(name)) throw new Error(`Cyclic design token: ${[...chain, name].join(' -> ')}`);
    if (!tokens.has(name)) throw new Error(`Undefined design token: ${name}`);
    return resolveDesignTokens(tokens.get(name), tokens, [...chain, name]);
  });
}

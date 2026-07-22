/**
 * Server-safe text sanitization without jsdom/DOMPurify.
 * isomorphic-dompurify blows up on Vercel serverless (jsdom ESM issues).
 * Plain-text fields only — strip tags by scanning, not nested regex.
 */

function decodeBasicEntities(input: string): string {
  return input
    .split('&lt;')
    .join('<')
    .split('&gt;')
    .join('>')
    .split('&quot;')
    .join('"')
    .split('&#39;')
    .join("'")
    .split('&amp;')
    .join('&');
}

function tagNameAt(html: string, openAngle: number): string {
  let i = openAngle + 1;
  if (html[i] === '/') i += 1;
  const start = i;
  while (i < html.length) {
    const ch = html[i];
    if (ch === '>' || ch === '/' || /\s/.test(ch)) break;
    i += 1;
  }
  return html.slice(start, i).toLowerCase();
}

function findClosingTag(html: string, from: number, name: string): number {
  const needle = `</${name}>`;
  const lower = html.toLowerCase();
  const idx = lower.indexOf(needle, from);
  return idx === -1 ? -1 : idx + needle.length;
}

/** Strip markup by walking the string — no ReDoS-prone tag regexes. */
function stripHtml(input: string): string {
  let out = '';
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    if (ch !== '<') {
      out += ch;
      i += 1;
      continue;
    }

    const gt = input.indexOf('>', i + 1);
    if (gt === -1) {
      break;
    }

    const name = tagNameAt(input, i);
    const isClose = input[i + 1] === '/';

    if (!isClose && (name === 'script' || name === 'style')) {
      const after = findClosingTag(input, gt + 1, name);
      i = after === -1 ? input.length : after;
      continue;
    }

    i = gt + 1;
  }

  return decodeBasicEntities(out);
}

function removeAllOccurrences(input: string, token: string): string {
  let result = input;
  let prev = '';
  while (result !== prev) {
    prev = result;
    result = result.split(token).join('');
  }
  return result;
}

function stripTraversalSequences(input: string): string {
  let result = input;
  let prev = '';
  while (result !== prev) {
    prev = result;
    result = removeAllOccurrences(result, '../');
    result = removeAllOccurrences(result, '..\\');
  }
  return result;
}

function stripJndiTokens(input: string): string {
  let result = '';
  let i = 0;
  const lower = input.toLowerCase();

  while (i < input.length) {
    const start = lower.indexOf('${jndi:', i);
    if (start === -1) {
      result += input.slice(i);
      break;
    }
    result += input.slice(i, start);
    const end = input.indexOf('}', start);
    i = end === -1 ? input.length : end + 1;
  }

  return result;
}

function stripSqlNoise(input: string): string {
  let result = '';
  let i = 0;
  const lower = input.toLowerCase();

  while (i < input.length) {
    const dropIdx = lower.indexOf('drop table', i);
    const commentIdx = input.indexOf(';--', i);
    const next =
      dropIdx === -1
        ? commentIdx
        : commentIdx === -1
          ? dropIdx
          : Math.min(dropIdx, commentIdx);

    if (next === -1) {
      result += input.slice(i);
      break;
    }

    result += input.slice(i, next);

    if (next === dropIdx) {
      i = dropIdx + 'drop table'.length;
      continue;
    }

    // ";--" — drop the semicolon + dashes
    i = commentIdx + 3;
  }

  return result;
}

export function sanitizeText(input: string): string {
  return stripHtml(input).trim();
}

/**
 * Aggressive sanitization for untrusted input (XSS, injection, path traversal).
 */
export function sanitizeInput(input: string): string {
  let result = sanitizeText(input);
  result = stripTraversalSequences(result);
  result = stripJndiTokens(result);
  result = stripSqlNoise(result);
  return result;
}

export function sanitizeOptionalText(input: string | undefined): string | undefined {
  if (input === undefined) {
    return undefined;
  }

  const sanitized = sanitizeText(input);
  return sanitized.length > 0 ? sanitized : undefined;
}

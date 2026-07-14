/**
 * Server-safe HTML/text sanitization without jsdom/DOMPurify.
 * isomorphic-dompurify fails on Vercel serverless (ERR_REQUIRE_ESM via jsdom).
 * These helpers strip markup and common injection patterns for plain-text fields.
 */

function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

export function sanitizeText(input: string): string {
  return stripHtml(input).trim();
}

/**
 * Aggressive sanitization for untrusted input (XSS, injection, path traversal).
 */
export function sanitizeInput(input: string): string {
  return sanitizeText(input)
    .replace(/\.\.\//g, '')
    .replace(/\.\.\\/g, '')
    .replace(/\$\{jndi:[^}]*\}/gi, '')
    .replace(/drop\s+table/gi, '')
    .replace(/;\s*--/g, '');
}

export function sanitizeOptionalText(input: string | undefined): string | undefined {
  if (input === undefined) {
    return undefined;
  }

  const sanitized = sanitizeText(input);
  return sanitized.length > 0 ? sanitized : undefined;
}

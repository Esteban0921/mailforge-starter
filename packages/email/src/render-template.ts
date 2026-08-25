/**
 * Template rendering for campaign emails.
 *
 * Placeholders use the documented MailForge syntax: `{{variableName}}`
 * (whitespace inside the braces is tolerated). A dotted name like
 * `{{customFields.empresa}}` traverses plain nested objects (e.g. the
 * JSON blob on Subscriber.customFields) — it does not index into arrays,
 * and any missing/non-object segment along the way makes the whole
 * placeholder "unknown", same as a flat key that isn't in `data`.
 */

const TEMPLATE_VARIABLE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

/** Result of looking up a (possibly dotted) placeholder name in `data`. */
interface VariableLookup {
  found: boolean;
  value: unknown;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Resolves `name` against `data`, traversing one level per `.` segment. */
function resolveVariable(data: Record<string, unknown>, name: string): VariableLookup {
  let current: unknown = data;
  for (const segment of name.split('.')) {
    if (!isPlainObject(current) || !Object.prototype.hasOwnProperty.call(current, segment)) {
      return { found: false, value: undefined };
    }
    current = current[segment];
  }
  return { found: true, value: current };
}

/** Escapes a value for safe interpolation into an HTML document body. */
export function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export interface RenderTemplateOptions {
  /** Flat map of values available for interpolation. */
  data?: Record<string, unknown>;
  /**
   * HTML-escape interpolated values (default: true).
   * Disable only for content that is already safe, sanitized HTML.
   */
  escapeValues?: boolean;
  /** Invoked once per placeholder that has no matching entry in `data`. */
  onUnknownVariable?: (name: string) => void;
}

export class MissingTemplateVariablesError extends Error {
  readonly missingVariables: string[];

  constructor(missingVariables: string[]) {
    super(`Missing template variables: ${missingVariables.join(', ')}`);
    this.name = 'MissingTemplateVariablesError';
    this.missingVariables = missingVariables;
  }
}

/**
 * Renders `template` by replacing every `{{name}}` placeholder with the
 * corresponding entry of `data`. Unknown placeholders are removed from the
 * output (and reported via `onUnknownVariable` when provided) so a typo in
 * a template can never leak raw braces into a sent email.
 */
export function renderTemplate(template: string, options: RenderTemplateOptions = {}): string {
  const { data = {}, escapeValues = true, onUnknownVariable } = options;

  return template.replace(TEMPLATE_VARIABLE, (_match: string, name: string) => {
    const { found, value } = resolveVariable(data, name);
    if (!found) {
      onUnknownVariable?.(name);
      return '';
    }
    // A key that exists but holds null/undefined renders as empty text:
    // a missing subscriber field must never leak "null" into an email.
    if (value === null || value === undefined) {
      return '';
    }
    return escapeValues ? escapeHtml(value) : String(value);
  });
}

/**
 * Strict variant: throws {@link MissingTemplateVariablesError} if any
 * placeholder has no value. Intended for pre-send campaign validation
 * (Phase 3) where a partial render must never reach the queue.
 */
export function renderTemplateStrict(template: string, data: Record<string, unknown>): string {
  const missing = new Set<string>();
  for (const match of template.matchAll(TEMPLATE_VARIABLE)) {
    const name = match[1];
    if (!resolveVariable(data, name).found) {
      missing.add(name);
    }
  }
  if (missing.size > 0) {
    throw new MissingTemplateVariablesError([...missing].sort());
  }
  return renderTemplate(template, { data });
}

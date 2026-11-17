/**
 * Problems: what the content check says when a file is wrong.
 *
 * The owner reads these in a red check on GitHub, so every problem is ONE plain sentence that
 * names the file and the field and says what to do. Example:
 *   content/lessons/evening-wind-down/lesson.md: "level" must be gentle, steady or strong (found "easy").
 */
import type { z } from 'zod';

export type Problem = {
  /** The file, written from the top of the repository: content/lessons/<slug>/lesson.md */
  file: string;
  /** The line in that file, when we know it (Markdown problems). */
  line?: number;
  /** One plain sentence, ending with a full stop. */
  message: string;
};

/** How a problem is printed: the file, the line if known, then the sentence. */
export function formatProblem(p: Problem): string {
  return `${p.file}${p.line ? ` (line ${p.line})` : ''}: ${p.message}`;
}

/** "a, b or c" */
export function listWithOr(words: readonly unknown[]): string {
  const all = words.map(String);
  if (all.length <= 1) return all.join('');
  return `${all.slice(0, -1).join(', ')} or ${all[all.length - 1]}`;
}

/** Shows a value the way it was written, shortened if it is very long. */
function shown(value: unknown): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  const short = text.length > 60 ? `${text.slice(0, 57)}…` : text;
  return `"${short}"`;
}

/** Follows a path such as ["flow", 2, "at"] inside what was written. */
function valueAt(data: unknown, path: readonly PropertyKey[]): unknown {
  let here: unknown = data;
  for (const key of path) {
    if (here === null || typeof here !== 'object') return undefined;
    here = (here as Record<PropertyKey, unknown>)[key];
  }
  return here;
}

/** Names a field for a human: "level", "id" in "video", "at" in step 3 of "flow". */
export function fieldName(path: readonly PropertyKey[]): string {
  if (path.length === 0) return 'the file';
  const names: string[] = [];
  // Read the path from the end: the last name first, then where it sits.
  for (let i = path.length - 1; i >= 0; i--) {
    const key = path[i];
    if (typeof key === 'number') {
      const parent = String(path[i - 1] ?? 'the list');
      names.push(`item ${key + 1} of "${parent}"`);
      i--; // the parent was used
    } else {
      names.push(`"${String(key)}"`);
    }
  }
  return names.join(' in ');
}

const kinds: Record<string, string> = {
  string: 'text',
  number: 'a number',
  int: 'a whole number',
  boolean: 'true or false',
  array: 'a list',
  object: 'a group of indented lines',
};

const formats: Record<string, string> = {
  email: 'an email address',
  url: 'a full web address starting with https://',
};

/** Turns one zod issue into one plain sentence. */
function sentence(issue: z.core.$ZodIssue, data: unknown): string {
  const field = fieldName(issue.path);
  const found = valueAt(data, issue.path);
  const foundText = found === undefined ? '' : ` (found ${shown(found)})`;

  switch (issue.code) {
    case 'invalid_type':
      if (found === undefined || found === null) return `${field} is missing: add it to the lines at the top of the file.`;
      return `${field} must be ${kinds[issue.expected] ?? issue.expected}${foundText}.`;
    case 'invalid_value':
      return `${field} must be ${listWithOr(issue.values)}${foundText}.`;
    case 'invalid_union':
      // Only "video" is a choice between shapes: the provider decides.
      return `${field} must say where the video is: "provider: youtube" with its "id"${foundText}.`;
    case 'too_big': {
      const size = typeof found === 'string' || Array.isArray(found) ? found.length : undefined;
      if (issue.origin === 'string') return `${field} is too long: ${issue.maximum} characters at most (it has ${size}).`;
      if (issue.origin === 'array') return `${field} has too many items: ${issue.maximum} at most (it has ${size}).`;
      return `${field} must be ${issue.maximum} at most${foundText}.`;
    }
    case 'too_small':
      if (issue.origin === 'string') return `${field} is empty: write something, or remove the line.`;
      if (issue.origin === 'array') return `${field} needs at least ${issue.minimum} item${Number(issue.minimum) === 1 ? '' : 's'}.`;
      return `${field} must be ${issue.minimum} at least${foundText}.`;
    case 'invalid_format':
      // The schema gives its own words for its patterns ("a date like 2026-11-20").
      return `${field} must be ${formats[issue.format] ?? issue.message}${foundText}.`;
    case 'unrecognized_keys':
      return `${listWithOr(issue.keys.map((k) => `"${k}"`))} is not a line this kind of file understands: check the spelling, or remove it.`;
    default: {
      // Rules written by hand in the schema carry their own sentence.
      const text = issue.message.trim();
      const withStop = /[.!?]$/.test(text) ? text : `${text}.`;
      return withStop.charAt(0).toUpperCase() + withStop.slice(1);
    }
  }
}

/** Every problem zod found in one file, as plain sentences. */
export function problemsFromZod(file: string, error: z.ZodError, data: unknown): Problem[] {
  return error.issues.map((issue) => ({ file, message: sentence(issue, data) }));
}

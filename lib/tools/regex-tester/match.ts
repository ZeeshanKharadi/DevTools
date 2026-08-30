import { MAX_DISPLAYED_MATCHES, REGEX_FLAGS } from "./constants";
import type { RegexFlag } from "./constants";

export type RegexCapture = {
  name?: string;
  value: string;
  start: number | null;
  end: number | null;
};

export type RegexMatch = {
  value: string;
  index: number;
  end: number;
  captures: RegexCapture[];
};

export type RegexSuccess = {
  ok: true;
  matches: RegexMatch[];
  truncated: boolean;
  totalFound: number;
};

export type RegexError = {
  ok: false;
  message: string;
};

export type RegexResult = RegexSuccess | RegexError;

export type RegexRequest = {
  pattern: string;
  flags: string;
  text: string;
  maxMatches?: number;
};

export function parseFlags(raw: string): { ok: true; flags: string } | RegexError {
  const flags = raw.replace(/\s+/g, "");
  const seen = new Set<string>();

  for (const flag of flags) {
    if (!(REGEX_FLAGS as readonly string[]).includes(flag)) {
      return {
        ok: false,
        message: `Unknown flag “${flag}”. Supported JavaScript flags: ${REGEX_FLAGS.join(", ")}.`,
      };
    }

    if (seen.has(flag)) {
      return { ok: false, message: `Flag “${flag}” is duplicated.` };
    }

    seen.add(flag);
  }

  if (seen.has("u") && seen.has("v")) {
    return { ok: false, message: "Flags “u” and “v” cannot be used together." };
  }

  return { ok: true, flags };
}

export function compileRegex(pattern: string, flags: string):
  | { ok: true; regex: RegExp }
  | RegexError {
  if (pattern.length === 0) {
    return { ok: false, message: "Enter a regular expression pattern." };
  }

  const parsed = parseFlags(flags);

  if (!parsed.ok) {
    return parsed;
  }

  try {
    const flags = parsed.flags.includes("d")
      ? parsed.flags
      : `${parsed.flags}d`;

    try {
      return { ok: true, regex: new RegExp(pattern, flags) };
    } catch {
      return { ok: true, regex: new RegExp(pattern, parsed.flags) };
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.replace(/^Invalid regular expression: /, "")
        : "This pattern is not a valid JavaScript regular expression.";

    return { ok: false, message };
  }
}

function captureList(match: RegExpExecArray): RegexCapture[] {
  const captures: RegexCapture[] = [];
  const indices = match.indices;
  const named = match.groups ?? {};
  const namedByValue = new Map<string, string>();

  for (const [name, value] of Object.entries(named)) {
    if (value !== undefined) {
      namedByValue.set(value, name);
    }
  }

  for (let i = 1; i < match.length; i += 1) {
    const value = match[i];

    if (value === undefined) {
      continue;
    }

    const span = indices?.[i];
    captures.push({
      name: namedByValue.get(value),
      value,
      start: span ? span[0] : null,
      end: span ? span[1] : null,
    });
  }

  return captures;
}

export function findMatches(
  regex: RegExp,
  text: string,
  maxMatches = MAX_DISPLAYED_MATCHES,
): RegexSuccess {
  const matches: RegexMatch[] = [];
  let totalFound = 0;
  const global = regex.global || regex.sticky;
  const scanner = new RegExp(regex.source, regex.flags);

  if (!global) {
    const match = scanner.exec(text);

    if (match && match.index !== undefined) {
      totalFound = 1;
      matches.push({
        value: match[0],
        index: match.index,
        end: match.index + match[0].length,
        captures: captureList(match),
      });
    }

    return { ok: true, matches, truncated: false, totalFound };
  }

  let match = scanner.exec(text);

  while (match) {
    totalFound += 1;

    if (matches.length < maxMatches && match.index !== undefined) {
      matches.push({
        value: match[0],
        index: match.index,
        end: match.index + match[0].length,
        captures: captureList(match),
      });
    }

    if (match[0] === "") {
      scanner.lastIndex += 1;
    }

    if (totalFound > maxMatches + 1) {
      break;
    }

    match = scanner.exec(text);
  }

  return {
    ok: true,
    matches,
    truncated: totalFound > matches.length,
    totalFound,
  };
}

export function testRegex(request: RegexRequest): RegexResult {
  const compiled = compileRegex(request.pattern, request.flags);

  if (!compiled.ok) {
    return compiled;
  }

  return findMatches(
    compiled.regex,
    request.text,
    request.maxMatches ?? MAX_DISPLAYED_MATCHES,
  );
}

export function isRegexFlag(value: string): value is RegexFlag {
  return (REGEX_FLAGS as readonly string[]).includes(value);
}

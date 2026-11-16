export interface FindMatch {
  start: number;
  end: number;
}

export function findAllMatches(
  text: string,
  query: string,
  caseSensitive: boolean,
): FindMatch[] {
  if (!query) return [];

  const haystack = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive ? query : query.toLowerCase();
  const matches: FindMatch[] = [];
  let from = 0;

  while (from <= haystack.length - needle.length) {
    const index = haystack.indexOf(needle, from);
    if (index === -1) break;
    matches.push({ start: index, end: index + query.length });
    from = index + Math.max(needle.length, 1);
  }

  return matches;
}

export function stepMatchIndex(
  matchCount: number,
  current: number | null,
  direction: 1 | -1,
): number | null {
  if (matchCount === 0) return null;
  if (current === null) return direction === 1 ? 0 : matchCount - 1;
  return (current + direction + matchCount) % matchCount;
}

export function replaceMatch(
  text: string,
  match: FindMatch,
  replacement: string,
): string {
  return text.slice(0, match.start) + replacement + text.slice(match.end);
}

export function replaceAllMatches(
  text: string,
  query: string,
  replacement: string,
  caseSensitive: boolean,
): string {
  if (!query) return text;
  const matches = findAllMatches(text, query, caseSensitive);
  if (matches.length === 0) return text;

  let result = "";
  let cursor = 0;
  for (const match of matches) {
    result += text.slice(cursor, match.start) + replacement;
    cursor = match.end;
  }
  result += text.slice(cursor);
  return result;
}

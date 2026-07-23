import { CALL_TYPES_BY_ID } from "../config/callTypes";
import { OBJECTS_BY_ID } from "../config/objects";
import type { SearchSelection } from "../types/search";

function quoteTerm(term: string): string {
  const escaped = term.replaceAll('"', '\\"').trim();
  return escaped.includes(" ") ? `"${escaped}"` : escaped;
}

function uniqueTerms(terms: readonly string[]): string[] {
  return [...new Set(terms.map((term) => term.trim()).filter(Boolean))];
}

function compileOrGroup(terms: readonly string[]): string {
  const normalized = uniqueTerms(terms).map(quoteTerm);
  if (normalized.length === 0) return "";
  if (normalized.length === 1) return normalized[0];
  return `(${normalized.join(" OR ")})`;
}

export function buildSearchQuery(selection: SearchSelection): string {
  if (selection.objects.length === 0) {
    throw new Error("At least one Object of Study is required.");
  }

  const objectTerms = selection.objects.flatMap((id) => {
    const object = OBJECTS_BY_ID.get(id);
    if (!object) throw new Error(`Unknown Object of Study: ${id}`);
    return object.searchTerms;
  });

  const callTypeTerms = selection.callTypes.flatMap((id) => {
    const callType = CALL_TYPES_BY_ID.get(id);
    if (!callType) throw new Error(`Unknown call type: ${id}`);
    return callType.searchTerms;
  });

  const objectGroup = compileOrGroup(objectTerms);
  const callTypeGroup = compileOrGroup(callTypeTerms);

  return callTypeGroup ? `${objectGroup} AND ${callTypeGroup}` : objectGroup;
}

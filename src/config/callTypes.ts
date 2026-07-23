import type { CallType } from "../types/search";

export const CALL_TYPES = [
  {
    id: "conference",
    label: "Conference",
    searchTerms: ["call for papers", "call for abstracts", "doctoral consortium"],
  },
  {
    id: "journal",
    label: "Journal",
    searchTerms: ["call for papers", "special issue", "thematic issue"],
  },
  {
    id: "book",
    label: "Book",
    searchTerms: ["call for chapters", "edited volume", "chapter proposal"],
  },
] as const satisfies readonly CallType[];

export const CALL_TYPES_BY_ID = new Map(
  CALL_TYPES.map((callType) => [callType.id, callType]),
);

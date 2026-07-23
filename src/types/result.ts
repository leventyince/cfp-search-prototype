import type { CallTypeId, ObjectId } from "./search";

export type ResultCategory = CallTypeId | "unclassified";
export type SourceClass = "official" | "publisher" | "association" | "announcement-hub" | "unknown";

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  category: ResultCategory;
  sourceClass: SourceClass;
  sourceLabel: string;
  matchedObjectIds: ObjectId[];
  retrievedAt: string;
  isMock?: boolean;
}

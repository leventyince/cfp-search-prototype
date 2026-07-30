import type {
  CallTypeId,
  ObjectId,
} from "./search";

export type ResultCategory =
  | CallTypeId
  | "unclassified";

export type SourceClass =
  | "official"
  | "publisher"
  | "association"
  | "announcement-hub"
  | "unknown";

export type CallConfidence =
  | "strong"
  | "possible";

export type DeadlineStatus =
  | "future"
  | "expired";

export interface DetectedDeadline {
  isoDate: string;
  label: string;
  status: DeadlineStatus;
}

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

  callConfidence?: CallConfidence;
  deadline?: DetectedDeadline | null;
  qualityRank?: number;

  isMock?: boolean;
}
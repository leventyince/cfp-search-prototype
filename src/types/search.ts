export type ObjectId =
  | "video-games"
  | "film"
  | "television"
  | "digital-media"
  | "social-media"
  | "internet-digital-platforms"
  | "artificial-intelligence"
  | "virtual-augmented-reality"
  | "mobile-media"
  | "photography"
  | "animation"
  | "comics-graphic-novels"
  | "books-literature"
  | "sound-music"
  | "podcasts"
  | "art-performance"
  | "museums-heritage"
  | "visual-communication-design"
  | "narrative-storytelling"
  | "cities-architecture"
  | "education";

export type CallTypeId = "conference" | "journal" | "book";

export interface ObjectOfStudy {
  id: ObjectId;
  label: string;
  searchTerms: readonly string[];
}

export interface CallType {
  id: CallTypeId;
  label: string;
  searchTerms: readonly string[];
}

export interface SearchSelection {
  objects: ObjectId[];
  callTypes: CallTypeId[];
}

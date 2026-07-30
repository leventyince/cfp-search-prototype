import {
  OBJECTS_BY_ID,
} from "../config/objects";
import type {
  SearchResult,
  SourceClass,
} from "../types/result";
import type {
  ObjectId,
} from "../types/search";
import {
  analyzeResultQuality,
} from "./analyzeResultQuality";

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readString(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

const LEADING_SNIPPET_DATE_PATTERN =
  /^(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?[,]?\s+20\d{2}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,]?\s+20\d{2}|20\d{2}-\d{1,2}-\d{1,2})\s*(?:[-–—]|\.\.\.|\.|·)?\s*/i;

function cleanSearchSnippet(
  value: string,
): string {
  const cleaned = value
    .replace(
      LEADING_SNIPPET_DATE_PATTERN,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length > 0
    ? cleaned
    : value;
}

function parseHttpUrl(
  value: unknown,
): URL | null {
  const rawUrl = readString(value);

  if (rawUrl === null) {
    return null;
  }

  try {
    const url = new URL(rawUrl);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function classifySource(
  domain: string,
): SourceClass {
  const publisherMarkers = [
    "springer",
    "tandfonline",
    "sagepub",
    "wiley",
    "elsevier",
    "cambridge",
    "oup.com",
    "degruyter",
    "routledge",
    "emerald",
    "mdpi",
  ];

  if (
    publisherMarkers.some((marker) =>
      domain.includes(marker),
    )
  ) {
    return "publisher";
  }

  const associationMarkers = [
    "acm.org",
    "ieee.org",
    "ica-hdq.org",
    "digra.org",
    "aoir.org",
  ];

  if (
    associationMarkers.some((marker) =>
      domain.includes(marker),
    )
  ) {
    return "association";
  }

  if (
    domain.endsWith(".edu") ||
    domain.includes(".edu.") ||
    domain.endsWith(".ac.uk") ||
    domain.includes(".ac.")
  ) {
    return "official";
  }

  return "unknown";
}

function escapeRegularExpression(
  value: string,
): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

function textContainsTerm(
  text: string,
  term: string,
): boolean {
  const normalizedTerm =
    term.trim().toLowerCase();

  if (normalizedTerm.length === 0) {
    return false;
  }

  if (normalizedTerm.length <= 3) {
    const escaped =
      escapeRegularExpression(
        normalizedTerm,
      );

    return new RegExp(
      `(^|\\W)${escaped}(?=\\W|$)`,
      "i",
    ).test(text);
  }

  return text.includes(normalizedTerm);
}

function findMatchedObjects(
  title: string,
  snippet: string,
  selectedObjectIds: readonly ObjectId[],
): ObjectId[] {
  const searchableText =
    `${title} ${snippet}`.toLowerCase();

  return selectedObjectIds.filter((id) => {
    const object = OBJECTS_BY_ID.get(id);

    if (!object) {
      return false;
    }

    return object.searchTerms.some((term) =>
      textContainsTerm(
        searchableText,
        term,
      ),
    );
  });
}

function hashString(
  value: string,
): string {
  let hash = 2_166_136_261;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(
      hash,
      16_777_619,
    );
  }

  return (hash >>> 0).toString(36);
}

export function normalizeSearxngResults(
  rawResults: readonly unknown[],
  selectedObjectIds: readonly ObjectId[],
  now = new Date(),
): SearchResult[] {
  const normalizedResults: SearchResult[] =
    [];

  const seenUrls = new Set<string>();
  const retrievedAt =
    new Date().toISOString();

  for (const rawResult of rawResults) {
    if (!isRecord(rawResult)) {
      continue;
    }

    const title = readString(
      rawResult.title,
    );

    const url = parseHttpUrl(
      rawResult.url,
    );

    if (
      title === null ||
      url === null
    ) {
      continue;
    }

    const canonicalUrl = url.toString();

    if (seenUrls.has(canonicalUrl)) {
      continue;
    }

    seenUrls.add(canonicalUrl);

    const domain = url.hostname.replace(
      /^www\./,
      "",
    );

    const rawSnippet =
    readString(rawResult.content) ??
    "No excerpt was returned for this search result.";

    const snippet =
    cleanSearchSnippet(rawSnippet);

    const quality = analyzeResultQuality(
    title,
    rawSnippet,
    now,
    );

    if (!quality.shouldInclude) {
      continue;
    }

    normalizedResults.push({
    id: `live-${hashString(
        canonicalUrl,
    )}`,
    title,
    url: canonicalUrl,
    domain,
    snippet,
    category: quality.category,
    sourceClass:
        classifySource(domain),
    sourceLabel: domain,
    matchedObjectIds:
        findMatchedObjects(
        title,
        snippet,
        selectedObjectIds,
        ),
    callConfidence:
        quality.callConfidence,
    deadline: quality.deadline,
    qualityRank: quality.qualityRank,
    retrievedAt,
    isMock: false,
    });
  }

  return normalizedResults;
}
import type {
  CallConfidence,
  DetectedDeadline,
  ResultCategory,
} from "../types/result";

export type ResultRejectionReason =
  | "published-record"
  | "listing-page";

export interface ResultQualityAnalysis {
  category: ResultCategory;
  callConfidence: CallConfidence;
  deadline: DetectedDeadline | null;
  qualityRank: number;
  shouldInclude: boolean;
  rejectionReason:
    | ResultRejectionReason
    | null;
}

const BOOK_PATTERN =
  /\b(call for chapters?|chapter proposals?|edited volumes?|book chapters?)\b/i;

const JOURNAL_PATTERN =
  /\b(special issue|thematic issue|journal issue|journal submissions?)\b/i;

const CONFERENCE_PATTERN =
  /\b(conference|symposium|congress|doctoral consortium|workshop)\b/i;

const GENERIC_CALL_PATTERN =
  /\b(call for papers?|call for abstracts?|cfp)\b/i;

const STRONG_TITLE_CALL_PATTERN =
  /\b(call for (?:papers?|abstracts?|chapters?|proposals?)|cfp|submissions? (?:are )?open|submit (?:an? )?(?:abstract|paper|chapter|proposal))\b/i;

const STRONG_SNIPPET_CALL_PATTERN =
  /\b(submission deadline|deadline for submissions?|submissions? (?:are )?(?:open|invited)|submit (?:an? )?(?:abstract|paper|chapter|proposal)|abstracts? due|papers? due|chapters? due|proposals? due|invites? (?:papers?|abstracts?|chapters?|proposals?)|seeks? contributions?)\b/i;

const PUBLICATION_RECORD_PATTERNS = [
  /^\s*(?:vol(?:ume)?\.?\s*)?\d{1,3}\s*[-–]\s*\d{1,3}\s*\|\s*(?:19|20)\d{2}\b/i,
  /\b(?:volume|vol\.)\s*\d+\b.{0,30}\b(?:issue|no\.)\s*\d+\b/i,
  /\btable of contents\b/i,
  /\bissue contents\b/i,
  /\bpublished special issue\b/i,
];

const LISTING_PAGE_TITLE_PATTERNS = [
  /\b(?:call for papers?|calls for papers?|cfp|call for chapters?)\s+archives?\b/i,
  /\barchives?\s+(?:of|for)\s+(?:calls?|cfps?)\b/i,
  /\b(?:all|latest|recent)\s+(?:calls for papers?|cfps?)\b/i,
];

const MONTH_PATTERN =
  "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";

const DATE_PATTERN =
  `(?:${MONTH_PATTERN}\\s+\\d{1,2}(?:st|nd|rd|th)?[,]?\\s+20\\d{2}` +
  `|\\d{1,2}(?:st|nd|rd|th)?\\s+${MONTH_PATTERN}[,]?\\s+20\\d{2}` +
  `|20\\d{2}-\\d{1,2}-\\d{1,2})`;

const DEADLINE_PATTERNS = [
  new RegExp(
    `\\b(?:submission|abstract|paper|chapter|proposal)?\\s*deadline` +
    `(?:\\s+for\\s+(?:submissions?|abstracts?|papers?|chapters?|proposals?))?` +
    `(?:\\s+(?:is|of))?\\s*[:\\-–—]?\\s*(${DATE_PATTERN})`,
    "gi",
  ),
  new RegExp(
    `\\b(?:abstracts?|papers?|chapters?|proposals?|submissions?)` +
      `\\s+(?:are\\s+)?due(?:\\s+(?:on|by))?\\s*[:\\-–]?\\s*(${DATE_PATTERN})`,
    "gi",
  ),
  new RegExp(
    `\\bdue(?:\\s+(?:on|by))?\\s*[:\\-–]?\\s*(${DATE_PATTERN})`,
    "gi",
  ),
  new RegExp(
    `(${DATE_PATTERN})\\s*(?:submission deadline|deadline|due date)\\b`,
    "gi",
  ),
  new RegExp(
  `(${DATE_PATTERN})\\s*` +
    `(?:[-–—:|]\\s*)?` +
    `(?:abstracts?|papers?|chapters?|proposals?|submissions?)` +
    `\\s+(?:are\\s+)?due\\b`,
    "gi",
  ),
];

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

interface DeadlineCandidate {
  date: Date;
  isoDate: string;
  label: string;
  status: "future" | "expired";
}

export function classifyResultCategory(
  title: string,
  snippet: string,
): ResultCategory {
  /*
   * Title evidence is evaluated before
   * snippet evidence.
   */
  if (BOOK_PATTERN.test(title)) {
    return "book";
  }

  if (JOURNAL_PATTERN.test(title)) {
    return "journal";
  }

  if (CONFERENCE_PATTERN.test(title)) {
    return "conference";
  }

  if (BOOK_PATTERN.test(snippet)) {
    return "book";
  }

  if (JOURNAL_PATTERN.test(snippet)) {
    return "journal";
  }

  /*
   * A generic title-level CFP is treated
   * as a conference call only after more
   * specific book/journal evidence.
   */
  if (GENERIC_CALL_PATTERN.test(title)) {
    return "conference";
  }

  if (
    CONFERENCE_PATTERN.test(snippet) ||
    GENERIC_CALL_PATTERN.test(snippet)
  ) {
    return "conference";
  }

  return "unclassified";
}

function buildUtcDate(
  year: number,
  month: number,
  day: number,
): Date | null {
  const date = new Date(
    Date.UTC(year, month, day),
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function readMonthIndex(
  value: string,
): number | null {
  const key = value
    .slice(0, 3)
    .toLowerCase();

  return MONTH_INDEX[key] ?? null;
}

function parseDate(
  rawValue: string,
): Date | null {
  const normalized = rawValue
    .replace(
      /(\d)(?:st|nd|rd|th)\b/gi,
      "$1",
    )
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const isoMatch = normalized.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
  );

  if (isoMatch) {
    return buildUtcDate(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3]),
    );
  }

  const monthFirstMatch =
    normalized.match(
      new RegExp(
        `^(${MONTH_PATTERN})\\s+(\\d{1,2})\\s+(20\\d{2})$`,
        "i",
      ),
    );

  if (monthFirstMatch) {
    const month = readMonthIndex(
      monthFirstMatch[1],
    );

    if (month === null) {
      return null;
    }

    return buildUtcDate(
      Number(monthFirstMatch[3]),
      month,
      Number(monthFirstMatch[2]),
    );
  }

  const dayFirstMatch =
    normalized.match(
      new RegExp(
        `^(\\d{1,2})\\s+(${MONTH_PATTERN})\\s+(20\\d{2})$`,
        "i",
      ),
    );

  if (dayFirstMatch) {
    const month = readMonthIndex(
      dayFirstMatch[2],
    );

    if (month === null) {
      return null;
    }

    return buildUtcDate(
      Number(dayFirstMatch[3]),
      month,
      Number(dayFirstMatch[1]),
    );
  }

  return null;
}

function formatIsoDate(
  date: Date,
): string {
  return date
    .toISOString()
    .slice(0, 10);
}

function findDeadline(
  title: string,
  snippet: string,
  now: Date,
): DetectedDeadline | null {
  const text = `${title}. ${snippet}`;

  const today = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    ),
  );

  const candidates =
    new Map<string, DeadlineCandidate>();

  for (const pattern of DEADLINE_PATTERNS) {
    pattern.lastIndex = 0;

    for (const match of text.matchAll(pattern)) {
      const label = match[1]?.trim();

      if (!label) {
        continue;
      }

      const date = parseDate(label);

      if (date === null) {
        continue;
      }

      const isoDate = formatIsoDate(date);

      candidates.set(isoDate, {
        date,
        isoDate,
        label,
        status:
          date.getTime() >= today.getTime()
            ? "future"
            : "expired",
      });
    }
  }

  const allCandidates = [
    ...candidates.values(),
  ];

  const futureCandidates =
    allCandidates
      .filter(
        (candidate) =>
          candidate.status === "future",
      )
      .sort(
        (first, second) =>
          first.date.getTime() -
          second.date.getTime(),
      );

  const selected =
    futureCandidates[0] ??
    allCandidates
      .filter(
        (candidate) =>
          candidate.status === "expired",
      )
      .sort(
        (first, second) =>
          second.date.getTime() -
          first.date.getTime(),
      )[0];

  if (!selected) {
    return null;
  }

  return {
    isoDate: selected.isoDate,
    label: selected.label,
    status: selected.status,
  };
}

function looksLikePublishedRecord(
  title: string,
): boolean {
  return PUBLICATION_RECORD_PATTERNS.some(
    (pattern) => pattern.test(title),
  );
}

function looksLikeListingPage(
  title: string,
): boolean {
  return LISTING_PAGE_TITLE_PATTERNS.some(
    (pattern) => pattern.test(title),
  );
}

function calculateQualityRank(
  callConfidence: CallConfidence,
  deadline: DetectedDeadline | null,
): number {
  if (deadline?.status === "future") {
    return 0;
  }

  if (deadline?.status === "expired") {
    return 3;
  }

  return callConfidence === "strong"
    ? 1
    : 2;
}

export function analyzeResultQuality(
  title: string,
  snippet: string,
  now = new Date(),
): ResultQualityAnalysis {
  const titleHasStrongCallEvidence =
    STRONG_TITLE_CALL_PATTERN.test(title);

  const snippetHasStrongCallEvidence =
    STRONG_SNIPPET_CALL_PATTERN.test(
      snippet,
    );

  const callConfidence: CallConfidence =
    titleHasStrongCallEvidence ||
    snippetHasStrongCallEvidence
      ? "strong"
      : "possible";

  const publishedRecord =
  looksLikePublishedRecord(title);

  const listingPage =
  looksLikeListingPage(title);

  const shouldInclude =
    !listingPage &&
  (
    !publishedRecord ||
    callConfidence === "strong"
  );

  const deadline = findDeadline(
    title,
    snippet,
    now,
  );

  return {
    category: classifyResultCategory(
      title,
      snippet,
    ),
    callConfidence,
    deadline,
    qualityRank: calculateQualityRank(
      callConfidence,
      deadline,
    ),
    shouldInclude,
    rejectionReason: shouldInclude
    ? null
    : listingPage
        ? "listing-page"
        : "published-record",
  };
}
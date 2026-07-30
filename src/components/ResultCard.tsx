import {
  OBJECTS_BY_ID,
} from "../config/objects";
import type {
  SearchResult,
} from "../types/result";

interface ResultCardProps {
  result: SearchResult;
}

function getCallLabel(
  result: SearchResult,
): string {
  return result.callConfidence ===
    "strong"
    ? "Likely call"
    : "Possible call";
}

export function ResultCard({
  result,
}: ResultCardProps) {
  const deadlineStatus =
    result.deadline?.status ??
    "unknown";

  const cardClasses = [
    "result-card",
    `result-card--${result.category}`,
    deadlineStatus === "expired"
      ? "result-card--expired"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClasses}>
      <div className="result-card__topline">
        <p className="result-card__category">
          {result.category.replace(
            "-",
            " ",
          )}
        </p>

        <p className="result-card__source-class">
          {result.sourceClass.replace(
            "-",
            " ",
          )}
        </p>
      </div>

      <h2 className="result-card__title">
        {result.title}
      </h2>

      <p className="result-card__source">
        {result.sourceLabel} ·{" "}
        {result.domain}
      </p>

      <p
        className={
          `result-card__deadline ` +
          `result-card__deadline--${deadlineStatus}`
        }
        title="Deadline detection uses the search-result excerpt. Verify the source page."
      >
        {result.deadline ? (
          <>
            <span>
              {result.deadline.status ===
              "expired"
                ? "Likely expired"
                : "Deadline detected"}
            </span>

            {" · "}

            <time
              dateTime={
                result.deadline.isoDate
              }
            >
              {result.deadline.label}
            </time>
          </>
        ) : (
          "Deadline not detected"
        )}
      </p>

      <p className="result-card__snippet">
        {result.snippet}
      </p>

      {result.matchedObjectIds.length >
      0 ? (
        <div
          className="result-card__tags"
          aria-label="Matched objects"
        >
          {result.matchedObjectIds.map(
            (id) => (
              <span
                className="matched-tag"
                key={id}
              >
                {OBJECTS_BY_ID.get(id)
                  ?.label ?? id}
              </span>
            ),
          )}
        </div>
      ) : null}

      <div className="result-card__footer">
        <span>
          {getCallLabel(result)}
        </span>

        <a
          className="text-action"
          href={result.url}
          target="_blank"
          rel="noreferrer"
        >
          Open source
        </a>
      </div>
    </article>
  );
}
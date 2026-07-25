import {
  OBJECTS_BY_ID,
} from "../config/objects";
import type {
  SearchResult,
} from "../types/result";

interface ResultCardProps {
  result: SearchResult;
}

export function ResultCard({
  result,
}: ResultCardProps) {
  return (
    <article
      className={`result-card result-card--${result.category}`}
    >
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
        <span>Live search result</span>

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
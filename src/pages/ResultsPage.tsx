import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useSearchParams,
} from "react-router";
import {
  CallTypeSelector,
} from "../components/CallTypeSelector";
import {
  CoverageNotice,
} from "../components/CoverageNotice";
import {
  PageFrame,
} from "../components/PageFrame";
import {
  ResultCard,
} from "../components/ResultCard";
import {
  SelectedChip,
} from "../components/SelectedChip";
import {
  OBJECTS_BY_ID,
} from "../config/objects";
import {
  buildSearchQuery,
} from "../search/buildQuery";
import {
  normalizeSearxngResults,
} from "../search/normalizeResults";
import {
  SearchApiError,
  searchCfps,
} from "../search/searchApi";
import {
  selectionFromSearchParams,
  selectionToSearchParams,
} from "../search/urlState";
import type {
  SearchResult,
} from "../types/result";
import type {
  CallTypeId,
  ObjectId,
} from "../types/search";

type RequestStatus =
  | "loading"
  | "success"
  | "error";

function normalizeRequestError(
  error: unknown,
): SearchApiError {
  if (error instanceof SearchApiError) {
    return error;
  }

  return new SearchApiError(
    "network",
    "An unexpected error prevented the search from completing.",
  );
}

export function ResultsPage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const selection = useMemo(
    () =>
      selectionFromSearchParams(
        searchParams,
      ),
    [searchParams],
  );

  const [knownOnly, setKnownOnly] =
    useState(false);

  const [sortMode, setSortMode] =
    useState<"relevance" | "source">(
      "relevance",
    );

  const [
    liveResults,
    setLiveResults,
  ] = useState<SearchResult[]>([]);

  const [
    requestStatus,
    setRequestStatus,
  ] =
    useState<RequestStatus>("loading");

  const [
    requestError,
    setRequestError,
  ] =
    useState<SearchApiError | null>(
      null,
    );

  const [retryCount, setRetryCount] =
    useState(0);

  const query = useMemo(() => {
    if (
      selection.objects.length === 0
    ) {
      return "";
    }

    return buildSearchQuery(selection);
  }, [selection]);

  const selectedObjectsKey =
    selection.objects.join(",");

  useEffect(() => {
    if (query.length === 0) {
      return;
    }

    const controller =
      new AbortController();

    let cancelled = false;

    const selectedObjectIds =
      selectedObjectsKey
        .split(",")
        .filter(Boolean) as ObjectId[];

    setRequestStatus("loading");
    setRequestError(null);
    setLiveResults([]);

    searchCfps({
      query,
      page: 1,
      signal: controller.signal,
    })
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setLiveResults(
          normalizeSearxngResults(
            payload.results,
            selectedObjectIds,
          ),
        );

        setRequestStatus("success");
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setRequestError(
          normalizeRequestError(error),
        );

        setRequestStatus("error");
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    query,
    retryCount,
    selectedObjectsKey,
  ]);

  const filteredResults =
    useMemo(() => {
      const selectedTypes = new Set(
        selection.callTypes,
      );

      const filtered =
        liveResults.filter((result) => {
          const matchesType =
            result.category ===
              "unclassified" ||
            selectedTypes.has(
              result.category,
            );

          const matchesSource =
            !knownOnly ||
            result.sourceClass !==
              "unknown";

          return (
            matchesType &&
            matchesSource
          );
        });

      if (sortMode === "source") {
        return [...filtered].sort(
          (first, second) =>
            first.sourceLabel.localeCompare(
              second.sourceLabel,
            ),
        );
      }

      return filtered;
    }, [
      knownOnly,
      liveResults,
      selection.callTypes,
      sortMode,
    ]);

  function updateSelection(
    objects: ObjectId[],
    callTypes: CallTypeId[],
  ) {
    setSearchParams(
      selectionToSearchParams({
        objects,
        callTypes,
      }),
    );
  }

  function removeObject(
    id: ObjectId,
  ) {
    updateSelection(
      selection.objects.filter(
        (item) => item !== id,
      ),
      selection.callTypes,
    );
  }

  function resetFilters() {
    setKnownOnly(false);

    updateSelection(
      selection.objects,
      [
        "conference",
        "journal",
        "book",
      ],
    );
  }

  if (
    selection.objects.length === 0
  ) {
    return (
      <PageFrame pageLabel="Search Results Page">
        <div className="empty-layout">
          <p className="comment-line">
            // No valid Object of Study
            was included in this search
            URL.
          </p>

          <Link
            className="primary-button primary-button--inline"
            to="/"
          >
            Return to search
          </Link>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame pageLabel="Search Results Page">
      <div className="results-layout">
        <header className="page-intro page-intro--results">
          <p className="comment-line">
            // Live results retrieved
            through the CFP Search Worker.
          </p>

          <p className="comment-line">
            // Generated query: {query}
          </p>
        </header>

        <CoverageNotice compact />

        <section
          className="selection-row"
          aria-label="Selected Objects of Study"
        >
          {selection.objects.map(
            (id) => (
              <SelectedChip
                key={id}
                label={
                  OBJECTS_BY_ID.get(id)
                    ?.label ?? id
                }
                onRemove={() =>
                  removeObject(id)
                }
              />
            ),
          )}
        </section>

        <section className="results-toolbar">
          <div className="results-toolbar__filters">
            <CallTypeSelector
              compact
              selectedIds={
                selection.callTypes
              }
              onChange={(callTypes) =>
                updateSelection(
                  selection.objects,
                  callTypes,
                )
              }
            />

            <label
              className={
                knownOnly
                  ? "filter-toggle filter-toggle--active"
                  : "filter-toggle"
              }
            >
              <input
                type="checkbox"
                checked={knownOnly}
                onChange={(event) =>
                  setKnownOnly(
                    event.target.checked,
                  )
                }
              />

              <span>
                {knownOnly ? "× " : ""}
                Known sources
              </span>
            </label>

            <button
              className="text-action text-action--button"
              type="button"
              onClick={resetFilters}
            >
              Reset filters
            </button>
          </div>

          <div
            className="sort-control"
            aria-label="Sort results"
          >
            <span>Sort by:</span>

            <button
              className={
                sortMode === "relevance"
                  ? "sort-pill sort-pill--active"
                  : "sort-pill"
              }
              type="button"
              onClick={() =>
                setSortMode("relevance")
              }
            >
              Relevance
            </button>

            <button
              className={
                sortMode === "source"
                  ? "sort-pill sort-pill--active"
                  : "sort-pill"
              }
              type="button"
              onClick={() =>
                setSortMode("source")
              }
            >
              Source
            </button>
          </div>
        </section>

        <div className="results-meta">
          <p>
            {requestStatus === "loading"
              ? "Searching live sources…"
              : requestStatus ===
                  "error"
                ? "Search unavailable"
                : `${filteredResults.length} live results`}
          </p>

          <Link
            className="text-action"
            to="/"
          >
            Revise search
          </Link>
        </div>

        {requestStatus ===
        "loading" ? (
          <section
            className="status-state"
            aria-live="polite"
            aria-busy="true"
          >
            <span
              className="search-spinner"
              aria-hidden="true"
            />

            <p>
              Searching the live CFP
              backend…
            </p>
          </section>
        ) : null}

        {requestStatus === "error" &&
        requestError !== null ? (
          <section
            className="status-state status-state--error"
            role="alert"
          >
            <h2>
              The search could not be
              completed.
            </h2>

            <p>
              {requestError.message}
            </p>

            <p className="status-state__detail">
              Error type:{" "}
              {requestError.kind}
              {requestError.code
                ? ` · ${requestError.code}`
                : ""}
            </p>

            <button
              className="primary-button primary-button--inline"
              type="button"
              onClick={() =>
                setRetryCount(
                  (current) =>
                    current + 1,
                )
              }
            >
              Try again
            </button>
          </section>
        ) : null}

        {requestStatus === "success" &&
        filteredResults.length > 0 ? (
          <section
            className="result-grid"
            aria-label="Search results"
          >
            {filteredResults.map(
              (result) => (
                <ResultCard
                  key={result.id}
                  result={result}
                />
              ),
            )}
          </section>
        ) : null}

        {requestStatus === "success" &&
        filteredResults.length ===
          0 ? (
          <section className="empty-state">
            <p>
              {liveResults.length === 0
                ? "No live results were returned for this search."
                : "No live results match the current filters."}
            </p>

            {liveResults.length === 0 ? (
              <button
                className="primary-button primary-button--inline"
                type="button"
                onClick={() =>
                  setRetryCount(
                    (current) =>
                      current + 1,
                  )
                }
              >
                Search again
              </button>
            ) : (
              <button
                className="primary-button primary-button--inline"
                type="button"
                onClick={resetFilters}
              >
                Reset filters
              </button>
            )}
          </section>
        ) : null}
      </div>
    </PageFrame>
  );
}
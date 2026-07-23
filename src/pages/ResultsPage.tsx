import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { CallTypeSelector } from "../components/CallTypeSelector";
import { CoverageNotice } from "../components/CoverageNotice";
import { PageFrame } from "../components/PageFrame";
import { ResultCard } from "../components/ResultCard";
import { SelectedChip } from "../components/SelectedChip";
import { OBJECTS_BY_ID } from "../config/objects";
import { MOCK_RESULTS } from "../data/mockResults";
import { buildSearchQuery } from "../search/buildQuery";
import { selectionFromSearchParams, selectionToSearchParams } from "../search/urlState";
import type { CallTypeId, ObjectId } from "../types/search";

export function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selection = useMemo(() => selectionFromSearchParams(searchParams), [searchParams]);
  const [knownOnly, setKnownOnly] = useState(false);
  const [sortMode, setSortMode] = useState<"relevance" | "source">("relevance");

  const query = useMemo(() => {
    if (selection.objects.length === 0) return "";
    return buildSearchQuery(selection);
  }, [selection]);

  const results = useMemo(() => {
    const selectedObjects = new Set(selection.objects);
    const selectedTypes = new Set(selection.callTypes);

    const filtered = MOCK_RESULTS.filter((result) => {
      const matchesObject = result.matchedObjectIds.some((id) => selectedObjects.has(id));
      const matchesType = result.category === "unclassified" || selectedTypes.has(result.category);
      const matchesSource = !knownOnly || result.sourceClass !== "unknown";
      return matchesObject && matchesType && matchesSource;
    });

    if (sortMode === "source") {
      return [...filtered].sort((a, b) => a.sourceLabel.localeCompare(b.sourceLabel));
    }

    return filtered;
  }, [knownOnly, selection.callTypes, selection.objects, sortMode]);

  function updateSelection(objects: ObjectId[], callTypes: CallTypeId[]) {
    setSearchParams(selectionToSearchParams({ objects, callTypes }));
  }

  function removeObject(id: ObjectId) {
    updateSelection(selection.objects.filter((item) => item !== id), selection.callTypes);
  }

  if (selection.objects.length === 0) {
    return (
      <PageFrame pageLabel="Search Results Page">
        <div className="empty-layout">
          <p className="comment-line">// No valid Object of Study was included in this search URL.</p>
          <Link className="primary-button primary-button--inline" to="/">Return to search</Link>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame pageLabel="Search Results Page">
      <div className="results-layout">
        <header className="page-intro page-intro--results">
          <p className="comment-line">// Prototype results currently use representative mock records.</p>
          <p className="comment-line">// Generated query: {query}</p>
        </header>

        <CoverageNotice compact />

        <section className="selection-row" aria-label="Selected Objects of Study">
          {selection.objects.map((id) => (
            <SelectedChip key={id} label={OBJECTS_BY_ID.get(id)?.label ?? id} onRemove={() => removeObject(id)} />
          ))}
        </section>

        <section className="results-toolbar">
          <div className="results-toolbar__filters">
            <CallTypeSelector
              compact
              selectedIds={selection.callTypes}
              onChange={(callTypes) => updateSelection(selection.objects, callTypes)}
            />
            <label className={knownOnly ? "filter-toggle filter-toggle--active" : "filter-toggle"}>
              <input type="checkbox" checked={knownOnly} onChange={(event) => setKnownOnly(event.target.checked)} />
              <span>{knownOnly ? "× " : ""}Known sources</span>
            </label>
            <button
              className="text-action text-action--button"
              type="button"
              onClick={() => {
                setKnownOnly(false);
                updateSelection(selection.objects, ["conference", "journal", "book"]);
              }}
            >
              Reset filters
            </button>
          </div>

          <div className="sort-control" aria-label="Sort results">
            <span>Sort by:</span>
            <button
              className={sortMode === "relevance" ? "sort-pill sort-pill--active" : "sort-pill"}
              type="button"
              onClick={() => setSortMode("relevance")}
            >
              Relevance
            </button>
            <button
              className={sortMode === "source" ? "sort-pill sort-pill--active" : "sort-pill"}
              type="button"
              onClick={() => setSortMode("source")}
            >
              Source
            </button>
          </div>
        </section>

        <div className="results-meta">
          <p>{results.length} prototype results</p>
          <Link className="text-action" to="/">Revise search</Link>
        </div>

        {results.length > 0 ? (
          <section className="result-grid" aria-label="Search results">
            {results.map((result) => <ResultCard key={result.id} result={result} />)}
          </section>
        ) : (
          <section className="empty-state">
            <p>No prototype records match the current selections.</p>
            <button
              className="primary-button primary-button--inline"
              type="button"
              onClick={() => updateSelection(selection.objects, ["conference", "journal", "book"])}
            >
              Reset call types
            </button>
          </section>
        )}
      </div>
    </PageFrame>
  );
}

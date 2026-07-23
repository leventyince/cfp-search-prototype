import { useState } from "react";
import { useNavigate } from "react-router";
import { CALL_TYPES } from "../config/callTypes";
import { CallTypeSelector } from "../components/CallTypeSelector";
import { CoverageNotice } from "../components/CoverageNotice";
import { ObjectSelector } from "../components/ObjectSelector";
import { PageFrame } from "../components/PageFrame";
import { selectionToSearchParams } from "../search/urlState";
import type { CallTypeId, ObjectId } from "../types/search";

export function HomePage() {
  const navigate = useNavigate();
  const [objects, setObjects] = useState<ObjectId[]>([]);
  const [callTypes, setCallTypes] = useState<CallTypeId[]>(CALL_TYPES.map((item) => item.id));
  const [attempted, setAttempted] = useState(false);

  const canSearch = objects.length > 0 && callTypes.length > 0;

  function submitSearch() {
    setAttempted(true);
    if (!canSearch) return;

    const params = selectionToSearchParams({ objects, callTypes });
    navigate(`/results?${params.toString()}`);
  }

  return (
    <PageFrame pageLabel="Search Page">
      <div className="landing-layout">
        <header className="page-intro">
          <p className="comment-line">// Find current calls for papers, journal submissions, and book chapters.</p>
          <p className="comment-line">// Select at least one Object of Study. Multiple selections search for either or both.</p>
          <p className="comment-line">// The live SearXNG connection will be added in the next implementation batch.</p>
        </header>

        <CoverageNotice />

        <ObjectSelector selectedIds={objects} onChange={setObjects} />

        <div className="landing-actions">
          <CallTypeSelector selectedIds={callTypes} onChange={setCallTypes} />
          <div className="landing-actions__submit">
            {attempted && objects.length === 0 ? (
              <p className="validation-message" role="alert">Select at least one Object of Study.</p>
            ) : null}
            {attempted && callTypes.length === 0 ? (
              <p className="validation-message" role="alert">Select at least one call type.</p>
            ) : null}
            <button className="primary-button" type="button" disabled={!canSearch} onClick={submitSearch}>
              Search
            </button>
          </div>
        </div>

        <p className="about-line">
          About, sources, and limitations will be documented in the public repository.
        </p>
      </div>
    </PageFrame>
  );
}

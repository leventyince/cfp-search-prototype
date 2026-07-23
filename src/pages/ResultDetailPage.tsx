import { Link, useLocation, useParams } from "react-router";
import { CoverageNotice } from "../components/CoverageNotice";
import { PageFrame } from "../components/PageFrame";
import { OBJECTS_BY_ID } from "../config/objects";
import { MOCK_RESULTS } from "../data/mockResults";

export function ResultDetailPage() {
  const { resultId } = useParams();
  const location = useLocation();
  const result = MOCK_RESULTS.find((item) => item.id === resultId);
  const returnPath = `/results${location.search}`;

  if (!result) {
    return (
      <PageFrame pageLabel="Search Result Detail Page">
        <div className="empty-layout">
          <p className="comment-line">// This result is unavailable in the current prototype session.</p>
          <Link className="primary-button primary-button--inline" to={returnPath}>Return to search results</Link>
        </div>
      </PageFrame>
    );
  }

  const retrievedDate = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
    new Date(result.retrievedAt),
  );

  return (
    <PageFrame pageLabel="Search Result Detail Page">
      <div className="detail-layout">
        <header className="page-intro">
          <p className="comment-line">// Search-result metadata only; confirm every submission detail on the source page.</p>
          <p className="comment-line">// Rich deadline, fee, eligibility, and location data is reserved for a later enrichment layer.</p>
        </header>

        <div className="detail-grid">
          <article className="detail-card">
            <p className="result-card__category">{result.category}</p>
            <h1>{result.title}</h1>
            <p className="detail-card__source">{result.sourceLabel} · {result.domain}</p>

            <div className="result-card__tags">
              {result.matchedObjectIds.map((id) => (
                <span className="matched-tag" key={id}>{OBJECTS_BY_ID.get(id)?.label ?? id}</span>
              ))}
            </div>

            <section className="detail-card__section">
              <h2>Available search-result excerpt</h2>
              <p>{result.snippet}</p>
            </section>

            <section className="detail-card__section">
              <h2>Source URL</h2>
              <p className="url-text">{result.url}</p>
            </section>
          </article>

          <aside className="detail-sidebar">
            <dl>
              <div>
                <dt>Source classification</dt>
                <dd>{result.sourceClass.replace("-", " ")}</dd>
              </div>
              <div>
                <dt>Retrieved on</dt>
                <dd>{retrievedDate}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{result.isMock ? "Prototype record" : "Live search result"}</dd>
              </div>
            </dl>

            <CoverageNotice compact />

            <a className="text-action detail-sidebar__source-link" href={result.url} target="_blank" rel="noreferrer">
              Go to the source URL
            </a>
          </aside>
        </div>

        <div className="detail-return">
          <Link className="primary-button primary-button--inline" to={returnPath}>Return to search results</Link>
        </div>
      </div>
    </PageFrame>
  );
}

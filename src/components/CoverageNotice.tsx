interface CoverageNoticeProps {
  compact?: boolean;
}

export function CoverageNotice({ compact = false }: CoverageNoticeProps) {
  return (
    <aside className={compact ? "coverage-notice coverage-notice--compact" : "coverage-notice"}>
      <p>
        This prototype searches live web results and currently focuses on media, design, communication,
        games, and adjacent research areas.
      </p>
      <p>
        Call information is collected automatically. Confirm deadlines and submission requirements on
        the original source.
      </p>
    </aside>
  );
}

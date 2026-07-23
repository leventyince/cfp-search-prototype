import type { PropsWithChildren } from "react";

interface PageFrameProps extends PropsWithChildren {
  pageLabel: string;
}

export function PageFrame({ pageLabel, children }: PageFrameProps) {
  return (
    <main className="site-shell">
      <p className="prototype-title">CFP Search Tool Prototype // {pageLabel}</p>
      <section className="app-panel">{children}</section>
    </main>
  );
}

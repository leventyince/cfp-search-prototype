import {
  describe,
  expect,
  it,
} from "vitest";

import {
  normalizeSearxngResults,
} from "../src/search/normalizeResults";

const NOW = new Date(
  "2026-07-30T12:00:00.000Z",
);

describe(
  "normalizeSearxngResults quality analysis",
  () => {
    it("rejects an obvious published issue record without call evidence", () => {
      const results =
        normalizeSearxngResults(
          [
            {
              title:
                "16-3 | 2021 Special Issue: Video Games and/in American Studies",
              url:
                "https://journals.openedition.org/example/123",
              content:
                "16-3 | 2021. Special Issue: Video Games and/in American Studies: Politics and Popular Culture.",
            },
          ],
          ["video-games"],
          NOW,
        );

      expect(results).toHaveLength(0);
    });

    it("uses title-first evidence for a call for chapters", () => {
      const [result] =
        normalizeSearxngResults(
          [
            {
              title:
                "Call for Chapters - DiGRA",
              url:
                "https://digra.org/call-for-chapters",
              content:
                "Call for Papers. A book call for chapters concerning video games.",
            },
          ],
          ["video-games"],
          NOW,
        );

      expect(result.category).toBe(
        "book",
      );

      expect(
        result.callConfidence,
      ).toBe("strong");
    });

    it("detects a future explicit deadline", () => {
      const [result] =
        normalizeSearxngResults(
          [
            {
              title:
                "Call for Papers: Game Studies",
              url:
                "https://example.edu/future-cfp",
              content:
                "The submission deadline is September 15, 2026.",
            },
          ],
          ["video-games"],
          NOW,
        );

      expect(result.deadline).toEqual({
        isoDate: "2026-09-15",
        label:
          "September 15, 2026",
        status: "future",
      });

      expect(result.qualityRank).toBe(0);
    });

    it("marks an explicit past deadline as expired", () => {
      const [result] =
        normalizeSearxngResults(
          [
            {
              title:
                "Call for Papers: Digital Games",
              url:
                "https://example.edu/expired-cfp",
              content:
                "Papers are due June 3, 2026.",
            },
          ],
          ["video-games"],
          NOW,
        );

      expect(
        result.deadline?.status,
      ).toBe("expired");

      expect(result.qualityRank).toBe(3);
    });

    it("does not treat a leading publication date as a deadline", () => {
      const [result] =
        normalizeSearxngResults(
          [
            {
              title:
                "Call for Papers: Playful Monsters",
              url:
                "https://example.edu/blog-post",
              content:
                "May 7, 2026. Call for Papers concerning video games and play.",
            },
          ],
          ["video-games"],
          NOW,
        );

      expect(result.deadline).toBeNull();

      expect(result.qualityRank).toBe(1);
    });

    it("prefers the nearest future deadline when several are present", () => {
      const [result] =
        normalizeSearxngResults(
          [
            {
              title:
                "Call for Papers: Game Research",
              url:
                "https://example.edu/multiple-deadlines",
              content:
                "Abstracts are due September 1, 2026. Papers are due November 15, 2026.",
            },
          ],
          ["video-games"],
          NOW,
        );

      expect(
        result.deadline?.isoDate,
      ).toBe("2026-09-01");
    });

    it("rejects a CFP archive page", () => {
    const results =
        normalizeSearxngResults(
        [
            {
            title:
                "Call for Papers Archives - DiGRA",
            url:
                "https://digra.org/category/call-for-papers",
            content:
                "Call for chapter proposals concerning games, design, and player agency.",
            },
        ],
        ["video-games"],
        NOW,
        );

    expect(results).toHaveLength(0);
    });

    it("detects a deadline placed before the due wording", () => {
    const [result] =
        normalizeSearxngResults(
        [
            {
            title:
                "cfp | call for papers",
            url:
                "https://call-for-papers.sas.upenn.edu/example",
            content:
                "14 April 2026 — Abstracts due (500 words maximum).",
            },
        ],
        ["video-games"],
        NOW,
        );

    expect(result.deadline).toEqual({
        isoDate: "2026-04-14",
        label: "14 April 2026",
        status: "expired",
    });

    expect(result.snippet).toBe(
        "Abstracts due (500 words maximum).",
    );
    });

    it("removes an unqualified leading date from the displayed snippet", () => {
    const [result] =
        normalizeSearxngResults(
        [
            {
            title:
                "Video games and/as speculative fiction - cfp",
            url:
                "https://call-for-papers.sas.upenn.edu/example-two",
            content:
                "Jul 17, 2026 ... Call for Papers. Video games are discussed as speculative fiction.",
            },
        ],
        ["video-games"],
        NOW,
        );

    expect(result.deadline).toBeNull();

    expect(result.snippet).toBe(
        "Call for Papers. Video games are discussed as speculative fiction.",
    );

    expect(result.snippet).not.toContain(
    "May 7, 2026",
    );
    });
  },
);
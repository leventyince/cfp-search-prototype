import { describe, expect, it } from "vitest";
import { selectionFromSearchParams, selectionToSearchParams } from "../src/search/urlState";

 describe("search URL state", () => {
  it("serializes and parses a valid selection", () => {
    const input = {
      objects: ["video-games", "narrative-storytelling"] as const,
      callTypes: ["conference", "book"] as const,
    };

    const params = selectionToSearchParams({
      objects: [...input.objects],
      callTypes: [...input.callTypes],
    });

    expect(selectionFromSearchParams(params)).toEqual({
      objects: [...input.objects],
      callTypes: [...input.callTypes],
    });
  });

  it("drops unknown identifiers", () => {
    const params = new URLSearchParams(
      "objects=video-games,unknown&types=conference,invalid",
    );

    expect(selectionFromSearchParams(params)).toEqual({
      objects: ["video-games"],
      callTypes: ["conference"],
    });
  });
});

import { describe, expect, it } from "vitest";
import { buildSearchQuery } from "../src/search/buildQuery";

 describe("buildSearchQuery", () => {
  it("requires at least one Object of Study", () => {
    expect(() => buildSearchQuery({ objects: [], callTypes: ["conference"] })).toThrow(
      "At least one Object of Study is required.",
    );
  });

  it("builds a query for one object and one call type", () => {
    expect(
      buildSearchQuery({ objects: ["video-games"], callTypes: ["conference"] }),
    ).toBe(
      '"video games" AND ("call for papers" OR "call for abstracts" OR "doctoral consortium")',
    );
  });

  it("combines multiple objects using OR", () => {
    const query = buildSearchQuery({
      objects: ["video-games", "artificial-intelligence"],
      callTypes: ["journal", "book"],
    });

    expect(query).toContain('"video games" OR "artificial intelligence" OR AI');
    expect(query).toContain('"special issue"');
    expect(query).toContain('"call for chapters"');
  });

  it("removes duplicate search phrases", () => {
    const query = buildSearchQuery({
      objects: ["film"],
      callTypes: ["conference", "journal"],
    });

    expect(query.match(/"call for papers"/g)).toHaveLength(1);
  });
});

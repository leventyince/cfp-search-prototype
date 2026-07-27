import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  searchCfps,
  type WorkerSearchPayload,
} from "../src/search/searchApi";

const fetchMock = vi.fn<typeof fetch>();

const successfulPayload: WorkerSearchPayload = {
  provider: "searxng",
  query: "call for papers digital games",
  page: 1,
  results: [
    {
      title: "Call for Papers",
      url: "https://example.edu/cfp",
      content: "A sample search result.",
    },
  ],
  suggestions: [],
  unresponsiveEngines: [],
};

function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
      },
    },
  );
}

describe("searchCfps", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("returns a valid Worker search payload", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(successfulPayload),
    );

    const result = await searchCfps({
      query:
        "call for papers digital games",
      page: 2,
    });

    expect(result).toEqual(
      successfulPayload,
    );

    expect(fetchMock).toHaveBeenCalledOnce();

    const [request, options] =
      fetchMock.mock.calls[0];

    const url = new URL(
      String(request),
    );

    expect(
      url.searchParams.get("q"),
    ).toBe(
      "call for papers digital games",
    );

    expect(
      url.searchParams.get("page"),
    ).toBe("2");

    expect(options?.method).toBe("GET");

    expect(
      new Headers(
        options?.headers,
      ).get("Accept"),
    ).toBe("application/json");
  });

  it("classifies HTTP 400 as a validation error", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: "query_too_short",
          message:
            "The search query is too short.",
        },
        400,
      ),
    );

    await expect(
      searchCfps({
        query: "x",
      }),
    ).rejects.toMatchObject({
      name: "SearchApiError",
      kind: "validation",
      status: 400,
      code: "query_too_short",
      message:
        "The search query is too short.",
    });
  });

  it("classifies HTTP 502 as an upstream error", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error:
            "upstream_network_error",
          message:
            "The search provider could not be reached.",
        },
        502,
      ),
    );

    await expect(
      searchCfps({
        query:
          "call for papers digital games",
      }),
    ).rejects.toMatchObject({
      name: "SearchApiError",
      kind: "upstream",
      status: 502,
      code:
        "upstream_network_error",
    });
  });

  it("classifies HTTP 504 as a timeout error", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: "upstream_timeout",
          message:
            "The search provider did not respond in time.",
        },
        504,
      ),
    );

    await expect(
      searchCfps({
        query:
          "call for papers digital games",
      }),
    ).rejects.toMatchObject({
      name: "SearchApiError",
      kind: "timeout",
      status: 504,
      code: "upstream_timeout",
    });
  });

  it("rejects malformed JSON responses", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        "<html>Not JSON</html>",
        {
          status: 200,
          headers: {
            "Content-Type": "text/html",
          },
        },
      ),
    );

    await expect(
      searchCfps({
        query:
          "call for papers digital games",
      }),
    ).rejects.toMatchObject({
      name: "SearchApiError",
      kind: "invalid-response",
      status: 200,
      message:
        "The search service returned unreadable data.",
    });
  });

  it("rejects unexpected JSON structures", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        provider: "searxng",
        query:
          "call for papers digital games",
        page: 1,
        results: "not-an-array",
      }),
    );

    await expect(
      searchCfps({
        query:
          "call for papers digital games",
      }),
    ).rejects.toMatchObject({
      name: "SearchApiError",
      kind: "invalid-response",
      status: 200,
      message:
        "The search service returned an unexpected response structure.",
    });
  });

  it("classifies a rejected fetch as a network error", async () => {
    fetchMock.mockRejectedValue(
      new TypeError("Failed to fetch"),
    );

    await expect(
      searchCfps({
        query:
          "call for papers digital games",
      }),
    ).rejects.toMatchObject({
      name: "SearchApiError",
      kind: "network",
      message:
        "The browser could not reach the search service.",
    });
  });

  it("aborts and reports a client-side timeout", async () => {
    vi.useFakeTimers();

    fetchMock.mockImplementation(
      (_request, options) =>
        new Promise<Response>(
          (_resolve, reject) => {
            const signal =
              options?.signal;

            if (!signal) {
              reject(
                new Error(
                  "Expected an AbortSignal.",
                ),
              );

              return;
            }

            signal.addEventListener(
              "abort",
              () => {
                const abortError =
                  new Error(
                    "The operation was aborted.",
                  );

                abortError.name =
                  "AbortError";

                reject(abortError);
              },
              { once: true },
            );
          },
        ),
    );

    const request = searchCfps({
      query:
        "call for papers digital games",
    });

    const expectation =
      expect(request).rejects.toMatchObject({
        name: "SearchApiError",
        kind: "timeout",
        message:
          "The search request took too long to complete.",
      });

    await vi.advanceTimersByTimeAsync(
      18_000,
    );

    await expectation;
  });
});
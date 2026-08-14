import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  searchSearxng,
  type SearxngEnvironment,
} from "../worker/src/searxng";

const fetchMock = vi.fn<typeof fetch>();

const env: SearxngEnvironment = {
  SEARXNG_BASE_URL:
    "https://searxng-api.leventyince.com",
  CF_ACCESS_CLIENT_ID:
    "test-client-id",
  CF_ACCESS_CLIENT_SECRET:
    "test-client-secret",
};

function searxngResponse(): Response {
  return new Response(
    JSON.stringify({
      results: [],
      suggestions: [],
      unresponsive_engines: [],
    }),
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
      },
    },
  );
}

describe("searchSearxng", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it(
    "authenticates the upstream request with Cloudflare Access",
    async () => {
      fetchMock.mockResolvedValue(
        searxngResponse(),
      );

      const result = await searchSearxng(
        env,
        {
          query:
            "call for papers video games",
          page: 2,
        },
      );

      expect(result.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledOnce();

      const [request, options] =
        fetchMock.mock.calls[0];

      const url = new URL(
        String(request),
      );

      expect(url.origin).toBe(
        "https://searxng-api.leventyince.com",
      );

      expect(url.pathname).toBe(
        "/search",
      );

      expect(
        url.searchParams.get("q"),
      ).toBe(
        "call for papers video games",
      );

      expect(
        url.searchParams.get("pageno"),
      ).toBe("2");

      expect(
        url.searchParams.get("format"),
      ).toBe("json");

      const headers = new Headers(
        options?.headers,
      );

      expect(
        headers.get("Accept"),
      ).toBe("application/json");

      expect(
        headers.get(
          "CF-Access-Client-Id",
        ),
      ).toBe("test-client-id");

      expect(
        headers.get(
          "CF-Access-Client-Secret",
        ),
      ).toBe("test-client-secret");
    },
  );

  it(
    "normalizes an Access rejection as an upstream HTTP error",
    async () => {
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "unauthorized",
          }),
          {
            status: 401,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
      );

      const result = await searchSearxng(
        env,
        {
          query:
            "call for papers design",
          page: 1,
        },
      );

      expect(result).toEqual({
        ok: false,
        status: 502,
        error: "upstream_http_error",
        message:
          "The search provider rejected or failed the request.",
        upstreamStatus: 401,
      });
    },
  );
});
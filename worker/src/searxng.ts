import type {
  ValidatedSearchRequest,
} from "./validateSearchRequest";

export interface SearxngEnvironment {
  SEARXNG_BASE_URL: string;
  CF_ACCESS_CLIENT_ID: string;
  CF_ACCESS_CLIENT_SECRET: string;
}

export interface SearxngPayload {
  results: unknown[];
  suggestions: unknown[];
  unresponsiveEngines: unknown[];
}

export type SearxngSearchResult =
  | {
      ok: true;
      value: SearxngPayload;
    }
  | {
      ok: false;
      status: 500 | 502 | 504;
      error: string;
      message: string;
      upstreamStatus?: number;
    };

const UPSTREAM_TIMEOUT_MS = 12_000;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseSearxngPayload(
  value: unknown,
): SearxngPayload | null {
  if (!isRecord(value) || !Array.isArray(value.results)) {
    return null;
  }

  return {
    results: value.results,
    suggestions: Array.isArray(value.suggestions)
      ? value.suggestions
      : [],
    unresponsiveEngines: Array.isArray(
      value.unresponsive_engines,
    )
      ? value.unresponsive_engines
      : [],
  };
}

export function buildSearxngSearchUrl(
  baseUrl: string,
  request: ValidatedSearchRequest,
): URL {
  const base = new URL(baseUrl);

  if (base.protocol !== "https:") {
    throw new Error(
      "The SearXNG upstream must use HTTPS.",
    );
  }

  const upstreamUrl = new URL("/search", base);

  upstreamUrl.searchParams.set("q", request.query);
  upstreamUrl.searchParams.set("format", "json");
  upstreamUrl.searchParams.set(
    "pageno",
    String(request.page),
  );
  upstreamUrl.searchParams.set("language", "en");
  upstreamUrl.searchParams.set(
    "categories",
    "general",
  );

  return upstreamUrl;
}

export async function searchSearxng(
  env: SearxngEnvironment,
  request: ValidatedSearchRequest,
): Promise<SearxngSearchResult> {
  let upstreamUrl: URL;

  try {
    upstreamUrl = buildSearxngSearchUrl(
      env.SEARXNG_BASE_URL,
      request,
    );
  } catch {
    return {
      ok: false,
      status: 500,
      error: "upstream_configuration_error",
      message:
        "The search provider is not configured correctly.",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "CF-Access-Client-Id":
          env.CF_ACCESS_CLIENT_ID,
        "CF-Access-Client-Secret":
          env.CF_ACCESS_CLIENT_SECRET,
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        status: 502,
        error: "upstream_http_error",
        message:
          "The search provider rejected or failed the request.",
        upstreamStatus: response.status,
      };
    }

    const contentType =
      response.headers.get("Content-Type") ?? "";

    if (
      !contentType
        .toLowerCase()
        .includes("application/json")
    ) {
      return {
        ok: false,
        status: 502,
        error: "invalid_upstream_content_type",
        message:
          "The search provider returned a non-JSON response.",
      };
    }

    let rawPayload: unknown;

    try {
      rawPayload = await response.json();
    } catch {
      return {
        ok: false,
        status: 502,
        error: "invalid_upstream_json",
        message:
          "The search provider returned malformed JSON.",
      };
    }

    const payload = parseSearxngPayload(rawPayload);

    if (payload === null) {
      return {
        ok: false,
        status: 502,
        error: "invalid_upstream_payload",
        message:
          "The search provider returned an unexpected data structure.",
      };
    }

    return {
      ok: true,
      value: payload,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      return {
        ok: false,
        status: 504,
        error: "upstream_timeout",
        message:
          "The search provider did not respond in time.",
      };
    }

    console.error(
      "SearXNG upstream request failed.",
      error,
    );

    return {
      ok: false,
      status: 502,
      error: "upstream_network_error",
      message:
        "The search provider could not be reached.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
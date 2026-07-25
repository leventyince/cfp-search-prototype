const DEFAULT_SEARCH_API_URL =
  "https://cfp-search-proxy.leventyince.workers.dev/search";

const CLIENT_TIMEOUT_MS = 18_000;

export type SearchApiErrorKind =
  | "configuration"
  | "validation"
  | "upstream"
  | "timeout"
  | "network"
  | "invalid-response";

export class SearchApiError extends Error {
  constructor(
    public readonly kind: SearchApiErrorKind,
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "SearchApiError";
  }
}

export interface WorkerSearchPayload {
  provider: string;
  query: string;
  page: number;
  results: unknown[];
  suggestions: unknown[];
  unresponsiveEngines: unknown[];
}

interface SearchCfpsOptions {
  query: string;
  page?: number;
  signal?: AbortSignal;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readString(
  value: unknown,
): string | undefined {
  return typeof value === "string"
    ? value
    : undefined;
}

function parseSuccessPayload(
  value: unknown,
): WorkerSearchPayload | null {
  if (
    !isRecord(value) ||
    typeof value.provider !== "string" ||
    typeof value.query !== "string" ||
    typeof value.page !== "number" ||
    !Array.isArray(value.results)
  ) {
    return null;
  }

  return {
    provider: value.provider,
    query: value.query,
    page: value.page,
    results: value.results,
    suggestions: Array.isArray(value.suggestions)
      ? value.suggestions
      : [],
    unresponsiveEngines: Array.isArray(
      value.unresponsiveEngines,
    )
      ? value.unresponsiveEngines
      : [],
  };
}

function createResponseError(
  status: number,
  value: unknown,
): SearchApiError {
  const payload = isRecord(value)
    ? value
    : {};

  const code = readString(payload.error);
  const message =
    readString(payload.message) ??
    "The search service returned an error.";

  if (
    status === 403 &&
    code === "origin_not_allowed"
  ) {
    return new SearchApiError(
      "configuration",
      message,
      status,
      code,
    );
  }

  if (status === 400) {
    return new SearchApiError(
      "validation",
      message,
      status,
      code,
    );
  }

  if (
    status === 504 ||
    code === "upstream_timeout"
  ) {
    return new SearchApiError(
      "timeout",
      message,
      status,
      code,
    );
  }

  if (status >= 500) {
    return new SearchApiError(
      "upstream",
      message,
      status,
      code,
    );
  }

  return new SearchApiError(
    "network",
    message,
    status,
    code,
  );
}

export async function searchCfps({
  query,
  page = 1,
  signal,
}: SearchCfpsOptions): Promise<WorkerSearchPayload> {
  const configuredUrl =
    import.meta.env.VITE_SEARCH_API_URL?.trim() ||
    DEFAULT_SEARCH_API_URL;

  let url: URL;

  try {
    url = new URL(configuredUrl);
  } catch {
    throw new SearchApiError(
      "configuration",
      "The frontend search endpoint is not configured correctly.",
    );
  }

  url.searchParams.set("q", query);
  url.searchParams.set(
    "page",
    String(page),
  );

  const controller = new AbortController();
  let timedOut = false;

  const forwardAbort = () => {
    controller.abort();
  };

  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener(
      "abort",
      forwardAbort,
      { once: true },
    );
  }

  const timeoutId = globalThis.setTimeout(
    () => {
      timedOut = true;
      controller.abort();
    },
    CLIENT_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    let rawPayload: unknown;

    try {
      rawPayload = await response.json();
    } catch {
      throw new SearchApiError(
        "invalid-response",
        "The search service returned unreadable data.",
        response.status,
      );
    }

    if (!response.ok) {
      throw createResponseError(
        response.status,
        rawPayload,
      );
    }

    const payload =
      parseSuccessPayload(rawPayload);

    if (payload === null) {
      throw new SearchApiError(
        "invalid-response",
        "The search service returned an unexpected response structure.",
        response.status,
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof SearchApiError) {
      throw error;
    }

    if (signal?.aborted) {
      throw error;
    }

    if (timedOut) {
      throw new SearchApiError(
        "timeout",
        "The search request took too long to complete.",
      );
    }

    throw new SearchApiError(
      "network",
      "The browser could not reach the search service.",
    );
  } finally {
    globalThis.clearTimeout(timeoutId);

    signal?.removeEventListener(
      "abort",
      forwardAbort,
    );
  }
}
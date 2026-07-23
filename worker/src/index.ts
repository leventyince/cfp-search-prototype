import {
  addCorsHeaders,
  createCorsHeaders,
  isOriginAllowed,
  type CorsEnvironment,
} from "./cors";
import { validateSearchRequest } from "./validateSearchRequest";

interface Env extends CorsEnvironment {}

const BASE_JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

function jsonResponse(
  body: unknown,
  status = 200,
  additionalHeaders: HeadersInit = {},
): Response {
  const headers = new Headers(BASE_JSON_HEADERS);
  const extraHeaders = new Headers(additionalHeaders);

  extraHeaders.forEach((value, key) => {
    headers.set(key, value);
  });

  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers,
  });
}

function handleOptionsRequest(
  origin: string | null,
  env: Env,
): Response {
  if (!isOriginAllowed(origin, env.ALLOWED_ORIGINS)) {
    return jsonResponse(
      {
        error: "origin_not_allowed",
        message: "This origin is not permitted to access the service.",
      },
      403,
    );
  }

  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(origin),
  });
}

function routeRequest(request: Request): Response {
  const url = new URL(request.url);

  if (url.pathname === "/health") {
    return jsonResponse({
      status: "ok",
      service: "cfp-search-proxy",
    });
  }

  if (url.pathname === "/") {
    return jsonResponse({
      message: "CFP search proxy is running.",
      endpoints: {
        health: "/health",
        search: "/search?q=SEARCH_QUERY&page=1",
      },
    });
  }

  if (url.pathname === "/search") {
    const validation = validateSearchRequest(url);

    if (!validation.ok) {
      return jsonResponse(
        {
          error: validation.error,
          message: validation.message,
        },
        validation.status,
      );
    }

    return jsonResponse(
      {
        status: "not_implemented",
        message:
          "Search request validation passed. SearXNG forwarding is not implemented yet.",
        request: {
          query: validation.value.query,
          page: validation.value.page,
        },
      },
      501,
    );
  }

  return jsonResponse(
    {
      error: "not_found",
      message: "The requested endpoint does not exist.",
    },
    404,
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const originAllowed = isOriginAllowed(
      origin,
      env.ALLOWED_ORIGINS,
    );

    if (request.method === "OPTIONS") {
      return handleOptionsRequest(origin, env);
    }

    if (origin !== null && !originAllowed) {
      return jsonResponse(
        {
          error: "origin_not_allowed",
          message: "This origin is not permitted to access the service.",
        },
        403,
      );
    }

    if (request.method !== "GET") {
      const response = jsonResponse(
        {
          error: "method_not_allowed",
          message: "Only GET and OPTIONS requests are accepted.",
        },
        405,
        {
          Allow: "GET, OPTIONS",
        },
      );

      return originAllowed
        ? addCorsHeaders(response, origin)
        : response;
    }

    const response = routeRequest(request);

    return originAllowed
      ? addCorsHeaders(response, origin)
      : response;
  },
} satisfies ExportedHandler<Env>;
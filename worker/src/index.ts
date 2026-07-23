interface Env {}

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

function jsonResponse(
  body: unknown,
  status = 200,
  additionalHeaders: HeadersInit = {},
): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...additionalHeaders,
    },
  });
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method !== "GET") {
      return jsonResponse(
        {
          error: "method_not_allowed",
          message: "Only GET requests are accepted.",
        },
        405,
        {
          allow: "GET",
        },
      );
    }

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
        },
      });
    }

    return jsonResponse(
      {
        error: "not_found",
        message: "The requested endpoint does not exist.",
      },
      404,
    );
  },
} satisfies ExportedHandler<Env>;
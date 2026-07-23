export interface CorsEnvironment {
  ALLOWED_ORIGINS: string[];
}

const ACCESS_CONTROL_METHODS = "GET, OPTIONS";
const ACCESS_CONTROL_HEADERS = "Accept, Content-Type";
const ACCESS_CONTROL_MAX_AGE = "86400";

export function isOriginAllowed(
  origin: string | null,
  allowedOrigins: string[],
): origin is string {
  return origin !== null && allowedOrigins.includes(origin);
}

export function createCorsHeaders(origin: string): Headers {
  const headers = new Headers();

  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", ACCESS_CONTROL_METHODS);
  headers.set("Access-Control-Allow-Headers", ACCESS_CONTROL_HEADERS);
  headers.set("Access-Control-Max-Age", ACCESS_CONTROL_MAX_AGE);
  headers.set("Vary", "Origin");

  return headers;
}

export function addCorsHeaders(
  response: Response,
  origin: string,
): Response {
  const headers = new Headers(response.headers);
  const corsHeaders = createCorsHeaders(origin);

  corsHeaders.forEach((value, key) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
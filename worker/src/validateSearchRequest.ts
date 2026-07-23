export interface ValidatedSearchRequest {
  query: string;
  page: number;
}

export type SearchValidationResult =
  | {
      ok: true;
      value: ValidatedSearchRequest;
    }
  | {
      ok: false;
      status: 400;
      error: string;
      message: string;
    };

const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 1500;
const MIN_PAGE = 1;
const MAX_PAGE = 5;

const ALLOWED_PARAMETERS = new Set(["q", "page"]);

function validationError(
  error: string,
  message: string,
): SearchValidationResult {
  return {
    ok: false,
    status: 400,
    error,
    message,
  };
}

export function validateSearchRequest(
  url: URL,
): SearchValidationResult {
  for (const parameter of url.searchParams.keys()) {
    if (!ALLOWED_PARAMETERS.has(parameter)) {
      return validationError(
        "unsupported_parameter",
        `The parameter "${parameter}" is not supported.`,
      );
    }
  }

  const queryValues = url.searchParams.getAll("q");

  if (queryValues.length !== 1) {
    return validationError(
      "invalid_query_parameter",
      'Provide exactly one "q" parameter.',
    );
  }

  const query = queryValues[0].replace(/\s+/g, " ").trim();

  if (query.length < MIN_QUERY_LENGTH) {
    return validationError(
      "query_too_short",
      `The search query must contain at least ${MIN_QUERY_LENGTH} characters.`,
    );
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return validationError(
      "query_too_long",
      `The search query must not exceed ${MAX_QUERY_LENGTH} characters.`,
    );
  }

  const pageValues = url.searchParams.getAll("page");

  if (pageValues.length > 1) {
    return validationError(
      "invalid_page_parameter",
      'Provide no more than one "page" parameter.',
    );
  }

  const rawPage = pageValues[0] ?? "1";
  const page = Number(rawPage);

  if (
    !Number.isInteger(page) ||
    page < MIN_PAGE ||
    page > MAX_PAGE
  ) {
    return validationError(
      "invalid_page",
      `Page must be a whole number from ${MIN_PAGE} to ${MAX_PAGE}.`,
    );
  }

  return {
    ok: true,
    value: {
      query,
      page,
    },
  };
}
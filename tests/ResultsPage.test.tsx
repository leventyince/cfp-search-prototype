import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  MemoryRouter,
} from "react-router";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  ResultsPage,
} from "../src/pages/ResultsPage";
import {
  SearchApiError,
  searchCfps,
  type WorkerSearchPayload,
} from "../src/search/searchApi";

vi.mock(
  "../src/search/searchApi",
  async () => {
    const actual =
      await vi.importActual<
        typeof import("../src/search/searchApi")
      >("../src/search/searchApi");

    return {
      ...actual,
      searchCfps: vi.fn(),
    };
  },
);

const mockedSearchCfps =
  vi.mocked(searchCfps);

const successfulPayload: WorkerSearchPayload = {
  provider: "searxng",
  query:
    '"video games" AND "call for papers"',
  page: 1,
  results: [
    {
      title:
        "Call for Papers: Game Studies 2027",
      url: "https://digra.org/call-for-papers",
      content:
        "A conference call concerning video games and game studies.",
    },
  ],
  suggestions: [],
  unresponsiveEngines: [],
};

function renderResultsPage() {
  return render(
    <MemoryRouter
      initialEntries={[
        "/results?objects=video-games&types=conference,journal,book",
      ]}
    >
      <ResultsPage />
    </MemoryRouter>,
  );
}

describe("ResultsPage live-search states", () => {
  beforeEach(() => {
    mockedSearchCfps.mockReset();
  });

  it("renders the loading state while the request is pending", () => {
    mockedSearchCfps.mockImplementation(
      () =>
        new Promise<WorkerSearchPayload>(
          () => {
            // Intentionally unresolved.
          },
        ),
    );

    renderResultsPage();

    expect(
      screen.getByText(
        "Searching the live CFP backend…",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Searching live sources…",
      ),
    ).toBeInTheDocument();
  });

  it("renders normalized live results after a successful request", async () => {
    mockedSearchCfps.mockResolvedValue(
      successfulPayload,
    );

    renderResultsPage();

    expect(
      await screen.findByRole(
        "heading",
        {
          name: "Call for Papers: Game Studies 2027",
        },
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText("1 live results"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Open source",
      }),
    ).toHaveAttribute(
      "href",
      "https://digra.org/call-for-papers",
    );
  });

  it("renders the empty-results state", async () => {
    mockedSearchCfps.mockResolvedValue({
      ...successfulPayload,
      results: [],
    });

    renderResultsPage();

    expect(
      await screen.findByText(
        "No live results were returned for this search.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Search again",
      }),
    ).toBeInTheDocument();
  });

  it.each([
    {
      label: "validation error",
      error: new SearchApiError(
        "validation",
        "The search query is invalid.",
        400,
        "invalid_query_parameter",
      ),
      detail:
        "Error type: validation · invalid_query_parameter",
    },
    {
      label: "upstream error",
      error: new SearchApiError(
        "upstream",
        "The search provider could not be reached.",
        502,
        "upstream_network_error",
      ),
      detail:
        "Error type: upstream · upstream_network_error",
    },
    {
      label: "network error",
      error: new SearchApiError(
        "network",
        "The browser could not reach the search service.",
      ),
      detail: "Error type: network",
    },
    {
      label: "timeout error",
      error: new SearchApiError(
        "timeout",
        "The search request took too long to complete.",
        504,
        "upstream_timeout",
      ),
      detail:
        "Error type: timeout · upstream_timeout",
    },
  ])(
    "renders the $label state",
    async ({ error, detail }) => {
      mockedSearchCfps.mockRejectedValue(
        error,
      );

      renderResultsPage();

      const alert =
        await screen.findByRole(
          "alert",
        );

      expect(alert).toHaveTextContent(
        "The search could not be completed.",
      );

      expect(alert).toHaveTextContent(
        error.message,
      );

      expect(alert).toHaveTextContent(
        detail,
      );

      expect(
        screen.getByRole("button", {
          name: "Try again",
        }),
      ).toBeInTheDocument();
    },
  );

  it("retries the request after an upstream failure", async () => {
    mockedSearchCfps
      .mockRejectedValueOnce(
        new SearchApiError(
          "upstream",
          "The search provider failed.",
          502,
          "upstream_http_error",
        ),
      )
      .mockResolvedValueOnce(
        successfulPayload,
      );

    renderResultsPage();

    expect(
      await screen.findByRole(
        "alert",
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Try again",
      }),
    );

    expect(
      await screen.findByRole(
        "heading",
        {
          name: "Call for Papers: Game Studies 2027",
        },
      ),
    ).toBeInTheDocument();

    expect(
      mockedSearchCfps,
    ).toHaveBeenCalledTimes(2);
  });
});
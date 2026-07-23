# Claude implementation instructions

## Project objective

Build a lightweight CFP vertical-search prototype. The current repository contains the visual scaffold and deterministic search configuration. Live search will use a Cloudflare Worker proxy to a SearXNG JSON endpoint.

## Non-negotiable scope

Do not add:

- a database;
- a crawler or scheduled collection pipeline;
- authentication;
- saved searches;
- paid services;
- AI-generated semantic search;
- unverified deadline extraction.

## Architecture boundaries

- The browser must call a `SearchProvider` abstraction, never a public SearXNG instance directly.
- Search selections are stored in the URL.
- Multiple Objects of Study use OR logic.
- At least one object and one call type are required.
- Only display metadata supplied by SearXNG or inferred conservatively.
- Never label a result as verified.
- Use `Retrieved on`, not `Last verified`.

## Design rules

- Preserve the dark charcoal, pale-grey, turquoise, monospaced visual system.
- Category differences must use text labels as well as color.
- Keep keyboard focus states visible.
- Result snippets are limited to three lines in collapsed cards.
- Desktop result layout may use two columns; mobile must use one.
- Do not introduce a conventional navigation header.

## Working method

For every task:

1. Modify only explicitly permitted files.
2. Run `npm run typecheck`, `npm test`, and `npm run build`.
3. Report commands and failures exactly.
4. Do not hide failing tests or loosen TypeScript strictness.

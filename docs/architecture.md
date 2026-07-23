# Prototype architecture

```text
React + TypeScript + Vite frontend
                |
                v
Cloudflare Worker restricted proxy (next task)
                |
                v
Public SearXNG JSON endpoint
```

## Current batch

The frontend is implemented against representative mock results so layout and interaction can be evaluated before connecting an unstable public search provider.

## Routing

Hash routing is used for reliable GitHub Pages deployment without a custom 404 rewrite. Search selections are represented by query parameters.

## Future provider boundary

The live-search task will introduce:

```ts
interface SearchProvider {
  search(request: SearchRequest): Promise<SearchResponse>;
}
```

No component should know the SearXNG upstream URL.

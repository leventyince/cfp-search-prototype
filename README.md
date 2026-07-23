# CFP Search Tool Prototype

A lightweight vertical-search interface for finding academic calls for papers, journal submissions, and book chapters by selected Objects of Study.

## Current implementation status

This first implementation batch includes:

- React + TypeScript + Vite scaffold;
- Tailwind CSS v4 integration;
- three routes matching the supplied wireframes;
- the 21-item Objects of Study configuration;
- conference, journal, and book call-type controls;
- shareable search state in the URL;
- deterministic query construction;
- representative mock result cards;
- responsive and accessible base styling;
- initial unit tests;
- GitHub Pages deployment workflow.

Live SearXNG search and the Cloudflare Worker proxy are intentionally deferred to the next bounded task.

## Local setup

Requirements:

- Node.js 22 or newer
- npm 10 or newer

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

## Routes

Because the initial deployment target is GitHub Pages, the prototype uses hash routing:

```text
/#/
/#/results?objects=video-games&types=conference,journal,book
/#/results/mock-games-memory?objects=video-games&types=conference,journal,book
```

## Search behavior

- At least one Object of Study is required.
- Multiple selected objects are combined using OR.
- Call-type terms are combined using OR.
- The object group and call-type group are combined using AND.
- Obvious lexical variants are configured in `src/config/objects.ts`.

## Wireframes

The supplied design references are stored under `docs/wireframes/`.

# Design handoff

## Source wireframes

- `wireframes/landing-page.png`
- `wireframes/results-page.png`
- `wireframes/result-detail-page.png`

## Visual system

- Charcoal application field
- Pale-grey interactive tiles and cards
- Turquoise accent and focus affordances
- Monospaced typographic character
- Minimal or absent navigation

## Necessary prototype adaptation

The original result wireframes contain structured fields such as deadline, verification date, location, delivery mode, fees, and eligibility. The live SearXNG prototype cannot supply those reliably.

The first implementation therefore displays only:

- title;
- domain and known source label;
- search-result snippet;
- inferred category;
- matched Object-of-Study labels;
- source classification;
- retrieval date;
- source URL.

Rich structured fields remain reserved for a later enrichment layer.

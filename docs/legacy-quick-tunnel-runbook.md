# Legacy Quick Tunnel backend

> **Legacy fallback only.**
>
> The CFP Search Prototype no longer uses this backend during normal
> operation. The public prototype now uses the persistent school-hosted
> SearXNG backend through a protected named Cloudflare Tunnel.
>
> Do not run the legacy automation without reviewing it first. It predates
> the Cloudflare Access service-token configuration used by the current
> Worker.

## Current backend

The normal runtime architecture is:

```text
GitHub Pages
→ Cloudflare Worker
→ Cloudflare Access Service Auth
→ named Cloudflare Tunnel
→ school Ubuntu server
→ SearXNG + Valkey
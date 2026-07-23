# Cloudflare Worker proxy

The Worker will be implemented in the next bounded task. Its purpose is to proxy browser requests to a public SearXNG JSON endpoint while:

- allowing only approved frontend origins;
- accepting only supported query parameters;
- forcing `format=json`;
- limiting query length and page number;
- preventing arbitrary upstream URLs;
- returning normalized errors;
- keeping the upstream SearXNG instance configurable.

The frontend currently uses representative mock results so its structure and interaction can be reviewed independently of the live provider.

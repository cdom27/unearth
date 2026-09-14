# Unearth

Unearth is an AI-assisted news analysis platform. It uses verified third-party data (Media Bias Fact Check and Allsides source ratings) alongside a rhetorical examination of an individual article's narrative, framing, sentiment, biases, and more. In addition, Exa AI's web search is used to fact check critical claims made within the article and provide external sources that verify or refute the claim.

## v2

The original implementation was a Vite + React frontend served from an Express backend in a monorepo. While functional, the dev setup had accumulated enough friction that iteration was slower than I'd like.

The MVP rewrite moves to Next.js primarily to reduce overhead as managing two services in parallel meant more time on infrastructure and less on the product itself. Collapsing the frontend and backend into a single project lets me move faster and focus on what I most care about: the UI and user experience. SSR is a secondary benefit, giving shareable analysis URLs proper metadata and HTML responses without additional configuration.

Changes coming to v2.1:

- [ ] Separate JSONB columns into tables (summary, framing, analysis, meta) for easier queries.
- [x] Cache breaking news and store them in the articles, or a new unprocessed table.
- [ ] Incorporate unanalyzed, or otherwise incomplete, articles in the discover page behind a filter.
- [ ] Authenticated users can analyze more than 1 article at a time.
- [ ] Admin interface for managing articles (for now: batch processing, logs).

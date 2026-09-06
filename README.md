# Unearth

A civic intelligence tool

## v2

The original implementation was a Vite + React frontend served from an Express backend in a monorepo. While functional, the dev setup had accumulated enough friction that iteration was slower than I'd like.

The MVP rewrite moves to Next.js primarily to reduce overhead as managing two services in parallel meant more time on infrastructure and less on the product itself. Collapsing the frontend and backend into a single project lets me move faster and focus on what I most care about: the UI and user experience. SSR is a secondary benefit, giving shareable analysis URLs proper metadata and HTML responses without additional configuration.

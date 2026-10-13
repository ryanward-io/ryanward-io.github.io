# Cleanup notes

Running log of quirks found while modernising the site. Status: `open` (not yet fixed), `fixed`, or `decision` (needs a call).

## Open / decisions
- **open** `_posts/2023-03-02-statistical-quirks.md`: Cross Validated link is written backwards as `(text)[url]`, so it renders as raw text.
- **decision** `_posts/2024-03-15-forecasting-review.md`: filename date is 2024-03-15 but front matter says `date: 2024-05-15` (the post also says it was originally written in 2022). The URL currently uses 05-15. Pick the right date; the old URL redirects either way.
- **open** `_posts/2025-07-01-misogyny-youth.md`: category is `geospatial`, which looks wrong.
- **open** Categories `sexualconsent` and `sexualassault` look like the same topic; unify.
- **open** `collections/_notebooks/2021-15-30-reading-text-with-python-and-tesseract.ipynb`: invalid month (15) in filename. Notebooks directory is unused by the build.
- **open** Alt text: `![png]` in the yoy-variance and active-users posts; stray quote in the NPS post.
- **open** `2025-07-01-esex-law.md` has several `http://` links (some probably dead); BOM link in the yoy post.
- **open** Posts have no `description`, so `og:description` falls back to the site description.
- **open** Post footer "Follow me on Github" link looks faintly styled (Phase 4 check).
- **open** `collections/_drafts` has two empty/untracked drafts (ignored for now at your request).

## Fixed
- `baseurl` held a full URL, corrupting sitemap, robots.txt and canonical links.
- Dead MathJax CDN replaced with MathJax 3; `mathjax: true` removed from posts without equations.
- jQuery and Font Awesome CDN removed; icons are inline SVGs.
- `flicker.js` (About page) had a latent syntax error caused by whitespace compression (missing semicolons); fixed and moved inside `<body>`.
- Posts moved from `collections/_posts` to `_posts`; permalink changed to `/:year/:month/:day/:title/`, with `redirect_from` on every post for the old URL.
- Stray `package.json` created in the repo root by the Playwright setup command was removed (Playwright lives in `~/.pw`).

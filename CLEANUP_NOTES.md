# Cleanup notes

Running log of quirks found while modernising the site. Status: `open` (not yet fixed), `fixed`, or `decision` (needs a call).

## Open / decisions
- **open** `collections/_notebooks/2021-15-30-reading-text-with-python-and-tesseract.ipynb`: invalid month (15) in filename. The directory is unused by the build.
- **open** Dead/unverified links in `2025-07-01-esex-law.md`: `dailylife.com.au` article no longer resolves (domain gone); `bom.gov.au` and `austlii.edu.au` links return 403 to bots so I couldn't verify them; the Palgrave link is a 2015 product page that now redirects somewhere generic. Consider archive.org links.
- **open** The Excel post (`2020-10-12-yoy-variance-chart-excel.md`) alt text was written from the surrounding text, not from viewing the images; worth a glance.
- **open** Post footer "Follow me on Github" link looks faintly styled (Phase 4 check).
- **open** `collections/_drafts` has two untracked drafts (ignored for now at your request).
- **open** `categories` no longer affect URLs, only the keywords meta tag; consider dropping or switching to `tags`.
- **open** Your WIP parenting post (`_posts/2025-11-10-parenting-and-social-media.md`) is untracked; its `redirect_from` points at the old `/collections/...` URL, which is harmless but unneeded since it was never published at that URL. Remove it before publishing.

## Fixed
- `baseurl` held a full URL, corrupting sitemap, robots.txt and canonical links.
- Dead MathJax CDN replaced with MathJax 3; `mathjax: true` removed from posts without equations.
- jQuery and Font Awesome CDN removed; icons are inline SVGs.
- `flicker.js` (About page) had a latent syntax error caused by whitespace compression (missing semicolons); fixed and moved inside `<body>`.
- Posts moved from `collections/_posts` to `_posts`; permalink changed to `/:year/:month/:day/:title/`, with `redirect_from` on every post for the old URL.
- Stray `package.json` created in the repo root by the Playwright setup command was removed (Playwright lives in `~/.pw`).
- Forecasting review date set to 2024-03-15 (matches filename); old 05-15 URLs redirect.
- `statistical-quirks`: backwards Cross Validated link fixed.
- `misogyny-youth` category (`geospatial`) and `esex-law` category (`sexualconsent`) changed to `sexualassault`.
- Alt text added/fixed in the yoy-Excel, active-users and NPS posts.
- `http://` links upgraded to `https://` in `esex-law` and the Excel post (except dead dailylife link).
- `og:description` now falls back to the post `summary` (all posts have one), so no per-post `description` needed.

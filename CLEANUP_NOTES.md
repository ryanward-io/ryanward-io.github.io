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

- **open** Sass deprecations are silenced in `_config.yml` (theme uses `@import`, `darken()` and global builtins). Migrate to `@use`/`color.adjust` before Dart Sass 3.0 removes them.
- **open** `/feed.xml` is now an Atom feed (jekyll-feed) instead of hand-written RSS 2.0; same URL, subscribers should be unaffected.

- **open** Heading order: posts jump from the page `h1` straight to `###` (16 posts); fix by demoting/promoting headings in the posts or shifting levels in the layout.
- **open** `empty-table-header` in the active-users post (pandas index column) and `link-in-text-block` in `sql-with` and `copright-law-ai` (links only distinguished by colour).
- **open** `{:target="_blank"}` is used in some post bodies without `rel="noopener"`; modern browsers imply it, so low priority.
- **open** The sitemap lists three `screencapture-fromlawtodata-*.pdf` files in `images/post-feature-photos/` (Phase 5 deletes them).
- **decision** Email (`wardyryan1@gmail.com`) is rendered in plain text in the footer and nav; left as is at your request.

- **open** Post images have no `width`/`height` attributes (markdown images), so the page can shift as they load; add per-image dimensions if it bothers you.
- **open** `.git` is ~43 MB because old CatBoost docs live in history; rewriting history would shrink it but changes every commit hash. Not worth it unless you care.
- **open** `collections/_notebooks` (Jupyter sources for some posts) is excluded from the build; keep as source or move out of the repo.

## Fixed
- `baseurl` held a full URL, corrupting sitemap, robots.txt and canonical links.
- Dead MathJax CDN replaced with MathJax 3; `mathjax: true` removed from posts without equations.
- jQuery and Font Awesome CDN removed; icons are inline SVGs.
- About-page screen "flicker" easter egg (`flicker.js`, `flicker: true`) removed; it was unintended. It had also been silently broken by a compression-related syntax error until Phase 1 accidentally revived it.
- Posts moved from `collections/_posts` to `_posts`; permalink changed to `/:year/:month/:day/:title/`, with `redirect_from` on every post for the old URL.
- Stray `package.json` created in the repo root by the Playwright setup command was removed (Playwright lives in `~/.pw`).
- Forecasting review date set to 2024-03-15 (matches filename); old 05-15 URLs redirect.
- `statistical-quirks`: backwards Cross Validated link fixed.
- `misogyny-youth` category (`geospatial`) and `esex-law` category (`sexualconsent`) changed to `sexualassault`.
- Alt text added/fixed in the yoy-Excel, active-users and NPS posts.
- `http://` links upgraded to `https://` in `esex-law` and the Excel post (except dead dailylife link).
- `og:description` now falls back to the post `summary` (all posts have one), so no per-post `description` needed.
- Moved to Jekyll 4.4 + GitHub Actions (build on every push/PR, deploy on `main`); removed the stale `github-pages` gem pin (Jekyll 3.9.2, 2022).
- Removed dead config options (bing/animated/related posts/ajax contact form/anchorjs/extended fonts/unused social handles/share flags/redcarpet).
- Local Ruby upgraded to 3.3.12 via rbenv (matches CI); `jekyll-sass-converter` pin removed, so Dart Sass is used.
- SEO: `{% seo %}` (jekyll-seo-tag) replaces hand-rolled meta tags: canonical, Open Graph, Twitter card, JSON-LD, default share image; `<html lang="en">`; post `summary` front matter renamed `description`.
- Privacy: Muli font self-hosted (`/fonts`), no more Google Fonts requests; placeholder GA/GTM/Facebook snippets removed (re-add analytics deliberately if wanted).
- Accessibility (axe-core sweep of every page): valid nav list markup with `aria-current`, working active nav state, footer link nesting and invalid `alt`, headshot/404 image alts, blog heading levels, colour contrast (post meta, code syntax colours), keyboard-focusable scrolling code blocks, PDF embed fallback.
- Inline `<style>` blocks in footer, post layout and about page moved into SCSS; footer now wraps on narrow screens instead of overlapping.
- Phase 5: removed dead `js/`, unused CSS, includes, layouts and logos, and the unreferenced `images/post-feature-photos/` (~7 MB incl. three PDFs); site images dropped from 9.8 MB to ~2.7 MB.
- Largest images converted to WebP (heatmap 606 KB to 59 KB, man-up poster 424 KB to 55 KB, etc.); headshot resized to 500px wide (175 KB to 65 KB). All post images and the avatar are lazy-loaded via the post layout.

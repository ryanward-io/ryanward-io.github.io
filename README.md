# ryanward-io.github.io

My website.

Gratefully derived from the [_Junior_](https://github.com/thundergolfer/junior-theme) theme as designed and developed by [@jonobelotti_IO](https://twitter.com/jonobelotti_IO), which in turn builds on [basscss](https://basscss.com).

## Local development

Needs Ruby 2.7+ and Bundler (CI uses Ruby 3.3). `Gemfile` pins `jekyll-sass-converter` 2.x (sassc) so it installs on older Rubies too.

```bash
bundle config set --local path vendor/bundle   # optional: keep gems in the repo folder
bundle install
bundle exec jekyll serve --livereload          # http://localhost:4000
bundle exec jekyll build                       # one-off build into _site/
```

Always use `bundle exec`; plain `jekyll` can pick up mismatched system gems.

## Writing posts

Add `_posts/YYYY-MM-DD-slug.md` with `layout: post`, `title`, `summary` (used for the social description) and optionally `mathjax: true` for equations (`$$...$$` or `\(...\)`). URLs are `/YYYY/MM/DD/slug/`.

## Deployment

Pushing to `main` builds the site with GitHub Actions (`.github/workflows/pages.yml`) and deploys it to GitHub Pages. Other branches and pull requests only build, so you can check a change compiles before merging. Pages must be set to **Settings → Pages → Source: GitHub Actions**.

To roll back, `git revert` the bad commit and push.

## Adding small projects

Anything in a plain folder at the repo root without front matter is copied as-is, so a static demo placed in `projects/rag/` is served at `/projects/rag/`. For a project with a build step (Vite, etc.), keep its source in its own folder, add a step to the workflow that builds it and copies the output into `projects/<name>/` before the Jekyll build (there is a commented example), and the output is published alongside the blog. Demos that need a server must call an API hosted elsewhere, since GitHub Pages only serves static files.

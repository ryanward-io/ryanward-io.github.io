# Project ideas and handoff notes

Written 2026-10-17 (updated the same day after the bank categoriser and the Projects launch) so a fresh session can carry on without the earlier conversation.
Not published (excluded in `_config.yml`). Companion files: `CLEANUP_NOTES.md` (log of site fixes),
`README.md` (how the site works), `_data/projects.yml` (the cards on the hidden `/projects/` page).
Claude's memory for this repo (`~/.claude/projects/-home-rward-projects-ryanward-io-github-io/memory/`)
also holds working preferences.

## 1. Goal and constraints

- Ryan (blog at https://ryanward.dev, GitHub user `ryanward-io`) wants small projects that **demonstrate he can build
  things**: LLM, RAG, agentic, JEV, finance, LSTM, and so on.
- **Budget: $5-10 a month at most for all projects combined.** Traffic will be low. Realistic spend is $0-2 with hard caps.
- **Each project lives in its own repo.** This repo stays mostly the blog; `/projects/` links to the repos and live demos.
- Not a goal: a mixed market model. The old advertising app was a plain regression walkthrough and never claimed to be one.

## 2. Status at a glance

| Project | Status | Needs a server/API? | Cost | Next step |
| --- | --- | --- | --- | --- |
| Advertising spend explorer | **Live** | No (Streamlit in the browser via stlite) | $0 | Enable HTTPS enforcement on its Pages settings; archive the old repo |
| Bank transaction categoriser | **Live** | No (stlite) | $0 | Optional blog post; reuse its labelled data for the JEV benchmark |
| LSTM forecasting | Planned | No | $0 | Pick a dataset; train offline; ship results or an ONNX/TF.js model |
| Ask my blog (RAG) | Planned | Yes (small serverless backend + LLM API) | cents/month with caps | Build the retrieval pipeline and eval set first |
| JEV (TypeSafe AI) | Planned, blocked on access | Yes (their hosted API) | tiny | Join the early-access waitlist; ask about public demo terms |
| Agentic | Planned | No if replayed (recorded traces) | $0 | Choose a task; record traces |
| LLM | Idea only (not on the public page) | Probably | caps | Decide what it is |
| Finance | Covered by the bank categoriser | n/a | n/a | Add another finance idea only if wanted |

## 3. Project details

### Advertising spend explorer (live)
- Repo https://github.com/ryanward-io/advertising-spend-explorer, demo https://ryanward.dev/advertising-spend-explorer/.
- Port of Ryan's 2021 Streamlit app (old repo `ryanward-io/streamlit-advertising`, not archived yet) to **stlite**
  (Streamlit on Pyodide), so it is static files on GitHub Pages: `index.html` mounts `streamlit_app.py` with
  `@stlite/browser@1.11.0` from jsDelivr, bundles `Advertising.csv` (ISLR dataset, not covered by the MIT licence), no backend.
- Changes from the original: `st.cache_data`, bundled CSV (runtime fetch fails on CORS), sliders limited to the data range,
  fixed random seed, no fake delay, `$` escaped in markdown (`\$`, otherwise Streamlit renders pairs as maths), toolbar hidden via
  `streamlitConfig: {"client.toolbarMode": "viewer"}`.
- First load takes about 20 s while Python and scikit-learn download.

### Bank transaction categoriser (live)
- Repo https://github.com/ryanward-io/bank-transaction-categoriser, demo https://ryanward.dev/bank-transaction-categoriser/. Rebuild of the 2019 `bankclassifier` project
  as a scikit-learn pipeline in a stlite app: try-it box with examples, model/feature pickers, accuracy vs the "always guess Food" baseline, confusion matrix,
  a small expander on why it scores unseen descriptions, and a 15-combination comparison. Ryan asked to **play down the history of the original's inflated split**
  (keep that to one short note; don't write about the old repo's mistake in the app, README or cards).
- Data: `data/transactions.csv` is a **sanitised** sample (description, category, count) produced by `tools/sanitise.py`; the raw file is not in the repo (see the decision log).

### LSTM forecasting (planned)
- Train offline on Ryan's machine; publish results as JSON or run a small exported model in the browser (ONNX Runtime Web or
  TensorFlow.js). No server. Make it interactive (choose a horizon, see predictions against actuals).

### Ask my blog: RAG (planned)
- Idea: an AI on the site that answers questions, like https://thundergolfer.com/infinite-ama. That page is a static React chat UI
  (hosted on GitHub Pages) that POSTs `{text, history}` to a serverless backend on Modal and gets `{answer}` back. Ryan's would have the same shape.
- **Make it genuinely RAG:** retrieve chunks of the blog posts, answer only from them, and **show citations** (links to posts).
  "Answers like me" with no retrieval is only a persona prompt.
- Honest framing: the blog has about 38 posts (roughly 40k words), which fits in a single prompt. The demo shows the pipeline
  (chunking, embeddings, retrieval, citations, "I don't know" behaviour, a small evaluation set), not scale. Say so on the page.
- Sensitive posts (sexual assault, politics, the kids): answer from the posts only, label it as an AI, avoid speaking "as Ryan" on sensitive topics.
- Suggested architecture: a build-time script in the repo chunks the posts and writes embeddings to a JSON file; a serverless function
  (Cloudflare Workers, Modal or similar) loads it, does cosine search in memory (no vector DB at this size), sends the best chunks to Claude
  (a small model such as Haiku; check current model IDs and pricing in the Anthropic docs), returns the answer and sources. Front end is a plain
  page in its own repo. The API key lives only in the backend.
- Possible tie-in: use JEV (below) as the router/guardrail ("is this question in scope?", "is the answer supported by the sources?").

### JEV (planned, blocked on access)
- JEV is a hosted commercial "System One" model from TypeSafe AI: https://typesafe.ai/blog/introducing-system-one-models-and-jev.
  Text in, **typed probabilistic decisions out** (classification, routing, scoring, extraction, guardrails); it does not generate free text.
  Per their post: 70-500 ms responses, input about $0.042 per million tokens, output free, early access via waitlist, no open weights,
  no stated licence or public-demo terms. Their speed/cost/accuracy claims (193x faster, 444x cheaper, "can't hallucinate") are self-reported
  and their evals were built by their own team; treat them as claims to test.
- Earlier guess that "JEV" was the JEPA video-model family was wrong.
- Demo idea: pick one small task with known ground-truth answers (e.g. routing or classifying questions), run JEV and a small LLM side by side,
  and publish **Ryan's own measured** speed, cost and accuracy table. Key stays in a backend function; rate-limit it.
- To do: apply for early access, and ask TypeSafe whether a public demo is allowed.

### Agentic (planned)
- Free approach: record a few real agent runs and **replay** them step by step in the page (each tool call and decision visible).
  Optionally add a rate-limited "run live" button later.

### LLM and Finance (planned, scope undecided)
- Ryan listed `/LLM` and `/finance` but hasn't said what they are. Ask before building. Finance is likely to be offline and free.

## 4. Hosting patterns

- **Static or in-browser demos (preferred, $0):** a repo with GitHub Pages enabled from `main` (root) is served at
  `https://ryanward.dev/<repo>/` because the account's user site has the custom domain. Create it with:
  `gh repo create ryanward-io/<name> --public --source . --push`, then enable Pages with a **JSON body**
  (`echo '{"build_type":"legacy","source":{"branch":"main","path":"/"}}' | gh api -X POST repos/ryanward-io/<name>/pages --input -`;
  `-f` flags fail with a 422). The path is `/<repo>/`, not `/projects/<name>/`.
- **If the `/projects/<name>/` prefix is wanted:** the blog's workflow (`.github/workflows/pages.yml`) has a commented spot to check out
  or build a project and copy its output into the Jekyll tree before the build. Needs a scheduled or dispatched rebuild to stay current.
- **Backends:** GitHub Pages is static only, so anything calling an LLM needs an external serverless function (Cloudflare Workers, Modal,
  Vercel, Fly; all have free tiers, verify current limits).
- **Streamlit apps:** run in the browser with stlite, or link to Streamlit Community Cloud (free, sleeps when idle).

## 5. Keeping API projects cheap and safe

1. A hard monthly spend limit on the provider key (e.g. $5 in the Anthropic console; verify how workspace limits work).
2. Per-visitor rate limiting plus a global daily cap in the backend, so one bad day cannot spend the month.
3. Short maximum answer length, small/cheap models, prompt caching where it applies.
4. Only accept requests from `https://ryanward.dev`; optionally Cloudflare Turnstile (free) if bots appear.
5. Never put keys in the page. Free alternatives: replay recorded runs, bring-your-own-key, or an in-browser model (WebLLM).

## 6. Checklist for a new project

1. New repo `ryanward-io/<name>` with README (what it shows, how it runs, limits, data licences), LICENSE (MIT for code), and a
   description that says what it demonstrates.
2. Build and test locally, then test the **live URL** in a browser (Playwright; see section 8).
3. Add or update its card in `_data/projects.yml` (`demo`, `repo`, optional `post` links; status `live`).
4. Keep a short blog post for the interesting ones and link it from the card.
5. Update this file and `CLEANUP_NOTES.md` if something about the site changes.

## 7. State of the site (2026-10-17)

- https://ryanward.dev: Jekyll 4.4 on GitHub Pages via **GitHub Actions** (`.github/workflows/pages.yml`: builds on every push/PR, deploys from `main`).
  HTTPS is enforced for the main site. Ruby 3.3.12 via rbenv (`.ruby-version`), Dart Sass with `@use`.
- Post URLs are `/YYYY/MM/DD/slug/`; old `/collections/...` URLs redirect via `jekyll-redirect-from`. SEO via `jekyll-seo-tag`; feed via `jekyll-feed` (Atom).
- Dark mode (system preference plus a toggle in the nav; colours in `_sass/_dark.scss`), axe-core clean in both themes.
- `/projects/` is **live** (launched 2026-10-17): in the nav, indexed, in the sitemap. Cards come from `_data/projects.yml`, live ones first; planned ones show as a roadmap.
- Roadtrip post (`_posts/2026-10-15-atto-3-roadtrip.md`) has an interactive map plus battery chart (`_includes/trip-replay.html`,
  `assets/trip-replay/trip-replay.js`, data built by `scripts/build_trip.py`; MapLibre + OpenFreeMap tiles; defaults to 2x speed). A tightened draft
  of the post is in `collections/_drafts/2026-10-15-atto-3-roadtrip-tightened.md` (untracked, not built).
- Rollback tags exist on GitHub: `pre-phase-1` to `pre-phase-5`, `pre-sass-migration`, `pre-projects-page`, `pre-dark-mode`.
- **Ryan's untracked work in progress:** `_posts/2025-11-10-parenting-and-social-media.md` and `collections/_drafts/`. Never stage or publish these.

## 8. Dev tooling and verification

- Local build: `bundle exec jekyll build` (always `bundle exec`). In a non-interactive shell add `export PATH="$HOME/.rbenv/shims:$PATH"`.
- Dev server: `nohup scripts/qa/serve.sh &` (port 4000). Stop it with `fuser -k 4000/tcp` (**never `pkill -f`**, it kills the calling shell).
- Playwright and axe-core live in `~/.pw` (outside the repo). Setup if missing:
  `mkdir -p ~/.pw && cd ~/.pw && npm init -y && npm i playwright axe-core && npx playwright install chromium`.
- `node scripts/qa/smoke.js` (home icons, maths, old-URL redirects, blog links, all images) and `node scripts/qa/axe-sweep.js [light|dark]`
  (axe over every page; no output means clean). Set `BASE=https://ryanward.dev` to run the smoke test against the live site.
  MapLibre needs WebGL in headless Chromium: launch with `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
- After pushing: wait for the Actions run to finish (`gh run list`), then check the live URL. `gh` is authenticated (credential helper set up).
- `gh run list` on this machine's `gh` has no `--branch` flag; filter by commit SHA with `--json headSha,status,conclusion`.

## 9. Working preferences

- **Never `git add` a directory**; stage explicit files or `git add -u` (Ryan keeps unfinished work untracked here).
- Pushing to `main` deploys. Pushing is allowed without asking if rollback is easy (tags, `git revert`; no force-push or history rewrites without asking).
- Ryan wants to eyeball the site every few commits; prompt him after meaningful changes.
- Decisions already made: keep git history as is, keep the email address in plain text, keep the Melbourne map pin, no analytics for now,
  `.git` size left alone, mixed-market-model references removed.
- Git author email is `wardyryan1@gmail.com` (set globally).

## 10. Suggested next steps

1. **Privacy action for Ryan:** the old public repo `ryanward-io/bankclassifier` (and its git history) still contains the raw transaction sample with real-looking
   BSB/account numbers, phone numbers, names and personal memos. Consider making it private or deleting it; I did not touch it.
2. Archive `streamlit-advertising` and `bankclassifier` (the new repos replace them).
3. Apply for JEV early access (the waitlist is the slow part).
4. Build LSTM (free, offline) as the next live card, then RAG.
5. Decide what `/LLM` should be (currently not on the public page).
6. Optional: a short blog post about the bank categoriser's leaky-evaluation lesson; Search Console property for ryanward.dev.

## 11. Candidates from old GitHub repos (reviewed 2026-10-17)

Reviewed all 38 repos under `ryanward-io`. Worth porting, in order:

1. **`bankclassifier` -> a "Bank transaction categoriser" (finance + ML).** 2019 scikit-learn project that classifies bank transaction
   descriptions (ING data) into 14 categories, comparing vectorisers (count/tf-idf) and models (naive Bayes variants, random forest, decision tree).
   Ships a labelled set `transactions_train_public.csv` (1,088 rows, appears anonymised: "Transfer to Jane Doe"; **re-check for personal data before republishing**).
   - Port: modernise into a pipeline (`TfidfVectorizer` + a simple model), run in the browser with stlite (like the advertising explorer) so visitors can type a
     transaction and see the predicted category and confidence, plus the model-comparison chart.
   - Fix while porting: only 407 distinct descriptions across 1,088 rows, so the original random split leaks duplicates into the test set and overstates accuracy.
     Evaluate with deduplicated or grouped splits and report that honestly (the classes are also imbalanced).
   - Bonus: it is a ready-made labelled classification task for the **JEV** benchmark (classic ML vs small LLM vs JEV on accuracy, cost and latency).
2. **`vic_building_data` -> "What does an apartment cost to build in Melbourne?" (housing data).** Four notebooks on Victorian Building Authority permit data
   (download -> clean -> analysis). The analysis tests a working assumption ($420k base x 1.3 plus $120k demolition) against reported permit costs: median about
   $550k, number of storeys explains little (R-squared about 11%), conclusion "no evidence to update the assumption". Honest negative results are a strength.
   - Port: refresh with current VBA data, drop the unfinished join notebook (notebook 4), publish precomputed interactive charts (static, $0) with the cleaning
     steps documented; link to the data source and **check the VBA data licence/attribution**. Fits Ryan's housing-abundance interests and the geopandas posts.
3. **Optional quick win: `birthday_problem`.** Two tiny scripts; an in-browser simulation with sliders (group size vs probability) takes an hour and
   complements the existing blog post on the birthday paradox. Low prestige, high polish-per-hour.

Not recommended: forks (`geopandas`, `junior-theme`, `css-exercises`, `LinkedIn-posts-Scrapper`, `project-euler-solutions`);
`council-meeting-agenda-scraper` (fork of yimbymelbourne's project, Ryan has one upstream commit, so it is someone else's work);
tutorial or exercise repos (`freeCodeCamp-projects`, `odin-recipes`, `flask-blog`, `flaskcalculator`, `BasicTicTacToe-ReactJS`, `node-docker-testing`,
`go_learning`, `project-euler`, `eda-wine`); course work (`data_science_course`, `statistical-learning`, `R-forecasting`); dead (`AusPost-API`: the API was discontinued);
duplicates of blog posts (`year-on-year-variance`, `charting`, `ocr`; they already have write-ups); hosting copies (`catboost-docs`); websites that look like they were built
for others (`yao-pages`, `athena-landing-page`). Consider archiving the clearly obsolete ones so the profile shows the good work.

## 12. Decision log (2026-10-17, made without asking; review when convenient)

Bank transaction categoriser:
1. **Name/location:** repo `ryanward-io/bank-transaction-categoriser`, served at `ryanward.dev/bank-transaction-categoriser/` (own repo, Pages from `main`).
2. **Did not reuse the original dataset as is.** The public `transactions_train_public.csv` was not safe to republish: it holds real-looking BSB/account numbers, phone numbers,
   names, initials and personal free-text memos. I published a sanitised, de-duplicated sample instead (246 distinct descriptions, 881 transactions) and kept the raw file out of the repo.
   Rules are in `tools/sanitise.py`: drop person-to-person and memo-like lines, a few possibly-personal merchants (e.g. "MOLLY DENE", a church), dates; employer salary lines made generic.
3. **No relabelling** of Ryan's labels (noise stays and is documented: "Food" is a catch-all, some taxis are labelled Food). Ties between conflicting labels were dropped.
4. **Evaluation:** 5-fold cross-validation over distinct descriptions (seed 0) is the headline; the original-style random split of expanded rows is shown only to explain the inflated 97%.
5. **Default model:** logistic regression (one-vs-rest, liblinear) on word TF-IDF: as accurate as the alternatives (about 83%) and fast in the browser. Character TF-IDF is available.
6. **Licence:** MIT for code and the sanitised data. stlite pinned to 1.11.0.
7. **HTTPS:** enabled "Enforce HTTPS" on the new repo and also on `advertising-spend-explorer` (it was off).

Projects page launch:
8. Added "Projects" as the fourth nav item; removed `noindex` and the sitemap exclusion.
9. **Removed the vague placeholder cards** "LLM experiments" and "Finance" from the public page (Finance is now covered by the bank categoriser; LLM stays in these notes). Kept the concrete planned cards
   (LSTM, Ask my blog, JEV, Agentic) as a visible roadmap. Review whether you want planned items public, in particular the JEV one, since TypeSafe has not agreed to a demo.
10. Live cards are listed first.

Not done: no changes to the old repos; no blog post for the new project; `collections/_drafts` and the parenting post remain untracked and unpublished.


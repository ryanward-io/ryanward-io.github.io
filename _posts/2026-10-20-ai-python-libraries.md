---
layout: post
title: AI is fixing bugs
date: 2026-10-20
description: What a few years of commits and release notes say about AI and the data science stack.
---

Everyone has an opinion on whether AI helps with coding. I've found it increasingly useful in my work, particularly from the end of last year. I was interested in how much AI is actually influencing the development of the data science libraries I use every day. So I went and had a look. 

Short version: many of them are fixing a lot more bugs, but they're not shipping more features.

I pulled five years of git history, release notes and pull request stats for Python itself and fifteen of the big data science libraries - NumPy, pandas, scikit-learn, PyTorch, matplotlib, SciPy, Polars and friends.[^method] Python 3.15 came out on 9 October, so I used the Python releases from 3.10 (October 2021) onwards as a ruler against major AI releases: Copilot, ChatGPT, GPT-4, Claude Code, GPT-5, the Claude 5 family and last month's GPT-6 Astra.

## Nothing, then a lot

{% include chart.html src="/assets/charts/ai-python-libraries/ai-commits.json" %}

For four Python releases there isn't a trace. Across sixteen projects, just one commit from 2021 to early 2025 credits an AI tool (a pandas fix co-written by the Devin agent in August 2024). Copilot, ChatGPT and GPT-4 came and went without leaving a mark. That doesn't mean nobody used them - autocomplete and copy-pasting from a chat window leave no fingerprints - but a human was still writing every change.

Then the agents arrived. Claude Code adds a `Co-authored-by: Claude` line to commits by default, and from mid-2025 those lines start appearing. CPython had none in 3.10 to 3.13, one in 3.14, 192 in 3.15, and 15% of all commits so far in the 3.16 cycle. In pandas it's 70% of last quarter's commits. New models get picked up almost instantly: every Claude release since April has turned up in these repos within a day.

Those lines only show AI that announces itself, but most tools don't.

## More fixes, not more features

{% include chart.html src="/assets/charts/ai-python-libraries/release-notes.json" %}

If agents made everyone twice as productive, you'd expect more of everything. That's not what the release notes say. Comparing releases built since October 2025 with releases built in 2022-24, per month of development:

- **Features haven't gone up.** It's a mixed bag - SciPy and PyTorch are shipping more, NumPy, Polars and scikit-learn less. Where features fell, most of the drop came in 2024, after big releases like NumPy 2.0 and Polars 1.0 and before agents took off.
- **Fixes are way up at half of them.** pandas is listing roughly three times as many bug fixes a month, PyTorch and scikit-learn about twice as many, and CPython nearly 40% more. NumPy, transformers, Polars and the smaller dask and LightGBM are listing fewer.

Python's own changelog shows the split clearly:

{% include chart.html src="/assets/charts/ai-python-libraries/cpython-changelog.json" %}

New features have hovered between 30 and 70 a quarter for five years. Bug fixes crept up slowly, then jumped to about 165 a quarter in mid-2026. pandas 3.1 isn't even out yet and already lists 629 bug fixes.

Counting commits alone undersells this. Several projects aren't landing many more commits, but each one is bigger. NumPy is landing 15% fewer commits a quarter than in 2022-24 but changing 52% more lines (some of that is one maintainer's typing overhaul), and PyTorch's typical commit grew from 36 lines to 54. A lot of the growth is tests, which you'd expect from agents that write a test with every fix.

## Who's doing it

The existing maintainers.

In pandas, nearly all of the AI-credited commits come from one long-time core developer. In CPython, 324 of 371 come from one core developer, Serhiy Storchaka. And they're clearing old backlogs: 27% of CPython's AI-credited commits fix bugs reported before 2022, against 6% of its other commits. In pandas it's 17% against 1% for issues more than five years old.

That tracks with how I've seen agents work best. A maintainer who knows the code points an agent at a years-old bug report with a reproducer, checks the fix and merges it. It's well-specified, boring work - often too hard for a new volunteer as well.

## The flood of pull requests

{% include chart.html src="/assets/charts/ai-python-libraries/prs.json" %}

The other place output exploded is pull requests. CPython received 92% more in July to September than a year earlier, and NumPy and SciPy more than doubled. For most projects merges rose too: pandas merged 177% more, NumPy 112% more and CPython 79% more (in pandas, much of that is the core developer's own AI-assisted fixes). The exceptions are scikit-learn and transformers, where merges fell by about a quarter to a third, JAX, which was flat, and dask, which has gone quiet since mid-2026 - it got twice as many PRs and merged just 10 of them. More got turned away too - the share of PRs closed without merging jumped at scikit-learn (from about 20% to 46% at its peak), matplotlib and NumPy.

Maintainers have been blunt about it. scikit-learn's maintainers [wrote in February](https://probabl.substack.com/p/maintaining-open-source-in-the-age) that "at times almost every second issue on our main repo gets at least one such message", and that "a contribution should be worth more to the project than the time it takes to review it." Most of the big scientific Python projects now have an AI policy, and several have an `AGENTS.md` file telling agents what not to do - pandas' tells them not to open pull requests at all. Early in 2026, matplotlib even had an autonomous agent [publish a blog post accusing a maintainer of "gatekeeping"](https://theshamblog.com/an-ai-agent-published-a-hit-piece-on-me/) after its pull request was closed.

## Cool, I guess?

AI hasn't made Python's data science stack build more (yet). It's made a handful of experienced maintainers much better at working through years of bug reports, and made it much cheaper for everyone else to send pull requests that someone has to review.

Bug backlogs used to grow and grow and grow. Nobody was fixing a five-year-old edge case for fun. Agents can now clear this tech debt, the bane of all software, quickly and cheaply.

I don't think we're far from agents alone doing the technical review, with a human only deciding whether a feature is worth having. The tricky part will be ensuring libraries don't malignantly grow with thousands of niche, low-value functions, bloating the API and making it painful to use. People can monkey-patch a method for their weird use case - that doesn't mean it needs to be a PR.

[^method]: I ran a Claude Opus 5.5 agent to clone the repositories, gather pull-request and issue counts from GitHub, parse every release note and help create the charts. I wrote the content with Claude helping edit. The libraries are CPython, NumPy, SciPy, pandas, scikit-learn, matplotlib, PyTorch, CatBoost, XGBoost, LightGBM, Polars, Hugging Face transformers, JAX, statsmodels, seaborn and dask.

    - **Commits:** each main branch since 2021, minus bots and merge commits. Projects count commits differently, so each is only compared with itself.
    - **AI credit:** a `Co-authored-by:` line naming an AI tool, or an agent account. Claude Code adds one by default and most tools don't, so this undercounts and skews towards Claude.
    - **Release notes:** features and fixes listed in each feature release, divided by the months since the one before. Patch releases are left out because they mostly repeat fixes.
    - **Baseline:** 2022-24, after ChatGPT but before coding agents were widespread. 2026 isn't over, so it's compared per quarter or per month of development.

---
layout: post
title: AI is fixing bugs
date: 2026-10-20
description: What a few years of commits and release notes say about AI and the data science stack.
---

Everyone has an opinion on whether AI helps with coding. I've found it increasingly useful in my work, particularly from the end of last year. I was interested in how much AI is actually influencing the development of the data science libraries I use every day. So I went and had a look. 

Short version: many of them are fixing a lot more bugs, but they're not shipping more features.

I pulled five years of git history, release notes and pull request stats for Python itself and fifteen of the big data science libraries - NumPy, pandas, scikit-learn, PyTorch, matplotlib, SciPy, Polars and friends.[^method] Python 3.15 came out on 9 October, so I used the Python releases from 3.10 (October 2021) onwards as a ruler against major AI releases: Copilot, ChatGPT, GPT-4, Claude Code, GPT-5, the Claude 5 family and last month's GPT-6 Astra.

## AI starts showing up around Opus 4.6

{% include chart.html src="/assets/charts/ai-python-libraries/ai-commits.json" %}

For four Python releases there's basically no trace. Across sixteen projects, just one commit from 2021 to early 2025 credits an AI tool - a pandas fix co-written by the Devin agent in August 2024. People were definitely using Copilot and ChatGPT, but autocomplete and copy-pasting from a chat window don't leave anything behind in the commit history.

Everything changed when the agents ~~attacked~~ started committing their own code. Claude Code adds a `Co-authored-by: Claude` line by default, and from mid-2025 those lines start appearing. The big jump came the month after Claude Opus 4.6 in February 2026, and it spread to PyTorch and CPython after Opus 4.8 in late May. CPython went from none in 3.10 to 3.13 to 192 in 3.15, and 15% (364) of all commits so far in the 3.16 cycle. In pandas it's 70% of last quarter's commits. New models get picked up almost instantly too - every Claude release since April has turned up in these repos within a day.

The real numbers are higher as those lines only show AI that announces itself, and most tools don't.

## Are they getting more done?

{% include chart.html src="/assets/charts/ai-python-libraries/release-notes.json" %}

You'd hope agents mean more of everything, but the release notes don't really show that. Comparing releases built since October 2025 with ones built in 2022-24, per month of development:

- **Features haven't gone up.** SciPy and PyTorch are shipping more; NumPy, Polars and scikit-learn less. Most of that drop came in 2024 after big releases like NumPy 2.0 and Polars 1.0 (before agents took off), presumably because their main APIs were largely complete by then.
- **Fixes are way up at about half of them.** pandas is listing roughly three times as many bug fixes a month and PyTorch and scikit-learn about twice as many, with CPython and SciPy up a bit too. The other five are listing fewer.

{% include chart.html src="/assets/charts/ai-python-libraries/cpython-changelog.json" %}

Python's own changelog is the clearest example. New features have sat between 30 and 70 a quarter for five years, while bug fixes crept up slowly and then jumped to about 165 a quarter in mid-2026. pandas 3.1 isn't even out yet and already lists 629 bug fixes, more than twice as many as any previous pandas release.

I also wondered whether commit counts were hiding something, and they are a bit. Several projects aren't landing many more commits, but each one is bigger - NumPy is landing fewer commits than in 2022-24 but changing about half as many lines again. A lot of that is tests, which makes sense: agents tend to write a test with every fix, where humans often skip them or write thinner ones.

## Who's actually using it

Mostly the existing maintainers, not newcomers. In pandas, nearly all of the AI-credited commits come from one long-time core developer, and in CPython 324 of 371 come from Serhiy Storchaka. They're using it to clear old backlogs - over a quarter of CPython's AI-credited commits fix bugs reported before 2022, against 6% of its other commits.

That tracks with how I've seen agents work best. Someone who knows the code points an agent at a years-old bug report with a reproducer, checks the fix and merges it. It's tedious and often too hard for a new volunteer anyway.

## And then the pull requests

{% include chart.html src="/assets/charts/ai-python-libraries/prs.json" %}

The other big change is pull requests. CPython got 92% more in July to September than a year earlier, and NumPy and SciPy more than doubled. Merges mostly went up too (in pandas, a lot of that is the core developer's own AI-assisted fixes), but not everywhere - scikit-learn and transformers merged less, and dask, which has gone quiet since mid-2026, merged just 10 of the 103 it got. The share being closed without merging also jumped at scikit-learn, matplotlib and NumPy.

Some maintainers are blunt about it. scikit-learn's maintainers [wrote in February](https://probabl.substack.com/p/maintaining-open-source-in-the-age) that "at times almost every second issue on our main repo gets at least one such message", and that "a contribution should be worth more to the project than the time it takes to review it." I think that second line is a pretty good rule for any project. Most of the big scientific Python projects now have an AI policy, and several have an `AGENTS.md` file telling agents what not to do - pandas' tells them not to open pull requests at all. And early in 2026 matplotlib had an autonomous agent [publish a blog post accusing a maintainer of "gatekeeping"](https://theshamblog.com/an-ai-agent-published-a-hit-piece-on-me/) after its pull request was closed, which is funny and just weird.

## Cool, I guess?

AI hasn't made Python's data science stack build more (yet). It's made a handful of experienced maintainers much better at working through years of bug reports, and made it much cheaper for everyone else to send pull requests that someone has to review.

Bug backlogs used to grow and grow and grow. Nobody was fixing a five-year-old edge case for fun. Agents can now clear this tech debt, the bane of all software, quickly and cheaply.

I don't think we're far from agents alone doing the technical review, with a human only deciding whether a feature is worth having. The tricky part will be ensuring libraries don't malignantly grow with thousands of niche, low-value functions, bloating the API and making it painful to use. People can monkey-patch a method for their weird use case - that doesn't mean it needs to be a PR.

[^method]: I ran a Claude Opus 5.5 agent to clone the repositories, gather pull-request and issue counts from GitHub, parse every release note and help create the charts. I wrote the content with Claude helping edit. The libraries are CPython, NumPy, SciPy, pandas, scikit-learn, matplotlib, PyTorch, CatBoost, XGBoost, LightGBM, Polars, Hugging Face transformers, JAX, statsmodels, seaborn and dask.

    - **Commits:** each main branch since 2021, minus bots and merge commits. Projects count commits differently, so each is only compared with itself.
    - **AI credit:** a `Co-authored-by:` line naming an AI tool, or an agent account. Claude Code adds one by default and most tools don't, so this undercounts and skews towards Claude.
    - **Release notes:** features and fixes listed in each feature release, divided by the months since the one before. Patch releases are left out because they mostly repeat fixes.
    - **Baseline:** 2022-24, after ChatGPT but before coding agents were widespread. 2026 isn't over, so it's compared per quarter or per month of development.

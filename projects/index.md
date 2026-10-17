---
layout: default
title: Projects
description: Small projects and demos by Ryan Ward.
permalink: /projects/
---

<h1>Projects</h1>

<p>Small projects and demos. Each one lives in its own repository.</p>

<div class="project-grid">
  {% for project in site.data.projects %}
  <article class="project-card">
    <header>
      <h2 class="project-title">{{ project.title }}</h2>
      <span class="project-status project-status-{{ project.status }}">{{ project.status | capitalize }}</span>
    </header>
    <p class="project-summary">{{ project.summary }}</p>
    {% if project.tags %}
    <ul class="project-tags">
      {% for tag in project.tags %}<li>{{ tag }}</li>{% endfor %}
    </ul>
    {% endif %}
    {% if project.demo or project.repo or project.post %}
    <p class="project-links">
      {% if project.demo %}<a href="{{ project.demo }}">Live demo</a>{% endif %}
      {% if project.post %}<a href="{{ project.post | relative_url }}">Write-up</a>{% endif %}
      {% if project.repo %}<a href="{{ project.repo }}" target="_blank" rel="noopener">Code on GitHub</a>{% endif %}
    </p>
    {% endif %}
  </article>
  {% endfor %}
</div>

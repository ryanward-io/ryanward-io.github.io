#!/usr/bin/env node
// Accessibility sweep: runs axe-core over the home page, About, Blog, 404 and every post.
//   scripts/qa/serve.sh &            (dev server on :4000)
//   node scripts/qa/axe-sweep.js [light|dark]
// Needs Playwright + axe-core installed in ~/.pw:
//   mkdir -p ~/.pw && cd ~/.pw && npm init -y && npm i playwright axe-core && npx playwright install chromium
// Prints only violations; no output at all means clean.
const { chromium } = require(process.env.HOME + "/.pw/node_modules/playwright");
const axeSrc = require("fs").readFileSync(process.env.HOME + "/.pw/node_modules/axe-core/axe.min.js", "utf8");
const scheme = process.argv[2] === "dark" ? "dark" : "light";
const base = process.env.BASE || "http://localhost:4000";

(async () => {
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await (await browser.newContext({ colorScheme: scheme, viewport: { width: 1000, height: 800 } })).newPage();
  await page.goto(base + "/blog");
  const posts = await page.locator("a.post-link").evaluateAll((a) => a.map((x) => x.getAttribute("href")));
  const found = {};
  for (const url of ["/", "/about", "/blog", "/projects/", "/404.html", ...posts]) {
    await page.goto(base + url);
    await page.waitForTimeout(url.includes("roadtrip") ? 4000 : 300); // let the map settle
    await page.evaluate(axeSrc);
    const result = await page.evaluate(() => axe.run());
    for (const v of result.violations) (found[v.id] = found[v.id] || []).push(url + "(" + v.nodes.length + ")");
  }
  for (const [id, pages] of Object.entries(found)) console.log(scheme, id, pages.length, "pages:", pages.slice(0, 6).join(" "));
  await browser.close();
})();

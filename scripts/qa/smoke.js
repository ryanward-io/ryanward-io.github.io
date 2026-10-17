#!/usr/bin/env node
// Smoke test against the dev server (or BASE=https://ryanward.dev): home icons, a maths post renders,
// old /collections/... URLs redirect, every blog link returns 200 and every image on the site loads.
const { chromium } = require(process.env.HOME + "/.pw/node_modules/playwright");
const base = process.env.BASE || "http://localhost:4000";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERR " + e.message));
  await page.goto(base + "/");
  console.log("home social icons:", await page.locator(".social-icons svg").count(), "(expect 3)");
  await page.goto(base + "/2023/03/02/statistical-quirks/");
  await page.waitForTimeout(3000);
  console.log("maths rendered:", await page.locator("mjx-container").count(), "(expect 4)");
  await page.goto(base + "/collections/statistics/2023/03/02/statistical-quirks/");
  await page.waitForTimeout(1500);
  console.log("old URL redirects to:", page.url().replace(base, ""));
  await page.goto(base + "/blog");
  const links = await page.locator("a.post-link").evaluateAll((a) => a.map((x) => x.getAttribute("href")));
  let bad = 0, images = 0;
  for (const link of links) {
    const r = await page.request.get(base + link);
    if (r.status() !== 200) { bad++; console.log("BAD", link, r.status()); }
  }
  for (const url of ["/", "/about", ...links]) {
    await page.goto(base + url);
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } });
    await page.waitForTimeout(300);
    const imgs = await page.evaluate(() => [...document.images].map((i) => ({ s: i.src, ok: i.complete && i.naturalWidth > 0 })));
    images += imgs.length;
    imgs.filter((i) => !i.ok).forEach((i) => { bad++; console.log("BROKEN IMG", url, i.s); });
  }
  console.log(links.length, "blog links,", images, "images checked, problems:", bad, "| page errors:", errors);
  await browser.close();
})();

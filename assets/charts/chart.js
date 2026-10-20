/* Small interactive SVG charts for posts. Usage: {% include chart.html src="/assets/charts/<post>/<name>.json" %}
   Chart types (set "type" in the JSON): "bars-time" (one series over time, with event markers),
   "line" (two series over time, crosshair tooltip) and "hbar-grouped" (two series per category, % change).
   Colours come from CSS variables in _includes/chart.html, so dark mode only swaps the variables. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function svg(tag, attrs, cls) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (cls) e.setAttribute("class", cls);
    return e;
  }
  function text(parent, x, y, str, cls, anchor) {
    var t = svg("text", { x: x, y: y, "text-anchor": anchor || "start" }, cls);
    t.textContent = str;
    parent.appendChild(t);
    return t;
  }
  function niceTicks(lo, hi, n) {
    var span = hi - lo || 1, step = Math.pow(10, Math.floor(Math.log10(span / n)));
    var err = (n * step) / span;
    if (err <= 0.15) step *= 10; else if (err <= 0.35) step *= 5; else if (err <= 0.75) step *= 2;
    var ticks = [];
    for (var v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
    return ticks;
  }
  function fmt(v, spec) {
    if (spec.format === "pct") return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v) + "%";
    return v.toLocaleString("en-AU");
  }
  function monthLabel(x) {
    var m = /^(\d{4})-(\d\d)$/.exec(x);
    if (m) return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+m[2] - 1] + " " + m[1];
    var q = /^(\d{4})Q(\d)$/.exec(x);
    if (q) return ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"][+q[2] - 1] + " " + q[1];
    return x;
  }

  function Chart(root, spec) {
    this.root = root;
    this.spec = spec;
    root.innerHTML = "";
    root.appendChild(el("p", "ch-title", spec.title));
    if (spec.series.length > 1) {
      var lg = el("p", "ch-legend");
      spec.series.forEach(function (s, i) {
        var item = el("span", "ch-legend-item");
        item.appendChild(el("span", "ch-swatch ch-s" + (i + 1)));
        item.appendChild(document.createTextNode(s.name));
        lg.appendChild(item);
      });
      root.appendChild(lg);
    }
    this.wrap = el("div", "ch-wrap");
    root.appendChild(this.wrap);
    this.tip = el("div", "ch-tip");
    this.tip.setAttribute("role", "status");
    this.wrap.appendChild(this.tip);
    if (spec.note) root.appendChild(el("p", "ch-note", spec.note));
    root.appendChild(this.table());
    var self = this, last = 0;
    this.draw();
    if (window.ResizeObserver) {
      new ResizeObserver(function () {
        var w = self.wrap.clientWidth;
        if (Math.abs(w - last) > 4) { last = w; self.draw(); }
      }).observe(this.wrap);
    }
  }

  Chart.prototype.table = function () {
    var spec = this.spec, d = el("details", "ch-data");
    d.appendChild(el("summary", null, "Show the data"));
    var t = el("table"), head = el("tr");
    head.appendChild(el("th", null, spec.type === "hbar-grouped" ? "" : "Period"));
    spec.series.forEach(function (s) { head.appendChild(el("th", null, s.name)); });
    var thead = el("thead"); thead.appendChild(head); t.appendChild(thead);
    var tb = el("tbody");
    spec.data.forEach(function (r) {
      var tr = el("tr");
      tr.appendChild(el("td", null, r.label || monthLabel(r.x)));
      spec.series.forEach(function (s) {
        var v = fmt(r[s.key], spec) + (r[s.key + "Tip"] ? " (" + r[s.key + "Tip"] + ")" : "");
        tr.appendChild(el("td", null, v));
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    d.appendChild(t);
    return d;
  };

  Chart.prototype.showTip = function (html, x, y) {
    var tip = this.tip, W = this.wrap.clientWidth;
    tip.innerHTML = html;
    tip.style.display = "block";
    var tw = tip.offsetWidth, left = x + 14;
    if (left + tw > W) left = Math.max(0, x - tw - 14);
    tip.style.left = left + "px";
    tip.style.top = Math.max(0, y - 10) + "px";
  };
  Chart.prototype.hideTip = function () { this.tip.style.display = "none"; };

  Chart.prototype.draw = function () {
    var old = this.wrap.querySelector("svg");
    if (old) this.wrap.removeChild(old);
    var W = Math.max(280, this.wrap.clientWidth || 640);
    this.narrow = W < 520;
    var s = this["draw_" + this.spec.type.replace("-", "_")](W);
    this.wrap.insertBefore(s, this.tip);
  };

  // Shared time axis for bars-time and line
  Chart.prototype.timeFrame = function (W, H, m, maxY) {
    var spec = this.spec, n = spec.data.length;
    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img", "aria-label": spec.title });
    var iw = W - m.l - m.r, ih = H - m.t - m.b;
    var x = function (i) { return m.l + (i + 0.5) * (iw / n); };
    var y = function (v) { return m.t + ih - (v / maxY) * ih; };
    niceTicks(0, maxY, this.narrow ? 3 : 4).forEach(function (v) {
      s.appendChild(svg("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }, "ch-grid"));
      text(s, m.l - 6, y(v) + 4, v.toLocaleString("en-AU"), "ch-axis", "end");
    });
    var step = this.narrow ? 2 : 1;
    spec.data.forEach(function (r, i) {
      var yr = r.x.slice(0, 4), first = i === 0 || spec.data[i - 1].x.slice(0, 4) !== yr;
      if (first && (+yr % step === 0 || !step)) text(s, x(i), H - m.b + 16, yr, "ch-axis", "start");
    });
    var idx = {};
    spec.data.forEach(function (r, i) { idx[r.x] = i; });
    var narrow = this.narrow, shown = 0;
    (spec.events || []).forEach(function (ev) {
      if (!(ev.x in idx) || (narrow && !ev.key)) return;
      var ex = x(idx[ev.x]);
      s.appendChild(svg("line", { x1: ex, x2: ex, y1: m.t - 4, y2: m.t + ih }, "ch-event"));
      shown += 1;
      var row = (shown - 1) % 3;
      var fits = ex + 4 + ev.label.length * 6.2 < W - 2;
      text(s, fits ? ex + 4 : ex - 4, m.t - 30 + row * 13, ev.label, "ch-event-label", fits ? "start" : "end");
    });
    (spec.marks || []).forEach(function (mk) {
      if (!(mk.x in idx) || narrow) return;
      var mx = x(idx[mk.x]);
      s.appendChild(svg("line", { x1: mx, x2: mx, y1: m.t + ih - 6, y2: m.t + ih }, "ch-mark"));
      text(s, mx, m.t + ih - 10, mk.label, "ch-mark-label", "middle");
    });
    return { s: s, x: x, y: y, iw: iw, ih: ih, n: n };
  };

  Chart.prototype.draw_bars_time = function (W) {
    var spec = this.spec, self = this, key = spec.series[0].key;
    var maxY = Math.max.apply(null, spec.data.map(function (r) { return r[key]; })) * 1.08;
    var H = this.narrow ? 280 : 320, m = { t: 48, r: 12, b: 26, l: 44 };
    var f = this.timeFrame(W, H, m, maxY), s = f.s, bw = Math.max(1, f.iw / f.n - (f.iw / f.n > 6 ? 2 : 0.5));
    spec.data.forEach(function (r, i) {
      var v = r[key];
      if (v > 0) {
        var top = f.y(v), h = m.t + f.ih - top;
        s.appendChild(svg("rect", { x: f.x(i) - bw / 2, y: top, width: bw, height: h, rx: Math.min(2, bw / 2) }, "ch-bar ch-s1"));
      }
      var hit = svg("rect", { x: f.x(i) - f.iw / f.n / 2, y: m.t, width: f.iw / f.n, height: f.ih, fill: "transparent" });
      hit.addEventListener("pointerenter", function (e) {
        self.showTip("<strong>" + monthLabel(r.x) + "</strong><br>" + fmt(v, spec) + " " + (spec.unit || ""), f.x(i), f.y(v));
      });
      hit.addEventListener("pointerleave", function () { self.hideTip(); });
      s.appendChild(hit);
    });
    return s;
  };

  Chart.prototype.draw_line = function (W) {
    var spec = this.spec, self = this;
    var maxY = 0;
    spec.data.forEach(function (r) { spec.series.forEach(function (se) { maxY = Math.max(maxY, r[se.key]); }); });
    maxY *= 1.1;
    var H = this.narrow ? 280 : 300, m = { t: 48, r: this.narrow ? 12 : 90, b: 26, l: 40 };
    var f = this.timeFrame(W, H, m, maxY), s = f.s;
    spec.series.forEach(function (se, k) {
      var d = spec.data.map(function (r, i) { return (i ? "L" : "M") + f.x(i).toFixed(1) + "," + f.y(r[se.key]).toFixed(1); }).join("");
      s.appendChild(svg("path", { d: d }, "ch-line ch-stroke" + (k + 1)));
      if (!self.narrow) {
        var lastR = spec.data[spec.data.length - 1];
        text(s, f.x(spec.data.length - 1) + 8, f.y(lastR[se.key]) + 4, se.name, "ch-direct");
      }
    });
    var cross = svg("line", { x1: 0, x2: 0, y1: m.t, y2: m.t + f.ih }, "ch-cross");
    cross.style.display = "none";
    s.appendChild(cross);
    var dots = spec.series.map(function (se, k) {
      var c = svg("circle", { r: 4.5, cx: 0, cy: 0 }, "ch-dot ch-s" + (k + 1));
      c.style.display = "none";
      s.appendChild(c);
      return c;
    });
    var hit = svg("rect", { x: m.l, y: m.t, width: f.iw, height: f.ih, fill: "transparent" });
    function move(e) {
      var rect = s.getBoundingClientRect(), px = (e.clientX - rect.left) * (W / rect.width);
      var i = Math.max(0, Math.min(f.n - 1, Math.floor((px - m.l) / (f.iw / f.n)))), r = spec.data[i], X = f.x(i);
      cross.setAttribute("x1", X); cross.setAttribute("x2", X); cross.style.display = "";
      var lines = spec.series.map(function (se, k) {
        dots[k].setAttribute("cx", X); dots[k].setAttribute("cy", f.y(r[se.key])); dots[k].style.display = "";
        return '<span class="ch-swatch ch-s' + (k + 1) + '"></span>' + se.name + ": " + fmt(r[se.key], spec);
      });
      self.showTip("<strong>" + monthLabel(r.x) + "</strong><br>" + lines.join("<br>"), X, f.y(r[spec.series[0].key]));
    }
    hit.addEventListener("pointermove", move);
    hit.addEventListener("pointerdown", move);
    hit.addEventListener("pointerleave", function () {
      cross.style.display = "none"; dots.forEach(function (d) { d.style.display = "none"; }); self.hideTip();
    });
    s.appendChild(hit);
    return s;
  };

  Chart.prototype.draw_hbar_grouped = function (W) {
    var spec = this.spec, self = this, ser = spec.series;
    var lo = 0, hi = 0;
    spec.data.forEach(function (r) { ser.forEach(function (se) { lo = Math.min(lo, r[se.key]); hi = Math.max(hi, r[se.key]); }); });
    var ticks = niceTicks(lo, hi, this.narrow ? 3 : 5);
    lo = Math.min(lo, ticks[0]); hi = Math.max(hi, ticks[ticks.length - 1]);
    var labelW = this.narrow ? 96 : 104, rowH = this.narrow ? 34 : 38, barH = (rowH - 10) / 2;
    var m = { t: 8, r: 46, b: 40, l: labelW + (lo < 0 ? 40 : 0) }, H = m.t + m.b + rowH * spec.data.length;
    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img", "aria-label": spec.title });
    var iw = W - m.l - m.r, x = function (v) { return m.l + ((v - lo) / (hi - lo)) * iw; };
    ticks.forEach(function (v) {
      s.appendChild(svg("line", { x1: x(v), x2: x(v), y1: m.t, y2: H - m.b }, "ch-grid"));
      text(s, x(v), H - m.b + 16, fmt(v, spec), "ch-axis", "middle");
    });
    var xl = this.narrow && spec.xLabelShort ? spec.xLabelShort : spec.xLabel;
    if (xl) text(s, m.l + iw / 2, H - 6, xl, "ch-axis", "middle");
    spec.data.forEach(function (r, j) {
      var y0 = m.t + j * rowH + 5;
      text(s, labelW - 8, y0 + barH + 4, r.label, "ch-cat", "end");
      ser.forEach(function (se, k) {
        var v = r[se.key], a = x(Math.min(0, v)), b = x(Math.max(0, v)), yy = y0 + k * barH;
        s.appendChild(svg("rect", { x: a, y: yy, width: Math.max(1, b - a), height: barH - 2, rx: 2 }, "ch-bar ch-s" + (k + 1)));
        var tx = v >= 0 ? b + 4 : a - 4;
        text(s, tx, yy + barH / 2 + 2, fmt(v, spec), "ch-val", v >= 0 ? "start" : "end");
      });
      var hit = svg("rect", { x: 0, y: m.t + j * rowH, width: W, height: rowH, fill: "transparent" });
      hit.addEventListener("pointerenter", function () {
        var lines = ser.map(function (se, k) {
          return '<span class="ch-swatch ch-s' + (k + 1) + '"></span>' + se.name + ": " + fmt(r[se.key], spec) +
            (r[se.key + "Tip"] ? " <span class=\"ch-muted\">(" + r[se.key + "Tip"] + ")</span>" : "");
        });
        self.showTip("<strong>" + r.label + "</strong><br>" + lines.join("<br>"), x(Math.max(0, r[ser[0].key], r[ser[1].key])), m.t + j * rowH);
      });
      hit.addEventListener("pointerleave", function () { self.hideTip(); });
      s.appendChild(hit);
    });
    s.appendChild(svg("line", { x1: x(0), x2: x(0), y1: m.t, y2: H - m.b }, "ch-zero"));
    return s;
  };

  function init() {
    document.querySelectorAll(".ch[data-src]").forEach(function (root) {
      if (root.getAttribute("data-ready")) return;
      root.setAttribute("data-ready", "1");
      fetch(root.getAttribute("data-src"))
        .then(function (r) { return r.json(); })
        .then(function (spec) { new Chart(root, spec); })
        .catch(function () { root.textContent = "This chart couldn't load."; });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

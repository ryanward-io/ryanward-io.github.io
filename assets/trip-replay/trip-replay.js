/* Roadtrip replay: a MapLibre map plus a battery chart that move together.
 * Data comes from assets/trips/<trip>/trip.json (built by scripts/build_trip.py).
 * Map tiles: OpenFreeMap (no API key). The battery line is a reconstruction, see the notes in the data file.
 */
(function () {
  "use strict";

  var TZ = "Australia/Melbourne";
  var STYLE_LIGHT = "https://tiles.openfreemap.org/styles/liberty";
  var STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";
  var dayFmt = new Intl.DateTimeFormat("en-AU", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
  var timeFmt = new Intl.DateTimeFormat("en-AU", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true });
  var weekdayFmt = new Intl.DateTimeFormat("en-AU", { timeZone: TZ, weekday: "short" });
  var dateNumFmt = new Intl.DateTimeFormat("en-AU", { timeZone: TZ, day: "numeric" });
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var SVGNS = "http://www.w3.org/2000/svg";

  function isDark() {
    var t = document.documentElement.getAttribute("data-theme");
    return t ? t === "dark" : mq.matches;
  }
  function when(ms) {
    var parts = {};
    dayFmt.formatToParts(ms).forEach(function (p) { parts[p.type] = p.value; });
    var month = (parts.month || "").replace("Sept", "Sep");
    return parts.weekday + " " + parts.day + " " + month + ", " + timeFmt.format(ms);
  }
  function lerp(a, b, f) { return a + (b - a) * f; }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function svg(tag, attrs, cls) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (cls) e.setAttribute("class", cls);
    return e;
  }
  function haversine(a, b) {
    var R = 6371, rad = Math.PI / 180;
    var dLat = (b[1] - a[1]) * rad, dLon = (b[0] - a[0]) * rad;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  function TripReplay(root) {
    this.root = root;
    this.src = root.getAttribute("data-src");
    this.progress = 0;
    this.playing = false;
    this.speed = 2;
    this.lastFrame = 0;
    this.lastLegIndex = -2;
    this.doneBase = [];
    root.classList.add("tr-loading");
    root.textContent = "Loading the trip…";
    var self = this;
    fetch(this.src)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) { self.init(data); })
      .catch(function () { root.textContent = "The trip replay could not be loaded."; });
  }

  TripReplay.prototype.init = function (data) {
    this.data = data;
    this.buildModel();
    this.buildDom();
    this.buildMap();
    this.layoutChart();
    this.bindEvents();
    this.root.classList.remove("tr-loading");
    this.render();
  };

  TripReplay.prototype.buildModel = function () {
    var data = this.data;
    // Cumulative distance along each leg, for positioning
    this.legs = data.legs.map(function (leg) {
      var cum = [0];
      for (var i = 1; i < leg.coords.length; i++) cum.push(cum[i - 1] + haversine(leg.coords[i - 1], leg.coords[i]));
      return { coords: leg.coords, cum: cum, total: cum[cum.length - 1] || 1, km: leg.km };
    });
    var stopsById = {};
    data.stops.forEach(function (s) { stopsById[s.id] = s; });
    this.stopsById = stopsById;

    var lastPos = this.legs[0].coords[0];
    var kmBefore = 0;
    var anim = 0;
    var phases = [];
    data.phases.forEach(function (p) {
      var hours = (p.t1 - p.t0) / 3.6e6;
      var dur;
      if (p.kind === "drive") dur = p.local ? 2.0 : Math.max(0.8, hours * 2.2);
      else if (p.kind === "charge") dur = p.assumed ? 2.2 : Math.min(3, Math.max(1.2, hours * 60 / 25));
      else dur = Math.min(2.2, 0.3 + hours * 0.1);
      var ph = { kind: p.kind, t0: p.t0, t1: p.t1, soc0: p.soc0, soc1: p.soc1, label: p.label, stop: p.stop,
        leg: p.leg, assumed: p.assumed, local: p.local, a0: anim, a1: anim + dur, kmBefore: kmBefore };
      if (p.kind === "drive" && p.leg != null) {
        ph.startPos = this.legs[p.leg].coords[0];
        lastPos = this.legs[p.leg].coords[this.legs[p.leg].coords.length - 1];
        kmBefore += this.legs[p.leg].km;
      }
      ph.pos = lastPos;
      anim += dur;
      phases.push(ph);
    }, this);
    this.phases = phases;
    this.total = anim;

    // Marker positions: the end of the road leg that arrives at each stop
    var self = this;
    this.stopPos = {};
    phases.forEach(function (ph) { if (ph.kind === "charge" && ph.stop) self.stopPos[ph.stop] = ph.pos; });
    this.startPos = this.legs[0].coords[0];
    this.canberraPos = null;
    phases.forEach(function (ph) { if (ph.kind === "drive" && ph.leg === 5) self.canberraPos = ph.pos; });

    // Geographic bounds
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    this.legs.forEach(function (l) { l.coords.forEach(function (c) {
      b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]);
    }); });
    this.bounds = [[b[0], b[1]], [b[2], b[3]]];
  };

  TripReplay.prototype.buildDom = function () {
    var root = this.root;
    root.textContent = "";
    root.classList.add("trip-replay");

    this.mapEl = el("div", "tr-map");
    root.appendChild(this.mapEl);

    var controls = el("div", "tr-controls");
    this.playBtn = el("button", "tr-play");
    this.playBtn.type = "button";
    controls.appendChild(this.playBtn);
    this.scrub = el("input", "tr-scrub");
    this.scrub.type = "range";
    this.scrub.min = 0;
    this.scrub.max = 1000;
    this.scrub.value = 0;
    this.scrub.setAttribute("aria-label", "Trip progress");
    controls.appendChild(this.scrub);
    var speedLabel = el("label", "tr-speed");
    speedLabel.appendChild(el("span", "tr-speed-text", "Speed"));
    this.speedSel = el("select");
    [["0.5", "0.5×"], ["1", "1×"], ["2", "2×"], ["4", "4×"]].forEach(function (o) {
      var opt = el("option", null, o[1]);
      opt.value = o[0];
      if (o[0] === "2") opt.selected = true;
      this.speedSel.appendChild(opt);
    }, this);
    speedLabel.appendChild(this.speedSel);
    controls.appendChild(speedLabel);
    root.appendChild(controls);

    this.readout = el("div", "tr-readout");
    this.readoutTime = el("div", "tr-time");
    this.readoutStatus = el("div", "tr-status");
    this.readoutBattery = el("div", "tr-battery");
    this.readout.appendChild(this.readoutTime);
    this.readout.appendChild(this.readoutStatus);
    this.readout.appendChild(this.readoutBattery);
    root.appendChild(this.readout);

    this.chartWrap = el("div", "tr-chart-wrap");
    this.chart = svg("svg", { role: "img", "aria-label": "Chart of the estimated battery level over the trip, with charging stops numbered. Use the progress slider to move through it." }, "tr-chart");
    this.chartWrap.appendChild(this.chart);
    root.appendChild(this.chartWrap);

    var note = el("p", "tr-note",
      "Battery level is a reconstruction, not a reading from the car: it works back from the kWh each charger delivered. " +
      "Dashed sections were not recorded and are assumed. The time axis is compressed: parked and overnight periods are shortened.");
    root.appendChild(note);

    var det = el("details", "tr-assumptions");
    det.appendChild(el("summary", null, "How this was built"));
    var ul = el("ul");
    (this.data.assumptions || []).forEach(function (a) { ul.appendChild(el("li", null, a)); });
    det.appendChild(ul);
    root.appendChild(det);

    this.setPlayLabel();
  };

  TripReplay.prototype.setPlayLabel = function () {
    var done = this.progress >= this.total - 1e-6;
    var label = this.playing ? "Pause" : (done ? "Replay" : "Play");
    this.playBtn.textContent = "";
    var icon = svg("svg", { viewBox: "0 0 16 16", width: "14", height: "14", "aria-hidden": "true", fill: "currentColor" });
    icon.appendChild(svg("path", { d: this.playing ? "M3 2h4v12H3zM9 2h4v12H9z" : (done ? "M8 3a5 5 0 1 0 5 5h-2a3 3 0 1 1-3-3v2l4-3-4-3z" : "M4 2l10 6-10 6z") }));
    this.playBtn.appendChild(icon);
    this.playBtn.appendChild(document.createTextNode(" " + label));
    this.playBtn.setAttribute("aria-label", label + " the trip replay");
  };

  /* ---------------- Map ---------------- */
  TripReplay.prototype.buildMap = function () {
    var self = this;
    var map = new maplibregl.Map({
      container: this.mapEl,
      style: isDark() ? STYLE_DARK : STYLE_LIGHT,
      bounds: this.bounds,
      fitBoundsOptions: { padding: 36 },
      cooperativeGestures: true,
      attributionControl: { compact: true }
    });
    this.map = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("style.load", function () { self.addRouteLayers(); });

    // Markers
    var data = this.data;
    var n = 0;
    this.markers = [];
    data.stops.forEach(function (s) {
      var pos, label, cls;
      if (s.kind === "charge") { n += 1; pos = self.stopPos[s.id]; label = String(n); cls = "tr-stop"; }
      else if (s.id === "caulfield") { pos = self.startPos; label = "S"; cls = "tr-stop tr-stop-end"; }
      else { pos = self.canberraPos; label = "C"; cls = "tr-stop tr-stop-end"; }
      if (!pos) return;
      var btn = el("button", cls, label);
      btn.type = "button";
      btn.setAttribute("aria-label", self.describeStop(s, label));
      var offset = [0, 0];
      // Avenel is visited twice: nudge the later marker so both are visible
      if (s.id === "avenel2") offset = [14, 12];
      var m = new maplibregl.Marker({ element: btn, offset: offset }).setLngLat(pos).addTo(map);
      btn.addEventListener("click", function () {
        new maplibregl.Popup({ offset: 16, closeButton: true, maxWidth: "260px" })
          .setLngLat(pos).setDOMContent(self.popupContent(s, label)).addTo(map);
      });
      self.markers.push(m);
    });

    this.car = el("div", "tr-car");
    this.car.setAttribute("aria-hidden", "true");
    this.carMarker = new maplibregl.Marker({ element: this.car }).setLngLat(this.startPos).addTo(map);

    var swap = function () { map.setStyle(isDark() ? STYLE_DARK : STYLE_LIGHT); };
    mq.addEventListener("change", swap);
    new MutationObserver(swap).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  };

  TripReplay.prototype.describeStop = function (s, label) {
    if (s.kind === "charge") return "Stop " + label + ": " + s.name + ", " + s.kwh + " kWh";
    return s.id === "caulfield" ? "Start and finish: Caulfield, Melbourne" : "Canberra";
  };

  TripReplay.prototype.popupContent = function (s, label) {
    var box = el("div", "tr-popup");
    if (s.kind !== "charge") {
      box.appendChild(el("strong", null, s.id === "caulfield" ? "Caulfield, Melbourne" : "Canberra"));
      box.appendChild(el("div", null, s.id === "caulfield" ? "Start and finish" : "Destination"));
      return box;
    }
    box.appendChild(el("strong", null, label + ". " + s.name));
    var parts = [s.network + (s.charger ? ", " + s.charger : "")];
    parts.push(when(s.start) + " – " + timeFmt.format(s.end));
    parts.push((s.approx ? "about " : "") + s.kwh + " kWh for $" + s.cost.toFixed(2));
    parts.push("Battery about " + Math.round(s.soc_in) + "% → " + Math.round(s.soc_out) + "%");
    parts.forEach(function (t) { box.appendChild(el("div", null, t)); });
    return box;
  };

  TripReplay.prototype.addRouteLayers = function () {
    var map = this.map;
    var dark = isDark();
    var all = { type: "Feature", geometry: { type: "MultiLineString", coordinates: this.legs.map(function (l) { return l.coords; }) } };
    map.addSource("route-all", { type: "geojson", data: all });
    map.addSource("route-done", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } } });
    map.addLayer({ id: "route-all", type: "line", source: "route-all", layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": dark ? "#8a94a6" : "#6b7a90", "line-width": 4, "line-opacity": 0.55 } });
    map.addLayer({ id: "route-done", type: "line", source: "route-done", layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": dark ? "#6cb4ff" : "#1a56db", "line-width": 5 } });
    this.lastLegIndex = -2; // force the done-line to rebuild
    this.updateMap(this.current);
  };

  TripReplay.prototype.updateMap = function (st) {
    if (!st) return;
    this.carMarker.setLngLat(st.pos);
    var src = this.map && this.map.getSource && this.map.getSource("route-done");
    if (src) src.setData({ type: "Feature", geometry: { type: "LineString", coordinates: st.done } });
  };

  /* ---------------- State ---------------- */
  TripReplay.prototype.stateAt = function (p) {
    var phases = this.phases;
    p = Math.max(0, Math.min(this.total, p));
    var lo = 0, hi = phases.length - 1;
    while (lo < hi) {
      var mid = (lo + hi + 1) >> 1;
      if (phases[mid].a0 <= p) lo = mid; else hi = mid - 1;
    }
    var ph = phases[lo];
    var f = ph.a1 > ph.a0 ? (p - ph.a0) / (ph.a1 - ph.a0) : 1;
    f = Math.max(0, Math.min(1, f));
    var st = { phase: ph, index: lo, f: f, t: lerp(ph.t0, ph.t1, f), soc: lerp(ph.soc0, ph.soc1, f), km: ph.kmBefore };
    if (ph.kind === "drive" && ph.leg != null) {
      var leg = this.legs[ph.leg];
      var target = f * leg.total;
      var i = 1;
      while (i < leg.cum.length - 1 && leg.cum[i] < target) i++;
      var seg = leg.cum[i] - leg.cum[i - 1] || 1;
      var u = (target - leg.cum[i - 1]) / seg;
      var a = leg.coords[i - 1], b = leg.coords[i];
      st.pos = [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
      st.km += f * leg.km;
      st.legIndex = ph.leg;
      st.partial = leg.coords.slice(0, i).concat([st.pos]);
    } else {
      st.pos = ph.pos;
    }
    // completed road before this phase
    var base = this.baseFor(ph.leg != null && ph.kind === "drive" ? ph.leg : this.legsDoneBefore(lo));
    st.done = st.partial ? base.concat(st.partial) : base;
    return st;
  };

  // Number of road legs fully completed by the time phase `index` starts
  TripReplay.prototype.legsDoneBefore = function (index) {
    var n = 0;
    for (var i = 0; i < index; i++) if (this.phases[i].kind === "drive" && this.phases[i].leg != null) n += 1;
    return n;
  };
  // coordinates of all legs with index < n (cached)
  TripReplay.prototype.baseFor = function (n) {
    this._baseCache = this._baseCache || {};
    if (!this._baseCache[n]) {
      var out = [];
      for (var i = 0; i < n; i++) out = out.concat(this.legs[i].coords);
      this._baseCache[n] = out;
    }
    return this._baseCache[n];
  };

  TripReplay.prototype.progressForTime = function (ts) {
    var phases = this.phases;
    for (var i = 0; i < phases.length; i++) {
      var ph = phases[i];
      if (ts <= ph.t1 || i === phases.length - 1) {
        var f = ph.t1 > ph.t0 ? (ts - ph.t0) / (ph.t1 - ph.t0) : 1;
        return ph.a0 + Math.max(0, Math.min(1, f)) * (ph.a1 - ph.a0);
      }
    }
    return this.total;
  };

  /* ---------------- Chart ---------------- */
  TripReplay.prototype.layoutChart = function () {
    var chart = this.chart, data = this.data, self = this;
    var W = Math.max(300, this.chartWrap.clientWidth || 600);
    var H = W < 520 ? 200 : 220;
    var m = { l: 38, r: 12, t: 16, b: 34 };
    this.cw = W; this.ch = H; this.m = m;
    chart.setAttribute("viewBox", "0 0 " + W + " " + H);
    chart.setAttribute("height", H);
    while (chart.firstChild) chart.removeChild(chart.firstChild);
    var t0 = data.start, t1 = data.end;
    // The time axis is compressed so that driving and charging are readable: each stretch of the trip
    // gets the same width as it gets playback time, so parked and overnight periods are short.
    var xa = function (a) { return m.l + a / self.total * (W - m.l - m.r); };
    var x = function (t) { return xa(self.progressForTime(t)); };
    this.xa = xa;
    var y = function (v) { return m.t + (1 - v / 100) * (H - m.t - m.b); };
    this.x = x; this.y = y;

    // Grid + y labels
    [0, 25, 50, 75, 100].forEach(function (v) {
      chart.appendChild(svg("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }, "tr-grid"));
      var tx = svg("text", { x: m.l - 6, y: y(v) + 4, "text-anchor": "end" }, "tr-axis");
      tx.textContent = v + "%";
      chart.appendChild(tx);
    });
    // Day lines + labels (local midnights; the trip falls entirely in AEST)
    var offset = 10 * 3600e3;
    var day = Math.floor((t0 + offset) / 86400e3) * 86400e3 - offset;
    for (var d = day + 86400e3; d < t1; d += 86400e3) {
      chart.appendChild(svg("line", { x1: x(d), x2: x(d), y1: m.t, y2: H - m.b }, "tr-day"));
    }
    for (var d2 = day; d2 < t1; d2 += 86400e3) {
      var mid = Math.max(d2, t0), end = Math.min(d2 + 86400e3, t1);
      var lab = svg("text", { x: x((mid + end) / 2), y: H - m.b + 18, "text-anchor": "middle" }, "tr-axis");
      var wd = weekdayFmt.format(d2 + 12 * 3600e3);
      lab.textContent = W < 520 ? wd.slice(0, 2) : wd;
      chart.appendChild(lab);
    }

    // Battery segments: faint (whole trip) and bright (revealed up to the cursor via a clip)
    var defs = svg("defs", {});
    var clip = svg("clipPath", { id: "tr-clip-" + (TripReplay.n = (TripReplay.n || 0) + 1) });
    this.clipRect = svg("rect", { x: 0, y: 0, width: 0, height: H });
    clip.appendChild(this.clipRect);
    defs.appendChild(clip);
    chart.appendChild(defs);
    var future = svg("g", {}, "tr-future");
    var past = svg("g", { "clip-path": "url(#" + clip.id + ")" }, "tr-past");
    this.phases.forEach(function (ph) {
      if (ph.t1 <= ph.t0) return;
      var cls = "tr-seg " + (ph.assumed ? "tr-seg-assumed" : ph.kind === "charge" ? "tr-seg-charge" : "tr-seg-drive");
      var d = "M" + x(ph.t0).toFixed(1) + " " + y(ph.soc0).toFixed(1) + " L" + x(ph.t1).toFixed(1) + " " + y(ph.soc1).toFixed(1);
      future.appendChild(svg("path", { d: d }, cls));
      past.appendChild(svg("path", { d: d }, cls));
    });
    chart.appendChild(future);
    chart.appendChild(past);

    // Charging stop numbers
    var n = 0;
    data.stops.forEach(function (s) {
      if (s.kind !== "charge") return;
      n += 1;
      var cx = x((s.start + s.end) / 2);
      var g = svg("g", {}, "tr-chart-stop");
      g.appendChild(svg("circle", { cx: cx, cy: y(s.soc_out) - 11, r: 8 }));
      var tx = svg("text", { x: cx, y: y(s.soc_out) - 8, "text-anchor": "middle" });
      tx.textContent = String(n);
      g.appendChild(tx);
      chart.appendChild(g);
    });

    // Cursor
    this.cursorLine = svg("line", { x1: 0, x2: 0, y1: m.t, y2: H - m.b }, "tr-cursor");
    this.cursorDot = svg("circle", { cx: 0, cy: 0, r: 5 }, "tr-dot");
    chart.appendChild(this.cursorLine);
    chart.appendChild(this.cursorDot);
    this.chartReady = true;
  };

  /* ---------------- Events / loop ---------------- */
  TripReplay.prototype.bindEvents = function () {
    var self = this;
    this.playBtn.addEventListener("click", function () { self.toggle(); });
    this.scrub.addEventListener("input", function () {
      self.progress = (self.scrub.value / 1000) * self.total;
      self.render();
    });
    this.speedSel.addEventListener("change", function () { self.speed = parseFloat(self.speedSel.value); });

    var seekFromPointer = function (e) {
      var r = self.chart.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width * self.cw;
      var frac = (px - self.m.l) / (self.cw - self.m.l - self.m.r);
      self.progress = Math.max(0, Math.min(1, frac)) * self.total;
      self.render();
    };
    var dragging = false;
    this.chart.addEventListener("pointerdown", function (e) { dragging = true; self.chart.setPointerCapture(e.pointerId); seekFromPointer(e); });
    this.chart.addEventListener("pointermove", function (e) { if (dragging) seekFromPointer(e); });
    this.chart.addEventListener("pointerup", function () { dragging = false; });
    this.chart.addEventListener("pointercancel", function () { dragging = false; });

    if (window.ResizeObserver) {
      var lastW = this.chartWrap.clientWidth;
      new ResizeObserver(function () {
        var w = self.chartWrap.clientWidth;
        if (Math.abs(w - lastW) > 1) { lastW = w; self.layoutChart(); self.render(); }
      }).observe(this.chartWrap);
    }
    // Pause when the tab is hidden
    document.addEventListener("visibilitychange", function () { if (document.hidden && self.playing) self.pause(); });
  };

  TripReplay.prototype.toggle = function () { this.playing ? this.pause() : this.play(); };
  TripReplay.prototype.play = function () {
    if (this.progress >= this.total - 1e-6) this.progress = 0;
    this.playing = true;
    this.lastFrame = 0;
    this.setPlayLabel();
    var self = this;
    var tick = function (now) {
      if (!self.playing) return;
      if (self.lastFrame) self.progress += Math.min(0.1, (now - self.lastFrame) / 1000) * self.speed;
      self.lastFrame = now;
      if (self.progress >= self.total) { self.progress = self.total; self.playing = false; self.setPlayLabel(); self.render(); return; }
      self.render();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  TripReplay.prototype.pause = function () { this.playing = false; this.setPlayLabel(); };

  TripReplay.prototype.render = function () {
    var st = this.stateAt(this.progress);
    this.current = st;
    var ph = st.phase;
    this.updateMap(st);

    // Readout
    var status;
    if (ph.kind === "charge" && ph.stop) status = "Charging at " + this.stopsById[ph.stop].name;
    else if (ph.kind === "charge") status = ph.label || "Charging";
    else status = ph.label || (ph.kind === "drive" ? "Driving" : "Parked");
    this.readoutTime.textContent = when(st.t);
    this.readoutStatus.textContent = status + (ph.assumed ? " (assumed)" : "");
    this.readoutBattery.textContent = "Battery about " + Math.round(st.soc) + "% · " + Math.round(st.km) + " km driven";

    // Scrubber (don't fight the user while they drag it)
    if (document.activeElement !== this.scrub || this.playing) this.scrub.value = Math.round(this.progress / this.total * 1000);
    this.scrub.setAttribute("aria-valuetext", when(st.t) + ", battery about " + Math.round(st.soc) + "%, " + status);

    // Chart cursor
    if (this.chartReady) {
      var cx = this.xa(this.progress);
      this.clipRect.setAttribute("width", Math.max(0, cx));
      this.cursorLine.setAttribute("x1", cx);
      this.cursorLine.setAttribute("x2", cx);
      this.cursorDot.setAttribute("cx", cx);
      this.cursorDot.setAttribute("cy", this.y(st.soc));
    }
    if (!this.playing) this.setPlayLabel();
  };

  function start() {
    var nodes = document.querySelectorAll(".trip-replay[data-src]");
    if (!nodes.length || typeof maplibregl === "undefined") return;
    nodes.forEach(function (node) {
      var started = false;
      var go = function () { if (!started) { started = true; new TripReplay(node); } };
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); go(); }
        }, { rootMargin: "300px" });
        io.observe(node);
      } else go();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

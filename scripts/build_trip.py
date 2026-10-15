#!/usr/bin/env python3
"""Build assets/trips/atto-3-2026/trip.json for the roadtrip replay on the Atto 3 post.

Inputs are the constants below (stops, charge times, energy delivered, assumptions).
Roads come from the public OSRM demo server (driving between the stops, one request per leg);
the output file is committed, so this only needs re-running if the data changes:

    python3 scripts/build_trip.py

The battery line is a *reconstruction*, not telemetry:
  * charge sessions: kWh delivered / 50 kWh pack, finishing at FINISH_SOC (apps don't show %)
  * driving: arrival % at each charger = previous finish % minus nothing assumed beyond the kWh
    the next charger delivered, interpolated by distance along the road route
  * idle time: flat
Anything not recorded is marked in ASSUMPTIONS and in the "assumed" flag on the phase.
"""
import json
import math
import statistics
import time
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets" / "trips" / "atto-3-2026" / "trip.json"
TZ = timezone(timedelta(hours=10))  # AEST; DST had not started on 27 Sep 2026
PACK_KWH = 50.0
FINISH_SOC = 85.0        # where a charge is assumed to end unless stated (80-90% typical; bp pulse reported 85%)
START_SOC = 90.0         # assumed: not recorded
CANBERRA_ARRIVE_SOC = 30.0   # "arrived in Canberra with about 30%"
CANBERRA_CHARGE_KW = 1.2     # slow home charging over the weekend (about 1-1.5 kW), then it sits full
QUEUE_MIN = 15           # waited ~15 minutes for a free charger at Avenel on Sunday


def t(day, hm):
    h, m = map(int, hm.split(":"))
    return datetime(2026, 9, day, h, m, tzinfo=TZ)


# id, display name, lat, lon (town-level positions), kind
POINTS = {
    "caulfield": ("Caulfield, Melbourne", -37.8813, 145.0421),
    "avenel": ("Avenel", -36.9018, 145.2330),
    "glenrowan": ("Glenrowan North", -36.4685, 146.2325),
    "bright": ("Bright", -36.7297, 146.9621),
    "holbrook": ("Holbrook", -35.7288, 147.3109),
    "coolac": ("Coolac", -34.9239, 148.1658),
    "canberra": ("Canberra", -35.2809, 149.1300),
    "tarcutta": ("Tarcutta", -35.2742, 147.7400),
    "wodonga": ("Wodonga West", -36.1257, 146.8486),
}

# Charge sessions in trip order. kwh/minutes for Holbrook and Coolac are approximate (no screenshots).
CHARGES = [
    dict(id="avenel1", at="avenel", name="Ampol Foodary, Avenel", network="Evie", charger="150 kW",
         start=t(23, "13:28"), end=t(23, "13:56"), kwh=24.57, cost=19.91),
    dict(id="glenrowan", at="glenrowan", name="bp pulse Glenrowan North", network="bp pulse", charger="",
         start=t(23, "15:49"), end=t(23, "16:13"), kwh=21.52, cost=16.14, finish=85.0),
    dict(id="bright", at="bright", name="Wills Street Parking, Bright", network="Evie", charger="50 kW",
         start=t(24, "11:25"), end=t(24, "12:00"), kwh=25.14, cost=19.36, soc_in=40.0),
    dict(id="holbrook", at="holbrook", name="NRMA charger, Holbrook", network="NRMA", charger="",
         start=t(25, "10:00"), end=t(25, "10:45"), kwh=37.0, cost=29.60, approx=True, finish=90.0),
    dict(id="coolac", at="coolac", name="Tesla Supercharger, Coolac", network="Tesla", charger="",
         start=t(25, "12:00"), end=t(25, "12:30"), kwh=26.5, cost=14.59, approx=True, finish=90.0),
    dict(id="tarcutta", at="tarcutta", name="Ampol Foodary, Tarcutta", network="Evie", charger="315 kW",
         start=t(27, "09:38"), end=t(27, "10:10"), kwh=28.83, cost=24.51),
    dict(id="wodonga", at="wodonga", name="7-Eleven, Wodonga West", network="Evie", charger="150 kW",
         start=t(27, "11:34"), end=t(27, "12:07"), kwh=30.75, cost=24.29),
    dict(id="avenel2", at="avenel", name="Ampol Foodary, Avenel", network="Evie", charger="150 kW",
         start=t(27, "14:23"), end=t(27, "15:05"), kwh=35.71, cost=28.92, soc_in=10.0),
]

# Drive legs between points. "asap": leave straight after the previous stop;
# "jit": wait (idle) at the previous stop and arrive exactly when the next charge started.
# (from, to, mode, average speed km/h). The roads were about 110 km/h on the highway;
# a little slower out of/into Melbourne and on the country roads to and from Bright.
LEGS = [
    ("caulfield", "avenel", "jit", 100),
    ("avenel", "glenrowan", "jit", 110),
    ("glenrowan", "bright", "asap", 90),
    ("bright", "holbrook", "jit", 100),
    ("holbrook", "coolac", "jit", 110),
    ("coolac", "canberra", "asap", 110),
    ("canberra", "tarcutta", "jit", 110),
    ("tarcutta", "wodonga", "jit", 110),
    ("wodonga", "avenel", "jit", 110),
    ("avenel", "caulfield", "asap", 100),
]

ASSUMPTIONS = [
    "The route starts and ends in Caulfield, Melbourne. The starting battery level (about 90%) is an assumption.",
    "Roads are the fastest driving route between stops. Drive times assume about 110 km/h on the highway and a little less on city and country roads.",
    "Arrival and finish levels work from the kWh each charger delivered on a 50 kWh pack. Charges are assumed to finish at 85% unless known: Glenrowan North 85% (bp pulse app), Bright 90% (arrived with about 40%), the two Friday charges 90% (so that arriving in Canberra with about 30% adds up), and Avenel on Sunday about 81% (arrived with about 10%).",
    "The Holbrook and Coolac sessions had no app records, so their energy and times are approximate.",
    "In Canberra the battery charged slowly from about 30% on home power (assumed about 1.2 kW), was full by Saturday evening and sat at 100% until we left on Sunday morning. Saturday's local driving is not shown.",
    "Charging is drawn as a straight line from the arrival to the finish level, although real chargers slow down above about 80%.",
]


def osrm(a, b):
    url = ("https://router.project-osrm.org/route/v1/driving/"
           f"{a[2]:.5f},{a[1]:.5f};{b[2]:.5f},{b[1]:.5f}?overview=full&geometries=geojson")
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "ryanward.dev trip build"}), timeout=60) as r:
                d = json.load(r)
            rt = d["routes"][0]
            return rt["geometry"]["coordinates"], rt["distance"] / 1000.0, rt["duration"] / 3600.0
        except Exception as e:  # noqa: BLE001
            print("retry", attempt, e)
            time.sleep(2 + attempt * 2)
    raise SystemExit("OSRM failed")


def rdp(pts, eps):
    """Douglas-Peucker on [lon, lat] points (degrees), iterative."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        (x1, y1), (x2, y2) = pts[i], pts[j]
        dx, dy = x2 - x1, y2 - y1
        norm = math.hypot(dx, dy) or 1e-12
        best, idx = 0.0, None
        for k in range(i + 1, j):
            d = abs(dy * pts[k][0] - dx * pts[k][1] + x2 * y1 - y2 * x1) / norm
            if d > best:
                best, idx = d, k
        if idx is not None and best > eps:
            keep[idx] = True
            stack += [(i, idx), (idx, j)]
    return [p for p, k in zip(pts, keep) if k]


def main():
    legs = []
    for a, b, mode, speed in LEGS:
        coords, km, _osrm_hrs = osrm(POINTS[a], POINTS[b])
        hrs = km / speed
        coords = [[round(x, 5), round(y, 5)] for x, y in rdp(coords, 0.00008)]
        legs.append(dict(frm=a, to=b, mode=mode, km=round(km, 1), hours=hrs, coords=coords))
        print(f"{a:>10} -> {b:<10} {km:6.1f} km  {hrs:4.2f} h  {len(coords)} pts")
        time.sleep(1.1)

    # Charge anchors: arrival SOC (= finish - delivered %) unless stated
    for c in CHARGES:
        pct = c["kwh"] / PACK_KWH * 100.0
        if "soc_in" in c:
            c["soc_out"] = c["soc_in"] + pct
        else:
            c["soc_out"] = c.get("finish", FINISH_SOC)
            c["soc_in"] = c["soc_out"] - pct

    arrive_ch = [CHARGES[0], CHARGES[1], CHARGES[2], CHARGES[3], CHARGES[4], None, CHARGES[5], CHARGES[6], CHARGES[7], None]
    leave_ch = [None, CHARGES[0], CHARGES[1], CHARGES[2], CHARGES[3], CHARGES[4], None, CHARGES[5], CHARGES[6], CHARGES[7]]

    # Canberra: slow home charging between arrival and the Sunday departure
    dep_leg = legs[6]
    depart_canberra = CHARGES[5]["start"] - timedelta(hours=dep_leg["hours"])

    phases = []

    def add(kind, t0, t1, soc0, soc1, **kw):
        if kind == "idle" and (t1 - t0) < timedelta(minutes=3):
            return
        phases.append(dict(kind=kind, t0=int(t0.timestamp() * 1000), t1=int(t1.timestamp() * 1000),
                           soc0=round(soc0, 2), soc1=round(soc1, 2), **kw))

    state = dict(clock=None, soc=START_SOC)

    def drive_to(i, soc_end, arrive_at=None, label=None):
        """Drive leg i. If the leg is 'jit' it waits first and arrives at arrive_at; 'asap' leaves now."""
        leg = legs[i]
        dur = timedelta(hours=leg["hours"])
        label = label or f"{POINTS[leg['frm']][0]} to {POINTS[leg['to']][0]}"
        if state["clock"] is None:
            depart = arrive_at - dur
        elif leg["mode"] == "jit":
            depart = arrive_at - dur
            if depart < state["clock"]:
                print("WARN compressing leg", i, "needs", dur, "have", arrive_at - state["clock"])
                depart = state["clock"]
            add("idle", state["clock"], depart, state["soc"], state["soc"], label="Parked")
        else:
            depart = state["clock"]
        end = arrive_at if leg["mode"] == "jit" or state["clock"] is None else depart + dur
        add("drive", depart, end, state["soc"], soc_end, leg=i, label=label)
        state["clock"], state["soc"] = end, soc_end
        return end

    def charge(c):
        add("charge", c["start"], c["end"], c["soc_in"], c["soc_out"], stop=c["id"])
        state["clock"], state["soc"] = c["end"], c["soc_out"]

    def stay_until(t1, label):
        add("idle", state["clock"], t1, state["soc"], state["soc"], label=label)
        state["clock"] = t1

    # Implied consumption (kWh/100 km) for legs whose two ends are both known
    def implied(i, a_soc, b_soc):
        return round((a_soc - b_soc) / 100.0 * PACK_KWH / legs[i]["km"] * 100.0, 1)

    # ---- Wednesday
    drive_to(0, CHARGES[0]["soc_in"], arrive_at=CHARGES[0]["start"]); charge(CHARGES[0])
    drive_to(1, CHARGES[1]["soc_in"], arrive_at=CHARGES[1]["start"]); charge(CHARGES[1])
    drive_to(2, CHARGES[2]["soc_in"]); stay_until(CHARGES[2]["start"], "Overnight in Bright")
    charge(CHARGES[2])
    # ---- Friday
    drive_to(3, CHARGES[3]["soc_in"], arrive_at=CHARGES[3]["start"]); charge(CHARGES[3])
    drive_to(4, CHARGES[4]["soc_in"], arrive_at=CHARGES[4]["start"]); charge(CHARGES[4])
    arrive_canberra = drive_to(5, CANBERRA_ARRIVE_SOC)
    # ---- Canberra weekend: slow home charging until full, then it sits at 100% (assumed)
    hours = (depart_canberra - arrive_canberra).total_seconds() / 3600.0
    hours_to_full = (100.0 - CANBERRA_ARRIVE_SOC) / 100.0 * PACK_KWH / CANBERRA_CHARGE_KW
    if hours_to_full < hours:
        full_at = arrive_canberra + timedelta(hours=hours_to_full)
        add("charge", arrive_canberra, full_at, CANBERRA_ARRIVE_SOC, 100.0,
            label="Slow home charging in Canberra", assumed=True)
        add("idle", full_at, depart_canberra, 100.0, 100.0, label="Fully charged, parked in Canberra")
        soc_dep = 100.0
    else:
        soc_dep = CANBERRA_ARRIVE_SOC + hours * CANBERRA_CHARGE_KW / PACK_KWH * 100.0
        add("charge", arrive_canberra, depart_canberra, CANBERRA_ARRIVE_SOC, soc_dep,
            label="Slow home charging in Canberra", assumed=True)
    state["clock"], state["soc"] = depart_canberra, soc_dep
    # ---- Sunday
    drive_to(6, CHARGES[5]["soc_in"], arrive_at=CHARGES[5]["start"]); charge(CHARGES[5])
    drive_to(7, CHARGES[6]["soc_in"], arrive_at=CHARGES[6]["start"]); charge(CHARGES[6])
    # Avenel: arrive, queue ~15 minutes, then charge
    drive_to(8, CHARGES[7]["soc_in"], arrive_at=CHARGES[7]["start"] - timedelta(minutes=QUEUE_MIN))
    stay_until(CHARGES[7]["start"], "Waiting for a free charger")
    charge(CHARGES[7])

    # Consumption: legs with both ends known; the final leg uses their median
    cons = {0: implied(0, START_SOC, CHARGES[0]["soc_in"])}
    for i in (1, 2, 3, 4, 7, 8):
        cons[i] = implied(i, leave_ch[i]["soc_out"], arrive_ch[i]["soc_in"])
    cons[5] = implied(5, CHARGES[4]["soc_out"], CANBERRA_ARRIVE_SOC)
    cons[6] = implied(6, soc_dep, CHARGES[5]["soc_in"])
    avg_cons = statistics.median(cons.values())
    end_soc = CHARGES[7]["soc_out"] - avg_cons * legs[9]["km"] / 100.0 / PACK_KWH * 100.0
    cons[9] = round(avg_cons, 1)
    drive_to(9, end_soc)
    for i, v in cons.items():
        legs[i]["implied_kwh_per_100km"] = v
    print("implied kWh/100km:", {f"{legs[i]['frm']}>{legs[i]['to']}": v for i, v in sorted(cons.items())}, "median", avg_cons)
    print("Canberra departure SOC", round(soc_dep, 1), "| final SOC", round(end_soc, 1))

    stops = []
    for pid in ("caulfield", "canberra"):
        n, la, lo = POINTS[pid]
        stops.append(dict(id=pid, name=n, lat=la, lon=lo, kind="waypoint"))
    for c in CHARGES:
        n, la, lo = POINTS[c["at"]]
        stops.append(dict(id=c["id"], name=c["name"], place=n, lat=la, lon=lo, kind="charge",
                          network=c["network"], charger=c["charger"], kwh=c["kwh"], cost=c["cost"],
                          minutes=round((c["end"] - c["start"]).total_seconds() / 60),
                          start=int(c["start"].timestamp() * 1000), end=int(c["end"].timestamp() * 1000),
                          soc_in=round(c["soc_in"], 1), soc_out=round(c["soc_out"], 1),
                          approx=bool(c.get("approx"))))

    out_legs = [dict(frm=l["frm"], to=l["to"], km=l["km"], coords=l["coords"],
                     implied_kwh_per_100km=l.get("implied_kwh_per_100km")) for l in legs]
    data = dict(
        title="Caulfield to Bright and Canberra and back",
        tz="Australia/Melbourne",
        pack_kwh=PACK_KWH,
        assumptions=ASSUMPTIONS,
        start=phases[0]["t0"], end=phases[-1]["t1"],
        stops=stops, legs=out_legs, phases=phases,
    )
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, separators=(",", ":")))
    print("wrote", OUT, OUT.stat().st_size // 1024, "KB;",
          datetime.fromtimestamp(data["start"] / 1000, TZ), "->", datetime.fromtimestamp(data["end"] / 1000, TZ))
    for p in phases:
        print(datetime.fromtimestamp(p["t0"] / 1000, TZ).strftime("%a %H:%M"), "-",
              datetime.fromtimestamp(p["t1"] / 1000, TZ).strftime("%a %H:%M"), p["kind"], p["soc0"], "->", p["soc1"], p.get("label") or p.get("stop"))


if __name__ == "__main__":
    main()

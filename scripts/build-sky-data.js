#!/usr/bin/env node
/*
 * Builds a compact sky dataset for the Astrolic "Open the Sky" feature from the
 * d3-celestial data files in ../data.
 *
 * Usage:
 *   node scripts/build-sky-data.js [outputPath] [--mag=6]
 *
 * Output format (all angles in degrees, RA in 0..360):
 * {
 *   "meta": { "magLimit": 6, "generated": "ISO date", "source": "d3-celestial" },
 *   "stars": [[ra, dec, mag, bv, ly, name?, desig?], ...]  // sorted by magnitude (brightest first)
 *                                                          // ly = distance in light years (0 = unknown)
 *                                                          // name = proper name ("" if only a designation)
 *                                                          // desig = Bayer/Flamsteed + constellation, e.g. "α Cyg"
 *   "constellations": [
 *     { "id": "Ori", "rank": 1, "ra": 84, "dec": 13,
 *       "names": { "en": "Orion", "tr": "Avcı", "de": "Orion", "es": "Orión" },
 *       "lines": [[[ra, dec], [ra, dec], ...], ...] }
 *   ],
 *   "bodies": [
 *     { "id": "mar", "kind": "planet", "H": -1.59,
 *       "names": { "en": "Mars", "tr": "Mars", "de": "Mars", "es": "Marte" },
 *       "elements": { a, e, i, L, W, N, da, de, di, dL, dW, dN } }   // null for sun/moon
 *   ]
 * }
 */
const fs = require("fs");
const path = require("path");

const DATA =
  process.env.CELESTIAL_DATA ||
  path.join(__dirname, "..", "..", "data");
const args = process.argv.slice(2);
const magArg = args.find((a) => a.startsWith("--mag="));
const MAG_LIMIT = magArg ? parseFloat(magArg.split("=")[1]) : 6;
const NAME_MAG_LIMIT = 3.5; // proper names / designations kept below this magnitude
const LANGS = ["en", "tr", "de", "es"];
const hygArg = args.find((a) => a.startsWith("--hyg="));

const outPath =
  args.find((a) => !a.startsWith("--")) ||
  path.join(__dirname, "..", "assets", "data", "sky.json");

const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));

// d3-celestial stores longitude in -180..180; convert to RA 0..360
const toRA = (lon) => {
  let ra = lon < 0 ? lon + 360 : lon;
  if (ra >= 360) ra -= 360;
  return Math.round(ra * 10000) / 10000;
};
const r4 = (v) => Math.round(v * 10000) / 10000;

const starsRaw = read("stars.6.json").features;
const starNames = read("starnames.json");

// ---- distances (HYG catalogue) ------------------------------------------------
// `data/hyg-dist.json` caches { HIP: distance_ly } for the stars we ship so the
// build does not need the 34 MB HYG CSV. Regenerate the cache with
//   node scripts/build-sky-data.js --hyg=/path/to/hygdata_v41.csv
const HYG_CACHE = path.join(DATA, "hyg-dist.json");
const LY_PER_PC = 3.26156;
let hygDist = {};
if (hygArg) {
  const csvPath = hygArg.split("=")[1];
  const lines = fs.readFileSync(csvPath, "utf8").split("\n");
  const header = lines[0].split(",").map((h) => h.replace(/"/g, ""));
  const iHip = header.indexOf("hip");
  const iDist = header.indexOf("dist");
  const wanted = new Set(starsRaw.map((f) => String(f.id)));
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",");
    const hip = row[iHip];
    if (!hip || !wanted.has(hip)) continue;
    const pc = parseFloat(row[iDist]);
    // HYG uses 100000 pc for "unknown"
    if (!isFinite(pc) || pc <= 0 || pc >= 99999) continue;
    hygDist[hip] = Math.round(pc * LY_PER_PC * 10) / 10;
  }
  fs.writeFileSync(HYG_CACHE, JSON.stringify(hygDist));
  console.log(`hyg-dist.json: ${Object.keys(hygDist).length} distances cached`);
} else if (fs.existsSync(HYG_CACHE)) {
  hygDist = JSON.parse(fs.readFileSync(HYG_CACHE, "utf8"));
} else {
  console.warn("warning: data/hyg-dist.json missing; stars will have no distances");
}

// Greek-letter Bayer / Flamsteed designation + constellation, e.g. "α Cyg"
const designation = (n) => {
  if (!n) return null;
  const d = n.bayer || n.flam || "";
  return d && n.c ? `${d} ${n.c}` : null;
};

const stars = starsRaw
  .filter((f) => f.properties.mag <= MAG_LIMIT)
  .map((f) => {
    const [lon, lat] = f.geometry.coordinates;
    const mag = Math.round(f.properties.mag * 100) / 100;
    const bv = Math.round(parseFloat(f.properties.bv || "0") * 100) / 100;
    const ly = hygDist[String(f.id)] || 0;
    // [ra, dec, mag, bv, ly, name?, desig?]
    const entry = [toRA(lon), r4(lat), mag, isNaN(bv) ? 0 : bv, ly];
    const named = starNames[f.id];
    if (mag < NAME_MAG_LIMIT && named) {
      const desig = designation(named);
      if (named.name || desig) entry.push(named.name || "");
      if (desig) entry.push(desig);
    }
    return entry;
  })
  .sort((a, b) => a[2] - b[2]);

const constFeatures = read("constellations.json").features;
const lineFeatures = read("constellations.lines.json").features;
// Serpens (Caput + Cauda) is stored as two features sharing the id "Ser";
// merge their line segments and keep a single label entry per id.
const linesById = {};
for (const f of lineFeatures) {
  const segs = f.geometry.coordinates.map((seg) =>
    seg.map(([lon, lat]) => [toRA(lon), r4(lat)])
  );
  linesById[f.id] = [...(linesById[f.id] || []), ...segs];
}

const seen = new Set();
const constellations = [];
for (const f of constFeatures) {
  if (seen.has(f.id)) continue;
  seen.add(f.id);
  const p = f.properties;
  const [lon, lat] = f.geometry.coordinates;
  const names = {};
  for (const l of LANGS) names[l] = p[l] || p.name;
  constellations.push({
    id: f.id,
    rank: parseInt(p.rank, 10) || 3,
    ra: toRA(lon),
    dec: r4(lat),
    names,
    lines: linesById[f.id] || [],
  });
}

// ---- solar-system bodies ----------------------------------------------------
// JPL approximate Keplerian elements (J2000 + per-century rates) from
// planets.json. Earth is included only to derive geocentric positions.
const planetsRaw = read("planets.json");
const BODY_IDS = ["sol", "lun", "mer", "ven", "ter", "mar", "jup", "sat"];
const BODY_KIND = { sol: "sun", lun: "moon", ter: "earth" };
const BODY_TR = {
  sol: "Güneş",
  lun: "Ay",
  mer: "Merkür",
  ven: "Venüs",
  ter: "Dünya",
  mar: "Mars",
  jup: "Jüpiter",
  sat: "Satürn",
};
const bodies = BODY_IDS.map((id) => {
  const p = planetsRaw[id];
  const el = p.elements && p.elements[0];
  return {
    id,
    kind: BODY_KIND[id] || "planet",
    H: p.H,
    names: { en: p.en, tr: BODY_TR[id], de: p.de || p.en, es: p.es || p.en },
    elements: el
      ? {
          a: el.a,
          e: el.e,
          i: el.i,
          L: el.L,
          W: el.W,
          N: el.N,
          da: el.da,
          de: el.de,
          di: el.di,
          dL: el.dL,
          dW: el.dW,
          dN: el.dN,
        }
      : null,
  };
});

const out = {
  meta: {
    magLimit: MAG_LIMIT,
    nameMagLimit: NAME_MAG_LIMIT,
    generated: new Date().toISOString(),
    source: "d3-celestial (Hipparcos / IAU)",
    starCount: stars.length,
  },
  stars,
  constellations,
  bodies,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out));

const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
console.log(
  `sky.json → ${outPath}\n  stars: ${stars.length} (mag ≤ ${MAG_LIMIT}), constellations: ${constellations.length}, bodies: ${bodies.length}, size: ${kb} KB`
);

// One-shot codemod: convert sRGB color literals (hex, rgb(), rgba()) in the
// design-token CSS to OKLCH, byte-identically (zero visual drift).
//
// Each output oklch() value is verified to round-trip to the EXACT original
// sRGB bytes (forward conversion OKLCH -> OKLab -> linear sRGB -> sRGB byte).
// If a chosen precision fails the round-trip, precision is bumped until it
// reproduces the original byte. Tokens that cannot round-trip are reported and
// left untouched (none expected for in-gamut sRGB).
//
// Implements the CSS Color Module Level 4 conversion algorithms verbatim.
//
// Usage:
//   node scripts/convert-oklch.mjs <file>            # rewrite in place
//   node scripts/convert-oklch.mjs <file> --check    # report only, no write

import { readFileSync, writeFileSync } from 'node:fs';

// ---------- sRGB <-> linear ----------
function srgbToLinear(c) {
  const a = c; // c in [0,1]
  return a <= 0.04045 ? a / 12.92 : Math.pow((a + 0.055) / 1.055, 2.4);
}
function linearToSrgb(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

// ---------- linear sRGB <-> OKLab (CSS Color 4) ----------
function linearSrgbToOklab(r, g, b) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}
function oklabToLinearSrgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

// ---------- OKLab <-> OKLCH ----------
function oklabToOklch(L, a, b) {
  const C = Math.sqrt(a * a + b * b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}
function oklchToOklab(L, C, H) {
  const h = (H * Math.PI) / 180;
  return [L, C * Math.cos(h), C * Math.sin(h)];
}

// ---------- byte <-> normalized ----------
const byteToUnit = (n) => n / 255;
// Forward: OKLCH (with given precision strings) -> sRGB byte triple
function oklchStrToBytes(Ls, Cs, Hs) {
  const L = parseFloat(Ls);
  const C = parseFloat(Cs);
  const H = parseFloat(Hs);
  const [oL, oa, ob] = oklchToOklab(L, C, H);
  const [lr, lg, lb] = oklabToLinearSrgb(oL, oa, ob);
  const r = Math.round(clamp01(linearToSrgb(lr)) * 255);
  const g = Math.round(clamp01(linearToSrgb(lg)) * 255);
  const b = Math.round(clamp01(linearToSrgb(lb)) * 255);
  return [r, g, b];
}
function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

// Convert an sRGB byte triple to an oklch() string that round-trips byte-exact.
// alpha (0..1) appended as `/ a` only when < 1.
function bytesToOklch(rB, gB, bB, alpha) {
  const r = srgbToLinear(byteToUnit(rB));
  const g = srgbToLinear(byteToUnit(gB));
  const b = srgbToLinear(byteToUnit(bB));
  const [L, A, B] = linearSrgbToOklab(r, g, b);
  let [Lc, Cc, Hc] = oklabToOklch(L, A, B);

  // Pure grey -> hue is undefined; emit 0 hue, 0 chroma for stability.
  const isGrey = Cc < 1e-7;

  // Find the smallest precision (per-component) that round-trips byte-exact.
  for (let p = 4; p <= 9; p++) {
    const Ls = roundStr(Lc, p);
    const Cs = isGrey ? '0' : roundStr(Cc, p + 1); // chroma is small; extra digit
    const Hs = isGrey ? '0' : roundStr(Hc, Math.max(2, p - 1));
    const [rr, gg, bb] = oklchStrToBytes(Ls, Cs, Hs);
    if (rr === rB && gg === gB && bb === bB) {
      return formatOklch(Ls, Cs, Hs, alpha);
    }
  }
  // Last resort: full precision.
  const Ls = String(Lc);
  const Cs = isGrey ? '0' : String(Cc);
  const Hs = isGrey ? '0' : String(Hc);
  const [rr, gg, bb] = oklchStrToBytes(Ls, Cs, Hs);
  if (rr === rB && gg === gB && bb === bB) {
    return formatOklch(Ls, Cs, Hs, alpha);
  }
  return null; // signals failure
}

function roundStr(x, p) {
  // Trim trailing zeros while keeping value; parseFloat normalizes.
  return String(parseFloat(x.toFixed(p)));
}
function formatOklch(Ls, Cs, Hs, alpha) {
  const base = `${Ls} ${Cs} ${Hs}`;
  if (alpha === undefined || alpha === null || alpha === 1) {
    return `oklch(${base})`;
  }
  return `oklch(${base} / ${formatAlpha(alpha)})`;
}
function formatAlpha(a) {
  // Preserve original textual alpha when possible (handled by caller via raw string).
  if (typeof a === 'string') return a;
  return String(a);
}

// ---------- parsers ----------
function parseHex(hex) {
  let h = hex.slice(1);
  let r, g, b, a;
  if (h.length === 3 || h.length === 4) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
    a = h.length === 4 ? parseInt(h[3] + h[3], 16) / 255 : 1;
  } else if (h.length === 6 || h.length === 8) {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
    a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  } else {
    return null;
  }
  return { r, g, b, a };
}

// ---------- replacement ----------
const HEX_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;
// rgb()/rgba() with comma OR space syntax; capture inner args raw.
// `[^)]*` is linear (negated class, single quantifier) — no catastrophic
// backtracking. Surrounding whitespace is trimmed by the consumer.
const RGB_RE = /\brgba?\(([^)]*)\)/g;

function alphaRoundTrips(originalAlphaStr) {
  // We keep the alpha component textually identical, so it round-trips exactly.
  return originalAlphaStr;
}

function convertRgbArgs(inner) {
  // Returns {r,g,b,alphaStr|null} or null if not a numeric rgb (e.g. uses vars).
  // Two forms:
  //  comma: "r, g, b" or "r, g, b, a"
  //  space: "r g b" or "r g b / a"
  let alphaStr = null;
  let body = inner;
  const slashIdx = inner.indexOf('/');
  if (slashIdx !== -1) {
    body = inner.slice(0, slashIdx).trim();
    alphaStr = inner.slice(slashIdx + 1).trim();
  }
  let parts;
  if (body.includes(',')) {
    parts = body.split(',').map((s) => s.trim());
    if (parts.length === 4) {
      alphaStr = parts[3];
      parts = parts.slice(0, 3);
    }
  } else {
    parts = body.split(/\s+/).filter(Boolean);
  }
  if (parts.length !== 3) return null;
  const nums = parts.map((p) => {
    if (p.endsWith('%')) return Math.round((parseFloat(p) / 100) * 255);
    return Number(p);
  });
  if (nums.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) return null;
  // Channels must be integers for a clean byte mapping; non-integers are rare
  // but we round to nearest byte (CSS does the same on serialization).
  const [r, g, b] = nums.map((n) => Math.round(n));
  return { r, g, b, alphaStr };
}

function main() {
  const file = process.argv[2];
  const checkOnly = process.argv.includes('--check');
  if (!file) {
    console.error('usage: convert-oklch.mjs <file> [--check]');
    process.exit(2);
  }
  const src = readFileSync(file, 'utf8');
  let converted = 0;
  let failed = [];
  let skipped = 0;

  let out = src.replace(HEX_RE, (m) => {
    const parsed = parseHex(m);
    if (!parsed) {
      skipped++;
      return m;
    }
    const { r, g, b, a } = parsed;
    const alphaStr = a === 1 ? undefined : trimAlpha(a);
    const res = bytesToOklch(r, g, b, alphaStr);
    if (!res) {
      failed.push(m);
      return m;
    }
    converted++;
    return res;
  });

  out = out.replace(RGB_RE, (m, inner) => {
    const parsed = convertRgbArgs(inner);
    if (!parsed) {
      skipped++;
      return m;
    }
    const { r, g, b, alphaStr } = parsed;
    const res = bytesToOklch(r, g, b, alphaStr === null ? undefined : alphaStr);
    if (!res) {
      failed.push(m);
      return m;
    }
    converted++;
    return res;
  });

  console.log(`converted=${converted} skipped(non-color/var)=${skipped} failed=${failed.length}`);
  if (failed.length) {
    console.log('FAILED round-trip (left untouched):');
    for (const f of [...new Set(failed)]) console.log('  ', f);
  }
  if (!checkOnly) {
    writeFileSync(file, out);
    console.log(`wrote ${file}`);
  }
}

// alpha 0..1 -> shortest string that equals the original (we derive from byte
// for hex, so use a compact decimal). For 8-digit hex alpha (n/255) keep 4 dp.
function trimAlpha(a) {
  // hex alpha is k/255; represent with enough digits to be unambiguous.
  const s = parseFloat(a.toFixed(4));
  return String(s);
}

main();

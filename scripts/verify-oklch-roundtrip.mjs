// Independent verifier: for the original CSS and the converted CSS, walk every
// color literal in order and assert the rendered sRGB bytes (+alpha) are equal.
// Original colors: hex / rgb() / rgba(). Converted: oklch(). This proves the
// codemod produced byte-identical output (zero visual drift).
//
// Usage: node scripts/verify-oklch-roundtrip.mjs <original.css> <converted.css>

import { readFileSync } from 'node:fs';

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToSrgb(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}
function oklchToLinearSrgb(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const toByte = (lin) => Math.round(clamp01(linearToSrgb(lin)) * 255);

function oklchToRgba(L, C, H, a) {
  const [lr, lg, lb] = oklchToLinearSrgb(L, C, H);
  return [toByte(lr), toByte(lg), toByte(lb), a];
}

function parseHex(hex) {
  let h = hex.slice(1);
  let r, g, b, a;
  if (h.length === 3 || h.length === 4) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
    a = h.length === 4 ? parseInt(h[3] + h[3], 16) / 255 : 1;
  } else {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
    a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  }
  return [r, g, b, a];
}
function parseRgb(inner) {
  let alpha = 1;
  let body = inner;
  const si = inner.indexOf('/');
  if (si !== -1) {
    body = inner.slice(0, si).trim();
    alpha = parseFloat(inner.slice(si + 1));
  }
  let parts = body.includes(',') ? body.split(',').map((s) => s.trim()) : body.split(/\s+/);
  if (parts.length === 4) {
    alpha = parseFloat(parts[3]);
    parts = parts.slice(0, 3);
  }
  const [r, g, b] = parts.map((p) =>
    Math.round(p.endsWith('%') ? (parseFloat(p) / 100) * 255 : Number(p)),
  );
  return [r, g, b, alpha];
}

// Extract ordered color tokens from a source string.
function extractOriginal(src) {
  // `[^)]*` is linear (negated class, single quantifier) — no backtracking.
  const re = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b|\brgba?\(([^)]*)\)/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) {
    const tok = m[0];
    if (tok[0] === '#') out.push({ tok, rgba: parseHex(tok) });
    else {
      out.push({ tok, rgba: parseRgb(m[1].trim()) });
    }
  }
  return out;
}
function extractOklch(src) {
  const re = /\boklch\(([^)]*)\)/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) {
    const inner = m[1].trim();
    let alpha = 1;
    let body = inner;
    const si = inner.indexOf('/');
    if (si !== -1) {
      body = inner.slice(0, si).trim();
      alpha = parseFloat(inner.slice(si + 1));
    }
    const [Ls, Cs, Hs] = body.split(/\s+/);
    out.push({ tok: m[0], rgba: oklchToRgba(parseFloat(Ls), parseFloat(Cs), parseFloat(Hs), alpha) });
  }
  return out;
}

function almostEqAlpha(a, b) {
  return Math.abs(a - b) < 0.0005; // alpha kept textually; tiny float tolerance
}

const [orig, conv] = process.argv.slice(2);
const a = extractOriginal(readFileSync(orig, 'utf8'));
const b = extractOklch(readFileSync(conv, 'utf8'));
if (a.length !== b.length) {
  console.error(`COUNT MISMATCH: original colors=${a.length} oklch=${b.length}`);
  process.exit(1);
}
let bad = 0;
for (let i = 0; i < a.length; i++) {
  const o = a[i].rgba;
  const c = b[i].rgba;
  if (o[0] !== c[0] || o[1] !== c[1] || o[2] !== c[2] || !almostEqAlpha(o[3], c[3])) {
    bad++;
    if (bad <= 30)
      console.error(
        `DRIFT #${i}: ${a[i].tok} -> ${b[i].tok}  [${o}] != [${c}]`,
      );
  }
}
if (bad) {
  console.error(`FAIL: ${bad}/${a.length} colors drifted`);
  process.exit(1);
}
console.log(`OK: all ${a.length} colors byte-identical (RGB exact, alpha preserved)`);

// Ported from the fitting workspace (scratch award/web/v/final/numeral.js); the
// geometry, band layout and studio were fitted to the design render 47.png.
// Award numeral "1": lofted chrome/black form + band shader + studio look (three r180, WebGL2).
// Self-contained (no imports, no image files: every texture is generated in code).
// export createNumeral(canvas, THREE, opts) renders it and returns { renderer, scene, camera,
// pivot, resize(w, h), render(), dispose() }. The form helpers (SHAPE/BACK/POSE defaults,
// numeralOutlines, numeralGeometry, placeNumeral, buildNumeralShape), the band layout (LAYOUT,
// bandGLSL) and the look (STUDIO, SATIN, LOOK, studioEnvironment, outlineDistance) are exported.
// opts: any POSE / LOOK key; opts.layout merges into LAYOUT; opts.studio / opts.satin into the
// two studios; opts.debug paints the black bands flat red; opts.dbg = "refl" | "blk" | "nrm" |
// "pos" | "chart" | "chartf" outputs reflection directions, the black mask, normals, object
// positions or band-chart coordinates (for the fitting tools). Call resize() before render().
// Design units: y up, bottom y=0, stem front-left edge x=0. Outlines are the OUTER extent of
// the solid; the flat front cap is inset by `bevel`. The solid spans z = 0 (back) .. depth
// (front cap, facing the camera). The back outline is the front one plus the BACK deltas.
export const SHAPE = {
  W: 248.1, H: 860.7, topDrop: 15.0, xL: -144.8, hL: 196.8, rBL: 30.5, rLT: 30.3, fLx: 131.2, fLy: 179.3, xR: 331.4, hR: 137.1, rBR: 30.7, rRT: 16, fRx: 81.4, fRy: 91, rTRx: 40, rTRy: 59.2, xP: 58.0, rPa: 27.3, rPb: 14.0, xF: -165.2, yFT: 683, yFB: 586.8, rF1: 14, rF2: 14, sag: 50, sagT: 0.3, yU: 621.7, rUx: 40, rUy: 70, sxU: 0, sxL: 0, yStep: 405.2, stepH: 36.1, rS: 9.9,
  // sag/sagT: the flag's front-top edge sags 50 units, bending 0.3 of the way from the peak (the
  // back outline, the silhouette, keeps sag 14 at the chord's middle: see BACK).
  // The ribbon's top-right round sits stepTR below the chrome panel's crisp corner (at xTS); the
  // right foot's top slopes down by dropR toward its end.
  stepTR: 13, xTS: 211, wTS: 5, rTS: 3, rTS2: 3, dropTR: 0, dropR: 7.6,
};
export const BACK = { sxU: -10.2, sxL: -35.5, rLT: 33.5, fLx: 1.8, fLy: 4.1, hL: -59.7, xL: 3.1, xF: 2, yFT: 10, yFB: -2, rUx: -25, rUy: -55, yU: -52.4, rF1: -6, rF2: -6, sag: -36, sagT: 0.2 };
export const POSE = {
  depth: 239.4, bevel: 12, bevelZ: 12, bevelSegs: 8, wallSegs: 6, bulge: 0, cx: 125, cy: 425, yaw: 0.4181, pitch: 0, camY: -0.5063, dist: 7.4947, fov: 17.2455, lookY: -0.0286, offX: 0.0489, offY: 0.0105,
};

function corners(P) {
  const st = P.sagT ?? 0.5, mx = P.xP + (P.xF - P.xP) * st, my = P.H + (P.yFT - P.H) * st; // flag top bend, st along the chord from the peak
  const dx = P.xF - P.xP, dy = P.yFT - P.H, l = Math.hypot(dx, dy);
  return [
    [P.xL, 0, P.rBL],
    [P.xR, 0, P.rBR],
    [P.xR, P.hR - (P.dropR ?? 0), P.rRT], // right foot end (its top slopes down by dropR toward the end)
    [P.W, P.hR, P.fRx, P.fRy], // right flare (concave)
    ...(P.stepTR > 0 ? [ // the ribbon's top-right round sits stepTR below the chrome panel's corner (at xTS)
      [P.W, P.H - P.topDrop * (1 + (P.dropTR ?? 0)) - P.stepTR, P.rTRy, P.rTRx],
      [P.xTS + P.wTS, P.H - P.topDrop * (1 + (P.dropTR ?? 0)) - P.stepTR, P.rTS2],
      [P.xTS, P.H - P.topDrop * (P.xTS - P.xP) / (P.W - P.xP), P.rTS],
    ] : [[P.W, P.H - P.topDrop, P.rTRy, P.rTRx]]), // big top-right round
    [P.xP, P.H, P.rPa, P.rPb], // peak
    [mx - dy / l * P.sag, my + dx / l * P.sag, l * 0.4, l * 0.4], // flag top bend
    [P.xF, P.yFT, P.rF1], // flag tip, top
    [P.xF, P.yFB, P.rF2], // flag tip, bottom
    [P.sxU, P.yU, P.rUx, P.rUy], // underside into the stem (concave)
    [P.sxU, P.yStep + P.stepH / 2, P.rS], // step on the stem's left edge (flat on the front)
    [P.sxL, P.yStep - P.stepH / 2, P.rS],
    [P.sxL, P.hL, P.fLy, P.fLx], // left flare (concave)
    [P.xL, P.hL, P.rLT],
  ].map(([x, y, ra = 0, rb = ra]) => ({ x, y, ra: Math.max(ra, 0.3), rb: Math.max(rb, 0.3) }));
}

// Corner i becomes a cubic from S (ra before it) to E (rb after it); radii are clamped so
// they never overlap along an edge.
function cornerCurves(c) {
  const n = c.length;
  for (let i = 0; i < n; i++) {
    const a = c[i], b = c[(i + 1) % n];
    const len = Math.hypot(b.x - a.x, b.y - a.y), need = a.rb + b.ra;
    if (need > len * 0.98) { const s = (len * 0.98) / need; a.rb *= s; b.ra *= s; }
  }
  return c.map((q, i) => {
    const p = c[(i + n - 1) % n], r = c[(i + 1) % n];
    const li = Math.hypot(p.x - q.x, p.y - q.y) || 1, lo = Math.hypot(r.x - q.x, r.y - q.y) || 1;
    const S = [q.x + (p.x - q.x) * q.ra / li, q.y + (p.y - q.y) * q.ra / li];
    const E = [q.x + (r.x - q.x) * q.rb / lo, q.y + (r.y - q.y) * q.rb / lo];
    const k = 0.55, turn = ((q.x - p.x) * (r.y - q.y) - (q.y - p.y) * (r.x - q.x)) / (li * lo);
    return { S, E, c1: [S[0] + (q.x - S[0]) * k, S[1] + (q.y - S[1]) * k], c2: [E[0] + (q.x - E[0]) * k, E[1] + (q.y - E[1]) * k],
      convex: turn > 0.05 ? Math.min(q.ra, q.rb) : Infinity };
  });
}

function sampleOutline(cv, counts) {
  const pts = [], lim = [], n = cv.length;
  for (let i = 0; i < n; i++) {
    const { S, E, c1, c2, convex } = cv[i], nc = counts.nc[i];
    for (let j = 0; j <= nc; j++) {
      const t = j / nc, u = 1 - t;
      pts.push([u * u * u * S[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * E[0],
        u * u * u * S[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * E[1]]);
      lim.push(convex);
    }
    const N = cv[(i + 1) % n].S, ne = counts.ne[i];
    for (let j = 1; j <= ne; j++) { const t = j / (ne + 1); pts.push([E[0] + (N[0] - E[0]) * t, E[1] + (N[1] - E[1]) * t]); lim.push(Infinity); }
  }
  return { pts, lim };
}

// Per-point bevel radius: tight convex corners get a smaller bevel (so the inset cap never
// folds over), easing back to the full bevel along the outline.
function bevelRadii(pts, lim, bevel, grow = 0.5) {
  const n = pts.length, r = lim.map((l) => Math.min(bevel, 0.9 * l));
  const seg = pts.map((p, i) => Math.hypot(pts[(i + 1) % n][0] - p[0], pts[(i + 1) % n][1] - p[1]));
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 1; i < 2 * n; i++) { const a = i % n, b = (i - 1) % n; r[a] = Math.min(r[a], r[b] + seg[b] * grow); }
    for (let i = 2 * n - 2; i >= 0; i--) { const a = i % n, b = (i + 1) % n; r[a] = Math.min(r[a], r[b] + seg[a] * grow); }
  }
  return r;
}

// Front and back outlines with matching point counts (so the walls connect point i to i).
export function numeralOutlines(o = {}) {
  const P = { ...SHAPE, ...(o.shape || {}) };
  const Bd = { ...BACK, ...(o.back || {}) };
  const PB = { ...P };
  for (const k in Bd) PB[k] = (P[k] ?? 0) + Bd[k];
  const cf = cornerCurves(corners(P)), cb = cornerCurves(corners(PB));
  const n = cf.length, step = o.sampleStep ?? 4;
  const counts = { nc: [], ne: [] };
  for (let i = 0; i < n; i++) {
    const arc = (cv) => Math.hypot(cv.S[0] - cv.c1[0], cv.S[1] - cv.c1[1]) + Math.hypot(cv.c1[0] - cv.c2[0], cv.c1[1] - cv.c2[1]) + Math.hypot(cv.c2[0] - cv.E[0], cv.c2[1] - cv.E[1]);
    counts.nc[i] = Math.min(o.maxSeg ?? 64, Math.max(2, Math.ceil(Math.max(arc(cf[i]), arc(cb[i])) / step)));
    const j = (i + 1) % n, len = (cv) => Math.hypot(cv[j].S[0] - cv[i].E[0], cv[j].S[1] - cv[i].E[1]);
    counts.ne[i] = Math.max(0, Math.ceil(Math.max(len(cf), len(cb)) / (step * 1.6)) - 1);
  }
  const f = sampleOutline(cf, counts), b = sampleOutline(cb, counts);
  return { front: f.pts, back: b.pts, limF: f.lim, limB: b.lim };
}

export function buildNumeralShape(THREE, o = {}) {
  const pts = numeralOutlines({ shape: o }).front;
  return new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
}

function outlineNormals(pts) {
  const n = pts.length, out = [];
  let area = 0;
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const sgn = area > 0 ? 1 : -1; // CCW: outward = (dy, -dx)
  for (let i = 0; i < n; i++) {
    const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    out.push([sgn * dy / l, -sgn * dx / l]);
  }
  return { nrm: out, ccw: area > 0 };
}

// Lofted solid: front cap, quarter-round bevel, (optionally bulging) wall, bevel, back cap.
export function numeralGeometry(THREE, opt = {}) {
  const o = { ...POSE, ...opt };
  const { front: F, back: Bk, limF, limB } = numeralOutlines(o);
  const n = F.length, nF = outlineNormals(F), nB = outlineNormals(Bk).nrm, ccw = nF.ccw;
  const S = o.bevelSegs, M = o.wallSegs, D = o.depth, zr = (o.bevelZ ?? o.bevel) / o.bevel;
  const rF = bevelRadii(F, limF, o.bevel), rB = bevelRadii(Bk, limB, o.bevel);
  // Rings from the front cap edge to the back cap edge: [outline blend u, inset(i), z(i)].
  const rings = [];
  for (let k = 0; k <= S; k++) { const th = (k / S) * Math.PI / 2; rings.push({ src: 0, off: (i) => -rF[i] * (1 - Math.sin(th)), z: (i) => D - rF[i] * zr * (1 - Math.cos(th)) }); }
  for (let m = 1; m < M; m++) { const u = m / M; rings.push({ src: u, off: () => (o.bulge || 0) * Math.sin(Math.PI * u), z: (i) => (D - rF[i] * zr) * (1 - u) + rB[i] * zr * u }); }
  for (let k = S; k >= 0; k--) { const th = (k / S) * Math.PI / 2; rings.push({ src: 1, off: (i) => -rB[i] * (1 - Math.sin(th)), z: (i) => rB[i] * zr * (1 - Math.cos(th)) }); }
  const R = rings.length, pos = new Float32Array((R * n + 2 * n) * 3);
  rings.forEach((g, k) => {
    for (let i = 0; i < n; i++) {
      const u = g.src, nx = nF.nrm[i][0] * (1 - u) + nB[i][0] * u, ny = nF.nrm[i][1] * (1 - u) + nB[i][1] * u, off = g.off(i);
      const x = F[i][0] * (1 - u) + Bk[i][0] * u + nx * off, y = F[i][1] * (1 - u) + Bk[i][1] * u + ny * off;
      pos.set([x, y, g.z(i)], (k * n + i) * 3);
    }
  });
  // Grid normals from finite differences, oriented outward.
  const nrm = new Float32Array(pos.length);
  const P = (k, i) => { const j = (k * n + ((i + n) % n)) * 3; return [pos[j], pos[j + 1], pos[j + 2]]; };
  for (let k = 0; k < R; k++) for (let i = 0; i < n; i++) {
    const a = P(k, i + 1), b = P(k, i - 1), c = P(Math.min(R - 1, k + 1), i), d = P(Math.max(0, k - 1), i);
    const t1 = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], t2 = [c[0] - d[0], c[1] - d[1], c[2] - d[2]];
    let v = [t1[1] * t2[2] - t1[2] * t2[1], t1[2] * t2[0] - t1[0] * t2[2], t1[0] * t2[1] - t1[1] * t2[0]];
    const u = rings[k].src, ex = nF.nrm[i][0] * (1 - u) + nB[i][0] * u, ey = nF.nrm[i][1] * (1 - u) + nB[i][1] * u;
    const ez = k === 0 ? 1 : k === R - 1 ? -1 : 0;
    if (v[0] * ex + v[1] * ey + v[2] * ez < 0) v = v.map((s) => -s);
    let l = Math.hypot(...v);
    if (k === 0) v = [0, 0, 1]; else if (k === R - 1) v = [0, 0, -1]; else v = v.map((s) => s / (l || 1));
    nrm.set(v, (k * n + i) * 3);
  }
  // Cap vertices (separate, flat normals).
  const capF = R * n, capB = R * n + n;
  for (let i = 0; i < n; i++) {
    pos.set(P(0, i), (capF + i) * 3); nrm.set([0, 0, 1], (capF + i) * 3);
    pos.set(P(R - 1, i), (capB + i) * 3); nrm.set([0, 0, -1], (capB + i) * 3);
  }
  const idx = [];
  for (let k = 0; k < R - 1; k++) for (let i = 0; i < n; i++) {
    const A = k * n + i, Bq = k * n + (i + 1) % n, C = (k + 1) * n + (i + 1) % n, Dq = (k + 1) * n + i;
    if (ccw) idx.push(A, C, Bq, A, Dq, C); else idx.push(A, Bq, C, A, C, Dq);
  }
  const tri = (ring, base, wantZ) => {
    const cont = []; for (let i = 0; i < n; i++) { const p = P(ring, i); cont.push(new THREE.Vector2(p[0], p[1])); }
    for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(cont, [])) {
      const pa = cont[a], pb = cont[b], pc = cont[c];
      const z = (pb.x - pa.x) * (pc.y - pa.y) - (pb.y - pa.y) * (pc.x - pa.x);
      if (z * wantZ > 0) idx.push(base + a, base + b, base + c); else idx.push(base + a, base + c, base + b);
    }
  };
  tri(0, capF, 1); tri(R - 1, capB, -1);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  g.setIndex(idx);
  return g;
}

// Places mesh (design units) under pivot and aims the camera; positive yaw shows the left side.
export function placeNumeral(mesh, pivot, camera, opt = {}) {
  const o = { ...POSE, ...opt };
  mesh.position.set(-o.cx, -o.cy, -o.depth / 2);
  pivot.scale.setScalar(1 / 440);
  pivot.rotation.set(o.pitch, o.yaw, 0);
  pivot.position.set(o.offX, o.offY, 0);
  camera.fov = o.fov;
  camera.position.set(0, o.camY, o.dist);
  camera.lookAt(0, o.lookY, 0);
  camera.updateProjectionMatrix();
}

// ---------------------------------------------------------------------------------------------
// Band layout (traced from the reference render on the fitted form).
// Bands live on a flat "chart" of the solid: the front cap keeps its own (x, y); a wall folds out
// sideways about its front edge, so a left-wall point at depth d = depth - z sits at (x - d, y)
// (right walls at x + d; the flag's top faces stay at (x, y)). Every boundary is a curve on that
// chart, so a band crosses the stem's front-left edge (chart x = 0) and runs on along the side.
// Bands, front: B (black, under the peak) | seam | chrome panel | black ribbon (top-right corner
// down to the left edge) | N (dark channel) | chrome lip | L (lower black band, into the right
// foot) | chrome ridge | C_R (right chrome strip, round the right foot) ; P (chrome panel, lower
// left) | C_L (chrome strip on the left foot). Side: black band under the flag | C_L chrome strip
// | N (narrow black band down to the foot) | chrome. Ends: flag cap and left-foot cap black.
// Lines are [a, b] for y = a + b x; curves are [y, x] knots of x = f(y).
export const LAYOUT = {
  seamX: 100, // vertical seam under the peak: B | panel
  panCh: 4, panLip: 0.01, panR: 4, panRib: 24, // panel | ribbon: groove width, (no) chrome lip, the panel's roll, the ribbon's rolled edge
  seamRB: 4, seamRP: 8, // the vertical seam's roll on the B side and on the panel side
  lipLo: [502, 0.89], lipHi: [520, 0.89], lipW: 4, // B / ribbon: chrome lip, dark channel, chrome lip
  sideTop: [506, 0.367], // side: black band above, C_L chrome strip below
  nUpF: [318, 0.955], // front: ribbon lower edge (N | ribbon, then C_R | ribbon)
  nUpS: [312, 0.47], nLoS: [289, 0.48], // side: N band edges
  lipNL: [281, 0.89], lipNLw: 4, // front: chrome lip under N (centre, half-width), framing L
  panel: [[591, 90], [602, 100], [613, 110], [624, 120], [640, 133], [660, 150], [680, 167], [700, 183], [720, 195.5], [740, 205.5], [760, 210.5], [790, 211], [880, 210]], // panel | ribbon (the groove centre)
  bl: [[560, 17], [800, 17], [825, 23], [845, 36], [880, 64]], // flag chrome | B
  lc: [[-20, 318], [95, 318], [107, 313], [123, 267], [138, 237.5], [153, 215], [169, 197], [184, 182], [199, 172], [214, 163], [229, 156.4], [244, 152], [262, 148], [300, 147], [600, 147]], // L | ridge
  lc2: [[-20, 326], [95, 326], [107, 321], [123, 275], [138, 245.5], [153, 223], [169, 205], [184, 190], [199, 180], [214, 171], [229, 166.9], [244, 165.3], [262, 164], [300, 163], [600, 163]], // ridge | C_R (the ridge tapers out round the flare)
  ll: [[-20, 245], [0, 195], [10, 170], [30, 122], [50, 89], [70, 60], [90, 39], [110, 23], [130, 13], [150, 6], [170, 1], [210, -1], [250, -1], [300, 0]], // P | L
  cp: [[-20, -55], [0, -58], [10, -60], [30, -67], [50, -68], [70, -68], [90, -67], [110, -67], [130, -66], [150, -63], [170, -59], [190, -53], [210, -45], [230, -36], [250, -24], [270, -11], [285, 0], [320, 25]], // C_L | P
  flagCapX: -173, flagLipX: -156, // flag end: black cap | chrome pillar | groove (on the bevel)
  footCapX: -146, // left foot end: black cap | C_L
  ridgeSeam: 0, ridgeR: 10, // 1: a groove between the lip and the ridge; 0: one band, rolled ridgeR at its left edge
  cornerLR: 20, // the lip under N turns up into the ridge on a round of this radius
  blSoft: 15, blSeam: 0, blY: [590, 625], // soft B | flag-chrome blend: half-width, seam on/off, its lower fade (y)
  flagEdgeX: -45, // the flag front's rounded bottom edge is chrome left of this x, dark (side band) toward the stem
  flagEdgeOccl: 0.3, // its reflection is dimmed to this (it faces the left foot below)
  underX: [-60, -35], underD: [60, 90], // the side band reaches under the flag near the stem
  edgeLip: [0, 4.5, 506, 604], // chrome lip on the stem's front-left edge: [x, half-width, y0, y1]
  cornerR: 2, // the side chrome strip meets the ribbon on a hairline seam at the front-left edge (a wide roll read as a fat chrome bar)
  nOccl: 0.1, // the N channel on the front is a deep, recessed black
  crR: 35, crGroove: 10, // the ridge + C_R meet the ribbon's lower edge on one round of this radius (the ridge | C_R groove stops this far inside it)
  nCornerR: 25, nCornerX: 10, // the lip under N turns up (round of this radius, this far left of the ridge) to close N on the right
  topAA: 1, // anti-aliased flag-top | B cut at the peak
  rim: [3, 0.1, -0.3], // groove along the front-top edge: [depth on the bevel, min n.y, min n.x]
  topBevelB: [12, 20], // near the peak (right of bl) B also covers the front bevel, past this depth range, up to the flag-top face
};

const f3 = (v) => (Math.round(v * 1000) / 1000).toFixed(3);
// The layout's curves (x = f(y)) are cubic Hermite splines (Catmull-Rom tangents) through [y, x]
// knots, linear beyond the ends. They are tabulated into a small float texture (value, slope) the
// shader reads with texelFetch: as GLSL if-chains they made the shader take seconds to compile.
const CURVES = ["panel", "bl", "lc", "lc2", "ll", "cp"];
const CURVE_Y0 = -60, CURVE_STEP = 0.5, CURVE_N = 1961; // y from -60 to 920
function hermite(knots, t) {
  const n = knots.length;
  const m = (i) => { const a = knots[Math.max(0, i - 1)], b = knots[Math.min(n - 1, i + 1)]; return (b[1] - a[1]) / (b[0] - a[0]); };
  if (t <= knots[0][0]) return [knots[0][1] + (t - knots[0][0]) * m(0), m(0)];
  for (let i = 0; i < n - 1; i++) {
    const [t0, v0] = knots[i], [t1, v1] = knots[i + 1];
    if (t > t1) continue;
    const h = t1 - t0, u = (t - t0) / h, u2 = u * u, u3 = u2 * u, m0 = m(i), m1 = m(i + 1);
    return [(2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * h * m0 + (3 * u2 - 2 * u3) * v1 + (u3 - u2) * h * m1,
      ((6 * u2 - 6 * u) * (v0 - v1) + (3 * u2 - 4 * u + 1) * h * m0 + (3 * u2 - 2 * u) * h * m1) / h];
  }
  return [knots[n - 1][1] + (t - knots[n - 1][0]) * m(n - 1), m(n - 1)];
}
export function bandCurves(THREE, L = LAYOUT) {
  const data = new Float32Array(CURVE_N * CURVES.length * 2);
  CURVES.forEach((k, r) => {
    for (let i = 0; i < CURVE_N; i++) data.set(hermite(L[k], CURVE_Y0 + i * CURVE_STEP), (r * CURVE_N + i) * 2);
  });
  const tex = new THREE.DataTexture(data, CURVE_N, CURVES.length, THREE.RGFormat, THREE.FloatType);
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  return tex;
}

export function bandGLSL(L = LAYOUT, depth = POSE.depth) {
  const ln = (k, dy = 0) => `(${f3(L[k][0] + dy)} + ${f3(L[k][1])} * x)`;
  const line = (k, dy, rn, rp, valid = '1.0') => `seamLine(acc, u, ${f3(L[k][0] + dy)}, ${f3(L[k][1])}, ${f3(rn)}, ${f3(rp)}, ${valid});`;
  return /* glsl */ `
float aaStep(float edge, float x) { float d = x - edge; float w = max(fwidth(d), 1e-4); return clamp(d / w + 0.5, 0.0, 1.0); }
uniform highp sampler2D curveTex;
// Curve row r at y = t (linear between the 0.5-unit samples, linear beyond the table); d = dx/dy.
float curveAt(int r, float t, out float d) {
  float u = (t - ${f3(CURVE_Y0)}) / ${f3(CURVE_STEP)}, uc = clamp(u, 0.0, ${f3(CURVE_N - 1)});
  int i = int(min(floor(uc), ${f3(CURVE_N - 2)}));
  vec2 v = mix(texelFetch(curveTex, ivec2(i, r), 0).rg, texelFetch(curveTex, ivec2(i + 1, r), 0).rg, uc - float(i));
  d = v.y;
  return v.x + (u - uc) * ${f3(CURVE_STEP)} * d;
}
${CURVES.map((k, r) => `float c${{ panel: "Panel", bl: "BL", lc: "LC", lc2: "LC2", ll: "LL", cp: "CP" }[k]}(float t, out float d) { return curveAt(${r}, t, d); }`).join("\n")}
// Seam bookkeeping: the strongest rounding (t = 1 - |sd| / r) wins; grooves use the nearest seam.
struct SeamAcc { float t; float sd; vec2 dir; float g; };
// valid: 0 skips the seam; values above 1 widen its groove by that factor.
void seamAdd(inout SeamAcc a, float sd, vec2 dir, float rNeg, float rPos, float valid) {
  if (valid < 0.5) return;
  float r = sd < 0.0 ? rNeg : rPos;
  float t = 1.0 - abs(sd) / max(r, 1e-3);
  if (t > a.t) { a.t = t; a.sd = sd; a.dir = dir; }
  a.g = min(a.g, abs(sd) / max(valid, 1.0));
}
// Line y = a + b x: signed distance (+ above it) and its direction.
void seamLine(inout SeamAcc a, vec2 u, float a0, float b, float rNeg, float rPos, float valid) {
  float k = inversesqrt(1.0 + b * b);
  seamAdd(a, (u.y - a0 - b * u.x) * k, vec2(-b, 1.0) * k, rNeg, rPos, valid);
}
// Curve x = f(y) with slope s = dx/dy: signed distance (+ right of it) and its direction.
void seamCurve(inout SeamAcc a, vec2 u, float fx, float s, float rNeg, float rPos, float valid) {
  float k = inversesqrt(1.0 + s * s);
  seamAdd(a, (u.x - fx) * k, vec2(1.0, -s) * k, rNeg, rPos, valid);
}
float on(bool b) { return b ? 1.0 : 0.0; }
vec2 gChart;
float gTopW;

// How black the surface is (0 chrome .. 1 black) at object point p with normal n. occl < 1 marks
// the recessed dark channels; acc collects the seams nearby (chart coordinates).
float bandCore(vec3 p, vec3 n, out float occl, out SeamAcc acc) {
  acc = SeamAcc(0.0, 1e4, vec2(0.0), 1e4);
  occl = 1.0;
  gTopW = 0.0;
  float dz = ${f3(depth)} - p.z;
  // Walls fold out sideways; the up-facing top faces stay on the front chart.
  float fold = clamp(-4.0 * n.x, -1.0, 1.0) * (p.y > 600.0 ? 1.0 - smoothstep(0.35, 0.6, n.y) : 1.0);
  float x = p.x - dz * fold, y = p.y;
  vec2 u = vec2(x, y);
  gChart = u;
  float s;
  // --- Flag end cap: black face framed by a chrome lip on the bevel.
  if (p.x < -135.0 && p.y > 560.0 && n.x < -0.3) {
    seamCurve(acc, u, ${f3(L.flagCapX)}, 0.0, 6.0, 1.5, 1.0);
    seamCurve(acc, u, ${f3(L.flagLipX)}, 0.0, 1.5, 6.0, 1.8);
    return (1.0 - aaStep(${f3(L.flagCapX)}, x)) * (1.0 - smoothstep(0.62, 0.8, abs(n.y)));
  }
  // --- Flag underside: chrome (blended in bandField); the side band reaches under it at the stem.
  // Its rounded front edge (the first ~13 units) sees the left foot below, so its reflection is dim.
  if (p.y > 470.0 && p.x < 12.0 && n.y < -0.78) {
    occl = mix(${f3(L.flagEdgeOccl)}, 1.0, smoothstep(10.0, 18.0, ${f3(depth)} - p.z));
    return 1.0;
  }
  // --- Flag top (the slope facing up-left): chrome; B wraps over the flat top right of cBL.
${L.topAA ? `  // Anti-aliased (a hard cut stair-steps along the peak): gTopW is the chrome weight there.
  gTopW = aaStep(0.35, n.y) * aaStep(600.0, p.y) * max((1.0 - aaStep(-0.25, n.x))${L.topBevelB ? ` * smoothstep(${f3(L.topBevelB[0])}, ${f3(L.topBevelB[1])}, dz)` : ""}, 1.0 - aaStep(cBL(p.y, s), p.x));
  if (gTopW > 0.999) return 0.0;` : `  if (n.y > 0.35 && p.y > 600.0 && (n.x < -0.25 || p.x < cBL(p.y, s))) return 0.0;`}
  // --- Left foot end cap: black, framed by the C_L strip on the front.
  if (p.x < -90.0 && p.y < 240.0 && n.x < -0.2 && x < ${f3(L.footCapX + 4)} && y < ${ln('nLoS', 2)}) {
    seamCurve(acc, u, ${f3(L.footCapX)}, 0.0, 4.0, 4.0, 1.0);
    return 1.0 - aaStep(${f3(L.footCapX)}, x);
  }
  // --- Chrome lip on the stem's front-left edge, between B (front) and the side band.
  if (abs(x - ${f3(L.edgeLip[0])}) < ${f3(L.edgeLip[1])} && y > ${f3(L.edgeLip[2])} && y < ${f3(L.edgeLip[3])} && dz < 13.0) {
    seamCurve(acc, u, ${f3(L.edgeLip[0] - L.edgeLip[1])}, 0.0, 6.0, 3.0, 1.0);
    seamCurve(acc, u, ${f3(L.edgeLip[0] + L.edgeLip[1])}, 0.0, 3.0, 6.0, 1.0);
    return 0.0;
  }
  float yNu = x >= 0.0 ? ${ln('nUpF')} : ${ln('nUpS')};
  float yNl = x >= 0.0 ? ${ln('lipNL', L.lipNLw)} : ${ln('nLoS')};
  if (x < 0.0) {
    // ===== Side of the stem (and the flare / foot top below N).
    float yTop = ${ln('sideTop')};
    // The flag front (cap and its rounded edges) is chrome; from flagEdgeX on toward the stem its
    // bottom edge, the fillet and the stem's front-left edge below it turn dark (side band).
    if (dz < 13.0 && y > 575.0) {
      float bevel = 1.0 - smoothstep(0.75, 0.95, n.z);
      occl = mix(1.0, ${f3(L.flagEdgeOccl)}, bevel * smoothstep(-0.15, -0.45, n.y));
      return smoothstep(${f3(L.flagEdgeX - 10)}, ${f3(L.flagEdgeX + 10)}, p.x) * bevel;
    }
    if (y > yTop) {
      ${line('sideTop', 0, 20, 16)}
      return aaStep(yTop, y);
    }
    if (y > yNu) { // C_L chrome strip; it rolls round the stem's front-left edge
      ${line('sideTop', 0, 20, 16)}
      ${line('nUpS', 0, 5, 20)}
      seamCurve(acc, u, 0.0, 0.0, ${f3(L.cornerR)}, 1.0, on(-x < ${f3(L.cornerR)}));
      return 0.0;
    }
    if (y > yNl) { // N runs round the side
      ${line('nUpS', 0, 5, 20)}
      ${line('nLoS', 0, 14, 5)}
      occl = 0.55;
      return aaStep(yNl, y) * (1.0 - aaStep(yNu, y));
    }
    // Below N: the C_L strip coming down the flare onto the foot front (chrome).
    ${line('nLoS', 0, 14, 5)}
    float cpx = cCP(y, s);
    seamCurve(acc, u, cpx, s, 4.0, 10.0, on(y < 290.0) * 1.5);
    return 0.0;
  }
  // ===== Front (and the right walls).
  if (x < ${f3(L.seamX)} && y > ${ln('lipLo')}) {
    float lo = ${ln('lipLo')}, hi = ${ln('lipHi')}, w = ${f3(L.lipW)};
    if (y < hi) { // lip channel between B and the ribbon
      ${line('lipLo', 0, 16, 2)}
      ${line('lipLo', L.lipW, 2, 3)}
      ${line('lipHi', -L.lipW, 3, 2)}
      ${line('lipHi', 0, 2, 14)}
      float chan = aaStep(lo + w, y) * (1.0 - aaStep(hi - w, y));
      occl = mix(1.0, 0.55, chan);
      return chan;
    }
    // Above the channel: B (black), fading into the flag front's chrome left of cBL (over blY).
    float blx = cBL(y, s);
    seamCurve(acc, u, blx, s, 4.0, 4.0, on(y > 585.0) * ${f3(L.blSeam)});
    ${line('lipHi', 0, 2, 14)}
    seamCurve(acc, u, ${f3(L.seamX)}, 0.0, ${f3(L.seamRB ?? 10)}, ${f3(L.seamRP ?? 10)}, 1.0);
    // B fades into the flag chrome (the reference shows a soft roll, not a hard edge).
    return 1.0 - (1.0 - smoothstep(blx - ${f3(L.blSoft)}, blx + ${f3(L.blSoft)}, x)) * smoothstep(${f3(L.blY[0])}, ${f3(L.blY[1])}, y);
  }
  if (x >= ${f3(L.seamX)} && y > yNu) {
    // Chrome panel under the peak | dark channel | chrome lip | ribbon: the channel of the B |
    // ribbon boundary carries on along the panel's lower edge (perpendicular widths panCh, panLip).
    float px = cPanel(y, s); float kp = inversesqrt(1.0 + s * s);
    float x1 = px + ${f3(L.panCh)} / kp, x2 = px + ${f3(L.panCh + L.panLip)} / kp;
    seamCurve(acc, u, ${f3(L.seamX)}, 0.0, ${f3(L.seamRB ?? 10)}, ${f3(L.seamRP ?? 10)}, on(x < px));
    seamCurve(acc, u, px, s, ${f3(L.panR)}, 2.0, 1.0);
    seamCurve(acc, u, x1, s, 2.0, 2.0, 1.0);
    seamCurve(acc, u, x2, s, 2.0, ${f3(L.panRib ?? 16)}, 1.0);
    ${line('nUpF', 0, 26, 16)}
    float chan = aaStep(px, x) * (1.0 - aaStep(x1, x));
    occl = mix(1.0, 0.55, chan);
    return aaStep(px, x) * (1.0 - aaStep(x1, x) * (1.0 - aaStep(x2, x)));
  }
  if (y > yNu) { // ribbon, left of the seam below the lip channel
    ${line('lipLo', 0, 16, 2)}
    ${line('nUpF', 0, 6, 16)}
    return 1.0;
  }
  // Below the ribbon: N | chrome lip | L, the ridge and C_R on the right, P and C_L on the left.
  float lcx = cLC(y, s); float slc = s;
  // The lip left of the ridge is 6 units wide measured across the curve (it flattens round the flare).
  float kc = inversesqrt(1.0 + slc * slc), lipX = lcx - 6.0 / kc;
  float lc2x = cLC2(y, s); float slc2 = s;
  lc2x = max(lc2x, lcx + 5.0 / kc); // the ridge right of it stays at least 5 units across
  if (x > lcx) { // ridge, then the C_R strip (chrome)
${(L.crR ?? 0) > 0 ? `    // The ridge + C_R meet the ribbon's lower edge on one large round (radius crR), not a mitre:
    // outside the round the corner is the dark N channel.
    float kN = ${f3(1 / Math.hypot(1, L.nUpF[1]))}, Rc = ${f3(L.crR)};
    float dT = (yNu - y) * kN, d2c = (x - lipX) * kc;
    bool inC = d2c < Rc && dT < Rc;
    vec2 qq = max(vec2(Rc - d2c, Rc - dT), 0.0);
    float sdR = inC ? Rc - length(qq) : min(d2c, dT); // + inside the rounded quadrant
    vec2 g2 = vec2(1.0, -slc) * kc, gT = vec2(${f3(L.nUpF[1])}, -1.0) * kN;
    vec2 gR = inC ? (dot(qq, qq) > 1e-6 ? normalize(qq.x * g2 + qq.y * gT) : g2) : (d2c < dT ? g2 : gT);
    float wT = inC ? qq.y / max(qq.x + qq.y, 1e-3) : (dT < d2c ? 1.0 : 0.0); // 0 left edge .. 1 top edge
    seamAdd(acc, sdR, gR, mix(14.0, 6.0, wT), mix(${f3(L.ridgeR)}, 26.0, wT), 1.0);
    seamCurve(acc, u, lc2x, slc2, 8.0, 26.0, on(sdR > ${f3(L.crGroove ?? 6)}));
    ${line('nUpF', 0, 6, 16)}
    occl = mix(${f3(L.nOccl ?? 0.55)}, 1.0, aaStep(0.0, sdR));
    return 1.0 - aaStep(0.0, sdR);
` : ''}    seamCurve(acc, u, lcx, slc, 3.0, 8.0, ${f3(L.ridgeSeam)});
    seamCurve(acc, u, lipX, slc, 14.0, ${f3(L.ridgeR)}, 1.0 - ${f3(L.ridgeSeam)});
    seamCurve(acc, u, lc2x, slc2, 8.0, 26.0, 1.0);
    ${line('nUpF', 0, 26, 16)}
    return 1.0 - aaStep(lcx, x);
  }
  // The chrome lip framing L: the diagonal one under N and the vertical one up the ridge's left
  // edge are one band (half-width lw) whose centre line turns the corner on a round of radius
  // cornerLR, as in the reference (N's lower edge curves up into the ridge).
  float lw = ${f3(L.lipNLw / Math.hypot(1, L.lipNL[1]))}, kL = ${f3(1 / Math.hypot(1, L.lipNL[1]))};
  float d1 = (y - ${ln('lipNL')}) * kL, d2 = (x - (lcx - lw / kc)) * kc; // the lip's right edge is exactly lcx
  vec2 qc = max(vec2(d1, d2) + ${f3(L.cornerLR)}, 0.0);
  float sdL = min(max(d1, d2), 0.0) + length(qc) - ${f3(L.cornerLR)}; // + outside L's (rounded) corner
  vec2 g1 = vec2(${f3(-L.lipNL[1])}, 1.0) * kL, g2 = vec2(1.0, -slc) * inversesqrt(1.0 + slc * slc);
  vec2 gd = dot(qc, qc) > 1e-6 ? normalize(qc.x * g1 + qc.y * g2) : (d1 > d2 ? g1 : g2);
  float vert = clamp(0.5 + (d2 - d1) / ${f3(2 * L.cornerLR)}, 0.0, 1.0); // 0 diagonal .. 1 vertical part
  seamCurve(acc, u, lcx, slc, 3.0, 6.0, ${f3(L.ridgeSeam)});
${(L.nCornerR ?? 0) > 0 ? `  // N closes on the right: the diagonal lip turns UP on a round (radius nCornerR) into a vertical
  // lip that runs on up to the ribbon's lower edge (the vertical lip also carries on down past L).
  float RN = ${f3(L.nCornerR)};
  float e1 = d1 - lw, e2 = -(d2 + ${f3(L.nCornerX ?? 0)}) - lw; // N interior: both > 0
  bool inN = e1 < RN && e2 < RN;
  vec2 qn = max(vec2(RN - e1, RN - e2), 0.0);
  float sdN = inN ? RN - length(qn) : min(e1, e2);
  vec2 gN = inN ? (dot(qn, qn) > 1e-6 ? normalize(qn.x * g1 - qn.y * g2) : g1) : (e1 < e2 ? g1 : -g2);
  seamAdd(acc, sdN, gN, 3.0, 6.0, 1.0); // lip | N` : `  seamAdd(acc, sdL - lw, gd, mix(3.0, ${f3(L.ridgeSeam > 0.5 ? 3 : L.ridgeR)}, vert), 6.0, 1.0); // lip | N
  float sdN = sdL - lw;`}
  float llx = cLL(y, s); float sll = s;
  float cpx = cCP(y, s); float scp = s;
  seamAdd(acc, sdL + lw, gd, 14.0, mix(3.0, ${f3(L.ridgeSeam > 0.5 ? 3 : L.ridgeR)}, vert), on(x > llx - 8.0)); // L | lip
  if (sdN > 0.0) { // N channel
    ${line('nUpF', 0, 6, 16)}
    occl = ${f3(L.nOccl ?? 0.55)};
    return aaStep(0.0, sdN);
  }
${(L.nCornerR ?? 0) > 0 && (L.nGap ?? 1) ? `  // Right of the up-turned lip (a band 2 lw wide) and above L's lip: a dark gap up to the ridge.
  if (sdN < -2.0 * lw && sdL > lw) {
    seamAdd(acc, sdN + 2.0 * lw, gN, 6.0, 3.0, 1.0);
    seamAdd(acc, sdL - lw, gd, mix(3.0, ${f3(L.ridgeR)}, vert), 6.0, 1.0);
    ${line('nUpF', 0, 6, 16)}
    occl = ${f3(L.nOccl ?? 0.55)};
    return (1.0 - aaStep(-2.0 * lw, sdN)) * aaStep(lw, sdL);
  }
  if (sdN < -2.0 * lw) seamAdd(acc, sdN + 2.0 * lw, gN, 6.0, 3.0, 1.0);
` : ''}  if (sdL > -lw) return 0.0; // the lip (chrome)
  seamCurve(acc, u, llx, sll, 6.0, 16.0, 1.0);
  seamCurve(acc, u, cpx, scp, 4.0, 10.0, 1.5);
  return aaStep(llx, x) * (1.0 - aaStep(-lw, sdL));
}
// The flag underside (chrome) rolls over the fillet into the black side band.
float bandField(vec3 p, vec3 n, out float occl, out SeamAcc acc) {
  float b = bandCore(p, n, occl, acc) * (1.0 - gTopW);
${L.rim ? `  // A crisp seam along the front-top edge (flag top, B and panel): a groove rimD deep on the bevel.
  if (p.y > 560.0 && n.y > ${f3(L.rim[1] ?? 0.1)} && n.x > ${f3(L.rim[2] ?? -0.7)} && ${f3(depth)} - p.z < 14.0)
    acc.g = min(acc.g, abs(${f3(depth)} - p.z - ${f3(L.rim[0])}));` : ''}
  float under = (p.y > 470.0 && p.x < 12.0) ? smoothstep(-0.66, -0.78, n.y) : 0.0;
  float dz = ${f3(depth)} - p.z;
  under *= 1.0 - smoothstep(${f3(L.underX[0])}, ${f3(L.underX[1])}, p.x) * smoothstep(${f3(L.underD[0])}, ${f3(L.underD[1])}, dz);
  return b * (1.0 - under);
}`;
}

// ---------------------------------------------------------------------------------------------
// Look: studio environment, chrome + satin-black materials, floor shadow.

// Studio lights in camera-facing spherical coordinates (degrees): azimuth 0 = toward the
// camera (+z), positive = to the right (+x); elevation 0 = horizon, +90 = straight up.
// Each light: [az, el, width, height, value, soft]; it replaces the radiance under it
// (value 0 = a black flag), with `soft` degrees of feathering on every side.
export const STUDIO = {
  sky: 0.0, horizon: 0.582, floor: 0.678, // background gradient: zenith, horizon, nadir
  // Every light is feathered at least minSoft degrees: harder edges stripe the rounded chrome
  // bands with flat-valued facets that the photo does not have.
  minSoft: 2.2,
  lights: [
    [43.52, 30.99, 136.92, 93.76, 2, 1.63], // softbox front-right high
    [73.22, 4.95, 13.91, 36.13, 0.85, 3.62], // fill tall front-right level
    [85.71, -17.53, 29.79, 80.12, 0.27, 17.77], // grey card tall right level
    [-126.42, 6.28, 60.02, 3.2, 2.62, 25], // softbox wide back-left level
    [-159.35, -9.45, 44.1, 33.51, 0, 6.45], // black flag back level
    [-70.28, 46.7, 46.61, 180, 0, 25], // black flag tall front-left high
    [22.17, -5.06, 67.15, 37.05, 0.45, 1.76], // grey card front level
    [111.8, 80.06, 41.43, 180, 0.36, 2.48], // grey card tall right overhead
    [-204.33, 68.4, 318.51, 35.13, 0.97, 25], // fill wide back overhead
    [7.24, 22.72, 58.33, 58.41, 0.16, 4.93], // grey card front high
    [45.33, -4.5, 4.23, 29.77, 8, 0.5], // bright strip tall front-right level
    [-140.96, 19.01, 2, 31.28, 1.58, 25], // softbox tall back-left level
    [-16.05, 17.13, 24.08, 25.84, 2.47, 18.55], // softbox front level
    [-165.64, -10.49, 18.74, 18.16, 8, 1.1], // bright card back level
    [-160.65, -8.71, 8.36, 25.57, 1.78, 1.53], // softbox tall back level
    [-77.73, -16.25, 47.7, 8.85, 0.43, 0.5], // grey card wide left level
    [195.16, -54.99, 114.33, 75.39, 0.15, 25], // grey card back low
    [-66.1, 29.06, 8.39, 44.32, 1.03, 0.74], // fill tall front-left high
    [-32.5, -20.78, 40.79, 5.94, 0.38, 0.9], // grey card wide front-left low
    [25.11, -2.64, 46.46, 34.13, 0.67, 2.38], // fill front level
    [-150.57, 5.36, 11.29, 8.42, 0.17, 0.5], // grey card back level
  ],
};

// The satin black sees its own studio (prefiltered at the black's roughness), fitted to the
// reference's black bands, so its broad sheen is set without touching the chrome's reflections.
export const SATIN = {
  sky: 2.716, horizon: 0.297, floor: 1.828, // background gradient: zenith, horizon, nadir
  lights: [
    [52.23, 42.18, 124.82, 106.45, 3.01, 1], // softbox front-right high
    [53.55, 43.92, 31.27, 36.73, 0, 1], // black flag front-right high
    [92.87, -25.82, 46.09, 180, 0.42, 2.68], // grey card tall right low
    [-127.81, 18.13, 54.58, 5.57, 2.59, 30], // softbox wide back-left level
    [-161.31, -14.13, 42.52, 40.39, 0, 30], // black flag back level
    [-78.14, 72.36, 54.45, 180, 0, 30], // black flag tall left overhead
    [27.01, -7.13, 72.85, 37.83, 0.31, 5.54], // grey card front level
    [103.81, 85.02, 42.59, 180, 0, 1.84], // black flag tall right overhead
    [-188.85, 63.65, 294.31, 66.11, 1.37, 1.29], // fill wide back overhead
    [6.3, 23.95, 65.94, 41.66, 0, 1.57], // black flag front high
    [31.35, -22.08, 5.96, 32.24, 4.91, 2.45], // bright strip tall front-right low
    [-95.03, 15.55, 18.52, 34.64, 1.81, 2.9], // softbox left level
    [-9.48, 13.38, 30.77, 13.63, 5.55, 1.94], // bright strip wide front level
    [-164.8, -8.29, 15.26, 20.99, 8.77, 1], // bright card back level
    [-152.69, -23.66, 8.16, 13.26, 3.4, 18.43], // softbox back low
    [-77.73, -17.58, 70.39, 17.97, 0.73, 1], // fill wide left level
    [223.45, -61.1, 167.67, 70.18, 0.25, 30], // grey card wide back-left low
    [38.21, -65.34, 49.74, 28.28, 0, 1.08], // black flag front-right low
    [-36.94, 32.41, 11.34, 37.44, 0, 1], // black flag tall front-left high
    [-13.95, -43.63, 61.23, 20.85, 1.76, 1], // softbox wide front low
    [41.24, -6.67, 58.91, 33.56, 0.47, 2.47], // grey card front-right level
    [-151.98, 26.38, 7.44, 30.99, 0.09, 1.38], // grey card tall back high
    [50.12, 15.85, 15.57, 16.15, 10.42, 1], // bright card front-right level
    [-163.15, -20.5, 14.79, 180, 0.38, 1.38], // grey card tall back low
    [72.08, 21.41, 27.6, 92.41, 0, 1.07], // black flag tall front-right high
    [100.83, -17.43, 14.8, 15, 6.21, 1.82], // bright strip right level
    [-3.5, 24.16, 50.39, 32.52, 0, 3.81], // black flag front high
    [31.5, -41.01, 24.14, 16.24, 6.57, 1], // bright card front-right low
    [49.27, -12.05, 27.41, 30.23, 0, 1], // black flag front-right level
    [50.44, 13.63, 11.39, 12.15, 12, 1.38], // bright strip front-right level
  ],
};

export const LOOK = {
  tone: "neutral", exposure: 1.0,
  // Mirror chrome; satin black (weak broad specular + a little diffuse so it reads deep, not grey).
  chrome: 0.97, chromeRough: 0.05, blackColor: 0.025, blackRough: 0.4, blackSpec: 1.0, blackF90: 0.3, rimSheen: 1.0, specAA: 2.0, specAAd: 0, // specAAd: weight of the screen-derivative term (it steps per 2x2 pixel quad and dots the seams)
  // Shading curvature: band rolls at seams, convex faces, barrel walls, a large round along the outline.
  edgeBend: 1.2, edgePow: 1.6, bulgeX: 0.75, bulgeY: 0.5,
  wallBulge: 0.6, wallZ0: 0.25, wallZ1: 0.6, outlineBend: 1.076, outlineR: 45, outlinePow: 2,
  // The flag and the top (above y0, left of x1) have tighter rounds: [radius, bend, y0, y1, x0, x1].
  outlineTop: [45, 1.076, 540, 600, 150, 200],
  // ... and the stem's right edge (right of x0..x1, above y0..y1): [radius, bend, x0, x1, y0, y1].
  outlineRight: [45, 1.076, 200, 230, 150, 190],
  // ... and the crown (the panel's top edge right of the peak) is crisp: [radius, bend, y0, y1, x0, x1, x2, x3].
  outlineCrown: [20, 1.076, 800, 825, 100, 112, 212, 217],
  // ... and so is the flag front's top edge (up-facing): [radius, bend, y0, x1, x0].
  outlineUp: [20, 1.076, 620, 110, -110],
  groove: 2.5, grooveDark: 0.0, wallFlatY: 0.85, wallBulgeTop: 0.25,
  // Floor: a soft shadow under the base, a long faint streak toward the camera, a faint reflection.
  shadow: 0.09, shadowPow: 1.5, shadowW: 1.84, shadowD: 1.0, shadowX: 0.24, shadowZ: -0.2,
  contact: 0, contactPow: 1.5, contactW: 1.4, contactD: 0.6, contactX: 0, contactZ: 0,
  streak: 0.106, streakW: 1.11, streakL: 3.0, streakX: 0.1, streakZ: 0.1, streakSoft: 0.52, streakDecay: 2.4, // fades out before the frame's bottom edge
  // The floor is glossy, not a mirror: the reflection is drawn into a reflectRes-scale target and
  // blurred by reflectBlur CSS px (0 = a sharp mirror copy).
  reflect: 0.36, reflectFade: 32, reflectBlur: 5, reflectRes: 0.5, sheen: 0, sheenDir: [1, 2, 1],
  // The flag's underside (normals below -underN0 .. -underN1) is a smooth satin grey in the photo.
  underRough: 0.5, underDim: 0.6, underN0: 0.2, underN1: 0.5,
  // The base's bottom round reflects the bright floor (floorBounce, below floorBounceH units) and
  // meets the floor in a crisp dark contact line (fading in over contactLine units).
  floorBounce: 0.6, floorBounceH: [14, 22], contactLine: [1, 5],
};

function studioRadiance(o, az, el) {
  // Background: zenith -> horizon -> nadir.
  let v = el >= 0 ? o.horizon + (o.sky - o.horizon) * Math.pow(el / 90, o.skyPow ?? 1) : o.horizon + (o.floor - o.horizon) * Math.pow(-el / 90, o.floorPow ?? 1);
  for (const [laz, lel, w, h, val, soft0 = 2] of o.lights) {
    const soft = Math.max(soft0, o.minSoft ?? 0);
    let da = Math.abs(az - laz) % 360; if (da > 180) da = 360 - da;
    const de = Math.abs(el - lel);
    const box = (d, half) => (soft <= 0 ? (d <= half ? 1 : 0) : Math.min(1, Math.max(0, (half + soft - d) / (2 * soft))));
    const s = (t) => t * t * (3 - 2 * t);
    const k = s(box(da, w / 2)) * s(box(de, h / 2));
    if (k > 0) v += (val - v) * k;
  }
  return v;
}

// A float equirect of the studio, prefiltered by PMREM.
export function studioEnvironment(THREE, renderer, studio = {}) {
  const o = { ...STUDIO, ...studio };
  const W = o.res ?? 512, H = W / 2, data = new Uint16Array(W * H * 4);
  for (let j = 0; j < H; j++) {
    const el = ((j + 0.5) / H - 0.5) * Math.PI, ce = Math.cos(el), y = Math.sin(el);
    for (let i = 0; i < W; i++) {
      const phi = ((i + 0.5) / W - 0.5) * 2 * Math.PI, x = ce * Math.cos(phi), z = ce * Math.sin(phi);
      const az = Math.atan2(x, z) * 180 / Math.PI, v = studioRadiance(o, az, el * 180 / Math.PI);
      const h = THREE.DataUtils.toHalfFloat(Math.max(0, v)), k = (j * W + i) * 4;
      data[k] = data[k + 1] = data[k + 2] = h; data[k + 3] = 15360; // 1.0
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  tex.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromEquirectangular(tex);
  tex.dispose(); pmrem.dispose();
  rt.texture.userData.target = rt; // dispose the target (its framebuffer and texture), not just the texture
  return rt.texture;
}

// Distance (design units) from each point of the front face to the outer outline, as a
// small texture: the shader rolls the face normal toward the outline so every silhouette
// edge reads as a large soft round, like the cast in the reference.
export function outlineDistance(THREE, opt, unitsPerTexel = 2, maxDist = 64) {
  const pts = numeralOutlines(opt).front;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  x0 -= 8; y0 -= 8; x1 += 8; y1 += 8;
  const W = Math.ceil((x1 - x0) / unitsPerTexel), H = Math.ceil((y1 - y0) / unitsPerTexel);
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#fff"; g.beginPath();
  pts.forEach(([x, y], i) => { const px = (x - x0) / unitsPerTexel, py = (y - y0) / unitsPerTexel; i ? g.lineTo(px, py) : g.moveTo(px, py); });
  g.closePath(); g.fill();
  const img = g.getImageData(0, 0, W, H).data;
  // Exact distance to the outline segments, for the texels within maxDist of each segment.
  const dist = new Float32Array(W * H).fill(maxDist);
  const n = pts.length, r = maxDist / unitsPerTexel;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % n];
    const tx0 = Math.max(0, Math.floor((Math.min(ax, bx) - x0) / unitsPerTexel - r)), tx1 = Math.min(W - 1, Math.ceil((Math.max(ax, bx) - x0) / unitsPerTexel + r));
    const ty0 = Math.max(0, Math.floor((Math.min(ay, by) - y0) / unitsPerTexel - r)), ty1 = Math.min(H - 1, Math.ceil((Math.max(ay, by) - y0) / unitsPerTexel + r));
    const ex = bx - ax, ey = by - ay, ll = ex * ex + ey * ey || 1;
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const px = x0 + (tx + 0.5) * unitsPerTexel - ax, py = y0 + (ty + 0.5) * unitsPerTexel - ay;
      const t = Math.min(1, Math.max(0, (px * ex + py * ey) / ll)), dx = px - ex * t, dy = py - ey * t;
      const d = Math.sqrt(dx * dx + dy * dy), k = ty * W + tx;
      if (d < dist[k]) dist[k] = d;
    }
  }
  // Half floats (normalised to 0..1): 8 bits would show as facets in the mirror finish.
  // Signed (negative outside), then a light blur that rounds the gradient kinks the polygon
  // vertices leave (they show up as dots along the rolled edge).
  let sd = new Float32Array(W * H), tmp = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) sd[i] = img[i * 4] > 127 ? dist[i] : -dist[i];
  const K = [1, 4, 6, 4, 1];
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0; for (let k = -2; k <= 2; k++) s += K[k + 2] * sd[y * W + Math.min(W - 1, Math.max(0, x + k))]; tmp[y * W + x] = s / 16; }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0; for (let k = -2; k <= 2; k++) s += K[k + 2] * tmp[Math.min(H - 1, Math.max(0, y + k)) * W + x]; sd[y * W + x] = s / 16; }
  }
  const data = new Uint16Array(W * H);
  for (let i = 0; i < W * H; i++) data[i] = THREE.DataUtils.toHalfFloat(Math.max(0, sd[i]) / maxDist);
  const tex = new THREE.DataTexture(data, W, H, THREE.RedFormat, THREE.HalfFloatType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.flipY = false; tex.needsUpdate = true;
  // Canvas rows run top-down from y0, so texture v grows with design y.
  return { tex, origin: [x0, y0], size: [W * unitsPerTexel, H * unitsPerTexel], texel: [1 / W, 1 / H], maxDist };
}

export function createNumeral(canvas, THREE, o = {}) {
  const opt = { ...POSE, ...LOOK, ...o };
  const f = (v, d = 3) => Number(v).toFixed(d);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: !!o.preserveDrawingBuffer, powerPreference: o.powerPreference || "default" });
  renderer.setClearColor(0xffffff, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = opt.tone === 'neutral' ? THREE.NeutralToneMapping : opt.tone === 'none' ? THREE.NoToneMapping : opt.tone === 'agx' ? THREE.AgXToneMapping : THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = opt.exposure;

  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(THREE, renderer, opt.studio);
  const satinEnv = studioEnvironment(THREE, renderer, { ...SATIN, ...(opt.satin || {}) });
  const geometry = numeralGeometry(THREE, opt);
  const od = opt.outlineBend > 0 ? outlineDistance(THREE, opt) : null;
  const layout = { ...LAYOUT, ...(opt.layout || {}) };
  const curveTex = bandCurves(THREE, layout);
  // Design units per pixel at unit view distance (set in resize).
  const pxScale = { value: 1e-3 };
  const D = opt.depth;

  // One material for the numeral; `mirror` builds the faded copy used for the floor reflection.
  const makeMaterial = (mirror) => {
    const material = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.1 });
    if (mirror) { material.transparent = true; material.depthWrite = false; }
    material.customProgramCacheKey = () => (mirror ? "numeral-mirror" : "numeral");
    if (opt.plain) return material;
    material.onBeforeCompile = (shader) => {
      if (od) shader.uniforms.outlineDist = { value: od.tex };
      shader.uniforms.satinEnv = { value: satinEnv };
      shader.uniforms.curveTex = { value: curveTex };
      shader.uniforms.pxScale = pxScale;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vShape;\nvarying vec3 vShapeNormal;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvShape = position;\nvShapeNormal = objectNormal;");
      const out = mirror
        ? `\ngl_FragColor.a *= ${f(opt.reflect)} * exp(-vShape.y / ${f(opt.reflectFade, 2)});`
        : opt.dbg === "refl" ? "\ngl_FragColor = vec4(inverseTransformDirection(reflect(-geometryViewDir, normal), viewMatrix) * 0.5 + 0.5, 1.0);"
        : opt.dbg === "chart" ? "\ngl_FragColor = vec4((gChart.x + 300.0) / 700.0, (gChart.y + 100.0) / 1000.0, 1.0, 1.0);"
        : opt.dbg === "chartf" ? "\ngl_FragColor = vec4(fract((gChart.x + 300.0) / 20.0), fract((gChart.y + 100.0) / 20.0), 1.0, 1.0);"
        : opt.dbg === "pos" ? "\ngl_FragColor = vec4(vShape.x / 600.0 + 0.4, vShape.y / 1000.0, vShape.z / 300.0, 1.0);"
        : opt.dbg === "blk" ? "\ngl_FragColor = vec4(vec3(blackAmt), 1.0);"
        : opt.dbg === "nrm" ? "\ngl_FragColor = vec4(inverseTransformDirection(normal, viewMatrix) * 0.5 + 0.5, 1.0);" : "";
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vShape;\nvarying vec3 vShapeNormal;\nuniform mat3 normalMatrix;\n" + (od ? "uniform sampler2D outlineDist;\n" : "") + "uniform sampler2D satinEnv;\nuniform float pxScale;\n" + bandGLSL(layout, D))
        .replace("#include <color_fragment>", `#include <color_fragment>
vec3 shapeN = normalize(vShapeNormal);
float bandOccl; SeamAcc seamAcc;
float blackAmt = bandField(vShape, shapeN, bandOccl, seamAcc);
float faceW = smoothstep(0.85, 0.98, abs(shapeN.z));
// Pixel size in design units: grooves never get thinner than a pixel, and the roll fades out
// right at a seam so the two sides' normals never flip within one pixel (no beading). From the
// view distance and the viewing angle (smooth per pixel; screen derivatives would step per 2x2
// quad and comb along the seams).
float seamPx = max(vViewPosition.z * pxScale / max(abs(dot(normalize(vNormal), normalize(vViewPosition))), 0.25), 1e-3);
diffuseColor.rgb = mix(vec3(${f(opt.chrome)}), ${opt.debug ? "vec3(1.0,0.0,0.0)" : `vec3(${f(opt.blackColor, 4)})`}, blackAmt);`)
        .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
roughnessFactor = mix(${f(opt.chromeRough)}, ${f(opt.blackRough)}, blackAmt);${opt.underRough > 0 ? `
// The flag's underside sees the busy back of the studio; in the photo it is a smooth grey, so it
// gets a broader (satin) reflection.
float underW = (vShape.y > 470.0 && vShape.x < 12.0) ? smoothstep(${f(-opt.underN0)}, ${f(-opt.underN1)}, shapeN.y) : 0.0;
roughnessFactor = mix(roughnessFactor, ${f(opt.underRough)}, underW * (1.0 - blackAmt));
bandOccl *= mix(1.0, ${f(opt.underDim)}, underW * (1.0 - blackAmt)); // it faces the foot and the stem` : ""}
// The seam itself is a narrow dark groove.
diffuseColor.rgb *= mix(${f(opt.grooveDark)}, 1.0, smoothstep(0.0, max(${f(opt.groove, 2)}, 1.3 * seamPx), seamAcc.g));`)
        .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
vec3 baseN; float rollRate;
{
  vec3 n0 = shapeN;
  // Front region: the flat cap plus the small geometric bevel around it. With the outline
  // roll on, the bevel is shaded as part of one large soft round instead.
  float frontW = ${od ? `max(faceW, smoothstep(${f(D - opt.bevel - 8, 2)}, ${f(D - opt.bevel + 2, 2)}, vShape.z))` : "faceW"};
  // A gently convex front, so the flat chrome catches gradients like a real cast.
  vec3 nF = normalize(vec3((vShape.x - 140.0) / 280.0 * ${f(opt.bulgeX)}, (vShape.y - 420.0) / 840.0 * ${f(opt.bulgeY)}, 1.0));${od ? `
  // Outline roll: within outlineR of the silhouette the face turns outward.
  vec2 ouv = (vShape.xy - vec2(${f(od.origin[0], 2)}, ${f(od.origin[1], 2)})) / vec2(${f(od.size[0], 2)}, ${f(od.size[1], 2)});
  float od0 = texture2D(outlineDist, ouv).r * ${f(od.maxDist, 1)};
  vec2 og = vec2(texture2D(outlineDist, ouv + vec2(${f(od.texel[0], 6)}, 0.0)).r - texture2D(outlineDist, ouv - vec2(${f(od.texel[0], 6)}, 0.0)).r,
                 texture2D(outlineDist, ouv + vec2(0.0, ${f(od.texel[1], 6)})).r - texture2D(outlineDist, ouv - vec2(0.0, ${f(od.texel[1], 6)})).r);
  float ogl = length(og);
  if (ogl > 1e-6) {
    float topW = smoothstep(${f(opt.outlineTop[2], 1)}, ${f(opt.outlineTop[3], 1)}, vShape.y) * (1.0 - smoothstep(${f(opt.outlineTop[4], 1)}, ${f(opt.outlineTop[5], 1)}, vShape.x));
    float rightW = smoothstep(${f(opt.outlineRight[2], 1)}, ${f(opt.outlineRight[3], 1)}, vShape.x) * smoothstep(${f(opt.outlineRight[4], 1)}, ${f(opt.outlineRight[5], 1)}, vShape.y);
    float oR = mix(mix(${f(opt.outlineR, 2)}, ${f(opt.outlineTop[0], 2)}, topW), ${f(opt.outlineRight[0], 2)}, rightW);
    float oB = mix(mix(${f(opt.outlineBend)}, ${f(opt.outlineTop[1])}, topW), ${f(opt.outlineRight[1])}, rightW);${opt.outlineCrown ? `
    // The crown (the top edge right of the peak, whose nearest outline is the top) is a crisp edge.
    float crownW = smoothstep(${f(opt.outlineCrown[2], 1)}, ${f(opt.outlineCrown[3], 1)}, vShape.y) * smoothstep(${f(opt.outlineCrown[4], 1)}, ${f(opt.outlineCrown[5], 1)}, vShape.x) * (1.0 - smoothstep(${f(opt.outlineCrown[6] ?? 1e4, 1)}, ${f(opt.outlineCrown[7] ?? 2e4, 1)}, vShape.x));
    oR = mix(oR, ${f(opt.outlineCrown[0], 2)}, crownW); oB = mix(oB, ${f(opt.outlineCrown[1])}, crownW);` : ""}${opt.outlineUp ? `
    // Up-facing edges of the flag front (its top edge, tip to peak) are tight rounds too: [radius,
    // bend, y0, x1, x0] (above y0, between x0 and x1; it eases in from x0 so it never meets the
    // tip's left edge, where a different radius would crease the roll).
    float upW = smoothstep(0.3, 0.7, -og.y / ogl) * smoothstep(${f((opt.outlineUp[4] ?? -1e4) - 20, 1)}, ${f((opt.outlineUp[4] ?? -1e4) + 20, 1)}, vShape.x) * smoothstep(${f(opt.outlineUp[2] - 10, 1)}, ${f(opt.outlineUp[2] + 10, 1)}, vShape.y) * (1.0 - smoothstep(${f(opt.outlineUp[3] - 10, 1)}, ${f(opt.outlineUp[3] + 10, 1)}, vShape.x));
    oR = mix(oR, ${f(opt.outlineUp[0], 2)}, upW); oB = mix(oB, ${f(opt.outlineUp[1])}, upW);` : ""}
    float ob = pow(clamp(1.0 - od0 / oR, 0.0, 1.0), ${f(opt.outlinePow, 2)}) * oB;
    nF = normalize(nF * cos(ob) - vec3(og / ogl, 0.0) * sin(ob));
  }` : ""}
  // Side walls: a barrel profile through the depth, so they read as rounded, not flat.
  float wallW = 1.0 - smoothstep(${f(opt.wallZ0)}, ${f(opt.wallZ1)}, abs(n0.z));
  float tz = clamp((vShape.z - ${f(D / 2, 2)}) / ${f(D / 2, 2)}, -1.0, 1.0);
  // The stem's left wall twists (its back edge steps out at y ~405); flattening the vertical
  // tilt of its normal keeps the reflections in clean vertical streaks, as in the reference.
  float flatY = ${f(opt.wallFlatY)} * wallW * step(n0.x, -0.3) * (1.0 - smoothstep(520.0, 560.0, vShape.y)) * smoothstep(200.0, 240.0, vShape.y);
  // The flag's top face gets its own (flatter) barrel: a strong one stripes it with the studio's strips.
  float topFace = smoothstep(0.3, 0.5, n0.y) * smoothstep(580.0, 600.0, vShape.y);
  vec3 nW = normalize(vec3(n0.x, n0.y * (1.0 - flatY), n0.z) + vec3(0.0, 0.0, ${f(opt.wallBulge)} * mix(1.0, ${f(opt.wallBulgeTop)}, topFace) * tz * wallW));
  vec3 n = normalize(mix(nW, nF, frontW));
  // Each band is a rounded strip: near a seam its surface rolls toward the seam.
  float t = clamp(seamAcc.t, 0.0, 1.0);
  float fa = 0.3 * seamPx, fb = 1.6 * seamPx, fu = clamp((abs(seamAcc.sd) - fa) / (fb - fa), 0.0, 1.0);
  float fade = fu * fu * (3.0 - 2.0 * fu), tp = pow(t, ${f(opt.edgePow, 2)});
  float bend = tp * ${f(opt.edgeBend)} * fade;
  // How fast the roll turns per pixel (analytic, so the anti-aliasing below is smooth per pixel;
  // screen derivatives are constant over 2x2 quads and comb along diagonal seams).
  float seamR = abs(seamAcc.sd) / max(1.0 - t, 1e-3);
  rollRate = ${f(opt.edgeBend)} * (${f(opt.edgePow, 2)} * tp / max(t, 1e-3) / max(seamR, 1e-3) * fade + tp * 6.0 * fu * (1.0 - fu) / (fb - fa)) * seamPx;
  baseN = normalize(normalMatrix * n);
  // Chart directions on this face: +x of the chart (towards the front on a left wall) and +y.
  vec3 tu = cross(vec3(0.0, 1.0, 0.0), n0);
  tu = dot(tu, tu) > 0.04 ? normalize(tu) : vec3(1.0, 0.0, 0.0);
  vec3 tv = vec3(0.0, 1.0, 0.0) - n0 * n0.y;
  tv = dot(tv, tv) > 0.04 ? normalize(tv) : vec3(0.0, 0.0, 1.0);
  vec3 tilt = -sign(seamAcc.sd) * (tu * seamAcc.dir.x + tv * seamAcc.dir.y);
  normal = normalize(normalMatrix * normalize(n * cos(bend) + tilt * sin(bend)));
}`)
        .replace("#include <lights_physical_fragment>", `#include <lights_physical_fragment>
// Specular anti-aliasing: where the rolled normal turns fast across a pixel, widen the lobe so
// the mirror reflection of the rounded band edges stays smooth instead of beading.
{
  vec3 nd = max(abs(dFdx(baseN)), abs(dFdy(baseN)));
  material.roughness = min(1.0, max(material.roughness, ${f(opt.specAA)} * max(max(max(nd.x, nd.y), nd.z) * ${f(opt.specAAd)}, rollRate)));
}
// Satin black: a weak, broad specular; rounded black band edges catch more of it.
float rimT = clamp(seamAcc.t, 0.0, 1.0);
material.specularColor *= mix(1.0, ${f(opt.blackSpec)} * (1.0 + ${f(opt.rimSheen)} * rimT * rimT), blackAmt) * bandOccl;
material.specularF90 = mix(material.specularF90, ${f(opt.blackF90)}, blackAmt) * bandOccl;`)
        .replace("#include <metalnessmap_fragment>", `#include <metalnessmap_fragment>\nmetalnessFactor = ${opt.debug ? '0.0' : 'mix(1.0, 0.0, blackAmt)'};`)
        // The black reflects the satin studio instead of the chrome's.
        .replace("#include <lights_fragment_maps>", `#include <lights_fragment_maps>
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
{
  vec3 rv = reflect(-geometryViewDir, geometryNormal);
  rv = inverseTransformDirection(normalize(mix(rv, geometryNormal, pow4(material.roughness))), viewMatrix);
  radiance = mix(radiance, textureCubeUV(satinEnv, envMapRotation * rv, material.roughness).rgb * envMapIntensity, blackAmt);${opt.floorBounce > 0 ? `
  // The base's bottom round reflects the white floor right beside it (bright), except in the
  // last few units where it meets its own contact shadow (a crisp dark line, as in the photo).
  float fbW = (1.0 - blackAmt) * smoothstep(-0.15, -0.5, shapeN.y) * (1.0 - smoothstep(${f(opt.floorBounceH[0], 1)}, ${f(opt.floorBounceH[1], 1)}, vShape.y));
  radiance = mix(radiance, vec3(${f(opt.floorBounce)} * smoothstep(${f(opt.contactLine[0], 1)}, ${f(opt.contactLine[1], 1)}, vShape.y)), fbW);` : ""}
}
#endif`)
        // The (optional) sheen light is for the satin black only: the chrome sees just the studio.
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\nreflectedLight.directDiffuse *= blackAmt;\nreflectedLight.directSpecular *= blackAmt;")
        .replace("#include <dithering_fragment>", "#include <dithering_fragment>" + out);
    };
    return material;
  };
  const mesh = new THREE.Mesh(geometry, makeMaterial(false));
  const pivot = new THREE.Group();
  pivot.add(mesh);
  scene.add(pivot);
  // A soft key from above-right-front that only the satin black responds to (broad sheen).
  if (opt.sheen > 0) {
    const key = new THREE.DirectionalLight(0xffffff, opt.sheen);
    key.position.set(...opt.sheenDir); scene.add(key);
  }

  // Floor reflection: a mirrored copy under the floor plane, fading with height (a faint,
  // glossy white floor: darker under the black bands, bright under the chrome).
  const mirror = new THREE.Group(); mirror.matrixAutoUpdate = false;
  const rmesh = new THREE.Mesh(geometry, makeMaterial(true));
  const rpivot = new THREE.Group(); rpivot.add(rmesh); mirror.add(rpivot);
  rmesh.renderOrder = 1;
  // Glossy (not mirror) floor: with reflectBlur > 0 the mirrored copy is drawn into a small
  // render target, blurred, and shown on a floor plane (screen-space lookup), so the base's
  // bands smear softly into the floor as in the photo.
  let blurRefl = null;
  if (opt.reflect > 0 && !opt.dbg) {
    if (opt.reflectBlur > 0) {
      const mscene = new THREE.Scene(); mscene.environment = scene.environment; mscene.add(mirror);
      const rtOpt = { type: THREE.HalfFloatType, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter, generateMipmaps: false };
      const rtA = new THREE.WebGLRenderTarget(1, 1, rtOpt), rtB = new THREE.WebGLRenderTarget(1, 1, { ...rtOpt, depthBuffer: false });
      const quadV = "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
      // 13-tap separable Gaussian (sigma = radius / 2.5) on premultiplied colour.
      const blurMat = new THREE.ShaderMaterial({
        uniforms: { src: { value: null }, step: { value: new THREE.Vector2() } },
        vertexShader: quadV,
        fragmentShader: `uniform sampler2D src; uniform vec2 step; varying vec2 vUv;
void main() { vec4 s = vec4(0.0); float w = 0.0;
  for (int i = -6; i <= 6; i++) { float k = exp(-float(i * i) / 12.5); s += k * texture2D(src, vUv + step * float(i)); w += k; }
  gl_FragColor = s / w; }`,
        depthTest: false, depthWrite: false, blending: THREE.NoBlending, toneMapped: false,
      });
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurMat); quad.frustumCulled = false;
      const qscene = new THREE.Scene(); qscene.add(quad);
      const qcam = new THREE.Camera();
      const res = new THREE.Vector2(1, 1);
      const floorMat = new THREE.ShaderMaterial({
        uniforms: { src: { value: rtA.texture }, res: { value: res } },
        vertexShader: "void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: `uniform sampler2D src; uniform vec2 res;
void main() { vec4 c = texture2D(src, gl_FragCoord.xy / res); float a = clamp(c.a, 0.0, 1.0);
  gl_FragColor = vec4(c.rgb / max(c.a, 1e-4), a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
        transparent: true, depthWrite: false,
      });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
      floor.rotation.x = -Math.PI / 2; floor.renderOrder = 1; scene.add(floor);
      blurRefl = {
        floor, rtA, rtB, blurMat, floorMat, quad,
        // The target is sized in CSS pixels (the blur hides its resolution); res is the drawing
        // buffer size for the floor's gl_FragCoord lookup.
        resize(w, h, dpr) { const s = opt.reflectRes; rtA.setSize(Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))); rtB.setSize(rtA.width, rtA.height); res.set(w * dpr, h * dpr); },
        draw() {
          const prevClear = renderer.getClearColor(new THREE.Color()), prevA = renderer.getClearAlpha();
          renderer.setRenderTarget(rtA); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(mscene, camera);
          const r = (opt.reflectBlur * opt.reflectRes) / 2.5; // blur radius (CSS px) in target texels -> tap spacing
          for (let it = 0; it < 2; it++) {
            blurMat.uniforms.src.value = rtA.texture; blurMat.uniforms.step.value.set(r / rtA.width, 0); renderer.setRenderTarget(rtB); renderer.render(qscene, qcam);
            blurMat.uniforms.src.value = rtB.texture; blurMat.uniforms.step.value.set(0, r / rtA.height); renderer.setRenderTarget(rtA); renderer.render(qscene, qcam);
          }
          renderer.setRenderTarget(null); renderer.setClearColor(prevClear, prevA);
        },
        dispose() { rtA.dispose(); rtB.dispose(); blurMat.dispose(); floorMat.dispose(); quad.geometry.dispose(); floor.geometry.dispose(); },
      };
    } else scene.add(mirror);
  }

  // Soft floor shadow: a wide, light ellipse plus a tighter contact shadow.
  const blob = (alpha, pow) => {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d"), grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    for (let i = 0; i <= 20; i++) { const r = i / 20, s = 1 - r * r * (3 - 2 * r); grad.addColorStop(r, `rgba(0,0,0,${(alpha * Math.pow(s, pow)).toFixed(4)})`); }
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 2; scene.add(m);
    return m;
  };
  const shadow = blob(opt.shadow, opt.shadowPow), contact = blob(opt.contact, opt.contactPow);
  // A long faint streak running toward the camera: the soft grey floor in front of the base
  // (the floor is seen at a grazing angle, so it covers many rows below the numeral).
  const streak = (() => {
    const W = 64, H = 256, c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d"), img = g.createImageData(W, H);
    const sm = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const u = Math.abs((i + 0.5) / W * 2 - 1), v = (j + 0.5) / H; // v: 0 back edge .. 1 toward the camera
      const a = opt.streak * (1 - sm((u - 1 + opt.streakSoft) / opt.streakSoft)) * sm(v / 0.06) * Math.exp(-v * opt.streakDecay);
      img.data[(j * W + i) * 4 + 3] = Math.round(255 * Math.min(1, a));
    }
    g.putImageData(img, 0, 0);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x000000, map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 2; if (opt.streak > 0) scene.add(m);
    return m;
  })();

  const camera = new THREE.PerspectiveCamera(opt.fov ?? POSE.fov, 1, 0.1, 100);
  placeNumeral(mesh, pivot, camera, opt);
  pxScale.value = 2 * Math.tan((camera.fov * Math.PI) / 360) / Math.max(1, canvas.height) / pivot.scale.y;
  rmesh.position.copy(mesh.position);
  const sync = () => {
    // Shadows sit on the floor under the base (the camera is low, so they are seen at a
    // grazing angle); the mirror copy follows the pivot.
    const fy = pivot.position.y - opt.cy * pivot.scale.y;
    shadow.position.set(pivot.position.x + opt.shadowX, fy - 0.002, opt.shadowZ); shadow.scale.set(opt.shadowW, opt.shadowD, 1);
    contact.position.set(pivot.position.x + opt.contactX, fy - 0.001, opt.contactZ); contact.scale.set(opt.contactW, opt.contactD, 1);
    streak.position.set(pivot.position.x + opt.streakX, fy - 0.0015, opt.streakZ + opt.streakL / 2); streak.scale.set(opt.streakW, opt.streakL, 1);
    rpivot.position.copy(pivot.position); rpivot.rotation.copy(pivot.rotation); rpivot.scale.copy(pivot.scale);
    mirror.matrix.makeTranslation(0, fy, 0).multiply(new THREE.Matrix4().makeScale(1, -1, 1)).multiply(new THREE.Matrix4().makeTranslation(0, -fy, 0));
    mirror.matrixWorldNeedsUpdate = true;
    if (blurRefl) blurRefl.floor.position.set(pivot.position.x, fy - 0.0025, 0);
  };
  const resize = (w, h, dpr = 1) => {
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    pxScale.value = 2 * Math.tan((camera.fov * Math.PI) / 360) / (h * dpr) / pivot.scale.y;
    if (blurRefl) blurRefl.resize(w, h, dpr);
  };
  const dispose = () => {
    scene.traverse((m) => {
      if (m.geometry) m.geometry.dispose();
      if (m.material) { if (m.material.map) m.material.map.dispose(); m.material.dispose(); }
    });
    for (const t of [scene.environment, satinEnv]) (t.userData.target ?? t).dispose(); od?.tex.dispose(); curveTex.dispose(); blurRefl?.dispose(); renderer.dispose();
  };
  return { renderer, scene, camera, pivot, resize, render: () => { sync(); if (blurRefl) blurRefl.draw(); renderer.render(scene, camera); }, dispose };
}

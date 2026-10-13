"""Split the baked-in lime seams of the ONE render into two overlays for PartsAsOne.vue.

Usage: python scripts/parts-seams.py [src=public/home/parts/one.webp] [out_dir=public/home/parts]
Needs Pillow, numpy and scipy.

one.webp (made by scripts/parts-layers.py) has the green cracks between the
black panels of O, N and E baked in. This writes, pixel-aligned with it:
    one-seams-dark.webp   the cracks closed: the panel's own dark colour, shaded
                          like a recessed gap. Laid over one.webp it shows the
                          ONE unlit; fading it out lights the cracks again, and
                          where it is gone the page shows one.webp exactly.
    one-seams-glow.webp   a soft lime bloom of the cracks (flat colour, alpha
                          only), pulsed while they are lit.
The layers are exact only on a white page (the source's backdrop). The lime is
found by its blue-yellow chroma (the body is neutral grey), grown into the
anti-aliased fringe, and the gap is filled by a harmonic luma solve, so a
different render needs the thresholds below retuned.
"""
import json
import os
import sys

import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as spla
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "..", "public", "home", "parts")
os.makedirs(OUT, exist_ok=True)
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(OUT, "one.webp")

# ----------------------------------------------------------------------------
# parameters
# ----------------------------------------------------------------------------
SEED_D = 35.0        # strong lime seed: blue-yellow chroma deficit  D = -Cb  >= 35
SEED_MIN_Y = 60.0    #                   and not a dark smear
WEAK_D = 12.0        # weak lime (the lime rule; fringe pixels within FRINGE_PX of solid lime)   D >= 12
CORE_D = 28.0        # solid lime (connected to a seed) D >= 28
FRINGE_PX = 2        # px
PALE_GB, PALE_Y, PALE_ITERS = 10.0, 140.0, 4   # pale (clipped) lime: g-b>=10, Y>=140, grown <=4px from solid lime
REF_PX = 3           # px: panel-luma reference is interpolated across the lime dilated by this much
FRINGE_LUMA_MARGIN = 6.0   # fringe pixel must be this much brighter than the panel reference
HUE_SLACK_STRONG = 8   # g >= r - 8   (yellow-green, rules out orange / red)
HUE_SLACK_WEAK = 10    # g >= r - 10
MIN_SPECK = 6        # drop matte components smaller than this (px)
DILATE_PX = 1        # dilation of the core (1px incl. diagonals)
DILATE_LUMA_MARGIN = 2.0   # ...but only into pixels brighter than the panel reference by this much
NO_DILATE_Y = 110    # never dilate into bright neutral pixels (bevel / chrome highlights)
NO_DILATE_D = 4.0
FEATHER_SLOPE = 0.5  # alpha = 1 - 0.5*dist outside the opaque mask => 1px feather
GROOVE_K = 0.72      # how dark the closed gap gets relative to the surrounding panel
GROOVE_SIGMA = 1.0   # px, smoothing of the mask that drives the groove depth (kills stair-steps)
GROOVE_T0, GROOVE_T1 = 0.50, 0.45   # groove depth ramps from smoothed-mask value T0 to T0+T1
GROOVE_FLOOR = 3.0   # absolute floor for the groove luma
FLOOR_Y0 = 350       # floor starts below the letters' base (y in one.webp)
FLOOR_D, FLOOR_MARGIN = 2.0, 4   # floor reflection of the lime: tinted (D>=2) bright floor pixels, +4px margin
SPILL_REACH = 80     # px: chroma tint connected to the seams is neutralised within this reach
SPILL_FULL = 70      # px: full neutralisation up to here, linear fade to SPILL_REACH
TINT_EPS = 1.0       # |Cb| or |Cr| >= 1 counts as codec chroma tint (body is exactly neutral)
ZONE_MIN_CHANGE = 2  # overlay only where the clean target differs from the source by >= 2 levels
LIME_GLOW = (181, 230, 29)   # #b5e61d
GLOW_S1, GLOW_S2 = 3.0, 12.0
GLOW_W1, GLOW_W2 = 0.62, 0.38
GLOW_CORE_ALPHA = 0.90
SEED_RNG = 1234


# ----------------------------------------------------------------------------
# helpers
# ----------------------------------------------------------------------------
def rgb2ycc(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    y = 0.299 * r + 0.587 * g + 0.114 * b
    cb = -0.168736 * r - 0.331264 * g + 0.5 * b
    cr = 0.5 * r - 0.418688 * g - 0.081312 * b
    return y, cb, cr


def ycc2rgb(y, cb, cr):
    r = y + 1.402 * cr
    g = y - 0.344136 * cb - 0.714136 * cr
    b = y + 1.772 * cb
    return np.stack([r, g, b], -1)


def lime_rule_strict(rgb, alpha_ok):
    """The rule used to segment (the weak/hysteresis rule): blue-yellow chroma deficit + yellow-green hue."""
    y, cb, cr = rgb2ycc(rgb)
    d = -cb
    return (d >= WEAK_D) & (rgb[..., 1] >= rgb[..., 0] - HUE_SLACK_WEAK) & alpha_ok


def lime_rule_loose(rgb, alpha_ok):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (g > r * 1.03) & (g > b * 1.5) & (g > 90) & alpha_ok


def over(dst_rgb, dst_a, src_rgb, src_a):
    """Porter-Duff 'over' on straight (non-premultiplied) float RGBA, alpha in 0..1."""
    oa = src_a + dst_a * (1 - src_a)
    num = src_rgb * src_a[..., None] + dst_rgb * (dst_a * (1 - src_a))[..., None]
    out = np.where(oa[..., None] > 1e-9, num / np.maximum(oa, 1e-9)[..., None], 0.0)
    return out, oa


def on_bg(rgb, a, bg):
    return rgb * a[..., None] + np.array(bg, float) * (1 - a[..., None])


def harmonic_fill(vals, unknown, domain):
    """Solve Laplace(u)=0 on `unknown` pixels with Dirichlet data = vals on (domain & ~unknown)."""
    h, w = vals.shape
    ids = -np.ones((h, w), np.int64)
    pos = np.flatnonzero(unknown.ravel())
    ids.ravel()[pos] = np.arange(len(pos))
    n = len(pos)
    rows, cols, data = [], [], []
    rhs = np.zeros(n)
    diag = np.zeros(n)
    for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        ys, xs = np.nonzero(unknown)
        qy, qx = ys + dy, xs + dx
        ok = (qy >= 0) & (qy < h) & (qx >= 0) & (qx < w)
        ys, xs, qy, qx = ys[ok], xs[ok], qy[ok], qx[ok]
        ok = domain[qy, qx]
        ys, xs, qy, qx = ys[ok], xs[ok], qy[ok], qx[ok]
        p = ids[ys, xs]
        np.add.at(diag, p, 1.0)
        q_unknown = unknown[qy, qx]
        # unknown neighbours -> off-diagonal
        rows.append(p[q_unknown])
        cols.append(ids[qy[q_unknown], qx[q_unknown]])
        data.append(-np.ones(q_unknown.sum()))
        # known neighbours -> rhs
        np.add.at(rhs, p[~q_unknown], vals[qy[~q_unknown], qx[~q_unknown]])
    rows.append(np.arange(n))
    cols.append(np.arange(n))
    data.append(diag)
    A = sp.csr_matrix((np.concatenate(data), (np.concatenate(rows), np.concatenate(cols))), shape=(n, n))
    # components without any known neighbour would be singular -> tiny regularisation toward the median
    # (isolated pixels fully, every other pixel by 1e-6 so a region cut off by the cut-out stays solvable)
    med = float(np.median(vals[domain & ~unknown])) if (domain & ~unknown).any() else 0.0
    reg = np.where(diag == 0, 1.0, 1e-6)
    A = A + sp.diags(reg)
    rhs = rhs + reg * med
    u = spla.spsolve(A.tocsc(), rhs)
    out = vals.copy()
    out.ravel()[pos] = u
    return out


def disk(r):
    k = int(np.ceil(r))
    yy, xx = np.mgrid[-k:k + 1, -k:k + 1]
    return (yy * yy + xx * xx) <= r * r + 1e-9


def stochastic_round(x, rng):
    """Dither-by-rounding: unbiased, no banding, deterministic with a fixed seed."""
    f = np.floor(x)
    return (f + (rng.random(x.shape) < (x - f))).astype(np.int64)


# ----------------------------------------------------------------------------
# load
# ----------------------------------------------------------------------------
im = Image.open(SRC).convert("RGBA")
A8 = np.array(im)
H, W = A8.shape[:2]
S = A8[..., :3].astype(float)          # straight RGB
As = A8[..., 3].astype(float) / 255.0  # source alpha 0..1
vis = As > 0
Y, Cb, Cr = rgb2ycc(S)
Dd = -Cb
r_, g_, b_ = S[..., 0], S[..., 1], S[..., 2]

# ----------------------------------------------------------------------------
# 1. segmentation: strong seeds + weak lime connected to a seed (hysteresis)
# ----------------------------------------------------------------------------
strong = (Dd >= SEED_D) & (g_ >= r_ - HUE_SLACK_STRONG) & (Y >= SEED_MIN_Y) & vis      # seeds
weak = (Dd >= WEAK_D) & (g_ >= r_ - HUE_SLACK_WEAK) & vis                                 # the lime rule
body = (Dd >= CORE_D) & (g_ >= r_ - HUE_SLACK_STRONG) & vis                               # solid lime
lab, nl = ndi.label(body, structure=np.ones((3, 3)))
keep = np.unique(lab[strong])
keep = keep[keep > 0]
body = np.isin(lab, keep)                                                                  # hysteresis: only lime connected to a seed
# over-exposed, pale seam cores (lime clipping towards white, g-b small but clearly yellow): geodesic growth from the solid lime
pale = (g_ - b_ >= PALE_GB) & (Y >= PALE_Y) & (g_ >= r_ - HUE_SLACK_STRONG) & vis
for _ in range(PALE_ITERS):
    body = ndi.binary_dilation(body, structure=np.ones((3, 3))) & pale | body
# anti-aliased lime fringe.  A weak-lime pixel within FRINGE_PX of the solid lime is part of the seam only if its luma is
# above what the panel would have there (ref = harmonic interpolation of the luma around the lime).  Dark smear / the
# dark groove wall / panel pixels carrying a green tint stay (their chroma is neutralised in step 2): this keeps the
# contour of the closed seam on the luma edge (smooth) instead of on the blocky 2x2 / 8x8 chroma grid of the codec.
near0 = ndi.binary_dilation(body, structure=np.ones((3, 3)), iterations=REF_PX) & vis
ref = harmonic_fill(Y, near0, vis)
near = ndi.binary_dilation(body, structure=np.ones((3, 3)), iterations=FRINGE_PX) & vis
core = body | (near & weak & (Y > ref + FRINGE_LUMA_MARGIN))
# remove tiny specks, close 1px pin-holes
lab2, n2 = ndi.label(core, structure=np.ones((3, 3)))
sizes = ndi.sum(core, lab2, index=np.arange(1, n2 + 1))
for i, s_ in enumerate(sizes, start=1):
    if s_ < MIN_SPECK:
        core[lab2 == i] = False
core = ndi.binary_closing(core, structure=np.ones((3, 3)), iterations=1) & vis | core
core = ndi.binary_fill_holes(core) & vis

# dilation (1px) but never into bright neutral pixels (bevel / chrome highlights), never into transparent pixels
dil = ndi.binary_dilation(core, structure=disk(1.5), iterations=DILATE_PX)
bright_neutral = (Y > NO_DILATE_Y) & (Dd < NO_DILATE_D)
U = (core | (dil & ~bright_neutral & (Y > ref + DILATE_LUMA_MARGIN))) & vis      # 'closed seam' mask (region to inpaint)

# ----------------------------------------------------------------------------
# 2. chroma tint zone (codec smear of the lime chroma on the black panels): neutralise chroma only
# ----------------------------------------------------------------------------
dist_core = ndi.distance_transform_edt(~core)
tinted = ((np.abs(Cb) >= TINT_EPS) | (np.abs(Cr) >= TINT_EPS)) & vis
region = (tinted | U) & (dist_core <= SPILL_REACH)
lab3, n3 = ndi.label(region, structure=np.ones((3, 3)))
keep3 = np.unique(lab3[U])
keep3 = keep3[keep3 > 0]
zone = np.isin(lab3, keep3)
w_zone = np.clip((SPILL_REACH - dist_core) / (SPILL_REACH - SPILL_FULL), 0, 1) * zone
# keep genuinely light bluish chrome highlights (Y high, Cb>0) -> leave their tint alone
w_zone[(Y > 110) & (Cb > 2.0)] = 0.0

# ----------------------------------------------------------------------------
# 3. inpaint the closed seam: harmonic luma fill + groove darkening
# ----------------------------------------------------------------------------
Yh = harmonic_fill(Y, U, vis)
Us = ndi.gaussian_filter(U.astype(float), GROOVE_SIGMA, mode="nearest")   # smoothed mask -> smooth groove contour
prof = np.clip((Us - GROOVE_T0) / GROOVE_T1, 0, 1)
prof = prof * prof * (3 - 2 * prof)                       # smoothstep
Yd = Yh * (1 - GROOVE_K * prof)
Yd = np.maximum(Yd, np.minimum(Yh, GROOVE_FLOOR))
Yt = np.where(U, Yd, Y)

# floor: the lime light is also reflected on the white floor under the vertical seams (a soft, slightly yellow band that is
# ~15 levels brighter than the floor).  Remove it with a harmonic luma fill over the tinted floor pixels (+4px margin).
yy = np.arange(H)[:, None] * np.ones((1, W))
dark_body = (Y < 110) & vis
last_dark = np.where(dark_body.any(0), H - 1 - np.argmax(dark_body[::-1], axis=0), -1)   # lowest dark-body row per column
floor = (yy > last_dark[None, :]) & (yy >= FLOOR_Y0)
cF = vis & floor & (Y > 140) & (Dd >= FLOOR_D) & ~U & zone
Fm = ndi.binary_dilation(cF, structure=disk(FLOOR_MARGIN)) & vis & floor & (Y > 150) & ~U
Yf = harmonic_fill(Y, Fm, vis & floor & (Y > 150))   # Dirichlet data from the floor only (Neumann at the letter base)
Yt = np.where(Fm, Yf, Yt)

Cb_t = Cb * (1 - w_zone)
Cr_t = Cr * (1 - w_zone)
Cb_t = np.where(U, 0.0, Cb_t)
Cr_t = np.where(U, 0.0, Cr_t)
T = np.clip(ycc2rgb(Yt, Cb_t, Cr_t), 0, 255)               # clean (dark-state) target, straight RGB, float
T = np.where((U | Fm | (w_zone > 0))[..., None], T, S)

# ----------------------------------------------------------------------------
# 4. seams-dark overlay
# ----------------------------------------------------------------------------
dist_U = ndi.distance_transform_edt(~U)
a_core = np.where(U, 1.0, np.clip(1 - FEATHER_SLOPE * dist_U, 0, 1)) * vis
changed = (np.abs(np.round(T) - S).max(-1) >= ZONE_MIN_CHANGE) & vis & ((As >= 1) | U)   # leave AA silhouette pixels outside the matte alone
a_dark = np.maximum(a_core, changed.astype(float))
a_dark = np.where(vis, a_dark, 0.0)
a_dark8 = np.round(a_dark * 255).astype(np.uint8)
a_dark = a_dark8 / 255.0

Cd = T.copy()
# partially transparent source pixels under an opaque overlay: match the appearance on white
part = (As < 1) & (a_dark > 0)
Cd[part] = (As[part, None] * T[part] + (1 - As[part, None]) * 255.0)
a_dark_eff = np.where(part & (a_dark >= 0.5), 1.0, a_dark)
a_dark_eff8 = np.round(a_dark_eff * 255).astype(np.uint8)
a_dark = a_dark_eff8 / 255.0
Cd8 = np.clip(np.round(Cd), 0, 255).astype(np.uint8)
dark = np.zeros((H, W, 4), np.uint8)
dark[..., :3] = np.where((a_dark8 > 0)[..., None] | (a_dark_eff8 > 0)[..., None], Cd8, 0)
dark[..., 3] = a_dark_eff8
dark[a_dark_eff8 == 0, :3] = 0
Image.fromarray(dark).save(os.path.join(OUT, "one-seams-dark.webp"), lossless=True, quality=100, method=6, exact=True)

# ----------------------------------------------------------------------------
# 6. seams-glow overlay
# ----------------------------------------------------------------------------
m = core.astype(float)
g1 = ndi.gaussian_filter(m, GLOW_S1, mode="constant")
g2 = ndi.gaussian_filter(m, GLOW_S2, mode="constant")
raw = GLOW_W1 * g1 / np.median(g1[core]) + GLOW_W2 * g2 / np.median(g2[core])
k = -np.log(1 - GLOW_CORE_ALPHA) / np.median(raw[core])
glow_a = 1 - np.exp(-k * raw)                # smooth saturation: no hard clip, no plateau edge
glow_a[glow_a < 1.0 / 255 * 0.25] = 0.0
rng = np.random.default_rng(SEED_RNG)
glow_a8 = np.clip(stochastic_round(glow_a * 255, rng), 0, 255).astype(np.uint8)
glow = np.zeros((H, W, 4), np.uint8)
glow[..., 0], glow[..., 1], glow[..., 2] = LIME_GLOW
glow[..., 3] = glow_a8
Image.fromarray(glow).save(os.path.join(OUT, "one-seams-glow.webp"), lossless=True, quality=100, method=6, exact=True)

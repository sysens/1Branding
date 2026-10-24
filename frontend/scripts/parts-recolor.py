"""Recolour the lime of the ONE scene's renders to the brand green #0ccc3c.

Usage: python scripts/parts-recolor.py <src> <dst> [<src> <dst> ...]
Needs Pillow and numpy.

The renders (one.webp, one-seams-glow.webp, tubes.webp, crm.webp in
public/home/parts) came with lime cracks and lights (hue ~72deg). Every pixel
near that hue moves to the hue of #0ccc3c (135deg), the green of the
headings' accents, keeping its saturation, value and alpha; near-grey pixels
(no real hue) are left as they are. Run scripts/parts-seams.py on the lime
render first (it finds the cracks by their lime), then this on its outputs,
then scripts/optimize-images.mjs.
"""
import sys
import numpy as np
from PIL import Image

SRC_HUE = 72.0
DST_HUE = 135.0
# Hues within +-HALF of the lime move fully; the next FADE degrees blend out.
HALF = 30.0
FADE = 15.0


def rgb_to_hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(-1)
    mn = rgb.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    nz = d > 1e-6
    rm = nz & (mx == r)
    gm = nz & (mx == g) & ~rm
    bm = nz & ~rm & ~gm
    h[rm] = ((g - b)[rm] / d[rm]) % 6
    h[gm] = ((b - r)[gm] / d[gm]) + 2
    h[bm] = ((r - g)[bm] / d[bm]) + 4
    h = h * 60.0
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    return h, s, mx


def hsv_to_rgb(h, s, v):
    h6 = (h % 360) / 60.0
    i = np.floor(h6).astype(int) % 6
    f = h6 - np.floor(h6)
    p = v * (1 - s)
    q = v * (1 - s * f)
    t = v * (1 - s * (1 - f))
    out = np.zeros(h.shape + (3,), dtype=np.float64)
    for k, (a, b, c) in enumerate([(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]):
        m = i == k
        out[..., 0][m] = a[m]
        out[..., 1][m] = b[m]
        out[..., 2][m] = c[m]
    return out


def recolor(src, dst):
    im = Image.open(src).convert("RGBA")
    arr = np.asarray(im).astype(np.float64) / 255
    rgb = arr[..., :3]
    h, s, v = rgb_to_hsv(rgb)
    dist = np.abs(((h - SRC_HUE + 180) % 360) - 180)
    weight = np.clip(1 - (dist - HALF) / FADE, 0, 1)
    # Near-grey pixels have no meaningful hue: leave them alone.
    weight *= np.clip((s - 0.04) / 0.08, 0, 1)
    new_h = h + (DST_HUE - SRC_HUE) * weight
    out = hsv_to_rgb(new_h, s, v)
    res = np.concatenate([out, arr[..., 3:]], -1)
    Image.fromarray(np.round(res * 255).astype(np.uint8), "RGBA").save(dst, "WEBP", quality=100, method=6, exact=True)
    moved = int((weight > 0.5).sum())
    print(f"{src} -> {dst}: {moved} px moved")


args = sys.argv[1:]
for i in range(0, len(args), 2):
    recolor(args[i], args[i + 1])

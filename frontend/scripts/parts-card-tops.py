"""Take the white line off the top edge of the service cards' faces.

Usage: python scripts/parts-card-tops.py [layer_dir=public/home/parts]
Needs Pillow and numpy. Run node scripts/optimize-images.mjs afterwards.

parts-layers.py cuts each card's face along a straight line a few pixels above
the real slab on some cards (design, photography, websites), so the face starts
with a 3-8px band of the render's white backdrop and bevel highlight. Under the
lime glow that band reads as a white gap between the glow and the card.

Here the band is measured in every face column (near-white rows above the
face's own colour), a straight line is fitted through its lower edge, and the
face is cut along that line with an antialiased edge: the glow, which follows
the layer's alpha, then meets the face itself. Cards with no band are left
alone, so running it again changes nothing.
"""
import os
import sys

import numpy as np
from PIL import Image

# Where each card's white face starts in its layer (x in layer pixels); left of
# it is the chrome side strip, which keeps its own top.
FACE_LEFT = {"naming": 34, "branding": 21, "design": 20, "photography": 21, "websites": 19, "crm": 19}
NEAR_WHITE = 244  # luminance of the backdrop and highlight (the faces are 196-243)
BRIGHTER = 6  # above the face colour a little further down
MAX_BAND = 10
MIN_COLUMNS = 20  # a band in fewer columns is just the antialiased edge
LUMA = np.array([0.299, 0.587, 0.114], np.float32)


def band_bottoms(rgba, face_left):
    """(x, y) of the first face pixel under the white band, per face column."""
    lum = rgba[..., :3].astype(np.float32) @ LUMA
    alpha = rgba[..., 3]
    points = []
    for x in range(face_left, rgba.shape[1]):
        column = np.where(alpha[:, x] > 0)[0]
        if len(column) < MAX_BAND + 8:
            continue
        top = column[0]
        face = np.median(lum[top + MAX_BAND:top + MAX_BAND + 6, x])
        band = 0
        while band < MAX_BAND and lum[top + band, x] >= NEAR_WHITE and lum[top + band, x] > face + BRIGHTER:
            band += 1
        if band >= 2:
            points.append((x, top + band))
    return np.array(points, np.float32)


def fit_line(points):
    """Least-squares line y = a + b*x, dropping points more than 1.5px off it."""
    keep = np.ones(len(points), bool)
    for _ in range(3):
        b, a = np.polyfit(points[keep, 0], points[keep, 1], 1)
        keep = np.abs(points[:, 1] - (a + b * points[:, 0])) <= 1.5
    return a, b


def cut_top(rgba, face_left):
    points = band_bottoms(rgba, face_left)
    if len(points) < MIN_COLUMNS:
        return 0
    a, b = fit_line(points)
    x_from, x_to = int(points[:, 0].min()), int(points[:, 0].max()) + 1
    alpha = rgba[..., 3].astype(np.float32)
    rows = np.arange(rgba.shape[0], dtype=np.float32)[:, None]
    xs = np.arange(x_from, x_to)
    edge = a + b * xs  # the face starts here (fractional row)
    # Coverage of each pixel row by the face: 0 above the edge, 1 below it.
    coverage = np.clip(rows + 1 - edge[None, :], 0, 1)
    before = (alpha[:, x_from:x_to] > 0).sum()
    alpha[:, x_from:x_to] *= coverage
    # The pixel the edge runs through keeps only its face share: give it the
    # colour of the face pixel under it, so no white is blended into the edge.
    for i, x in enumerate(xs):
        y = int(np.floor(edge[i]))
        if 0 <= y < rgba.shape[0] - 1:
            rgba[y, x, :3] = rgba[y + 1, x, :3]
    rgba[..., 3] = np.round(alpha).clip(0, 255).astype(np.uint8)
    return int(before - (rgba[:, x_from:x_to, 3] > 0).sum())


def main(folder):
    for key, face_left in FACE_LEFT.items():
        path = os.path.join(folder, f"{key}.webp")
        rgba = np.array(Image.open(path).convert("RGBA"))
        removed = cut_top(rgba, face_left)
        if removed:
            # Lossless, like parts-layers.py.
            Image.fromarray(rgba, "RGBA").save(path, lossless=True, method=6, exact=False)
        print(f"{key}: {removed} px of white band removed")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join("public", "home", "parts"))

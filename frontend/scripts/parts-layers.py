"""Cut the "Every part. Working as ONE." render into the layers PartsAsOne.vue animates.

Usage: python scripts/parts-layers.py <render.png> [out_dir=public/home/parts] [--cutout]
Needs Pillow, numpy and scipy. Then run scripts/parts-card-tops.py (takes the
white band off some cards' top edges) and node scripts/optimize-images.mjs.

The source is the design's 1844x524 render (white background). Every outline
below is in its pixel coordinates, so a different render needs new outlines,
and the boxes printed at the end go into PartsAsOne.vue.

Layers (bottom to top): tubes, naming ... crm, one. At rest they rebuild the
render exactly: a lower layer runs on under the layer above it with the same
pixels, so the upper one can be cut with a soft or antialiased edge.
With --cutout the objects are also cut out of the render's white backdrop and
floor (cutout() below), for a dark page; the boxes printed then differ.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from scipy.ndimage import binary_erosion, distance_transform_edt, gaussian_filter, uniform_filter1d

# Everything right of the O's outer-left contour; across the tube sockets the
# cut runs down the O's flat connector face so the letter has no tube stubs.
ONE = [(1100, -5), (1850, -5), (1850, 700), (1008, 700), (1008, 470), (1002, 410), (998, 392), (991, 380),
       (993, 372), (1000, 367), (1017, 362), (1017, 252), (1000, 247), (996, 238), (997, 228), (1001, 218),
       (1006, 208), (1012, 198), (1020, 188), (1030, 178), (1043, 168), (1060, 158), (1092, 147), (1100, 140)]
# Each card as a whole slab (TL, TR, BR, BL): the left side on the card's own
# chrome edge (the dark line just left of it is the contact shadow on the
# neighbour, and belongs to that layer), the other sides a few px generous.
# The parts hidden behind the next card are that card's pixels and stay
# covered by it.
CARDS = {
    "naming": [(33, 17), (220, 79), (220, 440), (27, 403)],
    "branding": [(181, 33), (353, 91), (353, 447), (181, 411)],
    "design": [(313, 50), (479, 105), (479, 450), (313, 418)],
    "photography": [(443, 62.5), (604, 112), (604, 449), (443, 423)],
    "websites": [(576, 71), (733, 115), (733, 449), (576, 425)],
    "crm": [(710, 80), (853, 117), (853, 449), (710, 425.5)],
}
# The top edge of each card's white face (left and right end): the backdrop above
# it, inside the card outline (the outline's top runs a little above the real
# slab), is cut away too.
FACE_TOPS = {
    "naming": [(62.4, 37.0), (196.4, 83.9)],
    "branding": [(199.9, 51.0), (331.9, 102.1)],
    "design": [(331.1, 56.4), (463.7, 100.1)],
    "photography": [(462.0, 66.2), (592.2, 106.0)],
    "websites": [(592.9, 76.1), (720.7, 111.9)],
    "crm": [(726.6, 94.3), (848.6, 130.4)],
}
EXTEND = 96  # the render is cropped through its floor shadow; continue it down
SUPERSAMPLE = 4


def smoothstep(e0, e1, x):
    t = np.clip((np.asarray(x, dtype=np.float32) - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def cutout(rgb, cards, above_faces):
    """Alpha of the objects (cards, tubes, letters) against the white backdrop and
    floor, and their colour with the backdrop taken out (rgb = a*colour + (1-a)*backdrop).

    The backdrop is the smooth, neutral, light area connected to the pure white;
    behind the objects it is interpolated from its surroundings. Inside the
    objects alpha is solid, at their edges it is a difference key against that
    backdrop, so the floor's shadows and reflections drop out and the edges keep
    their antialiasing without a white fringe. `cards` (their outlines) are always solid.
    """
    h, w, _ = rgb.shape
    lum = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
    sat = rgb.max(2) - rgb.min(2)
    smooth = gaussian_filter(lum, 1.0)
    grad = np.hypot(ndi.sobel(smooth, 1), ndi.sobel(smooth, 0)) / 8
    card_core = binary_erosion(cards > 0.5, iterations=5) & ~above_faces

    # Pure white grows into light, neutral, smooth pixels: the backdrop and the floor.
    bglike = (sat <= 9) & (((lum >= 232) & (grad <= 5.0)) | ((lum >= 160) & (grad <= 2.2)))
    labels, _ = ndi.label(bglike)
    ids = np.unique(labels[(rgb.min(2) >= 250) & bglike])
    bg = np.isin(labels, ids[ids > 0]) & (~(cards > 0.02) | above_faces)
    # Above a face, any light pixel (the antialiased tip of the outline) is backdrop.
    bg |= above_faces & (lum > 215) & (sat < 14)

    # The backdrop behind the objects: normalised convolution, wider where needed.
    backdrop = rgb.copy()
    filled = bg.copy()
    weight = bg.astype(np.float32)
    for sigma in (3, 8, 20, 50):
        num = gaussian_filter(rgb * weight[..., None], (sigma, sigma, 0))
        den = gaussian_filter(weight, sigma)
        todo = ~filled & (den > 1e-3)
        backdrop[todo] = num[todo] / den[todo, None]
        filled |= todo

    key = np.clip((np.abs(rgb - backdrop).max(2) - 6) / 26, 0, 1)
    obj = ~bg
    solid = binary_erosion(obj, iterations=2) & (key > 0.5) | card_core
    solid = ndi.binary_closing(solid, iterations=2) | solid
    alpha = np.maximum(solid.astype(np.float32), key * ndi.binary_dilation(obj, iterations=1))

    # Drop floor crumbs: keep what is attached to a card, the dark letters or the green.
    anchor = card_core | (lum < 110) | ((sat > 30) & (rgb[..., 1] > rgb[..., 0]))
    parts, count = ndi.label(alpha > 0.15, structure=np.ones((3, 3)))
    mass = ndi.sum(alpha, parts, index=np.arange(1, count + 1))
    attached = np.unique(parts[anchor])
    kept = np.isin(parts, np.intersect1d(attached[attached > 0], np.where(mass >= 300)[0] + 1))
    alpha *= kept | (alpha <= 0.15) & ndi.binary_dilation(kept, iterations=2)

    colour = np.where(alpha[..., None] > 0.02, backdrop + (rgb - backdrop) / np.maximum(alpha, 1e-3)[..., None], rgb)
    return alpha, np.clip(colour, 0, 255)


def main(src, out, cut=False):
    os.makedirs(out, exist_ok=True)
    img = np.asarray(Image.open(src).convert("RGB"), dtype=np.float32)
    h0, w, _ = img.shape
    h = h0 + EXTEND

    # Near-white background -> pure white, so the layers sit on the page's #fff.
    ink = 255 - img
    ink *= smoothstep(1.0, 4.0, ink.max(2, keepdims=True))
    # Continue the bottom rows (smoothed sideways) and fade them out.
    bottom = uniform_filter1d(ink[h0 - 6:h0].mean(0), size=31, axis=0, mode="nearest")
    # Ease the last real rows into that smoothed row so the join leaves no line.
    for k in range(8):
        ink[h0 - 8 + k] += (bottom - ink[h0 - 8 + k]) * (k + 1) / 8
    fade = (1 - np.arange(1, EXTEND + 1)[:, None, None] / EXTEND) ** 2
    rgb = np.clip(255 - np.concatenate([ink, bottom[None] * fade]), 0, 255)

    def polygon(points, dx=0):
        mask = Image.new("L", (w * SUPERSAMPLE, h * SUPERSAMPLE), 0)
        ImageDraw.Draw(mask).polygon([((x + dx) * SUPERSAMPLE, y * SUPERSAMPLE) for x, y in points], fill=255)
        return np.asarray(mask.resize((w, h), Image.BOX), dtype=np.float32) / 255

    # ONE: hard edge on the letters; under the O its floor shadow fades out to
    # the left instead of ending on the cut.
    one = polygon(ONE)
    floor = smoothstep(450, 480, np.arange(h))[:, None]
    ramp = smoothstep(940, 1008, np.arange(w))[None, :]
    one_alpha = np.maximum(one, ramp * floor)
    cards = {key: polygon(points) for key, points in CARDS.items()}
    covered = np.zeros((h, w), np.float32)
    for mask in cards.values():
        covered = np.maximum(covered, mask)
    matte = np.ones((h, w), np.float32)
    if cut:
        ys, xs = np.mgrid[0:h, 0:w]
        above = np.zeros((h, w), bool)
        keys = list(FACE_TOPS)
        for index, key in enumerate(keys):
            (x0, y0), (x1, y1) = FACE_TOPS[key]
            line = y0 + (xs - x0) * (y1 - y0) / (x1 - x0)
            # Only where this card shows: the next ones are in front of it.
            front = np.zeros((h, w), bool)
            for later in keys[index + 1:]:
                front |= cards[later] > 0.02
            mine = (cards[key] > 0.02) & ~front
            above |= mine & (ys < line - 1)
            # Left of the face is the slab's chrome side strip: above its top
            # (its first darker pixel in each column) is backdrop as well.
            lum = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
            for x in range(max(0, int(min(px for px, _ in CARDS[key])) - 1), int(x0) - 1):
                column = np.where(mine[:, x])[0]
                if not len(column):
                    continue
                dark = column[lum[column, x] < 210]
                if len(dark):
                    above[column[0]:dark[0], x] |= mine[column[0]:dark[0], x]
        matte, rgb = cutout(rgb, covered, above)
    # Tubes and floor: everything else, running 28px on under the ONE (it slides
    # in together with it). Under each card's edge the tubes stay opaque for
    # 3px, filled with the nearest pixel outside the cards, so a card edge
    # composites back exactly at rest without tracing the card before it comes.
    hole = binary_erosion(covered > 0.999, iterations=3)
    _, (iy, ix) = distance_transform_edt(covered > 0, return_indices=True)
    tubes_rgb = rgb[iy, ix]
    edge = covered < 0.999
    tubes_rgb[edge] = rgb[edge]
    tubes_alpha = (1 - polygon(ONE, 28)) * (1 - gaussian_filter(hole.astype(np.float32), 1)) * matte[iy, ix]

    boxes = {}

    def save(name, alpha, color=rgb):
        content = (alpha > 0.004) & ((255 - color.min(2)) > 0.6)
        ys, xs = np.where(content)
        x0, x1 = max(int(xs.min()) - 2, 0), min(int(xs.max()) + 3, w)
        y0, y1 = max(int(ys.min()) - 2, 0), min(int(ys.max()) + 3, h)
        rgba = np.dstack([color, alpha * 255]).round().clip(0, 255).astype(np.uint8)[y0:y1, x0:x1]
        # Lossless: lossy WebP's chroma subsampling dulls the thin green seams.
        Image.fromarray(rgba, "RGBA").save(os.path.join(out, f"{name}.webp"), lossless=True, method=6, exact=False)
        boxes[name] = [x0, y0, x1 - x0, y1 - y0]

    save("tubes", tubes_alpha, tubes_rgb)
    for key, mask in cards.items():
        save(key, mask * matte)
    save("one", one_alpha * matte)
    print(json.dumps({"width": w, "height": h, "boxes": boxes}))


if __name__ == "__main__":
    args = [arg for arg in sys.argv[1:] if arg != "--cutout"]
    main(args[0], args[1] if len(args) > 1 else os.path.join("public", "home", "parts"), "--cutout" in sys.argv)

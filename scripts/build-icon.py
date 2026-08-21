#!/usr/bin/env python3
"""Generate assets/icons/onyx.ico — the app, taskbar and installer icon.

The mark is what the name says: a faceted black gemstone, edged and lit in the
Lime accent (#70f141) that the default vlime palette uses everywhere else, so
the icon, the title bar mark and the app's chrome are visibly the same product.

The .ico is generated once and COMMITTED — `npm run package` must not depend on
Python being installed. Re-run this only when the mark itself changes:

    python scripts/build-icon.py
"""

from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFilter

ACCENT = (0x70, 0xF1, 0x41)
GEM_TOP = (0x16, 0x1D, 0x18)
GEM_BOTTOM = (0x05, 0x08, 0x06)

# Work large, downsample to each icon size: the facet lines are thin, and
# rasterising them directly at 16px turns them into mud.
SUPERSAMPLE = 1024
ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]


def gem_polygon(cx: float, cy: float, r: float) -> list[tuple[float, float]]:
    """A brilliant-cut silhouette: flat table on top, girdle, point at the bottom."""
    table_y = cy - r * 0.46
    girdle_y = cy - r * 0.13
    return [
        (cx - r * 0.43, table_y),   # table left
        (cx + r * 0.43, table_y),   # table right
        (cx + r * 0.82, girdle_y),  # girdle right
        (cx, cy + r * 0.94),        # culet (bottom point)
        (cx - r * 0.82, girdle_y),  # girdle left
    ]


def vertical_gradient(size: int, top: tuple, bottom: tuple) -> Image.Image:
    grad = Image.new('RGB', (1, size))
    for y in range(size):
        t = y / max(1, size - 1)
        grad.putpixel((0, y), tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return grad.resize((size, size), Image.BILINEAR)


def build(size: int) -> Image.Image:
    s = size
    # The silhouette spans cy-0.46r .. cy+0.94r, so its visual centre sits 0.24r
    # BELOW the geometric one. Shift up by that much or the gem hangs low in the
    # frame; size r so the gem fills the canvas with just enough room for glow.
    r = s * 0.52
    cx, cy = s / 2, s / 2 - r * 0.24
    poly = gem_polygon(cx, cy, r)
    stroke = max(2, round(s * 0.022))
    facet = max(1, round(s * 0.013))

    canvas = Image.new('RGBA', (s, s), (0, 0, 0, 0))

    # 1. Gem body: a dark vertical gradient clipped to the silhouette.
    body_mask = Image.new('L', (s, s), 0)
    ImageDraw.Draw(body_mask).polygon(poly, fill=255)
    body = vertical_gradient(s, GEM_TOP, GEM_BOTTOM).convert('RGBA')
    body.putalpha(body_mask)

    # 2. Accent glow: the outline, blurred, laid UNDER the crisp edges so the gem
    #    reads as lit rather than merely outlined (the HUD look).
    glow = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.polygon(poly, outline=ACCENT + (255,), width=max(3, round(s * 0.035)))
    glow = glow.filter(ImageFilter.GaussianBlur(s * 0.035))

    canvas = Image.alpha_composite(canvas, glow)
    canvas = Image.alpha_composite(canvas, body)

    # 3. Facets, then the outer edge on top so corners stay sharp.
    lines = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lines)
    table_l, table_r, girdle_r, culet, girdle_l = poly
    for a, b in (
        (girdle_l, girdle_r),  # girdle
        (table_l, culet),      # pavilion left
        (table_r, culet),      # pavilion right
    ):
        ld.line([a, b], fill=ACCENT + (150,), width=facet)
    ld.polygon(poly, outline=ACCENT + (255,), width=stroke)

    return Image.alpha_composite(canvas, lines)


def main() -> None:
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(root, 'assets', 'icons')
    os.makedirs(out_dir, exist_ok=True)

    master = build(SUPERSAMPLE)
    frames = [master.resize((n, n), Image.LANCZOS) for n in ICO_SIZES]

    ico_path = os.path.join(out_dir, 'onyx.ico')
    frames[-1].save(ico_path, format='ICO', sizes=[(n, n) for n in ICO_SIZES])

    # A PNG alongside it, for the README and anywhere an .ico is awkward.
    png_path = os.path.join(out_dir, 'onyx.png')
    master.resize((512, 512), Image.LANCZOS).save(png_path, format='PNG')

    print(f'wrote {ico_path} ({os.path.getsize(ico_path)} bytes, sizes {ICO_SIZES})')
    print(f'wrote {png_path}')


if __name__ == '__main__':
    main()

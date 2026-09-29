"""Diffs tests/visual/out/<name>.png against the design reference, top-aligned and cropped to the
shorter height (the design artboards carry trailing padding). Writes <name>.diff.png and prints the
share of pixels that differ by more than 24/255 in any channel."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[2]
ref_dir = root / "halo/ai-engineering-course-handoff/reference/screenshots"
out_dir = root / "tests/visual/out"
# Regions that show live data in the build but a placeholder in the design (sidebar progress card, avatar).
MASKS = {"default": [(0, 1130, 260, 1320)]}
for name in sys.argv[1:]:
    a = Image.open(ref_dir / f"{name}.png").convert("RGB")
    b = Image.open(out_dir / f"{name}.png").convert("RGB")
    for (x0, y0, x1, y1) in MASKS["default"] if name.startswith("Chapter") else []:
        for im in (a, b):
            im.paste((0, 0, 0), (x0, y0, x1, y1))
    h = min(a.height, b.height)
    A = np.asarray(a.crop((0, 0, a.width, h))).astype(int)
    B = np.asarray(b.crop((0, 0, b.width, h))).astype(int)
    d = np.abs(A - B).max(axis=2)
    frac = (d > 24).mean()
    # Anti-aliasing-insensitive view: 4x4 box-filter both, then compare (layout/colour errors survive, glyph edges don't).
    def box(x):
        hh, ww = (x.shape[0] // 4) * 4, (x.shape[1] // 4) * 4
        return x[:hh, :ww].reshape(hh // 4, 4, ww // 4, 4, 3).mean(axis=(1, 3))
    ds = np.abs(box(A) - box(B)).max(axis=2)
    frac_s = (ds > 12).mean()
    Image.fromarray(np.clip(ds * 8, 0, 255).astype("uint8")).resize((A.shape[1], A.shape[0] // 4 * 4)).save(out_dir / f"{name}.diff.png")
    print(f"{name}: ref {a.size} mine {b.size} h={h} raw>24={frac:.2%} smoothed>12={frac_s:.3%}")

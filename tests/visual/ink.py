"""Row/col ink extents in a region for ref vs mine: python ink.py Name x0 y0 x1 y1 [thr]"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
root = Path(__file__).resolve().parents[2]
name, x0, y0, x1, y1 = sys.argv[1], *map(int, sys.argv[2:6])
thr = int(sys.argv[6]) if len(sys.argv) > 6 else 60
for label, p in (("ref ", root / f"halo/ai-engineering-course-handoff/reference/screenshots/{name}.png"), ("mine", root / f"tests/visual/out/{name}.png")):
    a = np.asarray(Image.open(p).convert("L").crop((x0, y0, x1, y1))).astype(int)
    m = a > thr
    rows = np.where(m.any(axis=1))[0]; cols = np.where(m.any(axis=0))[0]
    print(label, "rows", (rows.min() + y0, rows.max() + y0) if len(rows) else None, "cols", (cols.min() + x0, cols.max() + x0) if len(cols) else None)

"""Per-band vertical drift between reference and mine: python drift.py Name [band]"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
root = Path(__file__).resolve().parents[2]
name = sys.argv[1]; band = int(sys.argv[2]) if len(sys.argv) > 2 else 80
A = np.asarray(Image.open(root / f"halo/ai-engineering-course-handoff/reference/screenshots/{name}.png").convert("L")).astype(float)
B = np.asarray(Image.open(root / f"tests/visual/out/{name}.png").convert("L")).astype(float)
H = min(len(A), len(B))
out = []
for y in range(0, H - band, band):
    seg = A[y:y + band]
    if seg.std() < 3: continue
    best = min(range(-8, 9), key=lambda dy: np.abs(seg - B[max(0, y + dy):max(0, y + dy) + band]).mean() if 0 <= y + dy and y + dy + band <= len(B) else 1e9)
    out.append(f"{y}:{best:+d}")
print(" ".join(out))

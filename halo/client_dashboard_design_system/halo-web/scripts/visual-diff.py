"""Pixel-diff the running app against the design references.

Usage (with `npm run build && npm start` on port 3000):
    pip install playwright pillow numpy && python -m playwright install chromium
    python scripts/visual-diff.py
Writes out/*.png and out/*-diff.png. 0 differing pixels = exact match at 1440x900.
"""
import asyncio, os
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

PAGES = [("/", "WebHome"), ("/agents/claims", "WebAgent")]
BASE = os.environ.get("BASE_URL", "http://localhost:3000")

async def main():
    os.makedirs("out", exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1440, "height": 900})
        for route, name in PAGES:
            await pg.goto(BASE + route)
            await pg.evaluate("document.fonts.ready")
            await pg.wait_for_timeout(500)
            await pg.screenshot(path=f"out/{name}.png")
        await b.close()
    for _, name in PAGES:
        a = np.asarray(Image.open(f"design-reference/{name}.png").convert("RGB")).astype(int)
        o = np.asarray(Image.open(f"out/{name}.png").convert("RGB")).astype(int)
        d = np.abs(a - o).max(axis=2)
        Image.fromarray(((d > 0) * 255).astype("uint8")).save(f"out/{name}-diff.png")
        print(f"{name}: {(d > 0).sum()} differing pixels (max channel delta {d.max()})")

asyncio.run(main())

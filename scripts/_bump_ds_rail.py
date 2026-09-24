from pathlib import Path
root = Path(r"d:\zenith-studio\courses\data-science")
n = 0
for p in root.glob("*.html"):
    t = p.read_text(encoding="utf-8")
    if "course-rail.js?v=10" in t:
        p.write_text(t.replace("course-rail.js?v=10", "course-rail.js?v=12"), encoding="utf-8")
        n += 1
print("bumped", n)

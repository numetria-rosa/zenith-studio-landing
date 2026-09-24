from pathlib import Path

root = Path(r"d:\zenith-studio\courses\ai-engineering")
n = 0
for p in root.glob("*.html"):
    t = p.read_text(encoding="utf-8")
    if "course-rail.js" in t:
        print("already", p.name)
        continue
    lower = t.lower()
    idx = lower.rfind("</body>")
    if idx < 0:
        print("NO BODY", p.name)
        continue
    t = t[:idx] + '<script src="course-rail.js"></script>\n' + t[idx:]
    p.write_text(t, encoding="utf-8")
    n += 1
    print("injected", p.name)
print("done", n)

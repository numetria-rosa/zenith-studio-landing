# Generate parameterized zenith-lab.css from the AISE design system
# and copy it into the other course folders.
from __future__ import annotations

import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "courses" / "ai-assisted-software-engineering" / "course.css"
UI = ROOT / "courses" / "ai-assisted-software-engineering" / "course-ui.js"

COURSES = [
    "data-science",
    "automation-engineering",
    "ai-engineering",
]


def parameterize(css: str) -> str:
    def mix(m: re.Match) -> str:
        pct = round(float(m.group(1)) * 100, 2)
        if pct == int(pct):
            pct = int(pct)
        return f"color-mix(in srgb, var(--accent) {pct}%, transparent)"

    css = re.sub(r"rgba\(\s*96\s*,\s*165\s*,\s*250\s*,\s*([0-9.]+)\s*\)", mix, css)
    css = re.sub(r"rgba\(\s*37\s*,\s*99\s*,\s*235\s*,\s*([0-9.]+)\s*\)", mix, css)
    css = css.replace("#3b82f6", "var(--accent)")
    css = css.replace("#2563eb", "var(--accent)")
    css = css.replace("#93c5fd", "color-mix(in srgb, var(--accent) 75%, white)")
    css = css.replace("#bfdbfe", "color-mix(in srgb, var(--accent) 55%, white)")
    header = (
        "/* Zenith Lab shared course chrome. Accent comes from theme.css in this folder. */\n"
    )
    css = css.replace(
        "   Zenith Lab — AI-Assisted Software Engineering",
        "   Zenith Lab — shared course design system",
    )
    return header + css


def main() -> None:
    css = parameterize(SRC.read_text(encoding="utf-8"))
    ui = UI.read_text(encoding="utf-8")
    for name in COURSES:
        dest = ROOT / "courses" / name
        (dest / "zenith-lab.css").write_text(css, encoding="utf-8")
        (dest / "course-ui.js").write_text(ui, encoding="utf-8")
        print("wrote", dest / "zenith-lab.css")


if __name__ == "__main__":
    main()

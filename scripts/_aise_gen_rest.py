# -*- coding: utf-8 -*-
"""Generate AISE modules 6-13 without touching the hand-upgraded 0-5 pages."""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import _aise_shell

SKIP = {
    "module-00.html",
    "module-01.html",
    "module-02.html",
    "module-03.html",
    "module-04.html",
    "module-05.html",
}

_orig = _aise_shell.write


def gated(path, text):
    if os.path.basename(path) in SKIP:
        print("skip %s" % os.path.basename(path))
        return
    _orig(path, text)


_aise_shell.write = gated

for name in ("_aise_stage2", "_aise_stage3", "_aise_stage4", "_aise_stage5"):
    if name in sys.modules:
        del sys.modules[name]
    __import__(name)

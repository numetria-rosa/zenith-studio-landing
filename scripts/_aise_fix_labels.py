# -*- coding: utf-8 -*-
"""One-off: the exercise markup nested a <label> inside a <label class="formrow">,
which makes a screen reader announce the whole block as the field name. The
outer wrapper is layout only, so it should be a div."""
import glob
import io
import os
import re

here = os.path.dirname(os.path.abspath(__file__))
for path in sorted(glob.glob(os.path.join(here, "_aise_stage*.py"))):
    src = io.open(path, encoding="utf-8").read()
    before = src
    src = re.sub(r'<label class="formrow"([^>]*)>', r'<div class="formrow"\1>', src)
    src = src.replace("</textarea></label>", "</textarea></div>")
    src = src.replace('"></label>', '"></div>')
    if src != before:
        io.open(path, "w", encoding="utf-8", newline="\n").write(src)
        print("patched %s" % os.path.basename(path))
    else:
        print("no change %s" % os.path.basename(path))

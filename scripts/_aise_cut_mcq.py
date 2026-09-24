# -*- coding: utf-8 -*-
"""One-off surgery on _gen_aise_tasks.py.

Removes the four multiple-choice blocks (specs, git, review, integrated) and
the now-unused choice_task helper, and wires in the graded replacements from
_aise_judgment_tasks.py. Run once; it is idempotent and reports if there is
nothing to do.
"""
import io
import os

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_gen_aise_tasks.py")

with io.open(SRC, encoding="utf-8") as f:
    lines = f.readlines()


def find(prefix, start=0):
    for i in range(start, len(lines)):
        if lines[i].startswith(prefix):
            return i
    raise SystemExit("marker not found: %r" % prefix)


EXTEND = """# ---- Judgment libraries (graded, not multiple choice) ----
# specs: write the acceptance criteria. git: write the command. review:
# verdict plus a written reason per hunk. detective: charge sheet then proof.
tasks.extend(SPEC_TASKS)
tasks.extend(GIT_TASKS)
tasks.extend(REVIEW_TASKS)
tasks.extend(DETECTIVE_TASKS)

"""

if "tasks.extend(SPEC_TASKS)" in "".join(lines):
    raise SystemExit("already cut; nothing to do")

# Block 2 first, so earlier indices stay valid.
integ_start = find("# Integrated 15")
emit_start = find("# Emit JS", integ_start)
lines[integ_start:emit_start] = ["tasks.extend(INTEGRATED_TASKS)\n", "\n"]

choice_start = find("def choice_task(")
testing_start = find("# Testing 20", choice_start)
lines[choice_start:testing_start] = [EXTEND]

with io.open(SRC, "w", encoding="utf-8", newline="\n") as f:
    f.writelines(lines)

print("cut MCQ blocks from %s" % SRC)

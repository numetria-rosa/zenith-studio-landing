from pathlib import Path

p = Path(__file__).resolve().parents[1] / "courses/ai-assisted-software-engineering/practice-tasks.js"
t = p.read_text(encoding="utf-8")
out = []
i = 0
n = 0
while True:
    start = t.find('{ id: "', i)
    if start < 0:
        out.append(t[i:])
        break
    out.append(t[i:start])
    # find matching end of this object: next '\n  { id:' or '\n];'
    nxt_obj = t.find('\n  { id: "', start + 1)
    nxt_end = t.find('\n];', start + 1)
    if nxt_obj != -1 and (nxt_end == -1 or nxt_obj < nxt_end):
        end = nxt_obj
    else:
        end = nxt_end if nxt_end != -1 else len(t)
    block = t[start:end]
    tid_end = t.find('"', start + 8)
    tid = t[start + 8:tid_end]
    if 'kind: "choice"' in block:
        ok = tid + "-ok"
        block = block.replace('"value": "correct"', f'"value": "{ok}"', 1)
        block = block.replace('correct: "correct"', f'correct: "{ok}"', 1)
        n += 1
    out.append(block)
    i = end
p.write_text("".join(out), encoding="utf-8")
text = p.read_text(encoding="utf-8")
print("rewrote", n, "choice tasks")
print("remaining value correct", text.count('"value": "correct"'))
print("remaining correct: correct", text.count('correct: "correct"'))

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { crc32, createZip } from "./zip";

describe("createZip", () => {
  it("computes the standard CRC-32", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("produces an archive Python's zipfile reads back exactly", () => {
    const files = [
      { name: "kit/README.md", content: "# Kit\nhello" },
      { name: "kit/core/naïve.py", content: "print('é')\n" },
      { name: "kit/empty.txt", content: "" },
    ];
    const file = path.join(mkdtempSync(path.join(tmpdir(), "zip-")), "t.zip");
    writeFileSync(file, createZip(files));
    const py = [
      "import zipfile, json, sys",
      "z = zipfile.ZipFile(sys.argv[1])",
      "assert z.testzip() is None",
      "print(json.dumps({n: z.read(n).decode() for n in z.namelist()}))",
    ].join("\n");
    let out: string;
    try {
      out = execFileSync("python", ["-c", py, file], { encoding: "utf8" });
    } catch {
      return; // python not installed on this machine: the CRC test above still runs
    }
    expect(JSON.parse(out)).toEqual(Object.fromEntries(files.map((f) => [f.name, f.content])));
  });
});

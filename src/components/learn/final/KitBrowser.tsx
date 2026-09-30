"use client";

import { useMemo, useState } from "react";
import { CodeBlock } from "@/components/obsidian/CodeBlock";
import { Icon } from "@/components/obsidian/Icon";
import { languageFor } from "@/components/obsidian/highlight";
import type { TreeNode } from "@/lib/aie/final-module";

const BLUE = "#8FD4FF";
const MINT = "#7FF0BD";

/** Dim right-hand hint for a row: a folder lists what is inside it, a file shows its length. All taken from the real kit. */
function hint(n: TreeNode, files: Record<string, string>): string {
  if (n.kind === "file") return files[n.path] ? `${files[n.path]!.split("\n").length} lines` : "";
  const names = (n.children ?? []).map((c) => c.name.replace(/\.[a-z]+$/, "").replace(/^__init__$/, "")).filter(Boolean);
  const shown = names.slice(0, 3).join(" · ");
  return names.length > 3 ? `${shown} · +${names.length - 3}` : shown;
}

function Tree({ nodes, files, open, toggle, selected, select, mine, depth = 0 }: {
  nodes: TreeNode[];
  files: Record<string, string>;
  open: Set<string>;
  toggle: (p: string) => void;
  selected: string;
  select: (p: string) => void;
  mine: string;
  depth?: number;
}) {
  return (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
      {nodes.map((n) => {
        const isDir = n.kind === "dir";
        const isOpen = open.has(n.path);
        const isSel = selected === n.path;
        const color = isDir ? (n.path === mine ? MINT : BLUE) : undefined;
        return (
          <li key={n.path}>
            <button
              type="button"
              aria-expanded={isDir ? isOpen : undefined}
              aria-current={isSel ? "true" : undefined}
              onClick={() => (isDir ? toggle(n.path) : select(n.path))}
              className={`flex min-h-10 w-full items-center gap-3 rounded-xl pr-3 text-left font-mono text-[14.5px] transition-colors hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-cyan ${isSel ? "bg-[rgba(92,200,255,0.10)]" : ""}`}
              style={{ paddingLeft: 10 + depth * 26 }}
            >
              <span className="flex w-[18px] shrink-0 justify-center" style={{ color: color ?? "#A9AEBA", opacity: isDir && !isOpen ? 0.75 : 1 }}>
                <Icon name={isDir ? "folder" : "file"} size={17} />
              </span>
              <span className={`${isDir ? "shrink-0 font-medium" : `min-w-0 truncate ${isSel ? "text-frost" : "text-soft"}`}`} style={color ? { color } : undefined}>
                {n.name}
                {isDir ? "/" : ""}
              </span>
              <span className="ml-auto hidden min-w-0 truncate pl-3 text-[11.5px] tracking-[0.02em] text-dim sm:inline">{hint(n, files)}</span>
            </button>
            {isDir && isOpen && (
              <Tree nodes={n.children ?? []} files={files} open={open} toggle={toggle} selected={selected} select={select} mine={mine} depth={depth + 1} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Folder tree on the left, highlighted file on the right. `files` maps kit-relative paths to their text. */
export function KitBrowser({ tree, files, initial }: { tree: TreeNode[]; files: Record<string, string>; initial: string }) {
  // The folder of the agent being read is tinted mint so it stands out from the shared code.
  const mine = initial.split("/").slice(0, -1).join("/");
  const [selected, setSelected] = useState(initial);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() => {
    const dirs = new Set<string>();
    const parts = initial.split("/");
    for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join("/"));
    return dirs;
  });
  const code = files[selected] ?? "";
  const lines = useMemo(() => code.split("\n").length, [code]);

  const toggle = (p: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(p)) next.add(p);
      return next;
    });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.3fr)]">
      <div className="flex max-h-[620px] min-w-0 flex-col overflow-hidden rounded-[20px] border border-white/10 bg-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2 border-b border-white/[0.08] px-4 py-3">
          <span aria-hidden className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <span aria-hidden className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
          <span aria-hidden className="h-3 w-3 rounded-full bg-[#28C840]" />
          <span className="ml-3 truncate font-mono text-[12.5px] text-mist">Final module · repository</span>
        </div>
        <div className="overflow-auto p-3" role="navigation" aria-label="Code kit folders">
          <div className="flex min-h-10 items-center gap-3 px-2.5 font-mono text-[14.5px] font-medium" style={{ color: BLUE }}>
            <span className="flex w-[18px] justify-center"><Icon name="folder" size={17} /></span>
            final-module/
          </div>
          <div className="ml-[13px] border-l border-white/[0.08] pl-1">
            <Tree nodes={tree} files={files} open={open} toggle={toggle} selected={selected} select={(p) => { setSelected(p); setCopied(false); }} mine={mine} />
          </div>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[12.5px] text-mist">
            kit/{selected} · {lines} lines
          </span>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(code);
              setCopied(true);
            }}
            className="glass inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[14px] text-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
          >
            <Icon name={copied ? "check" : "copy"} size={15} color={copied ? "#7FF0BD" : "currentColor"} />
            {copied ? "Copied" : "Copy file"}
          </button>
        </div>
        <CodeBlock code={code} language={languageFor(selected)} filename={selected.split("/").pop()} maxHeight={520} />
      </div>
    </div>
  );
}

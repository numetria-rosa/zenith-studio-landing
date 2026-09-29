"use client";

import { useMemo, useState } from "react";
import { CodeBlock } from "@/components/obsidian/CodeBlock";
import { Icon } from "@/components/obsidian/Icon";
import { languageFor } from "@/components/obsidian/highlight";
import type { TreeNode } from "@/lib/aie/final-module";

function Tree({ nodes, open, toggle, selected, select, depth = 0 }: {
  nodes: TreeNode[];
  open: Set<string>;
  toggle: (p: string) => void;
  selected: string;
  select: (p: string) => void;
  depth?: number;
}) {
  return (
    <ul className="m-0 list-none p-0">
      {nodes.map((n) => (
        <li key={n.path}>
          {n.kind === "dir" ? (
            <>
              <button
                type="button"
                aria-expanded={open.has(n.path)}
                onClick={() => toggle(n.path)}
                className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-left font-mono text-[13px] text-cyan hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-cyan"
                style={{ paddingLeft: 8 + depth * 14 }}
              >
                <Icon name="chevron" size={13} className={open.has(n.path) ? "" : "-rotate-90"} />
                {n.name}/
              </button>
              {open.has(n.path) && (
                <Tree nodes={n.children ?? []} open={open} toggle={toggle} selected={selected} select={select} depth={depth + 1} />
              )}
            </>
          ) : (
            <button
              type="button"
              aria-current={selected === n.path ? "true" : undefined}
              onClick={() => select(n.path)}
              className={`flex min-h-9 w-full items-center rounded-lg px-2 text-left font-mono text-[13px] focus-visible:outline-2 focus-visible:outline-cyan ${
                selected === n.path ? "bg-[rgba(92,200,255,0.10)] text-frost" : "text-soft hover:bg-white/[0.04]"
              }`}
              style={{ paddingLeft: 8 + depth * 14 + 21 }}
            >
              {n.name}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Folder tree on the left, highlighted file on the right. `files` maps kit-relative paths to their text. */
export function KitBrowser({ tree, files, initial }: { tree: TreeNode[]; files: Record<string, string>; initial: string }) {
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
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="glass max-h-[560px] overflow-auto rounded-[18px] p-2" role="navigation" aria-label="Code kit folders">
        <Tree nodes={tree} open={open} toggle={toggle} selected={selected} select={(p) => { setSelected(p); setCopied(false); }} />
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

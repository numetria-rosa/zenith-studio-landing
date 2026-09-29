type Node = { type: string; meta?: string | null; data?: { hProperties?: Record<string, unknown> }; children?: Node[] };

/** Keeps a fenced block's info string (```python filename="a.py") on the rendered <code> as data-meta. */
export function remarkCodeMeta() {
  const visit = (node: Node) => {
    if (node.type === "code" && node.meta) node.data = { ...node.data, hProperties: { ...node.data?.hProperties, "data-meta": node.meta } };
    node.children?.forEach(visit);
  };
  return (tree: Node) => visit(tree);
}

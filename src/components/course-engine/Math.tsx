import katex from "katex";

/* Server-safe KaTeX rendering — katex.renderToString needs no DOM, so these
   work fine as plain (non-"use client") components inside MDXRemote's
   server-rendered output. katex.min.css is imported once in the learn
   layout. */

export function InlineMath({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: false });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function BlockMath({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: true });
  return (
    <div
      className="my-3 overflow-x-auto py-1"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

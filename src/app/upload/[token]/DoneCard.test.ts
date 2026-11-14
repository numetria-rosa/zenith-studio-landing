import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DoneCard } from "./DoneCard";
import type { Doc } from "./model";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));
vi.mock("./actions", () => ({ confirmUploadAction: async () => ({ ok: true }), notApplicableAction: async () => ({ ok: true }) }));

const doc = (accepted: boolean): Doc => ({ id: "a", num: "01", title: "W-2", hint: null, skip: false, reason: null, slots: [{ id: "a", fileName: "w2.pdf", accepted, rejectReason: null }] });
const render = (d: Doc) => renderToStaticMarkup(createElement(DoneCard, { token: "t", clientId: "c", docs: [d], span: true }));

describe("finished documents on the upload page", () => {
  it("offers Replace on a sent file, as the page promises", () => {
    const html = render(doc(false));
    expect(html).toContain("w2.pdf");
    expect(html).toContain("Replace");
  });
  it("takes Replace away once the accountant has accepted the file", () => {
    const html = render(doc(true));
    expect(html).toContain("Accepted");
    expect(html).not.toContain("Replace");
  });
});

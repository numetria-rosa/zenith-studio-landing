import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { UiLangProvider } from "./i18n";
import { LanguageSelect } from "./LanguageSelect";
import { SidebarNav } from "@/app/(dashboard)/whatsapp-umrah/[agencyId]/SidebarNav";

vi.mock("next/navigation", () => ({ usePathname: () => "/whatsapp-umrah/a1", useRouter: () => ({ refresh: () => {} }) }));
vi.mock("@/lib/whatsapp-umrah/ui-lang-action", () => ({ setUiLangAction: async () => {} }));

const render = (lang: "en" | "fr", node: ReactNode) => renderToStaticMarkup(createElement(UiLangProvider, { lang }, node));
const nav = () => createElement(SidebarNav, { base: "/whatsapp-umrah/a1", waiting: 2 });

describe("dashboard language", () => {
  it("shows the sidebar in French, and in English by default", () => {
    const fr = render("fr", nav());
    for (const word of ["Boîte de réception", "Prospects", "Statistiques", "Réglages", "Base de connaissances"]) expect(fr).toContain(word);
    expect(fr).not.toContain("Knowledge base");
    const en = render("en", nav());
    expect(en).toContain("Knowledge base");
    expect(en).not.toContain("Réglages");
  });
  it("offers the language dropdown with English and Français, set to the current language", () => {
    const html = render("fr", createElement(LanguageSelect));
    expect(html).toContain("Langue");
    expect(html).toContain('<option value="en">English</option>');
    expect(html).toContain('<option value="fr" selected="">Français</option>');
  });
});

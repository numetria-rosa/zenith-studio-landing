import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
const { landingDestination, serviceFromAgency, serviceFromProject } = await import("./services");

const at = new Date("2026-10-22T10:00:00Z");

describe("owned service cards", () => {
  it("a catalogue service opens its client console, named after the service and the business", () => {
    const s = serviceFromProject({ id: "p1", title: "Smith & Co Accountants", sourceServiceId: "accounting-document-chaser", stage: "LIVE", createdAt: at });
    expect(s).toMatchObject({ title: "AI Document Chaser", subtitle: "Smith & Co Accountants", href: "/services/dashboard/p1", status: { label: "Live" } });
  });
  it("a custom proposal project has no console, so it points to the proposals page", () => {
    expect(serviceFromProject({ id: "p2", title: "Custom build", sourceServiceId: null, stage: "BUILDING", createdAt: at })).toMatchObject({ title: "Custom build", href: "/lab/dashboard", status: { label: "Setting up" } });
  });
  it("a cancelled service stays listed as cancelled", () => {
    expect(serviceFromProject({ id: "p3", title: "AI Inbox Manager", sourceServiceId: "ai-inbox-manager", stage: "CANCELLED", createdAt: at }).status).toEqual({ label: "Cancelled", tone: "ended" });
  });
  it("a WhatsApp agency opens the WhatsApp dashboard", () => {
    expect(serviceFromAgency({ id: "a1", name: "Zenith Demo Travel", status: "ONBOARDING", createdAt: at })).toMatchObject({ title: "WhatsApp AI Agent", subtitle: "Zenith Demo Travel", href: "/whatsapp-umrah/a1", status: { label: "Setting up" } });
  });
});

describe("landingDestination", () => {
  const one = [{ href: "/whatsapp-umrah/a1" }];
  const two = [{ href: "/whatsapp-umrah/a1" }, { href: "/services/dashboard/p1" }];
  it("one service and no courses opens that service directly", () => expect(landingDestination({ services: one, courseCount: 0 })).toBe("/whatsapp-umrah/a1"));
  it("several services open the services home", () => expect(landingDestination({ services: two, courseCount: 0 })).toBe("/my-services"));
  it("a client who also studies lands on the services home", () => expect(landingDestination({ services: one, courseCount: 2 })).toBe("/my-services"));
  it("a student with no services lands in the student space", () => expect(landingDestination({ services: [], courseCount: 1 })).toBe("/account"));
  it("someone with nothing yet lands in the student space empty state", () => expect(landingDestination({ services: [], courseCount: 0 })).toBe("/account"));
});

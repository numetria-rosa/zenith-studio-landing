import { describe, expect, it } from "vitest";
import { analyzeAccountantSite, extractEmails, followUpLinks } from "./accountant-site-check";

const page = (html: string, url = "https://www.smithtax.co.uk/") => [{ url, html }];

describe("analyzeAccountantSite", () => {
  it("scores a firm that asks clients to email documents and has no portal as a good fit", () => {
    const r = analyzeAccountantSite(
      page(`<h2>Self assessment</h2><p>Please email us your documents: P60, bank interest.</p><a href="mailto:info@smithtax.co.uk">Email</a><footer>Smith Tax Ltd, company number 01234567</footer>`),
      { country: "UK", businessName: "Smith Tax Ltd" },
    );
    expect(r.emails).toEqual(["info@smithtax.co.uk"]);
    expect(r.portalVendor).toBeNull();
    expect(r.docChecklist && r.personalTax && r.corporateUk).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(90);
  });

  it("marks a firm already on a portal vendor down", () => {
    const r = analyzeAccountantSite(page(`<a href="https://smith.taxdome.com/login">Client login</a> info@smithtax.co.uk Smith Tax Ltd`), { country: "UK", businessName: "Smith Tax Ltd" });
    expect(r.portalVendor).toBe("TaxDome");
    expect(r.score).toBeLessThan(30);
  });

  it("rules out UK sole traders and anyone with no public email", () => {
    expect(analyzeAccountantSite(page(`hello@janebooks.co.uk self assessment`), { country: "UK", businessName: "Jane Books" }).score).toBe(0);
    expect(analyzeAccountantSite(page(`Self assessment. Smith Tax Ltd`), { country: "UK", businessName: "Smith Tax Ltd" }).score).toBe(0);
  });

  it("does not need a company signal in the US, and spots a solo practitioner by name", () => {
    const r = analyzeAccountantSite(page(`<h3>Individual tax returns</h3> jane@janedoecpa.com`, "https://janedoecpa.com"), { country: "US", businessName: "Jane Doe, CPA" });
    expect(r.solo).toBe(true);
    expect(r.score).toBeGreaterThan(50);
  });
});

describe("cleanup filters", () => {
  const uk = (html: string, businessName = "Smith Tax Ltd", url = "https://www.smithtax.co.uk/") => analyzeAccountantSite(page(html, url), { country: "UK", businessName });

  it("only counts personal tax when the firm has a page or heading for it", () => {
    expect(uk(`We work with sole traders and landlords. info@smithtax.co.uk`).personalTax).toBe(false);
    expect(uk(`<a href="/services/self-assessment">Tax</a> info@smithtax.co.uk`).personalTax).toBe(true);
  });

  it("drops large networks, multi-office firms and businesses that aren't accounting practices", () => {
    expect(uk(`info@hwca.com`, "Haines Watts", "https://www.hwca.com/").score).toBe(0);
    expect(uk(`We have 14 offices across the UK. info@smithtax.co.uk`).largeFirm).toBe(true);
    expect(uk(`info@evolvewealth.co.uk`, "evolve wealth Ltd", "https://evolvewealth.co.uk/").notAccounting).toBe(true);
    expect(uk(`info@smithtax.co.uk`, "Smith Payroll & Tax Ltd").notAccounting).toBe(false);
  });

  it("finds the owner's first name", () => {
    expect(uk(`Meet the team. Sarah Jones FCCA, Director. info@smithtax.co.uk`).contactFirstName).toBe("Sarah");
    expect(uk(`Founder: David Brown. info@smithtax.co.uk`).contactFirstName).toBe("David");
    expect(uk(`Contact our team today. info@smithtax.co.uk`).contactFirstName).toBeNull();
    expect(uk(`Trusted Accounting Partner for small business. Founder Owned Firm Director. info@smithtax.co.uk`).contactFirstName).toBeNull();
    expect(uk(`Questions? Email Shanna Johnson any time. shanna@smithtax.co.uk`).contactFirstName).toBe("Shanna");
    expect(uk(`Numerawise Solutions, Founder. numerawise@numerawise.co.uk`, "Numerawise Solutions Ltd", "https://numerawise.co.uk/").contactFirstName).toBeNull();
  });

  it("flags an email on another business's domain, but not the same name on another TLD", () => {
    expect(uk(`taxdepartment@whitefieldtax.com Smith Tax Ltd`, "Whitefield Tax Ltd", "https://www.whitefieldtax.co.uk/").reasons).not.toContain("email is on a different domain from the website");
    expect(uk(`info@knightslowe.co.uk`, "David Robertson & Co Ltd", "http://www.davidroberton.co.uk/").reasons).toContain("email is on a different domain from the website");
  });
});

describe("extractEmails", () => {
  it("drops scrambled addresses with a made-up TLD", () => {
    expect(extractEmails(`vasb@psnctebhc.pbz info@cfapgroup.com`, "www.cfapgroup.com")).toEqual(["info@cfapgroup.com"]);
  });

  it("decodes [at] obfuscation, drops junk, and puts same-domain addresses first", () => {
    expect(extractEmails(`office@gmail.com info [at] smithtax [dot] co.uk logo@2x.png user@example.com`, "www.smithtax.co.uk")).toEqual(["info@smithtax.co.uk", "office@gmail.com"]);
  });
});

describe("followUpLinks", () => {
  it("keeps same-site contact and checklist pages only", () => {
    const html = `<a href="/contact-us">c</a><a href="https://smithtax.co.uk/tax-return-checklist">t</a><a href="https://facebook.com/contact">f</a><a href="/blog/post">b</a>`;
    expect(followUpLinks(html, "https://www.smithtax.co.uk/")).toEqual(["https://www.smithtax.co.uk/contact-us", "https://smithtax.co.uk/tax-return-checklist"]);
  });
});

import type { ProspectResearch, RecommendedOffer } from "@/lib/outreach";

export type SeedProspect = {
  businessName: string;
  website: string | null;
  city: string;
  country: string;
  niche: string;
  area: string;
  email: string | null;
  phone: string | null;
  contactName?: string | null;
  prospectScore: number;
  tier: "HOT" | "GOOD" | "BACKUP";
  recommendedServiceId: string;
  recommendedOffer: RecommendedOffer;
  personalizationSignal: string;
  opportunity: string;
  buyingSignal: string;
  research: ProspectResearch;
};

const NA = null;
const LEAD = "ai-lead-capture";
const RECEP = "ai-receptionist";
const INBOX = "ai-inbox-manager";

function dental(
  partial: Omit<SeedProspect, "city" | "country" | "niche" | "research"> & { signals: string[] }
): SeedProspect {
  const { signals, ...rest } = partial;
  return {
    ...rest,
    city: "Dallas",
    country: "USA",
    niche: "Dental clinics",
    research: {
      verified: {
        name: rest.businessName,
        city: "Dallas",
        country: "USA",
        niche: "Dental clinics",
        area: rest.area,
        website: rest.website ?? undefined,
        phone: rest.phone ?? undefined,
        email: rest.email ?? undefined,
        observedSignals: signals,
      },
      inferences: [rest.opportunity],
    },
  };
}

/** Dallas dental research from the 2026-08-29 prospecting pass. Only rows
    with a public email are eligible to email; the rest exist so the CRM
    can show why they were skipped. */
export const DALLAS_DENTAL_PROSPECTS: SeedProspect[] = [
  dental({
    businessName: "Contemporary Dentistry Dallas",
    website: "https://cddallas.com/",
    area: "Northwest Hwy / 75220",
    email: "info@cddallas.com",
    phone: "(214) 366-4646",
    prospectScore: 91,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "online booking and same-day emergency visits",
    buyingSignal: "online booking",
    opportunity: "Potential follow-up opportunity because the site advertises online booking and same-day emergency care.",
    signals: ["online booking", "same-day emergency visits", "cosmetic and implant services"],
  }),
  dental({
    businessName: "Dizon Dental Aesthetics",
    website: "https://www.dizondental.com/",
    area: "North Central / 75206",
    email: "info@dizondental.com",
    phone: "(214) 646-6202",
    prospectScore: 89,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a request-an-appointment page plus Invisalign, veneers, and implants",
    buyingSignal: "request an appointment",
    opportunity: "Potential lead-follow-up opportunity because visitors are asked to request appointments for high-value treatments.",
    signals: ["request an appointment", "Invisalign", "veneers", "implants"],
  }),
  dental({
    businessName: "Dallas Dental Arts",
    website: "https://www.dallasdentalspa.com/",
    area: "Downtown / 75201",
    email: "info@dallasdentalarts.com",
    phone: "(214) 999-0110",
    prospectScore: 88,
    tier: "HOT",
    recommendedServiceId: RECEP,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "a multi-specialty concierge practice (prosthodontics, endodontics, periodontics)",
    buyingSignal: "multi-specialty concierge listing",
    opportunity: "Potential receptionist opportunity because the public site presents three specialties and a concierge intake path that is not fully visible online.",
    signals: ["multi-specialty concierge practice", "prosthodontics", "endodontics", "periodontics"],
  }),
  dental({
    businessName: "Bleu Dentistry",
    website: "https://bleudentist.com/",
    area: "Oak Lawn / 75219",
    email: "info@bleudentist.com",
    phone: "(214) 699-4976",
    prospectScore: 86,
    tier: "HOT",
    recommendedServiceId: RECEP,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a Book Appointment call-to-action plus Invisalign, implants, and emergency visits",
    buyingSignal: "book appointment",
    opportunity: "Potential receptionist opportunity because the site is appointment-driven and advertises emergency visits.",
    signals: ["book appointment", "Invisalign", "implants", "emergency visits"],
  }),
  dental({
    businessName: "Preston Sherry Dental Associates",
    website: "https://prestonsherrydental.com/",
    area: "Park Cities / 75225",
    email: "info@prestonsherrydental.com",
    phone: "(214) 691-7371",
    prospectScore: 83,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a Request Appointment page plus emergency dentistry and Invisalign/implants",
    buyingSignal: "request appointment",
    opportunity: "Potential follow-up opportunity because new-patient and emergency requests are invited online.",
    signals: ["request appointment", "emergency dentistry", "Invisalign", "implants"],
  }),
  dental({
    businessName: "ARCHPOINT Implant Dentistry Dallas",
    website: "https://www.archpointid.com/office/dallas/",
    area: "Park Lane / 75231",
    email: "info@archpointid.com",
    phone: "(844) 281-6446",
    prospectScore: 83,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "a free consultation call-to-action on the Dallas implant-center page",
    buyingSignal: "schedule a free consultation",
    opportunity: "Potential lead-follow-up opportunity because the Dallas page invites free implant consultations across multiple DFW offices.",
    signals: ["schedule a free consultation", "dental implants", "Dallas office at Park Lane"],
  }),
  dental({
    businessName: "Ambriz Center for Reconstructive and Cosmetic Dentistry",
    website: "https://www.ambrizdallas.com/",
    area: "N Central / 75231",
    email: "smile@ambrizdallas.com",
    phone: "(214) 368-0514",
    prospectScore: 82,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a call-or-text line plus cosmetic, implant, and Invisalign services",
    buyingSignal: "call or text",
    opportunity: "Potential follow-up opportunity because cosmetic consults are invited by call or text.",
    signals: ["call or text", "cosmetic dentistry", "implant dentistry", "Invisalign"],
  }),
  dental({
    businessName: "Park Cities Family Dentistry",
    website: "https://www.cosmeticdentistindallas.com/",
    area: "Knox-Henderson / 75204",
    email: NA,
    phone: "(214) 528-3770",
    prospectScore: 86,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "complimentary consultations advertised for Highland Park / Uptown / Lakewood",
    buyingSignal: "complimentary consultation",
    opportunity: "Potential consult follow-up, but no public email was found so outreach is blocked.",
    signals: ["complimentary consultations"],
  }),
  dental({
    businessName: "Moseley Dental Group",
    website: "https://www.moseleydentalgroup.com/",
    area: "Preston Center + Hillcrest",
    email: NA,
    phone: NA,
    prospectScore: 85,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "two Dallas locations advertising Invisalign",
    buyingSignal: "two locations",
    opportunity: "Multi-location enquiry routing, but no public email was found.",
    signals: ["two Dallas locations", "Invisalign"],
  }),
  dental({
    businessName: "Katy Trail Dental",
    website: "https://www.katytrail.dental/",
    area: "Knox / 75205",
    email: NA,
    phone: "(214) 380-9071",
    prospectScore: 84,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "an Invisalign consultation call-to-action",
    buyingSignal: "Invisalign consultation",
    opportunity: "Aligner consult follow-up; no public email found.",
    signals: ["Invisalign consultation"],
  }),
  dental({
    businessName: "Arts Family Dentistry",
    website: "https://www.artsfamilydentistry.com/",
    area: "Kessler / Oak Cliff / 75208",
    email: NA,
    phone: "(214) 203-1145",
    prospectScore: 84,
    tier: "HOT",
    recommendedServiceId: RECEP,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "Saturday hours plus implants and Invisalign",
    buyingSignal: "Saturday hours",
    opportunity: "Appointment-driven neighborhood practice; no public email found.",
    signals: ["Saturday hours", "implants", "Invisalign"],
  }),
  dental({
    businessName: "Turtle Creek Dental Associates",
    website: "https://www.turtlecreekdental.com/",
    area: "Uptown / 75219",
    email: NA,
    phone: "(214) 953-0906",
    prospectScore: 82,
    tier: "HOT",
    recommendedServiceId: INBOX,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a four-doctor Uptown practice with a prominent phone number",
    buyingSignal: "prominent phone number",
    opportunity: "Multi-doctor admin load is an inference; no public email found.",
    signals: ["four doctors", "prominent phone number"],
  }),
  dental({
    businessName: "East Quarter Dental",
    website: "https://www.eastquarterdental.com/",
    area: "Downtown / 75201",
    email: NA,
    phone: "(469) 943-1400",
    prospectScore: 81,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "Schedule plus Request a Callback for downtown Invisalign patients",
    buyingSignal: "request a callback",
    opportunity: "Callback requests can go stale; no public email found.",
    signals: ["request a callback", "Invisalign"],
  }),
  dental({
    businessName: "Dallas Designer Smiles",
    website: "https://www.dallasdesignersmiles.com/",
    area: "Park Cities / 75225",
    email: NA,
    phone: NA,
    prospectScore: 80,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a new-patient appointment request form",
    buyingSignal: "new-patient request form",
    opportunity: "Structured lead capture; no public email found.",
    signals: ["new-patient appointment request form"],
  }),
  dental({
    businessName: "Inwood Village Dental",
    website: "https://inwoodvillagedental.com/",
    area: "Lovers Lane / 75209",
    email: NA,
    phone: "(214) 252-2777",
    prospectScore: 80,
    tier: "HOT",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a free Invisalign consultation offer",
    buyingSignal: "free Invisalign consultation",
    opportunity: "High-intent consult leads; no public email found.",
    signals: ["free Invisalign consultation"],
  }),
  dental({
    businessName: "Trinity Dental Loft",
    website: "https://trinitydentalloft.com/",
    area: "Trinity Groves / 75208",
    email: NA,
    phone: "(214) 415-2125",
    prospectScore: 78,
    tier: "GOOD",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "Book Now plus emergency and cosmetic dentistry",
    buyingSignal: "book now",
    opportunity: "Boutique West Dallas booking path; no public email found.",
    signals: ["book now", "emergency dentistry", "cosmetic dentistry"],
  }),
  dental({
    businessName: "Lakewood Dental Studio",
    website: "https://www.lakewooddentalstudio.com/",
    area: "Gaston / 75214",
    email: NA,
    phone: "(214) 446-5084",
    prospectScore: 76,
    tier: "GOOD",
    recommendedServiceId: LEAD,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a Book An Appointment call-to-action",
    buyingSignal: "book an appointment",
    opportunity: "Public booking CTA; contact-page placeholder emails were ignored.",
    signals: ["book an appointment"],
  }),
  dental({
    businessName: "Dallas Dental Group",
    website: "https://www.dallasdental.com/",
    area: "Prestonwood / 75248",
    email: NA,
    phone: "(972) 644-1998",
    prospectScore: 74,
    tier: "GOOD",
    recommendedServiceId: INBOX,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "Book Online on dallasdental.com",
    buyingSignal: "book online",
    opportunity: "Family practice with online scheduling; no public email found.",
    signals: ["book online"],
  }),
];

const LAW = "law-firms";

function personalInjury(
  partial: Omit<SeedProspect, "country" | "niche" | "research"> & { city: string; signals: string[] }
): SeedProspect {
  const { signals, ...rest } = partial;
  return {
    ...rest,
    country: "USA",
    niche: "Personal injury law",
    research: {
      verified: {
        name: rest.businessName,
        city: rest.city,
        country: "USA",
        niche: "Personal injury law",
        area: rest.area,
        website: rest.website ?? undefined,
        phone: rest.phone ?? undefined,
        email: rest.email ?? undefined,
        contactName: rest.contactName ?? undefined,
        observedSignals: signals,
      },
      inferences: [rest.opportunity],
    },
  };
}

/** Columbus/Cincinnati OH personal injury firm research from the 2026-09-11
    prospecting pass (see meta-ai-advance-summary.md action item 7). Every
    row below was individually checked, not templated: real site visited,
    screened out for a visible chat/live-chat widget (two strong candidates,
    Young Reverman & Bolotin and Rittgers Rittgers & Nakajima, were found
    and DROPPED for exactly this reason), attorney headcount read off the
    firm's own team page where published.

    Email follow-up pass, 2026-09-11 (two rounds): the Ohio Supreme Court's
    attorney registry search (supremecourt.ohio.gov) was unreachable from
    this environment both times, so instead every firm's own site was
    checked directly for a real `mailto:` link or plain-text address -
    first the homepage/privacy-policy/firm-overview pages, then a second,
    deeper pass specifically on each named attorney's own bio page.
    Deliberately did NOT use third-party lead-scraping tools (RocketReach,
    ZoomInfo, LeadIQ) that surfaced in search results along the way, since
    those guess emails from patterns rather than confirm a real published
    one, and an unconfirmed guess would undermine the same public-email bar
    this file already holds every other row to.

    Found 3 of 7, all confirmed by an actual `mailto:` link or plain text on
    the firm's or attorney's own domain: Erney Law
    (leadcounsel@ohioinjurylaw.com, their privacy policy page - a firm
    inbox, no personal address found on Robert Erney's own bio page),
    Gervelis Law Firm (msg@gervelislaw.com, his own initials, a mailto: link
    directly on Mark Gervelis's own bio page - personally his), and Oliver
    Law Office (joliver@oliverattorneys.com, a mailto: link directly on Jami
    Oliver's own bio page - personally hers, upgraded from the firm's
    general info@ address the first pass had found).

    Third pass, 2026-09-12: widened the search to professional/peer-award
    directories the attorney's own bio doesn't control but that carry a
    real mailto: link for them specifically (National Association of
    Distinguished Counsel member pages worked twice here), not just the
    firm's own site. Found Soroka & Associates (roger@sorokalegal.com, on
    his own distinguishedcounsel.org member page - nothing on
    sorokalegal.com itself). Also surfaced a real correction while
    checking Freking Myers & Reul: Randolph Freking, the firm's namesake
    and the only name this file had for that row, retired at the end of
    2020 - emailing him would reach the wrong person even if an address
    existed. No email found for Freking Myers & Reul under any current
    partner either (checked Kelly Mulloy Myers's bio PDF and the firm
    overview page).

    The remaining 3 (O'Connor Acciani & Levy, The Moore Law Firm, Freking
    Myers & Reul) stay genuinely contact-form-only after three separate
    passes: firm homepage, privacy-policy page, named attorney's own bio
    page, a linked PDF bio, and now peer/professional directories
    (National Trial Lawyers, Cornell LII, distinguishedcounsel.org) with no
    email found anywhere for any of them. Still RESEARCHED but
    outreach-blocked (`runHardFilters` requires `isPublicEmail`), the same
    honest state several Dallas dental rows above are already in.

    Expansion pass, 2026-09-12 (user asked to grow the combined OH+TX
    sendable list to 20 while holding the same target profile): 7 more
    Columbus/Cincinnati PI firms researched, 6 outreach-eligible (Brian G.
    Miller, The Donahey Law Firm, Malek & Malek, Mark L. Newman, Somos Law
    Firm, Crandall & Pera Law), 1 blocked (Larry H. Creach). See the
    per-row comments below for exactly where each email was found and
    whether it reaches the named attorney personally or a firm/staff
    inbox. This batch brings Ohio to 14 firms researched, 10
    outreach-eligible.

    Google Business Profile review counts (the 20-200 filter from the
    original blueprint) were NOT independently verified here, no Places API
    access in this pass, don't treat prospectScore below as including that
    signal. */
export const OHIO_PI_PROSPECTS: SeedProspect[] = [
  personalInjury({
    businessName: "Soroka & Associates, LLC",
    website: "https://www.sorokalegal.com/",
    city: "Columbus",
    area: "Central Ohio",
    email: "roger@sorokalegal.com", // his own mailto: link on his National Association of Distinguished Counsel member page, 2026-09-12 - Roger Soroka personally; nothing found on his own firm site directly
    phone: "(614) 918-4078",
    contactName: "Roger R. Soroka",
    prospectScore: 88,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "a 5-attorney trial team that takes catastrophic-injury and trucking cases to jury rather than settling fast",
    buyingSignal: "5-attorney boutique, no visible chat widget",
    opportunity: "A firm this size fields every call itself; a missed call after hours is a real cost with no admin layer to catch it.",
    signals: ["5 named attorneys", "handles complex trucking/catastrophic injury litigation", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Erney Law (Robert D. Erney & Associates)",
    website: "https://ohioinjurylaw.com/",
    city: "Columbus",
    area: "Downtown / 43203",
    email: "leadcounsel@ohioinjurylaw.com", // published in plain text on the firm's own privacy policy page, 2026-09-11 - a firm inbox, not Robert Erney personally
    phone: "(614) 258-6100",
    contactName: "Robert D. Erney",
    prospectScore: 84,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a father-daughter practice (Robert and Mary Erney) that personally handles every client relationship",
    buyingSignal: "small family practice, no visible chat widget",
    opportunity: "Two-attorney practice with no admin layer; the managing partner is reachable directly, and a missed call has nowhere else to land.",
    signals: ["father-daughter two-attorney practice", "reviews consistently name the attorneys personally", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Gervelis Law Firm",
    website: "https://gervelislaw.com/",
    city: "Columbus",
    area: "Dublin Rd / 43215",
    email: "msg@gervelislaw.com", // his own initials, a mailto: link on his own attorney bio page (gervelislaw.com/our-attorneys/mark-s-gervelis-esq/), 2026-09-11 - Mark Gervelis personally
    phone: "866-965-8721",
    contactName: "Mark S. Gervelis",
    prospectScore: 80,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a board-certified trial lawyer's firm built on being personally reachable to clients",
    buyingSignal: "small boutique, no visible chat widget",
    opportunity: "Community-reputation-driven boutique; after-hours intake gaps cost referral trust, not just one lead.",
    signals: ["board-certified civil trial lawyer", "small named team", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Oliver Law Office",
    website: "https://jamioliver.com/",
    city: "Columbus",
    area: "Central Ohio",
    email: "joliver@oliverattorneys.com", // her own mailto: link on her own attorney bio page (jamioliver.com/jami-s-oliver/), 2026-09-11 - Jami Oliver personally, upgraded from the firm's general info@ inbox
    phone: "614.220.9100",
    contactName: "Jami S. Oliver",
    prospectScore: 76,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a woman-led boutique firm, 2024 \"Lawyer of the Year\" (Best Lawyers, Columbus)",
    buyingSignal: "award-recognized boutique, no visible chat widget",
    opportunity: "High-profile solo/boutique practice; intake volume from the recognition likely outpaces a small team's after-hours capacity.",
    signals: ["2024 Best Lawyers \"Lawyer of the Year\"", "woman-led boutique", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "O'Connor, Acciani & Levy",
    website: "https://www.oal-law.com/",
    city: "Cincinnati",
    area: "Also serves Columbus and Northern Kentucky",
    email: NA,
    phone: "(513) 548-3729",
    contactName: "Henry D. Acciani",
    prospectScore: 83,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "13 attorneys across three offices (Cincinnati, Columbus, Northern Kentucky), free-unless-we-win intake",
    buyingSignal: "multi-office boutique at the top of the target size range, no visible chat widget",
    opportunity: "Three-office intake coordination is exactly the kind of thing a missed call slips through; largest firm in this batch, still under the 15-attorney ceiling.",
    signals: ["13 attorneys", "three-office footprint (OH + KY)", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "The Moore Law Firm",
    website: "https://www.moorelaw.com/",
    city: "Cincinnati",
    area: "1060 Nimitzview Dr, Cincinnati",
    email: NA,
    phone: "513-232-2000",
    contactName: "Daniel N. Moore",
    prospectScore: 87,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "a 4-attorney firm built around \"a legacy of pursuing justice\"",
    buyingSignal: "4-attorney boutique, no visible chat widget",
    opportunity: "Tight, name-brand boutique; a missed after-hours call is a lost case, not just a lost lead.",
    signals: ["4 named attorneys", "single-office boutique", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Freking Myers & Reul LLC",
    website: "https://www.fmr.law/",
    city: "Cincinnati",
    area: "Central Cincinnati",
    email: NA,
    phone: "(513) 866-8816",
    contactName: NA,
    prospectScore: 74,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "\"Advocates for working people\" since 1990, 12 attorneys spanning employment and personal injury law",
    buyingSignal: "12-attorney boutique, no visible chat widget",
    opportunity: "Mixed employment/PI practice at the top of the size range; worth confirming PI is still a primary focus before outreach.",
    signals: ["12 attorneys", "employment + personal injury practice since 1990", "no visible chat widget"],
  }),
  // Second Columbus/Cincinnati expansion pass, 2026-09-12 (user asked to grow the
  // combined OH+TX sendable list to 20 while holding the same target profile: PI-focused,
  // roughly 3-15 attorneys, no visible chat widget, decision-maker directly reachable).
  // Same research method throughout: real site visit, mailto: scan via script, chat-widget
  // screen, then a professional-directory check (americastop100attorneys.com,
  // distinguishedcounsel.org) when the firm's own site had nothing. Skipped several
  // otherwise-plausible candidates for failing the profile: Jeckering & Associates and the
  // Law Office of David A. Chicarelli (general practice, PI is one of several areas, not the
  // firm's focus), Schiff & Associates (self-described "large legal team," high-volume
  // marketing language, reads as an injury mill rather than a boutique), Moxie Law Group
  // (Podium chat widget).
  personalInjury({
    businessName: "Brian G. Miller Co., LLC",
    website: "https://www.bgmillerlaw.com/",
    city: "Columbus",
    area: "Worthington / Columbus",
    email: "slh@bgmillerlaw.com", // found on his own National Association of Distinguished Counsel member page, 2026-09-12 - initials suggest a staff/paralegal inbox, not Brian Miller personally
    phone: "614-221-4035",
    contactName: "Brian G. Miller",
    prospectScore: 82,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "founder recognized in Best Lawyers in America every year since 2013, 2019 \"Lawyer of the Year\" in Columbus for personal injury litigation",
    buyingSignal: "award-recognized boutique with a real trial record, no visible chat widget",
    opportunity: "High-profile solo/small practice; recognition-driven intake volume likely outpaces after-hours capacity.",
    signals: ["Best Lawyers in America every year since 2013", "2019 \"Lawyer of the Year,\" Columbus personal injury", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "The Donahey Law Firm, LLC",
    website: "https://www.donaheylaw.com/",
    city: "Columbus",
    area: "Downtown Columbus",
    email: "help@donaheylaw.com", // mailto: link on their own homepage, 2026-09-12 - a firm inbox, not the named attorney personally
    phone: "614-224-8166",
    contactName: "Richard S. Donahey",
    prospectScore: 79,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "founded 1968, 4 attorneys with 140+ years combined trial and settlement experience, three former defense attorneys on staff",
    buyingSignal: "long-tenured boutique built on insider defense-side knowledge, no visible chat widget",
    opportunity: "Referral-driven boutique that takes the toughest catastrophic cases from other Ohio attorneys; a missed after-hours call costs referral trust as much as the case.",
    signals: ["founded 1968", "4 attorneys, 140+ years combined experience", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Malek & Malek Law Firm",
    website: "https://www.maleklawfirm.com/",
    city: "Columbus",
    area: "South Columbus",
    email: "jim@maleklawfirm.com", // his own mailto: link on his own attorney bio page (maleklawfirm.com/attorneys/james-malek/), 2026-09-12 - James Malek personally; nothing on the homepage itself
    phone: "(614) 444-7440",
    contactName: "James Malek",
    prospectScore: 80,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a father-and-three-sons practice since 1972, five attorneys with 60+ years of combined experience",
    buyingSignal: "multi-generation family boutique, no visible chat widget",
    opportunity: "Family-run practice built on personal relationships; an after-hours miss breaks exactly the kind of personal continuity the firm sells itself on.",
    signals: ["five attorneys, family-run since 1972", "60+ years combined experience", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Mark L. Newman, Attorney at Law",
    website: "https://marklnewman.com/",
    city: "Cincinnati",
    area: "Cincinnati",
    email: "mln@bpbslaw.com", // his own initials, a mailto: link directly on his own about page, 2026-09-12 - Mark Newman personally
    phone: "513-533-2009",
    contactName: "Mark L. Newman",
    prospectScore: 74,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a solo Cincinnati practice handling serious accident cases",
    buyingSignal: "solo practitioner, no visible chat widget",
    opportunity: "Solo practice with no admin layer; the attorney is the intake line, and a missed call has nowhere else to land.",
    signals: ["solo practitioner", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Law Office of Larry H. Creach, Esq. LLC",
    website: "https://www.creachlaw.com/",
    city: "Cincinnati",
    area: "Cincinnati",
    email: NA,
    phone: "513-401-7932",
    contactName: "Larry H. Creach",
    prospectScore: 73,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "26 years in practice, a former insurance-company attorney now representing the injured",
    buyingSignal: "solo practitioner, insurance-side background, no visible chat widget",
    opportunity: "Solo practice with no admin layer; a missed call has nowhere else to land.",
    signals: ["26 years in practice", "former insurance company attorney", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Somos Law Firm",
    website: "https://lawyersprotectingyou.com/",
    city: "Columbus",
    area: "North Columbus",
    email: "info@lawyersprotectingyou.com", // mailto: link on their own homepage, 2026-09-12 - a firm inbox, not Tom Somos personally. Site loads Microsoft Clarity analytics, confirmed NOT a chat widget (no visible chat UI, no "chat with us" text anywhere on the page)
    phone: "(614) 488-2770",
    contactName: "Tom Somos",
    prospectScore: 75,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a small, founder-led Columbus personal injury practice",
    buyingSignal: "small boutique, no visible chat widget",
    opportunity: "Small practice with no admin layer; a missed call has nowhere else to land.",
    signals: ["small founder-led practice", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Crandall & Pera Law, LLC",
    website: "https://www.injuryverdicts.com/",
    city: "Columbus",
    area: "Downtown Columbus, also Cleveland/Cincinnati/Kentucky offices",
    email: "steve@injuryverdicts.com", // found on his own America's Top 100 Attorneys listing page, 2026-09-12 - Steve Crandall personally; nothing on their own site
    phone: "(614) 702-2623",
    contactName: "Steve Crandall",
    prospectScore: 81,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "a multi-office medical malpractice/personal injury firm staffed partly by registered nurses, named to Best Lawyers in America for 2027",
    buyingSignal: "multi-office boutique with clinical staff on the team, no visible chat widget",
    opportunity: "Multi-office coordination for complex malpractice cases is exactly where a missed after-hours call slips through.",
    signals: ["staffed partly by registered nurses", "named to Best Lawyers in America, 2027", "no visible chat widget"],
  }),
];

/** Fort Worth, TX personal injury firm research from the 2026-09-12
    prospecting pass (see meta-ai-advance-summary.md action item 7,
    "next city" follow-up). City chosen over the other original alternates
    (Jacksonville/Tampa FL) after real research, not a coin flip: Florida's
    2023 tort reform (HB 837) cut the PI statute of limitations from 4
    years to 2 and tightened the comparative-negligence bar, a real,
    documented shrink to that state's case pipeline that Texas has not had
    (a 2025 push for further restrictions, SB 30/HB 4806, did not pass).
    Also checked for the same city-level agency saturation signal that
    ruled out LA/NYC/Miami originally: a competitor ("Ansa") runs templated
    AI-receptionist landing pages for San Antonio, Jacksonville, AND Tampa
    specifically, found via search - Fort Worth has no equivalent page
    found, so it's the one candidate that still fits "no major agency
    saturation."

    Every row below was individually checked the same way as the Ohio
    batch: real site visited via browser, screened for a live chat widget
    (Stephens Law Firm was found and DROPPED here for exactly that reason,
    an "Intaker" chat script loaded on their site - same rule that caught
    Young Reverman & Bolotin and Rittgers Rittgers & Nakajima in Ohio),
    attorney headcount sourced from the firm's own site or a real search
    result citing it. Email search used the same method that worked for
    Ohio (mailto: links on the firm's own homepage/contact/privacy/attorney
    bio pages, verified live via a script, never a third-party
    lead-scraping guess) and found 4 of 7 right away, a better hit rate
    than Ohio's initial pass.

    Follow-up pass, 2026-09-12: widened the search to peer/professional
    directories carrying a real mailto: link for the attorney specifically
    (National Association of Distinguished Counsel worked here too),
    found Parker Law Firm (brad@parkerlawfirm.com, on his own
    distinguishedcounsel.org member page - nothing on parkerlawfirm.com
    itself, checked twice including the privacy policy page). Also checked
    Wade Barrow and Brett Cain against Texas Bar's directory, Super
    Lawyers, LawLink, about.me, and Keenan Trial Institute's faculty page -
    genuinely no email found for either after that additional pass. Texas
    Bar's own "Find a Lawyer" tool doesn't publish a real address either,
    only an internal "Email Now" contact-relay link, so it doesn't count
    against the isPublicEmail bar. Barrow Law and The Cain Firm remain
    RESEARCHED but outreach-blocked.

    Expansion pass, 2026-09-12 (same "grow to 20 total, same profile"
    request as the Ohio expansion above): 7 more Fort Worth-area PI firms
    researched, 5 outreach-eligible (James M. Stanley, Eric Reyes, Robert
    C. Slim, Robert L. Ward, J. Alexander Law Firm), 2 blocked (Queenan
    Law, J. Kent McAfee). J. Alexander Law Firm's only confirmed address is
    a marketing inbox (marketing@jalexlawfirm.com), not a named attorney -
    address outreach to the firm generally, not a person, same as Freking
    Myers & Reul's contactName: NA pattern. This batch brings Fort Worth
    to 14 firms researched, 10 outreach-eligible - combined with Ohio's 10,
    that's exactly the 20 sendable leads requested, all still fitting the
    original profile (PI-focused, roughly 3-15 attorneys, no chat widget,
    decision-maker reachable). */
export const FORT_WORTH_PI_PROSPECTS: SeedProspect[] = [
  personalInjury({
    businessName: "Patterson Law Group",
    website: "https://pattersonpersonalinjury.com/",
    city: "Fort Worth",
    area: "Fort Worth, also Arlington and San Antonio offices",
    email: "info@pattersonpersonalinjury.com", // mailto: link on their own homepage, 2026-09-12
    phone: "(817) 904-8460",
    contactName: "W. Travis Patterson",
    prospectScore: 89,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "9 attorneys, $100M+ recovered, 496+ Google reviews, highest reported wrongful death settlement in Texas for 2024",
    buyingSignal: "9-attorney multi-office firm at real scale, no visible chat widget",
    opportunity: "High enough call volume that an intake gap is a real, recurring cost, not a one-off.",
    signals: ["9 attorneys across 3 offices", "496+ Google reviews", "highest reported wrongful death settlement in Texas, 2024", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Noteboom - The Law Firm",
    website: "https://noteboom.com/",
    city: "Fort Worth",
    area: "Hurst / Fort Worth metro",
    email: "lawyers@noteboom.com", // mailto: link on their own contact page, 2026-09-12
    phone: "(817) 282-9700",
    contactName: "Chuck Noteboom",
    prospectScore: 85,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "2 attorneys board-certified in personal injury law by the Texas Board of Legal Specialization, plus in-house investigators",
    buyingSignal: "board-certified boutique with its own investigator staff, no visible chat widget",
    opportunity: "A firm this specialized fields serious cases directly; a missed after-hours call is a lost case, not just a lost lead.",
    signals: ["2 board-certified PI attorneys", "in-house investigator + assistant investigator", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Law Offices of Barry Martines",
    website: "https://barrymartines.com/",
    city: "Fort Worth",
    area: "Fort Worth",
    email: "info@barrymartines.com", // mailto: link on their own homepage, 2026-09-12
    phone: "817-838-9900",
    contactName: "Barry Martines",
    prospectScore: 77,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "24+ years focused solely on bodily injury claims",
    buyingSignal: "solo practitioner, single-focus practice, no visible chat widget",
    opportunity: "Solo practice with no admin layer; the attorney is the intake line, and a missed call has nowhere else to land.",
    signals: ["24+ years, bodily injury claims only", "solo practitioner", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Walters Law Office, PLLC",
    website: "https://walterslawofficepllc.com/",
    city: "Fort Worth",
    area: "Fort Worth",
    email: "jack@walterslawofficepllc.com", // his own mailto: link on the firm's homepage, 2026-09-12 - Jonathan Walters personally
    phone: "682-747-6800",
    contactName: "Jack Walters", // greeting-safe form; his own site/bios use "Jonathan \"Jack\" Walters," fine in prose but not as a raw salutation name
    prospectScore: 75,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "founded 2021, a Top 40 Under 40 trial lawyer who personally guarantees a response to every consultation",
    buyingSignal: "young solo boutique built on personal responsiveness, no visible chat widget",
    opportunity: "The founder's own pitch is personally answering every inquiry; an after-hours miss directly contradicts that promise.",
    signals: ["founded 2021", "Top 40 Under 40 trial lawyer", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "The Cain Firm",
    website: "https://cainfirm.com/",
    city: "Fort Worth",
    area: "Fort Worth, also Granbury and Dallas-by-appointment offices",
    email: NA,
    phone: "(817) 918-8638",
    contactName: "Brett Cain",
    prospectScore: 76,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "founded by a former prosecutor, now handling injury cases across 3 small Texas offices",
    buyingSignal: "solo-founder boutique spread across multiple small offices, no visible chat widget",
    opportunity: "Coverage across three offices from one founder means an after-hours call has no consistent backstop.",
    signals: ["founded by a former prosecutor", "3-office footprint (Fort Worth, Granbury, Dallas by appointment)", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Parker Law Firm Injury Lawyers",
    website: "https://parkerlawfirm.com/",
    city: "Fort Worth",
    area: "Bedford / Fort Worth",
    email: "brad@parkerlawfirm.com", // his own mailto: link on his National Association of Distinguished Counsel member page, 2026-09-12 - Brad Parker personally; nothing found on his own firm site directly
    phone: "(817) 503-9200",
    contactName: "W. Bradley Parker",
    prospectScore: 78,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "board-certified in personal injury trial law with 37+ years of practice",
    buyingSignal: "board-certified boutique, no visible chat widget",
    opportunity: "Long-tenured boutique built on the lead attorney's own reputation; an after-hours miss costs referral trust as much as the case itself.",
    signals: ["board-certified in personal injury trial law", "37+ years practicing", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Barrow Law PLLC",
    website: "https://www.barrow-law.com/",
    city: "Fort Worth",
    area: "Fort Worth",
    email: NA,
    phone: "817-962-2535",
    contactName: "Wade Barrow",
    prospectScore: 72,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a solo practice built on personally getting to know each client before crafting a strategy",
    buyingSignal: "solo boutique, personal-attention pitch, no visible chat widget",
    opportunity: "The firm's own pitch is personal attention to every client; a missed call is the opposite of that promise.",
    signals: ["solo practitioner", "personal-attention client strategy pitch", "no visible chat widget"],
  }),
  // Second Fort Worth expansion pass, 2026-09-12, same reason and method as the Ohio
  // expansion above. Dropped several otherwise-plausible candidates for failing the profile:
  // Meza Law Firm, Brian Hargrove Law, and Mullen & Mullen all load a live chat widget
  // (Clarity Livechat / ApexChat); Fulgham Hampton loads the same "Intaker" widget that
  // dropped Stephens Law Firm; Anderson Injury Lawyers lists 16 attorneys, one over this
  // profile's ceiling; Dunham & Jones has 123 lawyers across 14 Texas cities and is
  // primarily criminal defense; Allen & Weaver and the Law Office of Sandra Sprott are
  // general/family-law practices where PI is one of several areas, not the focus; Moxie Law
  // Group loads a Podium chat widget.
  personalInjury({
    businessName: "Law Office of James M. Stanley",
    website: "https://www.law-jms.com/",
    city: "Fort Worth",
    area: "Fort Worth",
    email: "jstanley@law-jms.com", // his own address, found on his America's Top 100 Attorneys listing page, 2026-09-12; nothing on his own site
    phone: "(817) 591-4222",
    contactName: "James M. Stanley",
    prospectScore: 79,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "representing injured Texans since 1976",
    buyingSignal: "long-tenured boutique, no visible chat widget",
    opportunity: "Decades-old boutique built on reputation; an after-hours miss costs referral trust as much as the case.",
    signals: ["representing clients since 1976", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "The Eric Reyes Law Firm, P.C.",
    website: "https://www.ericreyeslaw.com/",
    city: "Fort Worth",
    area: "Fort Worth, also Arlington office",
    email: "reyes@ericreyeslaw.com", // his own mailto: link on his own attorney bio page, 2026-09-12 - Eric Reyes personally
    phone: "(817) 332-1522",
    contactName: "Eric Reyes",
    prospectScore: 80,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "double board certified in Personal Injury Trial Law and Civil Trial Law, a distinction held by about 3% of Texas lawyers, practicing 27 years",
    buyingSignal: "double board-certified boutique, no visible chat widget",
    opportunity: "Credentialed boutique that draws cases on reputation alone; a missed after-hours call has no admin layer to catch it.",
    signals: ["double board certified (Personal Injury + Civil Trial Law)", "27 years in practice", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Robert C. Slim Law Firm, PLLC",
    website: "https://www.rcslawfirm.com/",
    city: "Fort Worth",
    area: "Hurst-Euless-Bedford, also a Dallas office",
    email: "robertcslim@rcslawfirm.com", // his own mailto: link on the firm's Hurst-Euless-Bedford page, 2026-09-12 - Robert Slim personally
    phone: "(214) 321-8225",
    contactName: "Robert C. Slim",
    prospectScore: 76,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a practice built on speaking directly with the principal lawyer, not a paralegal or staff investigator",
    buyingSignal: "solo/small boutique, direct-access pitch, no visible chat widget",
    opportunity: "The firm's own pitch is direct access to the attorney; an after-hours miss is the opposite of that promise.",
    signals: ["direct-access-to-attorney pitch", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Law Office of Robert L. Ward",
    website: "https://www.robwardlaw.com/",
    city: "Fort Worth",
    area: "Cleburne",
    email: "rob@robwardlaw.com", // his own mailto: link on the firm's personal injury page, 2026-09-12 - Robert Ward personally
    phone: "(817) 558-8788",
    contactName: "Robert L. Ward",
    prospectScore: 77,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a former Johnson County prosecutor with 23+ years of trial experience who personally handles every case",
    buyingSignal: "solo practitioner, former prosecutor, no visible chat widget",
    opportunity: "The firm's own pitch is that the attorney handles every case directly, never handed to a paralegal; a missed call breaks that promise.",
    signals: ["former Johnson County prosecutor", "23+ years trial experience", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Queenan Law (Law Offices of Kevin Queenan)",
    website: "https://www.queenanlaw.com/",
    city: "Fort Worth",
    area: "Arlington, also Weatherford and other Texas offices",
    email: NA,
    phone: "(817) 476-1797",
    contactName: "M. Kevin Queenan",
    prospectScore: 73,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "a multi-city Texas personal injury practice built around one named founding attorney",
    buyingSignal: "founder-led multi-office boutique, no visible chat widget",
    opportunity: "Multi-office coordination under one founder is exactly where an after-hours call slips through.",
    signals: ["founder-led, multi-city Texas practice", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Law Offices of J. Kent McAfee, P.C.",
    website: "https://www.onelegalplace.com/",
    city: "Fort Worth",
    area: "Fort Worth",
    email: NA,
    phone: "817-332-7676",
    contactName: "J. Kent McAfee",
    prospectScore: 78,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "representing DFW accident victims since 1984, named a Top Attorney by Fort Worth Magazine for 17 consecutive years (2001-2017)",
    buyingSignal: "long-tenured boutique, no visible chat widget",
    opportunity: "Decades of peer recognition drives referral volume a small practice can't staff around the clock for.",
    signals: ["practicing since 1984", "Top Attorney, Fort Worth Magazine, 2001-2017", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "J. Alexander Law Firm, P.C.",
    website: "https://severeinjurylawyers.com/",
    city: "Fort Worth",
    area: "Fort Worth, headquartered in Dallas with several Texas offices",
    email: "marketing@jalexlawfirm.com", // found on his own America's Top 100 Bet-the-Company Litigators listing page, 2026-09-12 - a marketing inbox, not Josh Alexander or any attorney personally; address the firm generally, not him by name
    phone: "(214) 206-3264",
    contactName: NA,
    prospectScore: 74,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "founded by a Marine Corps veteran, about 6 attorneys with 75+ years combined personal injury litigation experience",
    buyingSignal: "veteran-founded boutique, no visible chat widget",
    opportunity: "Multi-office coordination for a founder-led boutique is exactly where an after-hours call slips through.",
    signals: ["founded by a Marine Corps veteran", "6 attorneys, 75+ years combined experience", "no visible chat widget"],
  }),
];

/** Tampa, FL personal injury firm research, 2026-09-12. Same method as Ohio
    and Fort Worth: real site visited, screened for a visible chat widget
    (dropped Mickey Keenan and Baggett Law's sister-market pattern - both ran
    Intaker; also dropped Vanguard, a Cloudflare bot-check page couldn't be
    verified, and Merricks Law Group, running an apigateway.co webchat
    widget). Gina Rosato Law was skipped for a bankruptcy/PI mixed practice,
    same reasoning as excluded firms in earlier batches. Tampa yielded 4
    outreach-eligible firms with a confirmed public email and no chat
    widget; 3 more (Armando Personal Injury Law, MattLaw, The Yerrid Law
    Firm) are real fits but contact-form-only with no email found on-site
    or via professional directories - logged as RESEARCHED but blocked,
    matching the Ohio/Fort Worth pattern for unreachable rows. */
export const TAMPA_PI_PROSPECTS: SeedProspect[] = [
  personalInjury({
    businessName: "Apex Law Firm",
    website: "https://apexfirm.com/",
    city: "Tampa",
    area: "Tampa",
    email: "info@ApexFirm.com", // mailto: link on their own about-us page, 2026-09-12
    phone: "(813) 444-5212",
    contactName: "Jeff Constantinos",
    prospectScore: 82,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "3-attorney boutique founded by two former Florida State Attorney's Office prosecutors",
    buyingSignal: "founder-led boutique, no visible chat widget",
    opportunity: "Two former prosecutors running their own boutique are the ones taking the call themselves; a missed after-hours call is a missed case, not a missed lead.",
    signals: ["3 attorneys", "founded by two former state prosecutors", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Massaro Law",
    website: "https://massarolaw.com/",
    city: "Tampa",
    area: "Tampa Bay area",
    email: "help@massarolaw.com", // mailto: link on their own homepage, 2026-09-12
    phone: "(727) 222-4357",
    contactName: "Vincent Massaro",
    prospectScore: 78,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "solo-founder trial lawyer, Florida Bar member since 2011, former public defender",
    buyingSignal: "solo practitioner, no visible chat widget",
    opportunity: "Solo practice with no admin layer; the attorney is the intake line, and a missed call has nowhere else to land.",
    signals: ["solo founder", "Florida Bar since 2011", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Law Office of Dan Zohar, P.A.",
    website: "https://dzfirm.com/",
    city: "Tampa",
    area: "Tampa, also Clearwater/St. Petersburg and Lakeland offices",
    email: "info@dzfirm.com", // mailto: link on their own homepage, 2026-09-12
    phone: "(800) 963-3311",
    contactName: "Dan Zohar",
    prospectScore: 80,
    tier: "HOT",
    recommendedServiceId: LAW,
    recommendedOffer: "PAID_AUDIT_CALL",
    personalizationSignal: "30+ years focused solely on personal injury, multi-office footprint across the Tampa Bay area",
    buyingSignal: "multi-office solo-founder practice, no visible chat widget",
    opportunity: "Multi-office coordination for a small founder-led firm is exactly where an after-hours call slips through.",
    signals: ["30+ years, personal injury only", "3-office footprint", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Alley, Clark & Greiwe",
    website: "https://www.tampatriallawyers.com/",
    city: "Tampa",
    area: "Tampa",
    email: "contact@tampatriallawyers.com", // "General Email Inquiries" on their own contact page, 2026-09-12
    phone: "(813) 222-0977",
    contactName: NA, // firm inbox, address the firm generally
    prospectScore: 76,
    tier: "GOOD",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "4-attorney downtown Tampa boutique, average 35+ years experience per partner, focused on complex injury/mass torts/med-mal",
    buyingSignal: "small trial boutique with decades of experience per partner, no visible chat widget",
    opportunity: "Complex, high-value cases at a small firm mean a missed call is a missed six-figure case, not a routine lead.",
    signals: ["4 attorneys, 35+ years average experience", "complex injury/mass torts/med-mal focus", "no visible chat widget"],
  }),
  personalInjury({
    businessName: "Armando Personal Injury Law",
    website: "https://www.armandoinjurylaw.com/",
    city: "Tampa",
    area: "Tampa / Hillsborough County",
    email: NA,
    phone: NA,
    contactName: "Armando Edmiston",
    prospectScore: 68,
    tier: "BACKUP",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "solo founder, Marine Corps veteran, lifelong Hillsborough County resident",
    buyingSignal: "solo veteran-founded practice, no visible chat widget, but no email found anywhere",
    opportunity: "Solo practice with no admin layer; a missed call has nowhere else to land - but outreach needs a phone or contact-form follow-up, not email.",
    signals: ["solo founder", "Marine Corps veteran", "no visible chat widget", "contact-form only, no email found"],
  }),
  personalInjury({
    businessName: "MattLaw",
    website: "https://mattlaw.com/",
    city: "Tampa",
    area: "Tampa",
    email: NA,
    phone: NA,
    contactName: "Matt Powell",
    prospectScore: 66,
    tier: "BACKUP",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "Board Certified in Civil Trial Law, 35+ years representing injury victims",
    buyingSignal: "long-tenured board-certified solo/small practice, no visible chat widget, but no email found anywhere",
    opportunity: "Decades of peer recognition drives referral volume a small practice can't staff around the clock for - but outreach needs a phone or contact-form follow-up, not email.",
    signals: ["Board Certified Civil Trial Law", "35+ years experience", "no visible chat widget", "contact-form only, no email found"],
  }),
  personalInjury({
    businessName: "The Yerrid Law Firm, P.A.",
    website: "https://www.yerridlaw.com/",
    city: "Tampa",
    area: "Tampa, St. Petersburg, Clearwater",
    email: NA,
    phone: "(888) 214-1442",
    contactName: NA,
    prospectScore: 64,
    tier: "BACKUP",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "operating since 1990, hundreds of settlements/verdicts of $1M+",
    buyingSignal: "long-tenured boutique, no visible chat widget, but no email found anywhere",
    opportunity: "Decades of high-value verdicts drives referral volume a small practice can't staff around the clock for - but outreach needs a phone or contact-form follow-up, not email.",
    signals: ["operating since 1990", "hundreds of $1M+ settlements/verdicts", "no visible chat widget", "contact-form only, no email found"],
  }),
  // Chat-tool-flagged rows, added 2026-09-12: these were the ones dropped
  // during the original screening pass for running a competing chat/intake
  // widget. Rather than discard that research, they're logged here as
  // BACKUP with the specific tool named in signals so outreach can pitch
  // the gap that tool doesn't cover (after-hours phone/voicemail, not web
  // chat) instead of a generic "no chat widget" angle.
  personalInjury({
    businessName: "Mickey Keenan, P.A.",
    website: "https://mickeykeenan.com/",
    city: "Tampa",
    area: "Tampa",
    email: NA,
    phone: "(813) 723-3255",
    contactName: "Mickey Keenan",
    prospectScore: 58,
    tier: "BACKUP",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "solo-founder PI practice, over 500 five-star Google reviews",
    buyingSignal: "runs Intaker for web chat, but that only covers site visitors, not missed calls or voicemail after hours",
    opportunity: "Intaker handles the chat widget, not the phone line; a missed after-hours call still goes to voicemail same as a firm with no chat tool at all.",
    signals: ["solo founder", "500+ five-star Google reviews", "runs Intaker (web chat only)"],
  }),
  personalInjury({
    businessName: "Merricks Law Group, P.A.",
    website: "https://yourinjuryattorneys.com/",
    city: "Tampa",
    area: "Tampa",
    email: NA,
    phone: "(813) 355-8158",
    contactName: "Howard Merricks",
    prospectScore: 56,
    tier: "BACKUP",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "founder with 30+ years as a trial attorney, thousands of cases handled",
    buyingSignal: "runs a white-label webchat widget (apigateway.co), but that only covers site visitors, not missed calls or voicemail after hours",
    opportunity: "The webchat widget handles site visitors, not the phone line; a missed after-hours call still goes to voicemail same as a firm with no chat tool at all.",
    signals: ["30+ years as trial attorney", "thousands of cases handled", "runs a white-label webchat widget (web chat only)"],
  }),
];

/** Jacksonville, FL personal injury firm research, 2026-09-12. Same method
    as Tampa/Ohio/Fort Worth. Jacksonville's yield for clean (no
    chat-tool, has-email) rows was near zero - Intaker in particular is the
    default intake vendor being pushed to small/solo PI firms across
    Florida, not just here (4 of the firms below run it). Per the
    2026-09-12 decision, these chat-tool rows are kept as BACKUP with the
    specific tool named rather than discarded, so outreach can pitch the
    after-hours/missed-call gap that a web-chat-only tool doesn't cover.
    Campione Law is additionally a mixed-practice firm (also business
    litigation, criminal defense, real estate, workers' comp, VA claims),
    a second reason it's BACKUP and not HOT/GOOD. */
export const JACKSONVILLE_PI_PROSPECTS: SeedProspect[] = [
  personalInjury({
    businessName: "Campione Law, P.A.",
    website: "https://campionelawpa.com/",
    city: "Jacksonville",
    area: "Jacksonville",
    email: "CC@CampioneLawPA.com", // mailto: link on their own homepage, 2026-09-12
    phone: "(904) 906-2654",
    contactName: NA, // initials-only mailto (CC / MP), unclear which partner corresponds to which
    prospectScore: 54,
    tier: "BACKUP",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "runs Intaker for web chat; also a mixed-practice firm beyond personal injury",
    buyingSignal: "runs Intaker (web chat only), also handles business litigation/criminal defense/real estate/workers' comp/VA claims alongside PI",
    opportunity: "Intaker covers the chat widget, not the phone line, and a multi-practice-area intake flow is exactly where a missed call is more likely to be misrouted.",
    signals: ["runs Intaker (web chat only)", "mixed practice: PI, business litigation, criminal defense, real estate, workers' comp, VA claims"],
  }),
  personalInjury({
    businessName: "Law Offices of Charlie J. Gillette, Jr., P.A.",
    website: "https://www.gillettelaw.com/",
    city: "Jacksonville",
    area: "Jacksonville, also serving Southeast Georgia",
    email: NA,
    phone: "(904) 600-4758",
    contactName: "Charlie J. Gillette, Jr.",
    prospectScore: 60,
    tier: "BACKUP",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "solo practitioner, 20+ years, PI-only practice (auto/truck/motorcycle/bike/pedestrian/scooter accidents)",
    buyingSignal: "runs Client Chat Live, but that only covers site visitors, not missed calls or voicemail after hours",
    opportunity: "Client Chat Live handles the chat widget, not the phone line; a missed after-hours call still goes to voicemail same as a firm with no chat tool at all.",
    signals: ["solo practitioner, 20+ years", "PI-only practice", "runs Client Chat Live (web chat only)", "contact-form only, no email found"],
  }),
  personalInjury({
    businessName: "The Law Offices of Stephen A. Smith",
    website: "https://sasmithlegal.com/",
    city: "Jacksonville",
    area: "Jacksonville",
    email: NA,
    phone: "(904) 357-0090",
    contactName: "Stephen A. Smith",
    prospectScore: 58,
    tier: "BACKUP",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "solo founder, practicing in Jacksonville since 2010, PI-only practice",
    buyingSignal: "runs Intaker (web chat only), but that doesn't cover missed calls or voicemail after hours",
    opportunity: "Intaker covers the chat widget, not the phone line; a missed after-hours call still goes to voicemail same as a firm with no chat tool at all.",
    signals: ["solo founder", "practicing since 2010", "PI-only practice", "runs Intaker (web chat only)", "contact-form only, no email found"],
  }),
  personalInjury({
    businessName: "Baggett Law Personal Injury Lawyers",
    website: "https://www.baggettlaw.com/",
    city: "Jacksonville",
    area: "Jacksonville, multi-office",
    email: NA,
    phone: "(904) 842-4063",
    contactName: "Matt Baggett",
    prospectScore: 62,
    tier: "BACKUP",
    recommendedServiceId: LAW,
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "founded 2012, multi-office footprint, tens of millions recovered, nearly 10 decades combined attorney experience",
    buyingSignal: "runs Intaker (web chat only), multi-office coordination adds more surface area for a missed after-hours call",
    opportunity: "Intaker covers the chat widget, not the phone line; multi-office coordination is exactly where an after-hours call is more likely to slip through.",
    signals: ["founded 2012", "multi-office", "tens of millions recovered", "runs Intaker (web chat only)", "contact-form only, no email found"],
  }),
];

function insurance(
  partial: Omit<SeedProspect, "country" | "niche" | "research"> & { signals: string[] }
): SeedProspect {
  const { signals, city, ...rest } = partial;
  const country = city === "Calgary" ? "Canada" : "USA";
  return {
    ...rest,
    city,
    country,
    niche: "Insurance agencies",
    research: {
      verified: {
        name: rest.businessName,
        city,
        country,
        niche: "Insurance agencies",
        area: rest.area,
        website: rest.website ?? undefined,
        phone: rest.phone ?? undefined,
        email: rest.email ?? undefined,
        observedSignals: signals,
      },
      inferences: [rest.opportunity],
    },
  };
}

/** Columbus, OH and Calgary, AB insurance agency research (163 leads,
    AAA_Insurance_Leads_Columbus_Calgary.xlsx), fingerprinted against each
    agency'''s own site for real AMS/rater signatures (not guessed): Applied
    Epic webrater links, AMS360/Vertafore references, and EZLynx-hosted quote
    forms are called out explicitly where actually found on the page (5 AMS,
    11 EZLynx); everyone else gets the generic no-automation angle already
    present in the source research (static quote form, no booking, thin
    review count). Pitched at the existing ai-lead-capture service, framed as
    the front-office layer of an Insurance Account Manager Bundle (intake,
    review capture, renewal reminders) that never needs access to the
    agency'''s back-office AMS. */

export const COLUMBUS_INSURANCE_PROSPECTS: SeedProspect[] = [
  insurance({"businessName": "All Ohio Insurance Agency Inc", "website": "http://www.hosketulen.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@hosketulen.com", "phone": "+1 614-825-0770", "prospectScore": 90, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.6-star rating from only 9 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "All Ohio Insurance Agency Inc shows no automated review capture (4.6 stars, 9 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 9 on a 4.6-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Ankrom Agency", "website": "https://www.ankromagency.com/", "city": "Columbus", "area": "Columbus, OH", "email": "brady@ankromagency.com", "phone": "+1 614-888-1728", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 55 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Ankrom Agency shows no automated review capture (4.9 stars, 55 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 55 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Associated Insurance Agency", "website": "http://www.associated-ins.com/", "city": "Columbus", "area": "Columbus, OH", "email": "agencyinfo@associated-ins.com", "phone": "+1 380-208-0231", "prospectScore": 86, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "an EZLynx-powered quoting form on their own site, but no automated review capture (56 reviews) or after-hours follow-up around it", "buyingSignal": "EZLynx quoting engine live on their site, no automation layered around it", "opportunity": "Associated Insurance Agency already quotes through EZLynx, but nothing automates what happens around it (review requests, renewal reminders, after-hours lead intake). The Insurance Account Manager Bundle adds that front-office layer without touching EZLynx itself.", "signals": ["an EZLynx-powered quoting form live on your own site", "there is no automated review capture or after-hours follow-up around it"]}),
  insurance({"businessName": "Bixler Insurance Agency LLC", "website": "https://www.bixlerins.com/", "city": "Columbus", "area": "Columbus, OH", "email": "kevin@bixlerins.com", "phone": "+1 614-389-2799", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 13 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Bixler Insurance Agency LLC shows no automated review capture (5.0 stars, 13 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 13 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Bowers Insurance Services Inc", "website": "https://www.bowersisa.com/contact-us", "city": "Columbus", "area": "Columbus, OH", "email": "info@bowersisa.com", "phone": "+1 614-850-9244", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 2 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Bowers Insurance Services Inc shows no automated review capture (5.0 stars, 2 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 2 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Buckeye Benefit Consulting LLC", "website": "https://www.buckeyebenefits.com/", "city": "Columbus", "area": "Columbus, OH", "email": "admin@buckeyebenefits.com", "phone": "+1 614-655-5635", "prospectScore": 90, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "an EZLynx-powered quoting form on their own site, but no automated review capture (16 reviews) or after-hours follow-up around it", "buyingSignal": "EZLynx quoting engine live on their site, no automation layered around it", "opportunity": "Buckeye Benefit Consulting LLC already quotes through EZLynx, but nothing automates what happens around it (review requests, renewal reminders, after-hours lead intake). The Insurance Account Manager Bundle adds that front-office layer without touching EZLynx itself.", "signals": ["an EZLynx-powered quoting form live on your own site", "there is no automated review capture or after-hours follow-up around it"]}),
  insurance({"businessName": "Capital Insurance Group LLC", "website": "https://cigwv.com/", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 614-407-5668", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 2 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Capital Insurance Group LLC shows no automated review capture (5.0 stars, 2 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 2 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Chadwell Insurance", "website": "http://www.chadwellagency.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@chadwellagency.com", "phone": "+1 614-888-3067", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 1 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Chadwell Insurance shows no automated review capture (5.0 stars, 1 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 1 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Columbus Commercial Truck Insurance", "website": "https://columbuscommercialtruckinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 614-587-3031", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 2 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Columbus Commercial Truck Insurance shows no automated review capture (5.0 stars, 2 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 2 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Crunelle Insurance Agency", "website": "http://www.crunelleinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@crunelleins.com", "phone": "+1 614-876-4634", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 69 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Crunelle Insurance Agency shows no automated review capture (5.0 stars, 69 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 69 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Dean Insurance Group", "website": "https://deaninsurancegroup.com/", "city": "Columbus", "area": "Columbus, OH", "email": "rachel@deaninsurancegroup.com", "phone": "+1 614-881-1616", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 28 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Dean Insurance Group shows no automated review capture (4.9 stars, 28 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 28 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Detwiler-Brofford Insurance", "website": "https://www.detwilerinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@detwilerinsurance.com", "phone": "+1 614-471-4888", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 72 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Detwiler-Brofford Insurance shows no automated review capture (5.0 stars, 72 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 72 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Diersing Healthcare Consultants", "website": "https://dhcmedicare.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@DHCmedicare.com", "phone": "+1 614-634-0259", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 26 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Diersing Healthcare Consultants shows no automated review capture (5.0 stars, 26 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 26 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Dolbow Insurance LLC", "website": "http://www.dolbowinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "agent@dolbowinsurance.com", "phone": "+1 614-899-1611", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 96 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Dolbow Insurance LLC shows no automated review capture (4.9 stars, 96 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 96 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Dostal & Kirk Insurance & Financial Services", "website": "http://www.dostalkirk.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@dostalkirk.com", "phone": "+1 614-389-4246", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 42 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Dostal & Kirk Insurance & Financial Services shows no automated review capture (5.0 stars, 42 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 42 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "E & M Risk Management Agency, LLC", "website": "https://eandmrisk.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@eandmrisk.com", "phone": "+1 614-396-6853", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 3 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "E & M Risk Management Agency, LLC shows no automated review capture (5.0 stars, 3 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 3 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Fetchero Insurance", "website": "https://www.fetcheroinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "Kip@FetcheroInsurance.com", "phone": "+1 614-891-9311", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 41 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Fetchero Insurance shows no automated review capture (5.0 stars, 41 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 41 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "France & Associates Inc", "website": "https://franceins.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@franceins.com", "phone": "+1 614-888-8124", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.7-star rating from only 12 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "France & Associates Inc shows no automated review capture (4.7 stars, 12 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 12 on a 4.7-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Gilles Smith Purdum Insurance Agency", "website": "http://www.gsp-insurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@gsp-insurance.com", "phone": "+1 614-878-0240", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.7-star rating from only 55 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Gilles Smith Purdum Insurance Agency shows no automated review capture (4.7 stars, 55 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 55 on a 4.7-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Griffin-Lantz Insurance Agency", "website": "http://www.griffinlantzinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@griffinlantzinsurance.com", "phone": "+1 614-799-1217", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 70 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Griffin-Lantz Insurance Agency shows no automated review capture (5.0 stars, 70 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 70 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Hamilton Insurance Group, Inc.", "website": "https://www.hamiltonins.net/", "city": "Columbus", "area": "Columbus, OH", "email": "contact@hamiltonins.net", "phone": "+1 614-475-4786", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 4 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Hamilton Insurance Group, Inc. shows no automated review capture (5.0 stars, 4 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 4 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Impact Insurance Agency - Dublin Office", "website": "https://localhealthresource.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@localhealthresource.com", "phone": "+1 614-324-2641", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 55 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Impact Insurance Agency - Dublin Office shows no automated review capture (4.9 stars, 55 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 55 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Insurance Agency of Ohio", "website": "https://www.iaofohio.com/", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 380-400-8823", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 21 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Insurance Agency of Ohio shows no automated review capture (4.9 stars, 21 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 21 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "J. R. Scott Insurance Agency", "website": "https://jrscottinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "agent@jrscottinsurance.com", "phone": "+1 614-263-9699", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 25 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "J. R. Scott Insurance Agency shows no automated review capture (5.0 stars, 25 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 25 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "John Ren Insurance Agency", "website": "http://www.johnren123.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@johnren123.com", "phone": "+1 614-923-7783", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 23 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "John Ren Insurance Agency shows no automated review capture (5.0 stars, 23 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 23 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Kalmbaugh Insurance", "website": "http://www.kalmbaughinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "Team@KalmbaughInsurance.com", "phone": "+1 614-890-7222", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 84 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Kalmbaugh Insurance shows no automated review capture (5.0 stars, 84 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 84 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "McGlothin Insurance & Financial Services", "website": "http://iwantprotected.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@iwantprotected.com", "phone": "+1 614-274-0112", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 83 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "McGlothin Insurance & Financial Services shows no automated review capture (4.8 stars, 83 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 83 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Milestone Benefits Agency, Inc.", "website": "http://www.milestonebenefits.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@milestonebenefits.com", "phone": "+1 614-431-9540", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 13 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Milestone Benefits Agency, Inc. shows no automated review capture (5.0 stars, 13 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 13 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Montana Insurance", "website": "http://www.almontanaagency.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@almontanaagency.com", "phone": "+1 614-846-9830", "prospectScore": 86, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.6-star rating from only 21 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Montana Insurance shows no automated review capture (4.6 stars, 21 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 21 on a 4.6-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Point A Insurance", "website": "http://www.pointainsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "service@hedmananglinagency.com", "phone": "+1 614-486-7300", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 20 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Point A Insurance shows no automated review capture (5.0 stars, 20 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 20 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Rise Insurance Ohio", "website": "https://www.riseinsuranceohio.com/", "city": "Columbus", "area": "Columbus, OH", "email": "admin@riseinsuranceohio.com", "phone": "+1 614-586-7454", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 32 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Rise Insurance Ohio shows no automated review capture (4.9 stars, 32 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 32 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "SL Pierce Agency", "website": "http://slpierceagency.co/", "city": "Columbus", "area": "Columbus, OH", "email": "slpierceagencyinc@gmail.com", "phone": "+1 614-889-8761", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 6 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "SL Pierce Agency shows no automated review capture (4.8 stars, 6 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 6 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Scharver Insurance Group", "website": "http://www.scharverinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@scharverinsurance.com", "phone": "+1 614-855-0888", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 35 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Scharver Insurance Group shows no automated review capture (5.0 stars, 35 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 35 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Schneider Insurance Agency", "website": "https://www.schneiderins.com/", "city": "Columbus", "area": "Columbus, OH", "email": "wecanhelp@schneiderins.com", "phone": "+1 614-471-8444", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "an EZLynx-powered quoting form on their own site, but no automated review capture (6 reviews) or after-hours follow-up around it", "buyingSignal": "EZLynx quoting engine live on their site, no automation layered around it", "opportunity": "Schneider Insurance Agency already quotes through EZLynx, but nothing automates what happens around it (review requests, renewal reminders, after-hours lead intake). The Insurance Account Manager Bundle adds that front-office layer without touching EZLynx itself.", "signals": ["an EZLynx-powered quoting form live on your own site", "there is no automated review capture or after-hours follow-up around it"]}),
  insurance({"businessName": "Security Plus Insurance Agency", "website": "http://www.securityplusinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@securityplusinsurance.com", "phone": "+1 614-777-8999", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 36 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Security Plus Insurance Agency shows no automated review capture (4.9 stars, 36 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 36 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Sow Merry Associates", "website": "http://www.sowmerry.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@sowmerry.com", "phone": "+1 614-414-6366", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 35 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Sow Merry Associates shows no automated review capture (4.8 stars, 35 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 35 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Steadfast Insurance LLC", "website": "https://www.steadfastagents.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@steadfastagents.com", "phone": null, "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 94 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Steadfast Insurance LLC shows no automated review capture (5.0 stars, 94 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 94 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Stolly Insurance Group", "website": "http://stolly.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@stolly.com", "phone": "+1 614-818-9467", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "AMS360 (Vertafore) referenced on their own site, but no automated review capture (75 reviews) or renewal follow-up around it", "buyingSignal": "AMS360 (Vertafore) on their own site, no front-office automation around it", "opportunity": "Stolly Insurance Group already runs AMS360 for policy management, but the front-office layer around it (review capture, renewal reminders, after-hours intake) is still manual. The Insurance Account Manager Bundle sits in front of AMS360 (intake, document summary, CRM logging, renewal retention) without needing any access to the AMS itself.", "signals": ["AMS360 (Vertafore) referenced directly on your site", "there is no automated review capture or renewal follow-up around it"]}),
  insurance({"businessName": "Taylor Insurance Group", "website": "https://www.taylorgrp.net/", "city": "Columbus", "area": "Columbus, OH", "email": "info@taylorgrp.net", "phone": "+1 614-588-8230", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 19 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Taylor Insurance Group shows no automated review capture (5.0 stars, 19 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 19 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "The Al Washington Ins Agy Ltd", "website": "http://www.alwashingtoninsurance.com/?utm_source=G&utm_medium=local&utm_campaign=google-local", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 614-564-9156", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 30 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "The Al Washington Ins Agy Ltd shows no automated review capture (4.9 stars, 30 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 30 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "The Boling Insurance Group", "website": "http://www.norminsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@norminsurance.com", "phone": "+1 614-488-3722", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "an EZLynx-powered quoting form on their own site, but no automated review capture (29 reviews) or after-hours follow-up around it", "buyingSignal": "EZLynx quoting engine live on their site, no automation layered around it", "opportunity": "The Boling Insurance Group already quotes through EZLynx, but nothing automates what happens around it (review requests, renewal reminders, after-hours lead intake). The Insurance Account Manager Bundle adds that front-office layer without touching EZLynx itself.", "signals": ["an EZLynx-powered quoting form live on your own site", "there is no automated review capture or after-hours follow-up around it"]}),
  insurance({"businessName": "The Great Lakes Insurance Group", "website": "http://www.greatlakesinsurancegroup.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@greatlakesinsurancegroup.com", "phone": "+1 614-841-4444", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 6 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "The Great Lakes Insurance Group shows no automated review capture (5.0 stars, 6 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 6 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Tri-wood Insurance Agency, Inc.", "website": "https://tri-wood.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@tri-wood.com", "phone": "+1 614-408-9220", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 12 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Tri-wood Insurance Agency, Inc. shows no automated review capture (4.9 stars, 12 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 12 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "US Insurance Agency", "website": "https://usiagencyllc.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@usiagencyllc.com", "phone": "+1 614-647-7093", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 49 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "US Insurance Agency shows no automated review capture (5.0 stars, 49 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 49 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Wichert Insurance", "website": "http://www.wichert.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@wichert.com", "phone": "+1 614-794-4820", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.7-star rating from only 14 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Wichert Insurance shows no automated review capture (4.7 stars, 14 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 14 on a 4.7-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "eGoodwin Insurance Agency", "website": "https://www.egoodwininsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@egoodwininsurance.com", "phone": "+1 740-387-8337", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 53 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "eGoodwin Insurance Agency shows no automated review capture (5.0 stars, 53 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 53 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Americas Top Insurance LLC", "website": "https://americastopins.com/", "city": "Columbus", "area": "Columbus, OH", "email": "service@americastopins.com", "phone": "+1 614-733-8630", "prospectScore": 85, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "an EZLynx-powered quoting form on their own site, but no automated review capture (0 reviews) or after-hours follow-up around it", "buyingSignal": "EZLynx quoting engine live on their site, no automation layered around it", "opportunity": "Americas Top Insurance LLC already quotes through EZLynx, but nothing automates what happens around it (review requests, renewal reminders, after-hours lead intake). The Insurance Account Manager Bundle adds that front-office layer without touching EZLynx itself.", "signals": ["an EZLynx-powered quoting form live on your own site", "there is no automated review capture or after-hours follow-up around it"]}),
  insurance({"businessName": "Briggs & Williams Insurance Agency", "website": "https://briggswilliamsinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 614-486-7646", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 54 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Briggs & Williams Insurance Agency shows no automated review capture (4.9 stars, 54 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 54 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Burrey Insurance Agency, Inc.", "website": "https://www.burreyinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@burreyinsurance.com", "phone": "+1 614-717-0017", "prospectScore": 81, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.1-star rating from only 41 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Burrey Insurance Agency, Inc. shows no automated review capture (4.1 stars, 41 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 41 on a 4.1-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Daylight Insurance Agency", "website": "https://daylightinsuranceohio.com/", "city": "Columbus", "area": "Columbus, OH", "email": "support@daylightinsuranceohio.com", "phone": "+1 614-918-9131", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "an EZLynx-powered quoting form on their own site, but no automated review capture (122 reviews) or after-hours follow-up around it", "buyingSignal": "EZLynx quoting engine live on their site, no automation layered around it", "opportunity": "Daylight Insurance Agency already quotes through EZLynx, but nothing automates what happens around it (review requests, renewal reminders, after-hours lead intake). The Insurance Account Manager Bundle adds that front-office layer without touching EZLynx itself.", "signals": ["an EZLynx-powered quoting form live on your own site", "there is no automated review capture or after-hours follow-up around it"]}),
  insurance({"businessName": "Dressel & Evans Agency, Inc.", "website": "http://www.dresselevans.com/", "city": "Columbus", "area": "Columbus, OH", "email": "jim@dresselevans.com", "phone": "+1 614-488-9723", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.7-star rating from only 21 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Dressel & Evans Agency, Inc. shows no automated review capture (4.7 stars, 21 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 21 on a 4.7-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Exact Medicare - Medicare Plans", "website": "https://www.exactmedicare.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@exactmedicare.com", "phone": "+1 937-817-0289", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 5095 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Exact Medicare - Medicare Plans shows no automated review capture (4.9 stars, 5095 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 5095 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "FLANAGAN AND ASSOC INSURANCE AGENCY LLC", "website": "http://www.flanaganinsuranceagency.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@flanaganinsuranceagency.com", "phone": "+1 614-602-5770", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 113 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "FLANAGAN AND ASSOC INSURANCE AGENCY LLC shows no automated review capture (5.0 stars, 113 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 113 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Geswein Insurance Agency LLC", "website": "http://gesweinagency.com/", "city": "Columbus", "area": "Columbus, OH", "email": "Jerry@gesweinagency.com", "phone": "+1 614-389-2360", "prospectScore": 88, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 10 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Geswein Insurance Agency LLC shows no automated review capture (5.0 stars, 10 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 10 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Goree Insurance", "website": "http://goreeinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@goreeinsurance.com", "phone": "+1 614-280-9680", "prospectScore": 88, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 15 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Goree Insurance shows no automated review capture (4.8 stars, 15 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 15 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Guardian Insurance Solutions", "website": "https://www.guardianinsuranceohio.com/", "city": "Columbus", "area": "Columbus, OH", "email": "admin@guardianinsuranceohio.com", "phone": "+1 614-451-7100", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 112 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Guardian Insurance Solutions shows no automated review capture (4.9 stars, 112 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 112 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Haughn Insurance", "website": "https://www.haughn.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@haughn.com", "phone": "+1 877-802-2298", "prospectScore": 81, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.3-star rating from only 56 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Haughn Insurance shows no automated review capture (4.3 stars, 56 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 56 on a 4.3-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Heritage Insurance Advisors", "website": "https://heritageia.com/", "city": "Columbus", "area": "Columbus, OH", "email": "cbara@hia-oh.com", "phone": "+1 614-319-3501", "prospectScore": 88, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 11 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Heritage Insurance Advisors shows no automated review capture (5.0 stars, 11 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 11 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Highbank Insurance Brokers", "website": "http://insuredbybanner.com/", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 614-953-6722", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "an EZLynx-powered quoting form on their own site, but no automated review capture (26 reviews) or after-hours follow-up around it", "buyingSignal": "EZLynx quoting engine live on their site, no automation layered around it", "opportunity": "Highbank Insurance Brokers already quotes through EZLynx, but nothing automates what happens around it (review requests, renewal reminders, after-hours lead intake). The Insurance Account Manager Bundle adds that front-office layer without touching EZLynx itself.", "signals": ["an EZLynx-powered quoting form live on your own site", "there is no automated review capture or after-hours follow-up around it"]}),
  insurance({"businessName": "Highfield Insurance Agency LLC", "website": "https://www.highfield-insurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@highfield-insurance.com", "phone": "+1 614-882-3141", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 111 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Highfield Insurance Agency LLC shows no automated review capture (4.8 stars, 111 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 111 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Horizon Insurance Services, Inc.", "website": "http://www.horizoninsservices.com/", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 614-326-0200", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 64 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Horizon Insurance Services, Inc. shows no automated review capture (4.9 stars, 64 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 64 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Hyers & Associates Insurance", "website": "https://www.ohioinsureplan.com/", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 888-901-5650", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 26 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Hyers & Associates Insurance shows no automated review capture (5.0 stars, 26 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 26 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "INSocial Risk Advisors", "website": "https://insocialra.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@insocialra.com", "phone": "+1 800-886-2398", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 244 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "INSocial Risk Advisors shows no automated review capture (5.0 stars, 244 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 244 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Impact Insurance Agency", "website": "http://www.impactinsagency.com/", "city": "Columbus", "area": "Columbus, OH", "email": "reception@impactinsagency.com", "phone": "+1 614-324-2641", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 119 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Impact Insurance Agency shows no automated review capture (5.0 stars, 119 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 119 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Insura", "website": "https://insura4you.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@insura4you.com", "phone": "+1 614-500-4147", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 127 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Insura shows no automated review capture (5.0 stars, 127 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 127 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Isner Insurance Associates, Inc", "website": "https://www.isnerinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "contact@isnerinsurance.com", "phone": "+1 614-236-8691", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 124 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Isner Insurance Associates, Inc shows no automated review capture (4.8 stars, 124 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 124 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Issam Insurance Agency, LLC", "website": "https://issamins.com/", "city": "Columbus", "area": "Columbus, OH", "email": "team@issamins.com", "phone": "+1 614-418-1792", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 166 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Issam Insurance Agency, LLC shows no automated review capture (4.8 stars, 166 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 166 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Justice Insurance Agency", "website": "http://theinsuranceadvisorgroup.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@theinsuranceadvisorgroup.com", "phone": "+1 614-829-5353", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 466 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Justice Insurance Agency shows no automated review capture (5.0 stars, 466 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 466 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Kernan Insurance Agency, Inc.", "website": "http://www.kernaninsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@kernaninsurance.com", "phone": "+1 614-764-0121", "prospectScore": 81, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.2-star rating from only 32 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Kernan Insurance Agency, Inc. shows no automated review capture (4.2 stars, 32 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 32 on a 4.2-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Lew Griffin Insurance", "website": "https://www.lewgriffin.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@lewgriffin.com", "phone": "+1 614-475-0036", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 246 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Lew Griffin Insurance shows no automated review capture (5.0 stars, 246 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 246 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "MMA Insurance", "website": "https://www.mmains.net/", "city": "Columbus", "area": "Columbus, OH", "email": "staff@mmains.net", "phone": "+1 614-834-6624", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "an EZLynx-powered quoting form on their own site, but no automated review capture (183 reviews) or after-hours follow-up around it", "buyingSignal": "EZLynx quoting engine live on their site, no automation layered around it", "opportunity": "MMA Insurance already quotes through EZLynx, but nothing automates what happens around it (review requests, renewal reminders, after-hours lead intake). The Insurance Account Manager Bundle adds that front-office layer without touching EZLynx itself.", "signals": ["an EZLynx-powered quoting form live on your own site", "there is no automated review capture or after-hours follow-up around it"]}),
  insurance({"businessName": "MMA Insurance (Cooper Insurance Group)", "website": "https://www.mmains.net/", "city": "Columbus", "area": "Columbus, OH", "email": "staff@mmains.net", "phone": "+1 614-834-6624", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "an EZLynx-powered quoting form on their own site, but no automated review capture (38 reviews) or after-hours follow-up around it", "buyingSignal": "EZLynx quoting engine live on their site, no automation layered around it", "opportunity": "MMA Insurance (Cooper Insurance Group) already quotes through EZLynx, but nothing automates what happens around it (review requests, renewal reminders, after-hours lead intake). The Insurance Account Manager Bundle adds that front-office layer without touching EZLynx itself.", "signals": ["an EZLynx-powered quoting form live on your own site", "there is no automated review capture or after-hours follow-up around it"]}),
  insurance({"businessName": "Meridian Insurance Inc.", "website": "http://www.mymeridianinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@mymeridianinsurance.com", "phone": "+1 937-567-8900", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 103 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Meridian Insurance Inc. shows no automated review capture (5.0 stars, 103 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 103 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Mitchell Insurance Agency", "website": "https://www.insurance-mitchell.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@insurance-mitchell.com", "phone": "+1 614-875-1770", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 117 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Mitchell Insurance Agency shows no automated review capture (4.8 stars, 117 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 117 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Murray & Sons Insurance", "website": "http://murrayandsonsins.com/", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 614-237-0291", "prospectScore": 85, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.2-star rating from only 9 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Murray & Sons Insurance shows no automated review capture (4.2 stars, 9 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 9 on a 4.2-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Niehaus Insurance Services Ltd", "website": "http://www.niehausinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@niehausinsurance.com", "phone": "+1 614-433-9930", "prospectScore": 81, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.4-star rating from only 35 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Niehaus Insurance Services Ltd shows no automated review capture (4.4 stars, 35 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 35 on a 4.4-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Otto Insurance Group", "website": "http://www.otto-ins.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@otto-ins.com", "phone": "+1 614-964-2303", "prospectScore": 81, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.1-star rating from only 99 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Otto Insurance Group shows no automated review capture (4.1 stars, 99 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 99 on a 4.1-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Powers Jeffrey", "website": "http://www.mr-ins.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@mr-ins.com", "phone": "+1 614-888-4540", "prospectScore": 85, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 3.0-star rating from only 2 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Powers Jeffrey shows no automated review capture (3.0 stars, 2 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 2 on a 3.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "ProtectALL Insurance", "website": "https://www.protectallinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@ProtectALLinsurance.com", "phone": "+1 833-377-6832", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 116 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "ProtectALL Insurance shows no automated review capture (4.8 stars, 116 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 116 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Putnam White Lewis Insurance", "website": "https://www.pwlinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "support@pwlinsurance.com", "phone": "+1 614-267-1269", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 110 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Putnam White Lewis Insurance shows no automated review capture (4.9 stars, 110 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 110 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Questions About Medicare Insurance Coverage?", "website": "http://www.thebig65.com/", "city": "Columbus", "area": "Columbus, OH", "email": "Karl@TheBig65.com", "phone": "+1 614-245-8977", "prospectScore": 88, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 1 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Questions About Medicare Insurance Coverage? shows no automated review capture (5.0 stars, 1 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 1 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Rolland Insurance Solutions", "website": "https://www.rollandinsurance.net/", "city": "Columbus", "area": "Columbus, OH", "email": "info@rollandinsurance.net", "phone": "+1 614-789-1891", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "an EZLynx-powered quoting form on their own site, but no automated review capture (144 reviews) or after-hours follow-up around it", "buyingSignal": "EZLynx quoting engine live on their site, no automation layered around it", "opportunity": "Rolland Insurance Solutions already quotes through EZLynx, but nothing automates what happens around it (review requests, renewal reminders, after-hours lead intake). The Insurance Account Manager Bundle adds that front-office layer without touching EZLynx itself.", "signals": ["an EZLynx-powered quoting form live on your own site", "there is no automated review capture or after-hours follow-up around it"]}),
  insurance({"businessName": "Royal Service Commercial Auto & Truck Insurance", "website": "https://royalservicepro.com/truck-insurance-columbus-oh/", "city": "Columbus", "area": "Columbus, OH", "email": "info@RoyalServicePro.com", "phone": "+1 380-203-2621", "prospectScore": 88, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 17 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Royal Service Commercial Auto & Truck Insurance shows no automated review capture (5.0 stars, 17 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 17 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Schneider Senior Solutions", "website": "https://www.schneider4u.com/contact.html", "city": "Columbus", "area": "Columbus, OH", "email": "info@schneider4u.com", "phone": "+1 614-571-6922", "prospectScore": 88, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 18 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Schneider Senior Solutions shows no automated review capture (5.0 stars, 18 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 18 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Secure Insurance Group Ohio", "website": "https://www.sigoh.com/", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 614-943-0500", "prospectScore": 85, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.4-star rating from only 5 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Secure Insurance Group Ohio shows no automated review capture (4.4 stars, 5 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 5 on a 4.4-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Shepherd Insurance Partners, INC", "website": "https://shepherdinsurancepartners.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@shepherdinsurancepartners.com", "phone": "+1 614-259-5000", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 322 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Shepherd Insurance Partners, INC shows no automated review capture (4.9 stars, 322 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 322 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Solid Insurance", "website": "http://www.solidinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@solidinsurance.com", "phone": "+1 614-854-0000", "prospectScore": 81, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "an EZLynx-powered quoting form on their own site, but no automated review capture (297 reviews) or after-hours follow-up around it", "buyingSignal": "EZLynx quoting engine live on their site, no automation layered around it", "opportunity": "Solid Insurance already quotes through EZLynx, but nothing automates what happens around it (review requests, renewal reminders, after-hours lead intake). The Insurance Account Manager Bundle adds that front-office layer without touching EZLynx itself.", "signals": ["an EZLynx-powered quoting form live on your own site", "there is no automated review capture or after-hours follow-up around it"]}),
  insurance({"businessName": "Sylvia A. Garrett Agency, LLC", "website": "https://www.sylviaagarrettagency.com/", "city": "Columbus", "area": "Columbus, OH", "email": "customerservice@sylviagarrettagency.com", "phone": "+1 614-665-9801", "prospectScore": 85, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.4-star rating from only 16 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Sylvia A. Garrett Agency, LLC shows no automated review capture (4.4 stars, 16 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 16 on a 4.4-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Thompson-Cunningham Insurance Agency", "website": "https://www.thompsoncunningham.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@thompsoncunningham.com", "phone": "+1 614-885-8536", "prospectScore": 85, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 3.0-star rating from only 4 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Thompson-Cunningham Insurance Agency shows no automated review capture (3.0 stars, 4 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 4 on a 3.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "A.A. Affordable Insurance Agency of Ohio", "website": "http://affordablemitch.com/", "city": "Columbus", "area": "Columbus, OH", "email": "QUOTES@CALLMITCH.NET", "phone": "+1 614-221-7007", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 613 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "A.A. Affordable Insurance Agency of Ohio shows no automated review capture (4.8 stars, 613 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 613 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "AATO Insurance Agency LLC", "website": "https://www.aatoinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "yassin@aatoinsurance.com", "phone": "+1 614-918-9803", "prospectScore": 76, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.5-star rating from only 33 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "AATO Insurance Agency LLC shows no automated review capture (4.5 stars, 33 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 33 on a 4.5-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Absolute Insurance Solutions, Inc.", "website": "http://www.aisiteam.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@aisiteam.com", "phone": "+1 614-602-4833", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.7-star rating from only 59 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Absolute Insurance Solutions, Inc. shows no automated review capture (4.7 stars, 59 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 59 on a 4.7-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Brown Insurance Company LLC", "website": "https://www.browninsco.com/?utm_source=google&utm_medium=wix_google_business_profile&utm_campaign=12522614542188672857", "city": "Columbus", "area": "Columbus, OH", "email": "service@browninsco.com", "phone": "+1 614-324-6980", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 67 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Brown Insurance Company LLC shows no automated review capture (5.0 stars, 67 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 67 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "CK Insurance Group, LLC", "website": "http://www.ck-ins.com/", "city": "Columbus", "area": "Columbus, OH", "email": "chris@ck-ins.com", "phone": "+1 614-695-3330", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 38 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "CK Insurance Group, LLC shows no automated review capture (4.9 stars, 38 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 38 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Catanzaro Insurance", "website": "http://www.catanzaroinsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@catanzaroinsurance.com", "phone": "+1 614-489-8383", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.7-star rating from only 47 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Catanzaro Insurance shows no automated review capture (4.7 stars, 47 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 47 on a 4.7-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Dehan Enterprises LLC", "website": "https://www.dehaninsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 614-238-3520", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 22 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Dehan Enterprises LLC shows no automated review capture (5.0 stars, 22 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 22 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Eatmon Insurance Group ( Columbus Branch)", "website": "https://www.eatmonagency.com/", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 614-502-2711", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.7-star rating from only 38 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Eatmon Insurance Group ( Columbus Branch) shows no automated review capture (4.7 stars, 38 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 38 on a 4.7-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Elevate Insurance", "website": "https://www.elevateinsurancellc.com/", "city": "Columbus", "area": "Columbus, OH", "email": "support@elevateinsoh.com", "phone": "+1 740-531-5268", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 100 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Elevate Insurance shows no automated review capture (5.0 stars, 100 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 100 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Grandview Insurance Agency, LLC", "website": "http://www.grandviewinsuranceservice.com/", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 614-915-0977", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 43 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Grandview Insurance Agency, LLC shows no automated review capture (4.8 stars, 43 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 43 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Harp Insurance", "website": "https://www.harpinsure.com/", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 614-490-2248", "prospectScore": 83, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 17 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Harp Insurance shows no automated review capture (4.8 stars, 17 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 17 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Integrated Financial Systems", "website": "http://www.ifsainc.com/", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 614-238-5000", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 35 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Integrated Financial Systems shows no automated review capture (4.9 stars, 35 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 35 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "John Dawson Associates", "website": "http://www.johndawsoninsurance.com/", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 614-890-1660", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 397 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "John Dawson Associates shows no automated review capture (4.9 stars, 397 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 397 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "KKSG & Associates Inc", "website": "https://www.kksg.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@kksg.com", "phone": "+1 614-433-0525", "prospectScore": 80, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.2-star rating from only 5 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "KKSG & Associates Inc shows no automated review capture (4.2 stars, 5 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 5 on a 4.2-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Lynn Insurance Group", "website": "https://www.lynngroup.biz/", "city": "Columbus", "area": "Columbus, OH", "email": "tabitha@lynngroup.biz", "phone": "+1 614-779-0092", "prospectScore": 76, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.4-star rating from only 38 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Lynn Insurance Group shows no automated review capture (4.4 stars, 38 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 38 on a 4.4-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "MainLine Benefits - Steve Brandt", "website": "https://connect.mlbenefitsco.com/sbrandt", "city": "Columbus", "area": "Columbus, OH", "email": "sbrandt@mlbenefitsco.com", "phone": "+1 614-708-7400", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 207 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "MainLine Benefits - Steve Brandt shows no automated review capture (5.0 stars, 207 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 207 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Martin Insurance Services", "website": "https://www.martininsuranceoh.com/", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 614-231-8856", "prospectScore": 76, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.5-star rating from only 33 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Martin Insurance Services shows no automated review capture (4.5 stars, 33 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 33 on a 4.5-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Musilli Insurance Agency", "website": "http://musilliagency.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@musilliagency.com", "phone": "+1 614-848-9740", "prospectScore": 80, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a unrated-star rating from only 0 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Musilli Insurance Agency shows no automated review capture (unrated stars, 0 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 0 on a unrated-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Shield Insurance Agency LLC", "website": "http://www.shieldinsuranceagencyllc.com/", "city": "Columbus", "area": "Columbus, OH", "email": "info@shieldinsuranceagencyllc.com", "phone": "+1 614-324-9554", "prospectScore": 83, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 19 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Shield Insurance Agency LLC shows no automated review capture (5.0 stars, 19 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 19 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Slyman Insurance Group Ohio", "website": "http://www.slymaninsurancegroup.com/", "city": "Columbus", "area": "Columbus, OH", "email": "john@slymaninsurancegroup.com", "phone": "+1 614-475-3583", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 421 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Slyman Insurance Group Ohio shows no automated review capture (5.0 stars, 421 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 421 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Soller Insurance Agency", "website": "https://www.localinsurancecolumbusohio.com/", "city": "Columbus", "area": "Columbus, OH", "email": "insure@sollerinsurance.com", "phone": "+1 614-235-2815", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 37 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Soller Insurance Agency shows no automated review capture (4.8 stars, 37 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 37 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Town & Village Insurance", "website": "http://www.townvillageins.com/", "city": "Columbus", "area": "Columbus, OH", "email": null, "phone": "+1 614-457-6913", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 54 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Town & Village Insurance shows no automated review capture (4.9 stars, 54 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 54 on a 4.9-star rating, with nothing automated to request more"]}),
];

export const CALGARY_INSURANCE_PROSPECTS: SeedProspect[] = [
  insurance({"businessName": "Billyard Insurance Group - Deerfoot", "website": "https://www.thebig.ca/deerfoot", "city": "Calgary", "area": "Calgary, AB", "email": "deerfoot@thebig.ca", "phone": "+1 403-776-8210", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 49 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Billyard Insurance Group - Deerfoot shows no automated review capture (4.8 stars, 49 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 49 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "BrokerTeam Insurance - Calgary Office", "website": "https://brokerteam.ca/en/location/calgary-office/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 403-276-8333", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.7-star rating from only 13 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "BrokerTeam Insurance - Calgary Office shows no automated review capture (4.7 stars, 13 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 13 on a 4.7-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "CMB Insurance Brokers Calgary", "website": "https://www.cmbinsurance.ca/about-us/cmb-insurance-calgary/", "city": "Calgary", "area": "Calgary, AB", "email": "info@cmbinsurance.ca", "phone": "+1 587-943-3720", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 5 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "CMB Insurance Brokers Calgary shows no automated review capture (5.0 stars, 5 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 5 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Citrus Insurance", "website": "http://www.citrusinsurance.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "info@citrusinsurance.ca", "phone": "+1 403-775-4550", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 27 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Citrus Insurance shows no automated review capture (4.8 stars, 27 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 27 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "InsureWest", "website": "https://insurewest.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "info@insurewest.ca", "phone": "+1 403-222-2777", "prospectScore": 93, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 1 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "InsureWest shows no automated review capture (5.0 stars, 1 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 1 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Link Insurance Agency - Fish Creek Branch", "website": "https://www.linkinsurance.ca/fishcreek/", "city": "Calgary", "area": "Calgary, AB", "email": "info@linkinsurance.ca", "phone": "+1 403-775-6833", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 81 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Link Insurance Agency - Fish Creek Branch shows no automated review capture (5.0 stars, 81 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 81 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Link Insurance Agency Inc. (Edgemont)", "website": "https://www.linkinsurance.ca/edgemont/", "city": "Calgary", "area": "Calgary, AB", "email": "info@linkinsurance.ca", "phone": "+1 403-568-1000", "prospectScore": 86, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.6-star rating from only 25 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Link Insurance Agency Inc. (Edgemont) shows no automated review capture (4.6 stars, 25 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 25 on a 4.6-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Mammoth Insurance Inc.", "website": "https://www.mammothinsurance.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "info@mammothinsurance.ca", "phone": "+1 403-613-4448", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 22 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Mammoth Insurance Inc. shows no automated review capture (4.9 stars, 22 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 22 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Rajdeep Dhaliwal Insurance Expert - Truck Insurance Broker", "website": "https://rdhaliwalinsurance.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "r.dhaliwalinsurance@gmail.com", "phone": "+1 403-412-9459", "prospectScore": 90, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.5-star rating from only 17 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Rajdeep Dhaliwal Insurance Expert - Truck Insurance Broker shows no automated review capture (4.5 stars, 17 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 17 on a 4.5-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Tidal Insurance Services Inc.", "website": "https://www.tidalinsurance.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "info@tidalinsurance.ca", "phone": "+1 587-208-4325", "prospectScore": 96, "tier": "HOT", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "an Applied Epic-powered webrater embedded directly on their site, but no automated review capture (2 reviews) or renewal follow-up layered on top of it", "buyingSignal": "Applied Epic webrater on their own site, no front-office automation around it", "opportunity": "Tidal Insurance Services Inc. already runs Applied Epic for policy management, but the front-office layer around it (review capture, renewal reminders, after-hours intake) is still manual. The Insurance Account Manager Bundle sits in front of Applied Epic (intake, document summary, CRM logging, renewal retention) without needing any access to the AMS itself.", "signals": ["an Applied Epic webrater linked directly from your site", "there is no automated review capture or renewal follow-up layered on top of it"]}),
  insurance({"businessName": "Touchstone Insurance Inc", "website": "http://www.touchstoneinsurance.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "info@touchstoneinsurance.ca", "phone": "+1 403-457-5758", "prospectScore": 89, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.7-star rating from only 61 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Touchstone Insurance Inc shows no automated review capture (4.7 stars, 61 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 61 on a 4.7-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "ALIGNED Insurance Inc.", "website": "https://www.alignedinsurance.com/?utm_source=GMB&utm_medium=GMB&utm_campaign=Calgary", "city": "Calgary", "area": "Calgary, AB", "email": "info@alignedinsurance.com", "phone": "+1 403-879-9555", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.7-star rating from only 62 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "ALIGNED Insurance Inc. shows no automated review capture (4.7 stars, 62 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 62 on a 4.7-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Aaxel Insurance Brokers", "website": "https://www.aaxel.ca/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 403-930-7775", "prospectScore": 85, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 3.9-star rating from only 7 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Aaxel Insurance Brokers shows no automated review capture (3.9 stars, 7 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 7 on a 3.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Axis Insurance", "website": "https://axisinsurance.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "reception@axisinsurance.ca", "phone": "+1 403-456-7040", "prospectScore": 88, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 5 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Axis Insurance shows no automated review capture (5.0 stars, 5 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 5 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Broker Canada (insuranceshope.ca)", "website": "https://insuranceshope.ca/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 403-354-4444", "prospectScore": 85, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 3.9-star rating from only 7 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Broker Canada (insuranceshope.ca) shows no automated review capture (3.9 stars, 7 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 7 on a 3.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Excel & Y Insurance Services", "website": "https://excelandy.ca/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 403-253-1980", "prospectScore": 81, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.6-star rating from only 319 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Excel & Y Insurance Services shows no automated review capture (4.6 stars, 319 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 319 on a 4.6-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Family First Insurance", "website": "http://www.familyfirstinsurance.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "info@familyfirstinsurance.ca", "phone": "+1 403-980-7456", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 167 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Family First Insurance shows no automated review capture (4.8 stars, 167 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 167 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Kensington Insurance Services Ltd", "website": "http://kensingtonins.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "info@kensingtonins.ca", "phone": "+1 403-980-4670", "prospectScore": 85, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.1-star rating from only 14 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Kensington Insurance Services Ltd shows no automated review capture (4.1 stars, 14 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 14 on a 4.1-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Krywolt Insurance Brokers", "website": "http://www.krywolt.com/?utm_source=gmb&utm_campaign=local&utm_medium=organic", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 403-475-5434", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 170 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Krywolt Insurance Brokers shows no automated review capture (4.8 stars, 170 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 170 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Lanes Insurance Inc", "website": "http://www.lanesinsurance.com/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 403-264-8171", "prospectScore": 81, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.0-star rating from only 62 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Lanes Insurance Inc shows no automated review capture (4.0 stars, 62 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 62 on a 4.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Link Insurance Agency Inc. \"Glenbrook Branch\"", "website": "https://www.linkinsurance.ca/glenbrook/", "city": "Calgary", "area": "Calgary, AB", "email": "info@linkinsurance.ca", "phone": "+1 403-800-4595", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 249 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Link Insurance Agency Inc. \"Glenbrook Branch\" shows no automated review capture (4.9 stars, 249 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 249 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Link Insurance Agency Inc. - Crowfoot Branch", "website": "http://www.linkinsurance.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "info@linkinsurance.ca", "phone": "+1 403-590-7468", "prospectScore": 81, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.0-star rating from only 28 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Link Insurance Agency Inc. - Crowfoot Branch shows no automated review capture (4.0 stars, 28 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 28 on a 4.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "MMI Insurance", "website": "http://mmiab.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "info@mmiab.ca", "phone": "+1 866-222-6996", "prospectScore": 81, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.3-star rating from only 65 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "MMI Insurance shows no automated review capture (4.3 stars, 65 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 65 on a 4.3-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Magna Insurance Group", "website": "http://www.magnainsurance.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "info@magnains.ca", "phone": "+1 403-930-0466", "prospectScore": 88, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 4 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Magna Insurance Group shows no automated review capture (4.8 stars, 4 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 4 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Mango Insurance", "website": "http://mangoinsurance.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "policy@mangoinsurance.ca", "phone": "+1 888-822-2646", "prospectScore": 81, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.4-star rating from only 260 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Mango Insurance shows no automated review capture (4.4 stars, 260 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 260 on a 4.4-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Plaha Insurance Agency Inc", "website": "https://paramjit.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "info@paramjit.ca", "phone": "+1 403-554-4444", "prospectScore": 85, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.1-star rating from only 13 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Plaha Insurance Agency Inc shows no automated review capture (4.1 stars, 13 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 13 on a 4.1-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "PrimeOne Insurance Services Ltd", "website": "https://www.primeoneinsurance.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "info.primeone@telus.net", "phone": "+1 403-241-4979", "prospectScore": 81, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.6-star rating from only 23 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "PrimeOne Insurance Services Ltd shows no automated review capture (4.6 stars, 23 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 23 on a 4.6-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Riverside Insurance Services Ltd", "website": "http://riversideinsuranceservices.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "service@rsis.ca", "phone": "+1 403-851-9845", "prospectScore": 81, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.4-star rating from only 74 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Riverside Insurance Services Ltd shows no automated review capture (4.4 stars, 74 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 74 on a 4.4-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Shamil Verma - Commercial and Life Insurance Broker", "website": "https://shamilverma.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "shamil.verma@gmail.com", "phone": "+1 403-966-2309", "prospectScore": 88, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 5.0-star rating from only 16 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Shamil Verma - Commercial and Life Insurance Broker shows no automated review capture (5.0 stars, 16 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 16 on a 5.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Sproule Insurance Inc", "website": "http://www.sprouleinsurance.com/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 403-251-5559", "prospectScore": 81, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.6-star rating from only 41 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Sproule Insurance Inc shows no automated review capture (4.6 stars, 41 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 41 on a 4.6-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Swift Digital Insurance", "website": "https://swiftins.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "hello@csinsure.ca", "phone": "+1 833-277-9438", "prospectScore": 88, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "an Applied Epic-powered webrater embedded directly on their site, but no automated review capture (26 reviews) or renewal follow-up layered on top of it", "buyingSignal": "Applied Epic webrater on their own site, no front-office automation around it", "opportunity": "Swift Digital Insurance already runs Applied Epic for policy management, but the front-office layer around it (review capture, renewal reminders, after-hours intake) is still manual. The Insurance Account Manager Bundle sits in front of Applied Epic (intake, document summary, CRM logging, renewal retention) without needing any access to the AMS itself.", "signals": ["an Applied Epic webrater linked directly from your site", "there is no automated review capture or renewal follow-up layered on top of it"]}),
  insurance({"businessName": "Wilson M. Beck Insurance Services (Alberta) Inc.", "website": "https://wmbeck.com/?utm_source=google&utm_medium=gmb", "city": "Calgary", "area": "Calgary, AB", "email": "specialty@wmbeck.com", "phone": "+1 403-228-5888", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 64 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Wilson M. Beck Insurance Services (Alberta) Inc. shows no automated review capture (4.9 stars, 64 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 64 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Xu Levy & Associates", "website": "http://www.xuinsurance.com/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 403-313-8169", "prospectScore": 85, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.6-star rating from only 11 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Xu Levy & Associates shows no automated review capture (4.6 stars, 11 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 11 on a 4.6-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Young & Haggis Insurance Services Ltd", "website": "http://www.young-haggis.com/", "city": "Calgary", "area": "Calgary, AB", "email": "info@young-haggis.com", "phone": "+1 403-255-7781", "prospectScore": 84, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 147 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Young & Haggis Insurance Services Ltd shows no automated review capture (4.9 stars, 147 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 147 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "AIM Insurance", "website": "http://theaim.ca/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 587-287-3246", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 31 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "AIM Insurance shows no automated review capture (4.8 stars, 31 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 31 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Affordable Insurance Quotes", "website": "https://www.affordable-quotes.ca/?utm_source=google&utm_medium=organic&utm_campaign=gmb", "city": "Calgary", "area": "Calgary, AB", "email": "tony.luong@insureline.com", "phone": "+1 403-401-8876", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 99 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Affordable Insurance Quotes shows no automated review capture (4.8 stars, 99 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 99 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "CJ Campbell Insurance", "website": "https://cjcampbell.com/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 403-230-1521", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.7-star rating from only 209 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "CJ Campbell Insurance shows no automated review capture (4.7 stars, 209 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 209 on a 4.7-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "CRS Merrill Insurance Calgary", "website": "http://www.cminsurance.ca/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 403-221-9000", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.7-star rating from only 59 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "CRS Merrill Insurance Calgary shows no automated review capture (4.7 stars, 59 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 59 on a 4.7-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "DeJong's Insurance Ltd", "website": "http://www.dejongsinsurance.ca/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 403-245-1192", "prospectScore": 80, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "an Applied Epic-powered webrater embedded directly on their site, but no automated review capture (117 reviews) or renewal follow-up layered on top of it", "buyingSignal": "Applied Epic webrater on their own site, no front-office automation around it", "opportunity": "DeJong's Insurance Ltd already runs Applied Epic for policy management, but the front-office layer around it (review capture, renewal reminders, after-hours intake) is still manual. The Insurance Account Manager Bundle sits in front of Applied Epic (intake, document summary, CRM logging, renewal retention) without needing any access to the AMS itself.", "signals": ["an Applied Epic webrater linked directly from your site", "there is no automated review capture or renewal follow-up layered on top of it"]}),
  insurance({"businessName": "Eau Claire Partners Inc", "website": "https://eauclairepartners.com/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 800-711-0419", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.7-star rating from only 148 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Eau Claire Partners Inc shows no automated review capture (4.7 stars, 148 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 148 on a 4.7-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Eddie Chui Insurance Agency (ECIA)", "website": "http://www.eddiechui.com/", "city": "Calgary", "area": "Calgary, AB", "email": "info@eddiechui.com", "phone": "+1 403-288-3388", "prospectScore": 76, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.4-star rating from only 39 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Eddie Chui Insurance Agency (ECIA) shows no automated review capture (4.4 stars, 39 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 39 on a 4.4-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Insure Calgary", "website": "https://insurecalgary.com/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 587-998-8587", "prospectScore": 80, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 3.0-star rating from only 1 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Insure Calgary shows no automated review capture (3.0 stars, 1 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 1 on a 3.0-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Jones & Salt Insurance Brokerage Ltd", "website": "http://jsinsure.com/", "city": "Calgary", "area": "Calgary, AB", "email": "reception@jsinsure.com", "phone": "+1 403-234-8782", "prospectScore": 76, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.3-star rating from only 43 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Jones & Salt Insurance Brokerage Ltd shows no automated review capture (4.3 stars, 43 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 43 on a 4.3-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Knight Archer Insurance", "website": "https://www.knightarcher.com/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 403-452-5678", "prospectScore": 80, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "an Applied Epic-powered webrater embedded directly on their site, but no automated review capture (25 reviews) or renewal follow-up layered on top of it", "buyingSignal": "Applied Epic webrater on their own site, no front-office automation around it", "opportunity": "Knight Archer Insurance already runs Applied Epic for policy management, but the front-office layer around it (review capture, renewal reminders, after-hours intake) is still manual. The Insurance Account Manager Bundle sits in front of Applied Epic (intake, document summary, CRM logging, renewal retention) without needing any access to the AMS itself.", "signals": ["an Applied Epic webrater linked directly from your site", "there is no automated review capture or renewal follow-up layered on top of it"]}),
  insurance({"businessName": "Lakeview Insurance Brokers Ltd.", "website": "http://www.lakeviewinsurance.ca/?utm_source=google&utm_medium=GMB", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 403-287-2521", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.7-star rating from only 77 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Lakeview Insurance Brokers Ltd. shows no automated review capture (4.7 stars, 77 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 77 on a 4.7-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Link Insurance Agency Inc.", "website": "http://www.linkinsurance.ca/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 403-719-2228", "prospectScore": 80, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.3-star rating from only 17 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Link Insurance Agency Inc. shows no automated review capture (4.3 stars, 17 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 17 on a 4.3-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "MKMK Insurance - SW Office", "website": "http://www.mkmkinsurance.com/", "city": "Calgary", "area": "Calgary, AB", "email": "info@mkmkinsurance.com", "phone": "+1 403-668-1139", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.8-star rating from only 131 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "MKMK Insurance - SW Office shows no automated review capture (4.8 stars, 131 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 131 on a 4.8-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Medi-Quote Insurance Brokers", "website": "http://www.mediquote.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "info@mediquote.ca", "phone": "+1 403-259-2969", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 194 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Medi-Quote Insurance Brokers shows no automated review capture (4.9 stars, 194 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 194 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Melkios | Specialty Insurance", "website": "https://www.melkios.com/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "N/A", "prospectScore": 80, "tier": "GOOD", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a unrated-star rating from only 0 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Melkios | Specialty Insurance shows no automated review capture (unrated stars, 0 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 0 on a unrated-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Punjab Insurance® Inc. Calgary", "website": "https://punjabinsurancecalgary.ca/", "city": "Calgary", "area": "Calgary, AB", "email": "harpinder@harpindersidhu.ca", "phone": "+1 403-404-3500", "prospectScore": 79, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.9-star rating from only 695 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Punjab Insurance® Inc. Calgary shows no automated review capture (4.9 stars, 695 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 695 on a 4.9-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Ryder Insurance", "website": "https://ryderins.ca/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 403-284-4771", "prospectScore": 76, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.5-star rating from only 53 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Ryder Insurance shows no automated review capture (4.5 stars, 53 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 53 on a 4.5-star rating, with nothing automated to request more"]}),
  insurance({"businessName": "Stirling Insurance Group Ltd", "website": "http://stirlinginsurancegroup.ca/wp/", "city": "Calgary", "area": "Calgary, AB", "email": null, "phone": "+1 403-720-1939", "prospectScore": 76, "tier": "BACKUP", "recommendedServiceId": "ai-lead-capture", "recommendedOffer": "FREE_WRITTEN_AUDIT", "personalizationSignal": "a 4.4-star rating from only 22 reviews and a static quote form with no online booking or automated follow-up", "buyingSignal": "manual quote-form intake with no automated follow-up", "opportunity": "Stirling Insurance Group Ltd shows no automated review capture (4.4 stars, 22 reviews) and intake runs through a static quote form. The Insurance Account Manager Bundle's front-office layer (instant text-back on new quotes, automated review requests, renewal reminders) fits directly on top, no access to their back-office system required.", "signals": ["a static quote form with no online booking", "your public review count sits at only 22 on a 4.4-star rating, with nothing automated to request more"]}),
];

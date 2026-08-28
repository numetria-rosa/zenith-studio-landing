import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import {
  PROPOSAL_ITEM_KIND_LABELS,
  PROPOSAL_SECTION_LABELS,
  computeProposalTotals,
} from "@/lib/proposals-admin";

/* PDF rendering for a Proposal — shares no code with the client-facing
   HTML view (src/app/proposals/view/[accessToken]/page.tsx), but is built
   from the exact same data (same Prisma query shape, same section labels,
   same computeProposalTotals) so the two can never disagree on numbers,
   only on layout. @react-pdf/renderer over a headless-Chrome/Puppeteer
   route deliberately — it's pure JS (no Chromium binary to ship or keep
   alive in a serverless function), which matters because this runs inside
   a Vercel API route, not a long-lived server.

   Dark theme, Geist typeface: mirrors the actual Studio site (src/app/
   layout.tsx uses next/font/google's Geist; #05060a background, cyan/
   fuchsia accents throughout page.tsx) rather than a generic light
   business-document look — a proposal PDF should read as unmistakably
   Zenith Studio, not as a template with a logo pasted on. Geist isn't a
   built-in PDF font, so it's registered from Google Fonts' static CDN at
   module load (same TTF files google Fonts serves the browser) rather
   than the built-in Helvetica the previous version used. */

Font.register({
  family: "Geist",
  fonts: [
    { src: "https://fonts.gstatic.com/s/geist/v5/gyBhhwUxId8gMGYQMKR3pzfaWI_RnOM4nQ.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/geist/v5/gyBhhwUxId8gMGYQMKR3pzfaWI_RruM4nQ.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/geist/v5/gyBhhwUxId8gMGYQMKR3pzfaWI_RQuQ4nQ.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/geist/v5/gyBhhwUxId8gMGYQMKR3pzfaWI_Re-Q4nQ.ttf", fontWeight: 700 },
    { src: "https://fonts.gstatic.com/s/geist/v5/gyBhhwUxId8gMGYQMKR3pzfaWI_RHOQ4nQ.ttf", fontWeight: 800 },
  ],
});

const BG = "#05060a";
const CARD = "#0d0f16";
const BORDER = "#20242f";
const TEXT = "#eef0f5";
const MUTED = "#8b93a6";
const CYAN = "#5fd9ea";
const FUCHSIA = "#e79bf0";

const styles = StyleSheet.create({
  page: {
    backgroundColor: BG,
    color: TEXT,
    paddingTop: 44,
    paddingBottom: 60,
    paddingHorizontal: 44,
    fontSize: 9.5,
    fontFamily: "Geist",
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandMark: {
    width: 9,
    height: 9,
    backgroundColor: CYAN,
    borderRadius: 2,
    marginRight: 7,
  },
  brandRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandName: {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    color: MUTED,
  },
  preparedDate: {
    fontSize: 8.5,
    color: MUTED,
    letterSpacing: 0.5,
  },
  headline: {
    marginTop: 22,
    fontSize: 50,
    fontWeight: 800,
    letterSpacing: -1.2,
    color: TEXT,
  },
  headlineAccent: {
    color: CYAN,
  },
  gradientBar: {
    flexDirection: "row",
    height: 3,
    marginTop: 16,
    marginBottom: 22,
    borderRadius: 2,
    overflow: "hidden",
  },
  gradientSegment: { flex: 1 },
  metaRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    paddingVertical: 10,
    marginBottom: 22,
  },
  metaCol: { flex: 1 },
  metaLabel: {
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: MUTED,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 500,
    color: TEXT,
  },
  toFromRow: {
    flexDirection: "row",
    marginBottom: 26,
  },
  toFromCol: { flex: 1 },
  toFromLabel: {
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: CYAN,
    marginBottom: 5,
  },
  toFromLine: {
    fontSize: 10,
    color: TEXT,
    marginBottom: 2,
  },
  toFromLineMuted: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 2,
  },
  section: {
    marginBottom: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: CYAN,
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 9.5,
    lineHeight: 1.55,
    color: "#c7cbd6",
  },
  pricingHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 6,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  pricingHeaderLabel: {
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: MUTED,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  itemLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: TEXT,
  },
  itemMeta: {
    fontSize: 8,
    color: MUTED,
    marginTop: 1,
  },
  itemAmount: {
    fontSize: 10,
    fontWeight: 700,
    color: TEXT,
  },
  discountAmount: {
    color: "#7ee9c2",
  },
  addOnTitle: {
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: FUCHSIA,
    marginTop: 12,
    marginBottom: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#3a4050",
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: TEXT,
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: 800,
    color: CYAN,
  },
  footer: {
    position: "absolute",
    bottom: 26,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: MUTED,
    letterSpacing: 0.5,
  },
});

export type ProposalPdfData = {
  id: string;
  companyName: string | null;
  clientName: string | null;
  clientEmail: string;
  sections: Partial<Record<keyof typeof PROPOSAL_SECTION_LABELS, string | null>>;
  items: {
    id: string;
    label: string;
    kind: keyof typeof PROPOSAL_ITEM_KIND_LABELS;
    amountCents: number;
    unitLabel: string | null;
    isOptionalAddOn: boolean;
  }[];
  preparedAt: Date;
  expiresAt: Date | null;
};

function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  // Pinned to en-US explicitly — unlike the client-facing web view (which
  // inherits the browser's own locale), this renders in a Node process
  // whose ICU locale isn't guaranteed to be en-US, and a stray
  // toLocaleString(undefined, ...) here silently produced "$270,00"
  // (comma decimal) instead of "$270.00" during verification.
  return `${sign}$${(Math.abs(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function GradientBar() {
  const colors = [CYAN, "#7fc2f2", "#a9a8f5", "#d08bf2", FUCHSIA];
  return (
    <View style={styles.gradientBar}>
      {colors.map((c) => (
        <View key={c} style={[styles.gradientSegment, { backgroundColor: c }]} />
      ))}
    </View>
  );
}

function ProposalPdfDocument({ data }: { data: ProposalPdfData }) {
  const totals = computeProposalTotals(data.items);
  const coreItems = data.items.filter((i) => !i.isOptionalAddOn);
  const addOnItems = data.items.filter((i) => i.isOptionalAddOn);
  const sectionKeys = Object.keys(PROPOSAL_SECTION_LABELS) as (keyof typeof PROPOSAL_SECTION_LABELS)[];
  const reference = data.id.slice(-8).toUpperCase();

  return (
    <Document title={`Zenith Studio Proposal — ${data.companyName || data.clientName || data.clientEmail}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <View style={styles.brandRowLeft}>
            <View style={styles.brandMark} />
            <Text style={styles.brandName}>Zenith Studio</Text>
          </View>
          <Text style={styles.preparedDate}>{formatDate(data.preparedAt)}</Text>
        </View>

        <Text style={styles.headline}>
          Proposal<Text style={styles.headlineAccent}>.</Text>
        </Text>
        <GradientBar />

        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Prepared</Text>
            <Text style={styles.metaValue}>{formatDate(data.preparedAt)}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Valid until</Text>
            <Text style={styles.metaValue}>{data.expiresAt ? formatDate(data.expiresAt) : "No expiry"}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Reference</Text>
            <Text style={styles.metaValue}>ZS-{reference}</Text>
          </View>
        </View>

        <View style={styles.toFromRow}>
          <View style={styles.toFromCol}>
            <Text style={styles.toFromLabel}>Prepared for</Text>
            <Text style={styles.toFromLine}>{data.companyName || data.clientName || data.clientEmail}</Text>
            {data.companyName && data.clientName && <Text style={styles.toFromLineMuted}>{data.clientName}</Text>}
            <Text style={styles.toFromLineMuted}>{data.clientEmail}</Text>
          </View>
          <View style={styles.toFromCol}>
            <Text style={styles.toFromLabel}>From</Text>
            <Text style={styles.toFromLine}>Zenith Studio</Text>
            <Text style={styles.toFromLineMuted}>hello@zenith-studio.site</Text>
            <Text style={styles.toFromLineMuted}>zenith-studio.site</Text>
          </View>
        </View>

        {sectionKeys.map((key) => {
          const value = data.sections[key];
          if (!value?.trim()) return null;
          return (
            <View key={key} style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>{PROPOSAL_SECTION_LABELS[key]}</Text>
              <Text style={styles.sectionBody}>{value}</Text>
            </View>
          );
        })}

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.pricingHeaderRow}>
            <Text style={styles.pricingHeaderLabel}>Item</Text>
            <Text style={styles.pricingHeaderLabel}>Amount</Text>
          </View>
          {coreItems.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemMeta}>
                  {PROPOSAL_ITEM_KIND_LABELS[item.kind]}
                  {item.unitLabel ? ` · ${item.unitLabel}` : ""}
                </Text>
              </View>
              <Text style={[styles.itemAmount, item.amountCents < 0 ? styles.discountAmount : undefined]}>
                {formatCents(item.amountCents)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Core total</Text>
            <Text style={styles.totalAmount}>{formatCents(totals.coreCents)}</Text>
          </View>

          {addOnItems.length > 0 && (
            <>
              <Text style={styles.addOnTitle}>Optional add-ons</Text>
              {addOnItems.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    {item.unitLabel && <Text style={styles.itemMeta}>{item.unitLabel}</Text>}
                  </View>
                  <Text style={styles.itemAmount}>{formatCents(item.amountCents)}</Text>
                </View>
              ))}
            </>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total if all accepted</Text>
            <Text style={styles.totalAmount}>{formatCents(totals.totalCents)}</Text>
          </View>
        </View>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) => `ZENITH STUDIO · ZENITH-STUDIO.SITE                                                                Page ${pageNumber} of ${totalPages}`}
        />
      </Page>
    </Document>
  );
}

/** Shared by the PDF route and the email-PDF action so a filename never
    drifts between the two. */
export function proposalPdfFilename(companyName: string | null, clientName: string | null): string {
  const slugSource = companyName || clientName || "proposal";
  return `zenith-studio-proposal-${slugSource.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}.pdf`;
}

/** Loads a Proposal by id and renders it to a PDF buffer. The one shared
    entry point for both the admin "preview/download PDF" route and the
    "email PDF to client" send action, so the two can never drift into
    rendering different documents. */
export async function renderProposalPdfBuffer(proposalId: string): Promise<Buffer | null> {
  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!proposal) return null;

  const data: ProposalPdfData = {
    id: proposal.id,
    companyName: proposal.companyName,
    clientName: proposal.clientName,
    clientEmail: proposal.clientEmail,
    sections: Object.fromEntries(
      (Object.keys(PROPOSAL_SECTION_LABELS) as (keyof typeof PROPOSAL_SECTION_LABELS)[]).map((k) => [k, proposal[k]])
    ),
    items: proposal.items,
    preparedAt: proposal.updatedAt,
    expiresAt: proposal.expiresAt,
  };

  return renderToBuffer(<ProposalPdfDocument data={data} />);
}

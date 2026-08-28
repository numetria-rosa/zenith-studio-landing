import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
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
   a Vercel API route, not a long-lived server. Light/print palette, not
   the site's dark theme — a proposal is a document to print or forward,
   not a themed web page. */

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10.5,
    fontFamily: "Helvetica",
    color: "#1a1d29",
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#0891b2",
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#5b6270",
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0e7490",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 4,
  },
  sectionBody: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#2b2f3a",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  itemLabel: {
    fontSize: 10,
    color: "#2b2f3a",
  },
  itemMeta: {
    fontSize: 8.5,
    color: "#8a90a0",
  },
  itemAmount: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1a1d29",
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  totalAmount: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0e7490",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#9aa0ae",
    textAlign: "center",
  },
});

export type ProposalPdfData = {
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
};

function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function ProposalPdfDocument({ data }: { data: ProposalPdfData }) {
  const totals = computeProposalTotals(data.items);
  const coreItems = data.items.filter((i) => !i.isOptionalAddOn);
  const addOnItems = data.items.filter((i) => i.isOptionalAddOn);
  const sectionKeys = Object.keys(PROPOSAL_SECTION_LABELS) as (keyof typeof PROPOSAL_SECTION_LABELS)[];

  return (
    <Document title={`Zenith Studio Proposal — ${data.companyName || data.clientName || data.clientEmail}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Zenith Studio Proposal</Text>
        <Text style={styles.title}>{data.companyName || data.clientName || "Your proposal"}</Text>
        <Text style={styles.subtitle}>
          Prepared for {data.clientName || data.clientEmail}
          {data.companyName ? ` · ${data.companyName}` : ""} · {data.preparedAt.toISOString().slice(0, 10)}
        </Text>

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          {coreItems.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemMeta}>
                  {PROPOSAL_ITEM_KIND_LABELS[item.kind]}
                  {item.unitLabel ? ` · ${item.unitLabel}` : ""}
                </Text>
              </View>
              <Text style={styles.itemAmount}>{formatCents(item.amountCents)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Core total</Text>
            <Text style={styles.totalAmount}>{formatCents(totals.coreCents)}</Text>
          </View>

          {addOnItems.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 14, color: "#a21caf" }]}>Optional add-ons</Text>
              {addOnItems.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Text style={styles.itemMeta}>{item.unitLabel ?? ""}</Text>
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

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Zenith Studio · Page ${pageNumber} of ${totalPages}`} fixed />
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
    companyName: proposal.companyName,
    clientName: proposal.clientName,
    clientEmail: proposal.clientEmail,
    sections: Object.fromEntries(
      (Object.keys(PROPOSAL_SECTION_LABELS) as (keyof typeof PROPOSAL_SECTION_LABELS)[]).map((k) => [k, proposal[k]])
    ),
    items: proposal.items,
    preparedAt: proposal.updatedAt,
  };

  return renderToBuffer(<ProposalPdfDocument data={data} />);
}

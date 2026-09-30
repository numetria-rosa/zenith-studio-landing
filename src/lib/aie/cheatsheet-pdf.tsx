import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { inlineTokens, type CheatSheet, type CheatSheetSection } from "./cheatsheets";

/* Printable study sheet. Light and built-in fonts on purpose: it is meant to be printed, and pure JS
   (no Chromium) so it runs in a serverless route, the same reasoning as src/lib/proposal-pdf.tsx.
   Every section gets one of four study colours (a tinted card with a thick left stripe) so the page
   reads as organised blocks; the colours match the on-screen cheat sheet. */

const PALETTE = [
  { ink: "#1F6F97", tint: "#EAF5FB", line: "#BFE0F0" }, // blue
  { ink: "#A8700C", tint: "#FDF5E3", line: "#F0DDAE" }, // amber
  { ink: "#23795A", tint: "#E8F6EF", line: "#B9E2CF" }, // mint
  { ink: "#6444B4", tint: "#F0EBFB", line: "#D3C6F0" }, // violet
] as const;

const s = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 46, paddingHorizontal: 34, fontFamily: "Helvetica", fontSize: 9.5, color: "#1b1d24", lineHeight: 1.42 },
  band: { flexDirection: "row", height: 5, marginBottom: 14, borderRadius: 3, overflow: "hidden" },
  tag: { fontSize: 8.5, letterSpacing: 1.6, color: "#23795A", textTransform: "uppercase", marginBottom: 5 },
  title: { fontSize: 23, fontFamily: "Helvetica-Bold", lineHeight: 1.15 },
  meta: { fontSize: 9, color: "#5d6373", marginTop: 5, marginBottom: 14 },
  cols: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },
  card: { borderRadius: 7, borderWidth: 1, borderLeftWidth: 4, paddingVertical: 9, paddingHorizontal: 11, marginBottom: 9 },
  head: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  num: { width: 15, height: 15, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 6 },
  numText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  label: { fontSize: 8.5, fontFamily: "Helvetica-Bold", letterSpacing: 1, textTransform: "uppercase" },
  row: { flexDirection: "row", marginBottom: 3.5 },
  dot: { width: 11, fontFamily: "Helvetica-Bold" },
  box: { width: 9, height: 9, borderWidth: 1, borderRadius: 2, marginRight: 6, marginTop: 1.5 },
  code: { fontFamily: "Courier", backgroundColor: "#ffffff" },
  bold: { fontFamily: "Helvetica-Bold" },
  formula: { fontFamily: "Courier", fontSize: 8.8, backgroundColor: "#ffffff", borderWidth: 1, borderRadius: 4, padding: 7, marginTop: 2 },
  term: { fontFamily: "Courier", fontSize: 8.8 },
  footer: { position: "absolute", bottom: 20, left: 34, right: 34, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#7d8392" },
});

function Line({ text }: { text: string }) {
  return (
    <Text style={{ flex: 1 }}>
      {inlineTokens(text).map((t, i) => (
        <Text key={i} style={t.code ? s.code : t.bold ? s.bold : undefined}>
          {t.t}
        </Text>
      ))}
    </Text>
  );
}

type Block = { key: string; weight: number; node: React.ReactNode };

function sectionBlock(sec: CheatSheetSection, n: number): Block {
  const c = PALETTE[(n - 1) % PALETTE.length]!;
  const weight = 2 + (sec.items?.length ?? 0) * 1.6 + (sec.checklist?.length ?? 0) * 1.6 + (sec.formula ? 2.4 : 0);
  return {
    key: sec.label,
    weight,
    node: (
      <View key={sec.label} style={[s.card, { backgroundColor: c.tint, borderColor: c.line, borderLeftColor: c.ink }]} wrap={false}>
        <View style={s.head}>
          <View style={[s.num, { backgroundColor: c.ink }]}>
            <Text style={s.numText}>{n}</Text>
          </View>
          <Text style={[s.label, { color: c.ink }]}>{sec.label}</Text>
        </View>
        {sec.items?.map((i) => (
          <View key={i} style={s.row}>
            <Text style={[s.dot, { color: c.ink }]}>•</Text>
            <Line text={i} />
          </View>
        ))}
        {sec.formula && <Text style={[s.formula, { borderColor: c.line }]}>{sec.formula}</Text>}
        {sec.checklist?.map((i) => (
          <View key={i} style={s.row}>
            <View style={[s.box, { borderColor: c.ink }]} />
            <Line text={i} />
          </View>
        ))}
      </View>
    ),
  };
}

/** Two columns, each new block going to the shorter column, so the page fills evenly. */
function balance(blocks: Block[]): [Block[], Block[]] {
  const cols: [Block[], Block[]] = [[], []];
  const h = [0, 0];
  for (const b of blocks) {
    const i = h[0]! <= h[1]! ? 0 : 1;
    cols[i].push(b);
    h[i]! += b.weight;
  }
  return cols;
}

export function CheatSheetPdf({ sheet, glossary, heading }: { sheet: CheatSheet; glossary?: { term: string; definition: string }[]; heading: string }) {
  const blocks = sheet.sections.map((sec, i) => sectionBlock(sec, i + 1));
  if (glossary && glossary.length > 0) {
    const c = PALETTE[blocks.length % PALETTE.length]!;
    blocks.push({
      key: "glossary",
      weight: 2 + glossary.length * 2,
      node: (
        <View key="glossary" style={[s.card, { backgroundColor: c.tint, borderColor: c.line, borderLeftColor: c.ink }]} wrap={false}>
          <View style={s.head}>
            <View style={[s.num, { backgroundColor: c.ink }]}>
              <Text style={s.numText}>{blocks.length + 1}</Text>
            </View>
            <Text style={[s.label, { color: c.ink }]}>Glossary</Text>
          </View>
          {glossary.map((g) => (
            <Text key={g.term} style={{ marginBottom: 3.5 }}>
              <Text style={[s.term, { color: c.ink }]}>{g.term}</Text>
              {`  ${g.definition}`}
            </Text>
          ))}
        </View>
      ),
    });
  }
  const [left, right] = balance(blocks);
  return (
    <Document title={sheet.title} author="Zenith Studio" subject={heading}>
      <Page size="A4" style={s.page}>
        <View style={s.band} fixed={false}>
          {PALETTE.map((c) => (
            <View key={c.ink} style={{ flex: 1, backgroundColor: c.ink }} />
          ))}
        </View>
        <Text style={s.tag}>{heading}</Text>
        <Text style={s.title}>{sheet.title}</Text>
        <Text style={s.meta}>{`${sheet.sections.length} sections · keep it beside you while you build`}</Text>
        <View style={s.cols}>
          <View style={s.col}>{left.map((b) => b.node)}</View>
          <View style={s.col}>{right.map((b) => b.node)}</View>
        </View>
        <View style={s.footer} fixed>
          <Text>Zenith Studio · AI Engineering</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function cheatSheetPdf(sheet: CheatSheet, heading: string, glossary?: { term: string; definition: string }[]): Promise<Buffer> {
  return renderToBuffer(<CheatSheetPdf sheet={sheet} heading={heading} glossary={glossary} />);
}

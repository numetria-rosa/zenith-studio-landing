import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { inlineTokens, type CheatSheet } from "./cheatsheets";

/* Printable PDF of a cheat sheet. Light and built-in fonts on purpose: it is meant to be printed, and pure JS
   (no Chromium) so it runs in a serverless route, the same reasoning as src/lib/proposal-pdf.tsx. */

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1b1d24", lineHeight: 1.45 },
  tag: { fontSize: 9, letterSpacing: 1.4, color: "#3a7d63", textTransform: "uppercase", marginBottom: 6 },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 16 },
  card: { borderWidth: 1, borderColor: "#d5d8e0", borderRadius: 8, padding: 12, marginBottom: 10 },
  label: { fontSize: 8.5, letterSpacing: 1.2, textTransform: "uppercase", color: "#2b6a8f", marginBottom: 6 },
  row: { flexDirection: "row", marginBottom: 3 },
  dot: { width: 10, color: "#2b6a8f" },
  code: { fontFamily: "Courier", backgroundColor: "#eef0f4" },
  bold: { fontFamily: "Helvetica-Bold" },
  formula: { fontFamily: "Courier", fontSize: 9, backgroundColor: "#eef0f4", padding: 8, borderRadius: 4 },
  term: { fontFamily: "Courier", color: "#2b6a8f" },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 8, color: "#7d8392", textAlign: "center" },
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

export function CheatSheetPdf({ sheet, glossary, heading }: { sheet: CheatSheet; glossary?: { term: string; definition: string }[]; heading: string }) {
  return (
    <Document title={sheet.title} author="Zenith Studio">
      <Page size="A4" style={s.page}>
        <Text style={s.tag}>{heading}</Text>
        <Text style={s.title}>{sheet.title}</Text>
        {sheet.sections.map((sec) => (
          <View key={sec.label} style={s.card} wrap={false}>
            <Text style={s.label}>{sec.label}</Text>
            {sec.items?.map((i) => (
              <View key={i} style={s.row}>
                <Text style={s.dot}>-</Text>
                <Line text={i} />
              </View>
            ))}
            {sec.formula && <Text style={s.formula}>{sec.formula}</Text>}
            {sec.checklist?.map((c) => (
              <View key={c} style={s.row}>
                <Text style={s.dot}>[ ]</Text>
                <Line text={c} />
              </View>
            ))}
          </View>
        ))}
        {glossary && glossary.length > 0 && (
          <View style={s.card} wrap={false}>
            <Text style={s.label}>Glossary</Text>
            {glossary.map((g) => (
              <Text key={g.term} style={{ marginBottom: 3 }}>
                <Text style={s.term}>{g.term}</Text>
                {`  ${g.definition}`}
              </Text>
            ))}
          </View>
        )}
        <Text style={s.footer} fixed>
          Zenith Studio · AI Engineering
        </Text>
      </Page>
    </Document>
  );
}

export async function cheatSheetPdf(sheet: CheatSheet, heading: string, glossary?: { term: string; definition: string }[]): Promise<Buffer> {
  return renderToBuffer(<CheatSheetPdf sheet={sheet} heading={heading} glossary={glossary} />);
}

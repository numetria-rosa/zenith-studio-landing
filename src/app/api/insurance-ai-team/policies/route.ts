import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { importPolicies, listPolicies, type ImportPolicyInput } from "@/lib/insurance-renewals";

/** Expects header row: agencyName,clientName,phone,email,policyType,renewalDate
    (renewalDate as YYYY-MM-DD). No quoted-comma support - this is a test
    harness, not a general CSV importer. */
function parseCsv(csv: string): ImportPolicyInput[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim());
  const col = (name: string) => header.indexOf(name);
  const rows: ImportPolicyInput[] = [];

  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((c) => c.trim());
    const agencyName = cells[col("agencyName")];
    const clientName = cells[col("clientName")];
    const renewalDateRaw = cells[col("renewalDate")];
    if (!agencyName || !clientName || !renewalDateRaw) continue;
    const renewalDate = new Date(renewalDateRaw);
    if (Number.isNaN(renewalDate.getTime())) continue;

    rows.push({
      agencyName,
      clientName,
      phone: col("phone") >= 0 ? cells[col("phone")] : null,
      email: col("email") >= 0 ? cells[col("email")] : null,
      policyType: col("policyType") >= 0 ? cells[col("policyType")] : null,
      renewalDate,
    });
  }
  return rows;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return new Response("unauthorized", { status: 401 });
  const policies = await listPolicies();
  return Response.json({ policies });
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return new Response("unauthorized", { status: 401 });

  const body = (await request.json()) as { csv?: string };
  const rows = parseCsv(body.csv ?? "");
  if (rows.length === 0) {
    return Response.json({ ok: false, error: "no valid rows found - check the header row matches agencyName,clientName,phone,email,policyType,renewalDate" }, { status: 400 });
  }

  const result = await importPolicies(rows);
  return Response.json({ ok: true, ...result });
}

import Link from "next/link";
import { PACKAGE_TYPES, type PackageFields } from "@/lib/whatsapp-umrah/kb/structured";
import waStyles from "../waConsole.module.css";

const grid = (cols: string): React.CSSProperties => ({ display: "grid", gridTemplateColumns: cols, gap: 14 });
const section: React.CSSProperties = { fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--zc-done-text)", margin: "22px 0 10px" };
const hint: React.CSSProperties = { fontSize: 12, color: "var(--zc-muted)", marginTop: 4 };

function Field({ id, label, hintText, children }: { id: string; label: string; hintText?: string; children: React.ReactNode }) {
  return (
    <div className={waStyles.formRow} style={{ margin: 0 }}>
      <label className={waStyles.label} htmlFor={id}>
        {label}
      </label>
      {children}
      {hintText && <div style={hint}>{hintText}</div>}
    </div>
  );
}

/** One structured package. Every field is a labelled input so the AI gets the same facts in the same order every time. */
export function PackageForm({ action, values, cancelHref }: { action: (formData: FormData) => Promise<void>; values: PackageFields; cancelHref: string }) {
  const v = values;
  const n = (x: number | null | undefined) => (x === null || x === undefined || x === 0 ? "" : String(x));
  return (
    <form action={action} className={waStyles.card} style={{ marginBottom: 24 }}>
      <div style={{ ...section, marginTop: 0 }}>Package</div>
      <div style={grid("2fr 1fr")}>
        <Field id="name" label="Package name">
          <input id="name" name="name" className={waStyles.input} defaultValue={v.name} placeholder="e.g. Economy Umrah, 10 nights" required />
        </Field>
        <Field id="type" label="Type">
          <select id="type" name="type" className={waStyles.select} defaultValue={v.type}>
            {PACKAGE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>
      <div style={{ marginTop: 14 }}>
        <Field id="description" label="Description" hintText="One or two sentences the agent can use to describe this package.">
          <textarea id="description" name="description" className={waStyles.textarea} style={{ minHeight: 70 }} defaultValue={v.description} />
        </Field>
      </div>

      <div style={section}>Stay</div>
      <div style={grid("1fr 1fr")}>
        <Field id="nightsMakkah" label="Nights in Makkah">
          <input id="nightsMakkah" name="nightsMakkah" type="number" min={0} className={waStyles.input} defaultValue={n(v.nightsMakkah)} />
        </Field>
        <Field id="nightsMadinah" label="Nights in Madinah">
          <input id="nightsMadinah" name="nightsMadinah" type="number" min={0} className={waStyles.input} defaultValue={n(v.nightsMadinah)} />
        </Field>
      </div>
      <div style={{ ...grid("2fr 0.7fr 1fr"), marginTop: 14 }}>
        <Field id="makkahName" label="Makkah hotel">
          <input id="makkahName" name="makkahName" className={waStyles.input} defaultValue={v.makkahHotel.name} />
        </Field>
        <Field id="makkahStars" label="Stars">
          <select id="makkahStars" name="makkahStars" className={waStyles.select} defaultValue={n(v.makkahHotel.stars)}>
            <option value="">-</option>
            {[1, 2, 3, 4, 5].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field id="makkahDistance" label="Metres to the Haram">
          <input id="makkahDistance" name="makkahDistance" type="number" min={0} className={waStyles.input} defaultValue={n(v.makkahHotel.distanceMetres)} />
        </Field>
      </div>
      <div style={{ ...grid("2fr 0.7fr 1fr"), marginTop: 14 }}>
        <Field id="madinahName" label="Madinah hotel">
          <input id="madinahName" name="madinahName" className={waStyles.input} defaultValue={v.madinahHotel.name} />
        </Field>
        <Field id="madinahStars" label="Stars">
          <select id="madinahStars" name="madinahStars" className={waStyles.select} defaultValue={n(v.madinahHotel.stars)}>
            <option value="">-</option>
            {[1, 2, 3, 4, 5].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field id="madinahDistance" label="Metres to the Prophet's Mosque">
          <input id="madinahDistance" name="madinahDistance" type="number" min={0} className={waStyles.input} defaultValue={n(v.madinahHotel.distanceMetres)} />
        </Field>
      </div>

      <div style={section}>Price</div>
      <div style={grid("1fr 1.4fr 1fr")}>
        <Field id="pricePerPerson" label="Price per person (£)">
          <input id="pricePerPerson" name="pricePerPerson" inputMode="decimal" className={waStyles.input} defaultValue={n(v.pricePerPerson)} placeholder="1295" required />
        </Field>
        <Field id="priceBasis" label="Price basis" hintText="e.g. quad sharing, from, per adult">
          <input id="priceBasis" name="priceBasis" className={waStyles.input} defaultValue={v.priceBasis} />
        </Field>
        <Field id="deposit" label="Deposit per person (£)">
          <input id="deposit" name="deposit" inputMode="decimal" className={waStyles.input} defaultValue={n(v.deposit)} />
        </Field>
      </div>
      <div style={{ marginTop: 14 }}>
        <Field id="paymentTerms" label="Payment terms" hintText="e.g. balance due 8 weeks before departure.">
          <input id="paymentTerms" name="paymentTerms" className={waStyles.input} defaultValue={v.paymentTerms} />
        </Field>
      </div>

      <div style={section}>Travel</div>
      <div style={grid("1fr 1fr")}>
        <Field id="departureAirports" label="Departure airports" hintText="e.g. Birmingham, London Heathrow">
          <input id="departureAirports" name="departureAirports" className={waStyles.input} defaultValue={v.departureAirports} />
        </Field>
        <Field id="airline" label="Airline and flights" hintText="e.g. Saudia direct, return included">
          <input id="airline" name="airline" className={waStyles.input} defaultValue={v.airline} />
        </Field>
      </div>
      <div style={{ ...grid("1.6fr 1fr"), marginTop: 14 }}>
        <Field id="travelDates" label="Travel dates" hintText="Exact dates or the season, e.g. departs 14 Feb and 21 Feb 2027.">
          <input id="travelDates" name="travelDates" className={waStyles.input} defaultValue={v.travelDates} />
        </Field>
        <Field id="availability" label="Availability" hintText="e.g. 12 seats left, sold out">
          <input id="availability" name="availability" className={waStyles.input} defaultValue={v.availability} />
        </Field>
      </div>

      <div style={section}>What is included</div>
      <div style={grid("1fr 1fr")}>
        <Field id="included" label="Included" hintText="One item per line.">
          <textarea id="included" name="included" className={waStyles.textarea} style={{ minHeight: 110 }} defaultValue={v.included.join("\n")} placeholder={"Return flights\nVisa\nAirport transfers\nBreakfast"} />
        </Field>
        <Field id="excluded" label="Not included" hintText="One item per line.">
          <textarea id="excluded" name="excluded" className={waStyles.textarea} style={{ minHeight: 110 }} defaultValue={v.excluded.join("\n")} placeholder={"Lunch and dinner\nZiyarat tours"} />
        </Field>
      </div>
      <div style={{ marginTop: 14 }}>
        <Field id="notes" label="Anything else" hintText="Cancellation or child pricing notes the agent may repeat.">
          <textarea id="notes" name="notes" className={waStyles.textarea} style={{ minHeight: 70 }} defaultValue={v.notes} />
        </Field>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 22, alignItems: "center" }}>
        <button type="submit" className={waStyles.badgeAi} style={{ padding: "9px 18px", fontSize: 14, border: "1px solid var(--zc-done)" }}>
          Save package
        </button>
        <Link href={cancelHref} style={{ fontSize: 14, color: "var(--zc-muted)" }}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

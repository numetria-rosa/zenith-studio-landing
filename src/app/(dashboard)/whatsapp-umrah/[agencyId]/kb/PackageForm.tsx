import { PACKAGE_TYPES, type PackageFields } from "@/lib/whatsapp-umrah/kb/structured";
import { Card, FieldLabel, GlassButton, Hint, Input, Label, PrimaryButton, Select, Textarea } from "@/components/wa/ui";

function Field({ id, label, hintText, children }: { id: string; label: string; hintText?: string; children: React.ReactNode }) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
      {hintText && <Hint className="mt-[6px]">{hintText}</Hint>}
    </div>
  );
}

const Section = ({ children }: { children: React.ReactNode }) => <Label className="mb-[10px] mt-[22px] block text-mint-text first:mt-0">{children}</Label>;
const grid = (cols: string) => ({ display: "grid", gridTemplateColumns: cols, gap: 14 }) as const;

/** One structured package. Every field is a labelled input so the AI gets the same facts in the same order every time. */
export function PackageForm({ action, values, cancelHref }: { action: (formData: FormData) => Promise<void>; values: PackageFields; cancelHref: string }) {
  const v = values;
  const n = (x: number | null | undefined) => (x === null || x === undefined || x === 0 ? "" : String(x));
  return (
    <Card className="mb-[18px] p-6">
      <form action={action}>
        <Section>Package</Section>
        <div style={grid("minmax(0,2fr) minmax(0,1fr)")}>
          <Field id="name" label="Package name">
            <Input id="name" name="name" defaultValue={v.name} placeholder="e.g. Economy Umrah, 10 nights" required />
          </Field>
          <Field id="type" label="Type">
            <Select id="type" name="type" defaultValue={v.type}>
              {PACKAGE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-[14px]">
          <Field id="description" label="Description" hintText="One or two sentences the agent can use to describe this package.">
            <Textarea id="description" name="description" rows={3} defaultValue={v.description} />
          </Field>
        </div>

        <Section>Stay</Section>
        <div style={grid("1fr 1fr")}>
          <Field id="nightsMakkah" label="Nights in Makkah">
            <Input id="nightsMakkah" name="nightsMakkah" type="number" min={0} defaultValue={n(v.nightsMakkah)} />
          </Field>
          <Field id="nightsMadinah" label="Nights in Madinah">
            <Input id="nightsMadinah" name="nightsMadinah" type="number" min={0} defaultValue={n(v.nightsMadinah)} />
          </Field>
        </div>
        {(["makkah", "madinah"] as const).map((city) => {
          const h = city === "makkah" ? v.makkahHotel : v.madinahHotel;
          const label = city === "makkah" ? "Makkah" : "Madinah";
          return (
            <div key={city} className="mt-[14px]" style={grid("minmax(0,2fr) minmax(0,.7fr) minmax(0,1fr)")}>
              <Field id={`${city}Name`} label={`${label} hotel`}>
                <Input id={`${city}Name`} name={`${city}Name`} defaultValue={h.name} />
              </Field>
              <Field id={`${city}Stars`} label="Stars">
                <Select id={`${city}Stars`} name={`${city}Stars`} defaultValue={n(h.stars)}>
                  <option value="">-</option>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </Field>
              <Field id={`${city}Distance`} label={city === "makkah" ? "Metres to the Haram" : "Metres to the Prophet's Mosque"}>
                <Input id={`${city}Distance`} name={`${city}Distance`} type="number" min={0} defaultValue={n(h.distanceMetres)} />
              </Field>
            </div>
          );
        })}

        <Section>Price</Section>
        <div style={grid("1fr 1.4fr 1fr")}>
          <Field id="pricePerPerson" label="Price per person (£)">
            <Input id="pricePerPerson" name="pricePerPerson" inputMode="decimal" defaultValue={n(v.pricePerPerson)} placeholder="1295" required />
          </Field>
          <Field id="priceBasis" label="Price basis" hintText="e.g. quad sharing, from, per adult">
            <Input id="priceBasis" name="priceBasis" defaultValue={v.priceBasis} />
          </Field>
          <Field id="deposit" label="Deposit per person (£)">
            <Input id="deposit" name="deposit" inputMode="decimal" defaultValue={n(v.deposit)} />
          </Field>
        </div>
        <div className="mt-[14px]">
          <Field id="paymentTerms" label="Payment terms" hintText="e.g. balance due 8 weeks before departure.">
            <Input id="paymentTerms" name="paymentTerms" defaultValue={v.paymentTerms} />
          </Field>
        </div>

        <Section>Travel</Section>
        <div style={grid("1fr 1fr")}>
          <Field id="departureAirports" label="Departure airports" hintText="e.g. Birmingham, London Heathrow">
            <Input id="departureAirports" name="departureAirports" defaultValue={v.departureAirports} />
          </Field>
          <Field id="airline" label="Airline and flights" hintText="e.g. Saudia direct, return included">
            <Input id="airline" name="airline" defaultValue={v.airline} />
          </Field>
        </div>
        <div className="mt-[14px]" style={grid("1.6fr 1fr")}>
          <Field id="travelDates" label="Travel dates" hintText="Exact dates or the season, e.g. departs 14 Feb and 21 Feb 2027.">
            <Input id="travelDates" name="travelDates" defaultValue={v.travelDates} />
          </Field>
          <Field id="availability" label="Availability" hintText="e.g. 12 seats left, sold out">
            <Input id="availability" name="availability" defaultValue={v.availability} />
          </Field>
        </div>

        <Section>What is included</Section>
        <div style={grid("1fr 1fr")}>
          <Field id="included" label="Included" hintText="One item per line.">
            <Textarea id="included" name="included" rows={5} defaultValue={v.included.join("\n")} placeholder={"Return flights\nVisa\nAirport transfers\nBreakfast"} />
          </Field>
          <Field id="excluded" label="Not included" hintText="One item per line.">
            <Textarea id="excluded" name="excluded" rows={5} defaultValue={v.excluded.join("\n")} placeholder={"Lunch and dinner\nZiyarat tours"} />
          </Field>
        </div>
        <div className="mt-[14px]">
          <Field id="notes" label="Anything else" hintText="Cancellation or child pricing notes the agent may repeat.">
            <Textarea id="notes" name="notes" rows={3} defaultValue={v.notes} />
          </Field>
        </div>

        <div className="mt-[22px] flex items-center gap-3">
          <PrimaryButton type="submit">Save package</PrimaryButton>
          <GlassButton href={cancelHref}>Cancel</GlassButton>
        </div>
      </form>
    </Card>
  );
}

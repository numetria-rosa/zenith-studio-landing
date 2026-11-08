// Builds the per-country versions of the WhatsApp Umrah agent demo page from the UK page
// (public/demos/uk/whatsapp-umrah-agent.html): local currency for the plan price and every amount in the sample chats,
// local departure cities, and the country's name in the headings. Output: public/demos/<cc>/whatsapp-umrah-agent.html.
// Re-run after editing the UK page. The routes are registered in src/app/demo/[slug]/[serviceName]/route.ts.
//
// Plan prices (PRICE) are set so each plan stays at or above about 45 pounds at a strong-pound exchange rate, which is
// the floor where the Starter AI budget in src/lib/whatsapp-umrah/economics.ts still leaves the 80% margin. Raise them
// if the pound weakens against the local currency. The conversion rates below are only for the sample-chat amounts.
//
// Usage: node scripts/build-umrah-country-demos.mjs

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const SRC = "public/demos/uk/whatsapp-umrah-agent.html";

const COUNTRIES = {
  us: { name: "US", symbol: "$", code: "USD", words: "US dollars", price: 64, rate: 1.35, tld: "com", unit: "/ month", cities: ["New York", "Chicago", "Houston", "Detroit", "Dallas"] },
  ca: { name: "Canadian", symbol: "$", code: "CAD", words: "Canadian dollars", price: 89, rate: 1.85, tld: "ca", unit: "CAD / month", cities: ["Toronto", "Montreal", "Mississauga", "Calgary", "Ottawa"] },
  au: { name: "Australian", symbol: "$", code: "AUD", words: "Australian dollars", price: 99, rate: 2.0, tld: "com.au", unit: "AUD / month", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"] },
  za: { name: "South African", symbol: "R", code: "ZAR", words: "rand", price: 1049, rate: 22, tld: "co.za", unit: "/ month", cities: ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth"] },
};

// UK sample cities in the page, mapped by position to the country's cities.
const UK_CITIES = ["Manchester", "London", "Birmingham", "Bradford", "Leicester"];

const nice = (n) => (n < 1000 ? Math.round(n / 5) * 5 : n < 5000 ? Math.round(n / 25) * 25 : Math.round(n / 100) * 100);
const fmt = (n) => n.toLocaleString("en-US");

function must(html, from, to, label) {
  if (!html.includes(from)) throw new Error(`UK page no longer contains "${label ?? from}"; update the generator`);
  return html.split(from).join(to);
}

const uk = readFileSync(SRC, "utf8");
for (const [cc, c] of Object.entries(COUNTRIES)) {
  let h = uk;
  const price = `${c.symbol}${fmt(c.price)}`;
  h = must(h, "WhatsApp AI Agent for UK Travel Agencies", `WhatsApp AI Agent for ${c.name} Travel Agencies`);
  h = must(h, "For UK Umrah &amp; Hajj agencies", `For ${c.name} Umrah &amp; Hajj agencies`);
  h = must(h, "Priced in pounds. Pay by card.", `Priced in ${c.words}. Pay by card.`);
  h = must(h, "Priced in GBP,", `Priced in ${c.code},`);
  h = must(h, "priced in GBP, paid by card", `priced in ${c.code}, paid by card`);
  h = must(h, "you@agency.co.uk", `you@agency.${c.tld}`);
  h = must(h, "all UK airports", "all major airports");
  h = must(h, "£[Price]", price);
  // The plan price: the pricing card, the FAQ and the dashboard sample all say £49.
  h = must(h, '<div class="amt"><b>£49</b><span>/ month</span></div>', `<div class="amt"><b>${price}</b><span>${c.unit}</span></div>`);
  h = must(h, "£49", price);
  // The UK checkout takes pounds. Until this country has its own Whop checkout, the buttons email us instead.
  const subject = encodeURIComponent(`WhatsApp AI Agent for ${c.name} agencies`);
  h = must(h, "https://whop.com/checkout/ch_M5XKy2oxQQkoO28/", `mailto:hello@zenith-studio.site?subject=${subject}`);
  h = must(h, "var START_URL = 'mailto:hello@zenith-studio.site?subject=" + subject + "';", "var START_URL = '';", "START_URL");
  // Sample cities (through placeholders so a new city name can never be replaced again).
  UK_CITIES.forEach((city, i) => (h = h.replace(new RegExp(`\\b${city}\\b`, "g"), `@@CITY${i}@@`)));
  UK_CITIES.forEach((_, i) => (h = h.split(`@@CITY${i}@@`).join(c.cities[i])));
  h = must(h, "<u>£</u>", `<u>${c.symbol}</u>`, "<u>£</u>");
  // Every remaining pound amount in the sample chats, dashboard and packages.
  h = h.replace(/£(\d[\d,]*)/g, (_, n) => `${c.symbol}${fmt(nice(Number(n.replace(/,/g, "")) * c.rate))}`);
  if (/£|\bUK\b|GBP|pounds/.test(h.replace(/[^\n]*(?:UK_CITIES)[^\n]*/g, ""))) {
    const left = h.match(/.{0,40}(£|\bUK\b|GBP|pounds).{0,40}/g)?.slice(0, 3);
    throw new Error(`${cc}: UK text left over: ${JSON.stringify(left)}`);
  }
  mkdirSync(`public/demos/${cc}`, { recursive: true });
  writeFileSync(`public/demos/${cc}/whatsapp-umrah-agent.html`, h);
  console.log(`${cc}: ${c.symbol}${fmt(c.price)} ${c.code} -> public/demos/${cc}/whatsapp-umrah-agent.html (${h.length} bytes)`);
}

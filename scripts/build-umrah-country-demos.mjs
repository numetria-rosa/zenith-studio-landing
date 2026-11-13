// Builds the per-country versions of the WhatsApp Umrah agent demo page from the UK page
// (public/demos/uk/whatsapp-umrah-agent.html): local currency for the plan price and every amount in the sample chats,
// local departure cities, and the country's name in the headings. Output: public/demos/<cc>/whatsapp-umrah-agent.html.
// Re-run after editing the UK page. The routes are registered in src/app/demo/[slug]/[serviceName]/route.ts.
//
// Plan prices are the owner's decision (2026-11-08): US $52, Canada C$83, Australia A$85, South Africa R900. In pounds
// those are below the 49 the Starter AI budget in src/lib/whatsapp-umrah/economics.ts was sized for, so economics.ts
// sizes each currency's budget from its own price (STARTER_PRICE_GBP_EQUIV). The conversion rates below are only for
// the amounts in the sample chats.
//
// Usage: node scripts/build-umrah-country-demos.mjs

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { FR } from "./umrah-demo-fr.mjs";

const SRC = "public/demos/uk/whatsapp-umrah-agent.html";

const COUNTRIES = {
  us: { checkout: "https://whop.com/checkout/ch_3yCnqoK4wsfnVkJ/", name: "US", symbol: "$", code: "USD", words: "US dollars", price: 52, pack: "$9", rate: 1.35, tld: "com", unit: "/ month", cities: ["New York", "Chicago", "Houston", "Detroit", "Dallas"] },
  ca: { checkout: "https://whop.com/checkout/ch_5gz3oRodm3dR7lb/", name: "Canadian", symbol: "$", code: "CAD", words: "Canadian dollars", price: 83, pack: "$12 CAD", rate: 1.85, tld: "ca", unit: "CAD / month", cities: ["Toronto", "Montreal", "Mississauga", "Calgary", "Ottawa"] },
  au: { checkout: "https://whop.com/checkout/ch_3EmEku0gszYMzjv/", name: "Australian", symbol: "$", code: "AUD", words: "Australian dollars", price: 85, pack: "$13 AUD", rate: 2.0, tld: "com.au", unit: "AUD / month", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"] },
  za: { checkout: "https://whop.com/checkout/ch_Li6eHzPXGuRRKpT/", name: "South African", symbol: "R", code: "ZAR", words: "rand", price: 900, pack: "R140", rate: 22, tld: "co.za", unit: "/ month", cities: ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth"] },
  fr: { checkout: "https://whop.com/checkout/ch_6TXEjCU7jRskGZY/", name: "French", symbol: "€", code: "EUR", words: "euros", price: 45, pack: "€8", rate: 1.15, tld: "fr", unit: "/ month", cities: ["Lyon", "Paris", "Marseille", "Lille", "Toulouse"] },
};

// UK sample cities in the page, mapped by position to the country's cities.
const UK_CITIES = ["Manchester", "London", "Birmingham", "Bradford", "Leicester"];

const nice = (n) => (n < 1000 ? Math.round(n / 5) * 5 : n < 5000 ? Math.round(n / 25) * 25 : Math.round(n / 100) * 100);
const fmt = (n) => n.toLocaleString("en-US");

function must(html, from, to, label) {
  if (!html.includes(from)) throw new Error(`UK page no longer contains "${label ?? from}"; update the generator`);
  return html.split(from).join(to);
}


// France: the page is built in English first (euro amounts, French cities), then every string is replaced with its
// French version from umrah-demo-fr.mjs. Page text and attributes are matched on the HTML outside scripts; inside the
// scripts every string literal is read left to right (so an apostrophe in a double-quoted string can't confuse it) and
// replaced when it matches. Anything left in English is listed so it can be added to the dictionary.
const escapeJs = (v, q) => v.split("\\").join("\\\\").split(q).join("\\" + q);
function translateFr(html) {
  const left = new Set();
  const parts = html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/g);
  const out = parts.map((part, i) => {
    if (i % 2 === 0) {
      return part
        .replace(/>([^<>]*[A-Za-z][^<>]*)</g, (m, t) => {
          const key = t.replace(/\s+/g, " ").trim();
          if (!key) return m;
          if (FR[key]) return ">" + t.match(/^\s*/)[0] + FR[key] + t.match(/\s*$/)[0] + "<";
          if (!/^[A-Z]{1,3}$|^[\d\s.,:/%+·&;€$-]+$|^&nbsp;$|^[A-Z]{2,12}$|^Zenith Studio$|^© /.test(key)) left.add(key);
          return m;
        })
        .replace(/\b(aria-label|title|placeholder|alt|content)="([^"]*)"/g, (m, a, v) => (FR[v] ? `${a}="${FR[v]}"` : m));
    }
    if (part.startsWith("<style")) return part;
    return part.replace(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'/g, (m, d, sq) => {
      const v = d ?? sq;
      const q = d !== undefined ? '"' : "'";
      if (FR[v]) return q + escapeJs(FR[v], q) + q;
      if (!/[<>]/.test(v) && !/\b(placeholder|title|aria-label|alt)=/.test(v)) return m;
      // A piece of HTML the dashboard app builds in script: translate the text between its tags and its placeholder/title attributes.
      const piece = v
        .replace(/(^|>)([^<>]+)(?=<|$)/g, (mm, lead, t) => {
          const key = t.replace(/\s+/g, " ").trim();
          if (!key) return mm;
          if (FR[key]) return lead + t.match(/^\s*/)[0] + escapeJs(FR[key], q) + t.match(/\s*$/)[0];
          if (/[A-Za-z]{3}/.test(key) && !/[{}();=\[\]"]/.test(key) && !/^[A-Z]{1,3}$|^&nbsp;$|^[A-Z]{2,12}$/.test(key)) left.add("script piece: " + key);
          return mm;
        })
        .replace(/\b(placeholder|title|aria-label|alt)=(\\?")([^"\\]*)/g, (mm, a, qq, val) => (FR[val] ? `${a}=${qq}${escapeJs(FR[val], q)}` : mm));
      return q + piece + q;
    });
  });
  let h = out.join("").replace(/<html lang="en">/g, '<html lang="fr">');
  h = h.split("+44 7700 900123").join("+33 6 12 34 56 78"); // the dashboard sample's WhatsApp number
  // 1,725 euros the French way: "1 725 €" (narrow no-break space between the thousands, no-break space before the sign).
  h = h.replace(/€(\d[\d,]*)/g, (_, n) => n.replace(/,/g, " ") + " €");
  return { html: h, left: [...left] };
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
  // Each country has its own Whop plan in local currency (scripts/create-whatsapp-umrah-country-plans.mjs) and a checkout
  // link that redirects to /api/auth/claim after purchase (scripts/add-whatsapp-umrah-checkout-redirects.mjs).
  h = must(h, "https://whop.com/checkout/ch_M5XKy2oxQQkoO28/", c.checkout);
  // Sample cities (through placeholders so a new city name can never be replaced again).
  UK_CITIES.forEach((city, i) => (h = h.replace(new RegExp(`\\b${city}\\b`, "g"), `@@CITY${i}@@`)));
  UK_CITIES.forEach((_, i) => (h = h.split(`@@CITY${i}@@`).join(c.cities[i])));
  // The extra-replies pack has its own local price (economics.ts EXTRA_PACK_PRICE_LOCAL), not a converted one.
  h = must(h, "Add 500 more replies for £6", `Add 500 more replies for ${c.pack}`);
  h = must(h, "add 500 replies at a time for £6", `add 500 replies at a time for ${c.pack}`);
  h = must(h, "<u>£</u>", `<u>${c.symbol}</u>`, "<u>£</u>");
  // Every remaining pound amount in the sample chats, dashboard and packages.
  h = h.replace(/£(\d[\d,]*)/g, (_, n) => `${c.symbol}${fmt(nice(Number(n.replace(/,/g, "")) * c.rate))}`);
  if (/£|\bUK\b|GBP|pounds/.test(h.replace(/[^\n]*(?:UK_CITIES)[^\n]*/g, ""))) {
    const left = h.match(/.{0,40}(£|\bUK\b|GBP|pounds).{0,40}/g)?.slice(0, 3);
    throw new Error(`${cc}: UK text left over: ${JSON.stringify(left)}`);
  }
  if (cc === "fr") {
    const t = translateFr(h);
    h = t.html;
    if (t.left.length) console.log(`fr: ${t.left.length} strings still in English:\n  ` + t.left.join("\n  "));
  }
  mkdirSync(`public/demos/${cc}`, { recursive: true });
  writeFileSync(`public/demos/${cc}/whatsapp-umrah-agent.html`, h);
  console.log(`${cc}: ${c.symbol}${fmt(c.price)} ${c.code} -> public/demos/${cc}/whatsapp-umrah-agent.html (${h.length} bytes)`);
}

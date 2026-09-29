// End-to-end check of the Final module screens against the test server (port 3100, local test database).
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const B = `${base}/lab/ai-engineering/learn/final`;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const check = (cond, msg) => { console.log(cond ? "ok  " : "FAIL", msg); if (!cond) process.exitCode = 1; };
const shot = (name) => page.screenshot({ path: `tests/visual/out/final-${name}.png`, fullPage: true });

for (const p of ["agents", "clients", "revenue", "outreach", "sell-plan", "agents/support-agent", "agents/whatsapp-lead-agent", "agents/inbox-manager", "agents/booking-agent", "agents/document-extractor"]) {
  const res = await page.goto(`${B}/${p}`, { waitUntil: "networkidle", timeout: 120000 });
  check(res.status() === 200, `${p} -> ${res.status()}`);
  await shot(p.replace("/", "-"));
}

// sidebar dropdown
await page.goto(`${B}/agents`, { waitUntil: "networkidle" });
const toggle = page.getByRole("button", { name: "Final module" });
check((await toggle.getAttribute("aria-expanded")) === "true", "Final module dropdown is open on its own pages");
check((await page.getByRole("navigation", { name: "Final module" }).getByRole("link", { name: "Agents" }).getAttribute("aria-current")) === "page", "Agents is the active sub-item");
await toggle.click();
check((await toggle.getAttribute("aria-expanded")) === "false", "dropdown closes");

// agent detail: kit browser
await page.goto(`${B}/agents/support-agent`, { waitUntil: "networkidle" });
check(await page.getByText("kit/agents/support_agent/agent.py").first().isVisible(), "kit browser shows the agent file");
await page.getByRole("button", { name: "core/" }).click();
await page.getByRole("button", { name: "guardrails.py" }).click();
check(await page.getByText("def ungrounded_numbers").first().isVisible(), "switching file shows its code");

// clients CRUD against the real (local test) database
await page.goto(`${B}/clients`, { waitUntil: "networkidle" });
await page.getByLabel("Client name").fill("Smoke Test Dental");
await page.getByLabel("Agent").selectOption("booking-agent");
await page.getByLabel("Status").selectOption("live");
await page.locator("#c-niche").selectOption({ label: "Dental, chiropractic and physiotherapy clinics" });
await page.locator("#c-city").selectOption("Columbus, OH");
await page.locator("#c-setup").fill("400");
await page.locator("#c-monthly").fill("175");
await page.getByRole("button", { name: "Add client" }).click();
await page.getByText("Smoke Test Dental").first().waitFor({ timeout: 15000 }).catch(() => {});
check(await page.getByText("Smoke Test Dental").first().isVisible(), "client was saved and listed");
check(await page.getByText("$175/mo").first().isVisible(), "fee shows in dollars");
await shot("clients-after-add");
await page.goto(`${B}/revenue`, { waitUntil: "networkidle" });
check(await page.getByText("Booking Agent (1 live)").isVisible(), "revenue page counts the live client");
await page.goto(`${B}/agents`, { waitUntil: "networkidle" });
check(await page.getByText("Live for a client").first().isVisible(), "agents page marks the agent as live");
await page.goto(`${B}/clients`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Delete Smoke Test Dental" }).click();
await page.getByText("Smoke Test Dental").first().waitFor({ state: "detached", timeout: 15000 }).catch(() => {});
check((await page.getByText("Smoke Test Dental").count()) === 0, "client deleted");

// validation error is shown
await page.getByLabel("Client name").fill("Bad");
await page.getByRole("button", { name: "Add client" }).click();
check(await page.getByRole("alert").isVisible(), "invalid form shows an error");

// sell plan persists
await page.goto(`${B}/sell-plan`, { waitUntil: "networkidle" });
await page.getByRole("checkbox", { name: /Choose your first agent/ }).click();
await page.getByRole("checkbox", { name: /Mark not done: Choose your first agent/ }).waitFor({ timeout: 15000 }).catch(() => {});
await page.reload({ waitUntil: "networkidle" });
check((await page.getByRole("checkbox", { name: /Choose your first agent/ }).getAttribute("aria-checked")) === "true", "sell-plan step persisted");
check(await page.getByText("1 of 12 steps done").isVisible(), "progress updated");
await page.getByRole("checkbox", { name: /Choose your first agent/ }).click();
await page.getByRole("checkbox", { name: /Mark done: Choose your first agent/ }).waitFor({ timeout: 15000 }).catch(() => {});

// outreach template
await page.goto(`${B}/outreach?agent=booking-agent`, { waitUntil: "networkidle" });
check((await page.locator("#o-agent").inputValue()) === "booking-agent", "agent preselected from the link");
await page.locator("#o-first_name").fill("Sam");
await page.locator("#o-business").fill("Sunrise Dental");
await page.locator("#o-address").fill("1 Main St, Columbus, OH 43215");
check(await page.getByText("Hi Sam,").first().isVisible(), "template fills the name");
check((await page.getByText("Your postal address is in the email").locator("..").innerText()).includes("done"), "address check turns green");

// kit download
const [dl] = await Promise.all([page.waitForEvent("download"), page.goto(`${B}/agents`).then(() => page.getByRole("link", { name: /Download the code kit/ }).click())]);
const zipPath = "tests/visual/out/kit.zip";
await dl.saveAs(zipPath);
const py = "import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;n=z.namelist();print(len(n),'zenith-agent-kit/README.md' in n,'zenith-agent-kit/core/llm.py' in n,any('__pycache__' in x or x.endswith('/.env') for x in n))";
console.log("zip:", execFileSync("python", ["-c", py, zipPath], { encoding: "utf8" }).trim());

check(errors.length === 0, `no console errors ${errors.slice(0, 3).join(" | ")}`);
await browser.close();

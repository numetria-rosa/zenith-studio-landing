// Module 8: the capstone (graded server-side) and the tabs, on the real-content dev server.
// Needs a fresh capstone row: delete from "AieCapstone" in the aie_test database before re-running.
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const B = `${base}/lab/ai-engineering/learn/modules/8`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
let failed = 0;
const check = (cond, msg) => { if (!cond) { failed++; console.log("FAIL", msg); } else console.log("ok  ", msg); };
const go = (p) => page.goto(`${B}${p}`, { waitUntil: "networkidle", timeout: 120000 });
const seen = (t) => page.getByText(t, { exact: false }).first().isVisible().catch(() => false);

await go("");
const tabs = await page.getByRole("navigation", { name: "Module sections" }).getByRole("link").allInnerTexts();
check(tabs.join(",") === "Overview,Lessons,Project", `tabs are Overview, Lessons, Project (${tabs.join(",")})`);
for (const l of ["8.1", "8.2"]) check((await go(`/lessons/${l}`)).status() === 200, `lesson ${l} renders`);
check(await seen("MODULE 7"), "8.2 shows the recap cards");

await go("/project");
check(await seen("Client brief: Meridian Cloud"), "brief renders");

const design = {
  structured: "We validate every model response against a schema, and repair it first by stripping fences and trailing commas before we parse it again, and if it still fails we raise an error.",
  context: "The token budget is 6000 tokens: we keep chunks with overlap under the context window and truncate the least relevant first, always leaving room for output.",
  retrieval: "We embed the query, rank by cosine similarity, take top-k with k=3, and apply a 0.4 threshold so nothing relevant means we say so honestly.",
  tools: "Every ticket call carries a stable call id, and a cached result is returned on a retry so a duplicate ticket is never filed twice for the same request.",
  agent: "The loop has a step limit of 6 and detects stuck repeat actions, and it terminates on success or when the bound is hit, so it stops cleanly.",
  reliability: "The model call does retries with exponential backoff and jitter, 3 attempts, then one fallback model if the primary is still failing after that.",
  eval: "We keep a labeled eval set including unanswerable test cases, record a baseline, and compare against it before shipping to catch any regression at all.",
};
await page.getByRole("button", { name: "Check my design document" }).click();
await page.getByText("Not written yet").first().waitFor();
check(await page.getByText("0%").first().isVisible(), "empty design scores 0%");
for (const [id, v] of Object.entries(design)) await page.locator(`#df-${id}`).fill(v);
await page.getByRole("button", { name: "Check my design document" }).click();
await page.getByText("Looks complete").first().waitFor({ timeout: 15000 });
await page.waitForFunction(() => document.body.innerText.split("Looks complete").length - 1 === 7, null, { timeout: 15000 }).catch(() => {});
check((await page.getByText("Looks complete").count()) === 7, "all seven design fields look complete");
await page.locator("#df-retrieval").fill("We use retrieval and rank things somehow, without any actual figures in it but with enough words to pass the length check here.");
await page.getByRole("button", { name: "Check my design document" }).click();
await page.getByText(/Too brief|Only touches|no concrete number/).first().waitFor({ timeout: 15000 });
check(true, "a vague retrieval section is flagged with a reason");
await page.locator("#df-retrieval").fill(design.retrieval);
await page.getByRole("button", { name: "Check my design document" }).click();
await page.getByText("Looks complete").nth(6).waitFor();

// part 2
const solution = `async def handle_support_request(input, kb, ticket_tool, seen):
    def cos(a, b):
        na = sum(x*x for x in a) ** 0.5
        nb = sum(x*x for x in b) ** 0.5
        return 0 if na == 0 or nb == 0 else sum(x*y for x, y in zip(a, b)) / (na * nb)
    best = max(kb, key=lambda d: cos(input["queryVector"], d["vector"]))
    if cos(input["queryVector"], best["vector"]) < 0.4:
        return {"ok": True, "source": "none", "reason": "no relevant KB match"}
    if input["callId"] in seen:
        return seen[input["callId"]]
    try:
        ticket = await ticket_tool(input["ticketArgs"])
    except Exception as e:
        return {"ok": False, "source": "kb", "docId": best["id"], "error": str(e)}
    seen[input["callId"]] = {"ok": True, "source": "kb", "docId": best["id"], "ticket": ticket}
    return seen[input["callId"]]
`;
await page.getByLabel(/Python code, handle_support_request/).fill(solution);
await page.getByRole("button", { name: "Run tests" }).click();
await page.getByText("6 / 6 tests passing").waitFor({ timeout: 120000 });
check(true, "part 2: reference implementation passes 6/6");
await page.getByText("Implementation score").locator("..").getByText("100%").waitFor({ timeout: 15000 });
check(true, "part 2: implementation score 100% (saved server-side)");

// part 3
await page.getByRole("button", { name: /^Module 4: the retry function/ }).click();
check(await seen("Not quite."), "part 3: wrong option explained");
await page.getByRole("button", { name: /Retry this question/ }).click();
await page.getByRole("button", { name: /^Module 6: the retry has no backoff/ }).click();
check(await seen("Correct. Every retry attempt fires immediately"), "part 3: correct option explained");
await page.locator("#debug-answer").fill("It retries instantly in a tight loop, so I would add exponential backoff with jitter before each retry.");
await page.getByRole("button", { name: "Check my answer" }).click();
await page.getByText("Good, that's the fix").waitFor({ timeout: 15000 });
check(true, "part 3: diagnosis accepted");

// part 4
await page.getByText("Capstone complete").first().waitFor({ timeout: 15000 });
check(await page.getByRole("link", { name: /Complete the course/ }).isVisible(), "part 4: 100% completes the capstone");
await page.screenshot({ path: "tests/visual/out/capstone-final.png", fullPage: true });

// review + persistence
await page.locator("#review1").fill("It raises and logs the raw output.");
await page.waitForTimeout(1500);
await go("/project");
check((await page.locator("#df-retrieval").inputValue()) === design.retrieval, "reload keeps the design text");
check((await page.locator("#review1").inputValue()).startsWith("It raises"), "reload keeps the design review");
check(await page.getByText("Capstone complete").first().isVisible(), "reload keeps the completed score");
check(await seen("Portfolio project"), "portfolio project 8 follows the capstone");

check(errors.length === 0, `no console errors ${errors.slice(0, 3).join(" | ")}`);
await browser.close();
process.exit(failed ? 1 : 0);

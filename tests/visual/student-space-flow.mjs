// Functional check of the student space against a throwaway database (see student-space.mjs for setup).
// Session tokens: `testtoken123` (Ada, owns courses) and `deletetoken` (a user with no data, deleted by the test).
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const psql = (sql) => execFileSync("psql", ["-h", "127.0.0.1", "-p", "54329", "-U", "postgres", "-d", "aie_test", "-tAc", sql]).toString().trim();
const ok = (cond, msg) => { if (!cond) { console.error("FAIL", msg); process.exitCode = 1; } else console.log("ok  ", msg); };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
async function as(token) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1300 } });
  await ctx.addCookies([{ name: "authjs.session-token", value: token, url: base }]);
  return ctx.newPage();
}

// Signed-out visitors are sent to sign-in.
const anon = await (await browser.newContext()).newPage();
await anon.goto(`${base}/account`, { waitUntil: "networkidle" });
ok(anon.url().includes("/sign-in"), "signed-out visit to /account redirects to sign-in");

const page = await as("testtoken123");
await page.goto(`${base}/account/profile`, { waitUntil: "networkidle" });

await page.fill("#p-display", "Ada L.");
await page.fill("#p-gh", "github.com/ada");
await page.getByRole("button", { name: "Save changes" }).click();
await page.getByText("Saved.").waitFor();
ok(psql(`select "displayName"||'|'||"githubUrl" from "User" where id='u1'`) === "Ada L.|https://github.com/ada", "profile save persists (URL normalised)");

await page.fill("#p-gh", "javascript:alert(1)");
await page.getByRole("button", { name: "Save changes" }).click();
await page.getByText(/GitHub must be a valid link/).waitFor();
ok(true, "invalid GitHub URL is rejected with a message");

const offers = page.getByRole("button", { name: "New courses and offers" });
await offers.click();
await page.waitForTimeout(800);
ok(psql(`select "notifyOffers" from "User" where id='u1'`) === "t", "notification toggle persists");
ok((await offers.getAttribute("aria-pressed")) === "true", "toggle exposes aria-pressed");

// Sign-in password (ported from the old /profile page): too short is rejected, a new one is stored and shown back.
await page.fill("#pw-next", "short");
await page.getByRole("button", { name: "Update password" }).click();
ok(await page.locator("#pw-next").evaluate((el) => !el.validity.valid), "password under 8 characters is rejected by the form");
await page.fill("#pw-next", "correct-horse-battery");
await page.getByRole("button", { name: "Update password" }).click();
await page.getByText("Password updated.").waitFor();
await page.reload({ waitUntil: "networkidle" });
ok((await page.getByLabel("Your current password").textContent()) === "correct-horse-battery", "new password is shown back after reload");
ok(psql(`select "passwordEnc" is not null and "passwordEnc" not like '%correct-horse%' from "User" where id='u1'`) === "t", "password is stored encrypted");
await page.goto(`${base}/profile`, { waitUntil: "networkidle" });
ok(page.url().endsWith("/account/profile"), "old /profile redirects to the student space");

// Delete account: needs the exact email, then anonymises and signs out.
psql(`insert into "User"(id,email,name,"createdAt","updatedAt") values ('u2','bye@example.com','Bye','2026-01-01',now()) on conflict do nothing`);
psql(`insert into "Session"(id,"sessionToken","userId",expires) values ('s2','deletetoken','u2',now()+interval '1 day') on conflict do nothing`);
psql(`insert into "AieLessonProgress"("userId","lessonId") values ('u2','1.1') on conflict do nothing`);
const del = await as("deletetoken");
await del.goto(`${base}/account/profile`, { waitUntil: "networkidle" });
await del.getByRole("button", { name: "Delete account" }).click();
const confirm = del.getByRole("button", { name: "Delete my account" });
ok(await confirm.isDisabled(), "delete button disabled until the email is typed");
await del.fill("#del-email", "wrong@example.com");
ok(await confirm.isDisabled(), "delete stays disabled for a wrong email");
await del.fill("#del-email", "bye@example.com");
await confirm.click();
await del.waitForURL((u) => !u.pathname.startsWith("/account"), { timeout: 30000 });
ok(psql(`select email like 'deleted-%' from "User" where id='u2'`) === "t", "account anonymised");
ok(psql(`select count(*) from "AieLessonProgress" where "userId"='u2'`) === "0", "progress removed");
ok(psql(`select count(*) from "Session" where "userId"='u2'`) === "0", "sessions removed");
await browser.close();

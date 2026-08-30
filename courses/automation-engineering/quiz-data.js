(function (global) {
  function opt(t, correct, why) { return { t: t, correct: !!correct, why: why || "" }; }
const POOLS = {
    1: { title: "First client workflow", questions: [
      { text: "Underline the trigger: 'When the form is submitted, we add a row and Slack the owner.'", opts: [opt("Form submitted", true), opt("Slack the owner", false, "Side effect."), opt("Hiring you", false, "Not an event.")] },
      { text: "A graph with save→fetch→save is:", opts: [opt("A cycle and not executable", true), opt("A normal CRM sync", false, "It never terminates."), opt("Required for webhooks", false, "Webhooks do not need a loop back to themselves.")] },
      { text: "Side effect means:", opts: [opt("The outside world changed", true), opt("A variable was renamed", false, "That is a transform."), opt("The trigger fired", false, "Trigger is the start, not the write.")] },
      { text: "Client says 'automate everything.' You:", opts: [opt("Extract one when-X-we-Y path first", true), opt("Connect all apps tonight", false, "Unscoped."), opt("Add an agent to invent the process", false, "They still cannot name it.")] },
      { text: "CRM wrote, Slack silent. Likely:", opts: [opt("Notify never ran", true), opt("Trigger never fired", false, "CRM write proves it did."), opt("JSON is illegal", false, "Not a JSON issue.")] },
      { text: "Why start on paper, not in n8n?", opts: [opt("If you cannot name trigger and side effect, the canvas will hide that", true), opt("Paper is required by HTTP", false, "No."), opt("n8n cannot send email", false, "It can.")] },
      { text: "Two independent roots and no trigger type:", opts: [opt("The runtime cannot know what started the work", true), opt("Faster parallel is always better", false, "Without a trigger you are guessing."), opt("That is a webhook", false, "A webhook is still a trigger.")] },
      { text: "Transform vs side effect:", opts: [opt("Transform changes data in the run; side effect is visible outside", true), opt("They are synonyms", false, "They are not."), opt("Transforms send email", false, "Email is a side effect.")] },
    ]},
    2: { title: "Data that moves", questions: [
      { text: "Path to mail in {user:{mail:'a@b.com'}}", opts: [opt("user.mail", true), opt("mail", false, "Not top-level."), opt("user", false, "Object, not string.")] },
      { text: "Empty email should:", opts: [opt("Fail the map / require list", true), opt("Be stored as a space", false, "Unreachable contact."), opt("Crash JSON", false, "\"\" is valid JSON.")] },
      { text: "200 + first_name=google-ads means:", opts: [opt("You mapped the campaign onto a person field", true), opt("HTTP validated your names", false, "It did not."), opt("The CRM fixed it", false, "Usually it stores what you sent.")] },
      { text: "a.b.c means:", opts: [opt("Walk inward a → b → c", true), opt("Three siblings", false, "Dots nest."), opt("A disk path", false, "Object path.")] },
      { text: "Dump whole webhook into Sheets?", opts: [opt("Secrets and unreportable junk", true), opt("Sheets cannot hold text", false, "They can."), opt("Always illegal", false, "Careless, not automatically illegal.")] },
      { text: "Rename Full Name → name is:", opts: [opt("A transform", true), opt("A trigger", false), opt("A charge", false)] },
      { text: "Missing key vs empty string:", opts: [opt("Both fail a require:['email'] check here", true), opt("Only missing key fails", false, "Empty is also useless."), opt("Only empty fails", false, "Both are missing for business.")] },
      { text: "Source=google-ads belongs in:", opts: [opt("A campaign/source field, not first_name", true), opt("The email field", false), opt("The signing secret", false)] },
    ]},
    3: { title: "APIs and webhooks", questions: [
      { text: "Stripe calls your URL. That is:", opts: [opt("A webhook", true), opt("Your cron", false), opt("A GET you scheduled", false)] },
      { text: "Unsigned URL risk:", opts: [opt("Fake events, real side effects", true), opt("JSON will not parse", false), opt("TLS is impossible", false)] },
      { text: "Hash mismatch:", opts: [opt("Error, no notify/charge", true), opt("Run then ask", false), opt("Strip the header", false)] },
      { text: "Signing secret lives:", opts: [opt("In a secret store, not a screenshot", true), opt("In the workflow title", false), opt("In Slack topic", false)] },
      { text: "GET contact by id is:", opts: [opt("An outbound API call", true), opt("A webhook", false), opt("Idempotency", false)] },
      { text: "HMAC checks:", opts: [opt("The body plus a shared secret", true), opt("The weather", false), opt("Whether JSON is pretty", false)] },
      { text: "You email the secret to 'debug':", opts: [opt("You leaked the only thing that makes the webhook real", true), opt("Best practice", false), opt("Required by Stripe", false)] },
      { text: "401 on your CRM call:", opts: [opt("Fix auth; do not retry forever", true), opt("Retry 99 times", false), opt("Ignore and POST anyway", false)] },
    ]},
    4: { title: "Failure and retries", questions: [
      { text: "Naive retry after payment timeout:", opts: [opt("Second charge", true), opt("JSON dies", false), opt("Trigger vanishes", false)] },
      { text: "Retry forever:", opts: [opt("Hammers the vendor and hides the incident", true), opt("Required by HTTP", false), opt("Computers cannot stop", false)] },
      { text: "Worth retrying:", opts: [opt("503 / timeout", true), opt("400 missing email", false), opt("401", false)] },
      { text: "Two 503s then 200. Writes?", opts: [opt("One, if you did it right", true), opt("Three", false), opt("Zero", false)] },
      { text: "Notify after HTTP success:", opts: [opt("One text, not one per failed attempt", true), opt("Notify cannot fail", false), opt("Texts are free so spam", false)] },
      { text: "400 validation error:", opts: [opt("Fix the payload; retries will not help", true), opt("Retry 20 times", false), opt("Delete the trigger", false)] },
      { text: "Backoff exists to:", opts: [opt("Give a sick API room instead of stampeding it", true), opt("Make demos slower", false), opt("Replace idempotency", false)] },
      { text: "Retry email-send 5 times on timeout:", opts: [opt("Customer may get five emails", true), opt("Email is never duplicated", false), opt("SMTP forbids it", false)] },
    ]},
    5: { title: "Idempotency", questions: [
      { text: "Idempotent means:", opts: [opt("Same key, no second side effect", true), opt("Never fails", false), opt("Never retry", false)] },
      { text: "Best Stripe key:", opts: [opt("event.id", true), opt("Date.now()", false), opt("email only", false)] },
      { text: "Client retries same key, first charge worked:", opts: [opt("Return stored result", true), opt("Charge again", false), opt("Delete the key", false)] },
      { text: "Keys forever:", opts: [opt("Needless unbounded storage", true), opt("JSON expires", false), opt("Stripe forbids storage", false)] },
      { text: "Key = customer + today:", opts: [opt("Two real purchases collide", true), opt("Time zones vanish", false), opt("Webhooks lack dates", false)] },
      { text: "At-least-once delivery implies:", opts: [opt("You will see duplicates; design for them", true), opt("Duplicates never happen", false), opt("You must charge twice", false)] },
      { text: "Idempotency store miss on replay:", opts: [opt("You will apply the write again", true), opt("HTTP becomes GET", false), opt("JSON pretty-prints", false)] },
      { text: "Key on random UUID each attempt:", opts: [opt("Every retry looks new", true), opt("Maximum safety", false), opt("Required by HMAC", false)] },
    ]},
    6: { title: "AI as a step", questions: [
      { text: "A confident paragraph is not a label because:", opts: [opt("Code needs fields to branch on", true), opt("Models cannot write English", false), opt("Paragraphs cannot be stored", false)] },
      { text: "Markdown fence around JSON:", opts: [opt("Strip, then validate", true), opt("Reject forever", false), opt("Store the backticks", false)] },
      { text: "AI node should:", opts: [opt("Extract / classify / draft", true), opt("Charge the card", false), opt("Email the whole CRM", false)] },
      { text: "amount = 'about $2400':", opts: [opt("Fail validation; do not coerce", true), opt("Guess 2400", false), opt("Store as number anyway", false)] },
      { text: "40% repair rate:", opts: [opt("Fix the prompt/schema", true), opt("More regex forever", false), opt("JSON is dead", false)] },
      { text: "No schema on AI node:", opts: [opt("You will route on vibes", true), opt("Faster and therefore better", false), opt("Required for HMAC", false)] },
      { text: "Model says 'looks urgent' only:", opts: [opt("Do not write priority=high unless the field exists", true), opt("Always map to high", false), opt("Delete the ticket", false)] },
      { text: "AI + notify with no gate:", opts: [opt("Bad prose can still ping the closer", true), opt("Notify validates JSON", false), opt("Slack fixes schema", false)] },
    ]},
    7: { title: "Guardrails", questions: [
      { text: "Refund agent first revision:", opts: [opt("Draft; human executes", true), opt("Execute + nicer prompt", false), opt("Refund everyone", false)] },
      { text: "Ticket body can attack because:", opts: [opt("Untrusted text can ask for tools", true), opt("Encryption is evil", false), opt("JSON cannot hold words", false)] },
      { text: "No max steps:", opts: [opt("Spends tokens and tools until killed", true), opt("Stops when bored", false), opt("Required for RAG", false)] },
      { text: "Classifier tool set:", opts: [opt("None or read-only", true), opt("Every company tool", false), opt("send_email_all", false)] },
      { text: "Pending approval means:", opts: [opt("Money has not moved", true), opt("Logging a draft is forbidden", false), opt("You cannot read the ticket", false)] },
      { text: "Prompt injection defense that actually works:", opts: [opt("Do not attach execute tools", true), opt("'Be good' in the prompt", false), opt("More adjectives", false)] },
      { text: "refund.draft vs refund.execute:", opts: [opt("Words vs money", true), opt("Same thing", false), opt("Draft is more dangerous", false)] },
      { text: "Client wants 'fully autonomous ops':", opts: [opt("Autonomous inside a box you can name", true), opt("Give production admin to the model", false), opt("Turn off logs", false)] },
  ]},
};
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
  global.QuizData = { POOLS: POOLS, shuffle: shuffle };
})(window);

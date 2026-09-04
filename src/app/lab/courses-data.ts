// Zenith Lab catalog display data. Deliberately separate from
// src/lib/courses.ts (the checkout/access-control catalog): this file is
// purely descriptive copy for the /lab marketplace page, the real
// checkout URL for a course is still always resolved through
// getCourse()/getCheckoutUrl() at render time, never hardcoded here.
//
// Data integrity rule this file follows: a stat (practiceTasks,
// portfolioProjects, price, etc.) is only included for a course when it's
// independently verifiable, practiceTasks/portfolioProjects for Data
// Science come from its real skill-map.js/course-progress.js (315 tasks,
// 10 projects, confirmed this engagement); price for AI Engineering and
// Data Science comes from src/lib/courses.ts's real Whop checkoutUrl.
// AI Automation price comes from the live Whop plan created 2026-08-30
// ($149, plan_ED9yF9ehN2RIa). practiceTasks/portfolioProjects are counted
// from practice-tasks.js and course-progress.js. Web3 Engineering still
// has no COURSES entry.

export type CourseCategory = "data" | "ai" | "automation" | "blockchain" | "security";

export type CourseCard = {
  id: string;
  name: string;
  category: CourseCategory;
  categoryLabel: string;
  /** A short, punchy outcome-framed line shown above the title on the
      marketplace card — distinct from `summary` (which explains what the
      course covers). Written around real search intent for this topic
      (what people actually type looking for this skill) and a genuine
      stat/outcome from this course, never a claim the course can't back up. */
  hook?: string;
  /** True once a real Whop checkout exists for this course (checked again live via getCourse/getCheckoutUrl at render time; this only controls display copy like "Coming soon" vs a real price). */
  available: boolean;
  level: string;
  duration: string;
  weeklyTime?: string;
  practiceTasks?: number;
  portfolioProjects?: number;
  hasCapstone?: boolean;
  price?: string;
  /** List price this course discounts from, when it has one. Shown once discountDeadline passes, if set. */
  originalPrice?: string;
  /** Real percent-off, computed from price/originalPrice, not a marketing round-number. */
  discountPercent?: number;
  /** ISO timestamp the discount actually ends at. The real Whop plan price has to be
      raised back to originalPrice by hand on this date too (Whop's API has no
      scheduled-price-change field), see scripts/revert-launch-discount.mjs. The
      countdown and the displayed price both switch automatically once this passes,
      whether or not that manual step has happened yet, so do it on time. */
  discountDeadline?: string;
  summary: string;
  whatYoullDo: string[];
  topics: string[];
  facts: string[];
  careerPath: string;
  /** Real module list, in order, straight from the course's own course-progress.js MODULES array. `description` is the real module page's own "sub" copy, not invented. Only set for courses that are actually built and published — never invent a curriculum for a "Coming soon" course. */
  curriculum?: { title: string; description: string }[];
  /** Groups curriculum entries into the same stages the real in-course
      sidebar (course-rail.js) shows, straight from each course's own
      course-progress.js STAGES array — never invented. "Orientation" (when
      curriculum has it) stays ungrouped above these, same as the sidebar. */
  stages?: { label: string; title: string; moduleTitles: string[] }[];
  /** Real per-module minutes, straight from course-progress.js's MODULES
      array, keyed by the exact curriculum entry title. */
  moduleMinutes?: Record<string, number>;
  /** The LAB badge's accent color for this course. Data Science and AI Engineering pull the real color straight from their own static pages' `.logo b` badge. AI Automation uses the cyan from courses/automation-engineering/course.css. Web3 is a catalog-only choice. */
  labBadgeColor?: { bg: string; text: string };
  /** Real per-tool practice task counts, straight from each practice library's real task count (confirmed against course-progress.js/skill-map.js). Should sum to practiceTasks. */
  practiceBreakdown?: { tool: string; tasks: number }[];
  /** A sample of the real portfolio projects (title + one-line context), straight from course-progress.js's PROJECTS array — never invented placeholder project names. */
  projectSamples?: { title: string; tag: string }[];
  /** What's actually built into the course beyond modules and practice tasks — real page names, not marketing fluff. */
  includes?: string[];
};

export const courses: CourseCard[] = [
  {
    id: "data-science",
    name: "Data Science & Analysis",
    category: "data",
    categoryLabel: "Data Analyst Track",
    hook: "Excel, SQL, Python, and statistics in one track, so you stop learning tools in isolation and start building the portfolio a data analyst job actually asks for.",
    available: true,
    level: "Beginner, no prior coding required",
    duration: "12 weeks, self-paced",
    practiceTasks: 315,
    portfolioProjects: 10,
    hasCapstone: true,
    price: "$30",
    originalPrice: "$120",
    discountPercent: 75,
    discountDeadline: "2026-09-07T23:59:59-00:00",
    summary:
      "Spreadsheets through a full capstone analysis: clean real messy data, query it, analyze it in Python, validate it statistically, and ship a dashboard that answers an actual business question.",
    whatYoullDo: [
      "Clean messy, real business datasets",
      "Write real SQL queries against a live database",
      "Analyze data in Excel and Python (pandas)",
      "Run statistical tests, correlation, and regression",
      "Choose the right chart and spot a misleading one",
      "Practice Tableau and Power BI judgment in honest in-browser simulations, then submit one real Desktop Lab",
      "Automate a repetitive analytical workflow",
      "Complete an end-to-end capstone and portfolio projects",
    ],
    topics: [
      "Excel",
      "SQL",
      "Python",
      "Statistics",
      "Tableau",
      "Power BI",
      "Automation",
      "Data Cleaning",
      "Dashboards",
      "Business Analysis",
    ],
    facts: [
      "Most analysis starts with messy data, not a clean spreadsheet.",
      "A SQL JOIN can silently multiply rows and produce a completely wrong business result.",
      "Correlation does not prove that one variable caused another.",
      "An average can hide a huge difference between customers.",
      "Choosing the wrong chart can make a correct dataset tell the wrong story.",
      "Excel, SQL, and Python solve different parts of the same analytical workflow.",
    ],
    careerPath:
      "A portfolio of real analyses, built from messy data through a defended recommendation, the kind of evidence that gets interviews instead of another tutorial notebook.",
    curriculum: [
      {
        title: "Orientation",
        description:
          "A short, honest self-check. Beginners start at Module 1. Later tracks are optional only if you already write code or pandas, plus what analysts actually do and what Modules 1-9 will (and will not) teach you.",
      },
      {
        title: "Spreadsheet & Data Literacy Foundations",
        description:
          "Rows, columns, and cells as the mental model for what a \"dataset\" is, the five formulas that cover most real spreadsheet work, sorting and filtering, and why \"tidy data\" is the idea everything after this module depends on.",
      },
      {
        title: "Python Foundations for Data",
        description:
          "Six ideas, each taught through a real analyst task, with code you actually write and run in a real Python interpreter in the browser. Every concept exists here because Module 3 onward needs it.",
      },
      {
        title: "Pandas & NumPy Fundamentals",
        description:
          "What you parsed by hand with a loop in Module 2, pandas does in one line, then gives you filtering, grouping, and joining on top. Runs against the same real datasets you'll use for the rest of the course.",
      },
      {
        title: "Data Cleaning & Validation",
        description:
          "Where most analyst time actually goes. You get raw data and an audit to perform, not a checklist to follow, because finding the problems is the skill, not something anyone can hand you a list of.",
      },
      {
        title: "Exploratory Data Analysis & Statistics",
        description:
          "Not a maths course. Every concept exists to answer one question a stakeholder will actually ask: is this difference real, or did we just get lucky? You compute the numbers, and learn when not to trust them.",
      },
      {
        title: "SQL for Analysts",
        description:
          "A real SQLite database running entirely in the page, with a messy shop's worth of customers, orders, and products, NULLs, cancelled orders, and duplicate-row traps included. Every exercise starts from a business question and is checked against the live database.",
      },
      {
        title: "Data Visualization & Storytelling",
        description:
          "Every chart is real: you write actual Plotly code that runs in a real Python interpreter in your browser. The hard part was never the charting syntax, it's choosing the right chart and knowing when one is honest or quietly lying.",
      },
      {
        title: "Dashboards & Business Communication",
        description:
          "Every KPI and chart is computed by your own Python code running on real, messy funnel data from Module 4. A dashboard is not a picture of numbers, it's an argument built out of them.",
      },
      {
        title: "Capstone Analysis Project",
        description:
          "One real client, one real ambiguous problem, every skill from Modules 1-8 in service of answering it. No numbered steps: you decide what to clean, what to query, what to chart, and what to recommend.",
      },
    ],
    stages: [
      { label: "Stage 0", title: "Spreadsheets before code", moduleTitles: ["Spreadsheet & Data Literacy Foundations"] },
      { label: "Stage 1", title: "Python foundations for data", moduleTitles: ["Python Foundations for Data", "Pandas & NumPy Fundamentals"] },
      { label: "Stage 2", title: "Real-world data skills", moduleTitles: ["Data Cleaning & Validation", "Exploratory Data Analysis & Statistics"] },
      { label: "Stage 3", title: "Querying and communicating", moduleTitles: ["SQL for Analysts", "Data Visualization & Storytelling", "Dashboards & Business Communication"] },
      { label: "Stage 4", title: "Capstone", moduleTitles: ["Capstone Analysis Project"] },
    ],
    moduleMinutes: {
      "Spreadsheet & Data Literacy Foundations": 40,
      "Python Foundations for Data": 45,
      "Pandas & NumPy Fundamentals": 50,
      "Data Cleaning & Validation": 55,
      "Exploratory Data Analysis & Statistics": 50,
      "SQL for Analysts": 45,
      "Data Visualization & Storytelling": 45,
      "Dashboards & Business Communication": 50,
      "Capstone Analysis Project": 120,
    },
    labBadgeColor: { bg: "#f0b429", text: "#1a1200" },
    practiceBreakdown: [
      { tool: "Excel", tasks: 35 },
      { tool: "Python", tasks: 50 },
      { tool: "SQL", tasks: 60 },
      { tool: "Statistics", tasks: 40 },
      { tool: "Tableau", tasks: 40 },
      { tool: "Power BI", tasks: 40 },
      { tool: "Automation", tasks: 30 },
      { tool: "Integrated Cross-Tool Challenges", tasks: 20 },
    ],
    projectSamples: [
      { title: '"The Leaky Funnel"', tag: "E-commerce & Retail" },
      { title: '"The Understaffed Quarter"', tag: "People & HR" },
      { title: '"The Campaign That Didn’t Work"', tag: "Marketing & Agency" },
      { title: '"The Slow Season"', tag: "Finance & Small Business" },
      { title: '"The Churn Cliff"', tag: "SaaS" },
      { title: '"The Overpriced Listing"', tag: "Real Estate" },
      { title: '"The Wait Time Problem"', tag: "Healthcare Operations" },
      { title: '"The Empty Rooms"', tag: "Travel & Hospitality" },
      { title: '"The Phantom Stock"', tag: "Retail" },
      { title: '"The Monthly Scorecard"', tag: "Executive & BI, multi-tool capstone" },
    ],
    includes: [
      "Diagnostic assessment with an adaptive learning roadmap",
      "Mastery profile tracking your real skill level per tool",
      "Quiz Center covering every module",
      "Printable cheat sheets for every tool",
      "10 real portfolio projects, auto-summarized for your resume",
      "A downloadable portfolio site template",
      "Step-by-step guide to deploying it live on Vercel",
      "Career Path Edition: pricing, job boards, and interview framing",
      "Required Tableau Public or Power BI Desktop lab (not the in-browser simulations)",
    ],
  },
  {
    id: "ai-engineering",
    name: "AI Engineering",
    category: "ai",
    categoryLabel: "Build AI Agents & LLM Apps",
    hook: "RAG, tool use, and agents, the actual engineering behind AI products, not another single-prompt chatbot demo.",
    available: true,
    level: "Basic programming logic required, no prior Python needed",
    duration: "8 weeks",
    weeklyTime: "~10 hrs/week",
    price: "$28.75",
    originalPrice: "$115",
    discountPercent: 75,
    discountDeadline: "2026-09-07T23:59:59-00:00",
    summary:
      "The real stack behind production AI products: prompting, retrieval, agents, tool use, structured outputs, and evaluation, applied to a real shipped product, not a toy chatbot.",
    whatYoullDo: [
      "Write prompts that produce reliable, structured output",
      "Ground a model on your own data with retrieval",
      "Build agents that use tools and take real actions",
      "Evaluate outputs instead of eyeballing them",
      "Control cost and latency as usage scales",
      "Ship a real product with real evals behind it",
    ],
    topics: [
      "Prompting",
      "Retrieval",
      "Agents",
      "Tool Use",
      "Structured Outputs",
      "Evaluation",
      "Cost & Latency",
    ],
    facts: [
      "Retrieval can ground an LLM on information outside its training data.",
      "Tool use lets an AI system interact with external systems, not just generate text.",
      "Evaluation is necessary because a response that sounds right can still be wrong.",
      "Prompting is only one part of a production AI system.",
      "Cost and latency become real engineering constraints once an AI application scales.",
    ],
    careerPath:
      "A shipped AI product with evals you can point to in an interview, whether you're moving into AI engineering freelance or hired.",
    curriculum: [
      {
        title: "Orientation",
        description:
          "What this field actually is, what people in it actually build, where you might fit, and exactly what the next 8 modules will (and won't) teach you.",
      },
      {
        title: "Prompting & Structured Outputs",
        description:
          "A language model produces text. Your program needs data. This module closes that gap reliably, not with a nicer-sounding prompt, but with validation and repair logic that doesn't trust the model to behave.",
      },
      {
        title: "Context Windows & Token Economics",
        description:
          "Every prompt has a budget, measured in tokens, not characters or \"how much text feels reasonable.\" The actual arithmetic for what fits, what it costs, and what to do when your content doesn't fit.",
      },
      {
        title: "Retrieval-Augmented Generation",
        description:
          "A model only knows what's in its prompt. Retrieval decides, out of everything you could put there, which pieces actually get in, by searching, not by hoping the right chunk made the cut.",
      },
      {
        title: "Tool Use & Function Calling",
        description:
          "A model can only produce text. Everything it does beyond that, looking something up, sending an email, charging a card, happens because a tool call it generated got executed by your code. That execution step is where correctness and safety actually live.",
      },
      {
        title: "Agent Architectures & Control Flow",
        description:
          "An agent is what happens when a model chains steps together, reasoning about each result before deciding the next action, in a loop it controls. That loop needs boundaries, or it doesn't stop on its own.",
      },
      {
        title: "Reliability for LLM Systems",
        description:
          "Model APIs fail: rate limits, timeouts, transient server errors. Some failures are worth retrying, some never will succeed no matter how many times you try, and treating them the same wastes time, money, and your users' patience.",
      },
      {
        title: "Evaluation, Testing & Observability",
        description:
          "\"I tried a few prompts and it looked good\" isn't evaluation, it's a vibe check on a handful of lucky examples. A systematic way to measure whether a system is actually working, and whether a change made it better or worse.",
      },
      {
        title: "Capstone: A Production AI Agent",
        description:
          "A client brief: a support bot that must answer from a knowledge base, act on tools safely, run inside a bounded loop, and survive a flaky model API, graded against a rubric, not vibes.",
      },
    ],
    stages: [
      { label: "Stage 0", title: "Prompting foundations", moduleTitles: ["Prompting & Structured Outputs", "Context Windows & Token Economics"] },
      { label: "Stage 1", title: "Retrieval and tools", moduleTitles: ["Retrieval-Augmented Generation", "Tool Use & Function Calling"] },
      { label: "Stage 2", title: "Agents in production", moduleTitles: ["Agent Architectures & Control Flow", "Reliability for LLM Systems", "Evaluation, Testing & Observability"] },
      { label: "Stage 3", title: "Capstone", moduleTitles: ["Capstone: A Production AI Agent"] },
    ],
    moduleMinutes: {
      "Prompting & Structured Outputs": 45,
      "Context Windows & Token Economics": 40,
      "Retrieval-Augmented Generation": 45,
      "Tool Use & Function Calling": 45,
      "Agent Architectures & Control Flow": 45,
      "Reliability for LLM Systems": 40,
      "Evaluation, Testing & Observability": 40,
      "Capstone: A Production AI Agent": 90,
    },
    labBadgeColor: { bg: "#c6f432", text: "#0f1405" },
  },
  {
    id: "ai-assisted-software-engineering",
    name: "AI-Assisted Software Engineering",
    category: "ai",
    categoryLabel: "Learn to Code with AI",
    hook: "Write real HTML, CSS, and JavaScript yourself first, then drive Cursor like an engineer who can read the diff, not someone hoping the AI got it right.",
    available: true,
    level: "Beginner, no prior coding required",
    duration: "12 weeks, self-paced",
    weeklyTime: "~8–10 hrs/week",
    practiceTasks: 212,
    portfolioProjects: 8,
    hasCapstone: true,
    price: "$24.75",
    originalPrice: "$99",
    discountPercent: 75,
    discountDeadline: "2026-09-07T23:59:59-00:00",
    summary:
      "Zero to a live Northline Digital web app: write HTML, CSS, and JavaScript yourself, then specify, inspect, test, and ship with an AI coding partner. This is not AI Engineering — that course builds LLM products (RAG, tools, eval) and assumes programming logic already.",
    whatYoullDo: [
      "Build a real page from a brief in HTML, by hand",
      "Match a layout spec in CSS, including one responsive rule",
      "Write JavaScript functions in the browser before any coding agent",
      "Write acceptance criteria a stranger could implement",
      "Write engineering prompts for an AI coding assistant with context, constraints, and verification",
      "Install Cursor, change a starter repo, and record a real Desktop Lab",
      "Own a public repo with a README, at least three commits, and a PR or documented branch",
      "Write a test that fails on a planted bug",
      "Ship a small web app with tests, a GitHub repo, and a live https URL that is not the repo itself",
    ],
    topics: [
      "HTML",
      "CSS",
      "JavaScript",
      "Specs",
      "Prompt engineering",
      "Cursor",
      "GitHub",
      "Testing",
      "Python scripts",
      "AI Code Detective",
    ],
    facts: [
      "AI will write most of the characters. You are paid to specify, reject, test, and ship.",
      "In-browser Spec, Git, and PR labs are labeled simulations. They never unlock the capstone.",
      "Both Desktop Labs are required: Cursor evidence and a GitHub repo you own. Pick-one is not enough.",
      "This course does not teach RAG, tool-calling agents, or model eval — that is AI Engineering.",
    ],
    careerPath:
      "A junior who can specify a small web feature, drive a coding agent, read the diff, write tests, open a PR, and deploy a live URL. Not a senior engineer. No job guarantee.",
    practiceBreakdown: [
      { tool: "HTML", tasks: 20 },
      { tool: "CSS", tasks: 20 },
      { tool: "JavaScript", tasks: 40 },
      { tool: "Specs (labeled simulation)", tasks: 20 },
      { tool: "Git (labeled simulation)", tasks: 20 },
      { tool: "Review (labeled simulation)", tasks: 20 },
      { tool: "AI Code Detective", tasks: 12 },
      { tool: "Testing", tasks: 20 },
      { tool: "Python", tasks: 25 },
      { tool: "Integrated (labeled simulation)", tasks: 15 },
    ],
    curriculum: [
      {
        title: "Orientation",
        description:
          "The 11-step loop, a labeled bad-vs-good AI workflow, and an honest self-check. Everyone still starts at Module 1. Nothing here locks.",
      },
      {
        title: "Your first shipped change",
        description:
          "Ticket NL-001: Saturday hours are wrong. Change one line, render it, write a commit message a colleague would accept.",
      },
      {
        title: "Requirements: turning “make it better” into work",
        description:
          "Ticket NL-002: Dan’s one-sentence brief. Stories, acceptance criteria, edges, and an explicit out-of-scope list before any agent.",
      },
      {
        title: "HTML: the structure under every page",
        description:
          "Ticket NL-003: semantic HTML for the clinic landing page. You write it, then catch what an agent gets subtly wrong.",
      },
      {
        title: "CSS: layout that survives a phone",
        description:
          "Ticket NL-004: box model, flexbox, one breakpoint you can defend when the page opens on a phone.",
      },
      {
        title: "JavaScript: logic you can defend",
        description:
          "Ticket NL-005: hours, filters, greetings — written by you, because you will be reviewing this shape forever.",
      },
      {
        title: "The DOM, events, and data that arrives late",
        description:
          "Ticket NL-006: four UI states (loading, empty, error, data) and a real click handler. We do not pretend to grade a live fetch.",
      },
      {
        title: "Prompt Engineering for Software Engineers",
        description:
          "Ticket NL-014: turn vague requests into Context → Task → Constraints → Acceptance → Verify. Graded prompt labs, not ChatGPT tricks. Sits before Cursor so you can use the skill in later labs.",
      },
      {
        title: "AI as your pair programmer",
        description:
          "Ticket NL-007: the full loop in Cursor. You bring the actual output back and we run tests against it. Desktop Lab A starts here.",
      },
      {
        title: "AI Code Detective",
        description:
          "Ticket NL-008: plausible AI code with real defects mixed with innocent lines. Find them, then prove the fix.",
      },
      {
        title: "Testing and debugging under pressure",
        description:
          "Ticket NL-009: write the test that catches the planted booking-validation bug. “Works on my machine” is not a defence.",
      },
      {
        title: "Git, GitHub, and code review",
        description:
          "Ticket NL-010: branch, diff, PR. In-browser git practice is a labeled simulation. Desktop Lab B is a repo you own.",
      },
      {
        title: "Refactoring, security, and maintenance",
        description:
          "Ticket NL-011: change the shape without changing the behaviour. Then find the leak.",
      },
      {
        title: "Python for scripts and small tools",
        description:
          "Ticket NL-012: a JSON/Python helper for clinic data. Enough Python to kill a Monday chore. Not RAG.",
      },
      {
        title: "Release: ship the application",
        description:
          "Ticket NL-013: one live Northline product — tests, a repo, a release note, and a URL someone else can open. A github.com repo is not that URL.",
      },
    ],
    stages: [
      { label: "Stage 0", title: "Welcome to AI-assisted development", moduleTitles: ["Your first shipped change"] },
      { label: "Stage 1", title: "Think like a software engineer", moduleTitles: ["Requirements: turning “make it better” into work"] },
      { label: "Stage 2", title: "Understand the web", moduleTitles: ["HTML: the structure under every page", "CSS: layout that survives a phone", "JavaScript: logic you can defend", "The DOM, events, and data that arrives late"] },
      { label: "Stage 3", title: "AI as your pair programmer", moduleTitles: ["Prompt Engineering for Software Engineers", "AI as your pair programmer", "AI Code Detective"] },
      { label: "Stage 4", title: "Engineering discipline", moduleTitles: ["Testing and debugging under pressure", "Git, GitHub, and code review", "Refactoring, security, and maintenance"] },
      { label: "Stage 5", title: "Release and ship", moduleTitles: ["Python for scripts and small tools", "Release: ship the application"] },
    ],
    moduleMinutes: {
      "Your first shipped change": 45,
      "Requirements: turning “make it better” into work": 70,
      "HTML: the structure under every page": 60,
      "CSS: layout that survives a phone": 70,
      "JavaScript: logic you can defend": 80,
      "The DOM, events, and data that arrives late": 65,
      "Prompt Engineering for Software Engineers": 80,
      "AI as your pair programmer": 65,
      "AI Code Detective": 65,
      "Testing and debugging under pressure": 65,
      "Git, GitHub, and code review": 60,
      "Refactoring, security, and maintenance": 60,
      "Python for scripts and small tools": 60,
      "Release: ship the application": 150,
    },
    labBadgeColor: { bg: "#60a5fa", text: "#0b1220" },
    includes: [
      "Module 0 orientation plus 14 sequential modules (NL-001 through NL-014, with prompt engineering after the web tickets)",
      "Hard locks from Module 2 (quiz ≥80% and the graded exercise)",
      "Capstone also needs 3+ passes in at least three of HTML / CSS / JS / Detective, plus both Desktop Labs",
      "Desktop Labs for Cursor and GitHub (both required; Lab A URL optional)",
      "Quiz Center, diagnostic, mastery profile, learning roadmap",
      "Projects with separate repo and live URLs, portfolio, deploy guide, career path with explicit gaps",
    ],
  },
  {
    id: "ai-automation",
    name: "AI Automation",
    category: "automation",
    categoryLabel: "No-Code Workflow Automation",
    hook: "The n8n and workflow-automation judgment clients actually pay for: retries, idempotency, and AI kept on a leash, not a demo that breaks the first time an API hiccups.",
    available: true,
    level: "Beginner, no programming required",
    duration: "3–5 weeks if you also rebuild briefs in a real tool",
    weeklyTime: "~4–6 hrs/week",
    practiceTasks: 80,
    portfolioProjects: 8,
    hasCapstone: true,
    price: "$37.25",
    originalPrice: "$149",
    discountPercent: 75,
    discountDeadline: "2026-09-07T23:59:59-00:00",
    summary:
      "Build client-ready workflow judgment: map a real process, survive retries and replayed events in a simulated runtime, and put AI behind a schema and a human gate. n8n is the example, not the product.",
    whatYoullDo: [
      "Map a client request into trigger, transform, and side effect",
      "Read messy JSON and refuse a contact with no email",
      "Drop a webhook whose teaching-signature does not match (simulated, not Stripe HMAC)",
      "Retry a simulated flaky HTTP node without sending three invoices",
      "Charge once when the same event arrives twice",
      "Reject unstructured model output",
      "Stop an agent from executing a refund without approval",
    ],
    topics: [
      "Workflows",
      "APIs",
      "Webhooks",
      "Retries",
      "Idempotency",
      "AI Steps",
      "Guardrails",
      "Client Delivery",
    ],
    facts: [
      "A retry can charge a card twice if the write is not keyed.",
      "A webhook URL without a signature check is a public write API.",
      "A 200 from the CRM does not mean you mapped the right field.",
      "Prose from a model is not a ticket label.",
      "The tool list is the permission list.",
    ],
    careerPath:
      "A portfolio of workflows you can demo, plus an honest map of freelance integration work versus W-2 ops roles. No job guarantee.",
    curriculum: [
      {
        title: "Orientation",
        description:
          "Who this is for, how grading works, and what we will not promise. n8n is an example platform, not a certificate.",
      },
      {
        title: "Your First Client Workflow",
        description:
          "Trigger, transform, side effect. Assemble a booking pipeline that can actually finish, and reject a graph that loops.",
      },
      {
        title: "Data That Moves",
        description:
          "JSON paths, empty emails, and why a 200 can still store garbage in the CRM.",
      },
      {
        title: "APIs, Webhooks & Auth",
        description:
          "They call you or you call them. Reject a bad signature. Never mail the secret.",
      },
      {
        title: "When Things Fail",
        description:
          "Bounded retries on a flaky API. Do not send three invoices.",
      },
      {
        title: "Do It Once",
        description:
          "The same payment event, twice. One charge. Key on event id, not the clock.",
      },
      {
        title: "AI as a Step, Not a Brain",
        description:
          "Demand a schema. Reject conversational prose. Models label and draft; code writes and charges.",
      },
      {
        title: "Agents That Can't Run Away",
        description:
          "Draft versus execute. Approval before money moves. Ticket text is untrusted.",
      },
      {
        title: "Capstone: A Client-Ready Lead Pipeline",
        description:
          "Enrich, extract, CRM, Slack. Survive two CRM failures, a replay, and a model that returns a sentence.",
      },
    ],
    stages: [
      { label: "Stage 0", title: "Workflow foundations", moduleTitles: ["Your First Client Workflow", "Data That Moves"] },
      { label: "Stage 1", title: "Real integrations", moduleTitles: ["APIs, Webhooks & Auth", "When Things Fail"] },
      { label: "Stage 2", title: "Production discipline", moduleTitles: ["Do It Once", "AI as a Step, Not a Brain", "Agents That Can't Run Away"] },
      { label: "Stage 3", title: "Capstone", moduleTitles: ["Capstone: A Client-Ready Lead Pipeline"] },
    ],
    moduleMinutes: {
      "Your First Client Workflow": 50,
      "Data That Moves": 45,
      "APIs, Webhooks & Auth": 50,
      "When Things Fail": 50,
      "Do It Once": 45,
      "AI as a Step, Not a Brain": 50,
      "Agents That Can't Run Away": 50,
      "Capstone: A Client-Ready Lead Pipeline": 90,
    },
    labBadgeColor: { bg: "#22d3ee", text: "#04272b" },
    practiceBreakdown: [
      { tool: "Workflow design", tasks: 20 },
      { tool: "APIs & webhooks", tasks: 20 },
      { tool: "Retries & idempotency", tasks: 20 },
      { tool: "AI steps & guardrails", tasks: 20 },
    ],
    projectSamples: [
      { title: "Welcome Sequence for a New Lead", tag: "Beginner" },
      { title: "Lead Form to CRM", tag: "Beginner" },
      { title: "Invoice Follow-Up That Survives Timeouts", tag: "Reliability" },
      { title: "Webhook That Must Not Double-Charge", tag: "Reliability" },
      { title: "Support Ticket Classifier", tag: "AI step" },
      { title: "Refund Agent With a Human Gate", tag: "Guardrails" },
      { title: "Broken Production Run", tag: "Debug" },
      { title: "Client-Ready Lead Pipeline", tag: "Capstone" },
    ],
    includes: [
      "In-browser workflow runtime with flaky APIs, replays, and messy AI output",
      "80 graded practice scenarios across four libraries",
      "Quiz Center plus a 10-question transfer final",
      "8 client-style briefs you rebuild in a real tool and score on the Portfolio page",
      "Career Path Edition: freelance vs W-2, no job promise",
    ],
  },
  {
    id: "cybersecurity-ethical-hacking",
    name: "Cybersecurity & Ethical Hacking",
    category: "security",
    categoryLabel: "Cybersecurity",
    available: false,
    level: "Beginner-friendly foundations, advanced cloud/AI security track after",
    duration: "Coming soon",
    summary:
      "Authorized, hands-on offensive security: network and web app penetration testing against real vulnerable lab environments, then the advanced track into cloud misconfigurations and AI/LLM-specific attacks.",
    whatYoullDo: [
      "Run reconnaissance and enumeration against a lab target",
      "Exploit real vulnerabilities in a deliberately vulnerable web app",
      "Escalate privileges and move through a compromised host",
      "Write a pentest report a client can actually act on",
      "Break and harden cloud IAM and container configurations",
      "Attack and defend an LLM agent against prompt injection",
    ],
    topics: [
      "Penetration Testing",
      "Network Security",
      "Web App Security",
      "Cloud Security",
      "AI/LLM Security",
      "Reporting",
    ],
    facts: [
      "A pentest report nobody can act on is worth less than the engagement that produced it.",
      "Most real breaches start with a misconfiguration, not a zero-day.",
      "Prompt injection can hijack an AI agent's tool access, not just its output.",
    ],
    careerPath:
      "A documented pentest engagement plus a cloud/AI security lab writeup, evidence that maps directly to Security+/OSCP-track roles.",
    labBadgeColor: { bg: "#f87171", text: "#2a0a0a" },
  },
  {
    id: "agentic-ai",
    name: "AI Agents & Agentic AI",
    category: "ai",
    categoryLabel: "AI and LLMs",
    available: false,
    level: "Intermediate, comfortable with core AI/LLM fundamentals",
    duration: "Coming soon",
    summary:
      "Beyond a single prompt and response: planning loops, multi-agent orchestration, memory, and the guardrails that keep an autonomous agent from running away with your production system.",
    whatYoullDo: [
      "Build a planning loop that reasons over multiple steps",
      "Manage state and memory across an agent's turns",
      "Orchestrate multiple agents that delegate to each other",
      "Design tool schemas an agent can't misuse",
      "Add guardrails and human-in-the-loop checkpoints",
      "Evaluate an agentic system, not just a single response",
    ],
    topics: ["Agent Architectures", "Planning", "Multi-Agent Systems", "Tool Design", "Guardrails", "Evaluation"],
    facts: [
      "An agent loop without a hard stop condition doesn't stop on its own.",
      "Multi-agent systems fail in ways a single-agent system never does: agents can loop, contradict each other, or delegate forever.",
      "Giving an agent a tool is also giving it a way to misuse that tool.",
    ],
    careerPath:
      "A working multi-step autonomous agent with real guardrails, tested against failure cases, not just the happy path demo.",
    labBadgeColor: { bg: "#34d399", text: "#04231a" },
  },
  {
    id: "mcp-servers",
    name: "MCP Servers & AI Tool Integration",
    category: "ai",
    categoryLabel: "AI and LLMs",
    available: false,
    level: "Intermediate, basic programming required",
    duration: "Coming soon",
    summary:
      "Build and ship real Model Context Protocol servers: the actual integration layer connecting AI agents to tools, data, and systems in production right now.",
    whatYoullDo: [
      "Build a real, runnable MCP server from scratch",
      "Expose resources, tools, and prompts through the protocol",
      "Scope tool permissions so an agent can't overreach",
      "Connect an agent client to your own MCP server",
      "Debug, version, and deploy an MCP server",
    ],
    topics: ["MCP Protocol", "Tool Integration", "API Design", "Auth & Scoping", "Deployment"],
    facts: [
      "MCP standardizes how an AI agent discovers and calls tools, instead of every integration inventing its own function-calling format.",
      "A tool with over-broad permissions is the most common way an agent ends up doing something it shouldn't.",
    ],
    careerPath:
      "A real MCP server solving an actual integration problem, connected to a live agent, the kind of concrete build employers are asking for right now.",
    labBadgeColor: { bg: "#fb923c", text: "#271200" },
  },
  {
    id: "web3-engineering",
    name: "Web3 Engineering",
    category: "blockchain",
    categoryLabel: "Blockchain",
    available: false,
    level: "Intermediate",
    duration: "Coming soon",
    summary:
      "Smart contracts, wallets, and dApps end to end: Solidity fundamentals through deploying and securing something real on chain.",
    whatYoullDo: [
      "Write and test smart contracts in Solidity",
      "Recognize and avoid common contract exploits",
      "Connect a wallet and deploy to a real network",
      "Build a working dApp front end",
    ],
    topics: ["Solidity", "Contract Security", "Wallets", "Testing", "dApps"],
    facts: [],
    careerPath:
      "A deployed, working contract to show for it, and a clearer read on where paid on-chain work actually is.",
    labBadgeColor: { bg: "#a78bfa", text: "#1c1533" },
  },
];

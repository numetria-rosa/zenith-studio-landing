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
// Automation Engineering and Web3 Engineering have no entry in
// src/lib/courses.ts yet (no real product/checkout exists), so they carry
// no price and no task/project counts here, inventing either would
// violate the one rule this file can't bend on.

export type CourseCategory = "data" | "ai" | "automation" | "blockchain" | "security";

export type CourseCard = {
  id: string;
  name: string;
  category: CourseCategory;
  categoryLabel: string;
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
      scheduled-price-change field), see scripts/update-data-science-price.mjs. The
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
  /** The LAB badge's accent color for this course. Data Science and AI Engineering pull the real color straight from their own static pages' `.logo b` badge; Automation Engineering and Web3 Engineering don't have a built, distinct accent yet, so these are a deliberate choice made for the catalog rather than lifted from existing course pages. */
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
    categoryLabel: "Data",
    available: true,
    level: "Beginner, no prior coding required",
    duration: "12 weeks, self-paced",
    practiceTasks: 315,
    portfolioProjects: 10,
    hasCapstone: true,
    price: "$30",
    originalPrice: "$120",
    discountPercent: 75,
    discountDeadline: "2026-09-01T23:59:59-00:00",
    summary:
      "Spreadsheets through a full capstone analysis: clean real messy data, query it, analyze it in Python, validate it statistically, and ship a dashboard that answers an actual business question.",
    whatYoullDo: [
      "Clean messy, real business datasets",
      "Write real SQL queries against a live database",
      "Analyze data in Excel and Python (pandas)",
      "Run statistical tests, correlation, and regression",
      "Choose the right chart and spot a misleading one",
      "Build dashboard-style analyses in Tableau and Power BI",
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
          "A short, honest self-check that routes you to Module 1, 3, or 5, plus what data analysts and data scientists actually do and exactly what Modules 1-9 will (and won't) teach you.",
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
    ],
  },
  {
    id: "ai-engineering",
    name: "AI Engineering",
    category: "ai",
    categoryLabel: "AI and LLMs",
    available: true,
    level: "Basic programming logic required, no prior Python needed",
    duration: "8 weeks",
    weeklyTime: "~10 hrs/week",
    price: "$99",
    summary:
      "The exact stack behind VoyAI and SmartRevise: prompting, retrieval, agents, tool use, structured outputs, and evaluation, applied to a real shipped product, not a toy chatbot.",
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
    labBadgeColor: { bg: "#c6f432", text: "#0f1405" },
  },
  {
    id: "ai-assisted-software-engineering",
    name: "AI-Assisted Software Engineering",
    category: "ai",
    categoryLabel: "AI and LLMs",
    available: false,
    level: "Intermediate, some coding experience",
    duration: "Coming soon",
    summary:
      "Ship production code with an AI coding agent without letting it quietly wreck your codebase: prompting for code, reviewing AI output like a skeptic, and knowing exactly what to hand off versus do yourself.",
    whatYoullDo: [
      "Scaffold real code from a spec with a coding agent",
      "Read AI-generated code like a reviewer, not a customer",
      "Debug with an AI agent without losing the actual root cause",
      "Verify AI-written tests actually test something",
      "Run a multi-file refactor with an agent and check its work",
      "Review an AI-authored pull request for security and logic regressions",
    ],
    topics: ["AI Pair Programming", "Code Review", "Debugging", "Testing", "Refactoring", "Prompt Engineering"],
    facts: [
      "AI-generated code that compiles and looks plausible can still call an API that doesn't exist.",
      "The bottleneck in AI-assisted development is review discipline, not how fast the agent writes code.",
      "A test an AI agent writes for its own code can pass while testing nothing real.",
    ],
    careerPath:
      "A real shipped feature built and reviewed with an AI coding agent, plus the review habits that keep you accountable for code you didn't type yourself.",
    labBadgeColor: { bg: "#60a5fa", text: "#0b1220" },
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
    id: "automation-engineering",
    name: "Automation Engineering",
    category: "automation",
    categoryLabel: "Automation",
    available: false,
    level: "Intermediate",
    duration: "8 modules",
    summary:
      "Design production-grade workflows the way agencies actually ship them: API integrations, error handling, queues, retries, self-hosting, and where an AI agent belongs (and doesn't) inside an automated pipeline.",
    whatYoullDo: [
      "Design workflow architecture for a real integration",
      "Authenticate against and call real third-party APIs",
      "Handle errors, timeouts, and unexpected data",
      "Build retry logic that doesn't create duplicate actions",
      "Self-host and monitor a running workflow",
      "Add an AI decision step to a workflow without losing determinism where it matters",
      "Put guardrails around an agentic automation step so it can't run away",
    ],
    topics: ["APIs", "Error Handling", "Queues", "Retries", "Self-Hosting", "Monitoring", "AI Orchestration"],
    facts: [
      "A good workflow needs failure handling, not just a happy path.",
      "APIs often return errors, timeouts, or unexpected data.",
      "Retries without limits can create duplicate actions.",
      "Queues help separate incoming work from processing.",
      "Automation is often about eliminating repetitive decisions, not just clicking faster.",
      "An AI step in a workflow still needs the same retry and idempotency discipline as any API call.",
    ],
    careerPath:
      "A portfolio automation system you can demo on a sales call, and the pricing/positioning to land clients paying for it.",
    labBadgeColor: { bg: "#22d3ee", text: "#04272b" },
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

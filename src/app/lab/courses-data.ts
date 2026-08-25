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

export type CourseCategory = "data" | "ai" | "automation" | "blockchain";

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
  /** Real, permanent (not a limited-time offer) list price this course discounts from, when it has one. */
  originalPrice?: string;
  /** Real percent-off, computed from price/originalPrice, not a marketing round-number. */
  discountPercent?: number;
  summary: string;
  whatYoullDo: string[];
  topics: string[];
  facts: string[];
  careerPath: string;
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
      "Design production-grade workflows the way agencies actually ship them: API integrations, error handling, queues, retries, and self-hosting.",
    whatYoullDo: [
      "Design workflow architecture for a real integration",
      "Authenticate against and call real third-party APIs",
      "Handle errors, timeouts, and unexpected data",
      "Build retry logic that doesn't create duplicate actions",
      "Self-host and monitor a running workflow",
    ],
    topics: ["APIs", "Error Handling", "Queues", "Retries", "Self-Hosting", "Monitoring"],
    facts: [
      "A good workflow needs failure handling, not just a happy path.",
      "APIs often return errors, timeouts, or unexpected data.",
      "Retries without limits can create duplicate actions.",
      "Queues help separate incoming work from processing.",
      "Automation is often about eliminating repetitive decisions, not just clicking faster.",
    ],
    careerPath:
      "A portfolio automation system you can demo on a sales call, and the pricing/positioning to land clients paying for it.",
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
  },
];

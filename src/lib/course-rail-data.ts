/* Canonical per-course rail data, mirroring what each course's own
   course-rail.js / course-progress.js define client-side. This is the single
   place route.ts and course-rail-template.ts read from to server-render the
   sidebar shell — the alternative (duplicating rendered markup into every
   HTML file) was rejected because a nav or module change would then require
   editing ~150 files instead of one. The module id/title/file list is
   necessarily duplicated (once here, once in each course's own
   course-progress.js, which still owns lock/completion logic client-side),
   but that's a small, stable list, not markup. */

export type RailNavItem = [file: string, label: string];
export type RailNavGroup = { id: string; label: string; items: RailNavItem[] };
export type RailModule = { id: number; file: string; title: string };
export type RailStage = { label: string; title: string; modules: number[] };
export type RailTicket = { id: string };

export type CourseRailData = {
  title: string;
  navGroups: RailNavGroup[];
  modules: RailModule[];
  stages: RailStage[];
  hasModuleZero: boolean;
  tickets?: Record<number, RailTicket>;
};

export const COURSE_RAIL_DATA: Record<string, CourseRailData> = {
  "data-science": {
    title: "Data Science & Analysis",
    hasModuleZero: true,
    navGroups: [
      { id: "learn", label: "Learn", items: [
        ["dashboard.html", "Dashboard"],
        ["syllabus.html", "Syllabus"],
        ["learning-roadmap.html", "Learning Roadmap"],
        ["cheatsheets.html", "Cheat Sheets"],
        ["python-survival-guide.html", "Python Survival Guide"],
      ] },
      { id: "practice", label: "Practice", items: [
        ["quiz-center.html", "Quiz Center"],
        ["practice-sql.html", "SQL Practice"],
        ["practice-excel.html", "Excel Practice"],
        ["practice-python.html", "Python Practice"],
        ["practice-statistics.html", "Statistics Practice"],
        ["practice-automation.html", "Automation Practice"],
        ["practice-integrated.html", "Integrated Challenges"],
        ["diagnostic.html", "Skill Diagnostic"],
        ["mastery-profile.html", "Mastery Profile"],
      ] },
      { id: "decide", label: "Decide · simulations", items: [
        ["practice-tableau.html", "Tableau Practice"],
        ["practice-powerbi.html", "Power BI Practice"],
      ] },
      { id: "build", label: "Build", items: [
        ["desktop-labs.html", "Desktop Labs (required)"],
        ["projects.html", "Projects"],
        ["deploy-guide.html", "Deploy Guide"],
      ] },
      { id: "evidence", label: "Evidence", items: [
        ["portfolio.html", "My Portfolio"],
        ["career.html", "Career Path"],
      ] },
    ],
    modules: [
      { id: 1, file: "module-01.html", title: "Spreadsheet & Data Literacy Foundations" },
      { id: 2, file: "module-02.html", title: "Python Foundations for Data" },
      { id: 3, file: "module-03.html", title: "Pandas & NumPy Fundamentals" },
      { id: 4, file: "module-04.html", title: "Data Cleaning & Validation" },
      { id: 5, file: "module-05.html", title: "Exploratory Data Analysis & Statistics" },
      { id: 6, file: "module-06.html", title: "SQL for Analysts" },
      { id: 7, file: "module-07.html", title: "Data Visualization & Storytelling" },
      { id: 8, file: "module-08.html", title: "Dashboards & Business Communication" },
      { id: 9, file: "module-09.html", title: "Capstone Analysis Project" },
    ],
    stages: [
      { label: "Stage 0", title: "Spreadsheets before code", modules: [1] },
      { label: "Stage 1", title: "Python foundations for data", modules: [2, 3] },
      { label: "Stage 2", title: "Real-world data skills", modules: [4, 5] },
      { label: "Stage 3", title: "Querying and communicating", modules: [6, 7, 8] },
      { label: "Stage 4", title: "Capstone", modules: [9] },
    ],
  },

  "ai-engineering": {
    title: "AI Engineering",
    hasModuleZero: true,
    navGroups: [
      { id: "learn", label: "Learn", items: [
        ["dashboard.html", "Dashboard"],
        ["syllabus.html", "Syllabus"],
        ["learning-roadmap.html", "Learning Roadmap"],
        ["cheatsheets.html", "Cheat Sheets"],
        ["python-foundations.html", "Python Foundations"],
      ] },
      { id: "practice", label: "Practice", items: [
        ["quiz-center.html", "Quiz Center"],
        ["challenges.html", "Challenges"],
      ] },
      { id: "build", label: "Build", items: [
        ["projects.html", "Projects"],
      ] },
      { id: "evidence", label: "Evidence", items: [
        ["final-assessment.html", "Final Assessment"],
        ["portfolio.html", "My Portfolio"],
        ["career.html", "Career Path"],
      ] },
    ],
    modules: [
      { id: 1, file: "module-01.html", title: "Prompting & Structured Outputs" },
      { id: 2, file: "module-02.html", title: "Context Windows & Token Economics" },
      { id: 3, file: "module-03.html", title: "Retrieval-Augmented Generation" },
      { id: 4, file: "module-04.html", title: "Tool Use & Function Calling" },
      { id: 5, file: "module-05.html", title: "Agent Architectures & Control Flow" },
      { id: 6, file: "module-06.html", title: "Reliability for LLM Systems" },
      { id: 7, file: "module-07.html", title: "Evaluation, Testing & Observability" },
      { id: 8, file: "module-08.html", title: "Capstone: A Production AI Agent" },
    ],
    stages: [
      { label: "Stage 0", title: "Prompting foundations", modules: [1, 2] },
      { label: "Stage 1", title: "Retrieval and tools", modules: [3, 4] },
      { label: "Stage 2", title: "Agents in production", modules: [5, 6, 7] },
      { label: "Stage 3", title: "Capstone", modules: [8] },
    ],
  },

  "automation-engineering": {
    title: "AI Automation",
    hasModuleZero: true,
    navGroups: [
      { id: "learn", label: "Learn", items: [
        ["dashboard.html", "Dashboard"],
        ["syllabus.html", "Syllabus"],
        ["learning-roadmap.html", "Learning Roadmap"],
        ["cheatsheets.html", "Cheat Sheets"],
      ] },
      { id: "practice", label: "Practice", items: [
        ["quiz-center.html", "Quiz Center"],
        ["practice-workflows.html", "Workflow Practice"],
        ["practice-apis.html", "API Practice"],
        ["practice-reliability.html", "Reliability Practice"],
        ["practice-ai.html", "AI-Step Practice"],
      ] },
      { id: "build", label: "Build", items: [
        ["projects.html", "Projects"],
      ] },
      { id: "evidence", label: "Evidence", items: [
        ["portfolio.html", "Portfolio"],
        ["career.html", "Career Path"],
      ] },
    ],
    modules: [
      { id: 1, file: "module-01.html", title: "Your First Client Workflow" },
      { id: 2, file: "module-02.html", title: "Data That Moves" },
      { id: 3, file: "module-03.html", title: "APIs, Webhooks & Auth" },
      { id: 4, file: "module-04.html", title: "When Things Fail" },
      { id: 5, file: "module-05.html", title: "Do It Once" },
      { id: 6, file: "module-06.html", title: "AI as a Step, Not a Brain" },
      { id: 7, file: "module-07.html", title: "Agents That Can't Run Away" },
      { id: 8, file: "module-08.html", title: "Capstone: A Client-Ready Lead Pipeline" },
    ],
    stages: [
      { label: "Stage 0", title: "Workflow foundations", modules: [1, 2] },
      { label: "Stage 1", title: "Real integrations", modules: [3, 4] },
      { label: "Stage 2", title: "Production discipline", modules: [5, 6, 7] },
      { label: "Stage 3", title: "Capstone", modules: [8] },
    ],
  },

  "ai-assisted-software-engineering": {
    title: "AI-Assisted Software Engineering",
    hasModuleZero: false,
    navGroups: [
      { id: "learn", label: "Learn", items: [
        ["dashboard.html", "Dashboard"],
        ["syllabus.html", "Syllabus"],
        ["tickets.html", "Ticket board"],
        ["learning-roadmap.html", "Learning Roadmap"],
        ["cheatsheets.html", "Cheat Sheets"],
      ] },
      { id: "practice", label: "Practice", items: [
        ["quiz-center.html", "Quiz Center"],
        ["practice-html.html", "HTML"],
        ["practice-css.html", "CSS"],
        ["practice-js.html", "JavaScript"],
        ["practice-testing.html", "Testing"],
        ["practice-python.html", "Python"],
        ["practice-detective.html", "AI Code Detective"],
        ["diagnostic.html", "Skill Diagnostic"],
        ["mastery-profile.html", "Mastery Profile"],
      ] },
      { id: "decide", label: "Decide · simulations", items: [
        ["practice-specs.html", "Specs Lab"],
        ["practice-git.html", "Git Lab"],
        ["practice-review.html", "PR Review Lab"],
        ["practice-integrated.html", "Integrated"],
        ["ai-review.html", "AI Review Lab"],
        ["interview.html", "Interview"],
        ["incident.html", "Incident"],
        ["release-review.html", "Release review"],
      ] },
      { id: "build", label: "Build", items: [
        ["desktop-labs.html", "Desktop Labs"],
        ["work-session.html", "AI work session"],
        ["projects.html", "Projects"],
        ["deploy-guide.html", "Deploy Guide"],
      ] },
      { id: "evidence", label: "Evidence", items: [
        ["passport.html", "Evidence Passport"],
        ["portfolio.html", "Portfolio"],
        ["career.html", "Career Path"],
        ["graduation.html", "Graduation"],
      ] },
    ],
    modules: [
      { id: 1, file: "module-01.html", title: "Your first shipped change" },
      { id: 2, file: "module-02.html", title: "Requirements: turning “make it better” into work" },
      { id: 3, file: "module-03.html", title: "HTML: the structure under every page" },
      { id: 4, file: "module-04.html", title: "CSS: layout that survives a phone" },
      { id: 5, file: "module-05.html", title: "JavaScript: logic you can defend" },
      { id: 6, file: "module-06.html", title: "The DOM, events, and data that arrives late" },
      { id: 14, file: "module-14.html", title: "Prompt Engineering for Software Engineers" },
      { id: 7, file: "module-07.html", title: "AI as your pair programmer" },
      { id: 8, file: "module-08.html", title: "AI Code Detective" },
      { id: 9, file: "module-09.html", title: "Testing and debugging under pressure" },
      { id: 10, file: "module-10.html", title: "Git, GitHub, and code review" },
      { id: 11, file: "module-11.html", title: "Refactoring, security, and maintenance" },
      { id: 12, file: "module-12.html", title: "Python for scripts and small tools" },
      { id: 13, file: "module-13.html", title: "Release: ship the application" },
    ],
    stages: [
      { label: "Stage 0", title: "Welcome to AI-assisted development", modules: [1] },
      { label: "Stage 1", title: "Think like a software engineer", modules: [2] },
      { label: "Stage 2", title: "Understand the web", modules: [3, 4, 5, 6] },
      { label: "Stage 3", title: "AI as your pair programmer", modules: [14, 7, 8] },
      { label: "Stage 4", title: "Engineering discipline", modules: [9, 10, 11] },
      { label: "Stage 5", title: "Release and ship", modules: [12, 13] },
    ],
    tickets: {
      1: { id: "NL-001" }, 2: { id: "NL-002" }, 3: { id: "NL-003" }, 4: { id: "NL-004" },
      5: { id: "NL-005" }, 6: { id: "NL-006" }, 14: { id: "NL-014" }, 7: { id: "NL-007" },
      8: { id: "NL-008" }, 9: { id: "NL-009" }, 10: { id: "NL-010" }, 11: { id: "NL-011" },
      12: { id: "NL-012" }, 13: { id: "NL-013" },
    },
  },

  /* A "react" course (see if-we-work-on-adaptive-raccoon.md): served by real
     Next.js pages under /lab/math-for-ml/learn, not the static contentDir
     route, but this data still backs both the marketing page's "Inside the
     course" section and the real in-course sidebar (CourseRail.tsx) exactly
     like every static course above. Only Module 1 is real content — this
     list is only extended as modules are actually built, on purpose. */
  "math-for-ml": {
    title: "Mathematics for Machine Learning",
    hasModuleZero: true,
    navGroups: [
      { id: "learn", label: "Learn", items: [
        ["diagnostic", "Skill Diagnostic"],
        ["cheatsheet", "Cheat Sheet"],
      ] },
      { id: "foundation", label: "Foundation Bridge (optional)", items: [
        ["foundation-a-algebra", "A: Algebra for ML"],
        ["foundation-b-graphs", "B: Graphs and Functions"],
        ["foundation-c-notation", "C: Mathematical Notation"],
      ] },
      { id: "practice", label: "Practice", items: [
        ["practice", "Practice Library"],
        ["math-detective", "Math Detective"],
      ] },
      { id: "build", label: "Build", items: [
        ["project-similarity-engine", "Project: Similarity Engine"],
        ["project-pca-explorer", "Project: PCA Explorer"],
        ["project-gradient-descent", "Project: Gradient Descent"],
        ["project-probability-simulator", "Project: Probability Simulator"],
        ["project-neural-network", "Project: Neural Network"],
        ["capstone", "Capstone"],
      ] },
    ],
    modules: [
      { id: 1, file: "01-vectors", title: "Thinking in Vectors" },
      { id: 2, file: "02-matrices", title: "Transforming Data" },
      { id: 3, file: "03-pca", title: "Finding the Important Directions" },
      { id: 4, file: "04-calculus", title: "Mathematics of Change" },
      { id: 5, file: "05-optimization", title: "How Models Learn" },
      { id: 6, file: "06-probability", title: "Reasoning Under Uncertainty" },
      { id: 7, file: "07-statistics", title: "Learning From Data" },
      { id: 8, file: "08-likelihood", title: "Probability Meets Machine Learning" },
      { id: 9, file: "09-information", title: "Information and Loss" },
      { id: 10, file: "10-neural-networks", title: "The Mathematics of a Neural Network" },
      { id: 11, file: "11-attention", title: "The Math Behind Attention" },
    ],
    stages: [
      { label: "Stage 1", title: "Thinking in vectors", modules: [1] },
      { label: "Stage 2", title: "Transforming data", modules: [2] },
      { label: "Stage 3", title: "Finding the important directions", modules: [3] },
      { label: "Stage 4", title: "Mathematics of change", modules: [4] },
      { label: "Stage 5", title: "Optimization", modules: [5] },
      { label: "Stage 6", title: "Probability", modules: [6] },
      { label: "Stage 7", title: "Statistics", modules: [7] },
      { label: "Stage 8", title: "Probability meets ML", modules: [8] },
      { label: "Stage 9", title: "Information and loss", modules: [9] },
      { label: "Stage 10", title: "Deep learning mathematics", modules: [10] },
      { label: "Stage 11", title: "Modern ML connections", modules: [11] },
    ],
  },
};

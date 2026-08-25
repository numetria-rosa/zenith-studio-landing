/* Zenith Lab, Data Science & Analysis: shared cross-library skill map.
   Extracted from every practice-*.html file's own TASKS array (id, skill,
   tool, level only, not the task content itself, hints/prompts/reference
   answers stay in each library, this is purely the metadata needed to
   compute mastery across libraries without loading all 7 of them).
   Consumed by dashboard.html, mastery-profile.html, diagnostic.html, and
   career.html to answer "what does this student actually know" from real,
   already-persisted PracticeProgress evidence (localStorage key
   zenith_ds_practice_v1, shared by every practice-*.html page), never a
   separate, duplicate progress system. Regenerate with _gen_skillmap.py
   (repo root of this course) if a library's TASKS array changes shape;
   this file is not hand-maintained per task. */
(function (global) {
  const TOOL_LIBRARIES = {
  "sql": "practice-sql.html",
  "excel": "practice-excel.html",
  "python": "practice-python.html",
  "tableau": "practice-tableau.html",
  "powerbi": "practice-powerbi.html",
  "automation": "practice-automation.html",
  "integrated": "practice-integrated.html"
  };

  /* Every practice task in the course, id/skill/tool/level only. 275
     entries, one per task across the 7 practice-*.html libraries (Excel
     35, SQL 60, Python 50, Tableau 40, Power BI 40, Automation 30,
     Integrated Cross-Tool Challenges 20). Portfolio Projects (10) are
     tracked separately via CourseProgress.PROJECTS, a different evidence
     system (self-assessed rubric, not auto-graded task passes), rolled
     up into the "Portfolio / Project Delivery" master skill below. */
  const TASKS = [
  { id: "sql-f01", skill: "sql-fundamentals", tool: "sql", level: "guided" },
  { id: "sql-f02", skill: "sql-fundamentals", tool: "sql", level: "guided" },
  { id: "sql-f03", skill: "sql-fundamentals", tool: "sql", level: "guided" },
  { id: "sql-f04", skill: "sql-fundamentals", tool: "sql", level: "guided" },
  { id: "sql-f05", skill: "sql-fundamentals", tool: "sql", level: "guided" },
  { id: "sql-f06", skill: "sql-fundamentals", tool: "sql", level: "semiguided" },
  { id: "sql-f07", skill: "sql-fundamentals", tool: "sql", level: "semiguided" },
  { id: "sql-f08", skill: "sql-fundamentals", tool: "sql", level: "semiguided" },
  { id: "sql-f09", skill: "sql-fundamentals", tool: "sql", level: "semiguided" },
  { id: "sql-f10", skill: "sql-fundamentals", tool: "sql", level: "challenge" },
  { id: "sql-a01", skill: "sql-aggregation", tool: "sql", level: "guided" },
  { id: "sql-a02", skill: "sql-aggregation", tool: "sql", level: "guided" },
  { id: "sql-a03", skill: "sql-aggregation", tool: "sql", level: "guided" },
  { id: "sql-a04", skill: "sql-aggregation", tool: "sql", level: "guided" },
  { id: "sql-a05", skill: "sql-aggregation", tool: "sql", level: "guided" },
  { id: "sql-a06", skill: "sql-aggregation", tool: "sql", level: "semiguided" },
  { id: "sql-a07", skill: "sql-aggregation", tool: "sql", level: "semiguided" },
  { id: "sql-a08", skill: "sql-aggregation", tool: "sql", level: "semiguided" },
  { id: "sql-a09", skill: "sql-aggregation", tool: "sql", level: "semiguided" },
  { id: "sql-a10", skill: "sql-aggregation", tool: "sql", level: "challenge" },
  { id: "sql-j01", skill: "sql-joins", tool: "sql", level: "guided" },
  { id: "sql-j02", skill: "sql-joins", tool: "sql", level: "guided" },
  { id: "sql-j03", skill: "sql-joins", tool: "sql", level: "guided" },
  { id: "sql-j04", skill: "sql-joins", tool: "sql", level: "semiguided" },
  { id: "sql-j05", skill: "sql-joins", tool: "sql", level: "semiguided" },
  { id: "sql-j06", skill: "sql-joins", tool: "sql", level: "semiguided" },
  { id: "sql-j07", skill: "sql-joins", tool: "sql", level: "challenge" },
  { id: "sql-j08", skill: "sql-joins", tool: "sql", level: "challenge" },
  { id: "sql-j09", skill: "sql-joins", tool: "sql", level: "challenge" },
  { id: "sql-j10", skill: "sql-joins", tool: "sql", level: "challenge" },
  { id: "sql-d01", skill: "sql-advanced", tool: "sql", level: "guided" },
  { id: "sql-d02", skill: "sql-advanced", tool: "sql", level: "guided" },
  { id: "sql-d03", skill: "sql-advanced", tool: "sql", level: "guided" },
  { id: "sql-d04", skill: "sql-advanced", tool: "sql", level: "semiguided" },
  { id: "sql-d05", skill: "sql-advanced", tool: "sql", level: "semiguided" },
  { id: "sql-d06", skill: "sql-advanced", tool: "sql", level: "semiguided" },
  { id: "sql-d07", skill: "sql-advanced", tool: "sql", level: "challenge" },
  { id: "sql-d08", skill: "sql-advanced", tool: "sql", level: "challenge" },
  { id: "sql-d09", skill: "sql-advanced", tool: "sql", level: "challenge" },
  { id: "sql-d10", skill: "sql-advanced", tool: "sql", level: "mastery" },
  { id: "sql-w01", skill: "sql-window", tool: "sql", level: "guided" },
  { id: "sql-w02", skill: "sql-window", tool: "sql", level: "guided" },
  { id: "sql-w03", skill: "sql-window", tool: "sql", level: "guided" },
  { id: "sql-w04", skill: "sql-window", tool: "sql", level: "guided" },
  { id: "sql-w05", skill: "sql-window", tool: "sql", level: "semiguided" },
  { id: "sql-w06", skill: "sql-window", tool: "sql", level: "semiguided" },
  { id: "sql-w07", skill: "sql-window", tool: "sql", level: "semiguided" },
  { id: "sql-w08", skill: "sql-window", tool: "sql", level: "challenge" },
  { id: "sql-w09", skill: "sql-window", tool: "sql", level: "challenge" },
  { id: "sql-w10", skill: "sql-window", tool: "sql", level: "mastery" },
  { id: "sql-b01", skill: "sql-business", tool: "sql", level: "guided" },
  { id: "sql-b02", skill: "sql-business", tool: "sql", level: "guided" },
  { id: "sql-b03", skill: "sql-business", tool: "sql", level: "guided" },
  { id: "sql-b04", skill: "sql-business", tool: "sql", level: "semiguided" },
  { id: "sql-b05", skill: "sql-business", tool: "sql", level: "semiguided" },
  { id: "sql-b06", skill: "sql-business", tool: "sql", level: "semiguided" },
  { id: "sql-b07", skill: "sql-business", tool: "sql", level: "challenge" },
  { id: "sql-b08", skill: "sql-business", tool: "sql", level: "challenge" },
  { id: "sql-b09", skill: "sql-business", tool: "sql", level: "challenge" },
  { id: "sql-b10", skill: "sql-business", tool: "sql", level: "mastery" },
  { id: "xl-f01", skill: "excel-fundamentals", tool: "excel", level: "guided" },
  { id: "xl-f02", skill: "excel-fundamentals", tool: "excel", level: "guided" },
  { id: "xl-f03", skill: "excel-fundamentals", tool: "excel", level: "guided" },
  { id: "xl-f04", skill: "excel-fundamentals", tool: "excel", level: "guided" },
  { id: "xl-f05", skill: "excel-fundamentals", tool: "excel", level: "guided" },
  { id: "xl-f06", skill: "excel-fundamentals", tool: "excel", level: "guided" },
  { id: "xl-f07", skill: "excel-fundamentals", tool: "excel", level: "semiguided" },
  { id: "xl-f08", skill: "excel-fundamentals", tool: "excel", level: "semiguided" },
  { id: "xl-f09", skill: "excel-fundamentals", tool: "excel", level: "semiguided" },
  { id: "xl-f10", skill: "excel-fundamentals", tool: "excel", level: "challenge" },
  { id: "xl-s01", skill: "excel-lookups", tool: "excel", level: "guided" },
  { id: "xl-s02", skill: "excel-lookups", tool: "excel", level: "guided" },
  { id: "xl-s03", skill: "excel-lookups", tool: "excel", level: "guided" },
  { id: "xl-s04", skill: "excel-lookups", tool: "excel", level: "guided" },
  { id: "xl-s05", skill: "excel-lookups", tool: "excel", level: "semiguided" },
  { id: "xl-s06", skill: "excel-lookups", tool: "excel", level: "semiguided" },
  { id: "xl-s07", skill: "excel-lookups", tool: "excel", level: "semiguided" },
  { id: "xl-s08", skill: "excel-lookups", tool: "excel", level: "challenge" },
  { id: "xl-s09", skill: "excel-lookups", tool: "excel", level: "challenge" },
  { id: "xl-s10", skill: "excel-lookups", tool: "excel", level: "mastery" },
  { id: "xl-t01", skill: "excel-text-lookup", tool: "excel", level: "guided" },
  { id: "xl-t02", skill: "excel-text-lookup", tool: "excel", level: "guided" },
  { id: "xl-t03", skill: "excel-text-lookup", tool: "excel", level: "guided" },
  { id: "xl-t04", skill: "excel-text-lookup", tool: "excel", level: "guided" },
  { id: "xl-t05", skill: "excel-text-lookup", tool: "excel", level: "semiguided" },
  { id: "xl-t06", skill: "excel-text-lookup", tool: "excel", level: "semiguided" },
  { id: "xl-t07", skill: "excel-text-lookup", tool: "excel", level: "semiguided" },
  { id: "xl-t08", skill: "excel-text-lookup", tool: "excel", level: "challenge" },
  { id: "xl-t09", skill: "excel-text-lookup", tool: "excel", level: "challenge" },
  { id: "xl-t10", skill: "excel-text-lookup", tool: "excel", level: "mastery" },
  { id: "xl-b01", skill: "excel-business", tool: "excel", level: "guided" },
  { id: "xl-b02", skill: "excel-business", tool: "excel", level: "semiguided" },
  { id: "xl-b03", skill: "excel-business", tool: "excel", level: "challenge" },
  { id: "xl-b04", skill: "excel-business", tool: "excel", level: "challenge" },
  { id: "xl-b05", skill: "excel-business", tool: "excel", level: "mastery" },
  { id: "py-f01", skill: "python-fundamentals", tool: "python", level: "guided" },
  { id: "py-f02", skill: "python-fundamentals", tool: "python", level: "guided" },
  { id: "py-f03", skill: "python-fundamentals", tool: "python", level: "guided" },
  { id: "py-f04", skill: "python-fundamentals", tool: "python", level: "guided" },
  { id: "py-f05", skill: "python-fundamentals", tool: "python", level: "semiguided" },
  { id: "py-f06", skill: "python-fundamentals", tool: "python", level: "semiguided" },
  { id: "py-f07", skill: "python-fundamentals", tool: "python", level: "semiguided" },
  { id: "py-f08", skill: "python-fundamentals", tool: "python", level: "challenge" },
  { id: "py-f09", skill: "python-fundamentals", tool: "python", level: "challenge" },
  { id: "py-f10", skill: "python-fundamentals", tool: "python", level: "mastery" },
  { id: "py-p01", skill: "python-pandas", tool: "python", level: "guided" },
  { id: "py-p02", skill: "python-pandas", tool: "python", level: "guided" },
  { id: "py-p03", skill: "python-pandas", tool: "python", level: "guided" },
  { id: "py-p04", skill: "python-pandas", tool: "python", level: "guided" },
  { id: "py-p05", skill: "python-pandas", tool: "python", level: "semiguided" },
  { id: "py-p06", skill: "python-pandas", tool: "python", level: "semiguided" },
  { id: "py-p07", skill: "python-pandas", tool: "python", level: "semiguided" },
  { id: "py-p08", skill: "python-pandas", tool: "python", level: "challenge" },
  { id: "py-p09", skill: "python-pandas", tool: "python", level: "challenge" },
  { id: "py-p10", skill: "python-pandas", tool: "python", level: "mastery" },
  { id: "py-c01", skill: "python-cleaning", tool: "python", level: "guided" },
  { id: "py-c02", skill: "python-cleaning", tool: "python", level: "guided" },
  { id: "py-c03", skill: "python-cleaning", tool: "python", level: "guided" },
  { id: "py-c04", skill: "python-cleaning", tool: "python", level: "guided" },
  { id: "py-c05", skill: "python-cleaning", tool: "python", level: "semiguided" },
  { id: "py-c06", skill: "python-cleaning", tool: "python", level: "semiguided" },
  { id: "py-c07", skill: "python-cleaning", tool: "python", level: "semiguided" },
  { id: "py-c08", skill: "python-cleaning", tool: "python", level: "challenge" },
  { id: "py-c09", skill: "python-cleaning", tool: "python", level: "challenge" },
  { id: "py-c10", skill: "python-cleaning", tool: "python", level: "mastery" },
  { id: "py-e01", skill: "python-eda", tool: "python", level: "guided" },
  { id: "py-e02", skill: "python-eda", tool: "python", level: "guided" },
  { id: "py-e03", skill: "python-eda", tool: "python", level: "guided" },
  { id: "py-e04", skill: "python-eda", tool: "python", level: "guided" },
  { id: "py-e05", skill: "python-eda", tool: "python", level: "semiguided" },
  { id: "py-e06", skill: "python-eda", tool: "python", level: "semiguided" },
  { id: "py-e07", skill: "python-eda", tool: "python", level: "semiguided" },
  { id: "py-e08", skill: "python-eda", tool: "python", level: "challenge" },
  { id: "py-e09", skill: "python-eda", tool: "python", level: "challenge" },
  { id: "py-e10", skill: "python-eda", tool: "python", level: "mastery" },
  { id: "py-b01", skill: "python-business", tool: "python", level: "guided" },
  { id: "py-b02", skill: "python-business", tool: "python", level: "guided" },
  { id: "py-b03", skill: "python-business", tool: "python", level: "guided" },
  { id: "py-b04", skill: "python-business", tool: "python", level: "guided" },
  { id: "py-b05", skill: "python-business", tool: "python", level: "semiguided" },
  { id: "py-b06", skill: "python-business", tool: "python", level: "semiguided" },
  { id: "py-b07", skill: "python-business", tool: "python", level: "semiguided" },
  { id: "py-b08", skill: "python-business", tool: "python", level: "challenge" },
  { id: "py-b09", skill: "python-business", tool: "python", level: "challenge" },
  { id: "py-b10", skill: "python-business", tool: "python", level: "mastery" },
  { id: "tb-f01", skill: "tableau-fields", tool: "tableau", level: "guided" },
  { id: "tb-f02", skill: "tableau-fields", tool: "tableau", level: "guided" },
  { id: "tb-f03", skill: "tableau-shelves", tool: "tableau", level: "guided" },
  { id: "tb-f04", skill: "tableau-shelves", tool: "tableau", level: "guided" },
  { id: "tb-f05", skill: "tableau-shelves", tool: "tableau", level: "guided" },
  { id: "tb-f06", skill: "tableau-chart-choice", tool: "tableau", level: "guided" },
  { id: "tb-f07", skill: "tableau-shelves", tool: "tableau", level: "semiguided" },
  { id: "tb-f08", skill: "tableau-shelves", tool: "tableau", level: "challenge" },
  { id: "tb-f09", skill: "tableau-chart-choice", tool: "tableau", level: "challenge" },
  { id: "tb-f10", skill: "tableau-chart-choice", tool: "tableau", level: "mastery" },
  { id: "tb-v01", skill: "tableau-table-calcs", tool: "tableau", level: "guided" },
  { id: "tb-v02", skill: "tableau-table-calcs", tool: "tableau", level: "guided" },
  { id: "tb-v03", skill: "tableau-table-calcs", tool: "tableau", level: "guided" },
  { id: "tb-v04", skill: "tableau-analytics-pane", tool: "tableau", level: "guided" },
  { id: "tb-v05", skill: "tableau-analytics-pane", tool: "tableau", level: "semiguided" },
  { id: "tb-v06", skill: "tableau-table-calcs", tool: "tableau", level: "semiguided" },
  { id: "tb-v07", skill: "tableau-analytics-pane", tool: "tableau", level: "semiguided" },
  { id: "tb-v08", skill: "tableau-analytics-pane", tool: "tableau", level: "challenge" },
  { id: "tb-v09", skill: "tableau-table-calcs", tool: "tableau", level: "challenge" },
  { id: "tb-v10", skill: "tableau-analytics-pane", tool: "tableau", level: "mastery" },
  { id: "tb-c01", skill: "tableau-calc-fields", tool: "tableau", level: "guided" },
  { id: "tb-c02", skill: "tableau-calc-fields", tool: "tableau", level: "guided" },
  { id: "tb-c03", skill: "tableau-calc-fields", tool: "tableau", level: "guided" },
  { id: "tb-c04", skill: "tableau-calc-fields", tool: "tableau", level: "semiguided" },
  { id: "tb-c05", skill: "tableau-calc-fields", tool: "tableau", level: "semiguided" },
  { id: "tb-c06", skill: "tableau-lod", tool: "tableau", level: "guided" },
  { id: "tb-c07", skill: "tableau-lod", tool: "tableau", level: "challenge" },
  { id: "tb-c08", skill: "tableau-lod", tool: "tableau", level: "challenge" },
  { id: "tb-c09", skill: "tableau-lod", tool: "tableau", level: "challenge" },
  { id: "tb-c10", skill: "tableau-lod", tool: "tableau", level: "mastery" },
  { id: "tb-d01", skill: "tableau-dashboard-design", tool: "tableau", level: "guided" },
  { id: "tb-d02", skill: "tableau-dashboard-design", tool: "tableau", level: "guided" },
  { id: "tb-d03", skill: "tableau-dashboard-actions", tool: "tableau", level: "guided" },
  { id: "tb-d04", skill: "tableau-dashboard-actions", tool: "tableau", level: "semiguided" },
  { id: "tb-d05", skill: "tableau-dashboard-actions", tool: "tableau", level: "semiguided" },
  { id: "tb-d06", skill: "tableau-dashboard-design", tool: "tableau", level: "semiguided" },
  { id: "tb-d07", skill: "tableau-dashboard-actions", tool: "tableau", level: "challenge" },
  { id: "tb-d08", skill: "tableau-dashboard-design", tool: "tableau", level: "challenge" },
  { id: "tb-d09", skill: "tableau-dashboard-design", tool: "tableau", level: "challenge" },
  { id: "tb-d10", skill: "tableau-dashboard-design", tool: "tableau", level: "mastery" },
  { id: "pb-f01", skill: "powerbi-fields", tool: "powerbi", level: "guided" },
  { id: "pb-f02", skill: "powerbi-fields", tool: "powerbi", level: "guided" },
  { id: "pb-f03", skill: "powerbi-visuals", tool: "powerbi", level: "guided" },
  { id: "pb-f04", skill: "powerbi-visuals", tool: "powerbi", level: "guided" },
  { id: "pb-f05", skill: "powerbi-visuals", tool: "powerbi", level: "semiguided" },
  { id: "pb-f06", skill: "powerbi-visuals", tool: "powerbi", level: "challenge" },
  { id: "pb-f07", skill: "powerbi-fields", tool: "powerbi", level: "semiguided" },
  { id: "pb-f08", skill: "powerbi-report-dashboard", tool: "powerbi", level: "guided" },
  { id: "pb-f09", skill: "powerbi-report-dashboard", tool: "powerbi", level: "challenge" },
  { id: "pb-f10", skill: "powerbi-visuals", tool: "powerbi", level: "mastery" },
  { id: "pb-q01", skill: "powerbi-data-cleaning", tool: "powerbi", level: "guided" },
  { id: "pb-q02", skill: "powerbi-data-cleaning", tool: "powerbi", level: "guided" },
  { id: "pb-q03", skill: "powerbi-data-cleaning", tool: "powerbi", level: "guided" },
  { id: "pb-q04", skill: "powerbi-combine-reshape", tool: "powerbi", level: "guided" },
  { id: "pb-q05", skill: "powerbi-combine-reshape", tool: "powerbi", level: "semiguided" },
  { id: "pb-q06", skill: "powerbi-combine-reshape", tool: "powerbi", level: "semiguided" },
  { id: "pb-q07", skill: "powerbi-data-cleaning", tool: "powerbi", level: "challenge" },
  { id: "pb-q08", skill: "powerbi-combine-reshape", tool: "powerbi", level: "challenge" },
  { id: "pb-q09", skill: "powerbi-data-cleaning", tool: "powerbi", level: "challenge" },
  { id: "pb-q10", skill: "powerbi-combine-reshape", tool: "powerbi", level: "mastery" },
  { id: "pb-m01", skill: "powerbi-dax", tool: "powerbi", level: "guided" },
  { id: "pb-m02", skill: "powerbi-data-modeling", tool: "powerbi", level: "guided" },
  { id: "pb-m03", skill: "powerbi-data-modeling", tool: "powerbi", level: "guided" },
  { id: "pb-m04", skill: "powerbi-dax", tool: "powerbi", level: "semiguided" },
  { id: "pb-m05", skill: "powerbi-dax", tool: "powerbi", level: "semiguided" },
  { id: "pb-m06", skill: "powerbi-dax", tool: "powerbi", level: "semiguided" },
  { id: "pb-m07", skill: "powerbi-dax", tool: "powerbi", level: "challenge" },
  { id: "pb-m08", skill: "powerbi-dax", tool: "powerbi", level: "challenge" },
  { id: "pb-m09", skill: "powerbi-dax", tool: "powerbi", level: "challenge" },
  { id: "pb-m10", skill: "powerbi-dax", tool: "powerbi", level: "mastery" },
  { id: "pb-d01", skill: "powerbi-report-interactivity", tool: "powerbi", level: "guided" },
  { id: "pb-d02", skill: "powerbi-report-interactivity", tool: "powerbi", level: "guided" },
  { id: "pb-d03", skill: "powerbi-report-dashboard", tool: "powerbi", level: "guided" },
  { id: "pb-d04", skill: "powerbi-report-interactivity", tool: "powerbi", level: "semiguided" },
  { id: "pb-d05", skill: "powerbi-report-interactivity", tool: "powerbi", level: "semiguided" },
  { id: "pb-d06", skill: "powerbi-service-governance", tool: "powerbi", level: "guided" },
  { id: "pb-d07", skill: "powerbi-service-governance", tool: "powerbi", level: "challenge" },
  { id: "pb-d08", skill: "powerbi-service-governance", tool: "powerbi", level: "challenge" },
  { id: "pb-d09", skill: "powerbi-service-governance", tool: "powerbi", level: "challenge" },
  { id: "pb-d10", skill: "powerbi-service-governance", tool: "powerbi", level: "mastery" },
  { id: "au-f01", skill: "automation-batch-records", tool: "automation", level: "guided" },
  { id: "au-f02", skill: "automation-text-processing", tool: "automation", level: "guided" },
  { id: "au-f03", skill: "automation-batch-records", tool: "automation", level: "guided" },
  { id: "au-f04", skill: "automation-text-processing", tool: "automation", level: "guided" },
  { id: "au-f05", skill: "automation-batch-records", tool: "automation", level: "semiguided" },
  { id: "au-f06", skill: "automation-batch-records", tool: "automation", level: "semiguided" },
  { id: "au-f07", skill: "automation-text-processing", tool: "automation", level: "semiguided" },
  { id: "au-f08", skill: "automation-batch-records", tool: "automation", level: "challenge" },
  { id: "au-f09", skill: "automation-text-processing", tool: "automation", level: "challenge" },
  { id: "au-f10", skill: "automation-batch-records", tool: "automation", level: "mastery" },
  { id: "au-r01", skill: "automation-report-generation", tool: "automation", level: "guided" },
  { id: "au-r02", skill: "automation-report-generation", tool: "automation", level: "guided" },
  { id: "au-r03", skill: "automation-report-generation", tool: "automation", level: "guided" },
  { id: "au-r04", skill: "automation-monitoring-alerts", tool: "automation", level: "guided" },
  { id: "au-r05", skill: "automation-monitoring-alerts", tool: "automation", level: "semiguided" },
  { id: "au-r06", skill: "automation-report-generation", tool: "automation", level: "semiguided" },
  { id: "au-r07", skill: "automation-monitoring-alerts", tool: "automation", level: "semiguided" },
  { id: "au-r08", skill: "automation-monitoring-alerts", tool: "automation", level: "challenge" },
  { id: "au-r09", skill: "automation-monitoring-alerts", tool: "automation", level: "challenge" },
  { id: "au-r10", skill: "automation-report-generation", tool: "automation", level: "mastery" },
  { id: "au-w01", skill: "automation-workflows", tool: "automation", level: "guided" },
  { id: "au-w02", skill: "automation-monitoring-alerts", tool: "automation", level: "guided" },
  { id: "au-w03", skill: "automation-monitoring-alerts", tool: "automation", level: "challenge" },
  { id: "au-w04", skill: "automation-workflows", tool: "automation", level: "semiguided" },
  { id: "au-w05", skill: "automation-monitoring-alerts", tool: "automation", level: "guided" },
  { id: "au-w06", skill: "automation-workflows", tool: "automation", level: "semiguided" },
  { id: "au-w07", skill: "automation-monitoring-alerts", tool: "automation", level: "semiguided" },
  { id: "au-w08", skill: "automation-monitoring-alerts", tool: "automation", level: "challenge" },
  { id: "au-w09", skill: "automation-workflows", tool: "automation", level: "challenge" },
  { id: "au-w10", skill: "automation-workflows", tool: "automation", level: "mastery" },
  { id: "ct-01", skill: "integrated-translation", tool: "integrated", level: "guided" },
  { id: "ct-02", skill: "integrated-translation", tool: "integrated", level: "guided" },
  { id: "ct-03", skill: "integrated-translation", tool: "integrated", level: "guided" },
  { id: "ct-04", skill: "integrated-tool-selection", tool: "integrated", level: "guided" },
  { id: "ct-05", skill: "integrated-tool-selection", tool: "integrated", level: "semiguided" },
  { id: "ct-06", skill: "integrated-translation", tool: "integrated", level: "semiguided" },
  { id: "ct-07", skill: "integrated-translation", tool: "integrated", level: "challenge" },
  { id: "ct-08", skill: "integrated-translation", tool: "integrated", level: "challenge" },
  { id: "ct-09", skill: "integrated-tool-selection", tool: "integrated", level: "challenge" },
  { id: "ct-10", skill: "integrated-tool-selection", tool: "integrated", level: "mastery" },
  { id: "ct-11", skill: "integrated-tool-selection", tool: "integrated", level: "guided" },
  { id: "ct-12", skill: "integrated-tool-selection", tool: "integrated", level: "guided" },
  { id: "ct-13", skill: "integrated-tool-selection", tool: "integrated", level: "semiguided" },
  { id: "ct-14", skill: "integrated-tool-selection", tool: "integrated", level: "semiguided" },
  { id: "ct-15", skill: "integrated-tool-selection", tool: "integrated", level: "challenge" },
  { id: "ct-16", skill: "integrated-stakeholder-translation", tool: "integrated", level: "guided" },
  { id: "ct-17", skill: "integrated-stakeholder-translation", tool: "integrated", level: "semiguided" },
  { id: "ct-18", skill: "integrated-stakeholder-translation", tool: "integrated", level: "semiguided" },
  { id: "ct-19", skill: "integrated-stakeholder-translation", tool: "integrated", level: "challenge" },
  { id: "ct-20", skill: "integrated-stakeholder-translation", tool: "integrated", level: "mastery" }
  ];

  /* The 41 granular skills each library already tracks (its own
     SKILLS array), label + which tool/library it belongs to. */
  const SKILL_META = {
  "sql-fundamentals": { label: "SQL Fundamentals", tool: "sql" },
  "sql-aggregation": { label: "SQL Aggregation", tool: "sql" },
  "sql-joins": { label: "SQL Joins", tool: "sql" },
  "sql-advanced": { label: "SQL Advanced", tool: "sql" },
  "sql-window": { label: "SQL Analytical / Window Functions", tool: "sql" },
  "sql-business": { label: "SQL Business Analysis", tool: "sql" },
  "excel-fundamentals": { label: "Excel Fundamentals", tool: "excel" },
  "excel-lookups": { label: "Excel Lookups & Logic", tool: "excel" },
  "excel-text-lookup": { label: "Excel Text & Error Handling", tool: "excel" },
  "excel-business": { label: "Excel Business Analysis", tool: "excel" },
  "python-fundamentals": { label: "Python Fundamentals", tool: "python" },
  "python-pandas": { label: "Python pandas", tool: "python" },
  "python-cleaning": { label: "Python Data Cleaning", tool: "python" },
  "python-eda": { label: "Python Exploratory Analysis", tool: "python" },
  "python-business": { label: "Python Business Analytics", tool: "python" },
  "tableau-fields": { label: "Tableau Field Types", tool: "tableau" },
  "tableau-shelves": { label: "Tableau Shelves & Filters", tool: "tableau" },
  "tableau-chart-choice": { label: "Tableau Chart Choice", tool: "tableau" },
  "tableau-table-calcs": { label: "Tableau Table Calculations", tool: "tableau" },
  "tableau-analytics-pane": { label: "Tableau Analytics Pane", tool: "tableau" },
  "tableau-calc-fields": { label: "Tableau Calculated Fields", tool: "tableau" },
  "tableau-lod": { label: "Tableau LOD Expressions", tool: "tableau" },
  "tableau-dashboard-design": { label: "Tableau Dashboard Design", tool: "tableau" },
  "tableau-dashboard-actions": { label: "Tableau Dashboard Actions", tool: "tableau" },
  "powerbi-fields": { label: "Power BI Column vs Measure", tool: "powerbi" },
  "powerbi-visuals": { label: "Power BI Visual Choice", tool: "powerbi" },
  "powerbi-report-dashboard": { label: "Power BI Report vs Dashboard", tool: "powerbi" },
  "powerbi-data-cleaning": { label: "Power BI Data Cleaning", tool: "powerbi" },
  "powerbi-combine-reshape": { label: "Power BI Combining & Reshaping Data", tool: "powerbi" },
  "powerbi-data-modeling": { label: "Power BI Data Modeling", tool: "powerbi" },
  "powerbi-dax": { label: "Power BI DAX", tool: "powerbi" },
  "powerbi-report-interactivity": { label: "Power BI Report Interactivity", tool: "powerbi" },
  "powerbi-service-governance": { label: "Power BI Service & Governance", tool: "powerbi" },
  "automation-text-processing": { label: "Automation Text & File Processing", tool: "automation" },
  "automation-batch-records": { label: "Automation Batch Records", tool: "automation" },
  "automation-report-generation": { label: "Automation Report Generation", tool: "automation" },
  "automation-monitoring-alerts": { label: "Automation Monitoring & Alerts", tool: "automation" },
  "automation-workflows": { label: "Automation Real-World Workflows", tool: "automation" },
  "integrated-translation": { label: "Cross-Tool Technique Translation", tool: "integrated" },
  "integrated-tool-selection": { label: "Cross-Tool Selection & Workflow", tool: "integrated" },
  "integrated-stakeholder-translation": { label: "Cross-Tool Stakeholder Translation", tool: "integrated" }
  };

  /* Task IDs that require a written business justification (checked
     against a real keyword+length validator in their own library, not
     just multiple choice), concentrated at each stage's mastery-level
     task. Backs the "Analytical Communication" master skill below. */
  const WRITTEN_TASK_IDS = ["sql-d10", "sql-w10", "sql-b10", "xl-b05", "xl-s10", "py-c10", "py-e10", "py-b10", "tb-f10", "tb-v10", "tb-c10", "tb-d10", "pb-f10", "pb-m10", "pb-d10", "au-f10", "au-r10", "au-w10", "ct-10", "ct-20"];

  /* The 21 user-facing tracked skills, each a rollup of one or more of
     the 41 granular skills above, or a "special" rollup (written-
     justification tasks, or Portfolio Project completion, neither of
     which is a single practice-library skill). A skill flagged
     "simulation" rolls up decision-based Tableau/Power BI evidence,
     never real tool execution, surfaced honestly wherever this tier is
     displayed. A skill flagged "approximate" has thinner or indirect
     evidence (no dedicated practice library exists for it yet) and
     should display its approximateNote alongside the tier. */
  const MASTER_SKILLS = [
  { id: "spreadsheet-analysis", label: "Spreadsheet Analysis", category: "Foundation", members: ["excel-fundamentals", "excel-lookups", "excel-text-lookup"] },
  { id: "python-programming", label: "Python Programming", category: "Foundation", members: ["python-fundamentals"] },
  { id: "python-data-analysis", label: "Python Data Analysis", category: "Data Handling", members: ["python-pandas", "python-cleaning"] },
  { id: "sql-fundamentals-master", label: "SQL Fundamentals", category: "Data Handling", members: ["sql-fundamentals"] },
  { id: "sql-aggregation-master", label: "SQL Aggregation", category: "Data Handling", members: ["sql-aggregation"] },
  { id: "sql-joins-master", label: "SQL Joins", category: "Data Handling", members: ["sql-joins"] },
  { id: "sql-advanced-master", label: "Advanced SQL", category: "Analysis", members: ["sql-advanced"] },
  { id: "sql-window-master", label: "Analytical SQL / Window Functions", category: "Analysis", members: ["sql-window"] },
  { id: "sql-realworld-master", label: "Real-World SQL Analysis", category: "Analysis", members: ["sql-business"] },
  { id: "data-cleaning", label: "Data Cleaning", category: "Data Handling", members: ["python-cleaning", "powerbi-data-cleaning"] },
  { id: "statistics", label: "Statistics", category: "Analysis", members: ["python-eda"], approximate: true, approximateNote: "No dedicated statistics practice library exists yet, this rolls up the closest evidence available, Python's exploratory-analysis stage (distributions, correlation vs. causation, signal-vs-noise tasks). Treat this tier as a lower-confidence signal than the other skills until a dedicated statistics library is built." },
  { id: "data-visualization", label: "Data Visualization", category: "Visualization", members: ["tableau-chart-choice", "powerbi-visuals"] },
  { id: "tableau", label: "Tableau", category: "BI", members: ["tableau-fields", "tableau-shelves", "tableau-chart-choice", "tableau-table-calcs", "tableau-analytics-pane", "tableau-calc-fields", "tableau-lod"], simulation: true },
  { id: "powerbi", label: "Power BI", category: "BI", members: ["powerbi-fields", "powerbi-visuals", "powerbi-data-cleaning", "powerbi-combine-reshape", "powerbi-data-modeling", "powerbi-dax"], simulation: true },
  { id: "dashboard-design", label: "Dashboard Design", category: "BI", members: ["tableau-dashboard-design", "tableau-dashboard-actions", "powerbi-report-dashboard", "powerbi-report-interactivity", "powerbi-service-governance"], simulation: true },
  { id: "business-analysis", label: "Business Analysis", category: "Business Analysis", members: ["sql-business", "excel-business", "python-business"] },
  { id: "automation", label: "Automation", category: "Automation", members: ["automation-text-processing", "automation-batch-records", "automation-report-generation", "automation-monitoring-alerts", "automation-workflows"] },
  { id: "analytical-communication", label: "Analytical Communication", category: "Business Analysis", special: "written", approximate: true, approximateNote: "Rolls up every task in the course that required a written business justification (concentrated at the mastery tier of each stage), not a dedicated writing curriculum, treat as a lower-confidence signal." },
  { id: "problem-solving", label: "Problem Solving", category: "Integration", members: ["integrated-tool-selection", "integrated-stakeholder-translation"] },
  { id: "cross-tool-analysis", label: "Cross-Tool Analysis", category: "Integration", members: ["integrated-translation", "integrated-tool-selection", "integrated-stakeholder-translation"] },
  { id: "portfolio-delivery", label: "Portfolio / Project Delivery", category: "Portfolio", special: "portfolio" }
  ];

  /* ---- Tier computation, reusing PracticeProgress's own mastery-ladder
     rule (guided present, 3+ passed unlocks Practicing, a challenge-level
     pass unlocks Competent, a mastery-level pass unlocks Mastered), but
     generalized to run over an ARBITRARY subset of tasks, not just one
     library's single skill tag, so a master skill can roll up evidence
     from several granular skills (or several libraries) at once.

     BREADTH GUARD: when a master skill rolls up more than one distinct
     granular skill (e.g. Business Analysis = sql-business + excel-
     business + python-business), passing every task in just ONE member
     skill while the others sit untouched must NOT be enough to reach
     Competent/Mastered, evidence concentrated in a single sub-area is
     exactly the "mastered without enough evidence" failure mode this
     course build was explicitly asked to guard against. Competent
     requires evidence touching at least half the distinct member
     skills, Mastered requires every member skill to have at least one
     passed task, "demonstrated in an integrated context" per this
     course's own tier definitions, not just deep in one corner of it. */
  function tierFromTaskSubset(taskSubset, groupCount) {
    if (typeof PracticeProgress === "undefined") return { tier: "not-started", passedCount: 0, totalCount: taskSubset.length, pct: 0 };
    const passed = taskSubset.filter((t) => PracticeProgress.getTaskState(t.id).passed);
    if (passed.length === 0) return { tier: "not-started", passedCount: 0, totalCount: taskSubset.length, pct: 0 };
    const byLevel = { guided: 0, semiguided: 0, challenge: 0, mastery: 0 };
    passed.forEach((t) => { byLevel[t.level] = (byLevel[t.level] || 0) + 1; });
    const groupsTouched = new Set(passed.map((t) => t.skill)).size;
    const groups = groupCount || 1;
    const breadthForCompetent = groups <= 1 ? 1 : Math.ceil(groups / 2);
    const breadthForMastered = groups; // every member skill needs at least one passed task
    const guidedOk = byLevel.guided >= 1;
    const practicingOk = guidedOk && passed.length >= 3;
    const competentOk = practicingOk && byLevel.challenge >= 1 && groupsTouched >= breadthForCompetent;
    const masteredOk = competentOk && byLevel.mastery >= 1 && groupsTouched >= breadthForMastered;
    let tier = "not-started";
    if (masteredOk) tier = "mastered";
    else if (competentOk) tier = "competent";
    else if (practicingOk) tier = "practicing";
    else if (guidedOk) tier = "introduced";
    return { tier, passedCount: passed.length, totalCount: taskSubset.length, pct: taskSubset.length ? Math.round((passed.length / taskSubset.length) * 100) : 0, groupsTouched, groupsTotal: groups };
  }

  function tasksForMasterSkill(masterSkillId) {
    const m = MASTER_SKILLS.find((x) => x.id === masterSkillId);
    if (!m) return [];
    if (m.special === "written") return TASKS.filter((t) => WRITTEN_TASK_IDS.indexOf(t.id) !== -1);
    if (m.special === "portfolio") return [];
    return TASKS.filter((t) => (m.members || []).indexOf(t.skill) !== -1);
  }

  /* Analytical Communication's evidence set is, by construction, EVERY
     task at mastery level (a written justification is concentrated at
     each stage's independent capstone task, never at guided level), so
     the standard ladder's own "needs at least one guided-level pass"
     gate can never be satisfied, the same mastery-ladder gap bug found
     and fixed repeatedly across every practice library this course was
     built with, now caught here in the rollup layer instead. A count-
     based scale (same shape as portfolioTier below) is the honest fix:
     since every task in this set already IS the highest rigor level,
     count of passed written tasks is itself the meaningful signal. */
  function writtenTier() {
    const subset = TASKS.filter((t) => WRITTEN_TASK_IDS.indexOf(t.id) !== -1);
    if (typeof PracticeProgress === "undefined") return { tier: "not-started", passedCount: 0, totalCount: subset.length, pct: 0 };
    const passed = subset.filter((t) => PracticeProgress.getTaskState(t.id).passed).length;
    let tier = "not-started";
    if (passed >= 16) tier = "mastered";
    else if (passed >= 10) tier = "competent";
    else if (passed >= 4) tier = "practicing";
    else if (passed >= 1) tier = "introduced";
    return { tier, passedCount: passed, totalCount: subset.length, pct: subset.length ? Math.round((passed / subset.length) * 100) : 0 };
  }

  /* Portfolio Projects use a different, separately-persisted evidence
     system (CourseProgress.PROJECTS + getProject(id).completed, a
     self-assessed rubric score, not an auto-graded task pass), so it
     gets its own tier scale rather than being forced through the
     task-based ladder above: 0 completed = Not started, 1-2 = Introduced,
     3-5 = Practicing, 6-8 = Competent, 9-10 = Mastered (all 10). */
  function portfolioTier() {
    if (typeof CourseProgress === "undefined" || !CourseProgress.PROJECTS) return { tier: "not-started", passedCount: 0, totalCount: 10, pct: 0 };
    const projects = CourseProgress.PROJECTS;
    const completed = projects.filter((p) => CourseProgress.getProject(p.id).completed).length;
    let tier = "not-started";
    if (completed >= 9) tier = "mastered";
    else if (completed >= 6) tier = "competent";
    else if (completed >= 3) tier = "practicing";
    else if (completed >= 1) tier = "introduced";
    return { tier, passedCount: completed, totalCount: projects.length, pct: projects.length ? Math.round((completed / projects.length) * 100) : 0 };
  }

  function masterSkillProgress(masterSkillId) {
    const m = MASTER_SKILLS.find((x) => x.id === masterSkillId);
    if (!m) return { tier: "not-started", passedCount: 0, totalCount: 0, pct: 0 };
    if (m.special === "portfolio") return portfolioTier();
    if (m.special === "written") return writtenTier();
    const groupCount = (m.members || []).length;
    return tierFromTaskSubset(tasksForMasterSkill(masterSkillId), groupCount);
  }

  function allMasterSkillProgress() {
    return MASTER_SKILLS.map((m) => Object.assign({ id: m.id, label: m.label, category: m.category, simulation: !!m.simulation, approximate: !!m.approximate, approximateNote: m.approximateNote || "" }, masterSkillProgress(m.id)));
  }

  /* "What should I do next?" across ALL 275 tasks (every library at
     once): the first task, in course-progression order (SQL, Excel,
     Python, Tableau, Power BI, Automation, Integrated), that hasn't
     been passed yet. Prerequisite chains are enforced within each
     library's own page (its own TASKS array carries the real
     prerequisite list), this only decides WHICH LIBRARY/task to point
     the student at next. */
  function recommendNextAcrossCourse() {
    if (typeof PracticeProgress === "undefined") return null;
    for (const t of TASKS) {
      const state = PracticeProgress.getTaskState(t.id);
      if (state.passed) continue;
      return t;
    }
    return null;
  }

  function totalTasksPassed() {
    if (typeof PracticeProgress === "undefined") return 0;
    return TASKS.filter((t) => PracticeProgress.getTaskState(t.id).passed).length;
  }

  global.SkillMap = {
    TOOL_LIBRARIES, TASKS, SKILL_META, MASTER_SKILLS, WRITTEN_TASK_IDS,
    tierFromTaskSubset, tasksForMasterSkill, masterSkillProgress, allMasterSkillProgress,
    portfolioTier, writtenTier, recommendNextAcrossCourse, totalTasksPassed,
  };
})(window);

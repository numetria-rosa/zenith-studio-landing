/* Zenith Lab, Data Science & Analysis: misconception remediation registry.
   A tag naming a specific, recurring wrong mental model (not "wrong
   answer" in general), each with a plain-English explanation, a tiny
   counterexample, and a short retry exercise. Reusable infrastructure:
   any grading path can call MisconceptionRegistry.record(tag) and any
   task page can call MisconceptionRegistry.renderIfRepeated(container, tag)
   to show the panel once a tag has fired twice or more for that learner.

   HONEST SCOPE NOTE: every tag below has real explanatory content, but
   automatic DETECTION (recognizing that a specific wrong answer maps to
   a specific tag) is wired up for 2 of the 31 tags' worth of tasks so
   far: SQL (practice-sql.html), covering 3 of its 5 listed tags
   (where-vs-having, null-vs-zero, join-fanout, via text pattern-matching
   on the submitted query), and Statistics (practice-statistics.html),
   covering 3 tags (mean-vs-median, p-value-misunderstanding,
   significance-vs-magnitude, via comparing the student's actual wrong
   numeric output to a freshly-computed correct reference value, not
   text pattern-matching). Every other tag, and every other tool's tasks,
   exist here as real content and as a target for future detection
   wiring, not as claimed-working auto-detection today. Do not read a
   tag's presence in this file as proof it is actively detected
   anywhere. */
(function (global) {
  const MISCONCEPTIONS = {
    "where-vs-having": {
      label: "WHERE vs HAVING",
      tool: "sql",
      explain: "WHERE filters individual rows before grouping. HAVING filters groups after aggregation. An aggregate function like COUNT() or SUM() has no value yet at the WHERE stage, there's nothing to compare it to.",
      example: "Wrong: SELECT category, COUNT(*) FROM orders WHERE COUNT(*) > 5 GROUP BY category\nRight: SELECT category, COUNT(*) FROM orders GROUP BY category HAVING COUNT(*) > 5",
      microExercise: "Write a query that lists customers with more than 3 orders. Filter on the count, not on any single row, that filter belongs after GROUP BY.",
    },
    "null-vs-zero": {
      label: "NULL vs zero",
      tool: "sql",
      explain: "NULL means \"no value recorded,\" not zero. `= NULL` never matches anything, even other NULLs, because SQL treats NULL as unknown rather than equal to itself. Use IS NULL / IS NOT NULL instead.",
      example: "Wrong: WHERE discount = NULL\nRight: WHERE discount IS NULL",
      microExercise: "Write a query that finds every row where the shipping_date column has never been filled in.",
    },
    "join-fanout": {
      label: "Join fan-out",
      tool: "sql",
      explain: "Joining a one-to-many relationship (one order, many line items) multiplies each order row by its number of matching line items before any aggregate runs. A SUM or COUNT taken after that join is inflated unless you aggregate the many side first or use DISTINCT deliberately.",
      example: "orders JOIN order_items duplicates each order once per item. SUM(orders.total) after that join overcounts every multi-item order.",
      microExercise: "Given orders and order_items, write a query for total revenue per order that is correct even for orders with 5 line items.",
    },
    "aggregation-grain": {
      label: "Aggregation grain",
      tool: "sql",
      explain: "GROUP BY sets the grain of the result, one row per unique combination of the grouped columns. Grouping by more columns than you need produces more, smaller groups than expected.",
      example: "GROUP BY category, region when you only wanted totals per category produces one row per category-region pair, not per category.",
      microExercise: "Write a query for total revenue per category only, no other columns in GROUP BY.",
    },
    "count-column-vs-count-star": {
      label: "COUNT(column) vs COUNT(*)",
      tool: "sql",
      explain: "COUNT(*) counts rows. COUNT(column) counts only rows where that column is not NULL. They silently disagree whenever the column has missing values.",
      example: "COUNT(*) on 100 orders where 10 have no discount recorded returns 100. COUNT(discount) on the same rows returns 90.",
      microExercise: "Compare COUNT(*) and COUNT(email) on a customers table, explain in one sentence why they differ.",
    },
    "relative-vs-absolute-reference": {
      label: "Relative vs absolute reference",
      tool: "excel",
      explain: "A plain cell reference like B2 shifts when you copy the formula. Locking it with $ (as in $B$2) keeps it pointing at the same cell no matter where the formula is copied.",
      example: "=A2*$B$2 copied down keeps multiplying by the same B2, while =A2*B2 would shift to B3, B4, and break.",
      microExercise: "Build a formula that multiplies a changing row of quantities by one fixed tax rate cell, copy it down 5 rows, and check every row uses the same rate.",
    },
    "lookup-direction": {
      label: "Lookup direction",
      tool: "excel",
      explain: "VLOOKUP only searches to the right of its lookup column. If the value you need is to the left of the value you're searching by, VLOOKUP can't find it without rearranging columns, INDEX/MATCH doesn't have this restriction.",
      example: "Looking up a product name by ID when name is in column A and ID is in column C: VLOOKUP(id, A:C, 1, FALSE) fails, INDEX/MATCH works.",
      microExercise: "Use INDEX/MATCH to look up a value in a column to the left of your lookup key.",
    },
    "text-vs-number": {
      label: "Text vs number",
      tool: "excel",
      explain: "A number stored as text (often from a CSV import, left-aligned by default) looks identical but fails in SUM, AVERAGE, and numeric comparisons. VALUE() or a multiply-by-1 trick converts it back.",
      example: "\"120\" (text) + \"130\" (text) in a SUM range returns 0 or an error, not 250.",
      microExercise: "Given a column of numbers stored as text, write a formula that correctly sums them.",
    },
    "if-evaluation": {
      label: "IF evaluation order",
      tool: "excel",
      explain: "IF evaluates conditions in order and stops at the first TRUE. A broad condition placed before a narrower one can silently swallow cases meant for the narrower one.",
      example: "IF(score>=60,\"Pass\",IF(score>=90,\"Distinction\",\"Fail\")) never returns Distinction, because score>=60 catches it first.",
      microExercise: "Write a nested IF that correctly returns Distinction, Pass, or Fail, checking the highest threshold first.",
    },
    "error-propagation": {
      label: "Error propagation",
      tool: "excel",
      explain: "An error in one cell (#DIV/0!, #N/A) propagates into every formula that references it, and a SUM including an error cell returns an error too, silently hiding the real total.",
      example: "=A1/B1 where B1=0 produces #DIV/0!, and =SUM(A1:A10) including that cell returns #DIV/0! for the whole range.",
      microExercise: "Wrap a division formula with IFERROR so a zero denominator produces 0 instead of breaking downstream sums.",
    },
    "variable-state": {
      label: "Variable state",
      tool: "python",
      explain: "A variable holds whatever it was last assigned. Reusing a loop variable or reassigning inside a function without understanding scope is a common source of values that seem to \"change on their own.\"",
      example: "total = 0\nfor row in data:\n    total = row['amount']  # overwrites instead of accumulating\nprint(total)  # only the LAST row's amount, not a sum",
      microExercise: "Fix the snippet above so total actually accumulates every row's amount.",
    },
    "loop-boundaries": {
      label: "Loop boundaries",
      tool: "python",
      explain: "range(n) produces 0..n-1, not 0..n. Off-by-one errors here either skip the last item or raise an IndexError reaching one past the end.",
      example: "for i in range(len(items)): items[i+1] eventually indexes past the last element.",
      microExercise: "Write a loop over a list by index that safely reads both items[i] and items[i-1] without an IndexError on the first iteration.",
    },
    "mutation": {
      label: "Mutation of shared state",
      tool: "python",
      explain: "Lists and dicts are mutable and passed by reference. Modifying a list inside a function changes the caller's original list too, sorting or appending to \"a copy\" that was never actually copied.",
      example: "def add_tax(prices):\n    prices.append(0)  # mutates the caller's original list\n\nmy_prices = [10, 20]\nadd_tax(my_prices)  # my_prices is now [10, 20, 0], possibly unintended",
      microExercise: "Rewrite a function that adds an item to a list so it returns a new list instead of mutating the caller's list.",
    },
    "dataframe-vs-series": {
      label: "DataFrame vs Series",
      tool: "python",
      explain: "df['col'] returns a Series (1 column, vectorized operations). df[['col']] returns a DataFrame (still 2D, one column). Confusing the two breaks anything expecting a specific shape, especially merges and comparisons.",
      example: "df['amount'] > 100 gives a boolean Series usable for filtering rows. df[['amount']] > 100 gives a DataFrame that won't align the same way.",
      microExercise: "Filter a DataFrame to rows where a single column exceeds a threshold, using a Series, not a DataFrame-column comparison.",
    },
    "filtering": {
      label: "Filtering logic",
      tool: "python",
      explain: "df[df.a > 5 and df.b < 10] raises an error, Python's `and` doesn't work element-wise on Series. Use `&` with parentheses around each condition instead.",
      example: "Wrong: df[(df.a > 5) and (df.b < 10)]\nRight: df[(df.a > 5) & (df.b < 10)]",
      microExercise: "Filter a DataFrame on two combined numeric conditions using & with each side parenthesized.",
    },
    "mean-vs-median": {
      label: "Mean vs median",
      tool: "statistics",
      explain: "The mean (sum divided by count) and the median (the middle value) can differ noticeably whenever a distribution is skewed, a few unusually large or small values pull the mean toward them without moving the median at all. They answer different questions: mean sums everything into an average, median just finds the midpoint.",
      example: "Five salaries of 40k, 42k, 45k, 48k, and 400k: the mean is about 115k (dragged up by the one outlier), the median is 45k, a far more typical value for this group.",
      microExercise: "Given a column with one extreme outlier, compute both the mean and the median, and explain in one sentence which one better represents a 'typical' row.",
    },
    "p-value-misunderstanding": {
      label: "P-value misunderstanding",
      tool: "statistics",
      explain: "A p-value is always a probability, between 0 and 1, it answers 'if there were truly no effect, how likely is a result this extreme purely by chance.' It is not the probability the null hypothesis is true, and it is not the probability your finding is 'real' or 'important', those are common but incorrect readings of the same number.",
      example: "A p-value of 0.03 means: if the two groups truly performed identically, a gap this large would happen about 3% of the time by chance alone, not 'there's a 3% chance this is a fluke' and not 'there's a 97% chance the effect is real.'",
      microExercise: "Given a p-value of 0.02, write one sentence stating correctly what it does and does not tell you.",
    },
    "sample-vs-population": {
      label: "Sample vs population",
      tool: "statistics",
      explain: "A sample statistic (a mean from 50 surveyed customers) estimates but is not the true population value. Reporting a sample number as if it were a certain, exact population fact overstates confidence.",
      example: "\"Average satisfaction is 7.2\" from 50 respondents out of 10,000 customers is an estimate with real uncertainty, not a fact about all 10,000.",
      microExercise: "Given a sample mean and standard deviation, state the result as an estimate with a margin of error, not a bare number.",
    },
    "correlation-vs-causation": {
      label: "Correlation vs causation",
      tool: "statistics",
      explain: "Two variables moving together doesn't mean one causes the other, a hidden third factor, reverse causation, or coincidence can all produce the same correlation.",
      example: "Ice cream sales and drowning deaths correlate. Summer heat causes both, ice cream doesn't cause drowning.",
      microExercise: "Given a correlated pair of business metrics, name one plausible confounding variable before recommending an action.",
    },
    "significance-vs-magnitude": {
      label: "Statistical significance vs magnitude",
      tool: "statistics",
      explain: "A statistically significant result (p < 0.05, or a z-score past the threshold) tells you a difference is probably real, not that it's large or business-relevant. A tiny, real difference can still be too small to act on.",
      example: "A 0.1% conversion-rate lift can be statistically significant with a huge sample size, and still not worth the engineering cost to ship.",
      microExercise: "Given a statistically significant but small effect size, write one sentence on whether it's worth acting on and why.",
    },
    "rate-with-small-denominator": {
      label: "Rates with a small denominator",
      tool: "statistics",
      explain: "A rate computed from a small sample swings wildly on one or two events. \"Conversion jumped 50%\" from 2 conversions out of 4 visits is noise, not a trend.",
      example: "2/4 to 3/4 is a \"50% increase\" that's really just one more event in a tiny sample.",
      microExercise: "Given a rate change, state the underlying counts before deciding whether the change means anything.",
    },
    "wrong-chart-choice": {
      label: "Wrong chart choice",
      tool: "visualization",
      explain: "Pie charts compare parts of a whole, not trends over time. Line charts show trends, not category comparisons. Choosing the wrong chart type for the question makes the answer harder to see, even with correct data.",
      example: "A pie chart with 12 monthly slices makes it nearly impossible to see whether revenue is trending up or down, a line chart would show it instantly.",
      microExercise: "Given monthly revenue, pick a line chart over a pie chart and explain why in one sentence.",
    },
    "misleading-axis": {
      label: "Misleading axis",
      tool: "visualization",
      explain: "A bar chart's y-axis should start at 0. Starting higher exaggerates small differences into what looks like a dramatic change.",
      example: "Bars from 8,000 to 8,200 look nearly identical starting at 0, but look wildly different if the axis starts at 7,900.",
      microExercise: "Given a bar chart with a truncated axis, describe what it would look like if the axis correctly started at 0.",
    },
    "unit-mismatch": {
      label: "Unit mismatch",
      tool: "visualization",
      explain: "Comparing or combining values in different units (percent vs raw count, dollars vs thousands of dollars) without converting first produces numbers that look comparable but aren't.",
      example: "Plotting \"revenue\" in thousands next to \"units sold\" as raw counts on the same axis makes one series look artificially flat.",
      microExercise: "Given two series in different units, state what conversion is needed before they can share one chart.",
    },
    "overplotting": {
      label: "Overplotting",
      tool: "visualization",
      explain: "Too many overlapping points or bars on one chart hide the actual pattern, dense scatter plots especially. Aggregating, sampling, or using a different chart type restores readability.",
      example: "50,000 overlapping points on a scatter plot look like a solid blob, a hexbin or 2D histogram reveals the real density.",
      microExercise: "Given a densely overplotted scatter plot, name one specific alternative that would make the pattern visible.",
    },
    "kpi-definition": {
      label: "KPI definition",
      tool: "bi",
      explain: "A KPI's definition (what counts as \"active,\" what date range \"this month\" means) has to be fixed and shared, otherwise two people looking at \"the same metric\" get different numbers and don't realize why.",
      example: "\"Active users\" defined as \"logged in\" by one team and \"made a purchase\" by another produces two different numbers both called Active Users.",
      microExercise: "Write a one-sentence, unambiguous definition for a KPI of your choice, including what counts and what date range it covers.",
    },
    "filter-context": {
      label: "Filter context",
      tool: "bi",
      explain: "In Power BI/Tableau, a Measure recalculates based on whatever filters, slicers, and visual groupings are currently applied around it. The same Measure formula returns different numbers depending on filter context, that's a feature, not a bug, but it surprises people expecting a fixed value.",
      example: "A Total Sales measure returns the grand total with no filters, but the region's total when placed in a table broken out by region, same formula, different context.",
      microExercise: "Explain in one sentence why the same Measure shows a different number in a table broken out by category versus with no breakdown at all.",
    },
    "aggregation-level-bi": {
      label: "Aggregation level (BI)",
      tool: "bi",
      explain: "Dragging a field onto a shelf/well without checking its aggregation (Sum vs Average vs Count Distinct) silently changes what the number means, a Sum of a rate column, for instance, is usually meaningless.",
      example: "Summing a \"conversion rate\" column across regions gives a nonsense number, it needs to be recomputed from totals, not summed as a rate.",
      microExercise: "Given a rate-type column, explain why it should not be aggregated with Sum.",
    },
    "brittle-hardcoding": {
      label: "Brittle hardcoding",
      tool: "automation",
      explain: "A script that hardcodes a filename, a date, or a row count only works once. Real automation reads inputs dynamically (today's date, a file that matches a pattern, whatever rows currently exist) instead of a value typed in during testing.",
      example: "A script that opens \"jan_report.csv\" by name breaks every February.",
      microExercise: "Rewrite a script that hardcodes a filename to instead find the most recent matching file automatically.",
    },
    "missing-validation": {
      label: "Missing validation",
      tool: "automation",
      explain: "A script that assumes its input is always well-formed breaks (or worse, silently produces wrong output) the first time it isn't. Checking shape, types, and expected ranges before processing catches bad input before it corrupts a result.",
      example: "A script assuming every row has a valid date crashes, or silently miscalculates, the first time one row's date field is empty.",
      microExercise: "Add one validation check to a script before it processes a row of data, and decide what should happen when that check fails.",
    },
    "silent-failure": {
      label: "Silent failure",
      tool: "automation",
      explain: "A script wrapped in a bare try/except that swallows every error runs to completion looking successful, while actually having done nothing, or something wrong, on every failed row. Automation needs to report what it skipped, not just avoid crashing.",
      example: "except: pass around the whole processing loop means a malformed row on day 1 fails silently forever, with no one aware anything is wrong.",
      microExercise: "Change a bare except: pass into one that logs or counts what was skipped, so a human can see something went wrong.",
    },
  };

  const STORAGE_KEY = "zenith_ds_practice_v1";
  function safeParse(raw) { try { return JSON.parse(raw); } catch (e) { return null; } }
  function loadData() {
    let raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }
    const parsed = raw ? safeParse(raw) : null;
    const data = (parsed && typeof parsed === "object" && !Array.isArray(parsed)) ? parsed : {};
    if (!data.misconceptions || typeof data.misconceptions !== "object") data.misconceptions = {};
    if (!data.tasks || typeof data.tasks !== "object") data.tasks = {};
    return data;
  }
  function saveData(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* degrade silently */ }
  }

  /* Record one occurrence of a real, detected misconception tag. Purely
     additive to whatever PracticeProgress.recordAttempt already wrote
     for the task itself, this only adds to data.misconceptions. */
  function record(tag) {
    if (!MISCONCEPTIONS[tag]) return 0;
    const data = loadData();
    data.misconceptions[tag] = (data.misconceptions[tag] || 0) + 1;
    saveData(data);
    return data.misconceptions[tag];
  }

  function countFor(tag) {
    return loadData().misconceptions[tag] || 0;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* Renders the remediation panel into `container` (innerHTML replace)
     if this tag has now occurred REPEATED_THRESHOLD or more times for
     this learner. Returns true if it rendered, so callers can decide
     whether to also show their normal feedback. */
  const REPEATED_THRESHOLD = 2;
  function renderIfRepeated(container, tag) {
    const m = MISCONCEPTIONS[tag];
    if (!m) return false;
    const count = countFor(tag);
    if (count < REPEATED_THRESHOLD) return false;
    container.innerHTML = `
      <div class="miscopanel">
        <div class="miscohead">You've now missed ${count} tasks involving the same thing: ${esc(m.label)}</div>
        <p class="miscoexplain">${esc(m.explain)}</p>
        <div class="miscoexample"><div class="mlbl">Example</div><pre>${esc(m.example)}</pre></div>
        <div class="miscoexercise"><div class="mlbl">Try this before going back to the task</div><p>${esc(m.microExercise)}</p></div>
      </div>`;
    return true;
  }

  global.MisconceptionRegistry = { MISCONCEPTIONS, record, countFor, renderIfRepeated, REPEATED_THRESHOLD };
})(window);

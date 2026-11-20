# CPU Scheduling, Banker&rsquo;s, Page Replacement &amp; Memory Allocation Practice

Five small, dependency-free practice pages for operating-systems exercises:

- **CPU Scheduling** (`pages/cpu-scheduling.html`) &mdash; build the Gantt chart, fill in the
  metrics table, and get graded instantly.
- **Banker&rsquo;s Algorithm** (`pages/bankers.html`) &mdash; compute each process&rsquo;s
  current need, carry the available vector forward, and find a safe sequence (or show that
  the state is unsafe).
- **Deadlock Graphs** (`pages/deadlock.html`) &mdash; resource allocation and wait-for
  graphs: type the allocation and request matrices, then hand-draw both graphs and get each
  arrow marked, plus the deadlock verdict (kept in the project but not linked from the
  navigation).
- **Page Replacement** (`pages/paging.html`) &mdash; trace page frames through a reference
  string for FIFO, Optimal and LRU, mark faults and hits, and compute the hit ratio.
- **Memory Allocation** (`pages/memory.html`) &mdash; dynamic storage allocation: place jobs
  into memory blocks using First-fit, Best-fit, Next-fit and Worst-fit (all four side by
  side), then compute per-block and total internal/external fragmentation.

## Features

### CPU scheduling page

- **Six algorithms** — FCFS, SJF, SRTF, Priority (non-preemptive and preemptive),
  and Round Robin (quantum chosen randomly between 2 and 4 and shown in the rule note).
- **Random problems** with 3, 5, or 7 processes.
- **Optional arrival times** — practise the textbook style with arrival times, or
  switch to *Without arrival times* where every process is ready at `t = 0`
  (FCFS then simply runs `P1 → P2 → …`).
- **Step-by-step workflow** — Gantt chart first, then the answer table, with live
  hints and formula reminders for the current mode.
- **Gantt chart editor** — one card per stretch of CPU time: pick the process (or
  `IDLE`) and type the time that block ends at. Bars scale to the real durations and
  tick labels are drawn under the preview.
- **Live ready queue for Round Robin** — a filmstrip above the Gantt preview replays
  your own blocks: each frame shows the process on the CPU, the FIFO queue in order
  (front outlined) with remaining bursts, and who just arrived. It updates as you
  type and flags choices that break the queue (wrong process, `IDLE` with a ready
  process, a turn longer than the quantum).
- **Instant grading** — wrong Gantt blocks are outlined in red, wrong table cells
  turn red, correct ones turn green, and a score pill shows the percentage.
- **Show answer** reveals the correct Gantt chart and fills in the missing values.
- **Keyboard friendly** — `Enter` jumps to the next answer cell and submits from the last one.

### Banker&rsquo;s algorithm page

- **Random problems** with 4, 5, or 6 processes and 3 or 4 resource types, in the
  textbook layout: `Max need` and `Allocated` matrices plus the availability vector.
- **Three problem modes** — *Random mix*, *Always safe*, or *Always unsafe*, so you can
  practise proving a state safe and also practise showing that none exists.
- **Two question styles** — either the initial `Available` vector is given, or only the
  **total instances** of each resource are given and you derive
  `Available = Total − Σ Allocated` yourself.
- **One answer sheet** — every process is listed serially (`P0 … Pn−1`) in a single
  table: `#`, `Process`, `Max need`, `Allocated`, `Current need`, `Available`, `Status`.
  `Max need` and `Allocated` are generated and visible immediately; you type `Current
  need` for every row, and the `Available` cell in a row is the vector at the moment
  that process starts. A heavier rule separates each column group.
- **Completion order array** — one typed slot per step below the table (`P2` or `2`);
  you write the order in which the processes finish. A row&rsquo;s `Status` ticks `✓`
  once the order places it and its need fits, `✗` if it does not fit at that step.
- **Unsafe states** — when nothing else can run, press *No safe sequence exists*. The
  verdict only counts if the typed order is feasible and genuinely stuck.
- **Scoring pills** for `Need`, `Available`, the order verdict, and an overall percentage.
- **Show answer** reveals one safe sequence (or the run that gets stuck) with every
  availability vector spelled out, and annotates wrong need and availability cells.
- **Keyboard friendly** — `Enter` walks across the need cells, then through the order
  slots, then through the availability cells; it submits from the last one.

### Deadlock graphs page

- **Editable matrices** in the exam layout: `Allocated` and `Requested` columns for
  every process, plus an editable total-instance count per resource.
- **You draw the graphs.** Both canvases start empty: click a process then a resource
  to add a request (dashed), or a resource then a process to add an assignment (solid,
  attached to an instance dot). Click the pair again, or the arrow itself, to remove it.
- **Separate Wait-For canvas.** Click `Pi` then `Pj` for every wait; a process cannot
  wait for itself, and each pair is drawn once.
- **Resource boxes carry the given data** &mdash; one dot per instance, filled for the
  copies that are allocated and hollow for the free ones, independent of what you draw.
- **Arrow-level marking** &mdash; submit to turn correct arrows green, wrong ones red,
  and show the arrows you missed as green dashed ghosts. Pills report `RAG a/b`,
  `WFG c/d`, the verdict and an overall percentage.
- **Data validation** — impossible tables (more instances allocated than exist, a
  request larger than the resource, a zero-instance resource) are rejected cell by
  cell, and the canvases stay disabled until the numbers are consistent.
- **Verdict checking** — pick *Deadlock* or *No deadlock*, and get the reduction order,
  the stuck processes, their blocked requests and the cycle with a worked justification.
- **Random problems** with 3–5 processes, 2–3 resources and 1 or 2 instances each,
  in three flavours: *Random mix*, *Always deadlock*, *Never deadlock*.

### Page replacement page

- **Three algorithms** &mdash; FIFO, Optimal and LRU.
- **Configurable problems** &mdash; 3&ndash;6 page frames and reference strings of 8, 12,
  16 or 20 pages (default 3 frames / 12 references).
- **Random problems, the textbook example, or your own string** &mdash; *New problem*
  generates a fresh string, *Load the example* loads 3 frames with
  `1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5`, and *Enter your own* lets you paste any
  reference string (2&ndash;30 pages, values 1&ndash;99) with 1&ndash;10 frames.
- **Step-by-step workflow** &mdash; fill the full frame trace and the F/H result row,
  then enter the totals.
- **Full trace table** &mdash; one column per reference: type every frame&rsquo;s contents
  after each step, and mark each step <b>F</b> (page fault) or <b>H</b> (hit). Use a
  blank or `&ndash;` for an empty frame. Row labels stay sticky and long strings scroll
  horizontally.
- **Totals step** &mdash; enter the total page faults and the hit ratio (a percentage
  like `16.7` or a fraction like `2/12`), both graded.
- **Compare on the same string** &mdash; switching the algorithm or the frame count keeps
  the current reference string and clears your answers, so you can compare FIFO, LRU and
  Optimal on the same problem; changing the length or pressing *New problem* draws a new one.
- **Instant grading** &mdash; wrong frame and F/H cells turn red, correct ones green, and
  score pills report `Frames`, `F/H`, `Totals` and an overall percentage.
- **Show answer** reveals the correct trace table (reference row highlighted, faults in
  orange and hits in green), the faults/hits/hit ratio/fault rate, a fault-count comparison
  across FIFO/Optimal/LRU for the current string, and a collapsible &ldquo;why each page was
  replaced&rdquo; explanation.
- **Keyboard friendly** &mdash; `Enter` moves down a column (Frame 1 &rarr; &hellip; &rarr;
  Result) then to the next column, and submits from the last field.

### Memory allocation page

- **Four algorithms on one page** &mdash; First-fit, Best-fit, Next-fit and Worst-fit, each
  shown as its own section so you solve all four for the same problem.
- **Configurable problems** &mdash; 3&ndash;6 jobs and 4&ndash;7 memory blocks, plus
  **New problem**, **Load the example**, and **Enter your own** (jobs and blocks as
  `Name:Size`, 1&ndash;10 each, sizes 1&ndash;999 KB).
- **Given data** &mdash; a single job list (in allocation order) and memory block list,
  shared by all four strategies.
- **Per-strategy allocation grid** &mdash; for every memory block in each strategy, type the
  job name placed in it and that block&rsquo;s **internal fragmentation** side by side in the
  same cell (leave both blank/`&ndash;` if the block stays unallocated). Jobs are considered
  in list order and each block can hold at most one job.
- **Per-strategy totals** &mdash; each strategy has its own **total internal fragmentation**
  and **external fragmentation** inputs (KB), shown side by side below the table, both
  graded.
- **Instant grading** &mdash; wrong block assignments and totals turn red, correct ones
  green, with score pills per strategy and an overall percentage.
- **Show answer** reveals the correct placements and fragmentation for all four strategies
  in a comparison table, plus per-job placement steps (including any unplaced jobs).
- **Keyboard friendly** &mdash; `Enter` / arrows move through a strategy&rsquo;s block
  inputs, into its internal/external fields, then on to the next strategy.

All five pages need **no build step and no dependencies** &mdash; just an HTML file and
the shared stylesheet.

## How to use

1. Download or clone the repository.
2. Open `index.html` in any modern browser for the home page, or open a practice page
   directly from the `pages/` folder (e.g. `pages/cpu-scheduling.html`,
   `pages/bankers.html`, `pages/paging.html`, `pages/memory.html`) &mdash; double-clicking
   is enough, there is no server or build step. The navigation bar switches between Home and
   the available practice pages (`pages/deadlock.html` remains in the project but is not
   linked in the navigation).

### CPU scheduling

1. Choose an **Algorithm**, the number of **Processes**, and whether arrival times are
   **given or not** (the default is *With arrival times*).
2. **Step 1 — Gantt chart.** For each block, select the process and type the time at
   which that block ends. Use `IDLE` for gaps when nothing is ready. Fill blocks in
   order; `+ Add block` adds another, and `×` removes one.
3. **Step 2 — Answer table.** Fill in Completion, Turnaround, Waiting, and Response
   times for every process.
4. Press **Submit** to grade. Use **Try again** to clear the marks and keep your work,
   **Show answer** to reveal the solution, or **New problem** for fresh data.

### Banker&rsquo;s algorithm

1. Choose the **problem type**, the number of **processes**, the number of **resource
   types**, and whether the question gives the **available vector** or the **total
   instances**. `New problem` draws fresh data.
2. The sheet shows either the initial `Available` vector or the `Total instances` of
   each resource above the table. If only totals are given, work out
   `Available = Total − Σ Allocated` first.
3. Fill in `Current need` (`Max − Allocated`) for every process &mdash; these answers do
   not depend on the order.
4. Decide the order in which the processes finish and write it in the **Completion
   order** array below the table (one process per step; `P2` and `2` both work).
5. In the row of each placed process, type the availability vector *at the moment that
   process starts* (the starting vector for the first one). Add the process&rsquo;s
   allocation back to the availability to get the next vector.
6. The **Status** column and the hint beside the verdict button flag the first step that
   does not fit. If nothing else can run, click **No safe sequence exists**.
7. Press **Submit** to grade, **Try again** to clear the marks, or **Show answer** to
   see the full solution.

### Deadlock graphs

1. Pick a **problem type**, the number of **processes**, the number of **resources**
   and how many **instances** each resource has, or press **New problem** for fresh
   data.
2. Type the exam table: `Allocated` is what each process already holds, `Requested`
   is what it is still waiting for. Edit the total instance count above the table if
   the question gives mixed counts (say `R1` has 1 and `R2` has 2). A red message
   under the totals means the table cannot exist &mdash; fix the red cells first.
3. **Step 1 — draw the Resource Allocation Graph.** Click a process, then a resource
   it requests (dashed arrow). Click a resource, then a process holding a copy of it
   (solid arrow from an instance dot). Click an arrow or repeat a pair to remove it.
4. **Step 2 — draw the Wait-For Graph.** Click the process that waits, then the
   process it waits for. Decide each edge from the free-instance counts: a request the
   free copies can satisfy is granted and creates no wait arrow.
5. **Step 3 — choose Deadlock or No deadlock**, then press **Submit**. Correct arrows
   turn green, wrong ones red, missed ones appear as green dashed ghosts, and the score
   pills break the result down by graph and verdict.
6. **Try again** clears the marks but keeps your drawing. **Show answer** overlays the
   answer key and spells out the reduction order, the stuck processes and the cycle.
   Editing the table or changing the problem settings starts the drawing over.

### Page replacement

1. Pick an **algorithm** (FIFO, Optimal or LRU), the number of **frames** (3&ndash;6) and
   the **reference** string length (8, 12, 16 or 20), or press **New problem** for fresh
   data. **Load the example** loads the textbook 3-frame string; **Enter your own** lets
   you paste any string (2&ndash;30 pages, 1&ndash;99) and choose 1&ndash;10 frames.
2. **Step 1 — trace the table.** For each column, type the contents of every frame after
   that reference and mark **Result** as `F` (fault) or `H` (hit). Leave a cell blank or
   type `&ndash;` when a frame is still empty.
3. **Step 2 — results.** Enter the total page faults and the hit ratio (for example
   `16.7%` or `2/12`).
4. Press **Submit** to grade. **Try again** clears the marks but keeps your work, and
   **Show answer** reveals the correct trace, totals and per-step explanations.
5. To compare algorithms, switch FIFO/Optimal/LRU (or the frame count) on the same
   string; changing the reference length or pressing *New problem* generates a new string.

### Memory allocation

1. Choose the number of **jobs** and **memory blocks**, or press **New problem** for fresh
   data. **Load the example** loads a sample job/block list; **Enter your own** lets you
   provide jobs and blocks as `Name:Size` pairs (e.g. `A:44`), 1&ndash;10 items each.
2. For **each strategy** (First-fit, Best-fit, Next-fit, Worst-fit), type the job placed in
   every memory block and that block&rsquo;s **internal fragmentation** side by side in the
   same cell (leave both blank/`&ndash;` if unallocated). Jobs are considered in the given
   order.
3. For **each strategy**, enter the **total internal fragmentation** and **external
   fragmentation** in KB (side by side below the table).
4. Press **Submit** to grade all four strategies at once. **Try again** clears the marks
   but keeps your work, and **Show answer** reveals the correct placements, fragmentation
   totals and a comparison of all four strategies. Changing the job/block counts or
   pressing *New problem* generates a new problem.

Notes:

- Changing the algorithm on the scheduling page keeps the same process set and re-solves
  with the new rule. Changing the process count or the arrival mode generates a new
  problem.
- Grading counts every answer cell plus every Gantt block, so the percentage reflects
  both parts of the scheduling solution.
- On the Banker&rsquo;s page, switching between *Available given* and *Total given* keeps
  your answers; changing the problem type, process count, or resource count draws a
  new problem.
- The Banker&rsquo;s score counts every need cell, every availability cell in the rows your
  order places, and one point for the order (a complete safe sequence or a proven unsafe
  state).
- On the deadlock page, editing a cell, changing any chip, or pressing *New problem*
  clears both drawings; *Try again* only clears the marks, and *Show answer* keeps your
  arrows visible under the answer key.
- On the page replacement page, the score counts every frame cell, every F/H cell and the
  two totals. Switching the algorithm or frame count keeps the same reference string;
  changing the length or pressing *New problem* draws a new one. A custom string replaces
  the current problem and clears your answers.
- On the memory allocation page, all four strategies are solved on the same jobs and blocks.
  The score counts every block&rsquo;s job and per-block internal fragmentation, plus both
  fragmentation totals for each strategy. Changing the job/block counts or pressing *New
  problem* draws a new one; a custom problem replaces the current data and clears your
  answers.

## CPU scheduling rules used

- With arrival times, exactly one process arrives at `t = 0`, and no arrival time is
  shared by more than two processes.
- Ties go to the earlier arrival, then to the lower process number.
- Lower number means higher priority.
- Non-preemptive algorithms run the chosen process to completion.
- Preemptive algorithms (SRTF, preemptive Priority) switch the moment a better process
  arrives.
- Round Robin: each process runs for at most one quantum per turn, then rejoins the
  back of the FIFO ready queue. Arrivals at the same instant join the queue ahead of a
  process that just used its quantum.
- Without arrival times, every process is available at `t = 0`, so SRTF behaves exactly
  like SJF and FCFS starts with `P1`.

## Formulas

### CPU scheduling

| Mode | Turnaround | Waiting | Response |
| --- | --- | --- | --- |
| With arrival times | `CT − AT` | `TAT − BT` | first CPU time `− AT` |
| Without arrival times | `CT − BT` | `TAT − BT` | first CPU time |

where `CT` is completion time, `AT` arrival time, `BT` burst time, and `TAT` turnaround
time.

### Banker&rsquo;s algorithm

- `Need[i][r] = Max[i][r] − Allocated[i][r]`
- `Available = Total − Σ Allocated` (when the question gives total instances)
- A process can run when `Need[i] ≤ Work`, and then `Work = Work + Allocated[i]`.
- The state is **safe** if every process can be finished in some order; if the running
  work vector stops covering every remaining process, the state is **unsafe**.
- Safe sequences are not unique: in a safe state, any process that fits can safely run
  next, so several orders can be correct.

### Page replacement

| Value | Formula |
| --- | --- |
| Page faults | number of references where the page was not in any frame |
| Hits | `references − page faults` |
| Hit ratio | `hits / references` |
| Fault rate | `page faults / references` |

### Memory allocation

| Value | Formula |
| --- | --- |
| Internal fragmentation | `Σ (allocated block size − job size)` over all allocated blocks |
| External fragmentation | sum of sizes of blocks left unallocated (free memory) |

## Banker&rsquo;s algorithm rules used

- Problems with 4–6 processes and 3–4 resource types; every matrix entry is a
  single digit so the arithmetic can be done by hand.
- *Always safe* problems are generated from a random order that is guaranteed to work,
  and they always start with at least one process blocked, so the listed process order
  is never already a solution.
- *Always unsafe* problems start with at least one runnable process and get stuck
  before every process has finished, rather than being dead on arrival.
- A verdict of “no safe sequence” is accepted only when the typed completion order is
  feasible and no remaining process fits in the resulting availability.
- The availability you type is checked against the completion order you wrote, so any
  valid safe sequence is graded as correct.

## Deadlock graph rules used

- `Available = Total − Σ Allocated`, per resource. The instance dots always show this
  given data, not the arrows you draw.
- A correct Resource Allocation Graph has one assignment arrow for every
  `Allocated > 0` pair and one request arrow for every `Requested > 0` pair.
- A request becomes a wait-for edge only when the free instances cannot satisfy it;
  a request that fits is granted immediately, so that process is not waiting.
- A process can finish when its whole request vector fits in the available vector; it
  then releases everything it holds (the same reduction idea as Banker&rsquo;s).
- If any process is left over, the state is deadlocked. A cycle is the classic
  justification, but with multi-instance resources the cycle alone is not the test
  &mdash; the free instances decide.
- Impossible inputs &mdash; more copies allocated than exist, a request larger than the
  resource, a resource with no instances &mdash; are rejected cell by cell, and the
  canvases are disabled until the numbers are consistent.
- The score counts the arrows of each graph and one point for the verdict; extra wrong
  arrows lower the percentage.

## Page replacement rules used

- **FIFO** replaces the page that has been in memory the longest. A hit does not change
  the load order.
- **LRU** replaces the page whose last use is farthest in the past.
- **Optimal** replaces the page whose next use is farthest in the future (or that is never
  used again). **Tie rule:** if more than one loaded page is never used again, evict the
  page in the lowest-numbered frame (so grading is unambiguous).
- All frames start empty. A fault that finds a free frame loads the page into the first
  empty frame; it is not a replacement. A hit leaves the frame contents unchanged.
- Random problems use pages `1`&ndash;`9` with no back-to-back repeats and are checked to
  include at least one hit and one eviction for all three algorithms (relaxed for very
  short strings). Custom strings accept 2&ndash;30 page numbers from 1&ndash;99.

## Memory allocation rules used

- Jobs are allocated in the given order; each memory block can hold at most one job in
  these exercises.
- **First-fit:** place the job in the first block (from the start of the list) that is
  large enough.
- **Best-fit:** place the job in the smallest block that is large enough (tightest fit).
- **Next-fit:** like first-fit, but the search resumes from where the last allocation was
  made and wraps around to the beginning if needed.
- **Worst-fit:** place the job in the largest block that is large enough.
- If no block can fit a job, it remains unplaced. **Internal fragmentation** is the unused
  space inside allocated blocks (`block size − job size`), and **external fragmentation** is
  the total size of blocks left unallocated.

## Project structure

```
index.html              home/landing page
css/
  style.css             shared layout and component styling
js/
  cpu-scheduling.js     CPU scheduling logic
  bankers.js            Banker's algorithm logic
  deadlock.js           deadlock graphs logic
  paging.js             page replacement logic
  memory.js             memory allocation logic
pages/
  cpu-scheduling.html   CPU scheduling practice page
  bankers.html          Banker's algorithm practice page
  deadlock.html         deadlock graphs practice page (not linked in navigation)
  paging.html           page replacement practice page
  memory.html           memory allocation practice page
README.md               this file
```

Each page is dependency-free (no build step). Page markup lives in `pages/*.html` (and
`index.html` for home), with shared styles in `css/style.css` and per-page scripts in
`js/*.js`. The pure logic in each script sits between `/* PURE-START */` and
`/* PURE-END */` markers (`generateProcs` / `simulate` for scheduling, the vector helpers
and problem generators for Banker&rsquo;s, `analyse` / `findCycle` / `expectedRAG` /
`expectedWFG` / `compareEdges` for deadlock, `simulate` / `generateProblem` /
`parseCustomRefs` for page replacement, and `allocate` / `solveAll` / `generateProblem` /
`parseCustom` for memory allocation), so it can be extracted and tested without a DOM.


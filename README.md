# CPU Scheduling &amp; Banker&rsquo;s Algorithm Practice

Two small, dependency-free practice pages for operating-systems exercises:

- **`index.html`** &mdash; CPU scheduling: build the Gantt chart, fill in the metrics
  table, and get graded instantly.
- **`bankers.html`** &mdash; Banker&rsquo;s algorithm: compute each process&rsquo;s current need,
  carry the available vector forward, and find a safe sequence (or show that the
  state is unsafe).

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

Both pages need **no build step and no dependencies** — just an HTML file and the
shared stylesheet.

## How to use

1. Download or clone the repository.
2. Open `index.html` (or `bankers.html`) in any modern browser — double-clicking it is
   enough, there is no server or build step. The pill-shaped navigation at the top
   switches between the two pages.

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

## Project structure

```
index.html    scheduling page: markup, styles reference, all logic
bankers.html  Banker's algorithm page: markup and all logic
style.css     layout and component styling for both pages
README.md     this file
```

Each page is self-contained and dependency-free. The pure logic in each file sits
between `/* PURE-START */` and `/* PURE-END */` markers (`generateProcs` / `simulate`
for scheduling, the vector helpers and problem generators for Banker&rsquo;s), so it can
be extracted and tested without a DOM.


# CPU Scheduling Practice

A small, dependency-free web page for practising CPU scheduling problems by hand:
build the Gantt chart, fill in the metrics table, and get graded instantly.

## Features

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
- **No build step, no dependencies** — a single HTML file plus one stylesheet.

## How to use

1. Download or clone the repository.
2. Open `index.html` in any modern browser (double-clicking it is enough — there is
   no server or build step).
3. Choose an **Algorithm**, the number of **Processes**, and whether arrival times are
   **given or not** (the default is *With arrival times*).
4. **Step 1 — Gantt chart.** For each block, select the process and type the time at
   which that block ends. Use `IDLE` for gaps when nothing is ready. Fill blocks in
   order; `+ Add block` adds another, and `×` removes one.
5. **Step 2 — Answer table.** Fill in Completion, Turnaround, Waiting, and Response
   times for every process.
6. Press **Submit** to grade. Use **Try again** to clear the marks and keep your work,
   **Show answer** to reveal the solution, or **New problem** for fresh data.

Notes:

- Changing the algorithm keeps the same process set and re-solves with the new rule.
- Changing the process count or the arrival mode generates a new problem.
- Grading counts every answer cell plus every Gantt block, so the percentage reflects
  both parts of the solution.

## Scheduling rules used

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

| Mode | Turnaround | Waiting | Response |
| --- | --- | --- | --- |
| With arrival times | `CT − AT` | `TAT − BT` | first CPU time `− AT` |
| Without arrival times | `CT − BT` | `TAT − BT` | first CPU time |

where `CT` is completion time, `AT` arrival time, `BT` burst time, and `TAT` turnaround
time.

## Project structure

```
index.html   markup, styles reference, all scheduling and grading logic
style.css    layout and component styling
README.md    this file
```

The scheduling logic in `index.html` is self-contained between the
`/* PURE-START */` and `/* PURE-END */` markers (`generateProcs`, `simulate`, and the
algorithm/factor tables), so it can be extracted and tested without a DOM.

(function () {
  'use strict';

  /* PURE-START */
  var PALETTE = ['#6366f1', '#db2777', '#0d9488', '#d97706', '#7c3aed', '#0284c7', '#dc2626'];

  function zeros(k) {
    var a = [];
    for (var i = 0; i < k; i++) a.push(0);
    return a;
  }

  function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function addVec(a, b) {
    var o = [];
    for (var i = 0; i < a.length; i++) o.push(a[i] + b[i]);
    return o;
  }

  function leVec(a, b) {
    for (var i = 0; i < a.length; i++) if (a[i] > b[i]) return false;
    return true;
  }

  function fmtV(v) {
    return '(' + v.join(', ') + ')';
  }

  function makeProcs(alloc, req) {
    return alloc.map(function (a, i) {
      return { pid: 'P' + (i + 1), id: i, alloc: a.slice(), req: req[i].slice() };
    });
  }

  // k distinct process indexes, used so one process never holds two copies.
  function pickIdx(n, k) {
    var pool = [];
    var i;
    for (i = 0; i < n; i++) pool.push(i);
    for (i = n - 1; i > 0; i--) {
      var j = randInt(0, i);
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    return pool.slice(0, k);
  }

  // Every allocation must fit in the instance count, and no request can ask
  // for more copies than exist. Returns the message list and the bad cells.
  function validate(procs, total) {
    var m = total.length;
    var msgs = [];
    var bad = {};
    var r;

    for (r = 0; r < m; r++) {
      if (total[r] < 1) {
        msgs.push('R' + (r + 1) + ' needs at least one instance.');
        bad['total|' + r] = true;
        continue;
      }
      var sum = 0;
      procs.forEach(function (p) {
        if (p.req[r] > total[r]) {
          msgs.push(p.pid + ' requests ' + p.req[r] + ' of R' + (r + 1) + ', but only ' + total[r] +
            (total[r] === 1 ? ' exists' : ' exist') + '.');
          bad['req|' + p.id + '|' + r] = true;
        } else if (p.req[r] > 0 && p.alloc[r] + p.req[r] > total[r]) {
          msgs.push(p.pid + ' holds ' + p.alloc[r] + ' and wants ' + p.req[r] + ' more of R' + (r + 1) +
            ', but only ' + total[r] + (total[r] === 1 ? ' instance exists' : ' instances exist') + '.');
          bad['req|' + p.id + '|' + r] = true;
        }
        sum += p.alloc[r];
      });
      if (sum > total[r]) {
        msgs.push('R' + (r + 1) + ': ' + sum + ' instances allocated, but only ' + total[r] + ' exist.');
        procs.forEach(function (p) {
          if (p.alloc[r] > 0) bad['alloc|' + p.id + '|' + r] = true;
        });
      }
    }

    return { ok: msgs.length === 0, msgs: msgs, bad: bad };
  }
  // Deadlock detection by reduction: repeatedly run any process whose whole
  // request fits in the free instances, then release what it holds. Whatever
  // is left over can never finish.
  function analyse(procs, total) {
    var m = total.length;
    var allocSum = zeros(m);
    var r, i;

    procs.forEach(function (p) {
      for (r = 0; r < m; r++) allocSum[r] += p.alloc[r];
    });

    var avail = total.map(function (t, k) { return t - allocSum[k]; });
    var work = avail.slice();
    var done = procs.map(function () { return false; });
    var steps = [];
    var guard = 0;

    while (guard++ <= procs.length) {
      var pick = -1;
      for (i = 0; i < procs.length; i++) {
        if (!done[i] && leVec(procs[i].req, work)) { pick = i; break; }
      }
      if (pick < 0) break;
      var before = work.slice();
      work = addVec(work, procs[pick].alloc);
      done[pick] = true;
      steps.push({
        idx: pick,
        pid: procs[pick].pid,
        req: procs[pick].req.slice(),
        alloc: procs[pick].alloc.slice(),
        before: before,
        after: work.slice()
      });
    }

    var order = steps.map(function (s) { return s.idx; });
    var stuck = [];
    for (i = 0; i < procs.length; i++) if (!done[i]) stuck.push(i);

    // Wait-for edges exist only when the free instances cannot satisfy the
    // request; a request that fits is granted, so that process is not waiting.
    var edges = [];
    var seen = {};
    procs.forEach(function (p, pi) {
      for (r = 0; r < m; r++) {
        if (!p.req[r] || p.req[r] <= avail[r]) continue;
        procs.forEach(function (q, qi) {
          if (qi === pi || !q.alloc[r]) return;
          var k = pi + '>' + qi + '>' + r;
          if (seen[k]) return;
          seen[k] = true;
          edges.push({ from: pi, to: qi, res: r });
        });
      }
    });

    return {
      avail: avail,
      allocSum: allocSum,
      steps: steps,
      order: order,
      stuck: stuck,
      deadlock: stuck.length > 0,
      edges: edges,
      cycle: findCycle(procs.length, edges)
    };
  }

  function findCycle(n, edges) {
    var adj = [];
    var i;
    for (i = 0; i < n; i++) adj.push([]);
    edges.forEach(function (e) {
      if (adj[e.from].indexOf(e.to) < 0) adj[e.from].push(e.to);
    });

    var state = zeros(n);          // 0 = new, 1 = on the stack, 2 = done
    var parent = zeros(n);
    for (i = 0; i < n; i++) parent[i] = -1;
    var result = null;

    function visit(u) {
      state[u] = 1;
      var list = adj[u].slice().sort(function (a, b) { return a - b; });
      for (var k = 0; k < list.length && !result; k++) {
        var v = list[k];
        if (state[v] === 0) {
          parent[v] = u;
          visit(v);
        } else if (state[v] === 1) {
          var path = [u];
          var x = parent[u];
          while (x !== v && x >= 0) { path.push(x); x = parent[x]; }
          path.push(v);
          path.reverse();
          path.push(v);
          result = path;
        }
      }
      state[u] = 2;
    }

    for (var s = 0; s < n && !result; s++) if (state[s] === 0) visit(s);
    return result;
  }
  // Random data with the requested deadlock outcome, found by rejection
  // sampling over the same checks the page uses to grade.
  function genProblem(kind, n, m, inst) {
    var wantDead = kind === 'dead' ? true : kind === 'free' ? false : Math.random() < 0.5;

    for (var attempt = 0; attempt < 700; attempt++) {
      var total = zeros(m).map(function () { return inst; });
      var copies = [];
      var r, i;

      for (r = 0; r < m; r++) {
        var row = zeros(n);
        pickIdx(n, randInt(0, Math.min(total[r], n))).forEach(function (pi) { row[pi] = 1; });
        copies.push(row);
      }

      var alloc = [];
      var req = [];
      var anyReq = false;

      for (i = 0; i < n; i++) {
        var a = zeros(m);
        var q = zeros(m);
        for (r = 0; r < m; r++) {
          a[r] = copies[r][i];
          var room = total[r] - a[r];
          if (room > 0 && Math.random() < 0.55) {
            q[r] = randInt(1, Math.min(2, room));
            anyReq = true;
          }
        }
        alloc.push(a);
        req.push(q);
      }
      if (!anyReq) continue;

      var procs = makeProcs(alloc, req);
      if (!validate(procs, total).ok) continue;
      var an = analyse(procs, total);

      if (wantDead) {
        if (!an.deadlock || an.stuck.length < 2 || !an.cycle) continue;
      } else {
        if (an.deadlock) continue;
        if (!an.order.length) continue;
        var waiting = false;
        procs.forEach(function (p) {
          for (var r2 = 0; r2 < m; r2++) if (p.req[r2] > an.avail[r2]) waiting = true;
        });
        if (!waiting && Math.random() < 0.5) continue;
      }

      return { total: total, alloc: alloc, req: req };
    }
    return fallback(wantDead, n, m, inst);
  }

  // Deterministic last resort so the page always has a usable problem.
  function fallback(wantDead, n, m, inst) {
    var total = zeros(m).map(function () { return inst; });
    var alloc = [];
    var req = [];
    var r, i, c;

    for (i = 0; i < n; i++) { alloc.push(zeros(m)); req.push(zeros(m)); }

    if (wantDead) {
      // Every copy of every resource goes to one holder, then each process asks
      // for a resource it does not hold, so nothing is free and nobody finishes.
      for (r = 0; r < m; r++) alloc[r][r] = total[r];
      for (i = 0; i < n; i++) req[i][(i + 1) % m] = 1;
    } else {
      // One held copy, one request that the free instances can satisfy.
      alloc[0][0] = 1;
      if (m > 1) req[0][1] = 1;
      else if (total[0] > 1) req[0][0] = 1;
    }

    return { total: total, alloc: alloc, req: req };
  }

  /* ---------------- answer key ---------------- */

  // One arrow per allocated pair and one per requested pair.
  function expectedRAG(procs, total) {
    var assign = [];
    var request = [];
    procs.forEach(function (p, pi) {
      for (var r = 0; r < total.length; r++) {
        if (p.alloc[r] > 0) assign.push({ kind: 'assign', p: pi, r: r });
        if (p.req[r] > 0) request.push({ kind: 'request', p: pi, r: r });
      }
    });
    return { assign: assign, request: request };
  }

  function expectedWFG(an) {
    var out = [];
    var seen = {};
    an.edges.forEach(function (e) {
      var k = e.from + '>' + e.to;
      if (seen[k]) return;
      seen[k] = true;
      out.push({ from: e.from, to: e.to });
    });
    return out;
  }

  function ragKey(e) {
    return e.kind + '|' + e.p + '|' + e.r;
  }

  function wfgKey(e) {
    return e.from + '>' + e.to;
  }

  // Drawn arrows against the key: which are right, which are extra, which are
  // missing. Every arrow counts once, so no duplicates reach this point.
  function compareEdges(drawn, expected, keyFn) {
    var want = {};
    var got = {};
    var seenDrawn = {};
    var i, k;

    for (i = 0; i < expected.length; i++) want[keyFn(expected[i])] = true;
    for (i = 0; i < drawn.length; i++) got[keyFn(drawn[i])] = true;

    var correct = {};
    var wrong = {};
    var missing = {};
    var missingList = [];
    var nc = 0;
    var nw = 0;
    var nm = 0;

    for (i = 0; i < drawn.length; i++) {
      k = keyFn(drawn[i]);
      if (seenDrawn[k]) continue;
      seenDrawn[k] = true;
      if (want[k]) { correct[k] = true; nc++; }
      else { wrong[k] = true; nw++; }
    }
    for (i = 0; i < expected.length; i++) {
      k = keyFn(expected[i]);
      if (!got[k]) { missing[k] = true; missingList.push(expected[i]); nm++; }
    }

    return {
      correct: correct,
      wrong: wrong,
      missing: missing,
      missingList: missingList,
      nc: nc,
      nw: nw,
      nm: nm,
      total: expected.length
    };
  }
  /* PURE-END */
  var state = {
    kind: 'mix',
    n: 5,
    m: 2,
    inst: 2,
    total: [2, 2],
    procs: [],
    analysis: null,
    valid: false,
    ragEdges: [],
    wfgEdges: [],
    selRag: null,
    selWfg: null,
    lastFocus: null,
    msgRag: '',
    msgWfg: '',
    ragMarks: {},
    wfgMarks: {},
    ragGrade: null,
    wfgGrade: null,
    verdict: null,
    submitted: false,
    revealed: false
  };

  var KINDS = [
    ['mix', 'Random mix'],
    ['dead', 'Always deadlock'],
    ['free', 'Never deadlock']
  ];
  var NS = [3, 4, 5];
  var MS = [2, 3];
  var INSTS = [1, 2];

  var $ = function (id) { return document.getElementById(id); };
  var el = {};

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function colorFor(pid) {
    var i = (parseInt(pid.slice(1), 10) - 1) % PALETTE.length;
    return PALETTE[i < 0 ? 0 : i];
  }

  function n1(v) {
    return Math.round(v * 10) / 10;
  }

  function pidAt(i) {
    return state.procs[i] ? state.procs[i].pid : 'P' + (i + 1);
  }

  function resName(r) {
    return 'R' + (r + 1);
  }

  /* ---------------- chips and table ---------------- */

  function chipHTML(attr, value, label, on) {
    return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-' + attr + '="' + value + '">' +
      esc(label) + '</button>';
  }

  function instHighlight() {
    var t = state.total;
    for (var i = 0; i < INSTS.length; i++) {
      var v = INSTS[i];
      var same = true;
      for (var k = 0; k < t.length; k++) if (t[k] !== v) same = false;
      if (same) return v;
    }
    return null;
  }

  function renderChips() {
    var hi = instHighlight();
    el.kindChips.innerHTML = KINDS.map(function (k) {
      return chipHTML('kind', k[0], k[1], state.kind === k[0]);
    }).join('');
    el.nChips.innerHTML = NS.map(function (n) {
      return chipHTML('n', n, n, state.n === n);
    }).join('');
    el.mChips.innerHTML = MS.map(function (m) {
      return chipHTML('m', m, m, state.m === m);
    }).join('');
    el.instChips.innerHTML = INSTS.map(function (v) {
      return chipHTML('inst', v, v + ' each', hi === v);
    }).join('');
  }

  function renderTotals() {
    el.totalStrip.innerHTML = '<span class="vec-lbl">Total instances</span>' +
      state.total.map(function (t, r) {
        return '<span class="vec-chip">' + resName(r) +
          '<input class="tot-in" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" ' +
          'data-r="' + r + '" value="' + t + '" aria-label="Total instances of ' + resName(r) + '">' +
          '</span>';
      }).join('');
  }

  function resHeads(m, cls) {
    var s = '';
    for (var r = 0; r < m; r++) {
      s += '<th' + (r === 0 && cls ? ' class="' + cls + '"' : '') + '>' + resName(r) + '</th>';
    }
    return s;
  }

  function grp(label, m) {
    return '<th class="grp" colspan="' + m + '">' + label + '</th>';
  }

  function cellHTML(p, i, group, r) {
    var v = group === 'alloc' ? p.alloc[r] : p.req[r];
    var cls = group === 'req' && r === 0 ? ' gsep' : '';
    return '<td class="anscell' + cls + '">' +
      '<input class="ans cell" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" ' +
      'data-i="' + i + '" data-grp="' + group + '" data-r="' + r + '" value="' + v + '" ' +
      'aria-label="' + p.pid + (group === 'alloc' ? ' allocated ' : ' requested ') + resName(r) + '">' +
      '</td>';
  }

  function renderTable() {
    var m = state.m;
    var head = '<thead><tr>' +
      '<th rowspan="2">Process</th>' +
      grp('Allocated', m) +
      grp('Requested', m) +
      '</tr><tr>' +
      resHeads(m) + resHeads(m, 'gsep') +
      '</tr></thead>';

    var body = state.procs.map(function (p, i) {
      var cells = '<td class="pid"><span class="dot" style="background:' + colorFor(p.pid) + '"></span>' +
        p.pid + '</td>';
      for (var r = 0; r < m; r++) cells += cellHTML(p, i, 'alloc', r);
      for (r = 0; r < m; r++) cells += cellHTML(p, i, 'req', r);
      return '<tr>' + cells + '</tr>';
    }).join('');

    el.entryTable.innerHTML = head + '<tbody>' + body + '</tbody>';
  }

  function dataLineHTML(an) {
    return 'Total ' + fmtV(state.total) + ' &minus; allocated ' + fmtV(an.allocSum) +
      ' = <b>available ' + fmtV(an.avail) + '</b>' +
      ' &middot; ' + state.procs.length + ' processes, ' + state.m + ' resources';
  }

  function syncMarks(bad) {
    var ins = el.entryTable.querySelectorAll('.cell');
    for (var i = 0; i < ins.length; i++) {
      var t = ins[i];
      t.classList.toggle('bad', !!bad[t.dataset.grp + '|' + t.dataset.i + '|' + t.dataset.r]);
    }
    var tots = el.totalStrip.querySelectorAll('.tot-in');
    for (var k = 0; k < tots.length; k++) {
      tots[k].classList.toggle('bad', !!bad['total|' + tots[k].dataset.r]);
    }
  }

  /* ---------------- drawing status ---------------- */

  function ragStatusText() {
    if (!state.valid) return 'Fix the table first.';
    if (state.msgRag) return state.msgRag;
    var sel = state.selRag;
    if (!sel) return 'Click a process then a resource to request; a resource then a process to assign.';
    if (sel.t === 'p') return pidAt(sel.i) + ' selected \u2014 click the resource it requests, or Esc to cancel.';
    return resName(sel.i) + ' selected \u2014 click the process holding an instance, or Esc to cancel.';
  }

  function wfgStatusText() {
    if (!state.valid) return 'Fix the table first.';
    if (state.msgWfg) return state.msgWfg;
    if (state.selWfg == null) return 'Click the process that waits, then the process it waits for.';
    return pidAt(state.selWfg) + ' selected \u2014 click the process it waits for, or Esc to cancel.';
  }

  function countText(list) {
    if (!list.length) return 'no arrows';
    return list.length + (list.length === 1 ? ' arrow' : ' arrows');
  }

  function updateStatus() {
    el.ragStatus.textContent = ragStatusText();
    el.wfgStatus.textContent = wfgStatusText();
    el.ragCount.textContent = countText(state.ragEdges);
    el.wfgCount.textContent = countText(state.wfgEdges);
  }
  /* ---------------- resource allocation graph ---------------- */

  function pathBend(x1, y1, x2, y2, bend) {
    var mx = (x1 + x2) / 2;
    var my = (y1 + y2) / 2;
    var dx = x2 - x1;
    var dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / len;
    var ny = dx / len;
    return 'M' + n1(x1) + ' ' + n1(y1) +
      ' Q' + n1(mx + nx * bend) + ' ' + n1(my + ny * bend) +
      ' ' + n1(x2) + ' ' + n1(y2);
  }

  function markerName(kind, color) {
    if (color === 'good' || color === 'ghost') return kind + 'Good';
    if (color === 'bad') return kind + 'Bad';
    return kind === 'request' ? 'ragReq' : 'ragAssign';
  }

  function ragEdgeHTML(i, d, kind, cls, title) {
    var color = cls === 'good' || cls === 'ghost' ? '#15803d'
      : cls === 'bad' ? '#dc2626' : kind === 'request' ? '#6366f1' : '#334155';
    var dash = kind === 'request' || cls === 'ghost' ? ' stroke-dasharray="6 4"' : '';
    var ghost = cls === 'ghost';
    return '<g class="edge' + (ghost ? ' ghost' : '') + '"' +
      (ghost ? ' pointer-events="none"' : ' data-edge="' + i + '"') + '>' +
      (ghost ? '' : '<path d="' + d + '" fill="none" stroke="transparent" stroke-width="13" pointer-events="stroke"/>') +
      '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="1.9"' + dash +
      ' marker-end="url(#' + markerName(kind, cls) + ')" pointer-events="none"/>' +
      '<title>' + title + '</title></g>';
  }

  function ragHTML(an) {
    var procs = state.procs;
    var total = state.total;
    var n = procs.length;
    var m = total.length;
    var ROW = 58;
    var TOP = 34;
    var W = 560;
    var H = TOP + n * ROW + 16;
    var PX = 68;
    var PR = 18;
    var BW = 148;
    var BH = 50;
    var BX = W - BW - 22;
    var spanTop = TOP + 20;
    var spanH = n * ROW - 20;
    var i, j, c;

    var ppos = [];
    var rpos = [];
    for (i = 0; i < n; i++) ppos.push({ x: PX, y: TOP + ROW / 2 + i * ROW });
    for (j = 0; j < m; j++) {
      rpos.push({ x: BX, y: spanTop + (spanH / m) * (j + 0.5) - BH / 2 });
    }

    var marks = state.ragMarks || {};
    var ghosts = marks.missingList || [];
    var sel = state.selRag;

    // per-resource counters, so each arrow lands on its own dot / slot
    var userReq = zeros(m);
    var userReqTotal = zeros(m);
    var userAssign = zeros(m);
    state.ragEdges.forEach(function (e) {
      if (e.kind === 'request') userReqTotal[e.r]++;
    });

    var ghostReq = zeros(m);
    var ghostReqTotal = zeros(m);
    var ghostAssign = zeros(m);
    ghosts.forEach(function (e) {
      if (e.kind === 'request') ghostReqTotal[e.r]++;
    });

    var s = [];
    s.push('<svg viewBox="0 0 ' + W + ' ' + H + '" style="font-family:inherit" role="img" ' +
      'aria-label="Resource allocation graph canvas for ' + n + ' processes and ' + m + ' resources">');
    s.push('<defs>' +
      '<marker id="ragAssign" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">' +
      '<path d="M0 0 L8 4 L0 8 z" fill="#334155"/></marker>' +
      '<marker id="ragReq" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">' +
      '<path d="M0 0 L8 4 L0 8 z" fill="#6366f1"/></marker>' +
      '<marker id="ragAssignGood" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">' +
      '<path d="M0 0 L8 4 L0 8 z" fill="#15803d"/></marker>' +
      '<marker id="ragReqGood" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">' +
      '<path d="M0 0 L8 4 L0 8 z" fill="#15803d"/></marker>' +
      '<marker id="ragAssignBad" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">' +
      '<path d="M0 0 L8 4 L0 8 z" fill="#dc2626"/></marker>' +
      '<marker id="ragReqBad" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">' +
      '<path d="M0 0 L8 4 L0 8 z" fill="#dc2626"/></marker>' +
      '</defs>');

    // the student's arrows
    state.ragEdges.forEach(function (e, idx) {
      var key = ragKey(e);
      var cls = marks.wrong && marks.wrong[key] ? 'bad' : marks.correct && marks.correct[key] ? 'good' : '';
      var d, title;

      if (e.kind === 'request') {
        var rank = userReq[e.r]++;
        var slots = userReqTotal[e.r];
        var ty = rpos[e.r].y + 10 + (slots <= 1 ? 11 : (24 * rank) / (slots - 1));
        var sx = ppos[e.p].x;
        var sy = ppos[e.p].y;
        var ta = Math.atan2(ty - sy, rpos[e.r].x - sx);
        d = pathBend(sx + Math.cos(ta) * PR, sy + Math.sin(ta) * PR, rpos[e.r].x, ty, 16);
        title = procs[e.p].pid + ' requests ' + resName(e.r);
      } else {
        var slot = userAssign[e.r]++;
        var dot = Math.min(slot, total[e.r] - 1);
        var dx = rpos[e.r].x + 20 + dot * 16;
        var dy = rpos[e.r].y + BH - 15;
        var pp = ppos[e.p];
        var ang = Math.atan2(dy - pp.y, dx - pp.x);
        d = pathBend(dx - 5, dy, pp.x + Math.cos(ang) * PR, pp.y + Math.sin(ang) * PR, -14);
        title = procs[e.p].pid + ' holds an instance of ' + resName(e.r);
      }

      s.push(ragEdgeHTML(idx, d, e.kind, cls, title));
    });

    // the arrows the student missed, shown after marking
    ghosts.forEach(function (e, gi) {
      var d, title;
      if (e.kind === 'request') {
        var rank = ghostReq[e.r]++;
        var slots = ghostReqTotal[e.r];
        var ty = rpos[e.r].y + 10 + (slots <= 1 ? 11 : (24 * rank) / (slots - 1));
        var sx2 = ppos[e.p].x;
        var sy2 = ppos[e.p].y;
        var ta2 = Math.atan2(ty - sy2, rpos[e.r].x - sx2);
        d = pathBend(sx2 + Math.cos(ta2) * PR, sy2 + Math.sin(ta2) * PR, rpos[e.r].x, ty, 16);
        title = 'missing: ' + procs[e.p].pid + ' requests ' + resName(e.r);
      } else {
        var slot2 = ghostAssign[e.r]++;
        var dot2 = Math.min(slot2, total[e.r] - 1);
        var dx2 = rpos[e.r].x + 20 + dot2 * 16;
        var dy2 = rpos[e.r].y + BH - 15;
        var pp2 = ppos[e.p];
        var ang2 = Math.atan2(dy2 - pp2.y, dx2 - pp2.x);
        d = pathBend(dx2 - 5, dy2, pp2.x + Math.cos(ang2) * PR, pp2.y + Math.sin(ang2) * PR, -14);
        title = 'missing: ' + procs[e.p].pid + ' holds an instance of ' + resName(e.r);
      }
      s.push(ragEdgeHTML(gi, d, e.kind, 'ghost', title));
    });

    // resource boxes with their instance dots
    for (j = 0; j < m; j++) {
      var rp = rpos[j];
      var used = Math.min(an.allocSum[j], total[j]);
      var dots = '';
      for (c = 0; c < total[j]; c++) {
        dots += '<circle cx="' + (rp.x + 20 + c * 16) + '" cy="' + (rp.y + BH - 15) + '" r="5" ' +
          (c < used ? 'fill="#334155"' : 'fill="#ffffff" stroke="#94a3b8" stroke-width="1.4"') + '/>';
      }
      s.push('<g class="node' + (sel && sel.t === 'r' && sel.i === j ? ' sel' : '') +
        '" data-node="r:' + j + '" role="button" tabindex="0" aria-label="' + resName(j) + ', ' +
        total[j] + (total[j] === 1 ? ' instance' : ' instances') + '">' +
        '<rect class="shape" x="' + rp.x + '" y="' + rp.y + '" width="' + BW + '" height="' + BH + '" rx="9" ' +
        'fill="#f8fafc" stroke="#94a3b8" stroke-width="1.4"/>' +
        '<text x="' + (rp.x + 11) + '" y="' + (rp.y + 18) +
        '" font-size="12.5" font-weight="700" fill="#0f172a">' + resName(j) + '</text>' +
        '<text x="' + (rp.x + BW - 11) + '" y="' + (rp.y + 18) +
        '" font-size="10" fill="#64748b" text-anchor="end">' + total[j] +
        (total[j] === 1 ? ' instance' : ' instances') + '</text>' + dots + '</g>');
    }

    // process circles last so the arrows sit underneath
    procs.forEach(function (p, pi) {
      var q = ppos[pi];
      s.push('<g class="node' + (sel && sel.t === 'p' && sel.i === pi ? ' sel' : '') +
        '" data-node="p:' + pi + '" role="button" tabindex="0" aria-label="' + p.pid + '">' +
        '<circle class="hit" cx="' + q.x + '" cy="' + q.y + '" r="' + (PR + 9) + '" fill="transparent"/>' +
        '<circle class="shape" cx="' + q.x + '" cy="' + q.y + '" r="' + PR + '" fill="' + colorFor(p.pid) +
        '" stroke="#ffffff" stroke-width="2"/>' +
        '<text x="' + q.x + '" y="' + (q.y + 4.5) +
        '" text-anchor="middle" font-size="11.5" font-weight="700" fill="#ffffff">' + p.pid + '</text></g>');
    });

    s.push('</svg>');
    return s.join('');
  }
  /* ---------------- wait-for graph ---------------- */

  function wfgEdgeHTML(i, d, cls, title) {
    var color = cls === 'good' || cls === 'ghost' ? '#15803d' : cls === 'bad' ? '#dc2626' : '#475569';
    var ghost = cls === 'ghost';
    var marker = cls === 'good' || cls === 'ghost' ? 'wfgGood' : cls === 'bad' ? 'wfgBad' : 'wfgWait';
    var dash = ghost ? ' stroke-dasharray="6 4"' : '';
    return '<g class="edge' + (ghost ? ' ghost' : '') + '"' +
      (ghost ? ' pointer-events="none"' : ' data-edge="' + i + '"') + '>' +
      (ghost ? '' : '<path d="' + d + '" fill="none" stroke="transparent" stroke-width="13" pointer-events="stroke"/>') +
      '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2"' + dash +
      ' marker-end="url(#' + marker + ')" pointer-events="none"/>' +
      '<title>' + title + '</title></g>';
  }

  function wfgHTML() {
    var procs = state.procs;
    var n = procs.length;
    var R = n <= 3 ? 104 : n === 4 ? 120 : 132;
    var NR = 21;
    var W = 430;
    var H = R * 2 + NR * 2 + 26;
    var cx = W / 2;
    var cy = H / 2;

    var pos = procs.map(function (p, i) {
      var a = -Math.PI / 2 + (2 * Math.PI * i) / n;
      return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    });

    var marks = state.wfgMarks || {};
    var ghosts = marks.missingList || [];
    var s = [];

    s.push('<svg viewBox="0 0 ' + W + ' ' + H + '" style="font-family:inherit" role="img" ' +
      'aria-label="Wait-for graph canvas for ' + n + ' processes">');
    s.push('<defs>' +
      '<marker id="wfgWait" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7.5" markerHeight="7.5" orient="auto">' +
      '<path d="M0 0 L8 4 L0 8 z" fill="#475569"/></marker>' +
      '<marker id="wfgGood" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7.5" markerHeight="7.5" orient="auto">' +
      '<path d="M0 0 L8 4 L0 8 z" fill="#15803d"/></marker>' +
      '<marker id="wfgBad" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7.5" markerHeight="7.5" orient="auto">' +
      '<path d="M0 0 L8 4 L0 8 z" fill="#dc2626"/></marker>' +
      '</defs>');

    function drawEdge(from, to) {
      var a = pos[from];
      var b = pos[to];
      var dx = b.x - a.x;
      var dy = b.y - a.y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / len;
      var ny = dx / len;
      var bend = (from < to ? 1 : -1) * 22;
      var mx = (a.x + b.x) / 2 + nx * bend;
      var my = (a.y + b.y) / 2 + ny * bend;
      var sa = Math.atan2(my - a.y, mx - a.x);
      var ea = Math.atan2(my - b.y, mx - b.x);
      return 'M' + n1(a.x + Math.cos(sa) * NR) + ' ' + n1(a.y + Math.sin(sa) * NR) +
        ' Q' + n1(mx) + ' ' + n1(my) + ' ' +
        n1(b.x + Math.cos(ea) * NR) + ' ' + n1(b.y + Math.sin(ea) * NR);
    }

    state.wfgEdges.forEach(function (e, i) {
      var key = wfgKey(e);
      var cls = marks.wrong && marks.wrong[key] ? 'bad' : marks.correct && marks.correct[key] ? 'good' : '';
      s.push(wfgEdgeHTML(i, drawEdge(e.from, e.to), cls,
        pidAt(e.from) + ' waits for ' + pidAt(e.to)));
    });

    ghosts.forEach(function (e, gi) {
      s.push(wfgEdgeHTML(gi, drawEdge(e.from, e.to), 'ghost',
        'missing: ' + pidAt(e.from) + ' waits for ' + pidAt(e.to)));
    });

    procs.forEach(function (p, pi) {
      var q = pos[pi];
      s.push('<g class="node' + (state.selWfg === pi ? ' sel' : '') +
        '" data-node="p:' + pi + '" role="button" tabindex="0" aria-label="' + p.pid + '">' +
        '<circle class="hit" cx="' + q.x + '" cy="' + q.y + '" r="' + (NR + 9) + '" fill="transparent"/>' +
        '<circle class="shape" cx="' + q.x + '" cy="' + q.y + '" r="' + NR + '" fill="' + colorFor(p.pid) +
        '" stroke="#ffffff" stroke-width="2"/>' +
        '<text x="' + q.x + '" y="' + (q.y + 4.5) +
        '" text-anchor="middle" font-size="11.5" font-weight="700" fill="#ffffff">' + p.pid + '</text></g>');
    });

    s.push('</svg>');
    return s.join('');
  }
  /* ---------------- answer key ---------------- */

  function ragExpected() {
    var ref = expectedRAG(state.procs, state.total);
    return ref.assign.concat(ref.request);
  }

  function wfgExpected() {
    return state.analysis ? expectedWFG(state.analysis) : [];
  }

  /* ---------------- drawing state changes ---------------- */

  function resetMarks() {
    state.ragMarks = {};
    state.wfgMarks = {};
    state.ragGrade = null;
    state.wfgGrade = null;
    state.submitted = false;
    state.revealed = false;
    el.reason.hidden = true;
    el.reason.innerHTML = '';
    el.score.innerHTML = '';
  }

  function resetDrawing() {
    state.ragEdges = [];
    state.wfgEdges = [];
    state.selRag = null;
    state.selWfg = null;
    state.msgRag = '';
    state.msgWfg = '';
    resetMarks();
  }

  function markAll() {
    state.ragGrade = compareEdges(state.ragEdges, ragExpected(), ragKey);
    state.wfgGrade = compareEdges(state.wfgEdges, wfgExpected(), wfgKey);
    state.ragMarks = state.ragGrade;
    state.wfgMarks = state.wfgGrade;
  }

  /* ---------------- reason block ---------------- */

  function reasonHTML() {
    var an = state.analysis;
    var out = [];
    var finished = an.steps.map(function (s) { return s.pid; });

    out.push('<div class="sol-head ' + (an.deadlock ? 'sol-bad' : 'sol-good') + '">' +
      (an.deadlock ? 'Deadlock' : 'No deadlock') + '</div>');
    out.push('<div class="sol-foot">Available = ' + fmtV(state.total) + ' &minus; ' +
      fmtV(an.allocSum) + ' = <b>' + fmtV(an.avail) + '</b>.</div>');

    if (an.steps.length) {
      out.push('<ul class="sol-seq">' + an.steps.map(function (s) {
        return '<li><b>' + s.pid + '</b> needs ' + fmtV(s.req) + ' and the work vector is ' +
          fmtV(s.before) + ', so it finishes and releases ' + fmtV(s.alloc) +
          ' &rarr; work ' + fmtV(s.after) + '.</li>';
      }).join('') + '</ul>');
    } else {
      out.push('<div class="sol-foot">No process can start: there is not enough free work for ' +
        'anyone&rsquo;s request.</div>');
    }

    if (an.deadlock) {
      var left = an.steps.length ? an.steps[an.steps.length - 1].after : an.avail;
      out.push('<div class="sol-foot"><b>Stuck:</b> ' +
        an.stuck.map(function (i) { return pidAt(i); }).join(', ') + '.' +
        (finished.length ? ' ' + finished.join(', ') + ' finished first and released their copies,' +
          ' which still was not enough.' : '') + '</div>');

      out.push('<ul class="sol-seq">' + an.stuck.map(function (i) {
        var p = state.procs[i];
        var bits = [];
        for (var r = 0; r < state.total.length; r++) {
          if (!p.req[r] || p.req[r] <= left[r]) continue;
          var holders = [];
          state.procs.forEach(function (q, qi) {
            if (qi !== i && q.alloc[r] > 0) holders.push(q.pid);
          });
          bits.push(p.req[r] + ' of ' + resName(r) + ' (only ' + left[r] +
            ' free, the rest held by ' + (holders.join(', ') || 'no one') + ')');
        }
        return '<li><b>' + p.pid + '</b> waits for ' + (bits.join(' and ') ||
          'copies that never become free') + '.</li>';
      }).join('') + '</ul>');

      if (an.cycle) {
        out.push('<div class="sol-foot"><b>Wait-for cycle:</b> ' +
          an.cycle.map(function (i) { return pidAt(i); }).join(' &rarr; ') + '.</div>');
      }
    } else {
      out.push('<div class="sol-foot"><b>Finished in order:</b> ' +
        finished.join(' &rarr; ') + '. Every request was eventually satisfied, so no deadlock.</div>');
    }

    return out.join('');
  }

  function renderReason() {
    el.reason.innerHTML = reasonHTML();
    el.reason.hidden = false;
  }

  /* ---------------- score ---------------- */

  function edgePill(g, label) {
    if (!g) return '';
    var cls = g.nc === g.total && g.nw === 0 ? 'good' : g.nc === 0 ? 'bad' : 'mid';
    return '<span class="pill ' + cls + '">' + label + ' ' + g.nc + '/' + g.total + '</span>';
  }

  function verdictPill() {
    if (state.verdict == null) return '<span class="pill">Verdict &mdash;</span>';
    var ok = state.verdict === (state.analysis.deadlock ? 'dead' : 'free');
    return '<span class="pill ' + (ok ? 'good' : 'bad') + '">Verdict ' +
      (ok ? '&#10003;' : '&#10007;') + '</span>';
  }

  function renderScore() {
    if (!state.submitted && !state.revealed) {
      el.score.innerHTML = '';
      return;
    }
    var rg = state.ragGrade;
    var wg = state.wfgGrade;
    var right = rg.nc + wg.nc;
    var den = rg.total + wg.total + 1;
    var okV = state.verdict === (state.analysis.deadlock ? 'dead' : 'free');
    if (okV) right++;
    var pct = Math.round((right / den) * 100);
    var cls = pct === 100 ? 'good' : pct >= 60 ? 'mid' : 'bad';

    el.score.innerHTML = edgePill(rg, 'RAG') + edgePill(wg, 'WFG') + verdictPill() +
      '<span class="pill ' + cls + '">' + pct + '%</span>';
  }

  /* ---------------- rendering ---------------- */

  function renderVerdict() {
    var v = state.verdict;
    el.verdictChips.innerHTML =
      '<button type="button" class="chip' + (v === 'dead' ? ' on' : '') + '" data-v="dead">Deadlock</button>' +
      '<button type="button" class="chip' + (v === 'free' ? ' on' : '') + '" data-v="free">No deadlock</button>';
  }

  function renderGraphs() {
    if (!state.valid) {
      el.ragHost.innerHTML = '<div class="graph-empty">Fix the red cells above to draw the graph.</div>';
      el.wfgHost.innerHTML = '<div class="graph-empty">Fix the red cells above to draw the graph.</div>';
      state.lastFocus = null;
      return;
    }
    el.ragHost.innerHTML = ragHTML(state.analysis);
    el.wfgHost.innerHTML = wfgHTML();

    if (state.lastFocus) {
      var host = state.lastFocus.host === 'rag' ? el.ragHost : el.wfgHost;
      var node = host.querySelector('.node[data-node="' + state.lastFocus.key + '"]');
      if (node) node.focus();
      state.lastFocus = null;
    }
  }

  function refresh() {
    state.analysis = analyse(state.procs, state.total);
    var chk = validate(state.procs, state.total);
    state.valid = chk.ok;

    syncMarks(chk.bad);

    if (chk.ok) {
      el.dataLine.className = 'data-line';
      el.dataLine.innerHTML = dataLineHTML(state.analysis);
    } else {
      el.dataLine.className = 'data-line bad';
      el.dataLine.innerHTML = chk.msgs.join('<br>');
    }

    el.editHint.textContent = state.ragEdges.length || state.wfgEdges.length
      ? 'Editing the table clears the arrows you drew.'
      : 'Type the table, then draw the arrows by hand.';
    el.wfgNote.innerHTML = 'Available = total &minus; allocated. A request the free copies can ' +
      'satisfy is granted and creates <b>no</b> wait arrow.';

    renderGraphs();
    updateStatus();
    renderScore();
  }

  function rebuild() {
    renderChips();
    renderTotals();
    renderTable();
    renderVerdict();
    refresh();
  }

  /* ---------------- RAG interaction ---------------- */

  function toggleRag(kind, p, r) {
    for (var i = 0; i < state.ragEdges.length; i++) {
      var e = state.ragEdges[i];
      if (e.kind === kind && e.p === p && e.r === r) {
        state.ragEdges.splice(i, 1);
        return false;
      }
    }
    state.ragEdges.push({ kind: kind, p: p, r: r });
    return true;
  }

  function nodeOf(ev) {
    var t = ev.target;
    return t && t.closest ? t.closest('.node') : null;
  }

  function edgeOf(ev) {
    var t = ev.target;
    return t && t.closest ? t.closest('.edge[data-edge]') : null;
  }

  function onRagClick(ev) {
    if (!state.valid) return;

    var edge = edgeOf(ev);
    if (edge) {
      state.ragEdges.splice(+edge.getAttribute('data-edge'), 1);
      state.msgRag = 'Arrow removed.';
      afterDraw();
      return;
    }

    var node = nodeOf(ev);
    if (!node) return;
    var parts = node.getAttribute('data-node').split(':');
    var t = parts[0];
    var idx = +parts[1];
    var sel = state.selRag;

    state.lastFocus = ev.keyboard ? { host: 'rag', key: node.getAttribute('data-node') } : null;
    state.msgRag = '';

    if (!sel) {
      state.selRag = { t: t, i: idx };
      afterDraw();
      return;
    }
    if (sel.t === t && sel.i === idx) {
      state.selRag = null;
      afterDraw();
      return;
    }

    if (sel.t === 'p' && t === 'r') {
      var added = toggleRag('request', sel.i, idx);
      state.msgRag = pidAt(sel.i) + ' requests ' + resName(idx) + (added ? ' added.' : ' removed.');
      state.selRag = null;
    } else if (sel.t === 'r' && t === 'p') {
      added = toggleRag('assign', idx, sel.i);
      state.msgRag = pidAt(idx) + ' holds an instance of ' + resName(sel.i) +
        (added ? ' added.' : ' removed.');
      state.selRag = null;
    } else {
      state.msgRag = t === 'p'
        ? 'A process points at a resource. Pick a resource.'
        : 'A resource points at a process. Pick a process.';
      state.selRag = { t: t, i: idx };
    }
    afterDraw();
  }

  /* ---------------- WFG interaction ---------------- */

  function toggleWfg(from, to) {
    for (var i = 0; i < state.wfgEdges.length; i++) {
      var e = state.wfgEdges[i];
      if (e.from === from && e.to === to) {
        state.wfgEdges.splice(i, 1);
        return false;
      }
    }
    state.wfgEdges.push({ from: from, to: to });
    return true;
  }

  function onWfgClick(ev) {
    if (!state.valid) return;

    var edge = edgeOf(ev);
    if (edge) {
      state.wfgEdges.splice(+edge.getAttribute('data-edge'), 1);
      state.msgWfg = 'Arrow removed.';
      afterDraw();
      return;
    }

    var node = nodeOf(ev);
    if (!node) return;
    var idx = +node.getAttribute('data-node').split(':')[1];
    var sel = state.selWfg;

    state.lastFocus = ev.keyboard ? { host: 'wfg', key: node.getAttribute('data-node') } : null;
    state.msgWfg = '';

    if (sel == null) {
      state.selWfg = idx;
      afterDraw();
      return;
    }
    if (sel === idx) {
      state.selWfg = null;
      afterDraw();
      return;
    }

    var added = toggleWfg(sel, idx);
    state.msgWfg = pidAt(sel) + ' waits for ' + pidAt(idx) + (added ? ' added.' : ' removed.');
    state.selWfg = null;
    afterDraw();
  }

  function afterDraw() {
    if (state.submitted || state.revealed) resetMarks();
    renderGraphs();
    updateStatus();
    renderScore();
  }

  function keyboardActivate(handler) {
    return function (ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      var node = nodeOf(ev) || edgeOf(ev);
      if (!node) return;
      ev.preventDefault();
      handler({ target: node, keyboard: true });
    };
  }

  /* ---------------- data editing ---------------- */

  function digits(v) {
    var n = parseInt(String(v).replace(/\D+/g, ''), 10);
    if (isNaN(n)) n = 0;
    return Math.max(0, Math.min(9, n));
  }

  function invalidateDrawing() {
    if (state.ragEdges.length || state.wfgEdges.length) resetDrawing();
    state.selRag = null;
    state.selWfg = null;
    state.msgRag = '';
    state.msgWfg = '';
  }

  function onCellInput(ev) {
    var t = ev.target;
    if (!t.classList || !t.classList.contains('cell')) return;
    var v = digits(t.value);
    if (t.value !== String(v)) t.value = String(v);

    var p = state.procs[+t.dataset.i];
    if (!p) return;
    if (t.dataset.grp === 'alloc') p.alloc[+t.dataset.r] = v;
    else p.req[+t.dataset.r] = v;

    invalidateDrawing();
    resetMarks();
    renderGraphs();
    refresh();
  }

  function onTotalInput(ev) {
    var t = ev.target;
    if (!t.classList || !t.classList.contains('tot-in')) return;
    var v = digits(t.value);
    if (t.value !== String(v)) t.value = String(v);
    state.total[+t.dataset.r] = v;
    renderChips();
    invalidateDrawing();
    resetMarks();
    renderGraphs();
    refresh();
  }

  /* ---------------- controls ---------------- */

  function setProblem(kind, n, m, inst) {
    state.kind = kind;
    state.n = n;
    state.m = m;
    state.inst = inst;
    newProblem();
  }

  function newProblem() {
    var p = genProblem(state.kind, state.n, state.m, state.inst);
    state.total = p.total;
    state.procs = makeProcs(p.alloc, p.req);
    state.verdict = null;
    resetDrawing();
    rebuild();
  }

  function clearCells() {
    state.procs.forEach(function (p) {
      for (var r = 0; r < state.total.length; r++) {
        p.alloc[r] = 0;
        p.req[r] = 0;
      }
    });
    resetDrawing();
    renderTable();
    refresh();
  }

  /* ---------------- boot ---------------- */

  function boot() {
    el = {
      kindChips: $('kindChips'),
      nChips: $('nChips'),
      mChips: $('mChips'),
      instChips: $('instChips'),
      totalStrip: $('totalStrip'),
      dataLine: $('dataLine'),
      entryTable: $('entryTable'),
      editHint: $('editHint'),
      verdictChips: $('verdictChips'),
      reason: $('reason'),
      ragHost: $('ragHost'),
      wfgHost: $('wfgHost'),
      ragStatus: $('ragStatus'),
      wfgStatus: $('wfgStatus'),
      ragCount: $('ragCount'),
      wfgCount: $('wfgCount'),
      wfgNote: $('wfgNote'),
      score: $('score')
    };

    var p = genProblem(state.kind, state.n, state.m, state.inst);
    state.total = p.total;
    state.procs = makeProcs(p.alloc, p.req);
    rebuild();

    el.kindChips.addEventListener('click', function (ev) {
      var c = ev.target.closest('[data-kind]');
      if (!c) return;
      state.kind = c.getAttribute('data-kind');
      newProblem();
    });

    el.nChips.addEventListener('click', function (ev) {
      var c = ev.target.closest('[data-n]');
      if (!c) return;
      setProblem(state.kind, +c.getAttribute('data-n'), state.m, state.inst);
    });

    el.mChips.addEventListener('click', function (ev) {
      var c = ev.target.closest('[data-m]');
      if (!c) return;
      setProblem(state.kind, state.n, +c.getAttribute('data-m'), state.inst);
    });

    el.instChips.addEventListener('click', function (ev) {
      var c = ev.target.closest('[data-inst]');
      if (!c) return;
      setProblem(state.kind, state.n, state.m, +c.getAttribute('data-inst'));
    });

    $('newBtn').addEventListener('click', newProblem);
    $('clearBtn').addEventListener('click', clearCells);

    el.entryTable.addEventListener('input', onCellInput);
    el.entryTable.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      var t = ev.target.closest('.cell');
      if (!t) return;
      ev.preventDefault();
      var all = Array.prototype.slice.call(el.entryTable.querySelectorAll('.cell'));
      var i = all.indexOf(t);
      if (i >= 0 && i < all.length - 1) all[i + 1].focus();
    });

    el.totalStrip.addEventListener('input', onTotalInput);

    el.ragHost.addEventListener('click', onRagClick);
    el.wfgHost.addEventListener('click', onWfgClick);
    el.ragHost.addEventListener('keydown', keyboardActivate(onRagClick));
    el.wfgHost.addEventListener('keydown', keyboardActivate(onWfgClick));

    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      if (state.selRag == null && state.selWfg == null) return;
      state.selRag = null;
      state.selWfg = null;
      state.msgRag = '';
      state.msgWfg = '';
      renderGraphs();
      updateStatus();
    });

    $('ragClear').addEventListener('click', function () {
      state.ragEdges = [];
      state.selRag = null;
      state.msgRag = '';
      resetMarks();
      renderGraphs();
      updateStatus();
      renderScore();
    });

    $('wfgClear').addEventListener('click', function () {
      state.wfgEdges = [];
      state.selWfg = null;
      state.msgWfg = '';
      resetMarks();
      renderGraphs();
      updateStatus();
      renderScore();
    });

    el.verdictChips.addEventListener('click', function (ev) {
      var c = ev.target.closest('[data-v]');
      if (!c) return;
      state.verdict = c.getAttribute('data-v');
      if (state.submitted || state.revealed) resetMarks();
      renderVerdict();
      renderScore();
    });

    $('submitBtn').addEventListener('click', function () {
      if (!state.valid) {
        el.score.innerHTML = '<span class="pill bad">Fix the table first</span>';
        return;
      }
      markAll();
      state.submitted = true;
      state.revealed = false;
      state.selRag = null;
      state.selWfg = null;
      state.msgRag = '';
      state.msgWfg = '';
      renderGraphs();
      updateStatus();
      renderScore();
      renderReason();
    });

    $('retryBtn').addEventListener('click', function () {
      resetMarks();
      renderGraphs();
      updateStatus();
      renderScore();
    });

    $('revealBtn').addEventListener('click', function () {
      if (!state.valid) return;
      markAll();
      state.revealed = true;
      state.selRag = null;
      state.selWfg = null;
      state.msgRag = '';
      state.msgWfg = '';
      renderGraphs();
      updateStatus();
      renderScore();
      renderReason();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

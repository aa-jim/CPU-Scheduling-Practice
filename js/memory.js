(function () {
  'use strict';

  /* PURE-START */
  var ALGOS = [
    { key: 'first', label: 'First-fit', rule: '<b>First-fit</b>: allocate each job to the first memory block (from the start) that is large enough.' },
    { key: 'best',  label: 'Best-fit',  rule: '<b>Best-fit</b>: allocate each job to the smallest memory block that is large enough (tightest fit).' },
    { key: 'next',  label: 'Next-fit',  rule: '<b>Next-fit</b>: like first-fit, but the search resumes from where the last allocation was made (wrapping around if needed).' },
    { key: 'worst', label: 'Worst-fit', rule: '<b>Worst-fit</b>: allocate each job to the largest memory block that is large enough.' }
  ];

  var EXAMPLE = {
    jobs: [{ name: 'A', size: 44 }, { name: 'B', size: 20 }, { name: 'C', size: 70 }, { name: 'D', size: 30 }],
    blocks: [{ name: '1', size: 60 }, { name: '2', size: 70 }, { name: '3', size: 80 }, { name: '4', size: 20 }, { name: '5', size: 40 }]
  };

  function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

  function cloneBlocks(blocks) {
    var out = [];
    for (var i = 0; i < blocks.length; i++) out.push({ name: blocks[i].name, size: blocks[i].size, job: null, jobSize: null });
    return out;
  }

  function allocate(jobs, blocks, algoKey) {
    var b = cloneBlocks(blocks);
    var placements = [];
    var nextStart = 0;

    for (var j = 0; j < jobs.length; j++) {
      var job = jobs[j];
      var chosen = -1;
      var reason = '';

      if (algoKey === 'first') {
        for (var i = 0; i < b.length; i++) { if (b[i].job === null && b[i].size >= job.size) { chosen = i; break; } }
        reason = chosen === -1 ? 'No block large enough.' : 'First block (from start) that fits.';
      } else if (algoKey === 'best') {
        var bestSize = Infinity;
        for (var bi = 0; bi < b.length; bi++) {
          if (b[bi].job === null && b[bi].size >= job.size && b[bi].size < bestSize) { bestSize = b[bi].size; chosen = bi; }
        }
        reason = chosen === -1 ? 'No block large enough.' : 'Smallest block that fits (best fit).';
      } else if (algoKey === 'next') {
        var count = 0, idx = nextStart;
        while (count < b.length) {
          if (b[idx].job === null && b[idx].size >= job.size) { chosen = idx; break; }
          idx = (idx + 1) % b.length; count++;
        }
        if (chosen === -1) { reason = 'No block large enough (scanned all blocks).'; }
        else { reason = 'First fit searching from block ' + b[nextStart].name + '.'; nextStart = (chosen + 1) % b.length; }
      } else { // worst
        var worstSize = -1;
        for (var wi = 0; wi < b.length; wi++) {
          if (b[wi].job === null && b[wi].size >= job.size && b[wi].size > worstSize) { worstSize = b[wi].size; chosen = wi; }
        }
        reason = chosen === -1 ? 'No block large enough.' : 'Largest block that fits (worst fit).';
      }

      if (chosen !== -1) {
        b[chosen].job = job.name; b[chosen].jobSize = job.size;
        placements.push({ job: job.name, size: job.size, blockIndex: chosen, blockName: b[chosen].name, blockSize: b[chosen].size, internal: b[chosen].size - job.size, placed: true, reason: reason });
      } else {
        placements.push({ job: job.name, size: job.size, blockIndex: -1, blockName: null, blockSize: null, internal: 0, placed: false, reason: reason });
      }
    }

    var internal = 0, external = 0;
    for (var k = 0; k < b.length; k++) {
      if (b[k].job === null) external += b[k].size; else internal += b[k].size - b[k].jobSize;
    }
    return { algo: algoKey, blocks: b, placements: placements, internal: internal, external: external };
  }

  function solveAll(jobs, blocks) {
    var out = {};
    ALGOS.forEach(function (a) { out[a.key] = allocate(jobs, blocks, a.key); });
    return out;
  }

  function nameFor(i) { return String.fromCharCode(65 + i); }

  function generateProblem(jobCount, blockCount) {
    for (var attempt = 0; attempt < 300; attempt++) {
      var jobs = [], blocks = [];
      for (var j = 0; j < jobCount; j++) jobs.push({ name: nameFor(j), size: randInt(10, 90) });
      for (var b = 0; b < blockCount; b++) blocks.push({ name: String(b + 1), size: randInt(15, 100) });
      var r = allocate(jobs, blocks, 'first');
      var placed = 0; for (var p = 0; p < r.placements.length; p++) if (r.placements[p].placed) placed++;
      if (placed >= Math.min(2, jobCount)) return { jobs: jobs, blocks: blocks };
    }
    return { jobs: EXAMPLE.jobs.slice(), blocks: EXAMPLE.blocks.slice() };
  }

  function parseCustom(text, kind) {
    var parts = String(text).split(/[\n,]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
    if (!parts.length) return { error: 'Enter at least 1 ' + (kind === 'job' ? 'job' : 'block') + '.' };
    if (parts.length > 10) return { error: 'Use at most 10 ' + (kind === 'job' ? 'jobs' : 'blocks') + '.' };
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var m = parts[i].match(/^([^:\s]+)\s*[:=\s]\s*(\d+)$/);
      if (!m) return { error: 'Could not parse "' + parts[i] + '". Use Name:Size (e.g. A:44).' };
      var name = m[1], size = parseInt(m[2], 10);
      if (size < 1 || size > 999) return { error: 'Sizes must be between 1 and 999 KB.' };
      out.push({ name: name, size: size });
    }
    return { items: out };
  }
  /* PURE-END */

  var state = {
    jobCount: 4, blockCount: 5,
    jobs: [], blocks: [],
    inputs: {}, // key -> { cells: [{job, frag}, ...], internal: '', external: '' }
    solutions: null,
    submitted: false, revealed: false
  };

  var $ = function (id) { return document.getElementById(id); };
  var el = {};
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function normName(v) { return String(v == null ? '' : v).trim(); }
  function namesEq(a, b) { return normName(a).toLowerCase() === normName(b).toLowerCase(); }
  function normFrag(v) { var s = String(v == null ? '' : v).trim(); return (s === '' || s === '-' || s === '—' || s === '–') ? '' : s; }

  function emptyInputs() {
    var inp = {};
    ALGOS.forEach(function (a) {
      var cells = []; for (var i = 0; i < state.blocks.length; i++) cells.push({ job: '', frag: '' });
      inp[a.key] = { cells: cells, internal: '', external: '' };
    });
    return inp;
  }

  function resetInputs() {
    state.inputs = emptyInputs();
    state.submitted = false; state.revealed = false;
  }

  function recompute() { state.solutions = solveAll(state.jobs, state.blocks); }

  function renderChips() {
    el.jobChips.innerHTML = [3, 4, 5, 6].map(function (n) { return '<button type="button" class="chip' + (state.jobCount === n ? ' on' : '') + '" data-jobs="' + n + '">' + n + '</button>'; }).join('');
    el.blockChips.innerHTML = [4, 5, 6, 7].map(function (n) { return '<button type="button" class="chip' + (state.blockCount === n ? ' on' : '') + '" data-blocks="' + n + '">' + n + '</button>'; }).join('');
  }

  function renderGiven() {
    var jh = '<thead><tr><th>Job</th><th>Size (KB)</th></tr></thead><tbody>';
    state.jobs.forEach(function (j) { jh += '<tr><td class="pid">' + esc(j.name) + '</td><td>' + j.size + '</td></tr>'; });
    jh += '</tbody>'; el.jobTable.innerHTML = jh;
    var bh = '<thead><tr><th>Block</th><th>Size (KB)</th></tr></thead><tbody>';
    state.blocks.forEach(function (b) { bh += '<tr><td class="pid">' + esc(b.name) + '</td><td>' + b.size + '</td></tr>'; });
    bh += '</tbody>'; el.blockTable.innerHTML = bh;
  }

  function renderStrategies() {
    var html = '';
    ALGOS.forEach(function (a) {
      var inp = state.inputs[a.key];
      html += '<section class="panel mem-strat" data-algo="' + a.key + '">' +
        '<div class="panel-head"><h2><span class="step">' + a.label + '</span></h2><span class="note">' + a.rule + '</span></div>' +
        '<div class="table-wrap"><table class="mem-alloc"><thead><tr><th>Block</th><th>Block size (KB)</th><th>Job placed (with internal fragmentation)</th></tr></thead><tbody>';
      state.blocks.forEach(function (b, i) {
        var cell = inp.cells[i] || { job: '', frag: '' };
        html += '<tr><td class="pid">' + esc(b.name) + '</td><td>' + b.size + '</td>' +
          '<td class="anscell mem-alloc-cell" data-algo="' + a.key + '" data-i="' + i + '">' +
          '<div class="mem-dual">' +
            '<input class="ans mem-alloc-in mem-job-in" type="text" autocomplete="off" spellcheck="false" maxlength="6" data-algo="' + a.key + '" data-i="' + i + '" data-field="job" value="' + esc(cell.job) + '" aria-label="' + esc(a.label) + ' job in block ' + esc(b.name) + '" placeholder="Job">' +
            '<input class="ans mem-alloc-in mem-bfrag-in" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" maxlength="5" data-algo="' + a.key + '" data-i="' + i + '" data-field="frag" value="' + esc(cell.frag) + '" aria-label="' + esc(a.label) + ' internal fragmentation for block ' + esc(b.name) + '" placeholder="IF">' +
          '</div>' +
          '<span class="sol" hidden></span></td></tr>';
      });
      html += '</tbody></table></div>' +
        '<div class="mem-frag-row">' +
          '<label class="total-field">Internal fragmentation (KB)' +
            '<input class="ans total-in mem-frag-in" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" maxlength="5" data-algo="' + a.key + '" data-kind="internal" value="' + esc(inp.internal) + '" aria-label="' + esc(a.label) + ' total internal fragmentation">' +
            '<span class="sol" data-sol="' + a.key + '-internal" hidden></span>' +
          '</label>' +
          '<label class="total-field">External fragmentation (KB)' +
            '<input class="ans total-in mem-frag-in" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" maxlength="5" data-algo="' + a.key + '" data-kind="external" value="' + esc(inp.external) + '" aria-label="' + esc(a.label) + ' external fragmentation">' +
            '<span class="sol" data-sol="' + a.key + '-external" hidden></span>' +
          '</label>' +
        '</div>' +
      '</section>';
    });
    el.strategies.innerHTML = html;
  }

  function hideSolution() { el.solutionPanel.hidden = true; el.solSummary.innerHTML = ''; }

  function renderSolution() {
    var html = '<div class="table-wrap"><table class="mem-compare"><thead><tr><th>Strategy</th>' +
      state.blocks.map(function (b) { return '<th>Block ' + esc(b.name) + '<br><span class="muted">' + b.size + ' KB</span></th>'; }).join('') +
      '<th>Internal (KB)</th><th>External (KB)</th></tr></thead><tbody>';
    ALGOS.forEach(function (a) {
      var sol = state.solutions[a.key];
      html += '<tr><td class="pid">' + esc(a.label) + '</td>';
      sol.blocks.forEach(function (b) {
        var placed = b.job !== null;
        var ifrag = placed ? (b.size - b.jobSize) : null;
        html += '<td class="' + (placed ? 'mem-cell-placed' : 'mem-cell-free') + '">' +
          (placed ? '<b>' + esc(b.job) + '</b><div class="muted small">IF ' + ifrag + ' KB</div>' : '&mdash;') + '</td>';
      });
      html += '<td><b>' + sol.internal + '</b></td><td><b>' + sol.external + '</b></td></tr>';
    });
    html += '</tbody></table></div>';

    ALGOS.forEach(function (a) {
      var sol = state.solutions[a.key];
      var unplaced = sol.placements.filter(function (p) { return !p.placed; }).map(function (p) { return p.job; });
      html += '<details class="why mem-why"><summary>' + esc(a.label) + ' &mdash; placement steps' + (unplaced.length ? ' <span class="pill bad">unplaced: ' + esc(unplaced.join(', ')) + '</span>' : '') + '</summary><ul class="mem-steps">';
      sol.placements.forEach(function (p) {
        if (p.placed) html += '<li><b>' + esc(p.job) + '</b> (' + p.size + ' KB) &rarr; Block ' + esc(p.blockName) + ' (' + p.blockSize + ' KB), internal = ' + p.blockSize + ' &minus; ' + p.size + ' = <b>' + p.internal + ' KB</b>. <span class="muted">' + esc(p.reason) + '</span></li>';
        else html += '<li><b>' + esc(p.job) + '</b> (' + p.size + ' KB) &rarr; <b>not placed</b>. <span class="muted">' + esc(p.reason) + '</span></li>';
      });
      html += '</ul></details>';
    });

    el.solSummary.innerHTML = html;
  }

  function grade() {
    var totalPoints = 0, gotPoints = 0;
    var parts = [];

    ALGOS.forEach(function (a) {
      var sol = state.solutions[a.key];
      var inp = state.inputs[a.key];
      var aGot = 0, aTotal = (state.blocks.length * 2) + 2;

      state.blocks.forEach(function (b, i) {
        var section = el.strategies.querySelector('.mem-strat[data-algo="' + a.key + '"]');
        if (!section) return;
        var cell = section.querySelector('td.mem-alloc-cell[data-i="' + i + '"]');
        if (!cell) return;
        var jobIn = cell.querySelector('.mem-job-in');
        var fragIn = cell.querySelector('.mem-bfrag-in');
        var solSpan = cell.querySelector('.sol');
        if (!jobIn || !fragIn || !solSpan) return;

        var expJob = sol.blocks[i].job;
        var expFrag = expJob === null ? null : (sol.blocks[i].size - sol.blocks[i].jobSize);

        var gotJobRaw = normName(jobIn.value);
        var gotJobEmpty = (gotJobRaw === '' || gotJobRaw === '-' || gotJobRaw === '—' || gotJobRaw === '–');
        var jobOk = expJob === null ? gotJobEmpty : namesEq(gotJobRaw, expJob);

        var gotFragRaw = normFrag(fragIn.value);
        var fragOk;
        if (expFrag === null) {
          fragOk = (gotFragRaw === '');
        } else {
          var gf = gotFragRaw === '' ? NaN : Number(gotFragRaw);
          fragOk = isFinite(gf) && gf === expFrag;
        }

        if (jobOk) aGot++;
        if (fragOk) aGot++;
        jobIn.classList.toggle('ok', state.submitted && jobOk);
        jobIn.classList.toggle('bad', state.submitted && !jobOk);
        fragIn.classList.toggle('ok', state.submitted && fragOk);
        fragIn.classList.toggle('bad', state.submitted && !fragOk);

        if (state.revealed && !(jobOk && fragOk)) {
          var expJobTxt = expJob === null ? '—' : expJob;
          var expFragTxt = expFrag === null ? '—' : String(expFrag);
          solSpan.textContent = '= ' + expJobTxt + ', IF ' + expFragTxt;
          solSpan.hidden = false;
        } else {
          solSpan.textContent = '';
          solSpan.hidden = true;
        }
      });

      ['internal', 'external'].forEach(function (kind) {
        var fin = el.strategies.querySelector('.mem-frag-in[data-algo="' + a.key + '"][data-kind="' + kind + '"]');
        var sspan = el.strategies.querySelector('.sol[data-sol="' + a.key + '-' + kind + '"]');
        if (!fin || !sspan) return;
        var raw = String(fin.value == null ? '' : fin.value).trim();
        var n = raw === '' ? NaN : Number(raw);
        var expected = sol[kind];
        var ok = isFinite(n) && n === expected;
        if (ok) aGot++;
        fin.classList.toggle('ok', state.submitted && ok);
        fin.classList.toggle('bad', state.submitted && !ok);
        if (state.revealed && !ok) { sspan.textContent = '= ' + expected; sspan.hidden = false; }
        else { sspan.textContent = ''; sspan.hidden = true; }
      });

      totalPoints += aTotal; gotPoints += aGot;
      parts.push({ label: a.label, got: aGot, total: aTotal });
    });

    if (state.submitted) {
      var pct = Math.round((gotPoints / totalPoints) * 100);
      function pill(cls, text) { return '<span class="pill ' + cls + '">' + text + '</span>'; }
      function cls(ok, tot) { return ok === tot ? 'good' : (ok === 0 ? 'bad' : 'mid'); }
      var html = pill(pct === 100 ? 'good' : (pct < 50 ? 'bad' : 'mid'), pct + '%');
      parts.forEach(function (p) { html += pill(cls(p.got, p.total), p.label + ' ' + p.got + '/' + p.total); });
      el.score.innerHTML = html;
    } else {
      el.score.innerHTML = '';
    }
  }

  function clearMarks() {
    el.strategies.querySelectorAll('.ans').forEach(function (n) { n.classList.remove('ok', 'bad'); });
    el.strategies.querySelectorAll('.sol').forEach(function (n) { n.textContent = ''; n.hidden = true; });
    el.score.innerHTML = '';
  }

  function submit() { state.submitted = true; grade(); }
  function retry() { state.submitted = false; state.revealed = false; hideSolution(); clearMarks(); }
  function showSolution() { state.submitted = true; state.revealed = true; renderSolution(); el.solutionPanel.hidden = false; grade(); }

  function renderAll() { renderChips(); renderGiven(); renderStrategies(); hideSolution(); clearMarks(); }

  function setProblem(jobs, blocks) {
    state.jobs = jobs.map(function (j) { return { name: j.name, size: j.size }; });
    state.blocks = blocks.map(function (b) { return { name: b.name, size: b.size }; });
    state.jobCount = state.jobs.length; state.blockCount = state.blocks.length;
    recompute(); resetInputs(); renderAll();
  }

  function newProblem() { var p = generateProblem(state.jobCount, state.blockCount); setProblem(p.jobs, p.blocks); }
  function loadExample() { setProblem(EXAMPLE.jobs, EXAMPLE.blocks); }

  function applyCustom() {
    var pj = parseCustom(el.customJobs.value, 'job');
    var pb = parseCustom(el.customBlocks.value, 'block');
    if (pj.error) { el.customMsg.textContent = pj.error; el.customMsg.className = 'custom-msg bad'; return; }
    if (pb.error) { el.customMsg.textContent = pb.error; el.customMsg.className = 'custom-msg bad'; return; }
    setProblem(pj.items, pb.items);
    el.customMsg.textContent = 'Loaded ' + pj.items.length + ' job(s) and ' + pb.items.length + ' block(s).';
    el.customMsg.className = 'custom-msg good';
  }

  function bind() {
    el = {
      jobChips: $('jobChips'), blockChips: $('blockChips'),
      newBtn: $('newBtn'), exampleBtn: $('exampleBtn'), customToggle: $('customToggle'),
      customPanel: $('customPanel'), customJobs: $('customJobs'), customBlocks: $('customBlocks'),
      customApply: $('customApply'), customCancel: $('customCancel'), customMsg: $('customMsg'),
      jobTable: $('jobTable'), blockTable: $('blockTable'), strategies: $('strategies'),
      solutionPanel: $('solutionPanel'), solSummary: $('solSummary'),
      score: $('score'), submitBtn: $('submitBtn'), retryBtn: $('retryBtn'), revealBtn: $('revealBtn')
    };

    el.jobChips.addEventListener('click', function (e) { var b = e.target.closest('[data-jobs]'); if (!b) return; var n = parseInt(b.dataset.jobs, 10); if (n === state.jobCount) return; state.jobCount = n; newProblem(); });
    el.blockChips.addEventListener('click', function (e) { var b = e.target.closest('[data-blocks]'); if (!b) return; var n = parseInt(b.dataset.blocks, 10); if (n === state.blockCount) return; state.blockCount = n; newProblem(); });
    el.newBtn.addEventListener('click', newProblem);
    el.exampleBtn.addEventListener('click', loadExample);
    el.customToggle.addEventListener('click', function () { var show = el.customPanel.hidden; el.customPanel.hidden = !show; el.customToggle.classList.toggle('on', show); if (show) el.customJobs.focus(); });
    el.customCancel.addEventListener('click', function () { el.customPanel.hidden = true; el.customToggle.classList.remove('on'); });
    el.customApply.addEventListener('click', applyCustom);

    function focusSel(sel) { var n = el.strategies.querySelector(sel); if (n) { n.focus(); try { n.select(); } catch (err) {} } }

    el.strategies.addEventListener('input', function (e) {
      var inp = e.target;
      if (inp.classList.contains('mem-alloc-in')) {
        var algo = inp.dataset.algo, i = parseInt(inp.dataset.i, 10), field = inp.dataset.field;
        if (field === 'job') {
          inp.value = inp.value.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 6);
          state.inputs[algo].cells[i].job = inp.value;
        } else {
          inp.value = inp.value.replace(/[^\d\-–—]/g, '').slice(0, 5);
          state.inputs[algo].cells[i].frag = inp.value;
        }
      } else if (inp.classList.contains('mem-frag-in')) {
        var algo2 = inp.dataset.algo, kind = inp.dataset.kind;
        inp.value = inp.value.replace(/\D/g, '').slice(0, 5);
        state.inputs[algo2][kind] = inp.value;
      } else return;
      if (state.submitted) grade();
    });

    el.strategies.addEventListener('keydown', function (e) {
      var inp = e.target;
      if (inp.classList.contains('mem-alloc-in')) {
        var algo = inp.dataset.algo, i = parseInt(inp.dataset.i, 10), field = inp.dataset.field;
        if (e.key === 'Enter' || e.key === 'ArrowDown') {
          e.preventDefault();
          if (field === 'job') {
            focusSel('.mem-bfrag-in[data-algo="' + algo + '"][data-i="' + i + '"]');
          } else {
            if (i < state.blocks.length - 1) focusSel('.mem-job-in[data-algo="' + algo + '"][data-i="' + (i + 1) + '"]');
            else focusSel('.mem-frag-in[data-algo="' + algo + '"][data-kind="internal"]');
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (field === 'frag') {
            focusSel('.mem-job-in[data-algo="' + algo + '"][data-i="' + i + '"]');
          } else {
            if (i > 0) focusSel('.mem-bfrag-in[data-algo="' + algo + '"][data-i="' + (i - 1) + '"]');
          }
        } else if (e.key === 'ArrowRight' && inp.selectionStart === inp.value.length && field === 'job') {
          e.preventDefault();
          focusSel('.mem-bfrag-in[data-algo="' + algo + '"][data-i="' + i + '"]');
        } else if (e.key === 'ArrowLeft' && inp.selectionStart === 0 && field === 'frag') {
          e.preventDefault();
          focusSel('.mem-job-in[data-algo="' + algo + '"][data-i="' + i + '"]');
        }
      } else if (inp.classList.contains('mem-frag-in')) {
        var algo4 = inp.dataset.algo, kind4 = inp.dataset.kind;
        if (e.key === 'Enter') {
          e.preventDefault();
          if (kind4 === 'internal') { focusSel('.mem-frag-in[data-algo="' + algo4 + '"][data-kind="external"]'); }
          else {
            var keys = ALGOS.map(function (a) { return a.key; });
            var ki = keys.indexOf(algo4);
            if (ki >= 0 && ki < keys.length - 1) focusSel('.mem-job-in[data-algo="' + keys[ki + 1] + '"][data-i="0"]');
            else submit();
          }
        }
      }
    });

    el.strategies.addEventListener('focusin', function (e) { var inp = e.target; if (inp.classList && (inp.classList.contains('mem-alloc-in') || inp.classList.contains('mem-frag-in'))) setTimeout(function () { try { inp.select(); } catch (err) {} }, 0); });

    el.submitBtn.addEventListener('click', submit);
    el.retryBtn.addEventListener('click', retry);
    el.revealBtn.addEventListener('click', showSolution);
  }

  bind();
  loadExample();
})();

/**
 * scene-exam-app.js — Mode examen blanc Scènes (Niveau H, axe H2)
 *
 * Tire au sort N scènes filtrées par rôle/difficulté/source, fait jouer
 * l'utilisateur en mode revisite (pas d'écrasement du meilleur score),
 * collecte le résultat de chaque scène depuis localStorage.scene_results,
 * et affiche un score global + détail par scène en fin d'examen.
 *
 * Modèle "session ticker" plutôt que "scène embarquée" : chaque scène
 * s'ouvre dans un onglet via scene.html?scene=<id>&revisit=1&exam=1,
 * l'utilisateur revient sur cette page pour passer à la suivante. Ce
 * choix évite de réimplémenter le moteur de scènes dans la page exam.
 *
 * v1.0 — 2026-05-23 (delta v94, H2)
 */
(function () {
  'use strict';

  const STORAGE_KEY_LAST = 'cas-in-scene-exam-last';

  // v95 (I) — i18n helper
  function t(key, fb) {
    return (window.CASi18n && window.CASi18n.t) ? window.CASi18n.t(key, fb) : fb;
  }

  // ─── Config UI state ───
  const cfg = { role: 'all', diff: 'all', n: 5, src: 'any' };

  let _allScenes = [];   // liste complète chargée depuis index.json
  let _pool = [];        // sous-ensemble filtré actuellement éligible
  let _examState = null; // { sample: [...], current: 0, scores: { sceneId: { pct, skipped } } }

  function lsGet(key, fb) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; }
    catch (_) { return fb; }
  }
  function lsSet(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); return true; }
    catch (_) { return false; }
  }
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }

  // ─── Chargement de l'index des scènes ───
  async function loadIndex() {
    if (_allScenes.length) return _allScenes;
    try {
      const r = await fetch('scenes/index.json');
      const arr = await r.json();
      _allScenes = Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.warn('[scene-exam] index load failed', e);
      _allScenes = [];
    }
    return _allScenes;
  }

  // ─── Filtrage selon cfg ───
  function recomputePool() {
    const results = lsGet('scene_results', {});
    _pool = _allScenes.filter(s => {
      if (cfg.role !== 'all' && s.role !== cfg.role) return false;
      if (cfg.diff !== 'all') {
        const d = (s.difficulty || 'medium').toLowerCase();
        // Mapping difficulté UI → catalogue
        const targetMap = { easy: ['easy', 'stagiaire'], medium: ['medium', 'inspecteur'],
                            hard: ['hard', 'enqueteur'], expert: ['expert'] };
        const targets = targetMap[cfg.diff] || [cfg.diff];
        if (!targets.includes(d)) return false;
      }
      if (cfg.src === 'unseen') {
        if (results[s.id]) return false;
      } else if (cfg.src === 'failed') {
        const r = results[s.id];
        if (!r || (typeof r.pct === 'number' && r.pct >= 70)) return false;
      }
      return true;
    });
    updateSummary();
  }

  function updateSummary() {
    document.getElementById('se-pool-count').textContent = _pool.length;
    document.getElementById('se-sample-count').textContent = Math.min(cfg.n, _pool.length);
    // Estimation : 5 min par scène en moyenne
    const minutes = Math.min(cfg.n, _pool.length) * 5;
    document.getElementById('se-estimated-time').textContent = minutes > 0 ? '~' + minutes + ' min' : '—';
    // Disable start si pool insuffisant
    const startBtn = document.getElementById('se-start-btn');
    if (startBtn) {
      startBtn.disabled = _pool.length === 0;
      startBtn.style.opacity = _pool.length === 0 ? '0.5' : '1';
      startBtn.style.cursor = _pool.length === 0 ? 'not-allowed' : 'pointer';
    }
  }

  // ─── Tirage ───
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startExam() {
    if (_pool.length === 0) return;
    const sample = shuffle(_pool).slice(0, Math.min(cfg.n, _pool.length));
    const baselineResults = lsGet('scene_results', {});
    _examState = {
      startedAt: Date.now(),
      sample: sample.map(s => ({ id: s.id, title: s.title, tags: s.tags || [],
                                   role: s.role, baselinePct: (baselineResults[s.id] || {}).pct || null })),
      current: 0,
      scores: {}
    };
    document.getElementById('se-config').style.display = 'none';
    document.getElementById('se-running').classList.add('on');
    renderCurrentScene();
  }

  function renderCurrentScene() {
    if (!_examState) return;
    const s = _examState.sample[_examState.current];
    if (!s) { finishExam(); return; }
    document.getElementById('se-step-info').textContent =
      t('scene_exam.scene_step_template', 'Scène {current} sur {total}').replace('{current}', _examState.current + 1).replace('{total}', _examState.sample.length) +
      (s.role ? ` · ${s.role}` : '');
    document.getElementById('se-scene-title').textContent = s.title || s.id;
    const tagsEl = document.getElementById('se-scene-tags');
    tagsEl.innerHTML = '';
    (s.tags || []).slice(0, 6).forEach(t => {
      const el = document.createElement('span');
      el.className = 'se-scene-tag';
      el.textContent = t;
      tagsEl.appendChild(el);
    });
    const launchLink = document.getElementById('se-launch-scene');
    launchLink.href = `scene.html?scene=${encodeURIComponent(s.id)}&revisit=1&exam=1`;
  }

  function skipScene() {
    if (!_examState) return;
    const s = _examState.sample[_examState.current];
    if (s) _examState.scores[s.id] = { pct: 0, skipped: true };
    nextScene();
  }

  function nextScene() {
    if (!_examState) return;
    // Avant de passer à la suivante, capter le pct de la scène en cours
    // depuis scene_results — uniquement si le joueur n'a PAS skip et a complété.
    const s = _examState.sample[_examState.current];
    if (s && !(_examState.scores[s.id] && _examState.scores[s.id].skipped)) {
      // En mode revisit, scene_results n'est pas mis à jour. On lit donc
      // un side-channel optionnel cas_last_exam_pct écrit par scene-app.js
      // si présent ; sinon on garde 0 (la scène ne sera pas finie).
      const sideChannel = lsGet('cas_last_exam_pct', null);
      if (sideChannel && sideChannel.sceneId === s.id) {
        _examState.scores[s.id] = { pct: sideChannel.pct, skipped: false };
        localStorage.removeItem('cas_last_exam_pct');
      } else if (!_examState.scores[s.id]) {
        // Pas de score capturé → considérer comme abandonné (mais pas explicitement skip)
        _examState.scores[s.id] = { pct: 0, skipped: false, notCompleted: true };
      }
    }
    _examState.current++;
    if (_examState.current >= _examState.sample.length) {
      finishExam();
    } else {
      renderCurrentScene();
    }
  }

  function finishExam() {
    const total = _examState.sample.length;
    const totalPct = _examState.sample.reduce((sum, s) => sum + ((_examState.scores[s.id] || {}).pct || 0), 0);
    const avgPct = total > 0 ? Math.round(totalPct / total) : 0;

    let verdict;
    if (avgPct >= 80) verdict = t('scene_exam.verdict_excellent', '🏆 Excellent — niveau certif simulé');
    else if (avgPct >= 65) verdict = t('scene_exam.verdict_pass', '✅ Réussi — bonne maîtrise');
    else if (avgPct >= 50) verdict = t('scene_exam.verdict_borderline', '⚠️ Limite — révision recommandée');
    else verdict = t('scene_exam.verdict_fail', '❌ Insuffisant — repassage conseillé');

    document.getElementById('se-running').classList.remove('on');
    document.getElementById('se-results').classList.add('on');
    document.getElementById('se-final-pct').textContent = avgPct + ' %';
    document.getElementById('se-final-verdict').textContent = verdict;

    const tbody = document.getElementById('se-results-tbody');
    tbody.innerHTML = '';
    _examState.sample.forEach((s, i) => {
      const score = _examState.scores[s.id] || { pct: 0 };
      const cls = score.skipped ? 'skip' : (score.pct >= 70 ? 'pass' : 'fail');
      const label = score.skipped ? t('scene_exam.result_skipped', 'PASSÉ') : (score.notCompleted ? t('scene_exam.result_not_completed', '— non finie') : score.pct + ' %');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:'Share Tech Mono',monospace;color:var(--dim,#6a80a8);font-size:11px">${i + 1}</td>
        <td>
          <a href="scene.html?scene=${encodeURIComponent(s.id)}&revisit=1" target="_blank" rel="noopener" style="color:var(--text,#ccd8f0);text-decoration:none">
            ${escapeHtml(s.title || s.id)}
          </a>
        </td>
        <td class="se-pct-cell ${cls}" style="text-align:right">${escapeHtml(label)}</td>
      `;
      tbody.appendChild(tr);
    });

    // Persister cet examen
    lsSet(STORAGE_KEY_LAST, {
      finishedAt: Date.now(),
      cfg: Object.assign({}, cfg),
      avgPct,
      scenes: _examState.sample.map(s => ({ id: s.id, title: s.title,
                                              pct: (_examState.scores[s.id] || {}).pct || 0,
                                              skipped: !!(_examState.scores[s.id] || {}).skipped }))
    });
  }

  function abortExam() {
    if (confirm(t('scene_exam.abort_confirm', 'Abandonner cet examen ? Aucun résultat ne sera enregistré.'))) {
      _examState = null;
      document.getElementById('se-running').classList.remove('on');
      document.getElementById('se-config').style.display = 'block';
    }
  }

  function restartExam() {
    _examState = null;
    document.getElementById('se-results').classList.remove('on');
    document.getElementById('se-config').style.display = 'block';
    recomputePool();
  }

  // ─── Bind UI ───
  function bind() {
    document.querySelectorAll('.se-chip[data-role]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.se-chip[data-role]').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        cfg.role = btn.dataset.role;
        recomputePool();
      });
    });
    document.querySelectorAll('.se-chip[data-diff]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.se-chip[data-diff]').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        cfg.diff = btn.dataset.diff;
        recomputePool();
      });
    });
    document.querySelectorAll('.se-chip[data-n]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.se-chip[data-n]').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        cfg.n = parseInt(btn.dataset.n, 10);
        recomputePool();
      });
    });
    document.querySelectorAll('.se-chip[data-src]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.se-chip[data-src]').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        cfg.src = btn.dataset.src;
        recomputePool();
      });
    });

    document.getElementById('se-start-btn').addEventListener('click', startExam);
    document.getElementById('se-abort-btn').addEventListener('click', abortExam);
    document.getElementById('se-skip-scene').addEventListener('click', skipScene);
    document.getElementById('se-next-scene').addEventListener('click', nextScene);
    document.getElementById('se-restart-btn').addEventListener('click', restartExam);
  }

  // ─── Init ───
  document.addEventListener('DOMContentLoaded', async () => {
    bind();
    await loadIndex();
    recomputePool();
  });
})();

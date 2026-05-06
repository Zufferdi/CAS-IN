/* ═══════════════════════════════════════════════════════════════
   hub-activity-feed.js — v2.82
   
   Affiche le feed d'activité récente sur le hub :
   - Scènes terminées (depuis lsGet('scene_results'))
   - Sessions quiz (depuis lsGet('xp_history') si dispo)
   - Examens blancs passés
   
   Trie par date desc, top 5 affiché, lien vers la page concernée.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const MAX_ITEMS = 5;

  function lsGet(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  }

  function timeAgo(ts) {
    if (!ts) return '—';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'à l\'instant';
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `il y a ${days}j`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `il y a ${weeks} sem.`;
    return new Date(ts).toLocaleDateString('fr-CH');
  }

  function gather() {
    const items = [];

    // 1. Scènes terminées (scene_results : { sceneId: { pct, ts, custodyPct, ... } })
    const sceneResults = lsGet('scene_results', {});
    Object.entries(sceneResults).forEach(([sid, res]) => {
      if (res && res.ts) {
        items.push({
          ts: res.ts,
          icon: '🔍',
          color: 'var(--cyan, #4a9eff)',
          text: `Scène <strong>${sid.replace(/-/g, ' ')}</strong>`,
          sub: `${res.pct}% · ${res.score || 0} XP`,
          href: `scene.html?scene=${sid}`,
        });
      }
    });

    // 2. Examens blancs (exam_history : array de { ts, score, total, pct })
    const examHistory = lsGet('exam_history', []);
    if (Array.isArray(examHistory)) {
      examHistory.forEach(e => {
        if (e && e.ts) {
          items.push({
            ts: e.ts,
            icon: '📝',
            color: '#ffd070',
            text: `Examen blanc <strong>${e.pct || 0}%</strong>`,
            sub: `${e.correct || 0}/${e.total || 0} questions`,
            href: 'exam.html',
          });
        }
      });
    }

    // 3. Sessions quiz récentes (cherchons une trace dans Profile)
    // Si Profile.snapshot dispo, on peut chercher des entrées
    if (window.Profile && typeof window.Profile.snapshot === 'function') {
      try {
        const snap = window.Profile.snapshot();
        const lastSession = snap.lastQuizSession || snap.recentActivity;
        if (lastSession && lastSession.ts) {
          items.push({
            ts: lastSession.ts,
            icon: '💊',
            color: '#ff6b9d',
            text: `Quiz <strong>${lastSession.questions || 0}q</strong>`,
            sub: `${lastSession.correct || 0}/${lastSession.questions || 0} · +${lastSession.xp || 0} XP`,
            href: 'quiz.html',
          });
        }
      } catch (e) {}
    }

    // Trier par date desc
    items.sort((a, b) => b.ts - a.ts);

    return items.slice(0, MAX_ITEMS);
  }

  function render() {
    const feed = document.getElementById('dfir-activity-feed');
    const section = document.getElementById('dfir-activity-section');
    if (!feed || !section) return;

    const items = gather();
    if (items.length === 0) {
      section.hidden = true;
      return;
    }

    section.hidden = false;
    feed.innerHTML = items.map(it => `
      <a href="${it.href}" class="dfir-activity-item">
        <span class="dfir-activity-icon" style="color:${it.color}">${it.icon}</span>
        <div class="dfir-activity-body">
          <div class="dfir-activity-text">${it.text}</div>
          <div class="dfir-activity-meta">${it.sub} · ${timeAgo(it.ts)}</div>
        </div>
        <span class="dfir-activity-arrow">→</span>
      </a>
    `).join('');
  }

  // Mettre à jour les stats inline des cards d'action
  function updateActionStats() {
    const rankEl = document.getElementById('hub-stat-rank');
    const examsEl = document.getElementById('hub-stat-exams');

    if (rankEl && window.Profile && typeof window.Profile.snapshot === 'function') {
      try {
        const snap = window.Profile.snapshot();
        const rankName = snap.rank?.name?.replace(/^[^ ]+ /, '') || '—';
        const xp = snap.xp || 0;
        rankEl.textContent = `${rankName} · ${xp.toLocaleString('fr-CH').replace(/\u00A0/g, ' ')} XP`;
      } catch {}
    }

    if (examsEl) {
      const examHistory = lsGet('exam_history', []);
      const n = Array.isArray(examHistory) ? examHistory.length : 0;
      examsEl.textContent = n > 0 ? `${n} passé${n > 1 ? 's' : ''}` : 'Jamais passé';
    }
  }

  function init() {
    // Délai pour laisser cas-in-profile.js et d'autres modules charger
    setTimeout(() => {
      render();
      updateActionStats();
    }, 200);

    // Réécouter Profile.onChange si dispo
    if (window.Profile && typeof window.Profile.onChange === 'function') {
      window.Profile.onChange(() => {
        render();
        updateActionStats();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

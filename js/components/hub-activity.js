/* ═══════════════════════════════════════════════════════════════
   hub-activity.js — v2.82
   
   Feed d'activité récente sur le hub : dernières scènes jouées,
   sessions de quiz, etc. Lit localStorage (scene_results, etc.)
   et affiche les 3-5 derniers événements avec lien direct pour
   relancer ou continuer.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  function lsGet(key, fb) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fb : JSON.parse(v);
    } catch { return fb; }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function timeAgo(ts) {
    if (!ts) return '';
    const now = Date.now();
    const diff = now - ts;
    if (diff < 60_000) return 'à l\'instant';
    if (diff < 3600_000) return `il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400_000) return `il y a ${Math.floor(diff / 3600000)}h`;
    if (diff < 7 * 86400_000) return `il y a ${Math.floor(diff / 86400000)}j`;
    return new Date(ts).toLocaleDateString('fr-CH', { day: '2-digit', month: 'short' });
  }

  function getRecentScenes() {
    const results = lsGet('scene_results', {});
    const items = [];
    for (const sceneId in results) {
      const r = results[sceneId];
      if (!r) continue;
      items.push({
        type: 'scene',
        id: sceneId,
        ts: r.ts || r.timestamp || 0,
        pct: r.pct || 0,
        custodyPct: r.custodyPct || 0,
        title: r.title || sceneId,
      });
    }
    return items.sort((a, b) => b.ts - a.ts).slice(0, 5);
  }

  function getRecentQuizSessions() {
    const sessions = lsGet('quiz_recent_sessions', []);
    if (!Array.isArray(sessions)) return [];
    return sessions.slice(0, 3).map(s => ({
      type: 'quiz',
      ts: s.ts || 0,
      total: s.total || 0,
      correct: s.correct || 0,
      mode: s.mode || 'normal',
    }));
  }

  function getColorForPct(pct) {
    if (pct >= 90) return '#ffd070';
    if (pct >= 75) return '#6fd29c';
    if (pct >= 50) return '#4a9eff';
    return '#ff7080';
  }

  function renderItem(item) {
    if (item.type === 'scene') {
      const color = getColorForPct(item.pct);
      const title = item.title || item.id;
      const niceTitle = escapeHtml(String(title).replace(/[-_]/g, ' '));
      return `
        <a class="hub-activity-item" href="scene.html?scene=${encodeURIComponent(item.id)}">
          <span class="hub-activity-icon">🔍</span>
          <div class="hub-activity-body">
            <div class="hub-activity-line1">
              <span class="hub-activity-title-text">${niceTitle}</span>
              <span class="hub-activity-time">${timeAgo(item.ts)}</span>
            </div>
            <div class="hub-activity-line2">
              <span class="hub-activity-score" style="color:${color}">
                ${item.pct}% · chaîne ${item.custodyPct}%
              </span>
            </div>
          </div>
          <span class="hub-activity-cta">↻ Rejouer</span>
        </a>
      `;
    }
    if (item.type === 'quiz') {
      const pct = item.total > 0 ? Math.round(100 * item.correct / item.total) : 0;
      const color = getColorForPct(pct);
      return `
        <a class="hub-activity-item" href="quiz.html">
          <span class="hub-activity-icon">💊</span>
          <div class="hub-activity-body">
            <div class="hub-activity-line1">
              <span class="hub-activity-title-text">Session quiz · ${item.mode}</span>
              <span class="hub-activity-time">${timeAgo(item.ts)}</span>
            </div>
            <div class="hub-activity-line2">
              <span class="hub-activity-score" style="color:${color}">
                ${item.correct}/${item.total} · ${pct}%
              </span>
            </div>
          </div>
          <span class="hub-activity-cta">→ Continuer</span>
        </a>
      `;
    }
    return '';
  }

  function render() {
    const section = document.getElementById('hub-activity');
    const list = document.getElementById('hub-activity-list');
    const countEl = document.getElementById('hub-activity-count');
    if (!section || !list) return;

    const all = [...getRecentScenes(), ...getRecentQuizSessions()]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 5);

    if (!all.length) {
      section.hidden = true;
      return;
    }

    section.hidden = false;
    list.innerHTML = all.map(renderItem).join('');
    if (countEl) countEl.textContent = `${all.length} activité${all.length > 1 ? 's' : ''}`;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(render, 100));
  } else {
    setTimeout(render, 100);
  }
})();

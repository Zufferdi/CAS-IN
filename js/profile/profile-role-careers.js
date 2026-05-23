/**
 * profile-role-careers.js — Widget UI Carrière par métier (Axe 4 UX)
 *
 * Dépend de window.RoleCareers (cas-in-role-careers.js).
 *
 * Rend une grille de 6 cartes (une par rôle) avec :
 *   - Icône + label rôle
 *   - Rang atteint (emoji + nom)
 *   - Compteur scènes complétées / total catalogue
 *   - Barre de progression % du catalogue
 *   - Compteur scènes excellentes (≥95%)
 *   - Cible du prochain rang
 *
 * Auto-injecte le CSS et auto-rendu sur DOMContentLoaded si l'élément
 * #role-careers-mount existe.
 *
 * v1.0 — 2026-05-23
 */
(function () {
  'use strict';

  const STYLE_ID = 'role-careers-styles';
  const CSS = `
    .rc-section {
      margin: 28px 0 18px;
    }
    .rc-section h2 {
      font-family: 'Syne', 'Space Grotesk', system-ui, sans-serif;
      font-size: 18px; font-weight: 700;
      margin: 0 0 4px;
      color: var(--text, #ccd8f0);
    }
    .rc-section-sub {
      font-size: 12px; color: var(--dim, #6a80a8);
      margin: 0 0 14px;
      font-family: 'Share Tech Mono', 'JetBrains Mono', monospace;
      letter-spacing: 0.6px;
    }
    .rc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }
    .rc-card {
      background: var(--surface, #0d1526);
      border: 1px solid var(--border, #1e3058);
      border-left: 3px solid var(--rc-color, var(--cyan, #00e5cc));
      border-radius: 10px;
      padding: 14px 14px 12px;
      display: flex; flex-direction: column; gap: 8px;
      position: relative;
      transition: transform .15s ease, border-color .15s ease;
    }
    .rc-card:hover {
      transform: translateY(-1px);
      border-left-width: 4px;
    }
    .rc-card-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px;
    }
    .rc-card-role {
      display: flex; align-items: center; gap: 8px;
      font-weight: 700; font-size: 14px;
      color: var(--rc-color, var(--cyan, #00e5cc));
    }
    .rc-card-icon {
      font-size: 18px; line-height: 1;
      font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', system-ui, sans-serif;
    }
    .rc-card-rank {
      display: flex; align-items: center; gap: 4px;
      font-size: 11px; font-weight: 600;
      color: var(--text, #ccd8f0);
      background: var(--surface2, #111d35);
      border: 1px solid var(--border, #1e3058);
      border-radius: 10px;
      padding: 2px 8px 2px 6px;
    }
    .rc-card-rank-emoji {
      font-size: 12px;
      font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', system-ui, sans-serif;
    }
    .rc-card-stats {
      display: flex; align-items: baseline; gap: 6px;
      font-family: 'JetBrains Mono', 'Share Tech Mono', monospace;
    }
    .rc-card-completed {
      font-size: 22px; font-weight: 700;
      color: var(--rc-color, var(--cyan, #00e5cc));
      line-height: 1;
    }
    .rc-card-total {
      font-size: 13px; color: var(--dim, #6a80a8);
    }
    .rc-card-bar {
      height: 5px; background: var(--surface2, #111d35);
      border-radius: 3px; overflow: hidden; position: relative;
    }
    .rc-card-bar-fill {
      height: 100%; background: var(--rc-color, var(--cyan, #00e5cc));
      border-radius: 3px;
      transition: width .6s ease;
    }
    .rc-card-meta {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 10px; color: var(--dim, #6a80a8);
      font-family: 'Share Tech Mono', 'JetBrains Mono', monospace;
      letter-spacing: 0.5px;
    }
    .rc-card-excellent {
      color: var(--gold, #f0c040);
    }
    .rc-card-next {
      font-size: 10.5px; color: var(--dim, #6a80a8);
      font-family: 'Share Tech Mono', 'JetBrains Mono', monospace;
      letter-spacing: 0.5px;
      padding-top: 4px;
      border-top: 1px solid rgba(255,255,255,0.04);
    }
    .rc-card-next strong {
      color: var(--text, #ccd8f0);
    }
    .rc-card-mute { opacity: .55; }
    .rc-card-mute .rc-card-bar-fill { opacity: .7; }

    /* Summary header */
    .rc-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 14px;
      padding: 10px 12px;
      background: linear-gradient(135deg, rgba(0,229,204,.04), rgba(201,125,245,.04));
      border: 1px solid var(--border, #1e3058);
      border-radius: 10px;
    }
    .rc-summary-cell {
      display: flex; flex-direction: column; gap: 2px;
      text-align: center;
    }
    .rc-summary-num {
      font-family: 'JetBrains Mono', 'Share Tech Mono', monospace;
      font-size: 20px; font-weight: 700;
      color: var(--text, #ccd8f0);
    }
    .rc-summary-lbl {
      font-size: 9.5px;
      font-family: 'Share Tech Mono', 'JetBrains Mono', monospace;
      letter-spacing: 0.7px;
      text-transform: uppercase;
      color: var(--dim, #6a80a8);
    }
  `;

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }

  function renderCard(roleSnap) {
    const muted = roleSnap.completed === 0;
    const pct = roleSnap.pctCatalog;
    const nextLine = roleSnap.nextRank
      ? `Prochain rang : <strong>${roleSnap.nextRank.emoji} ${escapeHtml(roleSnap.nextRank.name)}</strong> — ${roleSnap.nextRemaining} scène${roleSnap.nextRemaining > 1 ? 's' : ''}`
      : `Tous les rangs atteints 🏆`;

    return `
      <div class="rc-card ${muted ? 'rc-card-mute' : ''}" style="--rc-color: ${roleSnap.color}" data-role="${roleSnap.key}">
        <div class="rc-card-head">
          <div class="rc-card-role">
            <span class="rc-card-icon">${roleSnap.icon}</span>
            ${escapeHtml(roleSnap.label)}
          </div>
          <div class="rc-card-rank">
            <span class="rc-card-rank-emoji">${roleSnap.rank.emoji}</span>
            ${escapeHtml(roleSnap.rank.name)}
          </div>
        </div>
        <div class="rc-card-stats">
          <span class="rc-card-completed">${roleSnap.completed}</span>
          <span class="rc-card-total">/ ${roleSnap.total} scènes</span>
        </div>
        <div class="rc-card-bar" aria-label="Progression ${pct}%">
          <div class="rc-card-bar-fill" style="width: ${pct}%"></div>
        </div>
        <div class="rc-card-meta">
          <span>${pct}% catalogue</span>
          <span class="rc-card-excellent">★ ${roleSnap.excellent} excellente${roleSnap.excellent > 1 ? 's' : ''}</span>
        </div>
        <div class="rc-card-next">${nextLine}</div>
      </div>
    `;
  }

  function renderSection(snap) {
    if (!snap || !snap.byRole || !snap.byRole.length) return '';
    const summary = `
      <div class="rc-summary">
        <div class="rc-summary-cell">
          <span class="rc-summary-num">${snap.totalCompleted}</span>
          <span class="rc-summary-lbl">Scènes complétées</span>
        </div>
        <div class="rc-summary-cell">
          <span class="rc-summary-num">${snap.totalExcellent}</span>
          <span class="rc-summary-lbl">Excellentes (≥95%)</span>
        </div>
        <div class="rc-summary-cell">
          <span class="rc-summary-num">${snap.totalCatalog}</span>
          <span class="rc-summary-lbl">Catalogue total</span>
        </div>
      </div>
    `;
    const cards = snap.byRole.map(renderCard).join('');
    const dominantLine = snap.dominant
      ? `Métier dominant : <strong>${snap.dominant.icon} ${escapeHtml(snap.dominant.label)}</strong> · rang <strong>${snap.dominant.rank.emoji} ${escapeHtml(snap.dominant.rank.name)}</strong>`
      : `Aucune scène complétée pour l'instant. Lancez votre première enquête depuis le hub des sagas.`;

    return `
      <section class="rc-section">
        <h2>Carrière par métier</h2>
        <p class="rc-section-sub">${dominantLine}</p>
        ${summary}
        <div class="rc-grid">${cards}</div>
      </section>
    `;
  }

  async function render(mountSelector) {
    if (!window.RoleCareers) {
      console.warn('[role-careers-ui] RoleCareers core not loaded');
      return;
    }
    const mount = typeof mountSelector === 'string'
      ? document.querySelector(mountSelector)
      : mountSelector;
    if (!mount) return;
    injectStyle();
    try {
      const snap = await window.RoleCareers.getSnapshot();
      mount.innerHTML = renderSection(snap);
    } catch (e) {
      console.warn('[role-careers-ui] render failed', e);
    }
  }

  // Auto-render si le mount existe
  function autoRender() {
    const mount = document.getElementById('role-careers-mount');
    if (mount) render(mount);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoRender);
  } else {
    autoRender();
  }

  window.RoleCareersUI = { render };
})();

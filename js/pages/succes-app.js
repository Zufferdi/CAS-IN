/**
 * succes-app.js — Page Succès (v121b)
 *
 * Orchestre l'affichage de la page Succès en utilisant l'API
 * window.TrophiesView fournie par cas-in-trophies-view.js.
 *
 * Deux vues :
 *  - Vue principale : sommaire global + prochains déblocages + 7 catégories
 *  - Vue détail : tous les trophées d'une catégorie (débloqués / en cours / verrouillés)
 *
 * v1.0 — 2026-05-27 (v121b)
 */
(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }

  function t(key, fb) {
    return (window.CASi18n && window.CASi18n.t) ? window.CASi18n.t(key, fb) : fb;
  }

  // ─────────────────────────────────────────────────────────────
  // Vue principale : sommaire, prochains déblocages, 7 catégories
  // ─────────────────────────────────────────────────────────────
  function renderHome() {
    const TV = window.TrophiesView;
    if (!TV) {
      console.warn('[succes-app] window.TrophiesView non disponible');
      return;
    }

    const stats = TV.getStats();
    const grouped = TV.byVisualCategory();
    const next = TV.getNextToUnlock(3);

    // ── Sommaire ──
    const elUnlocked = document.getElementById('suc-unlocked');
    const elTotal = document.getElementById('suc-total');
    const elPct = document.getElementById('suc-percent');
    const elXpE = document.getElementById('suc-xp-earned');
    const elXpM = document.getElementById('suc-xp-max');

    if (elUnlocked) elUnlocked.textContent = stats.unlocked;
    if (elTotal) elTotal.textContent = stats.total;
    if (elPct) elPct.textContent = stats.pct;
    if (elXpE) elXpE.textContent = stats.xp_earned.toLocaleString('fr-CH');
    if (elXpM) elXpM.textContent = stats.xp_max.toLocaleString('fr-CH');

    // ── Tiers ──
    const elTiers = document.getElementById('suc-tiers');
    if (elTiers) {
      const tierKeys = ['bronze', 'argent', 'or', 'platine'];
      elTiers.innerHTML = tierKeys.map(tk => {
        const tb = TV.TIER_BADGES[tk] || {};
        const st = stats.by_tier[tk] || { unlocked: 0, total: 0 };
        return `
          <div class="suc-tier-pill">
            <span>${tb.icon || ''}</span>
            <span class="num">${st.unlocked}/${st.total}</span>
            <span>${escapeHtml(tb.label || tk)}</span>
          </div>
        `;
      }).join('');
    }

    // ── Prochains déblocages ──
    const elNextList = document.getElementById('suc-next-list');
    if (elNextList) {
      if (next.length === 0) {
        elNextList.innerHTML = `<div class="suc-empty">${t('succes_page.next_empty', 'Joue une scène ou un quiz pour voir tes objectifs proches.')}</div>`;
      } else {
        elNextList.innerHTML = next.map(tr => {
          const pct = tr.progress ? Math.round((tr.progress.current / tr.progress.target) * 100) : 0;
          return `
            <div class="suc-next-item">
              <div class="suc-next-icon">${escapeHtml(tr.emoji)}</div>
              <div class="suc-next-info">
                <div class="suc-next-name">${escapeHtml(tr.name)}</div>
                <div class="suc-next-desc">${escapeHtml(tr.desc)}</div>
                <div class="suc-next-progress">
                  <div class="suc-next-progress-fill" style="width:${pct}%"></div>
                </div>
              </div>
              <div class="suc-next-meta">
                ${tr.progress.current}/${tr.progress.target}<br>
                <span style="color:#fbbf24;font-weight:700">+${tr.xp} XP</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // ── 7 catégories ──
    const elGrid = document.getElementById('suc-cats-grid');
    if (elGrid) {
      const cats = TV.VISUAL_CATEGORIES;
      elGrid.innerHTML = cats.map(vc => {
        const g = grouped[vc.id];
        if (!g) return '';
        const pct = g.stats.total > 0 ? Math.round((g.stats.unlocked / g.stats.total) * 100) : 0;
        const visibleCount = vc.hideLocked && g.stats.unlocked === 0
          ? `${g.stats.unlocked} / ${g.stats.total} <em style="font-size:.7rem;opacity:.7;font-style:italic">(cachés)</em>`
          : `${g.stats.unlocked} / ${g.stats.total}`;

        return `
          <a class="suc-cat-card" href="#cat-${escapeHtml(vc.id)}" data-cat="${escapeHtml(vc.id)}" style="--cat-color:${escapeHtml(vc.color)}">
            <div class="suc-cat-head">
              <div class="suc-cat-icon">${escapeHtml(vc.icon)}</div>
              <div class="suc-cat-name">${escapeHtml(vc.label)}</div>
              <div class="suc-cat-count">${visibleCount}</div>
            </div>
            <p class="suc-cat-desc">${escapeHtml(vc.description)}</p>
            <div class="suc-cat-bar"><div class="suc-cat-bar-fill" style="width:${pct}%"></div></div>
          </a>
        `;
      }).join('');

      // Attacher les handlers
      elGrid.querySelectorAll('.suc-cat-card').forEach(card => {
        card.addEventListener('click', (e) => {
          e.preventDefault();
          showCategory(card.dataset.cat);
        });
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Vue détail : tous les trophées d'une catégorie
  // ─────────────────────────────────────────────────────────────
  function showCategory(catId) {
    const TV = window.TrophiesView;
    if (!TV) return;

    const grouped = TV.byVisualCategory();
    const g = grouped[catId];
    if (!g) return;

    // Switch les vues
    const elHome = document.getElementById('suc-home');
    const elDetail = document.getElementById('suc-detail');
    if (elHome) elHome.style.display = 'none';
    if (elDetail) elDetail.classList.add('active');

    // Séparer débloqués / en cours / verrouillés
    const unlocked = g.trophies.filter(t => t.isUnlocked);
    const inProgress = g.trophies.filter(t => !t.isUnlocked && t.progress && t.progress.current > 0);
    const locked = g.trophies.filter(t => !t.isUnlocked && (!t.progress || t.progress.current === 0));

    const hideLocked = g.hideLocked === true;

    let html = `
      <div style="margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <div style="font-size:36px">${escapeHtml(g.icon)}</div>
          <div style="flex:1;min-width:0">
            <h1 style="font-family:'Syne',sans-serif;font-size:1.5rem;margin:0 0 4px">${escapeHtml(g.label)}</h1>
            <p style="color:var(--dim);font-size:.85rem;margin:0;line-height:1.4">${escapeHtml(g.description)}</p>
          </div>
          <div style="background:rgba(255,255,255,.06);padding:8px 14px;border-radius:10px;font-weight:700;font-size:.95rem">${g.stats.unlocked} / ${g.stats.total}</div>
        </div>
        <div style="height:6px;background:rgba(255,255,255,.06);border-radius:3px;margin-top:14px;overflow:hidden">
          <div style="height:100%;background:${escapeHtml(g.color)};width:${g.stats.total > 0 ? Math.round((g.stats.unlocked / g.stats.total) * 100) : 0}%;transition:width .4s ease"></div>
        </div>
        <div style="margin-top:8px;font-size:.75rem;color:var(--dim);text-align:right">${g.stats.xp_earned.toLocaleString('fr-CH')} XP sur ${g.stats.xp_max.toLocaleString('fr-CH')}</div>
      </div>
    `;

    // ── Section Débloqués ──
    if (unlocked.length > 0) {
      html += `<div class="suc-section-title">✅ ${t('succes_page.section_unlocked', 'Débloqués')} <span class="num">${unlocked.length}</span></div>`;
      html += unlocked.map(tr => renderTrophy(tr, false)).join('');
    }

    // ── Section En cours ──
    if (inProgress.length > 0 && !hideLocked) {
      html += `<div class="suc-section-title">⏳ ${t('succes_page.section_in_progress', 'En cours')} <span class="num">${inProgress.length}</span></div>`;
      html += inProgress.map(tr => renderTrophy(tr, false)).join('');
    }

    // ── Section Verrouillés ──
    if (locked.length > 0) {
      if (hideLocked) {
        // Catégorie Secrets : afficher juste un message
        html += `
          <div class="suc-section-title">🔒 ${t('succes_page.section_locked', 'À débloquer')} <span class="num">${locked.length}</span></div>
          <div class="suc-empty">
            ${t('succes_page.secrets_hidden', 'Cette catégorie contient des trophées cachés qui se révèlent uniquement à leur déblocage. Continue à explorer les scènes pour les découvrir.')}
          </div>
        `;
      } else {
        html += `<div class="suc-section-title">🔒 ${t('succes_page.section_locked', 'À débloquer')} <span class="num">${locked.length}</span></div>`;
        html += locked.map(tr => renderTrophy(tr, false)).join('');
      }
    }

    const elContent = document.getElementById('suc-detail-content');
    if (elContent) elContent.innerHTML = html;

    // Scroll en haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderTrophy(tr, isSecretHidden) {
    const TV = window.TrophiesView;
    const tier = TV.TIER_BADGES[tr.tier] || {};
    const stateCls = tr.isUnlocked
      ? 'unlocked'
      : (isSecretHidden ? 'hidden-secret' : 'locked');

    const pctStr = tr.progress
      ? `<div class="suc-trophy-bar"><div class="suc-trophy-bar-fill" style="width:${Math.round((tr.progress.current / tr.progress.target) * 100)}%"></div></div>
         <div style="font-size:.7rem;color:var(--dim);margin-top:3px">${tr.progress.current}/${tr.progress.target}</div>`
      : '';

    const name = isSecretHidden ? '???' : tr.name;
    const desc = isSecretHidden ? t('succes_page.secret_locked_desc', 'Trophée caché — révélé au déblocage.') : tr.desc;
    const icon = isSecretHidden ? '🔒' : tr.emoji;

    return `
      <div class="suc-trophy ${stateCls}">
        <div class="suc-trophy-icon">${escapeHtml(icon)}</div>
        <div class="suc-trophy-info">
          <div class="suc-trophy-name">${escapeHtml(name)}</div>
          <div class="suc-trophy-desc">${escapeHtml(desc)}</div>
          ${pctStr}
        </div>
        <div class="suc-trophy-meta">
          <div class="suc-trophy-xp">+${tr.xp} XP</div>
          <div class="suc-trophy-tier">${tier.icon || ''} ${escapeHtml(tier.label || '')}</div>
        </div>
      </div>
    `;
  }

  function showHome() {
    const elHome = document.getElementById('suc-home');
    const elDetail = document.getElementById('suc-detail');
    if (elHome) elHome.style.display = '';
    if (elDetail) elDetail.classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ─────────────────────────────────────────────────────────────
  // Init
  // ─────────────────────────────────────────────────────────────
  function init() {
    // Attendre que TrophiesView et Profile soient prêts
    let retries = 0;
    function tryInit() {
      if (window.TrophiesView && window.Profile && window.AchievementsCore) {
        renderHome();

        const btnBack = document.getElementById('suc-detail-back');
        if (btnBack) {
          btnBack.addEventListener('click', showHome);
        }

        // Permettre la navigation arrière clavier (Échap)
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            const elDetail = document.getElementById('suc-detail');
            if (elDetail && elDetail.classList.contains('active')) {
              showHome();
            }
          }
        });
      } else {
        retries++;
        if (retries < 50) {
          setTimeout(tryInit, 50);
        } else {
          console.warn('[succes-app] TrophiesView/Profile non disponibles après 50 tentatives');
          const elGrid = document.getElementById('suc-cats-grid');
          if (elGrid) {
            elGrid.innerHTML = `<div class="suc-empty">⚠ Modules de gamification non chargés. Réessaie en mode connecté.</div>`;
          }
        }
      }
    }
    tryInit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-render au changement de locale
  window.addEventListener('cas-locale-changed', function () {
    const elDetail = document.getElementById('suc-detail');
    if (elDetail && elDetail.classList.contains('active')) {
      // On est dans une vue catégorie : re-render cette catégorie
      // (simpler: re-render home et l'utilisateur re-clique)
      showHome();
    }
    renderHome();
  });
})();

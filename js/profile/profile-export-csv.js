/**
 * profile-export-csv.js — Dashboard formateur : export CSV (Niveau H, axe H3)
 *
 * Génère un CSV de progression que l'utilisateur peut transmettre à
 * son formateur. Données :
 *   • Pseudo (depuis localStorage casIn_agentPseudo)
 *   • XP totale, rang
 *   • Nombre de scènes complétées (≥ 70%), excellence (≥ 95%)
 *   • Détail par scène : id, titre, score, date
 *   • Stats par rôle (police, dfir, procureur...)
 *   • Stats par atmosphère
 *
 * Le CSV est volontairement anonymisable côté formateur :
 * l'utilisateur peut modifier son pseudo avant export, ou utiliser
 * l'export "agrégé" qui ne contient que les compteurs par rôle/atmo.
 *
 * v1.0 — 2026-05-23 (delta v94, H3)
 */
(function () {
  'use strict';

  // v95 (I) — i18n helper (CSV exports peuvent rester FR mais on permet l'override)
  function t(key, fb) {
    return (window.CASi18n && window.CASi18n.t) ? window.CASi18n.t(key, fb) : fb;
  }

  function lsGet(key, fb) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; }
    catch (_) { return fb; }
  }
  function lsGetRaw(key, fb) {
    try { return localStorage.getItem(key) || fb; } catch (_) { return fb; }
  }

  // ─── CSV helpers ───
  function csvEscape(v) {
    if (v == null) return '';
    const s = String(v);
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }
  function csvRow(arr) { return arr.map(csvEscape).join(','); }

  function downloadCSV(filename, content) {
    // BOM UTF-8 pour Excel
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ─── Export détaillé : 1 ligne par scène ───
  async function exportDetailed() {
    const pseudo = lsGetRaw('casIn_agentPseudo', 'Anonyme');
    const xp = lsGet('xp', 0);
    const results = lsGet('scene_results', {});

    // Charger l'index pour récupérer titres + rôle + atmosphère
    let index = [];
    try {
      const r = await fetch('scenes/index.json');
      index = await r.json();
    } catch (_) {}
    const byId = {};
    index.forEach(s => { byId[s.id] = s; });

    const lines = [];
    lines.push(csvRow([t('csv_export.header_export_det', '# Export CAS-IN — Détaillé')]));
    lines.push(csvRow([t('csv_export.header_pseudo', '# Pseudo'), pseudo]));
    lines.push(csvRow([t('csv_export.header_xp_total', '# XP totale'), xp]));
    lines.push(csvRow([t('csv_export.header_exported_at', '# Exporté le'), new Date().toISOString()]));
    lines.push('');
    lines.push(csvRow([
      t('csv_export.col_scene_id', 'Scene ID'),
      t('csv_export.col_title', 'Titre'),
      t('csv_export.col_role', 'Rôle'),
      t('csv_export.col_atmosphere', 'Atmosphère'),
      t('csv_export.col_difficulty', 'Difficulté'),
      t('csv_export.col_score', 'Score (%)'),
      t('csv_export.col_custody', 'Custody (%)'),
      t('csv_export.col_date', 'Date'),
      t('csv_export.col_tags', 'Tags')
    ]));

    Object.entries(results).forEach(([sid, r]) => {
      if (!r || typeof r.pct !== 'number') return;
      const meta = byId[sid] || {};
      lines.push(csvRow([
        sid,
        meta.title || '',
        meta.role || '',
        meta.atmosphere || '',
        r.difficulty || meta.difficulty || '',
        r.pct,
        r.custodyPct || '',
        r.date || '',
        (r.tags || meta.tags || []).join(' | ')
      ]));
    });

    downloadCSV('cas-in-progression-detaillee.csv', lines.join('\n'));
  }

  // ─── Export agrégé : 1 ligne par rôle/atmosphère ───
  async function exportAggregated() {
    const pseudo = lsGetRaw('casIn_agentPseudo', 'Anonyme');
    const xp = lsGet('xp', 0);
    const results = lsGet('scene_results', {});

    let index = [];
    try {
      const r = await fetch('scenes/index.json');
      index = await r.json();
    } catch (_) {}

    const byRole = {};
    const byAtmo = {};
    const byDifficulty = {};

    index.forEach(s => {
      const role = s.role || '—';
      const atmo = s.atmosphere || '—';
      const diff = s.difficulty || 'medium';
      if (!byRole[role]) byRole[role] = { total: 0, completed: 0, excellent: 0 };
      if (!byAtmo[atmo]) byAtmo[atmo] = { total: 0, completed: 0, excellent: 0 };
      if (!byDifficulty[diff]) byDifficulty[diff] = { total: 0, completed: 0, excellent: 0 };
      byRole[role].total++;
      byAtmo[atmo].total++;
      byDifficulty[diff].total++;

      const r = results[s.id];
      if (r && typeof r.pct === 'number' && r.pct >= 70) {
        byRole[role].completed++;
        byAtmo[atmo].completed++;
        byDifficulty[diff].completed++;
        if (r.pct >= 95) {
          byRole[role].excellent++;
          byAtmo[atmo].excellent++;
          byDifficulty[diff].excellent++;
        }
      }
    });

    const lines = [];
    lines.push(csvRow([t('csv_export.header_export_agg', '# Export CAS-IN — Agrégé (anonymisable)')]));
    lines.push(csvRow([t('csv_export.header_pseudo', '# Pseudo'), pseudo]));
    lines.push(csvRow([t('csv_export.header_xp_total', '# XP totale'), xp]));
    lines.push(csvRow([t('csv_export.header_exported_at', '# Exporté le'), new Date().toISOString()]));
    lines.push('');

    lines.push(csvRow([t('csv_export.section_by_role', '=== Par rôle ===')]));
    lines.push(csvRow([t('csv_export.col_role', 'Rôle'), t('csv_export.col_total_catalog', 'Total catalogue'), t('csv_export.col_completed', 'Complétées (≥70%)'), t('csv_export.col_excellent', 'Excellentes (≥95%)'), t('csv_export.col_pct_catalog', '% catalogue')]));
    Object.entries(byRole).forEach(([role, s]) => {
      const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
      lines.push(csvRow([role, s.total, s.completed, s.excellent, pct + '%']));
    });
    lines.push('');

    lines.push(csvRow([t('csv_export.section_by_atmosphere', '=== Par atmosphère ===')]));
    lines.push(csvRow([t('csv_export.col_atmosphere', 'Atmosphère'), t('csv_export.col_total_catalog', 'Total catalogue'), t('csv_export.col_completed', 'Complétées (≥70%)'), t('csv_export.col_excellent', 'Excellentes (≥95%)'), t('csv_export.col_pct_catalog', '% catalogue')]));
    Object.entries(byAtmo).forEach(([atmo, s]) => {
      const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
      lines.push(csvRow([atmo, s.total, s.completed, s.excellent, pct + '%']));
    });
    lines.push('');

    lines.push(csvRow([t('csv_export.section_by_difficulty', '=== Par difficulté ===')]));
    lines.push(csvRow([t('csv_export.col_difficulty', 'Difficulté'), t('csv_export.col_total_catalog', 'Total catalogue'), t('csv_export.col_completed', 'Complétées (≥70%)'), t('csv_export.col_excellent', 'Excellentes (≥95%)'), t('csv_export.col_pct_catalog', '% catalogue')]));
    Object.entries(byDifficulty).forEach(([diff, s]) => {
      const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
      lines.push(csvRow([diff, s.total, s.completed, s.excellent, pct + '%']));
    });

    downloadCSV('cas-in-progression-agregee.csv', lines.join('\n'));
  }

  // ─── API publique ───
  window.ProfileExportCSV = {
    exportDetailed,
    exportAggregated
  };
})();

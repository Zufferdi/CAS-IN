/* ============================================================
   CAS-IN · landing-3d.js
   Bascule Matrix ↔ Plateforme DFIR (sessions ≥ 5),
   drawer profil & réglages, animation d'ingestion des pilules,
   suggestion contextuelle pour primo-visiteur, Esc global.

   Chargé après landing.js qui peuple stats-bar / progress-bar / resume-btn.
   ============================================================ */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────
  // Config
  // ─────────────────────────────────────────────────────────
  const SESSION_THRESHOLD = 5;       // bascule en mode DFIR à partir de la 5e session
  const SESSION_GAP_HOURS = 6;       // au moins 6h entre 2 sessions distinctes
  const STREAK_RISK_DAYS  = 7;       // n'avertir du risque streak qu'à partir de 7j

  const RANKS = [
    [    0, '🔰', 'Stagiaire',           1],
    [  500, '🕵', 'Enquêteur',           2],
    [ 1500, '🔬', 'Analyste',            3],
    [ 3000, '💼', 'Expert',              4],
    [ 6000, '⚖️', 'Légiste',             5],
    [10000, '🏛', 'Inspecteur Principal', 5],
  ];
  const MOD_L = {
    '01': '⚖️ Légal', '02': '📥 Méthodo', '03': '💾 Fichiers', '04': '🪟 Windows',
    '05': '💻 Systèmes', '06': '📡 Réseaux', '07': '🔐 Crypto', '08': '🛠 Outils',
  };
  const MOD_F = {
    '01': ['droit','suisse','preuve','eimp_entraide','tor_darkweb','lscpt','nldp'],
    '02': ['methodologie','premier_intervenant','acquisition','ram_forensique','formats','mac_times','timeline','rapport_forensique','incident_response'],
    '03': ['comparaison_fs','fat16','fat12','exfat','ntfs','ext','hfs','apfs','refs','f2fs'],
    '04': ['windows_forensique','windows','registre_windows','logs_windows','shellbags','volatilite','active_directory','usb_forensique','wsl_forensique'],
    '05': ['macos-linux','mobile','cloud_forensique','disques','encodage','iot_forensique','vm_forensique','vehicules_forensique'],
    '06': ['reseau','wireshark_pcap','email_forensique','messagerie_im','dns_forensique','siem_logs'],
    '07': ['crypto','pki_certificats','cassage_mdp','chiffrement_volumes','anti_forensique','malware_forensique','ransomware_forensique','cryptomonnaies','hash','steganographie'],
    '08': ['outils','autopsy','zimmerman','browser_forensique','osint','sqlite_forensique','kape_velociraptor'],
  };

  // ─────────────────────────────────────────────────────────
  // Helpers localStorage
  // ─────────────────────────────────────────────────────────
  function gl(k, d) {
    try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); }
    catch { return d; }
  }
  function gs(k, d) {
    try { return localStorage.getItem(k) ?? d; } catch { return d; }
  }
  function ss(k, v) {
    try { localStorage.setItem(k, v); } catch {}
  }

  function getRank(xp) {
    let r = RANKS[0];
    for (const tup of RANKS) if (xp >= tup[0]) r = tup;
    return r;
  }
  function getNextRank(xp) {
    return RANKS.find(([x]) => x > xp) || [xp + 1000, '', '', 0];
  }

  // ─────────────────────────────────────────────────────────
  // Comptage des sessions distinctes
  // ─────────────────────────────────────────────────────────
  function bumpSessionCount() {
    const now = Date.now();
    const last = parseInt(gs('casIn_landingLastVisit', '0'), 10) || 0;
    let count = parseInt(gs('casIn_landingViews', '0'), 10) || 0;
    const hoursSince = (now - last) / 3_600_000;
    if (last === 0 || hoursSince >= SESSION_GAP_HOURS) {
      count += 1;
      ss('casIn_landingViews', String(count));
      ss('casIn_landingLastVisit', String(now));
    }
    return count;
  }

  // ─────────────────────────────────────────────────────────
  // Bascule de vue (Matrix ↔ DFIR)
  // Mode utilisateur stocké dans casIn_viewMode : 'auto' | 'matrix' | 'dfir'
  // ─────────────────────────────────────────────────────────
  function getEffectiveView(sessionCount) {
    const userMode = gs('casIn_viewMode', 'auto');
    if (userMode === 'matrix') return 'matrix';
    if (userMode === 'dfir')   return 'dfir';
    return sessionCount >= SESSION_THRESHOLD ? 'dfir' : 'matrix';
  }

  function applyView(view) {
    const matrix = document.getElementById('matrix-view');
    const dfir   = document.getElementById('dfir-view');
    if (!matrix || !dfir) return;
    if (view === 'dfir') {
      matrix.hidden = true;
      dfir.hidden = false;
      document.body.classList.add('dfir-mode');
      populateDfirView();
    } else {
      matrix.hidden = false;
      dfir.hidden = true;
      document.body.classList.remove('dfir-mode');
      maybeShowSuggestion();
    }
    // Refresh des boutons toggle dans le drawer
    const userMode = gs('casIn_viewMode', 'auto');
    document.querySelectorAll('.dr-view-btn').forEach(b => {
      b.classList.toggle('is-active', b.dataset.view === userMode);
    });
  }

  // Exposé pour les boutons "Vue débutant" + drawer
  window.setLandingViewMode = function (mode) {
    if (!['matrix', 'dfir', 'auto'].includes(mode)) return;
    ss('casIn_viewMode', mode);
    const count = parseInt(gs('casIn_landingViews', '0'), 10) || 0;
    applyView(getEffectiveView(count));
  };

  // ─────────────────────────────────────────────────────────
  // Suggestion sous Bleue : montrée si vraiment primo (total = 0)
  // ─────────────────────────────────────────────────────────
  function maybeShowSuggestion() {
    const stats = gl('casIn_stats', { total: 0, xp: 0 });
    const fiches = gl('casIn_readFiches_v4', []);
    const isFirstTimer = (stats.total || 0) === 0 && (fiches.length || 0) === 0;
    const el = document.getElementById('pill-suggest');
    if (!el) return;
    el.hidden = !isFirstTimer;
  }

  // ─────────────────────────────────────────────────────────
  // Plateforme DFIR : alimentation des champs
  // ─────────────────────────────────────────────────────────
  function fmtNumber(n) {
    return (n || 0).toLocaleString('fr-CH').replace(/\u00A0/g, ' ');
  }

  function getResumeContext() {
    // Le quiz stocke S dans 'casIn_stats' avec mode/total et casIn_lastSection pour la section
    const stats = gl('casIn_stats', { total: 0, mode: '', score: 0 });
    const lastVisit = parseInt(gs('casIn_lastQuizVisit', '0'), 10) || 0;
    return { stats, lastVisit };
  }

  function timeAgo(ms) {
    if (!ms) return '';
    const diff = Date.now() - ms;
    const m = Math.round(diff / 60000);
    if (m < 1) return "à l'instant";
    if (m < 60) return `il y a ${m} min`;
    const h = Math.round(diff / 3_600_000);
    if (h < 24) return `il y a ${h} h`;
    const d = Math.round(diff / 86_400_000);
    return `il y a ${d} j`;
  }

  function populateDfirView() {
    const stats   = gl('casIn_stats', { xp: 0, total: 0, correct: 0, streak: 0, maxStreak: 0 });
    const fiches  = gl('casIn_readFiches_v4', []);
    const tpSolved = gl('tp_solved', []);
    const scenes  = gl('casIn_scenes_done', []);
    const exams   = gl('casIn_examHistory', []);
    const totalQ  = parseInt(document.querySelector('[data-count="questions"]')?.textContent || '1439', 10);
    const totalF  = parseInt(document.querySelector('[data-count="fiches"]')?.textContent || '54', 10);
    const totalT  = parseInt(document.querySelector('[data-count="tp_exercises"]')?.textContent || '20', 10);
    const totalS  = parseInt(document.querySelector('[data-count="scenes"]')?.textContent || '18', 10);

    // Header status bar
    const sessionN = parseInt(gs('casIn_landingViews', '1'), 10) || 1;
    const utc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    const eN = document.getElementById('dfir-session-num');
    const eU = document.getElementById('dfir-utc');
    if (eN) eN.textContent = '#' + sessionN;
    if (eU) eU.textContent = utc;
    const lat = document.getElementById('dfir-latency');
    if (lat) lat.textContent = String(8 + Math.floor(Math.random() * 18));

    // Carte agent
    const xp = stats.xp || 0;
    const [, emoji, name, clearance] = getRank(xp);
    const pseudo = (gs('casIn_agentPseudo', '') || '').trim();
    const agentName = pseudo ? pseudo.toUpperCase() : 'AGENT';
    const elName = document.getElementById('dfir-agent-name');
    const elRank = document.getElementById('dfir-agent-rank');
    if (elName) elName.textContent = agentName;
    if (elRank) elRank.textContent = `${emoji} ${name} · clearance lvl ${clearance}`;

    // Série
    const streak = stats.streak || 0;
    const maxStreak = stats.maxStreak || 0;
    const elStreak = document.getElementById('dfir-streak-num');
    if (elStreak) elStreak.textContent = String(streak);

    // Dossier ouvert : visible seulement si une session quiz est en cours
    const resumeCard = document.getElementById('dfir-resume-card');
    if (resumeCard) {
      const inProgress = (stats.total || 0) > 0 && (stats.total || 0) < totalQ;
      if (inProgress) {
        resumeCard.hidden = false;
        const elT = document.getElementById('dfir-resume-title');
        const elM = document.getElementById('dfir-resume-meta');
        const elF = document.getElementById('dfir-resume-fill');
        if (elT) elT.textContent = `Quiz · question ${stats.total + 1} / ${totalQ}`;
        const meta = [];
        const lastVisit = parseInt(gs('casIn_lastQuizVisit', '0'), 10) || 0;
        if (lastVisit) meta.push('↻ ' + timeAgo(lastVisit));
        if (stats.score) meta.push(`Score : ${fmtNumber(stats.score)}`);
        if (streak >= STREAK_RISK_DAYS && lastVisit) {
          const hoursSinceLast = (Date.now() - lastVisit) / 3_600_000;
          const hoursLeft = Math.max(0, 24 - hoursSinceLast);
          if (hoursLeft > 0 && hoursLeft < 12) {
            meta.push(`⚠ série en péril dans ${Math.round(hoursLeft)}h`);
          }
        }
        if (elM) elM.textContent = meta.join(' · ') || '—';
        if (elF) elF.style.width = Math.round((stats.total / totalQ) * 100) + '%';
      } else {
        resumeCard.hidden = true;
      }
    }

    // Stats : XP / précision / prochain rang
    const acc = stats.total ? Math.round((stats.correct / stats.total) * 100) : null;
    const [nextXp, , nextName] = getNextRank(xp);
    const xpToNext = Math.max(0, nextXp - xp);

    const elXpV = document.getElementById('dfir-xp-val');
    const elXpS = document.getElementById('dfir-xp-sub');
    if (elXpV) elXpV.textContent = fmtNumber(xp);
    if (elXpS) elXpS.textContent = `série max ${maxStreak}`;

    const elAccV = document.getElementById('dfir-acc-val');
    const elAccS = document.getElementById('dfir-acc-sub');
    if (elAccV) {
      elAccV.textContent = acc !== null ? acc + '%' : '—';
      elAccV.style.color = acc === null ? '' : (acc >= 75 ? '#00ff41' : acc >= 60 ? '#ffbd2e' : '#ff4040');
    }
    if (elAccS) elAccS.textContent = stats.total ? `sur ${fmtNumber(stats.total)} q` : 'pas encore d\'historique';

    const elNxV = document.getElementById('dfir-next-val');
    const elNxS = document.getElementById('dfir-next-sub');
    if (elNxV) elNxV.innerHTML = xpToNext ? `${fmtNumber(xpToNext)}<span style="font-size:.55rem;opacity:.5"> XP</span>` : 'MAX';
    if (elNxS) elNxS.textContent = nextName ? `→ ${nextName}` : 'rang max';

    // Modules : compteurs + jauges + module actif
    const fichesUniq = new Set(fiches.map(h => String(h).replace('.html', ''))).size;
    setMod('fiches', fichesUniq, totalF);
    setMod('tp', tpSolved.length || 0, totalT);
    setMod('scene', scenes.length || 0, totalS);
    setMod('quiz', stats.total || 0, totalQ);

    // Marquer le module actif (= dernier sur lequel on bossait)
    const lastSection = gs('casIn_lastSection', 'quiz');
    document.querySelectorAll('.dfir-mod').forEach(el => el.classList.remove('is-active'));
    const map = { quiz: 'dfir-mod-quiz', fiches: 'dfir-mod-fiches', tp: 'dfir-mod-tp', scene: 'dfir-mod-scene' };
    const activeId = map[lastSection];
    if (activeId) {
      const el = document.getElementById(activeId);
      if (el) el.classList.add('is-active');
    }
  }

  function setMod(prefix, val, tot) {
    const elR = document.getElementById('dfir-' + prefix + '-r');
    const elF = document.getElementById('dfir-' + prefix + '-fill');
    if (elR) elR.textContent = String(val);
    if (elF) elF.style.width = tot > 0 ? Math.round((val / tot) * 100) + '%' : '0%';
  }

  // ─────────────────────────────────────────────────────────
  // Drawer (extrait de l'ancien IIFE inline)
  // ─────────────────────────────────────────────────────────
  function drLoad() {
    const q = gl('casIn_stats', { xp: 0, total: 0, streak: 0 });
    const f = gl('casIn_readFiches_v4', []);
    const e = gl('casIn_examHistory', []);
    const xp = q.xp || 0;
    const [, re, rn] = getRank(xp);
    const [nx] = getNextRank(xp);
    const prev = RANKS.filter(([x]) => x <= xp).pop()?.[0] || 0;
    const pct = Math.min(100, nx > prev ? Math.round((xp - prev) / (nx - prev) * 100) : 100);

    setText('dr-emoji', re);
    setText('dr-rname', rn);
    setText('dr-xp', fmtNumber(xp) + ' XP');
    const fillEl = document.getElementById('dr-xp-fill');
    if (fillEl) fillEl.style.width = pct + '%';
    setText('dr-xp-next', '→ Prochain rang : ' + fmtNumber(nx) + ' XP');
    setText('dr-sq', fmtNumber(q.total || 0));
    setText('dr-sf', String(f.length));
    setText('dr-se', String(e.length));
    setText('dr-ss', String(q.streak || 0));

    // Modules read par chapitre
    const rs = new Set(f.map(h => String(h).replace('.html', '')));
    const modBars = document.getElementById('dr-modbars');
    if (modBars) {
      modBars.innerHTML = '';
      Object.entries(MOD_F).forEach(([m, arr]) => {
        const r = arr.filter(x => rs.has(x)).length;
        const p = Math.round(r / arr.length * 100);
        const c = p >= 80 ? '#00ff41' : p >= 50 ? '#ffbd2e' : 'rgba(0,255,65,.45)';
        const row = document.createElement('div');
        row.className = 'dr-mb';
        const name = document.createElement('div');
        name.className = 'dr-mb-n';
        name.textContent = MOD_L[m];
        const track = document.createElement('div');
        track.className = 'dr-mb-t';
        const fill = document.createElement('div');
        fill.className = 'dr-mb-f';
        fill.style.width = p + '%';
        fill.style.background = c;
        track.appendChild(fill);
        const pct = document.createElement('div');
        pct.className = 'dr-mb-p';
        pct.style.color = c;
        pct.textContent = p + '%';
        row.appendChild(name);
        row.appendChild(track);
        row.appendChild(pct);
        modBars.appendChild(row);
      });
    }

    // Historique examens
    const exEl = document.getElementById('dr-exams');
    if (exEl) {
      exEl.innerHTML = '';
      if (!e.length) {
        const span = document.createElement('span');
        span.style.cssText = 'font-size:.6rem;color:rgba(0,255,65,.3)';
        const a = document.createElement('a');
        a.href = 'tp.html#exam';
        a.style.color = 'rgba(0,255,65,.7)';
        a.textContent = 'En faire un';
        span.append('Aucun examen encore · ', a);
        exEl.appendChild(span);
      } else {
        e.slice(0, 5).forEach(ex => {
          const d = new Date(ex.date).toLocaleDateString('fr', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
          });
          const c = ex.score >= 75 ? '#00ff41' : ex.score >= 60 ? '#ffbd2e' : '#ff4040';
          const row = document.createElement('div');
          row.className = 'dr-eh';
          const date = document.createElement('div');
          date.className = 'dr-eh-d';
          date.textContent = d;
          const score = document.createElement('div');
          score.className = 'dr-eh-s';
          score.style.color = c;
          score.textContent = ex.score + '%';
          const bar = document.createElement('div');
          bar.className = 'dr-eh-b';
          const fill = document.createElement('div');
          fill.className = 'dr-eh-f';
          fill.style.width = ex.score + '%';
          fill.style.background = c;
          bar.appendChild(fill);
          row.appendChild(date);
          row.appendChild(score);
          row.appendChild(bar);
          exEl.appendChild(row);
        });
      }
    }

    drRadar(e);
    syncViewToggleButtons();
  }

  function setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  function syncViewToggleButtons() {
    const userMode = gs('casIn_viewMode', 'auto');
    document.querySelectorAll('.dr-view-btn').forEach(b => {
      b.classList.toggle('is-active', b.dataset.view === userMode);
    });
  }

  function drRadar(exams) {
    const cv = document.getElementById('dr-radar');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) * .34;
    ctx.clearRect(0, 0, W, H);

    const ms = {};
    exams.forEach(ex => {
      if (!ex.modStats) return;
      Object.entries(ex.modStats).forEach(([m, s]) => {
        if (!ms[m]) ms[m] = { c: 0, t: 0 };
        ms[m].c += s.c;
        ms[m].t += s.t;
      });
    });
    const ks = Object.keys(MOD_L);
    const n = ks.length;
    const entries = ks.map(m => [m, ms[m] ? Math.round(ms[m].c / ms[m].t * 100) : 0]);
    const angles = entries.map((_, i) => -Math.PI / 2 + (i / n) * Math.PI * 2);

    [0.25, 0.5, 0.75, 1].forEach(f => {
      ctx.beginPath();
      angles.forEach((a, i) => {
        const x = cx + Math.cos(a) * r * f, y = cy + Math.sin(a) * r * f;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0,255,65,.08)';
      ctx.lineWidth = .7;
      ctx.stroke();
    });
    angles.forEach(a => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.strokeStyle = 'rgba(0,255,65,.06)';
      ctx.lineWidth = .7;
      ctx.stroke();
    });
    if (!exams.length) {
      ctx.fillStyle = 'rgba(0,255,65,.3)';
      ctx.font = '9px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Faites un examen blanc', cx, cy - 6);
      ctx.fillText('pour voir le radar', cx, cy + 6);
      return;
    }
    ctx.beginPath();
    entries.forEach(([m, p], i) => {
      const f = p / 100;
      const x = cx + Math.cos(angles[i]) * r * f;
      const y = cy + Math.sin(angles[i]) * r * f;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,255,65,.1)';
    ctx.fill();
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    entries.forEach(([m, p], i) => {
      const f = p / 100;
      const x = cx + Math.cos(angles[i]) * r * f;
      const y = cy + Math.sin(angles[i]) * r * f;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = p >= 75 ? '#00ff41' : p >= 50 ? '#ffbd2e' : '#ff4040';
      ctx.fill();
      const lx = cx + Math.cos(angles[i]) * (r + 14);
      const ly = cy + Math.sin(angles[i]) * (r + 14);
      ctx.fillStyle = 'rgba(0,255,65,.5)';
      ctx.font = '8px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((MOD_L[m] || m).slice(2).trim().slice(0, 9), lx, ly);
    });
  }

  window.toggleDrawer = function () {
    const open = document.getElementById('drawer-panel').classList.toggle('open');
    document.getElementById('drawer-overlay').classList.toggle('open', open);
    const gear = document.getElementById('gear-btn');
    if (gear) gear.classList.toggle('open', open);
    if (open) drLoad();
  };

  window.closeDrawer = function () {
    ['drawer-panel', 'drawer-overlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('open');
    });
    const gear = document.getElementById('gear-btn');
    if (gear) gear.classList.remove('open');
  };

  window.drReset = function () {
    if (!confirm('Réinitialiser TOUTE la progression ?')) return;
    [
      'casIn_stats', 'casIn_readFiches_v4', 'casIn_examHistory',
      'casIn_scenes_done', 'tp_solved', 'tp_streak',
      'casIn_landingViews', 'casIn_landingLastVisit', 'casIn_viewMode',
    ].forEach(k => localStorage.removeItem(k));
    drLoad();
    location.reload();
  };

  // ─────────────────────────────────────────────────────────
  // Esc global : ferme drawer en priorité
  // ─────────────────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const drawer = document.getElementById('drawer-panel');
      if (drawer && drawer.classList.contains('open')) {
        e.preventDefault();
        window.closeDrawer();
      }
    }
  });

  // ─────────────────────────────────────────────────────────
  // Animation d'ingestion : la pilule grossit avant la nav
  // (override de la fonction navigate existante de landing.js si présente)
  // ─────────────────────────────────────────────────────────
  const _origNavigate = window.navigate;
  window.navigate = function (event, url) {
    // Si modificateur (Cmd/Ctrl/Shift) : nav normale, pas d'animation
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1)) return;
    // Anim seulement sur les pilules en mode Matrix (pas dans le DFIR module list)
    const pill = event && event.currentTarget && event.currentTarget.classList.contains('pill') ? event.currentTarget : null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!pill || reduced) {
      if (typeof _origNavigate === 'function') return _origNavigate(event, url);
      return; // laisse le href natif gérer
    }
    event.preventDefault();
    pill.classList.add('is-ingesting');
    setTimeout(() => { window.location.href = url; }, 380);
  };

  // ─────────────────────────────────────────────────────────
  // Boot
  // ─────────────────────────────────────────────────────────
  function boot() {
    const count = bumpSessionCount();
    applyView(getEffectiveView(count));
    // Pour le mode Matrix : afficher la suggestion "DÉBUT ICI" si primo
    maybeShowSuggestion();

    // Suivi : marquer la dernière section visitée comme "home" puisqu'on est ici
    ss('casIn_lastSection', 'home');

    // Bouton "Plus tard" du PWA banner
    const dismiss = document.getElementById('pwa-dismiss');
    if (dismiss) {
      dismiss.addEventListener('click', () => {
        const banner = document.getElementById('pwa-banner');
        if (banner) banner.style.display = 'none';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

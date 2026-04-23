// ═══════════════════════════════════════════════════════════════
// landing.js — CAS-IN Investigation Numérique
// Script de la landing page (pluie Matrix, progression, zen, PWA, nav)
// Extrait depuis l'inline en v2.3
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Pluie Matrix ──
  const canvas = document.getElementById('rain');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let rainActive = true;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()[]{}|<>/\\:;?';
  const FS = 14;
  let cols, drops;

  function init() {
    cols = Math.floor(canvas.width / FS);
    drops = Array(cols).fill(0).map(() => Math.random() * -80);
  }
  init();
  window.addEventListener('resize', init);

  function draw() {
    if (!rainActive) {
      ctx.fillStyle = 'rgba(0,0,0,.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.055)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = FS + 'px "Share Tech Mono",monospace';
    drops.forEach((y, i) => {
      const x = i * FS;
      ctx.fillStyle = Math.random() > .96 ? '#eeffee' : '#00ff41';
      ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, y * FS);
      if (y * FS > canvas.height && Math.random() > .975) drops[i] = 0;
      drops[i] += .55 + Math.random() * .45;
    });
  }
  setInterval(draw, 50);

  // ── Typewriter (animation séquentielle des lignes du terminal) ──
  document.querySelectorAll('.line').forEach((l, i) =>
    setTimeout(() => l.classList.add('show'), i * 280 + 400)
  );

  // ── Navigation avec transition fade ──
  function navigate(e, url) {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const map = {
        'fiches/index.html': 'fiches',
        'tp.html': 'tp',
        'scene.html': 'scene',
        'quiz.html': 'quiz'
      };
      const key = Object.keys(map).find(k => url.includes(k));
      if (key) localStorage.setItem('casIn_lastSection', map[key]);
    } catch (x) {}
    document.body.classList.add('fade-out');
    setTimeout(() => { window.location.href = url; }, 340);
  }
  window.navigate = navigate;

  // ── Mode Zen (désactive la pluie) ──
  function toggleZen() {
    rainActive = !rainActive;
    const btn = document.getElementById('zen-btn');
    if (!btn) return;
    btn.textContent = rainActive ? '◐ ZEN' : '● ZEN';
    btn.style.color = rainActive ? 'rgba(0,255,65,.35)' : 'rgba(0,255,65,.7)';
    try { localStorage.setItem('casIn_zen', rainActive ? '0' : '1'); } catch (e) {}
  }
  window.toggleZen = toggleZen;

  // Restauration de l'état Zen
  try {
    if (localStorage.getItem('casIn_zen') === '1') {
      rainActive = false;
      const b = document.getElementById('zen-btn');
      if (b) {
        b.textContent = '● ZEN';
        b.style.color = 'rgba(0,255,65,.7)';
      }
    }
  } catch (e) {}

  // ── Progression & stats ──
  try {
    const s = localStorage.getItem('casIn_lastScore');
    const r = localStorage.getItem('casIn_rank');
    const today = new Date().toDateString();
    const dayScore = localStorage.getItem('casIn_dayScore');
    const dayDate = localStorage.getItem('casIn_dayDate');
    const streak = parseInt(localStorage.getItem('casIn_streak') || '0');
    const sesText = document.getElementById('session-text');

    if (sesText) {
      if (dayScore && dayDate === today) {
        sesText.textContent = 'Session du jour : ' + dayScore + ' pts' +
          (r ? ' · ' + r : '') +
          (streak > 1 ? ' · ' + streak + 'j 🔥' : '');
      } else if (s && r) {
        sesText.textContent = 'Dernière session : ' + s + ' pts · ' + r +
          (streak > 1 ? ' · ' + streak + 'j 🔥' : '');
      }
    }

    const seen = parseInt(localStorage.getItem('casIn_questionsSeen') || '0');
    const fichesRead = JSON.parse(localStorage.getItem('cas_read_fiches') || '[]').length;
    const tpSolved = JSON.parse(localStorage.getItem('tp_solved') || '{}');
    const tpTotal = Object.values(tpSolved).reduce((a, b) => a + (b || 0), 0);

    const parts = [];
    if (seen > 0) parts.push(seen + '/1439 questions');
    if (fichesRead > 0) parts.push(fichesRead + '/54 fiches');
    if (tpTotal > 0) parts.push(tpTotal + ' TP résolus');
    if (streak > 1) parts.push(streak + 'j 🔥');

    if (parts.length) {
      const sb = document.getElementById('stats-bar');
      if (sb) {
        sb.textContent = parts.join(' · ');
        sb.style.display = 'block';
      }
    }

    if (seen > 0) {
      const pb = document.getElementById('progress-bar');
      const pl = document.getElementById('progress-label');
      const pf = document.getElementById('progress-fill');
      if (pb) pb.style.display = 'block';
      if (pl) pl.textContent = seen + ' / 1439';
      if (pf) {
        setTimeout(() => {
          pf.style.width = Math.min(100, seen / 1439 * 100) + '%';
        }, 600);
      }
    }

    const lastSection = localStorage.getItem('casIn_lastSection');
    const sectionMap = {
      quiz: 'quiz.html',
      fiches: 'fiches/index.html',
      tp: 'tp.html',
      scene: 'scene.html'
    };
    const sectionLabels = {
      quiz: 'Quiz',
      fiches: 'Fiches',
      tp: 'TP',
      scene: 'Scènes'
    };
    if (lastSection && sectionMap[lastSection]) {
      const rb = document.getElementById('resume-btn');
      const rw = document.getElementById('resume-wrap');
      if (rb) {
        rb.href = sectionMap[lastSection];
        rb.textContent = '↩ Reprendre : ' + sectionLabels[lastSection];
      }
      if (rw) rw.style.display = 'block';
    }
  } catch (e) {
    console.warn('[landing] progression error', e);
  }

  // ── PWA install prompt ──
  let _deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _deferredPrompt = e;
    setTimeout(() => {
      try {
        if (!localStorage.getItem('casIn_pwaInstalled')) {
          const b = document.getElementById('pwa-banner');
          if (b) b.style.display = 'block';
        }
      } catch (x) {}
    }, 3000);
  });

  function installPWA() {
    if (!_deferredPrompt) return;
    _deferredPrompt.prompt();
    _deferredPrompt.userChoice.then(c => {
      if (c.outcome === 'accepted') {
        try { localStorage.setItem('casIn_pwaInstalled', '1'); } catch (x) {}
      }
      const banner = document.getElementById('pwa-banner');
      if (banner) banner.style.display = 'none';
      _deferredPrompt = null;
    });
  }
  window.installPWA = installPWA;

  // ── Raccourcis clavier B / V / O / R ──
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea, [contenteditable]')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const map = {
      b: 'fiches/index.html',
      v: 'tp.html',
      o: 'scene.html',
      r: 'quiz.html'
    };
    const url = map[e.key.toLowerCase()];
    if (url) navigate(e, url);
  });

})();

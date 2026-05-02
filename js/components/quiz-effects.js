// ═══════════════════════════════════════════════════════════════
// quiz-effects.js — Effets sonores et visuels du quiz CAS-IN
//
// Encapsule :
//   • Particules de feedback (correct/incorrect)
//   • Sons (synthétisés via Web Audio API, pas de fichier audio)
//   • Toggle son ON/OFF avec persistance
//   • Thème visuel (default / matrix / vintage / etc.)
//
// API (window.QuizEffects et globales rétrocompat) :
//   spawnParticles(x, y, ok)  → effet de particules à (x, y)
//   playSound(ok)             → ok=true (succès, accord montant), ok=false (raté), ok=null (skip, dim)
//   toggleSound()             → toggle ON/OFF + sync icône #sound-btn + lsSet('soundOn')
//   isSoundOn()               → bool
//   applyVisualTheme(id)      → applique le thème (default = pas d'attribut)
//
// Dépend de :
//   - quiz-utils.js (lsGet, lsSet)
//   - quiz-ranks.js (getComboMultiplier — pour notes plus riches en combo ×2+)
//
// L'état SOUND_ON est lu/écrit dans localStorage('soundOn') et exposé en
// global pour rétrocompat avec quiz-app (qui le lit dans loadPersist).
//
// v1.0 — 2026-05-02 (split de quiz-app v2.20)
// ═══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  const _lsGet = global.lsGet || ((k, d) => d);
  const _lsSet = global.lsSet || (() => {});
  const _getComboMultiplier = () => {
    if (typeof global.getComboMultiplier === 'function') {
      return global.getComboMultiplier();
    }
    // Fallback : lire S.streak directement
    const streak = (global.S && global.S.streak) || 0;
    if (streak >= 12) return 3;
    if (streak >= 6)  return 2;
    if (streak >= 3)  return 1.5;
    return 1;
  };

  // ─── État interne ────────────────────────────────────────
  // SOUND_ON est exposé en globale pour rétrocompat avec quiz-app
  // qui le lit/écrit directement (loadPersist, savePersist).

  let _ac = null;   // AudioContext lazy

  // Initialise SOUND_ON depuis localStorage si pas déjà défini
  if (typeof global.SOUND_ON === 'undefined') {
    global.SOUND_ON = _lsGet('soundOn', true);
  }

  function isSoundOn() {
    return !!global.SOUND_ON;
  }

  // ─── AudioContext lazy ───────────────────────────────────
  // Création différée pour respecter les politiques d'autoplay
  // des navigateurs (Chrome bloque AudioContext avant interaction utilisateur).

  function ac() {
    if (!_ac) {
      try {
        _ac = new (window.AudioContext || window.webkitAudioContext)();
      } catch {}
    }
    return _ac;
  }

  // ─── Sons synthétisés ────────────────────────────────────
  // Pas de fichier audio : on construit les sons via OscillatorNode + GainNode.
  // ok=true (succès)   : accord montant, plus riche si combo ×2+ (4 notes vs 3)
  // ok=false (raté)    : note grave descendante
  // ok=null  (skip)    : dim 350→250 Hz, court

  function playSound(ok) {
    if (!isSoundOn()) return;
    const a = ac();
    if (!a) return;
    const t = a.currentTime;

    if (ok === null) {
      // Skip / dim
      const o = a.createOscillator();
      const g = a.createGain();
      o.connect(g);
      g.connect(a.destination);
      o.frequency.setValueAtTime(350, t);
      o.frequency.linearRampToValueAtTime(250, t + .15);
      g.gain.setValueAtTime(.08, t);
      g.gain.exponentialRampToValueAtTime(.001, t + .2);
      o.start(t);
      o.stop(t + .2);

    } else if (ok) {
      // Succès : accord montant (3 notes en mode normal, 4 si combo ×2+)
      const m = _getComboMultiplier();
      const notes = m >= 2 ? [523, 659, 784, 1047] : [523, 659, 784];
      notes.forEach((f, i) => {
        const o = a.createOscillator();
        const g = a.createGain();
        o.connect(g);
        g.connect(a.destination);
        o.frequency.value = f;
        g.gain.setValueAtTime(.12, t + i * .07);
        g.gain.exponentialRampToValueAtTime(.001, t + i * .07 + .2);
        o.start(t + i * .07);
        o.stop(t + i * .07 + .25);
      });

    } else {
      // Raté : note grave descendante
      const o = a.createOscillator();
      const g = a.createGain();
      o.connect(g);
      g.connect(a.destination);
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(110, t + .3);
      g.gain.setValueAtTime(.18, t);
      g.gain.exponentialRampToValueAtTime(.001, t + .3);
      o.start(t);
      o.stop(t + .3);
    }
  }

  // ─── Toggle son ──────────────────────────────────────────
  // Persiste dans localStorage et met à jour l'icône du bouton.
  // Si window.syncSoundLabel existe (défini par quiz-app.js), il est appelé après
  // pour reconstruire les <span> du label dans le menu Plus (v2.22).

  function toggleSound() {
    global.SOUND_ON = !global.SOUND_ON;
    _lsSet('soundOn', global.SOUND_ON);
    const btn = document.getElementById('sound-btn');
    if (btn) btn.textContent = global.SOUND_ON ? '🔊' : '🔇';
    if (global.SOUND_ON) playSound(true);
    if (typeof global.syncSoundLabel === 'function') {
      try { global.syncSoundLabel(); } catch {}
    }
  }

  // ─── Particules de feedback ──────────────────────────────
  // Effet visuel à (x, y) du clic, avec couleurs ok/raté.
  // 18 particules pour succès, 8 pour échec. Animation CSS via
  // variables --dx/--dy/--rot et keyframes 'particleFly'.

  function spawnParticles(x, y, ok) {
    const wrap = document.getElementById('particles-wrap');
    if (!wrap) return;

    const cols = ok
      ? ['#30e88a', '#00e5cc', '#7affea', '#ffffff']
      : ['#ff4060', '#ff8080', '#ffd0d0'];
    const count = ok ? 18 : 8;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const sz = 4 + Math.random() * 6;
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 80;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 50;
      el.style.cssText =
        'position:absolute;' +
        `width:${sz}px;height:${sz}px;` +
        `border-radius:${Math.random() > .5 ? '50%' : '2px'};` +
        `background:${cols[0 | Math.random() * cols.length]};` +
        `left:${x}px;top:${y}px;pointer-events:none;` +
        `--dx:${dx}px;--dy:${dy}px;--rot:${Math.random() * 720}deg;` +
        `animation:particleFly ${0.5 + Math.random() * .4}s ease-out forwards;`;
      wrap.appendChild(el);
      setTimeout(() => el.remove(), 900);
    }
  }

  // ─── Thème visuel (matrix / vintage / etc.) ──────────────

  function applyVisualTheme(id) {
    document.body.dataset.theme = id === 'default' ? '' : id;
    _lsSet('visualTheme', id);
  }

  // ─── Exposition ──────────────────────────────────────────

  const QuizEffects = {
    spawnParticles,
    playSound,
    toggleSound,
    isSoundOn,
    applyVisualTheme,
    ac,
  };

  global.QuizEffects = QuizEffects;

  // Rétrocompat : globales (quiz-app les utilise sans préfixe)
  if (typeof global.spawnParticles === 'undefined')   global.spawnParticles = spawnParticles;
  if (typeof global.playSound === 'undefined')        global.playSound = playSound;
  if (typeof global.toggleSound === 'undefined')      global.toggleSound = toggleSound;
  if (typeof global.applyVisualTheme === 'undefined') global.applyVisualTheme = applyVisualTheme;
  // ac() est plus interne, exposé sous QuizEffects.ac uniquement
})(typeof window !== 'undefined' ? window : globalThis);

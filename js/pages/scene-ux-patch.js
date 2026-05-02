// ═══════════════════════════════════════════════════════════════
// scene-ux-patch.js — UX Patch v2 (10 améliorations)
//
// Extrait du 3e bloc <script> de scene.html v2.4.
// Wrappé en IIFE (pas de conflit de scope avec scene-app.js).
//
// Inclut :
//   • Injection CSS dynamique (countdown, glossaire inline, tension bar…)
//   • Tension bar visuelle pendant les choix critiques
//   • Glossaire inline activé sur survol des termes
//   • Tooltips avec balises gloss
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ══════════════════════════════════════════════════
  // 0. INJECT DYNAMIC CSS
  // ══════════════════════════════════════════════════
  const style = document.createElement('style');
  style.textContent = `

  /* ── 1. Next button countdown ── */
  .next-step-btn.counting {
    position: relative;
    overflow: hidden;
    cursor: not-allowed;
    opacity: .75;
  }
  .next-step-btn.counting::after {
    content: '';
    position: absolute;
    left: 0; bottom: 0; top: 0;
    background: rgba(0,229,204,.18);
    width: var(--countdown-pct, 0%);
    transition: width .1s linear;
    pointer-events: none;
  }
  .next-countdown-label {
    font-size: 11px;
    color: var(--cyan);
    font-family: var(--font-mono);
    opacity: .8;
    display: inline-block;
    margin-left: 8px;
    letter-spacing: .04em;
  }

  /* ── 2. Haptique visual pulse (fallback if no vibration API) ── */
  @keyframes haptic-ok {
    0%,100% { box-shadow: 0 0 0 0 rgba(48,232,138,0); }
    40%      { box-shadow: 0 0 0 10px rgba(48,232,138,.25); }
  }
  @keyframes haptic-ko {
    0%,100% { box-shadow: 0 0 0 0 rgba(255,64,96,0); }
    40%      { box-shadow: 0 0 0 10px rgba(255,64,96,.25); }
  }
  .haptic-ok  { animation: haptic-ok  .4s ease; }
  .haptic-ko  { animation: haptic-ko  .4s ease; }

  /* ── 3. Real case watermark ── */
  #real-case-watermark {
    position: fixed;
    bottom: 10px; right: 14px;
    font-size: 9px;
    font-family: var(--font-mono, monospace);
    color: rgba(240,192,64,.4);
    letter-spacing: .06em;
    font-weight: 700;
    pointer-events: none;
    z-index: 5;
    display: none;
    text-transform: uppercase;
  }
  #real-case-watermark.visible { display: block; }

  /* ── 4. Tension bar ── */
  #tension-bar-wrap {
    display: none;
    align-items: center;
    gap: 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 12px;
    margin-bottom: 4px;
  }
  #tension-bar-wrap.visible { display: flex; }
  #tension-bar-label { color: var(--dim); flex-shrink: 0; font-size: 11px; letter-spacing: .03em; }
  #tension-bar-track { flex: 1; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
  #tension-bar-fill  { height: 100%; border-radius: 3px; transition: width .5s ease, background .5s ease; }
  #tension-bar-val   { font-family: var(--font-mono); font-weight: 700; min-width: 32px; text-align: right; font-size: 11px; }

  /* ── 5. Session medals ── */
  .session-medals {
    background: linear-gradient(135deg, rgba(240,192,64,.08), transparent);
    border: 1px solid rgba(240,192,64,.3);
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 14px;
  }
  .session-medals-title {
    font-size: 11px; font-weight: 700; color: var(--gold);
    text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px;
    display: flex; align-items: center; gap: 6px;
  }
  .session-medals-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .session-medal {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 20px; font-size: 11px;
    background: var(--surface2); border: 1px solid var(--gold);
    color: var(--gold); font-family: var(--font-mono);
    animation: medalShine 2.5s ease-in-out infinite;
  }
  @keyframes medalShine {
    0%,100% { box-shadow: 0 0 0 0 rgba(240,192,64,.2); }
    50%      { box-shadow: 0 0 10px 2px rgba(240,192,64,.4); }
  }

  /* ── 6. Atmosphere-aware choice hover ── */
  .choice-btn:hover:not(:disabled) {
    border-color: var(--atm-accent, var(--cyan)) !important;
    background: rgba(var(--atm-accent-raw, 0,229,204), .04) !important;
  }
  .choice-btn::after {
    background: linear-gradient(90deg, var(--atm-accent, var(--cyan)), transparent) !important;
  }

  /* ── 7. Law box sticky mini on mobile ── */
  @media (max-width: 640px) {
    .law-box-sticky {
      position: sticky;
      top: 56px;
      z-index: 4;
      margin-bottom: 10px;
      cursor: pointer;
      background: #1a1500;
      border: 1px solid rgba(240,192,64,.4);
    }
    .law-box-sticky.collapsed .law-box-full { display: none; }
    .law-box-sticky .law-box-mini {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      color: var(--gold);
      font-weight: 700;
      letter-spacing: .04em;
    }
    .law-box-sticky.expanded .law-box-mini { display: none; }
    .law-box-sticky.expanded .law-box-full { display: block; }
    .law-box-chevron { margin-left: auto; transition: transform .2s; }
    .law-box-sticky.expanded .law-box-chevron { transform: rotate(180deg); }
  }

  /* ── 8. Typewriter ── */
  .tw-cursor {
    display: inline-block;
    width: 2px; height: 1em;
    background: var(--atm-accent, var(--cyan));
    vertical-align: text-bottom;
    margin-left: 2px;
    animation: twBlink .8s step-end infinite;
  }
  @keyframes twBlink { 0%,50%{opacity:1} 50.01%,100%{opacity:0} }

  /* ── 9. Inline gloss on double-click ── */
  .inline-gloss {
    border-bottom: 1px dotted var(--gold);
    cursor: help;
    color: inherit;
    text-decoration: none;
  }
  .inline-gloss:hover { color: var(--gold); }

  /* ── 10. Read time indicator ── */
  .read-time-badge {
    font-size: 9px; color: var(--dim); font-family: var(--font-mono);
    padding: 1px 6px; border-radius: 4px;
    background: var(--surface2); border: 1px solid var(--border);
    letter-spacing: .04em; margin-left: 6px;
    vertical-align: middle;
  }

  `;
  document.head.appendChild(style);

  // ══════════════════════════════════════════════════
  // 3. REAL CASE WATERMARK — élément DOM
  // ══════════════════════════════════════════════════
  const watermark = document.createElement('div');
  watermark.id = 'real-case-watermark';
  watermark.textContent = '';
  document.body.appendChild(watermark);

  // ══════════════════════════════════════════════════
  // 4. TENSION BAR — injection dans le DOM scène
  // ══════════════════════════════════════════════════
  function injectTensionBar() {
    const procTimer = document.getElementById('procureur-timer');
    if (!procTimer || document.getElementById('tension-bar-wrap')) return;

    const wrap = document.createElement('div');
    wrap.id = 'tension-bar-wrap';
    wrap.innerHTML = `
      <span id="tension-bar-label">⚡ CRITICITÉ</span>
      <div id="tension-bar-track"><div id="tension-bar-fill" style="width:0%;background:var(--green)"></div></div>
      <span id="tension-bar-val" style="color:var(--green)">0%</span>
    `;
    procTimer.parentNode.insertBefore(wrap, procTimer.nextSibling);
  }

  // ══════════════════════════════════════════════════
  // TENSION STATE — suit l'accumulation des erreurs
  // ══════════════════════════════════════════════════
  let tensionPct = 0;

  function updateTensionBar(delta) {
    tensionPct = Math.max(0, Math.min(100, tensionPct + delta));
    const fill   = document.getElementById('tension-bar-fill');
    const val    = document.getElementById('tension-bar-val');
    const wrap   = document.getElementById('tension-bar-wrap');
    if (!fill || !val || !wrap) return;

    wrap.classList.add('visible');
    fill.style.width = tensionPct + '%';
    const color = tensionPct >= 75 ? 'var(--red)'
                : tensionPct >= 40 ? 'var(--gold)'
                :                   'var(--green)';
    fill.style.background = color;
    val.style.color        = color;
    val.textContent        = tensionPct + '%';

    // Shake the vignette on high tension
    if (tensionPct >= 80) {
      const v = document.getElementById('vignette');
      if (v) v.style.boxShadow = `inset 0 0 60px rgba(255,64,96,${(tensionPct - 75) / 100})`;
    }
  }

  function resetTensionBar() {
    tensionPct = 0;
    const fill = document.getElementById('tension-bar-fill');
    const val  = document.getElementById('tension-bar-val');
    const wrap = document.getElementById('tension-bar-wrap');
    if (fill) fill.style.width = '0%';
    if (val)  { val.style.color = 'var(--green)'; val.textContent = '0%'; }
    if (wrap) wrap.classList.remove('visible');
    const v = document.getElementById('vignette');
    if (v) v.style.boxShadow = '';
  }

  // ══════════════════════════════════════════════════
  // SESSION MEDALS — calculées à la fin de partie
  // ══════════════════════════════════════════════════
  const SESSION_MEDALS = [
    {
      id: 'first_strike',
      icon: '⚡',
      label: 'Premier Sang',
      desc: 'Première réponse correcte',
      check: (d) => d.length > 0 && d[0].ok,
    },
    {
      id: 'no_damage',
      icon: '🛡️',
      label: 'Zéro Critique',
      desc: 'Aucune erreur critique',
      check: (d) => d.every(x => !x.critical),
    },
    {
      id: 'clean_run',
      icon: '💎',
      label: 'Run Parfait',
      desc: 'Toutes les réponses correctes',
      check: (d) => d.every(x => x.ok),
    },
    {
      id: 'comeback',
      icon: '🔥',
      label: 'Comeback',
      desc: 'Erreur suivie de 3 bonnes réponses',
      check: (d) => {
        for (let i = 0; i < d.length - 3; i++) {
          if (!d[i].ok && d[i+1].ok && d[i+2].ok && d[i+3] && d[i+3].ok) return true;
        }
        return false;
      },
    },
    {
      id: 'legal_mind',
      icon: '📖',
      label: 'Esprit Juridique',
      desc: '5 décisions + aucune erreur qualif. pénale',
      check: (d) => d.length >= 5 && d.filter(x => !x.ok).length === 0,
    },
    {
      id: 'speed_reader',
      icon: '👁️',
      label: 'Lecture Rapide',
      desc: 'Toutes les décisions en moins de 60s',
      check: (d, meta) => meta && meta.avgTime && meta.avgTime < 60,
    },
  ];

  function computeSessionMedals(decisions, meta) {
    return SESSION_MEDALS.filter(m => {
      try { return m.check(decisions, meta); } catch { return false; }
    });
  }

  function renderSessionMedals(medals) {
    if (!medals || medals.length === 0) return '';
    return `
      <div class="session-medals">
        <div class="session-medals-title">🎖 Médailles de session</div>
        <div class="session-medals-row">
          ${medals.map(m => `
            <span class="session-medal" title="${m.desc}">
              ${m.icon} ${m.label}
            </span>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ══════════════════════════════════════════════════
  // 1. NEXT BUTTON COUNTDOWN (3 secondes)
  // ══════════════════════════════════════════════════
  const READ_DELAY = 3; // secondes

  let _countdownTimer = null;

  function startNextButtonCountdown() {
    const btn = document.getElementById('next-step-btn');
    if (!btn) return;

    // Memorize original text (set before calling this)
    const originalText = btn.textContent.trim();
    btn.classList.add('counting');
    btn.disabled = true;

    let remaining = READ_DELAY;

    function tick() {
      const pct = ((READ_DELAY - remaining) / READ_DELAY) * 100;
      btn.style.setProperty('--countdown-pct', pct + '%');
      btn.innerHTML = `${originalText} <span class="next-countdown-label">(${remaining}s)</span>`;
      remaining--;

      if (remaining < 0) {
        clearInterval(_countdownTimer);
        btn.classList.remove('counting');
        btn.disabled = false;
        btn.textContent = originalText;
        btn.style.removeProperty('--countdown-pct');
      }
    }

    tick();
    _countdownTimer = setInterval(tick, 1000);
  }

  // ══════════════════════════════════════════════════
  // 8. TYPEWRITER — intro du briefing
  // ══════════════════════════════════════════════════
  function typewriterEffect(el, html, speed = 18) {
    if (!el) return;
    const text = el.textContent; // fallback texte brut
    el.textContent = '';
    const cursor = document.createElement('span');
    cursor.className = 'tw-cursor';
    el.appendChild(cursor);

    // Strip HTML for simple typewriter (full HTML is complex, use textContent)
    const plain = html.replace(/<[^>]+>/g, '');
    let i = 0;

    const interval = setInterval(() => {
      if (i < plain.length) {
        const textNode = document.createTextNode(plain[i]);
        el.insertBefore(textNode, cursor);
        i++;
      } else {
        clearInterval(interval);
        cursor.remove();
        // Restore full HTML after typewriter
        el.innerHTML = html;
      }
    }, speed);
  }

  // ══════════════════════════════════════════════════
  // 7. STICKY LAW BOX (mobile)
  // ══════════════════════════════════════════════════
  function makeLawBoxSticky(lawBoxEl) {
    if (!lawBoxEl) return;
    const isMobile = window.innerWidth <= 640;
    if (!isMobile) return;

    // Already processed?
    if (lawBoxEl.classList.contains('law-box-sticky')) return;

    const fullContent = lawBoxEl.innerHTML;
    const shortText   = lawBoxEl.textContent.replace(/\s+/g, ' ').trim().substring(0, 60) + '…';

    lawBoxEl.classList.add('law-box-sticky', 'collapsed');
    lawBoxEl.innerHTML = `
      <div class="law-box-mini">⚖️ <span>${shortText}</span> <span class="law-box-chevron">▾</span></div>
      <div class="law-box-full">⚖️ ${fullContent}</div>
    `;

    lawBoxEl.addEventListener('click', () => {
      lawBoxEl.classList.toggle('collapsed');
      lawBoxEl.classList.toggle('expanded');
    });
  }

  // ══════════════════════════════════════════════════
  // 10. READ TIME BADGE
  // ══════════════════════════════════════════════════
  function estimateReadTime(text) {
    const words = text.replace(/<[^>]+>/g, '').split(/\s+/).length;
    const minutes = Math.ceil(words / 200); // 200 mots/min lecture technique
    return minutes <= 1 ? '~1 min' : `~${minutes} min`;
  }

  // ══════════════════════════════════════════════════
  // STEP TIMING — pour les médailles de session
  // ══════════════════════════════════════════════════
  let stepTimings = [];
  let stepStartTime = null;

  function recordStepStart() {
    stepStartTime = Date.now();
  }

  function recordStepEnd() {
    if (stepStartTime) {
      stepTimings.push((Date.now() - stepStartTime) / 1000);
      stepStartTime = null;
    }
  }

  function getAvgStepTime() {
    if (!stepTimings.length) return null;
    return stepTimings.reduce((a, b) => a + b, 0) / stepTimings.length;
  }

  // ══════════════════════════════════════════════════
  // PATCH selectChoice — add haptic + tension + timing
  // ══════════════════════════════════════════════════
  const _originalSelectChoice = window.selectChoice;
  if (typeof _originalSelectChoice === 'function') {
    window.selectChoice = function(choiceIdx, btn) {
      recordStepEnd();
      _originalSelectChoice(choiceIdx, btn);

      // Retrieve the choice result from G
      const G = window.G;
      if (!G) return;

      const step   = G.scene.steps[G.stepIdx];
      const choice = step.choices[choiceIdx];

      // 2. Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(choice.ok ? [50] : [80, 30, 80]);
      }

      // Visual pulse fallback
      const card = document.getElementById('situation-card');
      if (card) {
        card.classList.remove('haptic-ok', 'haptic-ko');
        void card.offsetWidth; // reflow
        card.classList.add(choice.ok ? 'haptic-ok' : 'haptic-ko');
        setTimeout(() => card.classList.remove('haptic-ok', 'haptic-ko'), 500);
      }

      // 4. Tension bar update
      if (choice.critical) updateTensionBar(30);
      else if (!choice.ok)  updateTensionBar(12);
      else                  updateTensionBar(-5);  // bonne réponse réduit légèrement la tension

      // 1. Start countdown on next button
      const nextBtn = document.getElementById('next-step-btn');
      if (nextBtn && !nextBtn.disabled) {
        // Button was just enabled by original handler; re-disable for countdown
        nextBtn.disabled = true;
        startNextButtonCountdown();
      }
    };
  }

  // ══════════════════════════════════════════════════
  // PATCH launchScene — reset tension + step timings
  // ══════════════════════════════════════════════════
  const _originalLaunchScene = window.launchScene;
  if (typeof _originalLaunchScene === 'function') {
    window.launchScene = function() {
      _originalLaunchScene();
      resetTensionBar();
      stepTimings = [];
      injectTensionBar();
      // Real case watermark
      const G = window.G;
      if (G && G.scene && G.scene.realCase) {
        watermark.textContent = '📜 AFFAIRE RÉELLE · ' + (typeof G.scene.realCase === 'string' ? G.scene.realCase.substring(0, 40) : '');
        watermark.classList.add('visible');
      } else {
        watermark.textContent = '';
        watermark.classList.remove('visible');
      }
    };
  }

  // ══════════════════════════════════════════════════
  // PATCH renderStep — add read time + sticky law + timing start
  // ══════════════════════════════════════════════════
  const _originalRenderStep = window.renderStep;
  if (typeof _originalRenderStep === 'function') {
    window.renderStep = function() {
      _originalRenderStep();
      recordStepStart();

      const G = window.G;
      if (!G || !G.scene) return;

      const step = G.scene.steps[G.stepIdx];

      // 10. Add read time badge to step counter
      const stepCounter = document.querySelector('.step-counter');
      if (stepCounter && step.situation) {
        const readTime = estimateReadTime(step.situation + (step.law || ''));
        const existingBadge = stepCounter.querySelector('.read-time-badge');
        if (!existingBadge) {
          const badge = document.createElement('span');
          badge.className = 'read-time-badge';
          badge.textContent = readTime;
          stepCounter.appendChild(badge);
        }
      }

      // 7. Sticky law box on mobile
      const lawBox = document.querySelector('.law-box:not(.law-box-sticky)');
      if (lawBox && window.innerWidth <= 640) {
        makeLawBoxSticky(lawBox);
      }

      // Reset countdown state
      clearInterval(_countdownTimer);
    };
  }

  // ══════════════════════════════════════════════════
  // PATCH goLobby / abortScene — hide watermark + tension
  // ══════════════════════════════════════════════════
  const _originalGoLobby = window.goLobby;
  if (typeof _originalGoLobby === 'function') {
    window.goLobby = function() {
      watermark.classList.remove('visible');
      resetTensionBar();
      clearInterval(_countdownTimer);
      stepTimings = [];
      _originalGoLobby();
    };
  }

  // ══════════════════════════════════════════════════
  // PATCH showReport — inject session medals
  // ══════════════════════════════════════════════════
  const _originalShowReport = window.showReport;
  if (typeof _originalShowReport === 'function') {
    window.showReport = function() {
      _originalShowReport();

      // Hide watermark
      watermark.classList.remove('visible');
      resetTensionBar();
      clearInterval(_countdownTimer);

      // Compute session medals
      const G = window.G;
      if (!G) return;

      const meta    = { avgTime: getAvgStepTime() };
      const medals  = computeSessionMedals(G.decisions || [], meta);
      stepTimings   = [];

      if (medals.length === 0) return;

      const medalsHTML = renderSessionMedals(medals);

      // Inject before the XP gained block (or any first child of report-card)
      const reportCard = document.querySelector('.report-card');
      if (!reportCard) return;

      const xpBlock = reportCard.querySelector('.xp-gained');
      if (xpBlock) {
        xpBlock.insertAdjacentHTML('beforebegin', medalsHTML);
      } else {
        const header = reportCard.querySelector('.report-header');
        if (header) header.insertAdjacentHTML('afterend', medalsHTML);
      }
    };
  }

  // ══════════════════════════════════════════════════
  // PATCH startScene — typewriter on intro
  // ══════════════════════════════════════════════════
  const _originalStartScene = window.startScene;
  if (typeof _originalStartScene === 'function') {
    window.startScene = function(scene) {
      _originalStartScene(scene);

      // After DOM is set, apply typewriter to the intro text
      requestAnimationFrame(() => {
        const contextText = document.querySelector('.context-text');
        if (contextText && scene.intro) {
          const original = contextText.innerHTML;
          typewriterEffect(contextText, original, 14);
        }
      });
    };
  }

  // ══════════════════════════════════════════════════
  // 6. FIX atmosphere raw RGB vars for choice hover
  // (needed because CSS rgba() can't use CSS vars directly)
  // ══════════════════════════════════════════════════
  const ATM_RAW = {
    ransomware: '255,64,96',
    hospital:   '106,184,255',
    crypto:     '240,192,64',
    network:    '0,229,204',
    legal:      '201,125,245',
    raid:       '255,159,64',
    state:      '240,192,64',
    '':         '0,229,204',
  };

  function applyAtmosphereRaw(atm) {
    const raw = ATM_RAW[atm] || ATM_RAW[''];
    document.documentElement.style.setProperty('--atm-accent-raw', raw);
  }

  // Observe body data-atmosphere changes
  const atmObserver = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.attributeName === 'data-atmosphere') {
        applyAtmosphereRaw(document.body.getAttribute('data-atmosphere') || '');
      }
    }
  });
  atmObserver.observe(document.body, { attributes: true, attributeFilter: ['data-atmosphere'] });
  applyAtmosphereRaw(document.body.getAttribute('data-atmosphere') || '');

  // ══════════════════════════════════════════════════
  // 9. INLINE GLOSSARY — double-click on any text in scene
  // ══════════════════════════════════════════════════
  function initInlineGlossary() {
    document.addEventListener('dblclick', (e) => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const word = sel.toString().trim();
      if (!word || word.length < 3 || word.length > 40) return;

      // Only inside the scene screen
      const sceneEl = document.getElementById('screen-scene');
      if (!sceneEl || !sceneEl.contains(e.target)) return;

      // Check glossary
      const GLOSSARY = window.GLOSSARY;
      if (!GLOSSARY) return;

      let matchKey = null, matchDef = null;
      // Exact first
      if (GLOSSARY[word]) { matchKey = word; matchDef = GLOSSARY[word]; }
      else {
        // Partial
        for (const k of Object.keys(GLOSSARY)) {
          if (word.includes(k) || k.includes(word)) {
            matchKey = k; matchDef = GLOSSARY[k]; break;
          }
        }
      }

      if (!matchKey) return;

      // Remove existing
      document.querySelectorAll('.inline-gloss-tooltip').forEach(t => t.remove());

      const tip = document.createElement('div');
      tip.className = 'gloss-tooltip inline-gloss-tooltip';
      tip.innerHTML = `<span class="gloss-close" onclick="this.parentElement.remove()">✕</span><strong>${matchKey}</strong>${matchDef}`;
      document.body.appendChild(tip);

      const range = sel.getRangeAt(0);
      const rect  = range.getBoundingClientRect();
      let left    = rect.left + window.scrollX;
      let top     = rect.bottom + window.scrollY + 6;
      if (left + 320 > window.innerWidth) left = window.innerWidth - 330;
      if (left < 8) left = 8;
      tip.style.left = left + 'px';
      tip.style.top  = top + 'px';

      setTimeout(() => {
        document.addEventListener('click', () => tip.remove(), { once: true });
      }, 50);
    });
  }

  // ══════════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', () => {
    injectTensionBar();
    initInlineGlossary();
  });

  // Fallback if DOM already loaded
  if (document.readyState !== 'loading') {
    injectTensionBar();
    initInlineGlossary();
  }


})();

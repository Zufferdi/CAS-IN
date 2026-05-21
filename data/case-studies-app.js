// ═══════════════════════════════════════════════════════════════════
// case-studies-app.js — Engine des études de cas guidées (v64)
//
// Render les 7 sections séquentielles d'une étude de cas :
//   1. briefing (timeline, acteurs, enjeux)
//   2. prerequisites_quiz (5 questions, passing 60%)
//   3. suggested_readings (fiches)
//   4. scenes (liens vers scene.html)
//   5. post_analysis (sections post-action)
//   6. exit_quiz (10 questions, passing 70%)
//   7. lessons_learned + related_arcs + sources
//
// Progression stockée dans localStorage 'caseStudiesProgress'
// Structure : { [caseStudyId]: { sectionsCompleted: [], quizScores: {}, currentSection: 0 } }
// ═══════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  const LS_PROGRESS = 'caseStudiesProgress';
  const SECTION_KEYS = [
    'briefing',
    'prerequisites_quiz',
    'suggested_readings',
    'scenes',
    'post_analysis',
    'exit_quiz',
    'lessons_learned'
  ];
  const SECTION_LABELS = {
    briefing: { icon: '📋', name: 'Briefing' },
    prerequisites_quiz: { icon: '🎯', name: 'Prérequis' },
    suggested_readings: { icon: '📖', name: 'Fiches' },
    scenes: { icon: '🎬', name: 'Scènes' },
    post_analysis: { icon: '🔍', name: 'Analyse' },
    exit_quiz: { icon: '✅', name: 'Validation' },
    lessons_learned: { icon: '💡', name: 'Leçons' }
  };

  // ── Utilities ──────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s||'').replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }
  function lsGet(k, fb) {
    try { var r = localStorage.getItem(k); return r === null ? fb : JSON.parse(r); }
    catch (e) { return fb; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { return false; }
  }
  function getQueryParam(name) {
    var url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  // ── Progress management ────────────────────────────────────
  function getProgress(csId) {
    var all = lsGet(LS_PROGRESS, {}) || {};
    return all[csId] || { sectionsCompleted: [], quizScores: {}, currentSection: 0 };
  }
  function setProgress(csId, prog) {
    var all = lsGet(LS_PROGRESS, {}) || {};
    all[csId] = prog;
    lsSet(LS_PROGRESS, all);
  }
  function markSectionDone(csId, sectionKey) {
    var prog = getProgress(csId);
    if (prog.sectionsCompleted.indexOf(sectionKey) === -1) {
      prog.sectionsCompleted.push(sectionKey);
      setProgress(csId, prog);
    }
  }
  function saveQuizScore(csId, quizKey, score, passed) {
    var prog = getProgress(csId);
    prog.quizScores = prog.quizScores || {};
    prog.quizScores[quizKey] = { score: score, passed: passed, ts: Date.now() };
    setProgress(csId, prog);
  }

  // ── Render header (titre + meta) ───────────────────────────
  function renderHeader(cs) {
    var levelClass = 'csd-level-' + (cs.level || 'stagiaire');
    var levelLabel = (cs.level || 'stagiaire').toUpperCase();
    var tags = (cs.tags || []).slice(0, 6).map(function(t){
      return '<span>' + escapeHtml(t) + '</span>';
    }).join('');

    return '<div class="csd-header">'
      + '<div class="csd-header-top">'
      +   '<div class="csd-icon">' + (cs.icon || '📚') + '</div>'
      +   '<div class="csd-title-block">'
      +     '<h1 class="csd-title">' + escapeHtml(cs.title) + '</h1>'
      +     '<div class="csd-subtitle">' + escapeHtml(cs.subtitle || '') + '</div>'
      +   '</div>'
      + '</div>'
      + '<div class="csd-summary">' + escapeHtml(cs.summary || '') + '</div>'
      + '<div class="csd-meta">'
      +   '<span class="csd-level-badge ' + levelClass + '">' + levelLabel + '</span>'
      +   '<span>📅 ' + (cs.year || '?') + '</span>'
      +   '<span>⏱ ' + escapeHtml(cs.duration_estimate || '?') + '</span>'
      +   tags
      + '</div>'
      + '</div>';
  }

  // ── Render stepper (7 sections) ────────────────────────────
  function renderStepper(csId, currentSection) {
    var prog = getProgress(csId);
    return '<div class="csd-stepper">'
      + SECTION_KEYS.map(function(key, idx) {
        var label = SECTION_LABELS[key];
        var isActive = idx === currentSection;
        var isDone = prog.sectionsCompleted.indexOf(key) !== -1;
        var cls = 'csd-step';
        if (isActive) cls += ' active';
        if (isDone) cls += ' done';
        return '<div class="' + cls + '" data-section-idx="' + idx + '">'
          + '<div class="csd-step-icon">' + label.icon + '</div>'
          + '<div class="csd-step-name">' + label.name + '</div>'
          + '</div>';
      }).join('')
      + '</div>';
  }

  // ── Render section 1 : Briefing ────────────────────────────
  function renderBriefing(b) {
    var timeline = (b.timeline || []).map(function(t){
      return '<li class="timeline-item">'
        + '<div class="timeline-date">' + escapeHtml(t.date) + '</div>'
        + '<div class="timeline-title">' + escapeHtml(t.title) + '</div>'
        + '<div class="timeline-desc">' + escapeHtml(t.description) + '</div>'
        + '</li>';
    }).join('');

    var actors = (b.key_actors || []).map(function(a){
      return '<div class="actor-card">'
        + '<div class="actor-role">' + escapeHtml(a.role) + '</div>'
        + '<div class="actor-name">' + escapeHtml(a.name) + '</div>'
        + '<div class="actor-desc">' + escapeHtml(a.description) + '</div>'
        + '</div>';
    }).join('');

    return '<div class="csd-section">'
      + '<h2 class="csd-section-title">📋 ' + escapeHtml(b.title || 'Briefing factuel') + '</h2>'
      + '<div class="csd-section-intro">' + escapeHtml(b.intro || '') + '</div>'
      + '<h3 style="margin-top:18px;font-family:Syne,sans-serif;font-size:15px">📅 Chronologie</h3>'
      + '<ul class="timeline-list">' + timeline + '</ul>'
      + (actors ? '<h3 style="margin-top:22px;font-family:Syne,sans-serif;font-size:15px">👥 Acteurs clés</h3><div class="actors-grid">' + actors + '</div>' : '')
      + (b.stakes ? '<h3 style="margin-top:22px;font-family:Syne,sans-serif;font-size:15px">🎯 Enjeux pédagogiques</h3><div class="stakes-box">' + b.stakes + '</div>' : '')
      + '</div>';
  }

  // ── Render quiz (prereq ou exit) ───────────────────────────
  function renderQuiz(quiz, quizKey, csId) {
    var questions = quiz.questions || [];
    var passingScore = quiz.passing_score || 60;

    var qHtml = questions.map(function(q, qIdx){
      var opts = (q.opts || []).map(function(opt, oIdx){
        return '<div class="quiz-opt" data-q="' + qIdx + '" data-o="' + oIdx + '">'
          + escapeHtml(opt)
          + '</div>';
      }).join('');
      return '<div class="quiz-question" data-q="' + qIdx + '">'
        + '<div class="quiz-q-text">' + (qIdx+1) + '. ' + escapeHtml(q.q) + '</div>'
        + '<div class="quiz-opts">' + opts + '</div>'
        + '<div class="quiz-expl" style="display:none"></div>'
        + '</div>';
    }).join('');

    return '<div class="csd-section">'
      + '<h2 class="csd-section-title">🎯 ' + escapeHtml(quiz.title || 'Quiz') + '</h2>'
      + '<div class="csd-section-intro">' + escapeHtml(quiz.description || '') + '</div>'
      + '<div class="quiz-block" data-quiz-key="' + quizKey + '" data-passing="' + passingScore + '">'
      +   qHtml
      +   '<button class="quiz-validate" disabled>Valider mes réponses</button>'
      +   '<div class="quiz-result" style="display:none"></div>'
      + '</div>'
      + '</div>';
  }

  // ── Render section 3 : Fiches suggérées ────────────────────
  function renderReadings(r) {
    var fiches = (r.fiches || []).map(function(f){
      var cls = 'fiche-card' + (f.essential ? ' essential' : '');
      return '<a href="fiches/' + escapeHtml(f.id) + '.html" target="_blank" rel="noopener" class="' + cls + '">'
        + '<div class="fiche-title">' + (f.essential ? '★ ' : '') + escapeHtml(f.title) + '</div>'
        + '<div class="fiche-focus">' + escapeHtml(f.focus) + '</div>'
        + '</a>';
    }).join('');
    return '<div class="csd-section">'
      + '<h2 class="csd-section-title">📖 ' + escapeHtml(r.title || 'Fiches suggérées') + '</h2>'
      + '<div class="csd-section-intro">' + escapeHtml(r.description || '') + '</div>'
      + '<div class="fiches-list">' + fiches + '</div>'
      + '</div>';
  }

  // ── Render section 4 : Scènes ──────────────────────────────
  function renderScenes(s) {
    var scenes = (s.scenes || []).map(function(sc){
      return '<a href="scene.html?id=' + encodeURIComponent(sc.id) + '" class="scene-card">'
        + '<div class="scene-card-content">'
        +   '<div class="scene-card-title">' + escapeHtml(sc.title) + '</div>'
        +   '<div class="scene-card-focus">' + escapeHtml(sc.focus) + '</div>'
        + '</div>'
        + '<span class="scene-card-diff">' + escapeHtml(sc.difficulty || 'hard') + '</span>'
        + '<span class="scene-arrow">→</span>'
        + '</a>';
    }).join('');
    return '<div class="csd-section">'
      + '<h2 class="csd-section-title">🎬 ' + escapeHtml(s.title || 'Mise en situation') + '</h2>'
      + '<div class="csd-section-intro">' + escapeHtml(s.description || '') + '</div>'
      + '<div class="scenes-list">' + scenes + '</div>'
      + '</div>';
  }

  // ── Render section 5 : Post-analyse ────────────────────────
  function renderPostAnalysis(p) {
    var sections = (p.sections || []).map(function(s){
      return '<div class="analysis-section">'
        + '<h4>' + escapeHtml(s.title) + '</h4>'
        + '<p>' + s.content + '</p>'  // content peut contenir HTML (<strong>, <em>)
        + '</div>';
    }).join('');
    return '<div class="csd-section">'
      + '<h2 class="csd-section-title">🔍 ' + escapeHtml(p.title || 'Analyse post-action') + '</h2>'
      + '<div class="csd-section-intro">' + escapeHtml(p.description || '') + '</div>'
      + sections
      + '</div>';
  }

  // ── Render section 7 : Lessons + arcs + sources ────────────
  function renderLessons(cs) {
    var lessons = cs.lessons_learned || {};
    var lessonsHtml = (lessons.items || []).map(function(l){
      return '<div class="lesson-item">'
        + '<div class="lesson-icon">' + (l.icon || '💡') + '</div>'
        + '<div class="lesson-content">'
        +   '<div class="lesson-title">' + escapeHtml(l.title) + '</div>'
        +   '<div class="lesson-text">' + l.content + '</div>'
        + '</div>'
        + '</div>';
    }).join('');

    var arcsHtml = (cs.related_arcs || []).map(function(a){
      return '<div class="arc-item">'
        + '<span class="arc-title">' + escapeHtml(a.title) + '</span>'
        + '<span class="arc-scene">(via scène ' + escapeHtml(a.scene_ref) + ')</span>'
        + '<div class="arc-desc">' + escapeHtml(a.description) + '</div>'
        + '</div>';
    }).join('');

    var sourcesHtml = (cs.sources || []).map(function(s){
      return '<div class="source-item">'
        + '<a class="source-link" href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">'
        + escapeHtml(s.title)
        + '</a>'
        + '<span class="source-date">— ' + escapeHtml(s.date) + '</span>'
        + '</div>';
    }).join('');

    return '<div class="csd-section">'
      + '<h2 class="csd-section-title">💡 ' + escapeHtml(lessons.title || 'Leçons à retenir') + '</h2>'
      + '<div class="lessons-list">' + lessonsHtml + '</div>'
      + (arcsHtml ? '<h3 style="margin-top:22px;font-family:Syne,sans-serif;font-size:15px">👥 Arcs NPCs traversés</h3><div class="arcs-list">' + arcsHtml + '</div>' : '')
      + (sourcesHtml ? '<h3 style="margin-top:22px;font-family:Syne,sans-serif;font-size:15px">📚 Sources</h3><div class="sources-list">' + sourcesHtml + '</div>' : '')
      + '</div>';
  }

  // ── Render section actuelle ────────────────────────────────
  function renderCurrentSection(cs, sectionIdx) {
    var key = SECTION_KEYS[sectionIdx];
    if (key === 'briefing') return renderBriefing(cs.briefing || {});
    if (key === 'prerequisites_quiz') return renderQuiz(cs.prerequisites_quiz || {}, 'prerequisites_quiz', cs.id);
    if (key === 'suggested_readings') return renderReadings(cs.suggested_readings || {});
    if (key === 'scenes') return renderScenes(cs.scenes || {});
    if (key === 'post_analysis') return renderPostAnalysis(cs.post_analysis || {});
    if (key === 'exit_quiz') return renderQuiz(cs.exit_quiz || {}, 'exit_quiz', cs.id);
    if (key === 'lessons_learned') return renderLessons(cs);
    return '<div class="csd-section">Section introuvable.</div>';
  }

  // ── Render nav (Précédent / Suivant / Marquer comme lu) ────
  function renderNav(csId, sectionIdx) {
    var key = SECTION_KEYS[sectionIdx];
    var prog = getProgress(csId);
    var isDone = prog.sectionsCompleted.indexOf(key) !== -1;
    var isQuiz = (key === 'prerequisites_quiz' || key === 'exit_quiz');

    var prevBtn = sectionIdx > 0
      ? '<button class="csd-nav-prev">← Précédent</button>'
      : '<button disabled>← Précédent</button>';
    var nextBtn = sectionIdx < SECTION_KEYS.length - 1
      ? '<button class="csd-nav-next">Suivant →</button>'
      : '<button disabled>Suivant →</button>';

    var markBtn = '';
    if (!isQuiz) {
      markBtn = isDone
        ? '<button class="csd-mark-done done">✓ Section terminée</button>'
        : '<button class="csd-mark-done primary">Marquer comme lu</button>';
    }

    return '<div class="csd-nav">' + prevBtn + markBtn + nextBtn + '</div>';
  }

  // ── Full render ────────────────────────────────────────────
  function render(cs, sectionIdx) {
    var container = document.getElementById('csd-content');
    container.innerHTML = renderHeader(cs)
      + renderStepper(cs.id, sectionIdx)
      + renderCurrentSection(cs, sectionIdx)
      + renderNav(cs.id, sectionIdx);

    // Bind events
    bindStepperClick(cs, sectionIdx);
    bindNavButtons(cs, sectionIdx);
    bindQuizInteractions(cs, sectionIdx);
    bindMarkDone(cs, sectionIdx);

    // Scroll to top
    window.scrollTo(0, 0);
  }

  function bindStepperClick(cs, currentIdx) {
    document.querySelectorAll('.csd-step').forEach(function(el){
      el.addEventListener('click', function(){
        var idx = parseInt(el.getAttribute('data-section-idx'), 10);
        if (!isNaN(idx) && idx !== currentIdx) {
          render(cs, idx);
        }
      });
    });
  }

  function bindNavButtons(cs, currentIdx) {
    var prev = document.querySelector('.csd-nav-prev');
    var next = document.querySelector('.csd-nav-next');
    if (prev) prev.addEventListener('click', function(){ render(cs, currentIdx - 1); });
    if (next) next.addEventListener('click', function(){ render(cs, currentIdx + 1); });
  }

  function bindMarkDone(cs, currentIdx) {
    var btn = document.querySelector('.csd-mark-done.primary');
    if (!btn) return;
    btn.addEventListener('click', function(){
      var key = SECTION_KEYS[currentIdx];
      markSectionDone(cs.id, key);
      render(cs, currentIdx);
    });
  }

  // ── Quiz interactions ──────────────────────────────────────
  function bindQuizInteractions(cs, currentIdx) {
    var quizBlocks = document.querySelectorAll('.quiz-block');
    quizBlocks.forEach(function(qBlock){
      var quizKey = qBlock.getAttribute('data-quiz-key');
      var passingScore = parseInt(qBlock.getAttribute('data-passing'), 10) || 60;
      var quizData = cs[quizKey] || {};
      var selections = {}; // qIdx → oIdx

      qBlock.querySelectorAll('.quiz-opt').forEach(function(opt){
        opt.addEventListener('click', function(){
          var qIdx = opt.getAttribute('data-q');
          var oIdx = parseInt(opt.getAttribute('data-o'), 10);
          // Désélectionne les autres options de cette question
          qBlock.querySelectorAll('.quiz-opt[data-q="' + qIdx + '"]').forEach(function(o){
            o.classList.remove('selected');
          });
          opt.classList.add('selected');
          selections[qIdx] = oIdx;

          // Activer le bouton de validation si toutes les questions ont une réponse
          var validateBtn = qBlock.querySelector('.quiz-validate');
          var totalQ = (quizData.questions || []).length;
          if (Object.keys(selections).length === totalQ) {
            validateBtn.disabled = false;
          }
        });
      });

      var validateBtn = qBlock.querySelector('.quiz-validate');
      validateBtn.addEventListener('click', function(){
        var questions = quizData.questions || [];
        var correct = 0;
        questions.forEach(function(q, qIdx){
          var userAnswer = selections[qIdx];
          var correctAnswer = q.answer;
          var qBlock2 = qBlock.querySelector('.quiz-question[data-q="' + qIdx + '"]');

          qBlock2.querySelectorAll('.quiz-opt').forEach(function(opt){
            opt.classList.add('disabled');
            opt.classList.remove('selected');
            var oIdx = parseInt(opt.getAttribute('data-o'), 10);
            if (oIdx === correctAnswer) opt.classList.add('correct');
            else if (oIdx === userAnswer && oIdx !== correctAnswer) opt.classList.add('incorrect');
          });

          // Show explanation
          var explDiv = qBlock2.querySelector('.quiz-expl');
          if (explDiv && q.expl) {
            explDiv.innerHTML = '<strong>Explication :</strong> ' + q.expl;
            explDiv.style.display = 'block';
          }

          if (userAnswer === correctAnswer) correct++;
        });

        var pct = Math.round((correct / questions.length) * 100);
        var passed = pct >= passingScore;
        saveQuizScore(cs.id, quizKey, pct, passed);

        var resultDiv = qBlock.querySelector('.quiz-result');
        var resultClass = passed ? 'pass' : 'fail';
        var emoji = passed ? '🎉' : '😬';
        var msg = passed
          ? emoji + ' ' + correct + '/' + questions.length + ' (' + pct + '%) — Réussi ! (seuil: ' + passingScore + '%)'
          : emoji + ' ' + correct + '/' + questions.length + ' (' + pct + '%) — Sous le seuil (' + passingScore + '%). Relis les explications ci-dessus.';
        resultDiv.className = 'quiz-result ' + resultClass;
        resultDiv.innerHTML = msg;
        resultDiv.style.display = 'block';

        validateBtn.disabled = true;
        validateBtn.style.display = 'none';

        // Marquer section comme done si réussi
        if (passed) {
          markSectionDone(cs.id, quizKey);
          // Re-render stepper pour refléter le done
          var stepperEl = document.querySelector('.csd-stepper');
          if (stepperEl) {
            stepperEl.outerHTML = renderStepper(cs.id, currentIdx);
            bindStepperClick(cs, currentIdx);
          }
        }
      });
    });
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    var csId = getQueryParam('id');
    if (!csId) {
      document.getElementById('csd-content').innerHTML =
        '<div class="csd-loading" style="color:#ff8080">Aucune étude de cas spécifiée. <a href="case-studies.html">← Retour à la liste</a></div>';
      return;
    }

    fetch('data/case-studies.json')
      .then(function(r){ return r.json(); })
      .then(function(data){
        var cs = (data.case_studies || []).find(function(c){ return c.id === csId; });
        if (!cs) {
          document.getElementById('csd-content').innerHTML =
            '<div class="csd-loading" style="color:#ff8080">Étude de cas introuvable : ' + escapeHtml(csId) + '. <a href="case-studies.html">← Retour à la liste</a></div>';
          return;
        }
        var prog = getProgress(csId);
        var startSection = Math.min(prog.currentSection || 0, SECTION_KEYS.length - 1);
        render(cs, startSection);
      })
      .catch(function(err){
        document.getElementById('csd-content').innerHTML =
          '<div class="csd-loading" style="color:#ff8080">Erreur de chargement.</div>';
        console.error(err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

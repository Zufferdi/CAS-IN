// ═══════════════════════════════════════════════════════════════
// CAS-IN · landing.js
// Script exclusif de index.html (pluie Matrix, pilules, coach, progression)
// Extrait depuis l'inline en v2.3 :
//   - Duplicats keydown fusionnés (1 seul handler avec animation + lastSection)
//   - Duplicats coach fusionnés (pickCoachMessage seulement, computeTip retiré)
// ═══════════════════════════════════════════════════════════════

(function(){
'use strict';

// ── Pluie Matrix ──
const canvas=document.getElementById('rain'),ctx=canvas.getContext('2d');
const _reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let rainActive = !_reducedMotion;
function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight}
resize();window.addEventListener('resize',resize);
const CHARS='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()[]{}|<>/\\:;?';
const FS=14;let cols,drops;
function init(){cols=Math.floor(canvas.width/FS);drops=Array(cols).fill(0).map(()=>Math.random()*-80)}
init();window.addEventListener('resize',init);
function draw(){
  if(!rainActive){ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(0,0,canvas.width,canvas.height);return;}
  ctx.fillStyle='rgba(0,0,0,0.055)';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.font=FS+'px "Share Tech Mono",monospace';
  drops.forEach((y,i)=>{
    const x=i*FS;
    ctx.fillStyle=Math.random()>.96?'#eeffee':'#00ff41';
    ctx.fillText(CHARS[Math.floor(Math.random()*CHARS.length)],x,y*FS);
    if(y*FS>canvas.height&&Math.random()>.975)drops[i]=0;
    drops[i]+=.55+Math.random()*.45;
  });
}
setInterval(draw,50);

// ── Typewriter (animation séquentielle des lignes du terminal) ──
document.querySelectorAll('.line').forEach((l,i)=>setTimeout(()=>l.classList.add('show'),i*280+400));

// ── Navigation avec transition fade ──
function navigate(e,url){
  if(e && e.preventDefault) e.preventDefault();
  try{
    const map={'fiches/index.html':'fiches','tp.html':'tp','scene.html':'scene','quiz.html':'quiz'};
    const key=Object.keys(map).find(k=>url.includes(k));
    if(key)localStorage.setItem('casIn_lastSection',map[key]);
  }catch(x){}
  document.body.classList.add('fade-out');
  setTimeout(()=>{window.location.href=url;},340);
}
window.navigate = navigate;

// ── Raccourcis clavier B / R / V / O (fusion des 2 handlers anciens) ──
document.addEventListener('keydown',e=>{
  if(e.target.matches('input, textarea, [contenteditable]'))return;
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const k=e.key.toLowerCase();
  if(!['b','v','o','r'].includes(k))return;
  const pill=document.querySelector(`.pill[data-key="${k}"]`);
  if(!pill)return;
  e.preventDefault();
  pill.classList.add('key-flash');
  const url=pill.getAttribute('href');
  if(!url)return;
  // Délai pour voir l'animation, puis navigation avec enregistrement du lastSection
  setTimeout(()=>navigate(null,url),180);
});

// ── Coach message unifié (ex pickCoachMessage + computeTip) ──
// Priorité décroissante — on affiche le message le plus pertinent
function pickCoachMessage(ctx){
  const {seen, fichesRead, tpTotal, scenesDone, streak, xp, nextRank, daily, totalActivity,
         dayScore, dayDate, today, lastScore, lastRank} = ctx;

  // 1. Nouveau user : invitation avec touches clavier
  if(totalActivity===0){
    return '<span style="color:rgba(0,255,65,.9)">Bienvenue.</span> Commence par <kbd class="kbd-hint">B</kbd> pour mémoriser les structures, puis <kbd class="kbd-hint">R</kbd> pour t\'évaluer.';
  }

  // 2. Session déjà jouée aujourd'hui
  if(dayScore && dayDate===today){
    const extras = [];
    if(lastRank) extras.push(lastRank);
    if(streak>1) extras.push(streak+'j 🔥');
    return `Session du jour : <strong>${dayScore} pts</strong>${extras.length?' · '+extras.join(' · '):''}`;
  }

  // 3. Streak à préserver (priorité haute)
  if(streak>=3){
    const today8h = new Date(); today8h.setHours(20,0,0,0);
    const now = new Date();
    const hoursLeft = Math.max(0, Math.round((today8h-now)/3600000));
    if(hoursLeft<=6 && hoursLeft>0){
      return `🔥 <strong>${streak} jours de streak</strong> — plus que ${hoursLeft}h pour ne pas la casser`;
    }
    return `🔥 <strong>Streak de ${streak} jours</strong> — ne romps pas la chaîne aujourd'hui !`;
  }

  // 4. Défi quotidien presque fini
  if(daily){
    const goals=Object.values(daily.goals);
    const doneCount=goals.filter(g=>g.done>=g.target).length;
    const remaining=goals.length-doneCount;
    if(doneCount>0 && remaining>0 && !daily.rewarded){
      if(remaining===1){
        const lastGoal=goals.find(g=>g.done<g.target);
        if(lastGoal){
          return `🎯 Plus qu'<strong>1 objectif</strong> pour le défi du jour : ${lastGoal.label}. <em>+50 XP en jeu !</em>`;
        }
      }
      return `🎯 Défi quotidien : <strong>${doneCount}/${goals.length}</strong> fait — termine-le pour <em>+50 XP</em>.`;
    }
    if(daily.rewarded){
      return `✨ Défi du jour <strong>complété</strong>. Continue sur ta lancée !`;
    }
  }

  // 5. Presque un rang de plus
  if(nextRank && xp>0){
    const delta=nextRank.min-xp;
    if(delta<=30){
      return `🎖️ Plus que <strong>${delta} XP</strong> pour atteindre ${nextRank.name}.`;
    }
  }

  // 6. Questions ratées à reprendre
  try {
    const errs=JSON.parse(localStorage.getItem('errors')||'[]');
    if(errs.length>=5){
      return `⚠️ Tu as <strong>${errs.length} questions ratées</strong> à revoir (mode Erreurs dans le quiz).`;
    }
  } catch(e){}

  // 7. Module délaissé
  if(fichesRead===0 && seen>10){
    return `💡 Astuce : <kbd class="kbd-hint">B</kbd> pour consulter les fiches — elles expliquent les points que le quiz teste.`;
  }
  if(scenesDone===0 && seen>50){
    return `🚨 Tu n'as pas encore tenté les scènes de crime — <kbd class="kbd-hint">O</kbd> pour démarrer.`;
  }
  if(tpTotal===0 && seen>100){
    return `🧪 Prêt pour la pratique ? Les exercices TP sont en <kbd class="kbd-hint">V</kbd>.`;
  }

  // 8. Dernière session récente
  if(lastScore && lastRank) return `Dernière session : <strong>${lastScore} pts</strong> · ${lastRank}`;

  // 9. Fallback générique pour utilisateur actif
  if(totalActivity>0){
    return `Beau parcours. Continue avec la pilule de ton choix.`;
  }
  return null;
}

// ── Mode Zen (désactive la pluie) ──
function toggleZen(){
  rainActive=!rainActive;
  const btn=document.getElementById('zen-btn');
  btn.textContent=rainActive?'◐ ZEN':'● ZEN';
  btn.style.color=rainActive?'rgba(0,255,65,.35)':'rgba(0,255,65,.7)';
  try{localStorage.setItem('casIn_zen',rainActive?'0':'1')}catch(e){}
}
window.toggleZen = toggleZen;

// Fermeture persistante du guide
function dismissGuide(){
  try{localStorage.setItem('casIn_guideDismissed','1')}catch(e){}
  const sg=document.getElementById('starter-guide');
  if(sg)sg.classList.remove('show');
}
window.dismissGuide = dismissGuide;

// Restauration de l'état Zen
try{
  if(localStorage.getItem('casIn_zen')==='1'){
    rainActive=false;const b=document.getElementById('zen-btn');
    b.textContent='● ZEN';b.style.color='rgba(0,255,65,.7)';
  }
}catch(e){}

// ── Progression, stats, dashboard, coach ──
try{
  const lastScore=localStorage.getItem('casIn_lastScore');
  const lastRank=localStorage.getItem('casIn_rank');
  const today=new Date().toDateString();
  const dayScore=localStorage.getItem('casIn_dayScore');
  const dayDate=localStorage.getItem('casIn_dayDate');
  const streak=parseInt(localStorage.getItem('casIn_streak')||'0');

  const seen=parseInt(localStorage.getItem('casIn_questionsSeen')||'0');
  const fichesRead=JSON.parse(localStorage.getItem('cas_read_fiches')||'[]').length;
  const tpSolved=JSON.parse(localStorage.getItem('tp_solved')||'{}');
  const tpTotal=Object.values(tpSolved).reduce((a,b)=>a+(b||0),0);
  let scenesDone=0;
  try {
    const sr=JSON.parse(localStorage.getItem('scene_results')||'{}');
    scenesDone=Object.keys(sr).filter(k=>sr[k]&&(sr[k].completed||sr[k].score!==undefined)).length;
  } catch(e){}

  const totalActivity=seen+fichesRead+tpTotal+scenesDone;

  // Dashboard : alimente les 4 cartes de progression
  const dash=document.getElementById('dashboard');
  if(dash){
    const upd=(id,val,max)=>{
      const stat=document.getElementById('dash-'+id);
      const fill=document.getElementById('dash-'+id+'-fill');
      if(stat){stat.textContent=max?val+'/'+max:String(val);}
      if(fill&&max){
        const pct=Math.min(100,(val/max)*100);
        setTimeout(()=>{fill.style.width=pct+'%';},400+Math.random()*400);
      }
    };
    upd('quiz',seen,1439);
    upd('fiches',fichesRead,54);
    upd('tp',tpTotal,20);
    upd('scenes',scenesDone,18);
  }

  // Guide affiché uniquement aux nouveaux utilisateurs
  const guideDismissed=localStorage.getItem('casIn_guideDismissed')==='1';
  if(totalActivity===0 && !guideDismissed){
    const sg=document.getElementById('starter-guide');
    if(sg){sg.classList.add('show');sg.open=true;}
  }

  // Badge de rang unifié
  try {
    if (window.CasIn) {
      const xp = window.CasIn.getXP();
      const rank = window.CasIn.getRank();
      const nextRank = window.CasIn.getNextRank();
      const rbRank = document.getElementById('rb-rank');
      const rbXp = document.getElementById('rb-xp');
      if (rbRank) rbRank.textContent = rank.name;
      if (rbXp) {
        rbXp.textContent = nextRank ? `${xp} XP · ${nextRank.min - xp} XP → ${nextRank.emoji}` : `${xp} XP · Rang max 👑`;
      }
    }
  } catch(e){}

  // Défi quotidien
  try {
    if (window.CasIn) {
      const d = window.CasIn.getDaily();
      const dcEl = document.getElementById('daily-challenge');
      const goalsEl = document.getElementById('dc-goals');
      if (dcEl && goalsEl) {
        const iconMap = { quiz: '💊', tp: '🧪', scene: '🚨' };
        const urlMap = { quiz: 'quiz.html', tp: 'tp.html', scene: 'scene.html' };
        const html = Object.entries(d.goals).map(([mod, g]) => {
          const done = g.done >= g.target;
          return `<a href="${urlMap[mod]}" class="dc-goal${done?' done':''}" style="text-decoration:none;color:inherit">`+
            `<span class="dc-goal-check">${done?'✓':''}</span>`+
            `<span>${iconMap[mod]||'·'} ${g.label}</span>`+
            `<span class="dc-goal-progress">${g.done}/${g.target}</span>`+
            `</a>`;
        }).join('');
        goalsEl.innerHTML = html;
        if (Object.values(d.goals).every(g => g.done >= g.target)) {
          dcEl.classList.add('completed');
          dcEl.querySelector('.dc-reward').textContent = d.rewarded ? '✓ Terminé — +50 XP !' : 'Complété';
        }
      }
    }
  } catch(e){}

  // Panneau stats : affiché uniquement si l'utilisateur a commencé
  if(totalActivity>0){
    const sp=document.getElementById('stats-panel');
    if(sp){
      sp.classList.add('show');
      const hint=document.getElementById('sp-hint');
      if(hint){
        const bits=[];
        if(seen>0) bits.push(`${seen} Q`);
        if(fichesRead>0) bits.push(`${fichesRead} fiches`);
        if(tpTotal>0) bits.push(`${tpTotal} TP`);
        if(scenesDone>0) bits.push(`${scenesDone} scènes`);
        if(window.CasIn) bits.push(`${window.CasIn.getXP()} XP`);
        hint.textContent = bits.join(' · ');
      }
    }
  }

  // Coach message unifié (écrit uniquement dans #coach-line, pas dans #session-text)
  try {
    const coachLine=document.getElementById('coach-line');
    const coachText=document.getElementById('coach-text');
    if(coachLine && coachText){
      const msg = pickCoachMessage({
        seen, fichesRead, tpTotal, scenesDone, streak, totalActivity,
        dayScore, dayDate, today, lastScore, lastRank,
        xp: window.CasIn ? window.CasIn.getXP() : 0,
        nextRank: window.CasIn ? window.CasIn.getNextRank() : null,
        daily: window.CasIn ? window.CasIn.getDaily() : null
      });
      if(msg){
        coachText.innerHTML = msg;
        coachLine.style.display = '';
      }
    }
  } catch(e){}

  // Barre de stats compacte
  const parts=[];
  if(seen>0)parts.push(seen+'/1439 questions');
  if(fichesRead>0)parts.push(fichesRead+'/54 fiches');
  if(tpTotal>0)parts.push(tpTotal+' TP résolus');
  if(streak>1)parts.push(streak+'j 🔥');
  if(parts.length){
    const sb=document.getElementById('stats-bar');
    sb.textContent=parts.join(' · ');
    sb.style.display='block';
  }

  // Barre de progression quiz
  if(seen>0){
    document.getElementById('progress-bar').style.display='block';
    document.getElementById('progress-label').textContent=seen+' / 1439';
    setTimeout(()=>{document.getElementById('progress-fill').style.width=Math.min(100,seen/1439*100)+'%';},600);
  }

  // Bouton Reprendre enrichi — emoji + label + progression
  const lastSection=localStorage.getItem('casIn_lastSection');
  const sectionMap={quiz:'quiz.html',fiches:'fiches/index.html',tp:'tp.html',scene:'scene.html'};
  const sectionMeta={
    quiz:  {icon:'💊', label:'Quiz',   prog:()=> seen>0 ? Math.round(seen/1439*100)+'%' : ''},
    fiches:{icon:'📄', label:'Fiches', prog:()=> fichesRead>0 ? Math.round(fichesRead/54*100)+'%' : ''},
    tp:    {icon:'🧪', label:'TP',     prog:()=> tpTotal>0 ? tpTotal+' résolus' : ''},
    scene: {icon:'🚨', label:'Scènes', prog:()=> scenesDone>0 ? Math.round(scenesDone/18*100)+'%' : ''}
  };
  if(lastSection&&sectionMap[lastSection]){
    const rb=document.getElementById('resume-btn');
    const meta=sectionMeta[lastSection];
    rb.href=sectionMap[lastSection];
    const progTxt=meta ? meta.prog() : '';
    rb.innerHTML =
      `<span class="rb-icon" aria-hidden="true">${meta ? meta.icon : '↩'}</span>` +
      `<span class="rb-label">Reprendre : ${meta ? meta.label : lastSection}</span>` +
      (progTxt ? `<span class="rb-prog">· ${progTxt}</span>` : '');
    document.getElementById('resume-wrap').style.display='block';
  }
}catch(e){console.warn('[landing]',e)}

// ── PWA install prompt ──
let _deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();_deferredPrompt=e;
  setTimeout(()=>{try{if(!localStorage.getItem('casIn_pwaInstalled'))document.getElementById('pwa-banner').style.display='block';}catch(x){}},3000);
});
function installPWA(){
  if(!_deferredPrompt)return;
  _deferredPrompt.prompt();
  _deferredPrompt.userChoice.then(c=>{
    if(c.outcome==='accepted')try{localStorage.setItem('casIn_pwaInstalled','1')}catch(x){}
    document.getElementById('pwa-banner').style.display='none';_deferredPrompt=null;
  });
}
window.installPWA = installPWA;

})();

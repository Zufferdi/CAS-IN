/**
 * CAS-IN — Role Abilities (Pack L2)
 * ──────────────────────────────────────────────────────────────
 * Compétences passives uniques par rôle, déclenchées en début de scène
 * et utilisables pendant la scène. Chaque rôle a UN trait :
 *
 *   🕵 Investigator → 🔍 Œil de lynx
 *      Hint contextuel affiché en haut du briefing.
 *      Pas de spoiler du choix correct, juste une orientation.
 *
 *   ⚖️ Magistrate → 📜 Connaissance du droit
 *      Refs légales auto-développées : le glossaire est ouvert
 *      par défaut sur chaque ref, et chaque ref affiche son texte
 *      complet plutôt que juste l'abréviation.
 *
 *   📰 Journalist → 🎤 Carnet de sources
 *      Affiche l'alignment des PNJ en début de scène
 *      (ally / neutral / adversary) — utile pour anticiper.
 *
 *   ⌨️ Hacker → 🔓 Backdoor
 *      Bouton "Skip" disponible 1× par scène. Permet de passer
 *      une étape qu'on juge trop facile, sans erreur. 0 XP gagné
 *      sur cette étape mais aucune pénalité. Affiche un toast.
 *
 * Charge : avant scene-app.js — expose window.RoleAbilities.
 * Hook : appelé par scene-app.js au moment du briefing et avant
 * chaque étape.
 */
(function() {
  'use strict';

  const ABILITY_DEFS = {
    investigator: {
      icon: '🔍',
      name: 'Œil de lynx',
      desc: 'Un indice contextuel s\'affiche en début de scène pour orienter votre attention.'
    },
    magistrate: {
      icon: '📜',
      name: 'Connaissance du droit',
      desc: 'Les références légales sont développées automatiquement avec leur texte complet.'
    },
    journalist: {
      icon: '🎤',
      name: 'Carnet de sources',
      desc: 'Les alignements des PNJ (allié / neutre / adversaire) sont visibles dès le briefing.'
    },
    hacker: {
      icon: '🔓',
      name: 'Backdoor',
      desc: 'Vous pouvez passer 1 étape par scène (0 XP sur cette étape, mais aucune pénalité).'
    }
  };

  // ──────────────────────────────────────────────────────────
  //  Hints contextuels (Investigator) — par scène ou par tag
  // ──────────────────────────────────────────────────────────
  // Map id-de-scène → indice contextuel. Si pas mappé, on utilise
  // un hint générique basé sur les tags.
  const SCENE_HINTS = {
    'custody':         'Pensez à RFC 3227 : ordre de volatilité — RAM avant disque.',
    'premier_appel':   'Le premier réflexe est de ne pas contaminer la scène. Documentation > rapidité.',
    'phishing':        'Avant tout : préserver le mail original avec ses headers. Pas de transfert.',
    'metadata':        'Les métadonnées peuvent être modifiées. Cherchez les divergences entre sources.',
    'trois_artefacts': 'Sur Windows : MFT, Registry, Event logs sont vos meilleurs amis.',
    'bitlocker':       'Avant d\'éteindre : la clé est en RAM. Captures mémoire en priorité.',
    'fr-affaire-sarine-1-premier-appel': 'Le téléphone sur le parking n\'est pas une coïncidence.',
    'fr-affaire-sarine-2-eimp-stuttgart': 'Convention de Budapest art. 29 — préservation rapide.',
    'fr-affaire-sarine-3-coordination-cantons': 'Art. 31 CPP — lieu où le résultat se produit.',
    'fr-affaire-sarine-4-expertise-unifr': 'Multi-sources d\'attribution : minimum 3-5 indépendantes.',
    'fr-affaire-sarine-5-audience-recevabilite': 'Art. 141 CPP : 3 régimes d\'inexploitabilité.',
  };

  const TAG_HINTS = {
    'EIMP':           'Pensez au principe de spécialité (art. 67 EIMP).',
    'RANSOMWARE':     'RAM en priorité — la clé peut y être présente avant l\'arrêt.',
    'OSINT':          'Cherchez les corrélations : 5 sources indépendantes minimum.',
    'DEEPFAKE':       'Vérifiez les artefacts visuels et l\'audio en parallèle.',
    'BEC':            'Headers du mail + DKIM/SPF + chronologie des virements.',
    'CRYPTO':         'L\'attribution wallet est lente : passez par les exchanges.',
    'FORENSIQUE':     'Hashes à chaque étape : saisie / transport / réception / analyse.',
    'CPP':            'Vérifiez compétence ratione loci (art. 31) et personae.',
    'PROCEDURE':      'Documentez chaque acte avec horodatage. Pas d\'oral non transcrit.',
  };

  function getInvestigatorHint(scene) {
    if (!scene) return null;
    if (SCENE_HINTS[scene.id]) return SCENE_HINTS[scene.id];
    // Fallback générique par tag
    if (Array.isArray(scene.tags)) {
      for (const t of scene.tags) {
        const tagU = String(t).toUpperCase();
        if (TAG_HINTS[tagU]) return TAG_HINTS[tagU];
      }
    }
    return 'Documentez chaque action. Une décision non tracée est une décision perdue.';
  }

  // ──────────────────────────────────────────────────────────
  //  Lecture du rôle actif
  // ──────────────────────────────────────────────────────────
  function getActiveRole() {
    if (window.Profile && typeof window.Profile.getTrack === 'function') {
      try { return window.Profile.getTrack(); } catch (_) {}
    }
    return null;
  }

  function getAbilityDef() {
    const role = getActiveRole();
    return ABILITY_DEFS[role] || null;
  }

  // ──────────────────────────────────────────────────────────
  //  Rendu de l'ability dans le briefing
  // ──────────────────────────────────────────────────────────
  function renderAbilityBanner(scene) {
    const role = getActiveRole();
    const def = ABILITY_DEFS[role];
    if (!def || !scene) return '';

    let extraHTML = '';
    if (role === 'investigator') {
      const hint = getInvestigatorHint(scene);
      extraHTML = hint ? `<div class="ability-hint">💡 ${hint}</div>` : '';
      // v2.91 PACK L3 — Compter les hints lus pour role_inv_morse
      // On compte 1 hint par scène vue (renderAbilityBanner appelé 1× par scène)
      if (hint) {
        try {
          const cnt = parseInt(localStorage.getItem('casIn_role_hintsRead') || '0', 10);
          // Anti-double-count : on persiste les sceneIds déjà vues
          const seenKey = 'casIn_role_hintsScenes';
          const seen = JSON.parse(localStorage.getItem(seenKey) || '[]');
          if (!seen.includes(scene.id)) {
            seen.push(scene.id);
            localStorage.setItem(seenKey, JSON.stringify(seen.slice(-100))); // cap 100
            localStorage.setItem('casIn_role_hintsRead', String(cnt + 1));
          }
        } catch (_) {}
      }
    } else if (role === 'journalist') {
      extraHTML = renderNpcAlignmentPreview(scene);
    } else if (role === 'magistrate') {
      extraHTML = '<div class="ability-hint">📜 Refs légales développées automatiquement dans cette scène.</div>';
    } else if (role === 'hacker') {
      extraHTML = '<div class="ability-hint">🔓 Vous disposez d\'1 skip backdoor. Bouton « Skip » disponible à chaque étape.</div>';
    }

    return `
      <div class="role-ability-banner role-ability-${role}">
        <div class="role-ability-header">
          <span class="role-ability-icon">${def.icon}</span>
          <div class="role-ability-text">
            <div class="role-ability-name">Compétence : ${def.name}</div>
            <div class="role-ability-desc">${def.desc}</div>
          </div>
        </div>
        ${extraHTML}
      </div>
    `;
  }

  function renderNpcAlignmentPreview(scene) {
    if (!scene.npcs || !scene.npcs.length) return '';
    if (typeof window.NPC_DATA === 'undefined') return '';
    const items = [];
    scene.npcs.forEach(n => {
      const nid = typeof n === 'string' ? n : n.id;
      if (!nid) return;
      const npc = window.NPC_DATA[nid];
      if (!npc) return;
      const align = npc.alignment || 'neutral';
      const alignLabel = { ally: 'Allié', neutral: 'Neutre', adversary: 'Adversaire' }[align] || 'Neutre';
      const alignColor = { ally: '#7ed957', neutral: '#9aa5b1', adversary: '#ff6b6b' }[align];
      items.push(`<span class="npc-align-chip" style="border-color:${alignColor};color:${alignColor}">${npc.icon || '👤'} ${npc.name} · ${alignLabel}</span>`);
    });
    if (!items.length) return '';
    return `<div class="ability-npc-preview">${items.join('')}</div>`;
  }

  // ──────────────────────────────────────────────────────────
  //  Skip Hacker — bouton "Skip backdoor" en bas de l'étape
  // ──────────────────────────────────────────────────────────
  // L'état du skip est dans window.G.hackerSkipUsed (flag par scène)
  function canUseSkip() {
    const role = getActiveRole();
    if (role !== 'hacker') return false;
    if (typeof window.G === 'undefined') return false;
    return !window.G.hackerSkipUsed;
  }

  function renderSkipButton() {
    if (!canUseSkip()) return '';
    return `
      <button type="button"
              class="role-ability-skip-btn"
              onclick="window.RoleAbilities.useSkip()">
        🔓 Skip cette étape (Backdoor — 1 utilisation)
      </button>
    `;
  }

  function useSkip() {
    if (!canUseSkip()) return;
    if (typeof window.G === 'undefined' || !window.G.scene) return;
    window.G.hackerSkipUsed = true;

    // v2.91 PACK L3 — Compteur backdoors utilisés (achievement role_hack_backdoor)
    try {
      const cnt = parseInt(localStorage.getItem('casIn_role_backdoorsUsed') || '0', 10);
      localStorage.setItem('casIn_role_backdoorsUsed', String(cnt + 1));
    } catch (_) {}

    // Marquer la décision actuelle comme "skip" : pts=0, ok=true mais
    // pas comptabilisé comme bonne décision.
    const stepIdx = window.G.stepIdx;
    window.G.decisions[stepIdx] = {
      ok: false,
      pts: 0,
      fb: '🔓 Étape passée via Backdoor (compétence Hacker éthique). 0 XP gagné, aucune pénalité.',
      legal: null,
      critical: false,
      skipped: true
    };
    window.G.answered = true;

    // Toast
    if (typeof window.showToast === 'function') {
      window.showToast('🔓 Backdoor utilisée — étape passée');
    }

    // Avancer à l'étape suivante
    if (typeof window.nextStep === 'function') {
      setTimeout(() => window.nextStep(), 800);
    } else if (typeof window.advanceStep === 'function') {
      setTimeout(() => window.advanceStep(), 800);
    } else {
      // Fallback : déclencher manuellement le bouton "Continuer"
      const next = document.getElementById('next-step-btn');
      if (next) {
        next.disabled = false;
        setTimeout(() => next.click(), 800);
      }
    }
  }

  // ──────────────────────────────────────────────────────────
  //  Magistrate — refs légales auto-développées
  // ──────────────────────────────────────────────────────────
  // Intercepte la création de chips légales dans scene-app.js et y
  // ajoute le texte complet en data-attribute.
  function enrichLegalRefs() {
    if (getActiveRole() !== 'magistrate') return;
    const refs = document.querySelectorAll('.refs-row .ref-tag, .legal-ref-chip, [data-legal-ref]');
    refs.forEach(r => {
      r.classList.add('magistrate-expanded');
    });
  }

  // ──────────────────────────────────────────────────────────
  //  STYLES
  // ──────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('role-abilities-styles')) return;
    const s = document.createElement('style');
    s.id = 'role-abilities-styles';
    s.textContent = `
      .role-ability-banner {
        margin: 0.75rem 0 1rem;
        padding: 0.85rem 1rem;
        border-radius: 8px;
        background: rgba(8, 14, 26, 0.5);
        border: 1px solid var(--border, #2a3140);
        border-left-width: 3px;
      }
      .role-ability-investigator { border-left-color: #38b6ff; }
      .role-ability-magistrate { border-left-color: #c89b3c; }
      .role-ability-journalist { border-left-color: #ff6b6b; }
      .role-ability-hacker { border-left-color: #00e5cc; }

      .role-ability-header {
        display: flex; align-items: flex-start; gap: 0.75rem;
        margin-bottom: 0.5rem;
      }
      .role-ability-icon {
        font-size: 1.7rem; line-height: 1; flex-shrink: 0;
        filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.15));
      }
      .role-ability-text { flex: 1; min-width: 0; }
      .role-ability-name {
        font-size: 0.85rem; font-weight: 700; color: var(--text, #e8eaed);
        margin-bottom: 2px;
      }
      .role-ability-desc {
        font-size: 0.78rem; color: var(--dim, #9aa5b1); line-height: 1.4;
      }

      .ability-hint {
        margin-top: 0.6rem;
        padding: 0.55rem 0.85rem;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 6px;
        font-size: 0.82rem; color: var(--text); line-height: 1.45;
        border: 1px dashed rgba(255, 255, 255, 0.12);
      }
      .ability-npc-preview {
        margin-top: 0.6rem;
        display: flex; flex-wrap: wrap; gap: 0.4rem;
      }
      .npc-align-chip {
        display: inline-flex; align-items: center; gap: 0.3rem;
        padding: 0.3rem 0.7rem;
        border: 1.5px solid;
        border-radius: 999px;
        font-size: 0.72rem; font-weight: 600;
        background: rgba(0, 0, 0, 0.2);
      }

      /* Hacker skip button */
      .role-ability-skip-btn {
        display: block;
        width: 100%;
        margin: 0.85rem 0 0.25rem;
        padding: 0.65rem 1rem;
        background: linear-gradient(135deg, rgba(0, 229, 204, 0.10), rgba(0, 229, 204, 0.04));
        border: 1px dashed rgba(0, 229, 204, 0.45);
        border-radius: 8px;
        color: #00e5cc;
        font-family: var(--mono, monospace);
        font-size: 0.78rem; font-weight: 700;
        letter-spacing: 0.05em;
        cursor: pointer;
        transition: 0.2s;
      }
      .role-ability-skip-btn:hover {
        background: rgba(0, 229, 204, 0.18);
        border-style: solid;
        transform: translateY(-1px);
      }

      /* Magistrate refs expanded */
      .magistrate-expanded {
        background: linear-gradient(135deg, rgba(200, 155, 60, 0.08), transparent) !important;
        border-color: rgba(200, 155, 60, 0.3) !important;
      }
    `;
    document.head.appendChild(s);
  }

  // ──────────────────────────────────────────────────────────
  //  API publique
  // ──────────────────────────────────────────────────────────
  window.RoleAbilities = Object.freeze({
    getActiveRole,
    getAbilityDef,
    renderAbilityBanner,
    renderSkipButton,
    canUseSkip,
    useSkip,
    enrichLegalRefs,
    ABILITY_DEFS: Object.freeze(ABILITY_DEFS),
  });

  // Auto-injection des styles au chargement
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectStyles);
    } else {
      injectStyles();
    }
  }
})();

/**
 * CAS-IN — Campaign metadata v1.1
 * ──────────────────────────────────────────────────────────────
 * Métadonnées enrichies pour les campagnes du lobby des scénarios.
 *
 * Schéma par campagne :
 *   {
 *     tagline:   "phrase d'accroche courte (italique)",
 *     synopsis:  "pitch HTML 2-4 phrases avec <em>/<strong>",
 *     cast:      [{ npcId, role, label?, name?, icon? }],
 *               role ∈ "primary" (cyan) | "antagonist" (rouge) | "expert" (jaune)
 *               label : étiquette courte si on veut surcharger npc.role
 *     themes:    ["EIMP", "OSINT", "ICS", ...]   chips bleues
 *     regions:   ["Valais", "Italie", ...]       chips orange
 *   }
 *
 * Si une campagne n'a PAS d'entrée ici, le panneau pitch retombe
 * gracieusement sur son { title, icon, desc } défini dans PARCOURS.
 *
 * Les npcId doivent correspondre aux clés de data/npcs.json
 * (sinon, fallback sur c.name + c.icon).
 */
(function () {
  'use strict';

  window.CAS_IN_CAMPAIGN_META = {

    // ──────────────────────────────────────────────────────────
    //  AFFAIRE SARINE — Fil rouge fribourgeois
    // ──────────────────────────────────────────────────────────
    'affaire_sarine': {
      tagline: "Une PME, une coopérative, un club de hockey. Le même groupe les frappe tous.",
      synopsis: `Janvier 2025, Bulle. <strong>Sarine Mécanique SA</strong>, sous-traitant Liebherr, est paralysée par un ransomware. Le téléphone burner trouvé sur le parking ouvre une enquête bien plus large : trois PME fribourgeoises, un VPS à <em>Stuttgart</em>, des wallets BTC partagés. La procureure <em>Genoud</em> regroupe les dossiers, lance une demande d'<strong>EIMP</strong> vers l'Allemagne, mandate l'expertise du <em>Dr Jendly</em> à l'UNIFR, et coordonne avec Berne et Vaud. Au bout, une audience de recevabilité où <strong>Me Bersier</strong> attaque toute la chaîne de custody.`,
      cast: [
        { npcId: 'fr_polcant_schmid',   role: 'primary',    label: 'Cap. Schmid · Polcant FR (joueur·e)' },
        { npcId: 'fr_prosecutor_cyber', role: 'primary',    label: 'Mme Genoud · MP-FR (cheffe d\'instruction)' },
        { npcId: 'fr_jendly_unifr',     role: 'expert',     label: 'Dr Jendly · UNIFR (experte forensique)' },
        { npcId: 'fr_bersier_avocate',  role: 'antagonist', label: 'Me Bersier · défense (étude Bersier & Associés)' },
        { npcId: 'fr_director',         role: 'primary',    label: 'M. Bertschy · directeur coopérative (victime)' },
        { npcId: 'rotzetter',           role: 'primary',    label: 'O. Rotzetter · président HCFR (victime BEC)' }
      ],
      themes: [
        'Ransomware', 'EIMP Allemagne', 'Convention Budapest',
        'Memory Forensics', 'Chaîne de custody', 'Art. 248 CPP',
        'Joinder de procédures', 'Audience de recevabilité'
      ],
      regions: ['Fribourg', 'Allemagne (Stuttgart)']
    },

    // ──────────────────────────────────────────────────────────
    //  AFFAIRE DE LA VIÈGE — Fil rouge valaisan (v2.91)
    // ──────────────────────────────────────────────────────────
    'affaire_viege': {
      tagline: "Une avalanche, du mercure, un barrage. Trois enquêtes, un seul réseau — entre Saas Fee et Reggio Calabria.",
      synopsis: `Février 2025, <strong>Saas-Almagell</strong>. Une avalanche emporte un randonneur isolé. Sous deux mètres de neige, son iPhone 14 Pro est intact ; le bilan d'appels mène à <em>Bricolage AG</em>, société de BTP de <strong>Brig</strong>. L'OSINT révèle une cellule 'Ndrangheta (clan Pelaia-Romeo) implantée dans le Haut-Valais. En parallèle, une chimiste de <strong>Lonza Visp</strong> alerte sur des rejets de mercure attribués à un sous-traitant fictif — le même clan. Le SCADA du barrage de <strong>Mattmark</strong> présente des modifications discrètes, en lien avec le dossier <em>Mauvoisin</em>. <strong>EIMP</strong> avec la DDA de Milan, perquisition simultanée trilingue à Brig, audience finale au Tribunal cantonal de Sion où <strong>Me Schnyder</strong> dépose 47 pages de questions préjudicielles. 12 scènes, du premier sondage RECCO au verdict.`,
      cast: [
        { npcId: 'vs_polcant_cyber',      role: 'primary',    label: 'Insp. Salamin · Polcant VS (joueur·e, cyber + financier)' },
        { npcId: 'vs_prosecutor_cyber',   role: 'primary',    label: 'M. Crittin · MP-VS (procureur cantonal cyber)' },
        { npcId: 'vs_polcant_alpine',     role: 'primary',    label: 'Sgt Fournier · Polcant VS brigade alpine (Brig)' },
        { npcId: 'vs_lonza_whistleblower',role: 'primary',    label: 'Mme Imseng · ingénieure Lonza Visp (lanceuse d\'alerte, PADR)' },
        { npcId: 'vs_securite_barrages',  role: 'expert',     label: 'M. Imboden · sécurité OT barrages valaisans' },
        { npcId: 'it_dda_manfredi',       role: 'primary',    label: 'Dott.ssa Manfredi · DDA Milano (entraide IT)' },
        { npcId: 'vs_ofev_juriste',       role: 'expert',     label: 'Mme Bregy · OFEV (juriste, art. 60 LPE)' },
        { npcId: 'vs_eimp_juriste',       role: 'expert',     label: 'Me Pellaud · MP-VS (entraide internationale)' },
        { npcId: 'interpol_europol_liaison', role: 'expert',  label: 'M. Reichenbach · fedpol-Interpol (liaison opérationnelle)' },
        { npcId: 'vs_mafia_lawyer',       role: 'antagonist', label: 'Me Schnyder · défense pénale Brig (47 pages de préjudicielles)' }
      ],
      themes: [
        'Avalanche & RECCO', 'Mobile post-avalanche', 'OSINT licite',
        'Lanceur d\'alerte (art. 321b CO)', 'ICS / SCADA Mattmark',
        'Pollution mercurielle (art. 60 LPE)', 'EIMP Italie',
        'Trilinguisme Brig (FR/DE/IT)', 'Spécialité (art. 67 EIMP)',
        'Scellés (art. 248 CPP)', 'Audience art. 339 CPP',
        '\'Ndrangheta — clan Pelaia-Romeo'
      ],
      regions: ['Valais (Saas-Almagell · Visp · Brig · Mattmark · Sion)', 'Italie (Milano · Reggio Calabria)']
    }

  };

})();

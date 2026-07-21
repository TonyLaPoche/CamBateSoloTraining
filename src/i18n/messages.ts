export type Locale = "fr" | "en";

export type Messages = {
  header: {
    localOnly: string;
    best: string;
    langToggle: string;
  };
  status: {
    camOff: string;
    trackingOk: string;
    showHands: string;
    loading: string;
    trackingKo: string;
    waiting: string;
  };
  home: {
    title: string;
    intro: string;
    pseudo: string;
    pseudoHint: string;
    pseudoMin: string;
    bestScore: string;
    bestCombo: string;
    sessions: string;
    enterArena: string;
    sessionsTitle: string;
    sessionsEmpty: string;
    play: string;
    download: string;
    delete: string;
    close: string;
    sessionMeta: string;
    disclaimerTitle: string;
    disclaimerMobile: string;
    disclaimerPurpose: string;
    disclaimerPrivacy: string;
    footerCopyright: string;
    footerContact: string;
  };
  permissions: {
    title: string;
    blurbBefore: string;
    blurbCam: string;
    blurbAfter: string;
    statusGranted: string;
    statusDenied: string;
    statusPrompt: string;
    statusUnsupported: string;
    statusUnknown: string;
    step1: string;
    step2Before: string;
    step2Home: string;
    step2After: string;
    step3: string;
    allow: string;
    retest: string;
    requesting: string;
    refresh: string;
    okHint: string;
    deniedMobile: string;
    deniedDesktop: string;
    noCamera: string;
    errorFallback: string;
  };
  pwa: {
    title: string;
    iosTip: string;
    defaultTip: string;
    install: string;
    later: string;
  };
  overlay: {
    hands: string;
    handsShort: string;
    face: string;
    faceShort: string;
    hud: string;
    hudShort: string;
  };
  arena: {
    activating: string;
    back: string;
    exit: string;
  };
  score: {
    idle: string;
    fapping: string;
    dualJoined: string;
    cumBadge: string;
    faps: string;
    score: string;
    ptsLine: string;
    bonusLive: string;
    total: string;
    cumulative: string;
    handJoined: string;
    handSeparated: string;
    handOne: string;
    handNone: string;
    eyesClosed: string;
    eyesOne: string;
    eyesOpen: string;
    eyesUnknown: string;
    mouthOpen: string;
    mouthClosed: string;
    mouthUnknown: string;
    hintHands: string;
    hintEyes: string;
    hintMouth: string;
  };
  controls: {
    enableCam: string;
    start: string;
    pause: string;
    rec: string;
    resume: string;
    stop: string;
    cum: string;
    edge: string;
    download: string;
    reset: string;
  };
  toast: {
    fapping: string;
    pauseFap: string;
    cumActive: string;
    edgeCooldown: string;
    recStart: string;
    recResume: string;
    recPause: string;
    recStop: string;
    sessionSaved: string;
    backHome: string;
    fapsMilestone: string;
    letsFap: string;
    gonnaCum: string;
    milestone: string;
  };
  hud: {
    startFap: string;
    pauseFap: string;
    start: string;
    pause: string;
    cum: string;
    cumShort: string;
    edge: string;
    edgeShort: string;
    recStart: string;
    rec: string;
    resume: string;
    pauseRec: string;
    stop: string;
  };
};

export const fr: Messages = {
  header: {
    localOnly: "Local only",
    best: "Best",
    langToggle: "Langue",
  },
  status: {
    camOff: "Caméra off",
    trackingOk: "Tracking OK",
    showHands: "Montre tes mains",
    loading: "Chargement…",
    trackingKo: "Tracking KO",
    waiting: "En attente",
  },
  home: {
    title: "CAMBATE SOLO",
    intro:
      "Choisis un pseudo (4–5 lettres), puis entre dans l’arène. Tes scores seront sauvegardés au format",
    pseudo: "Pseudo",
    pseudoHint: "lettres uniquement",
    pseudoMin: "min. 4 lettres",
    bestScore: "Best score",
    bestCombo: "Best combo",
    sessions: "Sessions",
    enterArena: "Entrer dans l’arène",
    sessionsTitle: "Sessions enregistrées",
    sessionsEmpty:
      "Aucune session pour l’instant. Rec pendant un fap, puis Exit — le clip apparaîtra ici.",
    play: "Play",
    download: "DL",
    delete: "Suppr",
    close: "Fermer",
    sessionMeta: "{pseudo}{pumps} pumps · score {score} · combo ×{combo} · {duration}{video}",
    disclaimerTitle: "À propos de ce projet",
    disclaimerMobile:
      "Sur mobile, le rendu peut ne pas fonctionner ou mal fonctionner. Ce n’est qu’un test — le desktop reste le contexte prévu.",
    disclaimerPurpose:
      "Le but premier de cette app est d’expérimenter (tracking cam, score, record local), pas de créer un concurrent direct à GoonMaxxing.",
    disclaimerPrivacy:
      "Aucune donnée n’est revendue à des tiers. Aucune publicité n’est implémentée. La caméra reste traitée localement dans ton navigateur.",
    footerCopyright: "Copyright © Antoine Terrade {year}",
    footerContact: "Contact",
  },
  permissions: {
    title: "Permissions mobile",
    blurbBefore: "Sur téléphone, autorise la",
    blurbCam: "caméra frontale",
    blurbAfter: "avant l’arène. HTTPS requis (GitHub Pages OK).",
    statusGranted: "Autorisée",
    statusDenied: "Refusée",
    statusPrompt: "Non demandée",
    statusUnsupported: "Indisponible",
    statusUnknown: "À vérifier",
    step1: "Autorise la caméra (bouton ci-dessous).",
    step2Before: "iPhone : Safari → Partager →",
    step2Home: "Sur l’écran d’accueil",
    step2After: "pour le mode app.",
    step3:
      "Si refusée : Réglages système → navigateur → Caméra → Autoriser, puis reviens ici.",
    allow: "Autoriser la caméra",
    retest: "Retester la caméra",
    requesting: "Demande…",
    refresh: "Rafraîchir",
    okHint: "Caméra OK — tu peux entrer dans l’arène.",
    deniedMobile:
      "Permission refusée. Réactive la caméra dans Réglages → Safari/Chrome → Caméra, puis réessaie.",
    deniedDesktop:
      "Permission refusée. Autorise la caméra dans les réglages du navigateur.",
    noCamera: "Aucune caméra détectée sur cet appareil.",
    errorFallback: "Impossible d’accéder à la caméra.",
  },
  pwa: {
    title: "Installer l’app",
    iosTip:
      "Safari → Partager → Sur l’écran d’accueil (plein écran, plus confortable).",
    defaultTip: "Ajoute-la à l’écran d’accueil pour un mode plein écran.",
    install: "Installer",
    later: "Plus tard",
  },
  overlay: {
    hands: "Mains",
    handsShort: "M",
    face: "Visage",
    faceShort: "V",
    hud: "HUD cam",
    hudShort: "H",
  },
  arena: {
    activating: "ACTIVATION CAM…",
    back: "Retour",
    exit: "Exit",
  },
  score: {
    idle: "Idle",
    fapping: "Fapping",
    dualJoined: "Dual joined",
    cumBadge: "Cum ×3",
    faps: "FAPS",
    score: "Score",
    ptsLine: "1 fap = {pts}{cum} pts",
    bonusLive: "Bonus live",
    total: "Total",
    cumulative: "Cumulatif · {count} main(s)",
    handJoined: "2 mains jointes",
    handSeparated: "2 mains (séparées)",
    handOne: "1 main",
    handNone: "0 main",
    eyesClosed: "Yeux fermés",
    eyesOne: "1 œil fermé",
    eyesOpen: "Yeux ouverts",
    eyesUnknown: "Yeux —",
    mouthOpen: "Bouche ouverte",
    mouthClosed: "Bouche fermée",
    mouthUnknown: "Bouche —",
    hintHands: "2 mains jointes = ×2 · sinon ×1",
    hintEyes: "2 yeux fermés = ×4 · 1 œil = ×1.5",
    hintMouth: "Bouche ouverte = ×2",
  },
  controls: {
    enableCam: "Activer la caméra",
    start: "Start",
    pause: "Pause",
    rec: "Rec",
    resume: "Resume",
    stop: "Stop",
    cum: "Cum ×3",
    edge: "Edge…",
    download: "DL",
    reset: "Reset",
  },
  toast: {
    fapping: "FAPPING",
    pauseFap: "PAUSE FAP",
    cumActive: "×3 ACTIVE",
    edgeCooldown: "EDGE COOLDOWN",
    recStart: "REC START",
    recResume: "REC RESUME",
    recPause: "REC PAUSE",
    recStop: "REC STOP",
    sessionSaved: "Session sauvegardée",
    backHome: "Retour à l’accueil",
    fapsMilestone: "{n} FAPS",
    letsFap: "LET'S FAP!",
    gonnaCum: "I'M GONNA CUM",
    milestone: "Palier",
  },
  hud: {
    startFap: "START FAP",
    pauseFap: "PAUSE FAP",
    start: "START",
    pause: "PAUSE",
    cum: "I'M GONNA CUM",
    cumShort: "CUM ×3",
    edge: "EDGE…",
    edgeShort: "EDGE",
    recStart: "REC START",
    rec: "REC",
    resume: "RESUME",
    pauseRec: "PAUSE",
    stop: "STOP",
  },
};

export const en: Messages = {
  header: {
    localOnly: "Local only",
    best: "Best",
    langToggle: "Language",
  },
  status: {
    camOff: "Camera off",
    trackingOk: "Tracking OK",
    showHands: "Show your hands",
    loading: "Loading…",
    trackingKo: "Tracking failed",
    waiting: "Waiting",
  },
  home: {
    title: "CAMBATE SOLO",
    intro:
      "Pick a nickname (4–5 letters), then enter the arena. Scores are saved as",
    pseudo: "Nickname",
    pseudoHint: "letters only",
    pseudoMin: "min. 4 letters",
    bestScore: "Best score",
    bestCombo: "Best combo",
    sessions: "Sessions",
    enterArena: "Enter the arena",
    sessionsTitle: "Saved sessions",
    sessionsEmpty:
      "No sessions yet. Rec while fapping, then Exit — the clip will show up here.",
    play: "Play",
    download: "DL",
    delete: "Delete",
    close: "Close",
    sessionMeta:
      "{pseudo}{pumps} pumps · score {score} · combo ×{combo} · {duration}{video}",
    disclaimerTitle: "About this project",
    disclaimerMobile:
      "On mobile, rendering may not work or may work poorly. This is only a test — desktop is the intended setup.",
    disclaimerPurpose:
      "The primary goal of this app is to experiment (cam tracking, scoring, local recording), not to be a direct competitor to GoonMaxxing.",
    disclaimerPrivacy:
      "No data is sold to third parties. No ads are implemented. Camera processing stays local in your browser.",
    footerCopyright: "Copyright © Antoine Terrade {year}",
    footerContact: "Contact",
  },
  permissions: {
    title: "Mobile permissions",
    blurbBefore: "On phone, allow the",
    blurbCam: "front camera",
    blurbAfter: "before entering the arena. HTTPS required (GitHub Pages OK).",
    statusGranted: "Allowed",
    statusDenied: "Denied",
    statusPrompt: "Not asked",
    statusUnsupported: "Unavailable",
    statusUnknown: "Check needed",
    step1: "Allow the camera (button below).",
    step2Before: "iPhone: Safari → Share →",
    step2Home: "Add to Home Screen",
    step2After: "for app mode.",
    step3:
      "If denied: System Settings → browser → Camera → Allow, then come back here.",
    allow: "Allow camera",
    retest: "Retest camera",
    requesting: "Requesting…",
    refresh: "Refresh",
    okHint: "Camera OK — you can enter the arena.",
    deniedMobile:
      "Permission denied. Re-enable the camera in Settings → Safari/Chrome → Camera, then try again.",
    deniedDesktop:
      "Permission denied. Allow the camera in your browser settings.",
    noCamera: "No camera detected on this device.",
    errorFallback: "Unable to access the camera.",
  },
  pwa: {
    title: "Install the app",
    iosTip:
      "Safari → Share → Add to Home Screen (fullscreen, more comfortable).",
    defaultTip: "Add it to your home screen for fullscreen mode.",
    install: "Install",
    later: "Later",
  },
  overlay: {
    hands: "Hands",
    handsShort: "H",
    face: "Face",
    faceShort: "F",
    hud: "Cam HUD",
    hudShort: "U",
  },
  arena: {
    activating: "STARTING CAM…",
    back: "Back",
    exit: "Exit",
  },
  score: {
    idle: "Idle",
    fapping: "Fapping",
    dualJoined: "Dual joined",
    cumBadge: "Cum ×3",
    faps: "FAPS",
    score: "Score",
    ptsLine: "1 fap = {pts}{cum} pts",
    bonusLive: "Live bonus",
    total: "Total",
    cumulative: "Stacked · {count} hand(s)",
    handJoined: "2 hands joined",
    handSeparated: "2 hands (apart)",
    handOne: "1 hand",
    handNone: "0 hands",
    eyesClosed: "Eyes closed",
    eyesOne: "1 eye closed",
    eyesOpen: "Eyes open",
    eyesUnknown: "Eyes —",
    mouthOpen: "Mouth open",
    mouthClosed: "Mouth closed",
    mouthUnknown: "Mouth —",
    hintHands: "2 joined hands = ×2 · otherwise ×1",
    hintEyes: "Both eyes closed = ×4 · 1 eye = ×1.5",
    hintMouth: "Mouth open = ×2",
  },
  controls: {
    enableCam: "Enable camera",
    start: "Start",
    pause: "Pause",
    rec: "Rec",
    resume: "Resume",
    stop: "Stop",
    cum: "Cum ×3",
    edge: "Edge…",
    download: "DL",
    reset: "Reset",
  },
  toast: {
    fapping: "FAPPING",
    pauseFap: "PAUSE FAP",
    cumActive: "×3 ACTIVE",
    edgeCooldown: "EDGE COOLDOWN",
    recStart: "REC START",
    recResume: "REC RESUME",
    recPause: "REC PAUSE",
    recStop: "REC STOP",
    sessionSaved: "Session saved",
    backHome: "Back to home",
    fapsMilestone: "{n} FAPS",
    letsFap: "LET'S FAP!",
    gonnaCum: "I'M GONNA CUM",
    milestone: "Milestone",
  },
  hud: {
    startFap: "START FAP",
    pauseFap: "PAUSE FAP",
    start: "START",
    pause: "PAUSE",
    cum: "I'M GONNA CUM",
    cumShort: "CUM ×3",
    edge: "EDGE…",
    edgeShort: "EDGE",
    recStart: "REC START",
    rec: "REC",
    resume: "RESUME",
    pauseRec: "PAUSE",
    stop: "STOP",
  },
};

export const catalogs: Record<Locale, Messages> = { fr, en };

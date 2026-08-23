import { DEFAULT_CONTROL_PROFILES, INPUT_ACTIONS, cloneBindings, type ControlProfileId, type ControlProfiles } from "./input-manager.ts";

export type ProfileState = {
  version: 1;
  completed: boolean;
  playerName: string;
  avatar: string;
  accentColor: string;
  favoriteClubId: string;
  favoriteNationalTeamId: string;
  preferredFormat: 4 | 5 | 6;
  preferredDifficulty: "Fácil" | "Normal" | "Medio" | "Profesional" | "Pro Mundial";
};

export type SettingsState = {
  version: 3;
  language: "es" | "en";
  resolution: "Auto" | "720p" | "1080p" | "Compacta";
  sound: boolean;
  music: boolean;
  crowd: boolean;
  reducedMotion: boolean;
  camera: "CERCANA" | "EQUILIBRADA" | "ABIERTA";
  controls: {
    activeProfile: ControlProfileId;
    profiles: ControlProfiles;
  };
  gameplay: {
    passAssist: "ASSISTED" | "SEMI" | "MANUAL";
    autoSwitch: "SMART" | "PASSES_AND_LOOSE" | "PASSES_ONLY" | "MANUAL";
    switchMoveAssist: "NONE" | "LOW" | "HIGH";
    passArrow: boolean;
    receiverIndicator: boolean;
    automaticReplays: boolean;
    dynamicZoom: boolean;
  };
  graphics: {
    preset: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "ULTRA" | "CUSTOM";
    renderScale: 50 | 60 | 75 | 85 | 100;
    fpsLimit: 30 | 60 | 120 | 0;
    vsync: boolean;
    showFps: boolean;
    performanceMode: boolean;
    particles: "LOW" | "MEDIUM" | "HIGH";
    crowdDetail: "LOW" | "MEDIUM" | "HIGH";
    fieldDetail: "LOW" | "MEDIUM" | "HIGH";
    lighting: "LOW" | "MEDIUM" | "HIGH";
    playerShadows: boolean;
    antiAliasing: boolean;
  };
  audio: {
    master: number;
    music: number;
    crowd: number;
    effects: number;
    ui: number;
    musicEnabled: boolean;
    crowdEnabled: boolean;
    effectsEnabled: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    uiScale: "SMALL" | "NORMAL" | "LARGE";
    indicatorScale: "SMALL" | "NORMAL" | "LARGE";
    highlightControlled: boolean;
    highlightReceiver: boolean;
    reduceVisualEffects: boolean;
  };
};

export type MatchPlayerRating = {
  team: 0 | 1;
  playerName: string;
  goals: number;
  assists: number;
  saves: number;
  rating: number;
};

export type MatchReport = {
  score: [number, number];
  possession: [number, number];
  shots: [number, number];
  shotsOnTarget: [number, number];
  passes: [number, number];
  completedPasses: [number, number];
  tackles: [number, number];
  interceptions: [number, number];
  saves: [number, number];
  blocks: [number, number];
  possessions: [number, number];
  averagePossessionDuration: [number, number];
  averageTimeToShot: [number, number];
  goals: Array<{ team: 0 | 1; playerName: string; assistName?: string; minute?: number }>;
  playerRatings: MatchPlayerRating[];
  mvp: MatchPlayerRating | null;
  maxDeficit: number;
};

export type MatchState = {
  status: "IDLE" | "FIRST_HALF" | "HALF_TIME" | "SECOND_HALF" | "EXTRA_TIME" | "FINISHED";
  score: [number, number];
  clockSeconds: number;
  controlledPlayer: number;
  tactic: "EQUILIBRADA" | "OFENSIVA" | "DEFENSIVA" | "PRESION_TOTAL";
  report: MatchReport;
};

export type TeamState = {
  teamId: string;
  format: 4 | 5 | 6;
  formationName: string;
  selectedPlayerNames: string[];
  positions: Array<{ x: number; y: number }>;
  instructions: Record<string, string>;
};

export type PlayerStatsState = Record<string, {
  matches: number;
  goals: number;
  assists: number;
  saves: number;
  cleanSheets: number;
  ratingTotal: number;
}>;

export type TrophyRecord = {
  id: string;
  competition: string;
  teamId: string;
  wonAt: string;
  season: number;
  format: 4 | 5 | 6;
  difficulty: string;
  durationMinutes: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  finalOpponentId: string | null;
  finalScore: string | null;
  topScorer: string | null;
  bestPlayer: string | null;
  bestKeeper: string | null;
};

export type CareerState = {
  version: 1;
  trophies: TrophyRecord[];
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  bestWin: string | null;
  worstLoss: string | null;
  biggestComeback: number;
  currentWinStreak: number;
  bestWinStreak: number;
  cleanSheetStreak: number;
  maxGoalsInMatch: number;
  topScorer: string | null;
  playerGoals: Record<string, number>;
  recentForm: Array<"W" | "D" | "L">;
  achievements: string[];
};

export const DEFAULT_PROFILE: ProfileState = {
  version: 1,
  completed: false,
  playerName: "Jugador",
  avatar: "10",
  accentColor: "#d9ff45",
  favoriteClubId: "rma",
  favoriteNationalTeamId: "arg",
  preferredFormat: 5,
  preferredDifficulty: "Medio",
};

export const DEFAULT_SETTINGS: SettingsState = {
  version: 3,
  language: "es",
  resolution: "Auto",
  sound: true,
  music: true,
  crowd: true,
  reducedMotion: false,
  camera: "EQUILIBRADA",
  controls: {
    activeProfile: "DEFAULT",
    profiles: DEFAULT_CONTROL_PROFILES,
  },
  gameplay: {
    passAssist: "ASSISTED",
    autoSwitch: "SMART",
    switchMoveAssist: "LOW",
    passArrow: true,
    receiverIndicator: true,
    automaticReplays: true,
    dynamicZoom: true,
  },
  graphics: {
    preset: "HIGH",
    renderScale: 100,
    fpsLimit: 60,
    vsync: true,
    showFps: false,
    performanceMode: false,
    particles: "HIGH",
    crowdDetail: "HIGH",
    fieldDetail: "HIGH",
    lighting: "HIGH",
    playerShadows: true,
    antiAliasing: true,
  },
  audio: {
    master: 85,
    music: 45,
    crowd: 75,
    effects: 80,
    ui: 65,
    musicEnabled: true,
    crowdEnabled: true,
    effectsEnabled: true,
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    uiScale: "NORMAL",
    indicatorScale: "NORMAL",
    highlightControlled: true,
    highlightReceiver: true,
    reduceVisualEffects: false,
  },
};

export const DEFAULT_CAREER: CareerState = {
  version: 1,
  trophies: [],
  matches: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  cleanSheets: 0,
  bestWin: null,
  worstLoss: null,
  biggestComeback: 0,
  currentWinStreak: 0,
  bestWinStreak: 0,
  cleanSheetStreak: 0,
  maxGoalsInMatch: 0,
  topScorer: null,
  playerGoals: {},
  recentForm: [],
  achievements: [],
};

const isFormat = (value: unknown): value is 4 | 5 | 6 => value === 4 || value === 5 || value === 6;

export function parseProfileState(raw: string | null): ProfileState {
  if (!raw) return { ...DEFAULT_PROFILE };
  try {
    const value = JSON.parse(raw) as Partial<ProfileState>;
    return {
      ...DEFAULT_PROFILE,
      ...value,
      version: 1,
      completed: Boolean(value.completed),
      playerName: typeof value.playerName === "string" && value.playerName.trim() ? value.playerName.trim().slice(0, 18) : DEFAULT_PROFILE.playerName,
      preferredFormat: isFormat(value.preferredFormat) ? value.preferredFormat : DEFAULT_PROFILE.preferredFormat,
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function parseSettingsState(raw: string | null): SettingsState {
  if (!raw) return cloneDefaultSettings();
  try {
    const value = JSON.parse(raw) as Partial<SettingsState> & { version?: number };
    const legacySound = typeof value.sound === "boolean" ? value.sound : DEFAULT_SETTINGS.sound;
    const legacyMusic = typeof value.music === "boolean" ? value.music : DEFAULT_SETTINGS.music;
    const legacyCrowd = typeof value.crowd === "boolean" ? value.crowd : DEFAULT_SETTINGS.crowd;
    const legacyMotion = typeof value.reducedMotion === "boolean" ? value.reducedMotion : DEFAULT_SETTINGS.reducedMotion;
    const controlsValue = value.controls;
    const profiles = { ...DEFAULT_CONTROL_PROFILES } as ControlProfiles;
    for (const profileId of ["DEFAULT", "CUSTOM_1", "CUSTOM_2"] as const) {
      const candidate = controlsValue?.profiles?.[profileId];
      if (!candidate) {
        profiles[profileId] = cloneBindings(DEFAULT_CONTROL_PROFILES[profileId]);
        continue;
      }
      profiles[profileId] = cloneBindings(DEFAULT_CONTROL_PROFILES[profileId]);
      for (const action of INPUT_ACTIONS) {
        const binding = candidate[action];
        if (!binding || typeof binding !== "object") continue;
        profiles[profileId][action] = {
          primary: typeof binding.primary === "string" ? binding.primary : null,
          secondary: typeof binding.secondary === "string" ? binding.secondary : null,
        };
      }
    }
    const activeProfile = controlsValue?.activeProfile === "CUSTOM_1" || controlsValue?.activeProfile === "CUSTOM_2" ? controlsValue.activeProfile : "DEFAULT";
    const numberSetting = (candidate: unknown, fallback: number) => typeof candidate === "number" && Number.isFinite(candidate) ? Math.max(0, Math.min(100, candidate)) : fallback;
    return {
      ...DEFAULT_SETTINGS,
      ...value,
      version: 3,
      sound: legacySound,
      music: legacyMusic,
      crowd: legacyCrowd,
      reducedMotion: legacyMotion,
      controls: { activeProfile, profiles },
      gameplay: { ...DEFAULT_SETTINGS.gameplay, ...value.gameplay },
      graphics: { ...DEFAULT_SETTINGS.graphics, ...value.graphics },
      audio: {
        ...DEFAULT_SETTINGS.audio,
        ...value.audio,
        master: numberSetting(value.audio?.master, legacySound ? DEFAULT_SETTINGS.audio.master : 0),
        music: numberSetting(value.audio?.music, DEFAULT_SETTINGS.audio.music),
        crowd: numberSetting(value.audio?.crowd, DEFAULT_SETTINGS.audio.crowd),
        effects: numberSetting(value.audio?.effects, DEFAULT_SETTINGS.audio.effects),
        ui: numberSetting(value.audio?.ui, DEFAULT_SETTINGS.audio.ui),
        musicEnabled: value.audio?.musicEnabled ?? legacyMusic,
        crowdEnabled: value.audio?.crowdEnabled ?? legacyCrowd,
        effectsEnabled: value.audio?.effectsEnabled ?? legacySound,
      },
      accessibility: {
        ...DEFAULT_SETTINGS.accessibility,
        ...value.accessibility,
        reducedMotion: value.accessibility?.reducedMotion ?? legacyMotion,
      },
    };
  } catch {
    return cloneDefaultSettings();
  }
}

export function cloneDefaultSettings(): SettingsState {
  return {
    ...DEFAULT_SETTINGS,
    controls: {
      activeProfile: "DEFAULT",
      profiles: {
        DEFAULT: cloneBindings(DEFAULT_CONTROL_PROFILES.DEFAULT),
        CUSTOM_1: cloneBindings(DEFAULT_CONTROL_PROFILES.CUSTOM_1),
        CUSTOM_2: cloneBindings(DEFAULT_CONTROL_PROFILES.CUSTOM_2),
      },
    },
    gameplay: { ...DEFAULT_SETTINGS.gameplay },
    graphics: { ...DEFAULT_SETTINGS.graphics },
    audio: { ...DEFAULT_SETTINGS.audio },
    accessibility: { ...DEFAULT_SETTINGS.accessibility },
  };
}

export function parseCareerState(raw: string | null): CareerState {
  if (!raw) return { ...DEFAULT_CAREER, trophies: [], achievements: [] };
  try {
    const value = JSON.parse(raw) as Partial<CareerState>;
    return {
      ...DEFAULT_CAREER,
      ...value,
      version: 1,
      trophies: Array.isArray(value.trophies) ? value.trophies : [],
      playerGoals: value.playerGoals && typeof value.playerGoals === "object" ? value.playerGoals : {},
      recentForm: Array.isArray(value.recentForm) ? value.recentForm.filter((item): item is "W" | "D" | "L" => item === "W" || item === "D" || item === "L").slice(0, 5) : [],
      achievements: Array.isArray(value.achievements) ? value.achievements : [],
    };
  } catch {
    return { ...DEFAULT_CAREER, trophies: [], achievements: [] };
  }
}

export function applyMatchToCareer(state: CareerState, report: MatchReport): CareerState {
  const won = report.score[0] > report.score[1];
  const drew = report.score[0] === report.score[1];
  const margin = report.score[0] - report.score[1];
  const currentMargin = state.bestWin ? Number(state.bestWin.split("|")[0]) || 0 : 0;
  const lossMargin = report.score[1] - report.score[0];
  const currentLossMargin = state.worstLoss ? Number(state.worstLoss.split("|")[0]) || 0 : 0;
  const currentWinStreak = won ? state.currentWinStreak + 1 : 0;
  const cleanSheetStreak = report.score[1] === 0 ? state.cleanSheetStreak + 1 : 0;
  const playerGoals = { ...state.playerGoals };
  report.goals.filter((goal) => goal.team === 0).forEach((goal) => { playerGoals[goal.playerName] = (playerGoals[goal.playerName] ?? 0) + 1; });
  const topScorer = Object.entries(playerGoals).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? state.topScorer;
  const achievements = new Set(state.achievements);
  if (won) achievements.add("PRIMER_TRIUNFO");
  if (won && report.score[1] === 0) achievements.add("ARCO_IMBATIDO");
  if (report.completedPasses[0] >= 15) achievements.add("EQUIPO_CONECTADO");
  if (report.shots[0] >= 8) achievements.add("ATAQUE_TOTAL");
  if (won && report.maxDeficit >= 2) achievements.add("REMONTADA");
  if (cleanSheetStreak >= 3) achievements.add("IMBATIBLE");
  return {
    ...state,
    matches: state.matches + 1,
    wins: state.wins + (won ? 1 : 0),
    draws: state.draws + (drew ? 1 : 0),
    losses: state.losses + (!won && !drew ? 1 : 0),
    goalsFor: state.goalsFor + report.score[0],
    goalsAgainst: state.goalsAgainst + report.score[1],
    cleanSheets: state.cleanSheets + (report.score[1] === 0 ? 1 : 0),
    bestWin: won && margin > currentMargin ? `${margin}|${report.score[0]}-${report.score[1]}` : state.bestWin,
    worstLoss: !won && !drew && lossMargin > currentLossMargin ? `${lossMargin}|${report.score[0]}-${report.score[1]}` : state.worstLoss,
    biggestComeback: won ? Math.max(state.biggestComeback, report.maxDeficit) : state.biggestComeback,
    currentWinStreak,
    bestWinStreak: Math.max(state.bestWinStreak, currentWinStreak),
    cleanSheetStreak,
    maxGoalsInMatch: Math.max(state.maxGoalsInMatch, report.score[0]),
    topScorer,
    playerGoals,
    recentForm: [won ? "W" : drew ? "D" : "L", ...state.recentForm].slice(0, 5),
    achievements: [...achievements],
  };
}

export function addTrophy(state: CareerState, trophy: TrophyRecord): CareerState {
  if (state.trophies.some((item) => item.id === trophy.id)) return state;
  const achievements = new Set(state.achievements);
  achievements.add("CAMPEÓN");
  if (trophy.competition === "Mundial") achievements.add("CAMPEÓN_DEL_MUNDO");
  if (state.trophies.length >= 2) achievements.add("COLECCIONISTA");
  return { ...state, trophies: [trophy, ...state.trophies], achievements: [...achievements] };
}

export function emptyMatchReport(score: [number, number], goals: MatchReport["goals"] = []): MatchReport {
  return {
    score,
    possession: [50, 50],
    shots: [0, 0],
    shotsOnTarget: [0, 0],
    passes: [0, 0],
    completedPasses: [0, 0],
    tackles: [0, 0],
    interceptions: [0, 0],
    saves: [0, 0],
    blocks: [0, 0],
    possessions: [0, 0],
    averagePossessionDuration: [0, 0],
    averageTimeToShot: [0, 0],
    goals,
    playerRatings: [],
    mvp: null,
    maxDeficit: 0,
  };
}

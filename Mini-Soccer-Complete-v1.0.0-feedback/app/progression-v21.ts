export type AchievementId =
  | "FIRST_MATCH"
  | "FIRST_WIN"
  | "FIRST_GOAL"
  | "HAT_TRICK"
  | "CLEAN_SHEET"
  | "TEN_WINS"
  | "FIFTY_WINS"
  | "HUNDRED_GOALS"
  | "FIVE_HUNDRED_GOALS"
  | "COMEBACK"
  | "WORLD_CHAMPION"
  | "UNBEATEN_CHAMPION";

export type ProgressMissionId =
  | "D_PLAY_2"
  | "D_SCORE_5"
  | "D_PASSES_20"
  | "D_WIN_1"
  | "W_PLAY_8"
  | "W_WIN_5"
  | "W_SCORE_25"
  | "W_CLEAN_3"
  | "W_TEAMS_3";

export type ProgressStats = {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  completedPasses: number;
  cleanSheets: number;
  tournamentsWon: number;
  currentWinStreak: number;
  bestWinStreak: number;
  bestGoalsInMatch: number;
  biggestComeback: number;
  teamsUsed: string[];
};

export type MissionProgressState = {
  dayKey: string;
  weekKey: string;
  progress: Record<ProgressMissionId, number>;
  claimed: ProgressMissionId[];
};

export type ProgressionState = {
  version: 1;
  totalXp: number;
  achievements: AchievementId[];
  unlockedTitles: string[];
  equippedTitle: string | null;
  stats: ProgressStats;
  missions: MissionProgressState;
};

export type ProgressionMatchSummary = {
  played: boolean;
  simulated?: boolean;
  won: boolean;
  drew: boolean;
  goalsFor: number;
  goalsAgainst: number;
  completedPasses: number;
  teamId: string;
  difficulty: string;
  maxDeficit?: number;
  tournamentChampion?: boolean;
  tournamentUnbeaten?: boolean;
};

export const DAILY_MISSIONS = [
  { id: "D_PLAY_2", target: 2, xp: 90, msc: 120, label: "Jugá 2 partidos" },
  { id: "D_SCORE_5", target: 5, xp: 100, msc: 150, label: "Marcá 5 goles" },
  { id: "D_PASSES_20", target: 20, xp: 80, msc: 120, label: "Completá 20 pases" },
  { id: "D_WIN_1", target: 1, xp: 100, msc: 160, label: "Ganá 1 partido" },
] as const;

export const WEEKLY_MISSIONS = [
  { id: "W_PLAY_8", target: 8, xp: 260, msc: 420, label: "Jugá 8 partidos" },
  { id: "W_WIN_5", target: 5, xp: 320, msc: 520, label: "Ganá 5 partidos" },
  { id: "W_SCORE_25", target: 25, xp: 300, msc: 480, label: "Marcá 25 goles" },
  { id: "W_CLEAN_3", target: 3, xp: 340, msc: 560, label: "Conseguí 3 arcos invictos" },
  { id: "W_TEAMS_3", target: 3, xp: 240, msc: 400, label: "Jugá con 3 equipos distintos" },
] as const;

export const ACHIEVEMENTS: Array<{ id: AchievementId; title: string }> = [
  { id: "FIRST_MATCH", title: "Debutante" },
  { id: "FIRST_WIN", title: "Ganador" },
  { id: "FIRST_GOAL", title: "Goleador" },
  { id: "HAT_TRICK", title: "Hat-trick" },
  { id: "CLEAN_SHEET", title: "Muralla" },
  { id: "TEN_WINS", title: "Competidor" },
  { id: "FIFTY_WINS", title: "Veterano" },
  { id: "HUNDRED_GOALS", title: "Artillero" },
  { id: "FIVE_HUNDRED_GOALS", title: "Leyenda del gol" },
  { id: "COMEBACK", title: "Nunca rendirse" },
  { id: "WORLD_CHAMPION", title: "Campeón" },
  { id: "UNBEATEN_CHAMPION", title: "Invicto" },
];

const zeroProgress = (): Record<ProgressMissionId, number> => ({
  D_PLAY_2: 0,
  D_SCORE_5: 0,
  D_PASSES_20: 0,
  D_WIN_1: 0,
  W_PLAY_8: 0,
  W_WIN_5: 0,
  W_SCORE_25: 0,
  W_CLEAN_3: 0,
  W_TEAMS_3: 0,
});

export const emptyStats = (): ProgressStats => ({
  matches: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  completedPasses: 0,
  cleanSheets: 0,
  tournamentsWon: 0,
  currentWinStreak: 0,
  bestWinStreak: 0,
  bestGoalsInMatch: 0,
  biggestComeback: 0,
  teamsUsed: [],
});

export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function weekKey(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - weekday + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const firstWeekday = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstWeekday + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / 604800000);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export const DEFAULT_PROGRESSION: ProgressionState = {
  version: 1,
  totalXp: 0,
  achievements: [],
  unlockedTitles: [],
  equippedTitle: null,
  stats: emptyStats(),
  missions: { dayKey: dayKey(), weekKey: weekKey(), progress: zeroProgress(), claimed: [] },
};

const nonNegative = (value: unknown, fallback = 0) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;

export function xpNeededForLevel(level: number) {
  const safeLevel = Math.max(1, Math.floor(level));
  return 500 + (safeLevel - 1) * 180 + Math.floor((safeLevel - 1) / 10) * 220;
}

export function levelFromXp(totalXp: number) {
  let remaining = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (level < 100 && remaining >= xpNeededForLevel(level)) {
    remaining -= xpNeededForLevel(level);
    level += 1;
  }
  return { level, xpIntoLevel: remaining, xpForNext: level >= 100 ? 0 : xpNeededForLevel(level) };
}

export function refreshProgressMissions(state: ProgressionState, now = new Date()): ProgressionState {
  const today = dayKey(now), week = weekKey(now);
  let next = state;
  if (state.missions.weekKey !== week) {
    next = { ...next, missions: { dayKey: today, weekKey: week, progress: zeroProgress(), claimed: [] } };
  } else if (state.missions.dayKey !== today) {
    const progress = { ...state.missions.progress, D_PLAY_2: 0, D_SCORE_5: 0, D_PASSES_20: 0, D_WIN_1: 0 };
    const claimed = state.missions.claimed.filter(id => id.startsWith("W_"));
    next = { ...next, missions: { ...state.missions, dayKey: today, progress, claimed } };
  }
  return next;
}

export function parseProgressionState(raw: string | null): ProgressionState {
  if (!raw) return structuredClone(DEFAULT_PROGRESSION);
  try {
    const value = JSON.parse(raw) as Partial<ProgressionState>;
    const stats = value.stats ?? ({} as Partial<ProgressStats>);
    const missions = value.missions ?? ({} as Partial<MissionProgressState>);
    const parsed: ProgressionState = {
      version: 1,
      totalXp: nonNegative(value.totalXp),
      achievements: Array.isArray(value.achievements) ? value.achievements.filter((id): id is AchievementId => ACHIEVEMENTS.some(a => a.id === id)) : [],
      unlockedTitles: Array.isArray(value.unlockedTitles) ? Array.from(new Set(value.unlockedTitles.filter((x): x is string => typeof x === "string"))) : [],
      equippedTitle: typeof value.equippedTitle === "string" ? value.equippedTitle : null,
      stats: {
        matches: nonNegative(stats.matches), wins: nonNegative(stats.wins), draws: nonNegative(stats.draws), losses: nonNegative(stats.losses),
        goalsFor: nonNegative(stats.goalsFor), goalsAgainst: nonNegative(stats.goalsAgainst), completedPasses: nonNegative(stats.completedPasses),
        cleanSheets: nonNegative(stats.cleanSheets), tournamentsWon: nonNegative(stats.tournamentsWon), currentWinStreak: nonNegative(stats.currentWinStreak),
        bestWinStreak: nonNegative(stats.bestWinStreak), bestGoalsInMatch: nonNegative(stats.bestGoalsInMatch), biggestComeback: nonNegative(stats.biggestComeback),
        teamsUsed: Array.isArray(stats.teamsUsed) ? Array.from(new Set(stats.teamsUsed.filter((x): x is string => typeof x === "string"))) : [],
      },
      missions: {
        dayKey: typeof missions.dayKey === "string" ? missions.dayKey : dayKey(),
        weekKey: typeof missions.weekKey === "string" ? missions.weekKey : weekKey(),
        progress: { ...zeroProgress(), ...(missions.progress ?? {}) },
        claimed: Array.isArray(missions.claimed) ? missions.claimed.filter((id): id is ProgressMissionId => [...DAILY_MISSIONS, ...WEEKLY_MISSIONS].some(m => m.id === id)) : [],
      },
    };
    if (parsed.equippedTitle && !parsed.unlockedTitles.includes(parsed.equippedTitle)) parsed.equippedTitle = null;
    return refreshProgressMissions(parsed);
  } catch {
    return structuredClone(DEFAULT_PROGRESSION);
  }
}

function add(progress: Record<ProgressMissionId, number>, id: ProgressMissionId, amount: number) {
  progress[id] = Math.max(0, Math.floor((progress[id] ?? 0) + amount));
}

function unlockAchievements(state: ProgressionState, summary: ProgressionMatchSummary) {
  const unlocked = new Set(state.achievements);
  const s = state.stats;
  if (s.matches >= 1) unlocked.add("FIRST_MATCH");
  if (s.wins >= 1) unlocked.add("FIRST_WIN");
  if (s.goalsFor >= 1) unlocked.add("FIRST_GOAL");
  if (summary.goalsFor >= 3) unlocked.add("HAT_TRICK");
  if (summary.goalsAgainst === 0) unlocked.add("CLEAN_SHEET");
  if (s.wins >= 10) unlocked.add("TEN_WINS");
  if (s.wins >= 50) unlocked.add("FIFTY_WINS");
  if (s.goalsFor >= 100) unlocked.add("HUNDRED_GOALS");
  if (s.goalsFor >= 500) unlocked.add("FIVE_HUNDRED_GOALS");
  if (summary.won && (summary.maxDeficit ?? 0) >= 2) unlocked.add("COMEBACK");
  if (summary.tournamentChampion) unlocked.add("WORLD_CHAMPION");
  if (summary.tournamentChampion && summary.tournamentUnbeaten) unlocked.add("UNBEATEN_CHAMPION");
  const achievements = [...unlocked];
  const unlockedTitles = Array.from(new Set([...state.unlockedTitles, ...ACHIEVEMENTS.filter(a => unlocked.has(a.id)).map(a => a.title)]));
  return { achievements, unlockedTitles };
}

export function applyProgressionMatch(stateInput: ProgressionState, summary: ProgressionMatchSummary) {
  let state = refreshProgressMissions(stateInput);
  if (!summary.played || summary.simulated) return { state, xpEarned: 0, newlyUnlocked: [] as AchievementId[] };

  const beforeAchievements = new Set(state.achievements);
  const stats = { ...state.stats, teamsUsed: [...state.stats.teamsUsed] };
  stats.matches += 1;
  if (summary.won) { stats.wins += 1; stats.currentWinStreak += 1; }
  else { stats.currentWinStreak = 0; if (summary.drew) stats.draws += 1; else stats.losses += 1; }
  stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.currentWinStreak);
  stats.goalsFor += Math.max(0, Math.floor(summary.goalsFor));
  stats.goalsAgainst += Math.max(0, Math.floor(summary.goalsAgainst));
  stats.completedPasses += Math.max(0, Math.floor(summary.completedPasses));
  if (summary.goalsAgainst === 0) stats.cleanSheets += 1;
  if (summary.tournamentChampion) stats.tournamentsWon += 1;
  stats.bestGoalsInMatch = Math.max(stats.bestGoalsInMatch, Math.max(0, Math.floor(summary.goalsFor)));
  if (summary.won) stats.biggestComeback = Math.max(stats.biggestComeback, Math.max(0, Math.floor(summary.maxDeficit ?? 0)));
  if (summary.teamId && !stats.teamsUsed.includes(summary.teamId)) stats.teamsUsed.push(summary.teamId);

  const progress = { ...state.missions.progress };
  add(progress, "D_PLAY_2", 1); add(progress, "W_PLAY_8", 1);
  add(progress, "D_SCORE_5", summary.goalsFor); add(progress, "W_SCORE_25", summary.goalsFor);
  add(progress, "D_PASSES_20", summary.completedPasses);
  if (summary.won) { add(progress, "D_WIN_1", 1); add(progress, "W_WIN_5", 1); }
  if (summary.goalsAgainst === 0) add(progress, "W_CLEAN_3", 1);
  progress.W_TEAMS_3 = stats.teamsUsed.length;

  let xpEarned = 40;
  if (summary.won) xpEarned += 30; else if (summary.drew) xpEarned += 10;
  if (summary.goalsFor >= 3) xpEarned += 15;
  if (summary.goalsAgainst === 0) xpEarned += 20;
  if (["Profesional", "Pro Mundial"].includes(summary.difficulty) && summary.won) xpEarned += 20;
  if (summary.tournamentChampion) xpEarned += 180;

  state = { ...state, totalXp: state.totalXp + xpEarned, stats, missions: { ...state.missions, progress } };
  const unlocked = unlockAchievements(state, summary);
  state = { ...state, ...unlocked };
  const newlyUnlocked = state.achievements.filter(id => !beforeAchievements.has(id));
  return { state, xpEarned, newlyUnlocked };
}

export function claimProgressMission(stateInput: ProgressionState, missionId: ProgressMissionId) {
  const state = refreshProgressMissions(stateInput);
  const mission = [...DAILY_MISSIONS, ...WEEKLY_MISSIONS].find(m => m.id === missionId);
  if (!mission || state.missions.claimed.includes(missionId) || (state.missions.progress[missionId] ?? 0) < mission.target) {
    return { ok: false as const, state, xp: 0, msc: 0 };
  }
  return {
    ok: true as const,
    xp: mission.xp,
    msc: mission.msc,
    state: { ...state, totalXp: state.totalXp + mission.xp, missions: { ...state.missions, claimed: [...state.missions.claimed, missionId] } },
  };
}

export function equipTitle(state: ProgressionState, title: string | null) {
  if (title !== null && !state.unlockedTitles.includes(title)) return state;
  return { ...state, equippedTitle: title };
}

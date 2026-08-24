export type EconomyLang = "es" | "en";

export type ResourceId = "AI_FIRST_GOAL" | "KEEPER_WALL" | "SECOND_CHANCE" | "ENDURANCE";
export type GemBoostId = "AUTO_WIN" | "THREE_GOAL_START";
export type MissionId = "PLAY_1" | "WIN_1" | "SCORE_3" | "PASS_12" | "CLEAN_SHEET" | "PLAY_3" | "WIN_HARD";

export type EconomyTeam = {
  id: string;
  name: string;
  short: string;
  region: string;
  color: string;
  accent: string;
  rating: number;
};

export type MatchBoostSelection = {
  resources: ResourceId[];
  gemBoost: GemBoostId | null;
};

export type MissionProgress = Record<MissionId, number>;

export type EconomyState = {
  version: 2;
  msc: number;
  gems: number;
  realWinStreakProgress: number;
  totalEarnedMsc: number;
  inventory: {
    kits: string[];
    resources: Record<ResourceId, number>;
  };
  equippedKitId: string | null;
  missionDay: string;
  missionProgress: MissionProgress;
  claimedMissions: MissionId[];
};

export type MatchEconomySummary = {
  played: boolean;
  simulated?: boolean;
  won: boolean;
  drew: boolean;
  goalsFor: number;
  goalsAgainst: number;
  completedPasses: number;
  difficulty: string;
  freeGoals?: number;
  tournamentChampion?: boolean;
};

export type MatchEconomyReward = {
  msc: number;
  gems: number;
  breakdown: string[];
};

export const RESOURCE_CATALOG: Array<{
  id: ResourceId;
  icon: string;
  price: number;
  name: [string, string];
  description: [string, string];
}> = [
  {
    id: "AI_FIRST_GOAL",
    icon: "⚡",
    price: 1500,
    name: ["Gol IA", "AI First Goal"],
    description: ["Empezás 1-0. El gol regalado no suma para misiones ni premios.", "Start 1-0. The free goal does not count for missions or rewards."],
  },
  {
    id: "KEEPER_WALL",
    icon: "🧤",
    price: 1000,
    name: ["Muro del arquero", "Keeper Wall"],
    description: ["La primera atajada que alcance tu arquero se convierte en una recepción segura.", "The first save your keeper reaches becomes a guaranteed catch."],
  },
  {
    id: "SECOND_CHANCE",
    icon: "🛡",
    price: 1200,
    name: ["Segunda oportunidad", "Second Chance"],
    description: ["Anula el primer gol rival del partido y se consume automáticamente.", "Cancels the opponent's first goal and is consumed automatically."],
  },
  {
    id: "ENDURANCE",
    icon: "💨",
    price: 750,
    name: ["Pulmón extra", "Extra Endurance"],
    description: ["El sprint consume 45% menos resistencia durante ese partido.", "Sprint drains 45% less stamina for that match."],
  },
];

export const GEM_BOOSTS: Array<{
  id: GemBoostId;
  icon: string;
  cost: number;
  name: [string, string];
  description: [string, string];
}> = [
  {
    id: "AUTO_WIN",
    icon: "◆",
    cost: 5,
    name: ["Victoria directa", "Instant Win"],
    description: ["Ganás 1-0 sin jugar. No entrega MSC, misiones ni progreso de gemas.", "Win 1-0 without playing. No MSC, missions or gem progress."],
  },
  {
    id: "THREE_GOAL_START",
    icon: "✦",
    cost: 5,
    name: ["Ventaja de 3 goles", "Three-Goal Head Start"],
    description: ["Jugás el partido empezando 3-0. Esos tres goles no cuentan para recompensas.", "Play the match starting 3-0. Those three goals do not count for rewards."],
  },
];

export const MISSION_CATALOG: Array<{
  id: MissionId;
  target: number;
  reward: number;
  icon: string;
  name: [string, string];
  description: [string, string];
}> = [
  { id: "PLAY_1", target: 1, reward: 180, icon: "▶", name: ["Entrá a la cancha", "Take the Field"], description: ["Terminá 1 partido jugado.", "Finish 1 played match."] },
  { id: "WIN_1", target: 1, reward: 250, icon: "✓", name: ["Primera victoria", "First Win"], description: ["Ganale un partido a la CPU.", "Beat the CPU once."] },
  { id: "SCORE_3", target: 3, reward: 220, icon: "⚽", name: ["Buscá el arco", "Find the Net"], description: ["Marcá 3 goles reales entre tus partidos.", "Score 3 real goals across your matches."] },
  { id: "PASS_12", target: 12, reward: 180, icon: "↗", name: ["Equipo conectado", "Connected Team"], description: ["Completá 12 pases.", "Complete 12 passes."] },
  { id: "CLEAN_SHEET", target: 1, reward: 300, icon: "🧤", name: ["Arco cerrado", "Clean Sheet"], description: ["Terminá un partido sin recibir goles.", "Finish a match without conceding."] },
  { id: "PLAY_3", target: 3, reward: 420, icon: "III", name: ["Sesión completa", "Full Session"], description: ["Terminá 3 partidos jugados.", "Finish 3 played matches."] },
  { id: "WIN_HARD", target: 1, reward: 450, icon: "★", name: ["Subí el nivel", "Raise the Level"], description: ["Ganale a Profesional o Pro Mundial.", "Win on Professional or World Class."] },
];

const EMPTY_PROGRESS = (): MissionProgress => ({
  PLAY_1: 0,
  WIN_1: 0,
  SCORE_3: 0,
  PASS_12: 0,
  CLEAN_SHEET: 0,
  PLAY_3: 0,
  WIN_HARD: 0,
});

export function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const DEFAULT_ECONOMY: EconomyState = {
  version: 2,
  msc: 500,
  gems: 0,
  realWinStreakProgress: 0,
  totalEarnedMsc: 500,
  inventory: {
    kits: [],
    resources: {
      AI_FIRST_GOAL: 0,
      KEEPER_WALL: 0,
      SECOND_CHANCE: 0,
      ENDURANCE: 0,
    },
  },
  equippedKitId: null,
  missionDay: localDayKey(),
  missionProgress: EMPTY_PROGRESS(),
  claimedMissions: [],
};

function normalizeNonNegative(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

export function refreshDailyMissions(state: EconomyState, now = new Date()): EconomyState {
  const day = localDayKey(now);
  if (state.missionDay === day) return state;
  return { ...state, missionDay: day, missionProgress: EMPTY_PROGRESS(), claimedMissions: [] };
}

export function parseEconomyState(raw: string | null): EconomyState {
  if (!raw) return { ...DEFAULT_ECONOMY, inventory: { kits: [], resources: { ...DEFAULT_ECONOMY.inventory.resources } }, missionProgress: EMPTY_PROGRESS(), claimedMissions: [] };
  try {
    const value = JSON.parse(raw) as Partial<EconomyState>;
    const inventory = value.inventory;
    const resources = inventory?.resources ?? ({} as Record<ResourceId, number>);
    const progress = value.missionProgress ?? ({} as MissionProgress);
    const parsed: EconomyState = {
      ...DEFAULT_ECONOMY,
      ...value,
      version: 2,
      msc: normalizeNonNegative(value.msc, DEFAULT_ECONOMY.msc),
      gems: normalizeNonNegative(value.gems, 0),
      realWinStreakProgress: normalizeNonNegative(value.realWinStreakProgress, 0) % 5,
      totalEarnedMsc: normalizeNonNegative(value.totalEarnedMsc, DEFAULT_ECONOMY.totalEarnedMsc),
      inventory: {
        kits: Array.isArray(inventory?.kits) ? Array.from(new Set(inventory.kits.filter((item): item is string => typeof item === "string"))) : [],
        resources: {
          AI_FIRST_GOAL: normalizeNonNegative(resources.AI_FIRST_GOAL),
          KEEPER_WALL: normalizeNonNegative(resources.KEEPER_WALL),
          SECOND_CHANCE: normalizeNonNegative(resources.SECOND_CHANCE),
          ENDURANCE: normalizeNonNegative(resources.ENDURANCE),
        },
      },
      equippedKitId: typeof value.equippedKitId === "string" ? value.equippedKitId : null,
      missionDay: typeof value.missionDay === "string" ? value.missionDay : localDayKey(),
      missionProgress: {
        PLAY_1: normalizeNonNegative(progress.PLAY_1),
        WIN_1: normalizeNonNegative(progress.WIN_1),
        SCORE_3: normalizeNonNegative(progress.SCORE_3),
        PASS_12: normalizeNonNegative(progress.PASS_12),
        CLEAN_SHEET: normalizeNonNegative(progress.CLEAN_SHEET),
        PLAY_3: normalizeNonNegative(progress.PLAY_3),
        WIN_HARD: normalizeNonNegative(progress.WIN_HARD),
      },
      claimedMissions: Array.isArray(value.claimedMissions) ? value.claimedMissions.filter((item): item is MissionId => MISSION_CATALOG.some(mission => mission.id === item)) : [],
    };
    return refreshDailyMissions(parsed);
  } catch {
    return parseEconomyState(null);
  }
}

export function kitPrice(rating: number) {
  if (rating >= 89) return 12000;
  if (rating >= 85) return 8000;
  return 5000;
}

export function nationalKitCatalog(teams: EconomyTeam[]) {
  return teams.filter(team => team.region === "Mundial").map(team => ({
    id: team.id,
    name: team.name,
    short: team.short,
    color: team.color,
    accent: team.accent,
    rating: team.rating,
    price: kitPrice(team.rating),
  })).sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
}

export function buyKit(state: EconomyState, kitId: string, price: number) {
  if (state.inventory.kits.includes(kitId)) return { state, ok: false as const, reason: "OWNED" as const };
  if (state.msc < price) return { state, ok: false as const, reason: "MSC" as const };
  return {
    ok: true as const,
    reason: null,
    state: { ...state, msc: state.msc - price, inventory: { ...state.inventory, kits: [...state.inventory.kits, kitId] } },
  };
}

export function equipKit(state: EconomyState, kitId: string | null) {
  if (kitId !== null && !state.inventory.kits.includes(kitId)) return state;
  return { ...state, equippedKitId: kitId };
}

export function buyResource(state: EconomyState, resourceId: ResourceId, quantity = 1) {
  const resource = RESOURCE_CATALOG.find(item => item.id === resourceId);
  if (!resource || quantity < 1) return { state, ok: false as const, reason: "INVALID" as const };
  const cost = resource.price * Math.floor(quantity);
  if (state.msc < cost) return { state, ok: false as const, reason: "MSC" as const };
  return {
    ok: true as const,
    reason: null,
    state: {
      ...state,
      msc: state.msc - cost,
      inventory: {
        ...state.inventory,
        resources: { ...state.inventory.resources, [resourceId]: state.inventory.resources[resourceId] + Math.floor(quantity) },
      },
    },
  };
}

export function canSelectResource(state: EconomyState, resourceId: ResourceId) {
  return state.inventory.resources[resourceId] > 0;
}

export function consumeMatchSelection(state: EconomyState, selection: MatchBoostSelection) {
  const unique = Array.from(new Set(selection.resources));
  for (const id of unique) if (state.inventory.resources[id] <= 0) return { ok: false as const, reason: "RESOURCE" as const, state };
  const gemCost = selection.gemBoost ? GEM_BOOSTS.find(item => item.id === selection.gemBoost)?.cost ?? Infinity : 0;
  if (state.gems < gemCost) return { ok: false as const, reason: "GEMS" as const, state };
  const resources = { ...state.inventory.resources };
  unique.forEach(id => { resources[id] -= 1; });
  return {
    ok: true as const,
    reason: null,
    state: { ...state, gems: state.gems - gemCost, inventory: { ...state.inventory, resources } },
  };
}

export function claimMission(stateInput: EconomyState, missionId: MissionId) {
  const state = refreshDailyMissions(stateInput);
  const mission = MISSION_CATALOG.find(item => item.id === missionId);
  if (!mission) return { state, ok: false as const };
  if (state.claimedMissions.includes(missionId)) return { state, ok: false as const };
  if ((state.missionProgress[missionId] ?? 0) < mission.target) return { state, ok: false as const };
  return {
    ok: true as const,
    state: {
      ...state,
      msc: state.msc + mission.reward,
      totalEarnedMsc: state.totalEarnedMsc + mission.reward,
      claimedMissions: [...state.claimedMissions, missionId],
    },
  };
}

function addMission(progress: MissionProgress, id: MissionId, amount: number) {
  progress[id] = Math.max(0, (progress[id] ?? 0) + amount);
}

export function applyMatchEconomy(stateInput: EconomyState, summary: MatchEconomySummary): { state: EconomyState; reward: MatchEconomyReward } {
  let state = refreshDailyMissions(stateInput);
  if (!summary.played || summary.simulated) return { state, reward: { msc: 0, gems: 0, breakdown: ["Sin recompensas por simulación"] } };

  const freeGoals = Math.max(0, Math.floor(summary.freeGoals ?? 0));
  const realGoals = Math.max(0, Math.floor(summary.goalsFor) - freeGoals);
  let msc = 120;
  const breakdown = ["Partido completado +120 MSC"];
  if (summary.won) { msc += 180; breakdown.push("Victoria +180 MSC"); }
  else if (summary.drew) { msc += 60; breakdown.push("Empate +60 MSC"); }
  const goalReward = Math.min(5, realGoals) * 15;
  if (goalReward) { msc += goalReward; breakdown.push(`Goles reales +${goalReward} MSC`); }
  if (summary.goalsAgainst === 0) { msc += 60; breakdown.push("Arco en cero +60 MSC"); }
  if (summary.difficulty === "Profesional") { msc += 40; breakdown.push("Profesional +40 MSC"); }
  if (summary.difficulty === "Pro Mundial") { msc += 80; breakdown.push("Pro Mundial +80 MSC"); }
  if (summary.tournamentChampion) { msc += 750; breakdown.push("Campeón +750 MSC"); }

  const missionProgress = { ...state.missionProgress };
  addMission(missionProgress, "PLAY_1", 1);
  addMission(missionProgress, "PLAY_3", 1);
  addMission(missionProgress, "SCORE_3", realGoals);
  addMission(missionProgress, "PASS_12", Math.max(0, Math.floor(summary.completedPasses)));
  if (summary.won) addMission(missionProgress, "WIN_1", 1);
  if (summary.goalsAgainst === 0) addMission(missionProgress, "CLEAN_SHEET", 1);
  if (summary.won && (summary.difficulty === "Profesional" || summary.difficulty === "Pro Mundial")) addMission(missionProgress, "WIN_HARD", 1);

  let gemReward = 0;
  let realWinStreakProgress = state.realWinStreakProgress;
  if (summary.won) {
    realWinStreakProgress += 1;
    if (realWinStreakProgress >= 5) {
      gemReward = 10;
      realWinStreakProgress -= 5;
      breakdown.push("5 victorias jugadas +10 gemas");
    }
  }

  state = {
    ...state,
    msc: state.msc + msc,
    gems: state.gems + gemReward,
    realWinStreakProgress,
    totalEarnedMsc: state.totalEarnedMsc + msc,
    missionProgress,
  };
  return { state, reward: { msc, gems: gemReward, breakdown } };
}

export const EMPTY_MATCH_BOOSTS: MatchBoostSelection = { resources: [], gemBoost: null };

export function freeGoalsFromSelection(selection: MatchBoostSelection) {
  if (selection.gemBoost === "THREE_GOAL_START") return 3;
  if (selection.resources.includes("AI_FIRST_GOAL")) return 1;
  return 0;
}

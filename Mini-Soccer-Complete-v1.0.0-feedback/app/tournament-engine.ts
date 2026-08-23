export type TournamentKind = "Champions" | "Libertadores" | "Mundial" | "Europa League";
export type MatchFormat = 4 | 5 | 6;
export type TournamentStage = "GROUPS" | "ROUND_OF_16" | "QUARTERFINALS" | "SEMIFINALS" | "FINAL" | "CHAMPION" | "ELIMINATED";
export type FixtureStatus = "SCHEDULED" | "PLAYED";

export type TournamentPlayer = { name: string; rating: number; role: string };
export type TournamentTeam = { id: string; name: string; short: string; rating: number; players: TournamentPlayer[] };
export type TournamentGroup = { id: string; name: string; teamIds: string[] };
export type TournamentFixture = {
  id: string;
  stage: TournamentStage;
  matchday: number;
  groupId: string | null;
  homeTeamId: string;
  awayTeamId: string;
  status: FixtureStatus;
  homeGoals: number | null;
  awayGoals: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  winnerTeamId: string | null;
};
export type TournamentPlayerStat = {
  teamId: string;
  playerName: string;
  matches: number;
  goals: number;
  assists: number;
  saves: number;
  cleanSheets: number;
  ratingTotal: number;
};
export type TournamentNews = { id: string; title: string; detail: string; matchday: number };
export type TournamentState = {
  version: 3;
  tournamentType: TournamentKind;
  tournamentFormat: "GROUPS_KNOCKOUT";
  selectedTeamId: string;
  matchFormat: MatchFormat;
  difficulty: "Fácil" | "Normal" | "Medio" | "Profesional" | "Pro Mundial";
  durationMinutes: 3 | 5 | 8;
  passAssistance: "ASSISTED" | "SEMI" | "MANUAL";
  allowFormatChange: boolean;
  currentStage: TournamentStage;
  currentMatchday: number;
  groups: TournamentGroup[];
  fixtures: TournamentFixture[];
  qualifiedTeamIds: string[];
  playerStats: Record<string, TournamentPlayerStat>;
  championTeamId: string | null;
  news: TournamentNews[];
  createdAt: string;
  lastSavedAt: string;
  revision: number;
};

export type Standing = {
  teamId: string;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export const FEATURE_FLAGS = {
  newTournamentSystem: true,
  profileV2: true,
  newMatchPresentation: true,
  newStatisticsSystem: true,
  replaySystem: true,
  dynamicNews: true,
} as const;

const KNOCKOUT_STAGES: TournamentStage[] = ["ROUND_OF_16", "QUARTERFINALS", "SEMIFINALS", "FINAL"];

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const seededRandom = (seed: string) => {
  let state = hashString(seed) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
};

const poisson = (lambda: number, random: () => number) => {
  const limit = Math.exp(-lambda);
  let product = 1;
  let value = 0;
  do {
    value += 1;
    product *= random();
  } while (product > limit && value < 7);
  return Math.min(6, value - 1);
};

const participantCountFor = (teamCount: number) => {
  if (teamCount >= 32) return 32;
  if (teamCount >= 16) return 16;
  if (teamCount >= 8) return 8;
  return Math.max(4, Math.floor(teamCount / 4) * 4);
};

const selectParticipants = (teams: TournamentTeam[], selectedTeamId: string) => {
  const selected = teams.find((team) => team.id === selectedTeamId);
  if (!selected) throw new Error("El equipo elegido no pertenece a esta competición");
  const count = participantCountFor(teams.length);
  if (count < 4) throw new Error("La competición necesita al menos cuatro equipos elegibles");
  const rest = teams.filter((team) => team.id !== selectedTeamId).sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id));
  return [selected, ...rest].slice(0, count);
};

const buildGroups = (participants: TournamentTeam[]): TournamentGroup[] => {
  const groupCount = Math.max(1, participants.length / 4);
  const groups = Array.from({ length: groupCount }, (_, index) => ({
    id: `GROUP_${String.fromCharCode(65 + index)}`,
    name: String.fromCharCode(65 + index),
    teamIds: [] as string[],
  }));
  participants.forEach((team, index) => {
    const pot = Math.floor(index / groupCount);
    const withinPot = index % groupCount;
    const groupIndex = pot % 2 === 0 ? withinPot : groupCount - 1 - withinPot;
    groups[groupIndex].teamIds.push(team.id);
  });
  return groups;
};

const groupFixtures = (group: TournamentGroup): TournamentFixture[] => {
  const rotation: Array<string | null> = [...group.teamIds];
  if (rotation.length % 2) rotation.push(null);
  const rounds = rotation.length - 1;
  const fixtures: TournamentFixture[] = [];
  for (let round = 0; round < rounds; round += 1) {
    for (let pair = 0; pair < rotation.length / 2; pair += 1) {
      const first = rotation[pair];
      const second = rotation[rotation.length - 1 - pair];
      if (!first || !second) continue;
      const flip = (round + pair) % 2 === 1;
      fixtures.push({
        id: `${group.id}-MD${round + 1}-${pair + 1}`,
        stage: "GROUPS",
        matchday: round + 1,
        groupId: group.id,
        homeTeamId: flip ? second : first,
        awayTeamId: flip ? first : second,
        status: "SCHEDULED",
        homeGoals: null,
        awayGoals: null,
        homePenalties: null,
        awayPenalties: null,
        winnerTeamId: null,
      });
    }
    const fixed = rotation[0];
    const tail = rotation.slice(1);
    tail.unshift(tail.pop() ?? null);
    rotation.splice(0, rotation.length, fixed, ...tail);
  }
  return fixtures;
};

export function createTournamentState(input: {
  tournamentType: TournamentKind;
  teams: TournamentTeam[];
  selectedTeamId: string;
  matchFormat: MatchFormat;
  difficulty?: TournamentState["difficulty"];
  durationMinutes?: TournamentState["durationMinutes"];
  passAssistance?: TournamentState["passAssistance"];
  allowFormatChange?: boolean;
}): TournamentState {
  const participants = selectParticipants(input.teams, input.selectedTeamId);
  const groups = buildGroups(participants);
  const now = new Date().toISOString();
  return {
    version: 3,
    tournamentType: input.tournamentType,
    tournamentFormat: "GROUPS_KNOCKOUT",
    selectedTeamId: input.selectedTeamId,
    matchFormat: input.matchFormat,
    difficulty: input.difficulty ?? "Medio",
    durationMinutes: input.durationMinutes ?? 5,
    passAssistance: input.passAssistance ?? "ASSISTED",
    allowFormatChange: input.allowFormatChange ?? false,
    currentStage: "GROUPS",
    currentMatchday: 1,
    groups,
    fixtures: groups.flatMap(groupFixtures),
    qualifiedTeamIds: [],
    playerStats: {},
    championTeamId: null,
    news: [],
    createdAt: now,
    lastSavedAt: now,
    revision: 0,
  };
}

export function standingsForGroup(state: TournamentState, groupId: string): Standing[] {
  const group = state.groups.find((entry) => entry.id === groupId);
  if (!group) return [];
  const table = new Map(group.teamIds.map((teamId, seed) => [teamId, {
    teamId,
    seed,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  }]));
  state.fixtures.filter((fixture) => fixture.groupId === groupId && fixture.status === "PLAYED").forEach((fixture) => {
    const home = table.get(fixture.homeTeamId);
    const away = table.get(fixture.awayTeamId);
    if (!home || !away || fixture.homeGoals === null || fixture.awayGoals === null) return;
    home.played += 1;
    away.played += 1;
    home.goalsFor += fixture.homeGoals;
    home.goalsAgainst += fixture.awayGoals;
    away.goalsFor += fixture.awayGoals;
    away.goalsAgainst += fixture.homeGoals;
    if (fixture.homeGoals > fixture.awayGoals) {
      home.wins += 1;
      away.losses += 1;
      home.points += 3;
    } else if (fixture.homeGoals < fixture.awayGoals) {
      away.wins += 1;
      home.losses += 1;
      away.points += 3;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  });
  return [...table.values()]
    .sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor || a.seed - b.seed)
    .map((entry, index) => ({
      teamId: entry.teamId,
      position: index + 1,
      played: entry.played,
      wins: entry.wins,
      draws: entry.draws,
      losses: entry.losses,
      goalsFor: entry.goalsFor,
      goalsAgainst: entry.goalsAgainst,
      goalDifference: entry.goalsFor - entry.goalsAgainst,
      points: entry.points,
    }));
}

export const allStandings = (state: TournamentState) => state.groups.map((group) => ({ group, standings: standingsForGroup(state, group.id) }));

export const stageLabel = (stage: TournamentStage, lang: "es" | "en" = "es") => {
  const labels: Record<TournamentStage, [string, string]> = {
    GROUPS: ["Fase de grupos", "Group stage"],
    ROUND_OF_16: ["Octavos", "Round of 16"],
    QUARTERFINALS: ["Cuartos", "Quarterfinals"],
    SEMIFINALS: ["Semifinal", "Semifinal"],
    FINAL: ["Final", "Final"],
    CHAMPION: ["Campeón", "Champion"],
    ELIMINATED: ["Eliminado", "Eliminated"],
  };
  return labels[stage][lang === "es" ? 0 : 1];
};

export const tournamentProgressStages = (state: TournamentState): TournamentStage[] => {
  const qualifiedCount = state.groups.length * 2;
  const knockout = qualifiedCount >= 16
    ? ["ROUND_OF_16", "QUARTERFINALS", "SEMIFINALS", "FINAL"]
    : qualifiedCount >= 8
      ? ["QUARTERFINALS", "SEMIFINALS", "FINAL"]
      : qualifiedCount >= 4 ? ["SEMIFINALS", "FINAL"] : ["FINAL"];
  return ["GROUPS", ...knockout] as TournamentStage[];
};

export const hasPlayedFixtures = (state: TournamentState) => state.fixtures.some((fixture) => fixture.status === "PLAYED");

export function currentUserFixture(state: TournamentState) {
  return state.fixtures.find((fixture) => fixture.status === "SCHEDULED"
    && fixture.stage === state.currentStage
    && fixture.matchday === state.currentMatchday
    && (fixture.homeTeamId === state.selectedTeamId || fixture.awayTeamId === state.selectedTeamId)) ?? null;
}

const sampleScore = (fixture: TournamentFixture, home: TournamentTeam, away: TournamentTeam) => {
  const random = seededRandom(`${fixture.id}:${home.rating}:${away.rating}`);
  const advantage = Math.max(-1.2, Math.min(1.2, (home.rating - away.rating) / 12));
  const homeExpected = Math.max(0.35, Math.min(3.2, 1.35 + advantage * 0.62 + 0.12));
  const awayExpected = Math.max(0.35, Math.min(3.2, 1.25 - advantage * 0.62));
  return [poisson(homeExpected, random), poisson(awayExpected, random)] as [number, number];
};

const knockoutWinner = (fixture: TournamentFixture, home: TournamentTeam, away: TournamentTeam) => {
  const random = seededRandom(`${fixture.id}:penalties`)();
  const homeChance = Math.max(0.25, Math.min(0.75, 0.5 + (home.rating - away.rating) / 70));
  const homeWins = random < homeChance;
  return { winnerTeamId: homeWins ? home.id : away.id, homePenalties: homeWins ? 5 : 4, awayPenalties: homeWins ? 4 : 5 };
};

const statKey = (teamId: string, playerName: string) => `${teamId}::${playerName}`;

const updatePlayerStats = (state: TournamentState, fixture: TournamentFixture, teams: TournamentTeam[], supplied?: { homeScorers?: string[]; awayScorers?: string[] }) => {
  const nextStats = { ...state.playerStats };
  const applyTeam = (teamId: string, goals: number, conceded: number, suppliedScorers: string[] = []) => {
    const team = teams.find((entry) => entry.id === teamId);
    if (!team) return;
    const outfield = team.players.filter((player) => player.role !== "ARQ").sort((a, b) => b.rating - a.rating).slice(0, 5);
    const keeper = team.players.find((player) => player.role === "ARQ");
    const participants = [...outfield.slice(0, 5), ...(keeper ? [keeper] : [])];
    participants.forEach((player) => {
      const key = statKey(teamId, player.name);
      const current = nextStats[key] ?? { teamId, playerName: player.name, matches: 0, goals: 0, assists: 0, saves: 0, cleanSheets: 0, ratingTotal: 0 };
      nextStats[key] = { ...current, matches: current.matches + 1, ratingTotal: current.ratingTotal + 6.4 + Math.max(-0.8, goals * 0.28 - conceded * 0.18) };
    });
    for (let goal = 0; goal < goals; goal += 1) {
      const namedScorer = suppliedScorers[goal];
      const scorer = outfield.find((player) => player.name === namedScorer) ?? outfield[hashString(`${fixture.id}:${teamId}:goal:${goal}`) % Math.max(1, outfield.length)];
      if (!scorer) continue;
      const key = statKey(teamId, scorer.name);
      nextStats[key] = { ...nextStats[key], goals: nextStats[key].goals + 1, ratingTotal: nextStats[key].ratingTotal + 0.72 };
      if (outfield.length > 1) {
        const assister = outfield[(outfield.indexOf(scorer) + 1 + goal) % outfield.length];
        const assistKey = statKey(teamId, assister.name);
        nextStats[assistKey] = { ...nextStats[assistKey], assists: nextStats[assistKey].assists + (goal % 3 === 2 ? 0 : 1), ratingTotal: nextStats[assistKey].ratingTotal + (goal % 3 === 2 ? 0 : 0.34) };
      }
    }
    if (keeper) {
      const key = statKey(teamId, keeper.name);
      const saves = Math.max(0, 2 + conceded - goals);
      nextStats[key] = { ...nextStats[key], saves: nextStats[key].saves + saves, cleanSheets: nextStats[key].cleanSheets + (conceded === 0 ? 1 : 0), ratingTotal: nextStats[key].ratingTotal + saves * 0.08 };
    }
  };
  applyTeam(fixture.homeTeamId, fixture.homeGoals ?? 0, fixture.awayGoals ?? 0, supplied?.homeScorers);
  applyTeam(fixture.awayTeamId, fixture.awayGoals ?? 0, fixture.homeGoals ?? 0, supplied?.awayScorers);
  return nextStats;
};

const createNews = (state: TournamentState, fixture: TournamentFixture, teams: TournamentTeam[]) => {
  if (fixture.homeGoals === null || fixture.awayGoals === null || fixture.homeGoals === fixture.awayGoals) return state.news;
  const home = teams.find((team) => team.id === fixture.homeTeamId);
  const away = teams.find((team) => team.id === fixture.awayTeamId);
  if (!home || !away) return state.news;
  const winner = fixture.homeGoals > fixture.awayGoals ? home : away;
  const loser = winner.id === home.id ? away : home;
  const surprise = loser.rating - winner.rating >= 4;
  const selectedWin = winner.id === state.selectedTeamId;
  if (!surprise && !selectedWin) return state.news;
  const item: TournamentNews = {
    id: `NEWS-${fixture.id}`,
    title: surprise ? "SORPRESA DEL TORNEO" : `${winner.short} DA OTRO PASO`,
    detail: `${winner.name} ${winner.id === fixture.homeTeamId ? fixture.homeGoals : fixture.awayGoals}–${winner.id === fixture.homeTeamId ? fixture.awayGoals : fixture.homeGoals} ${loser.name}`,
    matchday: state.currentMatchday,
  };
  return [item, ...state.news.filter((news) => news.id !== item.id)].slice(0, 8);
};

export function recordFixtureResult(
  state: TournamentState,
  fixtureId: string,
  result: { homeGoals: number; awayGoals: number; tieBreakWinnerId?: string; homeScorers?: string[]; awayScorers?: string[] },
  teams: TournamentTeam[],
): TournamentState {
  const fixture = state.fixtures.find((entry) => entry.id === fixtureId);
  if (!fixture) throw new Error("Fixture inexistente");
  if (fixture.status !== "SCHEDULED") throw new Error("El fixture ya fue disputado");
  if (result.homeGoals < 0 || result.awayGoals < 0) throw new Error("Resultado inválido");
  const isKnockout = fixture.stage !== "GROUPS";
  if (isKnockout && result.homeGoals === result.awayGoals && !result.tieBreakWinnerId) throw new Error("Una eliminatoria empatada necesita un ganador");
  const winnerTeamId = result.homeGoals === result.awayGoals
    ? result.tieBreakWinnerId ?? null
    : result.homeGoals > result.awayGoals ? fixture.homeTeamId : fixture.awayTeamId;
  const played: TournamentFixture = {
    ...fixture,
    status: "PLAYED",
    homeGoals: Math.floor(result.homeGoals),
    awayGoals: Math.floor(result.awayGoals),
    homePenalties: result.homeGoals === result.awayGoals ? (winnerTeamId === fixture.homeTeamId ? 5 : 4) : null,
    awayPenalties: result.homeGoals === result.awayGoals ? (winnerTeamId === fixture.awayTeamId ? 5 : 4) : null,
    winnerTeamId,
  };
  const next = {
    ...state,
    fixtures: state.fixtures.map((entry) => entry.id === fixtureId ? played : entry),
    lastSavedAt: new Date().toISOString(),
    revision: state.revision + 1,
  };
  return { ...next, playerStats: updatePlayerStats(next, played, teams, result), news: createNews(next, played, teams) };
}

export function simulateFixture(state: TournamentState, fixtureId: string, teams: TournamentTeam[]) {
  const fixture = state.fixtures.find((entry) => entry.id === fixtureId);
  if (!fixture || fixture.status === "PLAYED") return state;
  const home = teams.find((team) => team.id === fixture.homeTeamId);
  const away = teams.find((team) => team.id === fixture.awayTeamId);
  if (!home || !away) throw new Error("Fixture con equipo no elegible");
  const [homeGoals, awayGoals] = sampleScore(fixture, home, away);
  if (fixture.stage !== "GROUPS" && homeGoals === awayGoals) {
    const penalties = knockoutWinner(fixture, home, away);
    return recordFixtureResult(state, fixtureId, { homeGoals, awayGoals, tieBreakWinnerId: penalties.winnerTeamId }, teams);
  }
  return recordFixtureResult(state, fixtureId, { homeGoals, awayGoals }, teams);
}

const knockoutStageFor = (teamCount: number): TournamentStage => {
  if (teamCount >= 16) return "ROUND_OF_16";
  if (teamCount >= 8) return "QUARTERFINALS";
  if (teamCount >= 4) return "SEMIFINALS";
  return "FINAL";
};

const buildKnockoutFixtures = (teamIds: string[], stage: TournamentStage): TournamentFixture[] => {
  const pairs: Array<[string, string]> = [];
  for (let index = 0; index < teamIds.length / 2; index += 1) pairs.push([teamIds[index], teamIds[teamIds.length - 1 - index]]);
  return pairs.map(([homeTeamId, awayTeamId], index) => ({
    id: `${stage}-${index + 1}`,
    stage,
    matchday: 1,
    groupId: null,
    homeTeamId,
    awayTeamId,
    status: "SCHEDULED",
    homeGoals: null,
    awayGoals: null,
    homePenalties: null,
    awayPenalties: null,
    winnerTeamId: null,
  }));
};

const qualifiedFromGroups = (state: TournamentState) => state.groups.flatMap((group) => standingsForGroup(state, group.id).slice(0, 2).map((entry) => entry.teamId));

export function advanceTournament(state: TournamentState): TournamentState {
  const stepFixtures = state.fixtures.filter((fixture) => fixture.stage === state.currentStage && fixture.matchday === state.currentMatchday);
  if (!stepFixtures.length || stepFixtures.some((fixture) => fixture.status !== "PLAYED")) return state;
  if (state.currentStage === "GROUPS") {
    const lastMatchday = Math.max(...state.fixtures.filter((fixture) => fixture.stage === "GROUPS").map((fixture) => fixture.matchday));
    if (state.currentMatchday < lastMatchday) return { ...state, currentMatchday: state.currentMatchday + 1, revision: state.revision + 1 };
    const qualifiedTeamIds = qualifiedFromGroups(state);
    if (!qualifiedTeamIds.includes(state.selectedTeamId)) return { ...state, currentStage: "ELIMINATED", qualifiedTeamIds, revision: state.revision + 1 };
    const stage = knockoutStageFor(qualifiedTeamIds.length);
    return {
      ...state,
      currentStage: stage,
      currentMatchday: 1,
      qualifiedTeamIds,
      fixtures: [...state.fixtures, ...buildKnockoutFixtures(qualifiedTeamIds, stage)],
      revision: state.revision + 1,
    };
  }
  if (!KNOCKOUT_STAGES.includes(state.currentStage)) return state;
  const winners = stepFixtures.map((fixture) => fixture.winnerTeamId).filter((teamId): teamId is string => Boolean(teamId));
  if (!winners.includes(state.selectedTeamId)) return { ...state, currentStage: "ELIMINATED", revision: state.revision + 1 };
  if (winners.length === 1) return { ...state, currentStage: "CHAMPION", championTeamId: winners[0], revision: state.revision + 1 };
  const nextStage = knockoutStageFor(winners.length);
  return {
    ...state,
    currentStage: nextStage,
    currentMatchday: 1,
    fixtures: [...state.fixtures, ...buildKnockoutFixtures(winners, nextStage)],
    revision: state.revision + 1,
  };
}

export function completeCurrentStep(state: TournamentState, teams: TournamentTeam[]) {
  let next = state;
  const current = next.fixtures.filter((fixture) => fixture.stage === next.currentStage && fixture.matchday === next.currentMatchday);
  const userPending = current.some((fixture) => fixture.status === "SCHEDULED" && (fixture.homeTeamId === next.selectedTeamId || fixture.awayTeamId === next.selectedTeamId));
  for (const fixture of current) {
    if (fixture.status === "PLAYED") continue;
    if (fixture.homeTeamId === next.selectedTeamId || fixture.awayTeamId === next.selectedTeamId) continue;
    next = simulateFixture(next, fixture.id, teams);
  }
  return userPending ? next : advanceTournament(next);
}

export function completeUserFixture(
  state: TournamentState,
  scoreForSelected: [number, number],
  teams: TournamentTeam[],
  scorers?: { selected: string[]; opponent: string[] },
) {
  const fixture = currentUserFixture(state);
  if (!fixture) return { state, accepted: false, requiresReplay: false };
  const [selectedGoals, opponentGoals] = scoreForSelected;
  if (fixture.stage !== "GROUPS" && selectedGoals === opponentGoals) return { state, accepted: false, requiresReplay: true };
  const selectedIsHome = fixture.homeTeamId === state.selectedTeamId;
  let next = recordFixtureResult(state, fixture.id, {
    homeGoals: selectedIsHome ? selectedGoals : opponentGoals,
    awayGoals: selectedIsHome ? opponentGoals : selectedGoals,
    homeScorers: selectedIsHome ? scorers?.selected : scorers?.opponent,
    awayScorers: selectedIsHome ? scorers?.opponent : scorers?.selected,
  }, teams);
  next = completeCurrentStep(next, teams);
  return { state: next, accepted: true, requiresReplay: false };
}

export function topScorers(state: TournamentState, limit = 8) {
  return Object.values(state.playerStats)
    .filter((stat) => stat.goals > 0)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || (b.ratingTotal / Math.max(1, b.matches)) - (a.ratingTotal / Math.max(1, a.matches)))
    .slice(0, limit);
}

export function topAssists(state: TournamentState, limit = 8) {
  return Object.values(state.playerStats)
    .filter((stat) => stat.assists > 0)
    .sort((a, b) => b.assists - a.assists || b.goals - a.goals || (b.ratingTotal / Math.max(1, b.matches)) - (a.ratingTotal / Math.max(1, a.matches)))
    .slice(0, limit);
}

export function topRated(state: TournamentState, limit = 8) {
  return Object.values(state.playerStats)
    .filter((stat) => stat.matches > 0)
    .sort((a, b) => (b.ratingTotal / b.matches) - (a.ratingTotal / a.matches) || b.goals - a.goals)
    .slice(0, limit);
}

export function topKeepers(state: TournamentState, limit = 8) {
  return Object.values(state.playerStats)
    .filter((stat) => stat.saves > 0 || stat.cleanSheets > 0)
    .sort((a, b) => b.cleanSheets - a.cleanSheets || b.saves - a.saves || (b.ratingTotal / Math.max(1, b.matches)) - (a.ratingTotal / Math.max(1, a.matches)))
    .slice(0, limit);
}

export function topSaves(state: TournamentState, limit = 8) {
  return Object.values(state.playerStats)
    .filter((stat) => stat.saves > 0)
    .sort((a, b) => b.saves - a.saves || b.cleanSheets - a.cleanSheets || (b.ratingTotal / Math.max(1, b.matches)) - (a.ratingTotal / Math.max(1, a.matches)))
    .slice(0, limit);
}

export function topCleanSheets(state: TournamentState, limit = 8) {
  return Object.values(state.playerStats)
    .filter((stat) => stat.cleanSheets > 0)
    .sort((a, b) => b.cleanSheets - a.cleanSheets || b.saves - a.saves || (b.ratingTotal / Math.max(1, b.matches)) - (a.ratingTotal / Math.max(1, a.matches)))
    .slice(0, limit);
}

export function tournamentAwards(state: TournamentState) {
  const scorer = topScorers(state, 1)[0] ?? null;
  const player = topRated(state, 1)[0] ?? null;
  const keeper = topKeepers(state, 1)[0] ?? null;
  return { scorer, player, keeper, teamOfTournament: topRated(state, Math.min(6, state.matchFormat)) };
}

export function tournamentTeamSummary(state: TournamentState, teamId: string) {
  const fixtures = state.fixtures.filter((fixture) => fixture.status === "PLAYED" && (fixture.homeTeamId === teamId || fixture.awayTeamId === teamId));
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  fixtures.forEach((fixture) => {
    const home = fixture.homeTeamId === teamId;
    const scored = home ? fixture.homeGoals ?? 0 : fixture.awayGoals ?? 0;
    const conceded = home ? fixture.awayGoals ?? 0 : fixture.homeGoals ?? 0;
    goalsFor += scored;
    goalsAgainst += conceded;
    if (scored > conceded || (scored === conceded && fixture.winnerTeamId === teamId)) wins += 1;
    else if (scored === conceded) draws += 1;
    else losses += 1;
  });
  const final = [...fixtures].reverse().find((fixture) => fixture.stage === "FINAL") ?? null;
  const finalOpponentId = final ? (final.homeTeamId === teamId ? final.awayTeamId : final.homeTeamId) : null;
  const finalScore = final ? `${final.homeTeamId === teamId ? final.homeGoals : final.awayGoals}–${final.homeTeamId === teamId ? final.awayGoals : final.homeGoals}` : null;
  return { matches: fixtures.length, wins, draws, losses, goalsFor, goalsAgainst, finalOpponentId, finalScore };
}

export const totalGoalsFromResults = (state: TournamentState) => state.fixtures.reduce((total, fixture) => total + (fixture.homeGoals ?? 0) + (fixture.awayGoals ?? 0), 0);
export const totalGoalsFromPlayerStats = (state: TournamentState) => Object.values(state.playerStats).reduce((total, stat) => total + stat.goals, 0);

export function parseTournamentState(raw: string | null, validTeamIds: Set<string>): TournamentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as TournamentState;
    if (parsed.version !== 3 || !parsed.tournamentType || !Array.isArray(parsed.groups) || !Array.isArray(parsed.fixtures)) return null;
    if (!validTeamIds.has(parsed.selectedTeamId)) return null;
    const ids = new Set<string>();
    for (const fixture of parsed.fixtures) {
      if (ids.has(fixture.id) || !validTeamIds.has(fixture.homeTeamId) || !validTeamIds.has(fixture.awayTeamId)) return null;
      if (fixture.status !== "SCHEDULED" && fixture.status !== "PLAYED") return null;
      ids.add(fixture.id);
    }
    const normalizedStats = Object.fromEntries(Object.entries(parsed.playerStats ?? {}).map(([key, stat]) => [key, { ...stat, cleanSheets: Number(stat.cleanSheets ?? 0) }]));
    return {
      ...parsed,
      difficulty: parsed.difficulty ?? "Medio",
      durationMinutes: parsed.durationMinutes ?? 5,
      passAssistance: parsed.passAssistance ?? "ASSISTED",
      createdAt: parsed.createdAt ?? new Date(0).toISOString(),
      lastSavedAt: parsed.lastSavedAt ?? new Date(0).toISOString(),
      playerStats: normalizedStats,
    };
  } catch {
    return null;
  }
}

export const serializeTournamentState = (state: TournamentState) => JSON.stringify(state);

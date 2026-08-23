import type { TournamentKind, TournamentStage } from "./tournament-engine";

export type CompetitionTheme = {
  id: TournamentKind;
  shortName: string;
  eyebrow: string;
  description: string;
  trophy: string;
  color: string;
  accent: string;
  surface: string;
  stages: Array<{ key: string; label: string; labelEn: string; engineStage?: TournamentStage }>;
};

export const COMPETITION_THEMES: Record<TournamentKind, CompetitionTheme> = {
  Mundial: {
    id: "Mundial",
    shortName: "MUNDIAL 2026",
    eyebrow: "NACIONES · AZUL Y ORO",
    description: "La ruta internacional desde los grupos hasta la final.",
    trophy: "◉",
    color: "#0b3b74",
    accent: "#f6c453",
    surface: "#071b32",
    stages: [
      { key: "GROUPS", label: "Grupos", labelEn: "Groups", engineStage: "GROUPS" },
      { key: "ROUND_OF_32", label: "Dieciseisavos", labelEn: "Round of 32" },
      { key: "ROUND_OF_16", label: "Octavos", labelEn: "Round of 16", engineStage: "ROUND_OF_16" },
      { key: "QUARTERFINALS", label: "Cuartos", labelEn: "Quarterfinals", engineStage: "QUARTERFINALS" },
      { key: "SEMIFINALS", label: "Semifinal", labelEn: "Semifinal", engineStage: "SEMIFINALS" },
      { key: "FINAL", label: "Final", labelEn: "Final", engineStage: "FINAL" },
    ],
  },
  Champions: {
    id: "Champions",
    shortName: "CHAMPIONS",
    eyebrow: "NOCHE EUROPEA · PLATA",
    description: "Fase liga, playoff y noches decisivas por la copa.",
    trophy: "✦",
    color: "#101a48",
    accent: "#dbe5ff",
    surface: "#070b20",
    stages: [
      { key: "LEAGUE", label: "Fase liga", labelEn: "League phase", engineStage: "GROUPS" },
      { key: "PLAYOFF", label: "Playoff", labelEn: "Playoff" },
      { key: "ROUND_OF_16", label: "Octavos", labelEn: "Round of 16", engineStage: "ROUND_OF_16" },
      { key: "QUARTERFINALS", label: "Cuartos", labelEn: "Quarterfinals", engineStage: "QUARTERFINALS" },
      { key: "SEMIFINALS", label: "Semifinal", labelEn: "Semifinal", engineStage: "SEMIFINALS" },
      { key: "FINAL", label: "Final", labelEn: "Final", engineStage: "FINAL" },
    ],
  },
  Libertadores: {
    id: "Libertadores",
    shortName: "LIBERTADORES",
    eyebrow: "SUDAMÉRICA · ORO Y NEGRO",
    description: "Grupos, eliminatorias y una final por la gloria eterna.",
    trophy: "◆",
    color: "#161616",
    accent: "#d7aa42",
    surface: "#090909",
    stages: [
      { key: "GROUPS", label: "Grupos", labelEn: "Groups", engineStage: "GROUPS" },
      { key: "ROUND_OF_16", label: "Octavos", labelEn: "Round of 16", engineStage: "ROUND_OF_16" },
      { key: "QUARTERFINALS", label: "Cuartos", labelEn: "Quarterfinals", engineStage: "QUARTERFINALS" },
      { key: "SEMIFINALS", label: "Semifinal", labelEn: "Semifinal", engineStage: "SEMIFINALS" },
      { key: "FINAL", label: "Final", labelEn: "Final", engineStage: "FINAL" },
    ],
  },
  "Europa League": {
    id: "Europa League",
    shortName: "EUROPA LEAGUE",
    eyebrow: "EUROPA · ÁMBAR Y NEGRO",
    description: "Una campaña propia, intensa y distinta a la Champions.",
    trophy: "◈",
    color: "#2b1a08",
    accent: "#f59e0b",
    surface: "#120b05",
    stages: [
      { key: "LEAGUE", label: "Fase liga", labelEn: "League phase", engineStage: "GROUPS" },
      { key: "PLAYOFF", label: "Playoff", labelEn: "Playoff" },
      { key: "ROUND_OF_16", label: "Octavos", labelEn: "Round of 16", engineStage: "ROUND_OF_16" },
      { key: "QUARTERFINALS", label: "Cuartos", labelEn: "Quarterfinals", engineStage: "QUARTERFINALS" },
      { key: "SEMIFINALS", label: "Semifinal", labelEn: "Semifinal", engineStage: "SEMIFINALS" },
      { key: "FINAL", label: "Final", labelEn: "Final", engineStage: "FINAL" },
    ],
  },
};

export function competitionStageIndex(kind: TournamentKind, stage: TournamentStage) {
  const stages = COMPETITION_THEMES[kind].stages;
  if (stage === "CHAMPION") return stages.length;
  if (stage === "ELIMINATED") return Math.max(0, stages.findIndex((entry) => entry.engineStage === "FINAL"));
  const exact = stages.findIndex((entry) => entry.engineStage === stage);
  return exact >= 0 ? exact : 0;
}

export function competitionStageLabel(kind: TournamentKind, stage: TournamentStage, lang: "es" | "en" = "es") {
  if (stage === "CHAMPION") return lang === "es" ? "Campeón" : "Champion";
  if (stage === "ELIMINATED") return lang === "es" ? "Eliminado" : "Eliminated";
  const item = COMPETITION_THEMES[kind].stages.find((entry) => entry.engineStage === stage);
  return item ? (lang === "es" ? item.label : item.labelEn) : stage;
}

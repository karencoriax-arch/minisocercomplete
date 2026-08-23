export const GAME_VERSION = "1.2.1" as const;

export const GAME_TITLE = "Mini Soccer Complete" as const;

export const INITIAL_RELEASE = {
  title: ["LANZAMIENTO INICIAL", "INITIAL RELEASE"],
  sections: [
    {
      title: ["Gameplay", "Gameplay"],
      items: [
        ["Partidos 4v4, 5v5 y 6v6.", "4v4, 5v5 and 6v6 matches."],
        ["Sistema de pases asistidos.", "Assisted passing system."],
        ["Apuntado mediante mouse.", "Mouse aiming."],
        ["Pase mediante clic derecho.", "Right-click passing."],
        ["Física independiente de la asistencia.", "Physics independent from assistance."],
        ["Cambio automático inteligente de jugador.", "Smart automatic player switching."],
        ["Cambio manual de jugador.", "Manual player switching."],
        ["Team AI para compañeros y rivales.", "Team AI for teammates and opponents."],
        ["Arqueros mejorados.", "Improved goalkeepers."],
        ["Defensa estructurada.", "Structured defending."],
        ["Primer toque.", "First touch."],
        ["Tiros contextuales.", "Contextual shooting."],
        ["Diferentes dificultades.", "Multiple difficulty levels."],
      ],
    },
    {
      title: ["Competiciones", "Competitions"],
      items: [
        ["Mundial.", "World Cup."],
        ["Champions.", "Champions League."],
        ["Libertadores.", "Libertadores."],
        ["Europa League.", "Europa League."],
        ["Sistema de fases.", "Competition stages."],
        ["Tablas.", "Standings."],
        ["Calendario.", "Fixtures calendar."],
        ["Eliminatorias.", "Knockout rounds."],
        ["Finales.", "Finals."],
        ["Estadísticas.", "Statistics."],
        ["Trofeos.", "Trophies."],
        ["Historial de campeonatos.", "Championship history."],
      ],
    },
    {
      title: ["Personalización", "Customization"],
      items: [
        ["Perfil del jugador.", "Player profile."],
        ["Nombre personalizado.", "Custom name."],
        ["Configuración inicial de las competiciones.", "Initial competition setup."],
        ["Formato fijado durante cada torneo.", "Format locked during each tournament."],
        ["Dificultad fijada durante cada torneo.", "Difficulty locked during each tournament."],
      ],
    },
    {
      title: ["Configuración", "Settings"],
      items: [
        ["Controles reasignables.", "Remappable controls."],
        ["Teclado y mouse.", "Keyboard and mouse."],
        ["Calidad gráfica.", "Graphics quality."],
        ["Rendimiento.", "Performance."],
        ["FPS.", "FPS."],
        ["Audio.", "Audio."],
        ["Gameplay.", "Gameplay."],
        ["Accesibilidad.", "Accessibility."],
      ],
    },
    {
      title: ["Presentación", "Presentation"],
      items: [
        ["Repeticiones.", "Replays."],
        ["Música.", "Music."],
        ["Sonidos.", "Sound effects."],
        ["Presentaciones de partidos.", "Match presentations."],
        ["Pantallas de competición.", "Competition screens."],
        ["Celebración de campeonatos.", "Championship celebrations."],
      ],
    },
  ],
} as const;

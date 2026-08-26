# Mini Soccer Complete — Roadmap maestro hacia 10/10

Este documento define el orden de desarrollo. Ninguna etapa pasa a producción sin build limpio, pruebas automáticas, simulaciones y revisión manual en PC + móvil.

## Principios
- Mantener identidad arcade 2D rápida y accesible.
- No convertir economía en pay-to-win.
- MSC = moneda común; Gemas = moneda rara. No agregar más monedas.
- Recursos con ventaja deportiva solo en single-player/eventos. Competitivo online sin ventajas comprables.
- Mantener PC y móvil como plataformas de primera clase.
- Evitar agregar sistemas nuevos antes de pulir los existentes.

## v2.1.0 — Progresión
- Perfil completo.
- XP y niveles.
- Misiones diarias y semanales.
- Misiones especiales.
- Logros.
- Estadísticas históricas.
- Recompensas balanceadas y anti-inflación.
- Títulos/badges cosméticos.

## v2.2.0 — Tienda 2.0 y personalización
- Más camisetas.
- Camisetas MSC originales.
- Pelotas.
- Estelas de pelota.
- Efectos de gol.
- Celebraciones 2D.
- Temas de HUD.
- Inventario mejorado.
- Ajuste del valor de las gemas y recursos raros.

## v2.3.0 — Gameplay polish
- Física de pelota refinada.
- Pase corto/largo más consistente.
- Tiro normal, colocado y potente.
- Vaselina contextual.
- Mejor feedback de postes, rebotes y atajadas.
- Diferenciación real por atributos/roles.
- Rasgos especiales de jugadores.
- Revisión completa de IA y arqueros.

## v2.4.0 — Tutorial, entrenamiento y desafíos
- Tutorial interactivo.
- Entrenamiento de tiros.
- Entrenamiento de pases.
- Entrenamiento defensivo.
- Entrenamiento de arquero.
- Desafíos: remontada, gol de oro, supervivencia, arco invicto, inferioridad numérica.

## v2.5.0 — Cuenta MSC y nube
- Autenticación.
- Perfil persistente en Supabase.
- Sincronización PC/celular.
- Economía y progreso server-side.
- Migración segura desde localStorage.
- Seguridad y validación del lado servidor.

## v2.6.0 — Divisiones y rankings
- Bronce → Élite MSC.
- Puntos de división.
- Leaderboards semanales/mensuales/globales.
- Estadísticas verificadas por servidor.
- Temporadas competitivas.

## v2.7.0 — Carrera 2.0
- Temporadas con objetivos.
- Forma/cansancio simplificados.
- Titulares y suplentes.
- Estadísticas de temporada.
- Fichajes simplificados si encajan con el tono arcade.

## v2.8.0 — Gamepad y multijugador local
- Xbox / PlayStation / genérico vía Gamepad API.
- Dos jugadores locales en PC.
- Perfiles de control separados.

## v2.9.0 — Presentación audiovisual
- Sonidos diferenciados de pase/tiro/poste/red/atajada.
- Público dinámico.
- Música original de menú.
- Estadios con identidad visual más fuerte.
- Clima visual.
- Replays mejorados y cámara lenta.

## v3.0.0 — Online crossplay
- PC vs PC.
- Móvil vs móvil.
- PC vs móvil.
- Matchmaking.
- Salas privadas.
- Reconexión.
- Servidor autoritativo o arquitectura equivalente anti-cheat.
- Compensación de latencia y reconciliación.
- Competitivo sin boosts de gameplay.
- Amigos, perfiles públicos y retos.

## Calidad y pruebas obligatorias por release
1. Build limpio desde npm ci.
2. Tests unitarios.
3. Tests de regresión.
4. Simulaciones 3v3 y 4v4.
5. Pruebas de economía/anti-exploit.
6. Pruebas de input PC y móvil.
7. Preview Vercel aislada.
8. Prueba manual PC.
9. Prueba manual Android/iOS web cuando sea posible.
10. Producción solo con checks verdes.

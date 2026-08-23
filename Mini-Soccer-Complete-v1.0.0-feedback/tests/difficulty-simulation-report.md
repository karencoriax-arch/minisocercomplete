# Calibración de dificultad — Mini Soccer Complete

Simulación táctica determinista realizada con los mismos cinco perfiles que usa el partido. Muestra: 100 partidos por cruce, 400 partidos totales.

| Cruce | Victorias nivel superior | Derrotas | Empates | Resultado |
|---|---:|---:|---:|---|
| Fácil vs Normal | 60% | 5% | 35% | Dentro de 60–75% |
| Normal vs Medio | 74% | 5% | 21% | Dentro de 60–75% |
| Medio vs Profesional | 75% | 6% | 19% | Dentro de 60–75% |
| Profesional vs Pro Mundial | 75% | 8% | 17% | Dentro de 60–75% |

## Promedios por partido

| Cruce | Equipo | Goles | Tiros | Al arco | Pases completos | Posesión | Pérdidas | Intercepciones | Entradas último tercio | Ocasiones claras |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Fácil–Normal | Fácil | 0.17 | 1.89 | 0.92 | 33.12 | 44.5% | 17.57 | 2.51 | 6.01 | 0.29 |
| Fácil–Normal | Normal | 1.13 | 8.44 | 4.63 | 52.98 | 55.5% | 15.96 | 2.49 | 23.44 | 1.53 |
| Normal–Medio | Normal | 0.23 | 2.71 | 1.20 | 40.41 | 45.1% | 15.87 | 3.93 | 7.55 | 0.39 |
| Normal–Medio | Medio | 1.49 | 9.59 | 5.41 | 59.36 | 54.9% | 13.79 | 4.06 | 24.00 | 2.07 |
| Medio–Profesional | Medio | 0.52 | 2.90 | 1.74 | 46.14 | 44.7% | 13.56 | 5.43 | 7.78 | 0.68 |
| Medio–Profesional | Profesional | 2.15 | 11.14 | 7.23 | 68.13 | 55.3% | 11.60 | 5.73 | 27.13 | 3.09 |
| Profesional–Pro Mundial | Profesional | 0.59 | 3.80 | 2.52 | 54.08 | 46.4% | 13.03 | 7.39 | 9.84 | 1.08 |
| Profesional–Pro Mundial | Pro Mundial | 2.14 | 9.88 | 6.83 | 70.70 | 53.6% | 10.12 | 7.51 | 23.40 | 2.94 |

La prueba falla automáticamente si cualquier nivel superior queda fuera del rango de 60–75 victorias cada 100 partidos.

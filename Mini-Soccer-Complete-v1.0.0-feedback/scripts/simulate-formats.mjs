import { FORMAT_BALANCE, simulateBalancedMatch } from "../app/gameplay-polish.ts";
import { PUBLIC_FORMATS } from "../app/match-config.ts";

const seededRandom = seed => () => {
  seed |= 0;
  seed = seed + 0x6D2B79F5 | 0;
  let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
  value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
};

const MATCHES_PER_FORMAT = 80;
const METRICS = ["goals", "shots", "shotsOnTarget", "saves", "blocks", "possessions", "passes", "interceptions", "possessionSeconds"];

function simulateFormat(format) {
  const rng = seededRandom(91_777 + format * 7_919);
  const totals = Object.fromEntries(METRICS.map(metric => [metric, 0]));
  for (let match = 0; match < MATCHES_PER_FORMAT; match++) {
    const result = simulateBalancedMatch(format, rng);
    for (const metric of METRICS) totals[metric] += result[metric];
  }
  const averages = Object.fromEntries(METRICS.map(metric => [metric, Number((totals[metric] / MATCHES_PER_FORMAT).toFixed(2))]));
  return {
    format: `${format}v${format}`,
    matches: MATCHES_PER_FORMAT,
    targetGoals: FORMAT_BALANCE[format].targetGoals,
    averages,
    averagePossessionDuration: Number((totals.possessionSeconds / Math.max(1, totals.possessions)).toFixed(2)),
  };
}

const reports = PUBLIC_FORMATS.map(simulateFormat);
console.log(JSON.stringify({ matches: MATCHES_PER_FORMAT * PUBLIC_FORMATS.length, reports }, null, 2));

const failures = reports.filter(report => {
  const [minimum, maximum] = report.targetGoals;
  return report.averages.goals < minimum || report.averages.goals > maximum || report.averages.shots <= report.averages.goals || report.averages.blocks <= 0 || report.averages.saves <= 0;
});
if (failures.length) {
  console.error(`Calibración fuera de rango: ${failures.map(report => `${report.format} (${report.averages.goals})`).join(", ")}`);
  process.exitCode = 1;
}

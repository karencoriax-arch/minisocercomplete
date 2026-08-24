export const DRIBBLE_SPEED_MULTIPLIER = 0.9;
export const SHOT_BLOCK_RADIUS_BONUS = 8;

export type ShotQualityInput = {
  distance: number;
  maximumUsefulDistance: number;
  lateralOffset: number;
  fieldHalfHeight: number;
  finishing: number;
  bodyAlignment: number;
  pressure: number;
  goalkeeperCoverage: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function calculateShotQuality(input: ShotQualityInput) {
  const distanceQuality = 1 - clamp(input.distance / Math.max(1, input.maximumUsefulDistance), 0, 1);
  const angleQuality = 1 - clamp(Math.abs(input.lateralOffset) / Math.max(1, input.fieldHalfHeight), 0, 1);
  const finishingQuality = clamp((input.finishing - 55) / 44, 0, 1);
  const orientationQuality = clamp((input.bodyAlignment + 1) / 2, 0, 1);
  const openGoalQuality = 1 - clamp(input.goalkeeperCoverage, 0, 1);
  return clamp(
    distanceQuality * 0.25
      + angleQuality * 0.18
      + finishingQuality * 0.24
      + orientationQuality * 0.15
      + openGoalQuality * 0.12
      - clamp(input.pressure, 0, 1) * 0.16,
    0.06,
    0.96,
  );
}

export function shotPreparationMs(bodyAlignment: number, pressure: number, rating: number) {
  return Math.round(clamp(82 + (1 - clamp(bodyAlignment, -1, 1)) * 35 + clamp(pressure, 0, 1) * 32 - (rating - 75) * 0.55, 80, 180));
}

export function applyContextualShotError(targetY: number, goalHalfHeight: number, quality: number, rng: () => number = Math.random) {
  const triangular = rng() + rng() - 1;
  return targetY + triangular * goalHalfHeight * (0.22 + (1 - clamp(quality, 0, 1)) * 1.18);
}

export type BalanceFormat = 3 | 4 | 5 | 6;

export const FORMAT_BALANCE = {
  // 3v3 is intentionally more open than 4v4: fewer blockers, more direct attacks,
  // but its target stays bounded so the compact mode does not become pinball.
  3: { possessionCount: 29, shotChance: 0.64, blockChance: 0.12, onTargetChance: 0.70, saveChance: 0.32, targetGoals: [6, 10] },
  4: { possessionCount: 31, shotChance: 0.59, blockChance: 0.16, onTargetChance: 0.68, saveChance: 0.35, targetGoals: [5, 9] },
  5: { possessionCount: 34, shotChance: 0.53, blockChance: 0.22, onTargetChance: 0.65, saveChance: 0.41, targetGoals: [4, 7] },
  6: { possessionCount: 37, shotChance: 0.47, blockChance: 0.28, onTargetChance: 0.62, saveChance: 0.45, targetGoals: [3, 6] },
} as const;

export function simulateBalancedMatch(format: BalanceFormat, rng: () => number = Math.random) {
  const config = FORMAT_BALANCE[format];
  const result = { goals: 0, shots: 0, shotsOnTarget: 0, saves: 0, blocks: 0, possessions: 0, passes: 0, interceptions: 0, possessionSeconds: 0, timeToFirstShot: 300 };
  const possessionCount = Math.max(20, Math.round(config.possessionCount + (rng() - 0.5) * 6));
  let matchTime = 0;
  for (let index = 0; index < possessionCount; index++) {
    const duration = 3.2 + rng() * (format <= 4 ? 7 : 9.5);
    matchTime += duration;
    result.possessions += 1;
    result.possessionSeconds += duration;
    result.passes += Math.max(1, Math.round(duration * (0.62 + rng() * 0.48)));
    if (rng() < 0.28 + format * 0.025) result.interceptions += 1;
    if (rng() >= config.shotChance) continue;
    result.shots += 1;
    if (result.timeToFirstShot === 300) result.timeToFirstShot = matchTime;
    if (rng() < config.blockChance) {
      result.blocks += 1;
      continue;
    }
    const baseQuality = calculateShotQuality({
      distance: 95 + rng() * 310,
      maximumUsefulDistance: 470,
      lateralOffset: (rng() - 0.5) * 380,
      fieldHalfHeight: 420,
      finishing: 78 + rng() * 14,
      bodyAlignment: 0.25 + rng() * 0.75,
      pressure: rng() * 0.8,
      goalkeeperCoverage: 0.25 + rng() * 0.6,
    });
    const onTargetChance = clamp(config.onTargetChance + (baseQuality - 0.5) * 0.22, 0.35, 0.86);
    if (rng() >= onTargetChance) continue;
    result.shotsOnTarget += 1;
    const saveChance = clamp(config.saveChance + (0.52 - baseQuality) * 0.16, 0.22, 0.68);
    if (rng() < saveChance) result.saves += 1;
    else result.goals += 1;
  }
  return result;
}

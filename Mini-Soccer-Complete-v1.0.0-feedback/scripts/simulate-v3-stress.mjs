import assert from "node:assert/strict";
import { applyMatchEconomy, parseEconomyState } from "../app/economy-v2.ts";
import { applyProgressMatch, parseProgressV3 } from "../app/progression-v3.ts";
import { calculateShotV3, derivePlayerAttributes, fatigueMultiplier, weatherBallVelocity } from "../app/gameplay-v3.ts";

let seed=0x5c0c3;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/0x100000000};
const pick=items=>items[Math.floor(random()*items.length)];
let economy=parseEconomyState(null),progress=parseProgressV3(null,new Date("2026-08-25T12:00:00Z"));
let earnedMsc=0,earnedGems=0;
for(let i=0;i<10_000;i++){
  const won=random()<.51,drew=!won&&random()<.16,goalsFor=Math.floor(random()*6),goalsAgainst=drew?goalsFor:won?Math.floor(random()*Math.max(1,goalsFor+1)):Math.floor(random()*6),completedPasses=Math.floor(random()*40),passes=completedPasses+Math.floor(random()*18),difficulty=pick(["Fácil","Normal","Medio","Profesional","Pro Mundial"]),freeGoals=random()<.025?3:0;
  const eco=applyMatchEconomy(economy,{played:true,won,drew,goalsFor,goalsAgainst,completedPasses,difficulty,freeGoals,tournamentChampion:random()<.006});
  economy=eco.state;earnedMsc+=eco.reward.msc;earnedGems+=eco.reward.gems;
  const prog=applyProgressMatch(progress,{played:true,won,drew,goalsFor:Math.max(0,goalsFor-freeGoals),goalsAgainst,completedPasses,passes,difficulty,teamId:pick(["arg","bra","fra","esp","rma","mci"]),maxDeficit:Math.floor(random()*4),careerMatch:random()<.16,tournamentChampion:random()<.006},new Date(1787659200000+i*60000));
  progress=prog.state;
  assert.ok(Number.isFinite(economy.msc)&&economy.msc>=0,"MSC negative/non-finite");
  assert.ok(Number.isFinite(economy.gems)&&economy.gems>=0,"gems negative/non-finite");
  assert.ok(economy.realWinStreakProgress>=0&&economy.realWinStreakProgress<5,"gem streak escaped 0..4");
  assert.ok(Number.isFinite(progress.rating)&&progress.rating>=0&&progress.rating<=5600,"rating escaped bounds");
  assert.ok(progress.level>=1&&progress.level<500,"level runaway");
  assert.ok(progress.xp>=0,"XP negative");
  assert.ok(progress.stats.matches===i+1,"played-match history drift");
}
assert.ok(earnedMsc>0&&earnedGems>0,"stress run generated no economy");

for(let i=0;i<10_000;i++){
  const rating=55+Math.floor(random()*42),role=pick(["DEL","EXT","MED","DEF","ARQ"]),attributes=derivePlayerAttributes(`Stress ${i}`,rating,role),type=pick(["NORMAL","FINESSE","POWER","CHIP"]),shot=calculateShotV3({type,charge:random(),distance:20+random()*520,maximumUsefulDistance:420,finishing:attributes.shoot,bodyAlignment:random()*2-1,pressure:random(),goalkeeperCoverage:random(),lateralOffset:(random()*2-1)*220,fieldHalfHeight:220});
  assert.ok(Number.isFinite(shot.quality)&&shot.quality>=0&&shot.quality<=1,"shot quality invalid");
  assert.ok(Number.isFinite(shot.forceMultiplier)&&shot.forceMultiplier>0,"shot force invalid");
  assert.ok(Number.isFinite(shot.errorMultiplier)&&shot.errorMultiplier>0,"shot error invalid");
  const fatigue=fatigueMultiplier(random()*100,attributes);assert.ok(fatigue>=.72&&fatigue<=1.01,"fatigue invalid");
  const weather=weatherBallVelocity({x:(random()-.5)*900,y:(random()-.5)*900},pick(["CLEAR","NIGHT","RAIN","SNOW","CLOUDY","SUNSET"]),.016);assert.ok(Number.isFinite(weather.x)&&Number.isFinite(weather.y),"weather velocity invalid");
}
console.log(JSON.stringify({matches:10_000,shotCases:10_000,msc:economy.msc,gems:economy.gems,level:progress.level,rating:progress.rating,earnedMsc,earnedGems}));

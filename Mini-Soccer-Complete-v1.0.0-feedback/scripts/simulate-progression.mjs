import assert from "node:assert/strict";
import {
  DEFAULT_PROGRESSION,
  applyProgressionMatch,
  claimProgressMission,
  levelFromXp,
  DAILY_MISSIONS,
  WEEKLY_MISSIONS,
} from "../app/progression-v21.ts";

let seed=21021;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
let state=structuredClone(DEFAULT_PROGRESSION);
let missionMsc=0;
let previousLevel=1;
let maxLevelJump=0;

for(let match=1;match<=100;match++){
  const won=random()<.55;
  const drew=!won&&random()<.22;
  const goalsFor=Math.max(0,Math.floor(random()*5));
  const goalsAgainst=Math.max(0,Math.floor(random()*4));
  const completedPasses=7+Math.floor(random()*13);
  const difficulty=match<20?"Normal":match<55?"Medio":match<85?"Profesional":"Pro Mundial";
  const result=applyProgressionMatch(state,{played:true,won,drew,goalsFor,goalsAgainst,completedPasses,teamId:["arg","bra","esp","fra"][match%4],difficulty,maxDeficit:won&&random()<.12?2:0,tournamentChampion:match%25===0,tournamentUnbeaten:match%50===0});
  state=result.state;
  for(const mission of [...DAILY_MISSIONS,...WEEKLY_MISSIONS]){
    const claim=claimProgressMission(state,mission.id);
    if(claim.ok){state=claim.state;missionMsc+=claim.msc;}
  }
  const currentLevel=levelFromXp(state.totalXp).level;
  maxLevelJump=Math.max(maxLevelJump,currentLevel-previousLevel);
  previousLevel=currentLevel;
}

const level=levelFromXp(state.totalXp).level;
assert.equal(state.stats.matches,100);
assert.equal(state.stats.wins+state.stats.draws+state.stats.losses,100);
assert.ok(level>=8&&level<=18,`100 partidos dejaron nivel ${level}; fuera del rango de progresión esperado`);
assert.ok(state.totalXp>=6000&&state.totalXp<=16000,`XP total inesperado: ${state.totalXp}`);
assert.ok(missionMsc<=4500,`las misiones generaron demasiado MSC: ${missionMsc}`);
assert.ok(maxLevelJump<=1,`se saltaron ${maxLevelJump} niveles de golpe`);
assert.ok(state.stats.teamsUsed.length===4,"el historial debe registrar equipos únicos");
console.log(JSON.stringify({matches:state.stats.matches,wins:state.stats.wins,level,totalXp:state.totalXp,missionMsc,achievements:state.achievements.length,bestStreak:state.stats.bestWinStreak},null,2));

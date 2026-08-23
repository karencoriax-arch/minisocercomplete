import {DIFFICULTY_PROFILES} from "../app/game-ai.ts";

const ORDER=["EASY","NORMAL","MEDIUM","PROFESSIONAL","WORLD_CLASS"];
const LABELS={EASY:"Fácil",NORMAL:"Normal",MEDIUM:"Medio",PROFESSIONAL:"Profesional",WORLD_CLASS:"Pro Mundial"};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const seededRandom=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const binomial=(trials,chance,rng)=>{let result=0;for(let i=0;i<trials;i++)if(rng()<chance)result++;return result};
const poisson=(lambda,rng)=>{const limit=Math.exp(-lambda);let product=1,count=0;do{count++;product*=rng()}while(product>limit&&count<80);return count-1};
const quality=p=>p.passVision*.14+p.passAccuracy*.11+p.shotAccuracy*.10+p.interceptionSkill*.12+p.markingSkill*.10+p.positioningSkill*.12+p.pressingIntensity*.08+p.tacticalAwareness*.14+p.combinationPlay*.09;

function teamMetrics(profile,opponent,possessionShare,rng){
  const difference=quality(profile)-quality(opponent),attackEdge=Math.exp(difference*3.7);
  const entries=Math.max(2,poisson((8.2+profile.attackingUrgency*5.8+profile.combinationPlay*2.4)*possessionShare*2*attackEdge,rng));
  const passAttempts=Math.max(12,Math.round((38+profile.passVision*25+profile.combinationPlay*12)*possessionShare*2));
  const passRate=clamp(profile.passAccuracy+profile.positioningSkill*.055-opponent.pressingIntensity*.105-opponent.interceptionSkill*.035,.58,.955);
  const completedPasses=binomial(passAttempts,passRate,rng),turnovers=passAttempts-completedPasses+poisson(2.2-profile.tacticalAwareness*.7,rng);
  const shots=binomial(entries,clamp(.24+profile.attackingUrgency*.18+profile.passVision*.08-opponent.markingSkill*.08,.20,.52),rng);
  const onTarget=binomial(shots,clamp(profile.shotAccuracy*.72+profile.tacticalAwareness*.09-opponent.positioningSkill*.08,.38,.82),rng);
  const clearChances=binomial(onTarget,clamp(.20+profile.combinationPlay*.24+profile.passVision*.09-opponent.markingSkill*.08,.18,.50),rng);
  const goals=binomial(onTarget,clamp(.16+profile.shotAccuracy*.16+profile.tacticalAwareness*.07-opponent.positioningSkill*.10,.13,.37),rng);
  const interceptions=Math.max(0,Math.round((opponent.mistakeChance*12+profile.interceptionSkill*7+profile.markingSkill*3)*opponent.pressingIntensity*(.75+rng()*.5)));
  return {goals,shots,onTarget,passAttempts,completedPasses,possession:possessionShare*100,turnovers,interceptions,finalThirdEntries:entries,clearChances};
}

function simulateMatch(lower,higher,rng){
  const lowerQuality=quality(lower),higherQuality=quality(higher),possessionHigher=clamp(.5+(higherQuality-lowerQuality)*.42+(rng()-.5)*.08,.37,.63);
  const high=teamMetrics(higher,lower,possessionHigher,rng),low=teamMetrics(lower,higher,1-possessionHigher,rng);
  return {low,high};
}

const add=(totals,match)=>{for(const key of Object.keys(totals))totals[key]+=match[key]};
const average=(totals,matches)=>Object.fromEntries(Object.entries(totals).map(([key,value])=>[key,Number((value/matches).toFixed(key==="possession"?1:2))]));
const empty=()=>({goals:0,shots:0,onTarget:0,passAttempts:0,completedPasses:0,possession:0,turnovers:0,interceptions:0,finalThirdEntries:0,clearChances:0});
const reports=[];

for(let pairing=0;pairing<ORDER.length-1;pairing++){
  const lowKey=ORDER[pairing],highKey=ORDER[pairing+1],lower=DIFFICULTY_PROFILES[lowKey],higher=DIFFICULTY_PROFILES[highKey],rng=seededRandom(84017+pairing*7919);
  const lowTotals=empty(),highTotals=empty();let highWins=0,lowWins=0,draws=0;
  for(let match=0;match<100;match++){
    const result=simulateMatch(lower,higher,rng);add(lowTotals,result.low);add(highTotals,result.high);
    if(result.high.goals>result.low.goals)highWins++;else if(result.high.goals<result.low.goals)lowWins++;else draws++;
  }
  reports.push({matchup:`${LABELS[lowKey]} vs ${LABELS[highKey]}`,higher:LABELS[highKey],highWins,lowWins,draws,winRate:highWins,lowerMetrics:average(lowTotals,100),higherMetrics:average(highTotals,100)});
}

console.log(JSON.stringify({matches:400,target:"El nivel superior gana 60–75 de cada 100 partidos",reports},null,2));
const outOfRange=reports.filter(report=>report.winRate<60||report.winRate>75);
if(outOfRange.length){console.error(`Calibración fuera de rango: ${outOfRange.map(report=>`${report.matchup} (${report.winRate}%)`).join(", ")}`);process.exitCode=1}

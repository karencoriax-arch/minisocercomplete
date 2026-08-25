export type MissionPeriod = "DAILY"|"WEEKLY"|"SPECIAL";
export type MissionMetric = "PLAY_MATCHES"|"WIN_MATCHES"|"SCORE_GOALS"|"COMPLETE_PASSES"|"CLEAN_SHEETS"|"WIN_HARD"|"USE_TEAMS"|"WIN_TOURNAMENTS"|"TRAINING_STARS";
export type CosmeticKind = "BALL"|"TRAIL"|"GOAL_FX"|"CELEBRATION"|"HUD"|"BANNER"|"STADIUM_THEME";
export type DivisionId = "BRONZE_3"|"BRONZE_2"|"BRONZE_1"|"SILVER_3"|"SILVER_2"|"SILVER_1"|"GOLD_3"|"GOLD_2"|"GOLD_1"|"PLATINUM"|"DIAMOND"|"MSC_ELITE";
export type TrainingKind = "SHOOTING"|"PASSING"|"DRIBBLING"|"DEFENDING"|"KEEPER";

export interface HistoricalStats {
  matches:number; wins:number; draws:number; losses:number; goalsFor:number; goalsAgainst:number;
  passes:number; completedPasses:number; cleanSheets:number; hatTricks:number; tournaments:number;
  bestWinStreak:number; currentWinStreak:number; biggestWin:number; biggestComeback:number;
  trainingStars:number;
  teamsUsed:Record<string,number>;
}

export interface MissionDefinition {
  id:string; period:MissionPeriod; title:string; description:string; metric:MissionMetric; target:number;
  rewardMSC:number; rewardXP:number; rewardGems:number;
}
export interface MissionProgress { value:number; claimed:boolean; }
export interface MissionBoard { key:string; missions:MissionDefinition[]; progress:Record<string,MissionProgress>; }

export interface CareerV3 {
  active:boolean; teamId:string|null; season:number; matchday:number; points:number; played:number; wins:number; draws:number; losses:number;
  goalsFor:number; goalsAgainst:number; objective:"TOP_4"|"QUALIFY"|"CHAMPION"; form:("W"|"D"|"L")[];
}

export interface ProgressStateV3 {
  version:3; level:number; xp:number; rating:number; achievements:string[]; titles:string[];
  ownedCosmetics:string[]; equipped:Partial<Record<CosmeticKind,string>>;
  stats:HistoricalStats; daily:MissionBoard; weekly:MissionBoard; special:MissionBoard;
  career:CareerV3; updatedAt:string;
}

export interface MatchProgressInput {
  won:boolean; drew:boolean; goalsFor:number; goalsAgainst:number; completedPasses:number; passes?:number;
  difficulty:string; tournamentChampion?:boolean; teamId?:string; maxDeficit?:number; played?:boolean;
}

export interface ProgressReward { xp:number; ratingDelta:number; unlockedAchievements:string[]; }

const todayKey=(date=new Date())=>date.toISOString().slice(0,10);
const weekKey=(date=new Date())=>{const d=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()));const day=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()+4-day);const yearStart=new Date(Date.UTC(d.getUTCFullYear(),0,1));const week=Math.ceil((((d.getTime()-yearStart.getTime())/86400000)+1)/7);return `${d.getUTCFullYear()}-W${String(week).padStart(2,"0")}`};

export const DAILY_MISSIONS:MissionDefinition[]=[
  {id:"daily_play_2",period:"DAILY",title:"A la cancha",description:"Jugá 2 partidos completos",metric:"PLAY_MATCHES",target:2,rewardMSC:120,rewardXP:70,rewardGems:0},
  {id:"daily_goals_5",period:"DAILY",title:"Afiná la puntería",description:"Marcá 5 goles jugando",metric:"SCORE_GOALS",target:5,rewardMSC:150,rewardXP:80,rewardGems:0},
  {id:"daily_passes_18",period:"DAILY",title:"Sociedad",description:"Completá 18 pases",metric:"COMPLETE_PASSES",target:18,rewardMSC:110,rewardXP:65,rewardGems:0},
  {id:"daily_win_1",period:"DAILY",title:"Tres puntos",description:"Ganá un partido",metric:"WIN_MATCHES",target:1,rewardMSC:140,rewardXP:75,rewardGems:0},
  {id:"daily_clean_1",period:"DAILY",title:"Candado",description:"Terminá un partido sin recibir goles",metric:"CLEAN_SHEETS",target:1,rewardMSC:160,rewardXP:80,rewardGems:0},
];

export const WEEKLY_MISSIONS:MissionDefinition[]=[
  {id:"weekly_win_8",period:"WEEKLY",title:"Semana ganadora",description:"Ganá 8 partidos",metric:"WIN_MATCHES",target:8,rewardMSC:520,rewardXP:300,rewardGems:1},
  {id:"weekly_goals_25",period:"WEEKLY",title:"Goleador semanal",description:"Marcá 25 goles",metric:"SCORE_GOALS",target:25,rewardMSC:470,rewardXP:270,rewardGems:1},
  {id:"weekly_clean_3",period:"WEEKLY",title:"Muralla",description:"Conseguí 3 vallas invictas",metric:"CLEAN_SHEETS",target:3,rewardMSC:500,rewardXP:290,rewardGems:1},
  {id:"weekly_teams_3",period:"WEEKLY",title:"Vuelta al mundo",description:"Jugá con 3 equipos diferentes",metric:"USE_TEAMS",target:3,rewardMSC:430,rewardXP:250,rewardGems:0},
  {id:"weekly_hard_3",period:"WEEKLY",title:"Sin miedo",description:"Ganá 3 partidos en Profesional o Pro Mundial",metric:"WIN_HARD",target:3,rewardMSC:600,rewardXP:330,rewardGems:1},
];

export const SPECIAL_MISSIONS:MissionDefinition[]=[
  {id:"special_world_champion",period:"SPECIAL",title:"Campeón",description:"Ganá un torneo completo",metric:"WIN_TOURNAMENTS",target:1,rewardMSC:2000,rewardXP:650,rewardGems:3},
  {id:"special_100_wins",period:"SPECIAL",title:"Centenario",description:"Alcanzá 100 victorias",metric:"WIN_MATCHES",target:100,rewardMSC:3000,rewardXP:1000,rewardGems:5},
  {id:"special_training_30",period:"SPECIAL",title:"Academia MSC",description:"Conseguí 30 estrellas de entrenamiento",metric:"TRAINING_STARS",target:30,rewardMSC:1800,rewardXP:700,rewardGems:3},
];

const makeBoard=(key:string,missions:MissionDefinition[]):MissionBoard=>({key,missions,progress:Object.fromEntries(missions.map(m=>[m.id,{value:0,claimed:false}]))});

export const EMPTY_STATS:HistoricalStats={matches:0,wins:0,draws:0,losses:0,goalsFor:0,goalsAgainst:0,passes:0,completedPasses:0,cleanSheets:0,hatTricks:0,tournaments:0,bestWinStreak:0,currentWinStreak:0,biggestWin:0,biggestComeback:0,trainingStars:0,teamsUsed:{}};
export const DEFAULT_CAREER_V3:CareerV3={active:false,teamId:null,season:1,matchday:0,points:0,played:0,wins:0,draws:0,losses:0,goalsFor:0,goalsAgainst:0,objective:"TOP_4",form:[]};
export const DEFAULT_PROGRESS_V3:ProgressStateV3={version:3,level:1,xp:0,rating:0,achievements:[],titles:[],ownedCosmetics:["ball_classic","hud_classic"],equipped:{BALL:"ball_classic",HUD:"hud_classic"},stats:EMPTY_STATS,daily:makeBoard(todayKey(),DAILY_MISSIONS),weekly:makeBoard(weekKey(),WEEKLY_MISSIONS),special:makeBoard("career",SPECIAL_MISSIONS),career:DEFAULT_CAREER_V3,updatedAt:new Date(0).toISOString()};

export function xpNeededForLevel(level:number){return Math.round(420+Math.max(0,level-1)*82+Math.pow(Math.max(0,level-1),1.16)*18)}
export function normalizeLevel(level:number,xp:number){let current=Math.max(1,Math.floor(level)),rest=Math.max(0,Math.floor(xp));while(rest>=xpNeededForLevel(current)){rest-=xpNeededForLevel(current);current++}return{level:current,xp:rest}}

export const DIVISIONS:{id:DivisionId;name:string;minimum:number}[]=[
  {id:"BRONZE_3",name:"Bronce III",minimum:0},{id:"BRONZE_2",name:"Bronce II",minimum:200},{id:"BRONZE_1",name:"Bronce I",minimum:400},
  {id:"SILVER_3",name:"Plata III",minimum:650},{id:"SILVER_2",name:"Plata II",minimum:900},{id:"SILVER_1",name:"Plata I",minimum:1200},
  {id:"GOLD_3",name:"Oro III",minimum:1600},{id:"GOLD_2",name:"Oro II",minimum:2000},{id:"GOLD_1",name:"Oro I",minimum:2500},
  {id:"PLATINUM",name:"Platino",minimum:3200},{id:"DIAMOND",name:"Diamante",minimum:4000},{id:"MSC_ELITE",name:"Élite MSC",minimum:5000},
];
export function divisionForRating(rating:number){return [...DIVISIONS].reverse().find(d=>rating>=d.minimum)??DIVISIONS[0]}

const hardDifficulty=(difficulty:string)=>difficulty==="Profesional"||difficulty==="Pro Mundial";
const missionIncrement=(mission:MissionDefinition,input:MatchProgressInput,stats:HistoricalStats)=>{
  switch(mission.metric){
    case"PLAY_MATCHES":return input.played===false?0:1;
    case"WIN_MATCHES":return input.won?1:0;
    case"SCORE_GOALS":return Math.max(0,input.goalsFor);
    case"COMPLETE_PASSES":return Math.max(0,input.completedPasses);
    case"CLEAN_SHEETS":return input.goalsAgainst===0?1:0;
    case"WIN_HARD":return input.won&&hardDifficulty(input.difficulty)?1:0;
    case"USE_TEAMS":return input.teamId?Object.keys(stats.teamsUsed).length:0;
    case"WIN_TOURNAMENTS":return input.tournamentChampion?1:0;
    case"TRAINING_STARS":return 0;
  }
};

function refreshBoards(state:ProgressStateV3,date=new Date()):ProgressStateV3{
  const dailyKey=todayKey(date),weeklyKey=weekKey(date);
  return{...state,daily:state.daily.key===dailyKey?state.daily:makeBoard(dailyKey,DAILY_MISSIONS),weekly:state.weekly.key===weeklyKey?state.weekly:makeBoard(weeklyKey,WEEKLY_MISSIONS)};
}

function updateBoard(board:MissionBoard,input:MatchProgressInput,stats:HistoricalStats){
  const progress={...board.progress};
  for(const mission of board.missions){const prev=progress[mission.id]??{value:0,claimed:false};if(prev.claimed)continue;const inc=missionIncrement(mission,input,stats);const nextValue=mission.metric==="USE_TEAMS"?Math.max(prev.value,inc):prev.value+inc;progress[mission.id]={...prev,value:Math.min(mission.target,nextValue)}}
  return{...board,progress};
}

const ACHIEVEMENTS={
  first_goal:(s:HistoricalStats)=>s.goalsFor>=1,
  hat_trick:(s:HistoricalStats)=>s.hatTricks>=1,
  goals_100:(s:HistoricalStats)=>s.goalsFor>=100,
  goals_500:(s:HistoricalStats)=>s.goalsFor>=500,
  wins_10:(s:HistoricalStats)=>s.wins>=10,
  wins_100:(s:HistoricalStats)=>s.wins>=100,
  clean_10:(s:HistoricalStats)=>s.cleanSheets>=10,
  champion:(s:HistoricalStats)=>s.tournaments>=1,
  champion_5:(s:HistoricalStats)=>s.tournaments>=5,
  streak_10:(s:HistoricalStats)=>s.bestWinStreak>=10,
  comeback_3:(s:HistoricalStats)=>s.biggestComeback>=3,
  academy_30:(s:HistoricalStats)=>s.trainingStars>=30,
} satisfies Record<string,(stats:HistoricalStats)=>boolean>;

export function applyProgressMatch(raw:ProgressStateV3,input:MatchProgressInput,date=new Date()):{state:ProgressStateV3;reward:ProgressReward}{
  let state=refreshBoards(raw,date);if(input.played===false)return{state,reward:{xp:0,ratingDelta:0,unlockedAchievements:[]}};
  const stats={...state.stats,teamsUsed:{...state.stats.teamsUsed}};
  stats.matches++;stats.goalsFor+=Math.max(0,input.goalsFor);stats.goalsAgainst+=Math.max(0,input.goalsAgainst);stats.passes+=Math.max(0,input.passes??input.completedPasses);stats.completedPasses+=Math.max(0,input.completedPasses);
  if(input.won){stats.wins++;stats.currentWinStreak++;stats.bestWinStreak=Math.max(stats.bestWinStreak,stats.currentWinStreak)}else if(input.drew){stats.draws++;stats.currentWinStreak=0}else{stats.losses++;stats.currentWinStreak=0}
  if(input.goalsAgainst===0)stats.cleanSheets++;if(input.goalsFor>=3)stats.hatTricks++;if(input.tournamentChampion)stats.tournaments++;if(input.teamId)stats.teamsUsed[input.teamId]=(stats.teamsUsed[input.teamId]??0)+1;
  stats.biggestWin=Math.max(stats.biggestWin,input.goalsFor-input.goalsAgainst);stats.biggestComeback=Math.max(stats.biggestComeback,input.maxDeficit??0);
  const baseXP=40+(input.won?30:input.drew?10:0)+Math.min(5,input.goalsFor)*5+(input.goalsAgainst===0?20:0)+(hardDifficulty(input.difficulty)?15:0)+(input.tournamentChampion?150:0);
  const ratingDelta=input.won?(hardDifficulty(input.difficulty)?58:42):input.drew?8:-24;
  const normalized=normalizeLevel(state.level,state.xp+baseXP);
  const unlocked=Object.entries(ACHIEVEMENTS).filter(([id,rule])=>!state.achievements.includes(id)&&rule(stats)).map(([id])=>id);
  state={...state,...normalized,rating:Math.max(0,Math.min(5600,state.rating+ratingDelta)),stats,achievements:[...state.achievements,...unlocked],daily:updateBoard(state.daily,input,stats),weekly:updateBoard(state.weekly,input,stats),special:updateBoard(state.special,input,stats),career:applyCareerMatch(state.career,input),updatedAt:date.toISOString()};
  return{state,reward:{xp:baseXP,ratingDelta,unlockedAchievements:unlocked}};
}

export function claimMission(state:ProgressStateV3,period:MissionPeriod,id:string){
  const key=period==="DAILY"?"daily":period==="WEEKLY"?"weekly":"special",board=state[key],mission=board.missions.find(item=>item.id===id),current=board.progress[id];
  if(!mission||!current||current.claimed||current.value<mission.target)return{state,rewardMSC:0,rewardXP:0,rewardGems:0};
  const progress={...board.progress,[id]:{...current,claimed:true}},normalized=normalizeLevel(state.level,state.xp+mission.rewardXP);
  return{state:{...state,...normalized,[key]:{...board,progress},updatedAt:new Date().toISOString()},rewardMSC:mission.rewardMSC,rewardXP:mission.rewardXP,rewardGems:mission.rewardGems};
}

export function addTrainingStars(state:ProgressStateV3,kind:TrainingKind,stars:number){
  const gained=Math.max(0,Math.min(3,Math.floor(stars))),stats={...state.stats,trainingStars:state.stats.trainingStars+gained};
  const special={...state.special,progress:{...state.special.progress}};for(const mission of special.missions)if(mission.metric==="TRAINING_STARS"){const prev=special.progress[mission.id];special.progress[mission.id]={...prev,value:Math.min(mission.target,(prev?.value??0)+gained)}}
  const unlocked=Object.entries(ACHIEVEMENTS).filter(([id,rule])=>!state.achievements.includes(id)&&rule(stats)).map(([id])=>id);
  return{...state,stats,special,achievements:[...state.achievements,...unlocked],updatedAt:new Date().toISOString()};
}

export function startCareer(state:ProgressStateV3,teamId:string):ProgressStateV3{return{...state,career:{...DEFAULT_CAREER_V3,active:true,teamId},updatedAt:new Date().toISOString()}}
export function applyCareerMatch(career:CareerV3,input:MatchProgressInput):CareerV3{
  if(!career.active||input.played===false)return career;const result=input.won?"W":input.drew?"D":"L";return{...career,matchday:career.matchday+1,played:career.played+1,wins:career.wins+(input.won?1:0),draws:career.draws+(input.drew?1:0),losses:career.losses+(!input.won&&!input.drew?1:0),points:career.points+(input.won?3:input.drew?1:0),goalsFor:career.goalsFor+input.goalsFor,goalsAgainst:career.goalsAgainst+input.goalsAgainst,form:[...career.form,result].slice(-5)};
}

export interface CosmeticItem {id:string;kind:CosmeticKind;name:string;priceMSC:number;levelRequired:number;rarity:"COMMON"|"RARE"|"EPIC"|"LEGENDARY";}
export const COSMETICS_V3:CosmeticItem[]=[
  {id:"ball_classic",kind:"BALL",name:"Clásica MSC",priceMSC:0,levelRequired:1,rarity:"COMMON"},{id:"ball_retro",kind:"BALL",name:"Retro 86",priceMSC:900,levelRequired:3,rarity:"COMMON"},{id:"ball_neon",kind:"BALL",name:"Neón",priceMSC:1400,levelRequired:6,rarity:"RARE"},{id:"ball_gold",kind:"BALL",name:"Oro",priceMSC:3500,levelRequired:18,rarity:"EPIC"},{id:"ball_galaxy",kind:"BALL",name:"Galaxia",priceMSC:5200,levelRequired:28,rarity:"LEGENDARY"},
  {id:"trail_lime",kind:"TRAIL",name:"Estela Lima",priceMSC:1100,levelRequired:6,rarity:"RARE"},{id:"trail_fire",kind:"TRAIL",name:"Estela Fuego",priceMSC:2600,levelRequired:14,rarity:"EPIC"},{id:"trail_ice",kind:"TRAIL",name:"Estela Hielo",priceMSC:2600,levelRequired:14,rarity:"EPIC"},{id:"trail_stars",kind:"TRAIL",name:"Estela Estelar",priceMSC:4400,levelRequired:25,rarity:"LEGENDARY"},
  {id:"goal_confetti",kind:"GOAL_FX",name:"Confeti",priceMSC:1300,levelRequired:7,rarity:"RARE"},{id:"goal_fire",kind:"GOAL_FX",name:"Gol de Fuego",priceMSC:3000,levelRequired:16,rarity:"EPIC"},{id:"goal_lightning",kind:"GOAL_FX",name:"Tormenta",priceMSC:3600,levelRequired:20,rarity:"EPIC"},{id:"goal_gold",kind:"GOAL_FX",name:"Gol Dorado",priceMSC:5800,levelRequired:32,rarity:"LEGENDARY"},
  {id:"celebration_jump",kind:"CELEBRATION",name:"Salto",priceMSC:900,levelRequired:4,rarity:"COMMON"},{id:"celebration_circle",kind:"CELEBRATION",name:"Ronda MSC",priceMSC:1800,levelRequired:10,rarity:"RARE"},{id:"celebration_crown",kind:"CELEBRATION",name:"Corona",priceMSC:4200,levelRequired:26,rarity:"LEGENDARY"},
  {id:"hud_classic",kind:"HUD",name:"HUD Clásico",priceMSC:0,levelRequired:1,rarity:"COMMON"},{id:"hud_neon",kind:"HUD",name:"HUD Neón",priceMSC:1600,levelRequired:8,rarity:"RARE"},{id:"hud_minimal",kind:"HUD",name:"HUD Minimal",priceMSC:1600,levelRequired:8,rarity:"RARE"},{id:"hud_gold",kind:"HUD",name:"HUD Élite",priceMSC:4800,levelRequired:30,rarity:"LEGENDARY"},
  {id:"banner_argentum",kind:"BANNER",name:"Argentum",priceMSC:1000,levelRequired:5,rarity:"RARE"},{id:"banner_world",kind:"BANNER",name:"Camino Mundial",priceMSC:2500,levelRequired:15,rarity:"EPIC"},{id:"banner_elite",kind:"BANNER",name:"Élite MSC",priceMSC:6000,levelRequired:40,rarity:"LEGENDARY"},
  {id:"stadium_sunset",kind:"STADIUM_THEME",name:"Atardecer",priceMSC:2200,levelRequired:12,rarity:"RARE"},{id:"stadium_rain",kind:"STADIUM_THEME",name:"Noche de Lluvia",priceMSC:3200,levelRequired:20,rarity:"EPIC"},{id:"stadium_neon",kind:"STADIUM_THEME",name:"Metrópolis Neón",priceMSC:5000,levelRequired:30,rarity:"LEGENDARY"},
];

export function buyCosmetic(state:ProgressStateV3,id:string,availableMSC:number){const item=COSMETICS_V3.find(entry=>entry.id===id);if(!item||state.ownedCosmetics.includes(id)||state.level<item.levelRequired||availableMSC<item.priceMSC)return{state,cost:0,ok:false};return{state:{...state,ownedCosmetics:[...state.ownedCosmetics,id],updatedAt:new Date().toISOString()},cost:item.priceMSC,ok:true}}
export function equipCosmetic(state:ProgressStateV3,id:string){const item=COSMETICS_V3.find(entry=>entry.id===id);if(!item||!state.ownedCosmetics.includes(id))return state;return{...state,equipped:{...state.equipped,[item.kind]:id},updatedAt:new Date().toISOString()}}

export function parseProgressV3(raw:string|null,date=new Date()):ProgressStateV3{
  if(!raw)return refreshBoards({...DEFAULT_PROGRESS_V3,stats:{...EMPTY_STATS,teamsUsed:{}},daily:makeBoard(todayKey(date),DAILY_MISSIONS),weekly:makeBoard(weekKey(date),WEEKLY_MISSIONS),special:makeBoard("career",SPECIAL_MISSIONS),updatedAt:date.toISOString()},date);
  try{const parsed=JSON.parse(raw) as Partial<ProgressStateV3>;const state:ProgressStateV3={...DEFAULT_PROGRESS_V3,...parsed,version:3,stats:{...EMPTY_STATS,...parsed.stats,teamsUsed:{...(parsed.stats?.teamsUsed??{})}},career:{...DEFAULT_CAREER_V3,...parsed.career},achievements:Array.isArray(parsed.achievements)?parsed.achievements:[],titles:Array.isArray(parsed.titles)?parsed.titles:[],ownedCosmetics:Array.isArray(parsed.ownedCosmetics)?parsed.ownedCosmetics:["ball_classic","hud_classic"],equipped:{...DEFAULT_PROGRESS_V3.equipped,...parsed.equipped},daily:parsed.daily??makeBoard(todayKey(date),DAILY_MISSIONS),weekly:parsed.weekly??makeBoard(weekKey(date),WEEKLY_MISSIONS),special:parsed.special??makeBoard("career",SPECIAL_MISSIONS)};return refreshBoards(state,date)}catch{return parseProgressV3(null,date)}
}

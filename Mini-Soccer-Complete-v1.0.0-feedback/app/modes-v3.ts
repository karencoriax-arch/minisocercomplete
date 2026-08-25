export type ChallengeId="COMEBACK_03"|"GOLDEN_GOAL"|"CLEAN_SHEET"|"UNDERDOG"|"PASS_MASTER"|"SURVIVAL";
export type EventId="WORLD_WEEK"|"NEON_NIGHTS"|"ACADEMY_WEEK"|"RIVALRY_WEEK";
export interface ChallengeV3 {id:ChallengeId;name:string;description:string;initialScore:[number,number];durationSeconds:number;difficulty:string;rules:{goldenGoal?:boolean;mustKeepCleanSheet?:boolean;playerDisadvantage?:number;requiredPasses?:number;dynamicDifficulty?:boolean};rewardMSC:number;rewardXP:number;rewardGems:number;}
export interface EventV3 {id:EventId;name:string;description:string;startsAt:string;endsAt:string;missionMultiplier:number;cosmeticId:string;}

export const CHALLENGES_V3:ChallengeV3[]=[
 {id:"COMEBACK_03",name:"Remontada imposible",description:"Arrancás 0-3 y quedan 90 segundos.",initialScore:[0,3],durationSeconds:90,difficulty:"Profesional",rules:{},rewardMSC:650,rewardXP:300,rewardGems:1},
 {id:"GOLDEN_GOAL",name:"Gol de oro",description:"El primer gol termina el partido.",initialScore:[0,0],durationSeconds:180,difficulty:"Medio",rules:{goldenGoal:true},rewardMSC:300,rewardXP:150,rewardGems:0},
 {id:"CLEAN_SHEET",name:"El muro",description:"Sobreviví 3 minutos sin recibir goles.",initialScore:[0,0],durationSeconds:180,difficulty:"Profesional",rules:{mustKeepCleanSheet:true},rewardMSC:520,rewardXP:260,rewardGems:1},
 {id:"UNDERDOG",name:"Uno menos",description:"Jugá con un jugador de campo menos.",initialScore:[0,0],durationSeconds:180,difficulty:"Medio",rules:{playerDisadvantage:1},rewardMSC:460,rewardXP:220,rewardGems:0},
 {id:"PASS_MASTER",name:"Circulación perfecta",description:"Completá 30 pases y ganá.",initialScore:[0,0],durationSeconds:210,difficulty:"Medio",rules:{requiredPasses:30},rewardMSC:500,rewardXP:240,rewardGems:0},
 {id:"SURVIVAL",name:"Supervivencia",description:"La IA aumenta presión y velocidad cada minuto.",initialScore:[0,0],durationSeconds:240,difficulty:"Normal",rules:{dynamicDifficulty:true},rewardMSC:800,rewardXP:350,rewardGems:2},
];

const utc=(date:Date)=>Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate());
export function activeEventV3(date=new Date()):EventV3|null{
 const day=Math.floor(utc(date)/86400000),slot=Math.floor(day/7)%4,start=new Date((Math.floor(day/7)*7)*86400000),end=new Date(start.getTime()+7*86400000),base=[
  {id:"WORLD_WEEK" as const,name:"Semana Mundial",description:"Misiones de selecciones y recompensas dobles de torneo.",missionMultiplier:1.25,cosmeticId:"banner_world"},
  {id:"NEON_NIGHTS" as const,name:"Noches Neón",description:"Desafíos nocturnos y cosméticos neón.",missionMultiplier:1.1,cosmeticId:"hud_neon"},
  {id:"ACADEMY_WEEK" as const,name:"Semana Academia",description:"Entrenamiento con bonus de XP.",missionMultiplier:1.2,cosmeticId:"ball_retro"},
  {id:"RIVALRY_WEEK" as const,name:"Semana de Rivalidades",description:"Ganale a equipos de alta media para sumar extras.",missionMultiplier:1.15,cosmeticId:"goal_confetti"},
 ][slot];return{...base,startsAt:start.toISOString(),endsAt:end.toISOString()};
}

export function challengeCompleteV3(challenge:ChallengeV3,result:{score:[number,number];completedPasses:number;survivedSeconds:number}){
 if(challenge.rules.goldenGoal)return result.score[0]>result.score[1];
 if(challenge.rules.mustKeepCleanSheet&&result.score[1]>0)return false;
 if(challenge.rules.requiredPasses&&result.completedPasses<challenge.rules.requiredPasses)return false;
 if(challenge.id==="COMEBACK_03")return result.score[0]>result.score[1];
 if(challenge.id==="SURVIVAL")return result.survivedSeconds>=challenge.durationSeconds;
 return result.score[0]>result.score[1];
}

export const COMPETITIVE_RULES_V3={allowBoosts:false,allowAutoWin:false,allowFreeGoals:false,allowCosmetics:true,allowWeatherPhysics:false,serverAuthoritativeScore:true,minimumReconnectWindowSeconds:20,snapshotRateHz:12,inputRateHz:30} as const;

import { calculateShotQuality, shotPreparationMs } from "./gameplay-polish.ts";

export type ShotType = "PLACED" | "NORMAL" | "POWER" | "CHIP";
export type ShotVector = { x:number; y:number };

export type ShotPlayer = {
  rating:number;
  role:string;
  vx:number;
  vy:number;
};

export type ShotAttributes = {
  finishing:number;
  shotPower:number;
  technique:number;
  composure:number;
};

export type ShotPlanInput = {
  player:ShotPlayer;
  charge:number;
  distance:number;
  maximumUsefulDistance:number;
  lateralOffset:number;
  fieldHalfHeight:number;
  bodyAlignment:number;
  pressure:number;
  goalkeeperCoverage:number;
  goalkeeperRush:number;
  targetY:number;
  goalHalfHeight:number;
  forceHint?:number;
  preferredType?:ShotType|null;
  rng?:()=>number;
};

export type ShotPlan = {
  type:ShotType;
  quality:number;
  targetY:number;
  speed:number;
  preparationMs:number;
  airborneMs:number;
  accuracyScale:number;
  powerScale:number;
};

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

export const SHOT_TUNING:Record<ShotType,{minSpeed:number;maxSpeed:number;accuracy:number;power:number;prep:number}>={
  PLACED:{minSpeed:430,maxSpeed:585,accuracy:.62,power:.92,prep:1.08},
  NORMAL:{minSpeed:500,maxSpeed:700,accuracy:.90,power:1,prep:1},
  POWER:{minSpeed:650,maxSpeed:825,accuracy:1.22,power:1.11,prep:1.12},
  CHIP:{minSpeed:430,maxSpeed:570,accuracy:.78,power:.88,prep:1.16},
};

export function deriveShotAttributes(player:Pick<ShotPlayer,"rating"|"role">):ShotAttributes{
  const attacker=player.role==="DEL"||player.role==="EXT";
  const midfielder=player.role==="MED";
  const defender=player.role==="DEF";
  const keeper=player.role==="ARQ";
  return{
    finishing:clamp(player.rating+(attacker?5:midfielder?1:defender?-5:keeper?-12:0),50,99),
    shotPower:clamp(player.rating+(attacker?3:defender?2:keeper?-4:0),52,99),
    technique:clamp(player.rating+(midfielder?4:attacker?2:defender?-2:keeper?-6:0),52,99),
    composure:clamp(player.rating+(attacker?3:midfielder?2:keeper?-2:0),52,99),
  };
}

export function resolveShotType(args:{charge:number;distance:number;maximumUsefulDistance:number;goalkeeperRush:number;pressure:number;preferredType?:ShotType|null}):ShotType{
  if(args.preferredType)return args.preferredType;
  const charge=clamp(args.charge,0,1),distanceRatio=args.distance/Math.max(1,args.maximumUsefulDistance);
  const contextualChip=args.goalkeeperRush>=.72&&args.pressure<.82&&distanceRatio<=.58&&charge>=.22&&charge<=.68;
  if(contextualChip)return "CHIP";
  if(charge<=.34)return "PLACED";
  if(charge>=.76)return "POWER";
  return "NORMAL";
}

function triangular(rng:()=>number){return rng()+rng()-1}

export class ShotSystem{
  plan(input:ShotPlanInput):ShotPlan{
    const rng=input.rng??Math.random,attributes=deriveShotAttributes(input.player);
    const type=resolveShotType({charge:input.charge,distance:input.distance,maximumUsefulDistance:input.maximumUsefulDistance,goalkeeperRush:input.goalkeeperRush,pressure:input.pressure,preferredType:input.preferredType});
    const tuning=SHOT_TUNING[type];
    const baseQuality=calculateShotQuality({distance:input.distance,maximumUsefulDistance:input.maximumUsefulDistance,lateralOffset:input.lateralOffset,fieldHalfHeight:input.fieldHalfHeight,finishing:attributes.finishing,bodyAlignment:input.bodyAlignment,pressure:input.pressure,goalkeeperCoverage:input.goalkeeperCoverage});
    const technique=(attributes.technique*.58+attributes.composure*.42)/100;
    const typeBonus=type==="PLACED"?.07:type==="CHIP"?clamp(input.goalkeeperRush-.62,0,.2):type==="POWER"?-.035:0;
    const quality=clamp(baseQuality+typeBonus+(technique-.75)*.10,.05,.97);
    const distanceRatio=clamp(input.distance/Math.max(1,input.maximumUsefulDistance),0,1.2);
    const ratingPower=clamp((attributes.shotPower-55)/44,0,1);
    const charge=clamp(input.charge,0,1);
    const nominal=tuning.minSpeed+(tuning.maxSpeed-tuning.minSpeed)*clamp(distanceRatio*.46+ratingPower*.30+charge*.24,0,1);
    const hinted=input.forceHint?clamp(input.forceHint,tuning.minSpeed,tuning.maxSpeed):nominal;
    const speed=clamp(hinted*tuning.power*(.94+quality*.09),tuning.minSpeed,tuning.maxSpeed);
    const errorAmplitude=input.goalHalfHeight*(.18+(1-quality)*1.05)*tuning.accuracy;
    const targetY=input.targetY+triangular(rng)*errorAmplitude;
    const preparation=Math.round(clamp(shotPreparationMs(input.bodyAlignment,input.pressure,input.player.rating)*tuning.prep,76,205));
    const airborneMs=type==="CHIP"?Math.round(clamp(170+input.goalkeeperRush*130+distanceRatio*90,190,360)):0;
    return{type,quality,targetY,speed,preparationMs:preparation,airborneMs,accuracyScale:tuning.accuracy,powerScale:tuning.power};
  }
}

export function shotTypeLabel(type:ShotType,lang:"es"|"en"="es"){
  const labels:Record<ShotType,[string,string]>={PLACED:["COLOCADO","PLACED"],NORMAL:["NORMAL","NORMAL"],POWER:["POTENTE","POWER"],CHIP:["VASELINA","CHIP"]};
  return lang==="es"?labels[type][0]:labels[type][1];
}

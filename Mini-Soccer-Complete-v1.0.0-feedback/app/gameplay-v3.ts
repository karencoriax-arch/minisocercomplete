export type PlayerRole="DEL"|"EXT"|"MED"|"DEF"|"ARQ"|string;
export type TraitId="POWER_SHOT"|"FINESSE"|"PLAYMAKER"|"SPRINTER"|"BALL_WINNER"|"ENGINE"|"REFLEX_KEEPER"|"FINISHER"|"PRESS_RESISTANT"|"LONG_PASS";
export type ShotType="NORMAL"|"FINESSE"|"POWER"|"CHIP";
export type WeatherType="CLEAR"|"NIGHT"|"RAIN"|"SNOW"|"CLOUDY"|"SUNSET";

export interface PlayerAttributes {pace:number;pass:number;shoot:number;control:number;defense:number;stamina:number;keeper:number;traits:TraitId[]}
export interface ShotInput {type:ShotType;charge:number;distance:number;maximumUsefulDistance:number;finishing:number;bodyAlignment:number;pressure:number;goalkeeperCoverage:number;lateralOffset:number;fieldHalfHeight:number;}
export interface ShotModel {forceMultiplier:number;precisionMultiplier:number;verticalBias:number;preparationMultiplier:number;quality:number;errorMultiplier:number;}
export interface WeatherModifiers {ballDragMultiplier:number;ballBounceMultiplier:number;playerAccelerationMultiplier:number;playerMaxSpeedMultiplier:number;visualParticles:number;}

const clamp=(value:number,min=0,max=100)=>Math.max(min,Math.min(max,value));
const hash=(text:string)=>{let value=2166136261;for(let i=0;i<text.length;i++){value^=text.charCodeAt(i);value=Math.imul(value,16777619)}return Math.abs(value>>>0)};
const jitter=(name:string,salt:string,range=5)=>((hash(`${name}:${salt}`)%1001)/1000-.5)*range*2;

export function derivePlayerAttributes(name:string,rating:number,role:PlayerRole):PlayerAttributes{
  const r=clamp(rating,45,99);let pace=r,pass=r,shoot=r,control=r,defense=r,stamina=r,keeper=35;
  if(role==="DEL"){shoot+=5;pace+=3;control+=2;pass-=2;defense-=14;stamina-=1}
  else if(role==="EXT"){pace+=6;control+=4;pass+=1;shoot+=1;defense-=11;stamina+=1}
  else if(role==="MED"){pass+=6;control+=4;stamina+=4;shoot-=1;defense+=1;pace-=1}
  else if(role==="DEF"){defense+=8;stamina+=3;pass-=1;shoot-=9;pace-=2;control-=1}
  else if(role==="ARQ"){keeper=r+7;defense+=2;pass-=2;shoot=35;pace=r-16;control=r-8;stamina=r-5}
  pace=clamp(pace+jitter(name,"pace"));pass=clamp(pass+jitter(name,"pass"));shoot=clamp(shoot+jitter(name,"shoot"));control=clamp(control+jitter(name,"control"));defense=clamp(defense+jitter(name,"defense"));stamina=clamp(stamina+jitter(name,"stamina"));keeper=clamp(keeper+jitter(name,"keeper",3));
  return{pace,pass,shoot,control,defense,stamina,keeper,traits:deriveTraits(name,rating,role,{pace,pass,shoot,control,defense,stamina,keeper,traits:[]})};
}

export function deriveTraits(name:string,rating:number,role:PlayerRole,a:PlayerAttributes):TraitId[]{
  const result:TraitId[]=[];
  if(a.shoot>=89)result.push("FINISHER");if(a.shoot>=87&&hash(name)%3===0)result.push("POWER_SHOT");if(a.control>=88&&a.shoot>=84)result.push("FINESSE");
  if(a.pass>=89)result.push("PLAYMAKER");if(a.pass>=86&&hash(name+"long")%2===0)result.push("LONG_PASS");if(a.pace>=90)result.push("SPRINTER");
  if(a.defense>=88)result.push("BALL_WINNER");if(a.stamina>=90)result.push("ENGINE");if(a.control>=88&&a.pass>=85)result.push("PRESS_RESISTANT");if(role==="ARQ"&&a.keeper>=88)result.push("REFLEX_KEEPER");
  const cap=rating>=90?3:rating>=85?2:1;return result.slice(0,cap);
}

export function calculateShotV3(input:ShotInput):ShotModel{
  const distanceScore=1-Math.min(1,input.distance/Math.max(1,input.maximumUsefulDistance));
  const lateralScore=1-Math.min(1,Math.abs(input.lateralOffset)/Math.max(1,input.fieldHalfHeight));
  const finishing=Math.max(0,Math.min(1,(input.finishing-55)/45));
  const alignment=Math.max(0,Math.min(1,(input.bodyAlignment+1)/2));
  const pressure=Math.max(0,Math.min(1,input.pressure)),keeper=Math.max(0,Math.min(1,input.goalkeeperCoverage)),charge=Math.max(0,Math.min(1,input.charge));
  const baseQuality=Math.max(.04,Math.min(1,distanceScore*.28+lateralScore*.1+finishing*.31+alignment*.21+(1-pressure)*.18-keeper*.12));
  const type=input.type;
  const traitLikeFinishing=finishing>.74;
  let forceMultiplier=1,precisionMultiplier=1,verticalBias=0,preparationMultiplier=1,errorMultiplier=1;
  if(type==="FINESSE"){forceMultiplier=.86;precisionMultiplier=1.2;preparationMultiplier=1.08;errorMultiplier=.72}
  if(type==="POWER"){forceMultiplier=1.22;precisionMultiplier=.82;preparationMultiplier=1.28;errorMultiplier=1.22}
  if(type==="CHIP"){forceMultiplier=.74;precisionMultiplier=.93;verticalBias=(keeper>.45?.75:.42);preparationMultiplier=1.16;errorMultiplier=1.05}
  if(type==="NORMAL"){forceMultiplier=.94+charge*.16;precisionMultiplier=.98+traitLikeFinishing*.04}
  const quality=Math.max(.03,Math.min(1,baseQuality*precisionMultiplier));
  return{forceMultiplier,precisionMultiplier,verticalBias,preparationMultiplier,quality,errorMultiplier};
}

export const WEATHER_V3:Record<WeatherType,WeatherModifiers>={
  CLEAR:{ballDragMultiplier:1,ballBounceMultiplier:1,playerAccelerationMultiplier:1,playerMaxSpeedMultiplier:1,visualParticles:0},
  NIGHT:{ballDragMultiplier:1,ballBounceMultiplier:1,playerAccelerationMultiplier:1,playerMaxSpeedMultiplier:1,visualParticles:0},
  CLOUDY:{ballDragMultiplier:1.01,ballBounceMultiplier:.99,playerAccelerationMultiplier:1,playerMaxSpeedMultiplier:1,visualParticles:0},
  SUNSET:{ballDragMultiplier:1,ballBounceMultiplier:1,playerAccelerationMultiplier:1,playerMaxSpeedMultiplier:1,visualParticles:0},
  RAIN:{ballDragMultiplier:.965,ballBounceMultiplier:.91,playerAccelerationMultiplier:.975,playerMaxSpeedMultiplier:.985,visualParticles:90},
  SNOW:{ballDragMultiplier:1.045,ballBounceMultiplier:.84,playerAccelerationMultiplier:.94,playerMaxSpeedMultiplier:.96,visualParticles:75},
};

export function selectWeather(stadium:string,seed=0):WeatherType{
  const value=(hash(stadium)+seed)%100;
  if(stadium.includes("Nevado"))return value<70?"SNOW":"CLOUDY";
  if(stadium.includes("Neón")||stadium.includes("Nocturna"))return value<82?"NIGHT":"RAIN";
  if(stadium.includes("Costera"))return value<55?"SUNSET":value<72?"RAIN":"CLEAR";
  return value<12?"RAIN":value<25?"CLOUDY":value<40?"SUNSET":"CLEAR";
}

export function weatherBallVelocity(v:{x:number;y:number},weather:WeatherType,dt:number){const m=WEATHER_V3[weather],factor=Math.pow(m.ballDragMultiplier,Math.max(0,dt)*60);return{x:v.x*factor,y:v.y*factor}}
export function weatherPlayerAcceleration(base:number,weather:WeatherType){return base*WEATHER_V3[weather].playerAccelerationMultiplier}
export function weatherPlayerSpeed(base:number,weather:WeatherType){return base*WEATHER_V3[weather].playerMaxSpeedMultiplier}

export interface BallFeedback {impact:number;shake:number;trail:number;pitch:number;}
export function ballFeedback(speed:number,type:"PASS"|"SHOT"|"POST"|"SAVE"|"BLOCK"):BallFeedback{
  const normalized=Math.max(0,Math.min(1,speed/720)),weight=type==="POST"?1.25:type==="SHOT"?1.08:type==="SAVE"?.92:type==="BLOCK"?.78:.58;
  return{impact:Math.min(1,normalized*weight),shake:Math.min(1,normalized*weight*.72),trail:type==="SHOT"?normalized:type==="PASS"?normalized*.38:0,pitch:120+normalized*420+(type==="POST"?180:0)};
}

export function fatigueMultiplier(stamina:number,attributes:PlayerAttributes){const current=Math.max(0,Math.min(100,stamina));if(current>=45)return 1;const resistance=.78+attributes.stamina/100*.22;return Math.max(.78,.86+(current/45)*.14)*resistance}

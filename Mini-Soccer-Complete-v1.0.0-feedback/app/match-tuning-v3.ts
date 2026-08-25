import type { ShotType, WeatherType } from "./gameplay-v3";

export const SHOT_TYPES_V3:ShotType[]=["NORMAL","FINESSE","POWER","CHIP"];
export const SHOT_TUNING_V3:Record<ShotType,{force:number;error:number;prep:number;label:string}>={
 NORMAL:{force:1,error:1,prep:1,label:"NORMAL"},
 FINESSE:{force:.88,error:.68,prep:1.06,label:"COLOCADO"},
 POWER:{force:1.23,error:1.24,prep:1.2,label:"POTENTE"},
 CHIP:{force:.76,error:1.02,prep:1.12,label:"VASelina"},
};
export function nextShotTypeV3(current:ShotType){const index=SHOT_TYPES_V3.indexOf(current);return SHOT_TYPES_V3[(index+1)%SHOT_TYPES_V3.length]}
export function shotTuningV3(type:ShotType){return SHOT_TUNING_V3[type]??SHOT_TUNING_V3.NORMAL}
export function weatherPhysicsEnabledV3(competitive:boolean,weather:WeatherType){return !competitive&&(weather==="RAIN"||weather==="SNOW")}
export function attributePaceFactor(pace:number){return .86+Math.max(0,Math.min(100,pace))/100*.18}
export function attributePassFactor(pass:number){return .9+Math.max(0,Math.min(100,pass))/100*.16}

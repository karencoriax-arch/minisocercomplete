export type PublicMatchFormat = 3|4|5|6;
export type MatchFormat = 2|PublicMatchFormat;

export type MatchConfig = {
  players:MatchFormat;
  label:string;
  recommended:boolean;
  pitchWidth:number;
  pitchHeight:number;
  minTeammateRatio:number;
  supportRatio:number;
  rotationFreedom:number;
  structureDiscipline:number;
  transitionTempo:number;
  periodSeconds:number;
  formation:Array<{x:number;y:number;role:"ARQ"|"DEF"|"MED"|"DEL"}>;
};

export const MATCH_FORMATS:Record<MatchFormat,MatchConfig>={
  2:{players:2,label:"2v2 Legacy",recommended:false,pitchWidth:1200,pitchHeight:680,minTeammateRatio:.058,supportRatio:.15,rotationFreedom:1,structureDiscipline:.35,transitionTempo:1.08,periodSeconds:120,formation:[{x:10,y:50,role:"ARQ"},{x:70,y:50,role:"DEL"}]},
  3:{players:3,label:"3v3 Móvil",recommended:true,pitchWidth:1320,pitchHeight:740,minTeammateRatio:.105,supportRatio:.19,rotationFreedom:.88,structureDiscipline:.66,transitionTempo:1,periodSeconds:135,formation:[{x:76,y:50,role:"DEL"},{x:40,y:50,role:"MED"},{x:8,y:50,role:"ARQ"}]},
  4:{players:4,label:"4v4 Móvil",recommended:false,pitchWidth:1512,pitchHeight:821,minTeammateRatio:.096,supportRatio:.17,rotationFreedom:.92,structureDiscipline:.62,transitionTempo:1.05,periodSeconds:135,formation:[{x:73,y:50,role:"DEL"},{x:43,y:24,role:"MED"},{x:43,y:76,role:"MED"},{x:9,y:50,role:"ARQ"}]},
  5:{players:5,label:"5v5 Legacy",recommended:false,pitchWidth:1687,pitchHeight:899,minTeammateRatio:.105,supportRatio:.19,rotationFreedom:.72,structureDiscipline:.79,transitionTempo:.98,periodSeconds:150,formation:[{x:78,y:50,role:"DEL"},{x:55,y:25,role:"MED"},{x:55,y:75,role:"MED"},{x:31,y:50,role:"DEF"},{x:8,y:50,role:"ARQ"}]},
  6:{players:6,label:"6v6 Legacy",recommended:false,pitchWidth:1898,pitchHeight:994,minTeammateRatio:.10,supportRatio:.185,rotationFreedom:.48,structureDiscipline:.92,transitionTempo:.91,periodSeconds:165,formation:[{x:79,y:50,role:"DEL"},{x:55,y:27,role:"MED"},{x:55,y:73,role:"MED"},{x:31,y:30,role:"DEF"},{x:31,y:70,role:"DEF"},{x:7,y:50,role:"ARQ"}]},
};

// v1.2.0 Mobile exposes only 3v3 and 4v4. 5v5/6v6 stay internally
// available only to read old saves safely; they are no longer selectable.
export const PUBLIC_FORMATS:PublicMatchFormat[]=[3,4];

export function matchConfig(format:MatchFormat){return MATCH_FORMATS[format]}

export function scaledSpacing(format:MatchFormat,pitchWidth:number){
  const config=MATCH_FORMATS[format];
  return {minimum:pitchWidth*config.minTeammateRatio,support:pitchWidth*config.supportRatio};
}

export function formatRoles(format:PublicMatchFormat){return MATCH_FORMATS[format].formation.map(slot=>slot.role)}

import type { CosmeticKind, ProgressStateV3 } from "./progression-v3";
export type EquippedCosmeticsV3=ProgressStateV3["equipped"];
export interface BallSkinV3{fill:string;mark:string;glow:string;}
export interface TrailSkinV3{width:number;alpha:number;pattern:"SOLID"|"SPARK";}
export const BALL_SKINS_V3:Record<string,BallSkinV3>={ball_classic:{fill:"#ffffff",mark:"#111827",glow:"transparent"},ball_retro:{fill:"#d7b98e",mark:"#5b3b1f",glow:"transparent"},ball_neon:{fill:"#d9ff45",mark:"#071008",glow:"rgba(217,255,69,.7)"},ball_gold:{fill:"#facc15",mark:"#713f12",glow:"rgba(250,204,21,.55)"},ball_galaxy:{fill:"#c4b5fd",mark:"#312e81",glow:"rgba(139,92,246,.75)"}};
export const TRAIL_SKINS_V3:Record<string,{color:string;secondary:string;style:TrailSkinV3}>={trail_lime:{color:"#d9ff45",secondary:"#84cc16",style:{width:6,alpha:.38,pattern:"SOLID"}},trail_fire:{color:"#fb923c",secondary:"#ef4444",style:{width:8,alpha:.48,pattern:"SPARK"}},trail_ice:{color:"#7dd3fc",secondary:"#e0f2fe",style:{width:7,alpha:.44,pattern:"SPARK"}},trail_stars:{color:"#e9d5ff",secondary:"#facc15",style:{width:9,alpha:.52,pattern:"SPARK"}}};
export function ballSkinV3(equipped:EquippedCosmeticsV3){return BALL_SKINS_V3[equipped.BALL??"ball_classic"]??BALL_SKINS_V3.ball_classic}
export function trailSkinV3(equipped:EquippedCosmeticsV3){return equipped.TRAIL?TRAIL_SKINS_V3[equipped.TRAIL]??null:null}
export function hudClassV3(equipped:EquippedCosmeticsV3){const id=equipped.HUD??"hud_classic";return `cosmetic-${id.replace(/[^a-z0-9_-]/gi,"")}`}
export function goalFxClassV3(equipped:EquippedCosmeticsV3){const id=equipped.GOAL_FX??"";return id?`goal-fx-${id.replace(/^goal_/,"")}`:""}
export function equippedCosmeticId(equipped:EquippedCosmeticsV3,kind:CosmeticKind){return equipped[kind]??null}

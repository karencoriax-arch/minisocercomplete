"use client";

import { useMemo, useState } from "react";
import type { EconomyState } from "./economy-v2";
import { WalletBar } from "./economy-v2-ui";
import {
  COSMETIC_CATALOG,
  buyCosmetic,
  collectionProgress,
  cosmeticById,
  cosmeticsByCategory,
  equipCosmetic,
  equippedCosmetics,
  type CosmeticCategory,
  type CosmeticItem,
  type CustomizationState,
} from "./customization-v22";

type Lang="es"|"en";
const tr=(lang:Lang,es:string,en:string)=>lang==="es"?es:en;
const fmt=(value:number)=>new Intl.NumberFormat("es-AR").format(value);

const TABS:Array<{id:CosmeticCategory;icon:string;label:[string,string]}>= [
  {id:"KIT",icon:"👕",label:["Camisetas","Kits"]},
  {id:"BALL",icon:"⚽",label:["Pelotas","Balls"]},
  {id:"TRAIL",icon:"➜",label:["Estelas","Trails"]},
  {id:"GOAL_EFFECT",icon:"✹",label:["Efectos de gol","Goal effects"]},
  {id:"CELEBRATION",icon:"★",label:["Celebraciones","Celebrations"]},
  {id:"HUD_THEME",icon:"▣",label:["Temas HUD","HUD themes"]},
];

function Preview({item}:{item:CosmeticItem}){
  return <div className={`v22-preview preview-${item.category.toLowerCase()}`} style={{"--v22-primary":item.preview.primary,"--v22-secondary":item.preview.secondary,"--v22-accent":item.preview.accent??item.preview.secondary} as React.CSSProperties}>
    <span className="v22-preview-glow"/>
    {item.category==="KIT"&&<div className="v22-shirt-preview"><i/><b>MSC</b></div>}
    {item.category==="BALL"&&<div className="v22-ball-preview"><i/><i/><i/></div>}
    {item.category==="TRAIL"&&<div className="v22-trail-preview"><i/><b>⚽</b></div>}
    {item.category==="GOAL_EFFECT"&&<div className="v22-goal-preview"><b>GOOOL</b><i/><i/><i/></div>}
    {item.category==="CELEBRATION"&&<div className="v22-celebration-preview"><b>{item.icon}</b><span>GOAL!</span></div>}
    {item.category==="HUD_THEME"&&<div className="v22-hud-preview"><header><i/><b>2 - 1</b><i/></header><footer><span>PAS</span><span>TIR</span></footer></div>}
  </div>;
}

export function StoreV22({lang,economy,customization,onEconomyChange,onCustomizationChange,onBack}:{lang:Lang;economy:EconomyState;customization:CustomizationState;onEconomyChange:(state:EconomyState)=>void;onCustomizationChange:(state:CustomizationState)=>void;onBack:()=>void}){
  const [tab,setTab]=useState<CosmeticCategory>("KIT"),[notice,setNotice]=useState("");
  const progress=collectionProgress(customization),items=useMemo(()=>cosmeticsByCategory(tab),[tab]);
  const flash=(text:string)=>{setNotice(text);window.setTimeout(()=>setNotice(""),1500)};
  const buy=(item:CosmeticItem)=>{
    const result=buyCosmetic(economy,customization,item.id);
    if(!result.ok){flash(result.reason==="OWNED"?tr(lang,"Ya lo tenés.","Already owned."):result.reason==="MSC"?tr(lang,"No alcanzan tus MSC.","Not enough MSC."):tr(lang,"Elemento inválido.","Invalid item."));return}
    onEconomyChange(result.economy);onCustomizationChange(result.state);flash(tr(lang,"Desbloqueado para siempre.","Permanently unlocked."));
  };
  const equip=(item:CosmeticItem)=>{
    const key={KIT:"kit",BALL:"ball",TRAIL:"trail",GOAL_EFFECT:"goalEffect",CELEBRATION:"celebration",HUD_THEME:"hudTheme"}[item.category] as keyof CustomizationState["equipped"];
    const active=customization.equipped[key]===item.id;
    if(item.category==="KIT"&&!active&&economy.equippedKitId!==null)onEconomyChange({...economy,equippedKitId:null});
    onCustomizationChange(equipCosmetic(customization,active?null:item.id,item.category));
  };
  return <div className="page-shell v22-store-page">
    <button className="back" onClick={onBack}>← {tr(lang,"CLUB MSC","MSC CLUB")}</button>
    <div className="v22-store-head"><div><span className="eyebrow">MINI SOCCER COMPLETE 2.2</span><h1>{tr(lang,"TIENDA 2.0","STORE 2.0")}</h1><p>{tr(lang,"Personalización completa. Todo lo de esta tienda es visual: nunca mejora velocidad, pase, tiro, defensa ni IA.","Full customization. Everything in this store is visual: it never improves speed, passing, shooting, defense or AI.")}</p></div><WalletBar state={economy} lang={lang}/></div>
    <section className="v22-collection-strip"><div><small>{tr(lang,"COLECCIÓN","COLLECTION")}</small><b>{progress.owned}/{progress.total}</b><em><i style={{width:`${progress.percent}%`}}/></em></div><div><small>{tr(lang,"MSC GASTADOS EN COSMÉTICOS","MSC SPENT ON COSMETICS")}</small><b>{fmt(customization.totalSpentMsc)}</b></div><div><small>{tr(lang,"EQUIPADOS","EQUIPPED")}</small><b>{equippedCosmetics(customization).length}/6</b></div></section>
    <nav className="v22-tabs">{TABS.map(item=><button key={item.id} className={tab===item.id?"active":""} onClick={()=>setTab(item.id)}><span>{item.icon}</span><b>{tr(lang,...item.label)}</b></button>)}</nav>
    {notice&&<div className="v2-notice">{notice}</div>}
    <div className="v22-category-head"><div><span className="eyebrow">{tr(lang,"SOLO COSMÉTICO","COSMETIC ONLY")}</span><h2>{tr(lang,...(TABS.find(x=>x.id===tab)?.label??["Colección","Collection"]))}</h2></div><small>{items.length} {tr(lang,"elementos","items")}</small></div>
    <section className="v22-grid">{items.map(item=>{
      const owned=customization.owned.includes(item.id),key={KIT:"kit",BALL:"ball",TRAIL:"trail",GOAL_EFFECT:"goalEffect",CELEBRATION:"celebration",HUD_THEME:"hudTheme"}[item.category] as keyof CustomizationState["equipped"],equipped=customization.equipped[key]===item.id;
      return <article key={item.id} className={`v22-card rarity-${item.rarity.toLowerCase()} ${equipped?"equipped":""}`}><Preview item={item}/><div className="v22-card-copy"><small>{item.rarity}</small><h3>{tr(lang,...item.name)}</h3><p>{tr(lang,...item.description)}</p></div><footer>{owned?<button className={equipped?"equipped":""} onClick={()=>equip(item)}>{equipped?`✓ ${tr(lang,"EQUIPADO","EQUIPPED")}`:tr(lang,"EQUIPAR","EQUIP")}</button>:<button onClick={()=>buy(item)}><b>{fmt(item.price)} MSC</b><small>{tr(lang,"COMPRAR","BUY")}</small></button>}</footer></article>
    })}</section>
    <section className="v22-loadout"><div><span className="eyebrow">{tr(lang,"TU ESTILO ACTUAL","YOUR CURRENT STYLE")}</span><h2>{tr(lang,"Equipamiento cosmético","Cosmetic loadout")}</h2></div><div>{TABS.map(tabItem=>{const key={KIT:"kit",BALL:"ball",TRAIL:"trail",GOAL_EFFECT:"goalEffect",CELEBRATION:"celebration",HUD_THEME:"hudTheme"}[tabItem.id] as keyof CustomizationState["equipped"],item=cosmeticById(customization.equipped[key]);return <span key={tabItem.id}><i>{tabItem.icon}</i><small>{tr(lang,...tabItem.label)}</small><b>{item?tr(lang,...item.name):tr(lang,"Predeterminado","Default")}</b></span>})}</div></section>
  </div>;
}

export function GameplayCosmeticLayer({customization,goalActive}:{customization:CustomizationState;goalActive:boolean}){
  const trail=cosmeticById(customization.equipped.trail),goal=cosmeticById(customization.equipped.goalEffect),celebration=cosmeticById(customization.equipped.celebration);
  if(!goalActive&&!trail)return null;
  return <div className="v22-game-cosmetics" aria-hidden="true">
    {trail&&<span className="v22-game-trail" style={{"--v22-trail":trail.preview.primary} as React.CSSProperties}/>} 
    {goalActive&&goal&&<span className={`v22-live-goal ${goal.id}`} style={{"--v22-goal":goal.preview.primary,"--v22-goal2":goal.preview.secondary} as React.CSSProperties}><i/><i/><i/></span>}
    {goalActive&&celebration&&<span className="v22-live-celebration" style={{"--v22-celebration":celebration.preview.primary} as React.CSSProperties}>{celebration.icon}</span>}
  </div>;
}

export const V22_COSMETIC_COUNT=COSMETIC_CATALOG.length;

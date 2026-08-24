"use client";

import { useMemo, useState } from "react";
import {
  GEM_BOOSTS,
  MISSION_CATALOG,
  RESOURCE_CATALOG,
  buyKit,
  buyResource,
  claimMission,
  consumeMatchSelection,
  equipKit,
  nationalKitCatalog,
  refreshDailyMissions,
  type EconomyLang,
  type EconomyState,
  type EconomyTeam,
  type GemBoostId,
  type MatchBoostSelection,
  type MatchEconomyReward,
  type ResourceId,
} from "./economy-v2";

const tr=(lang:EconomyLang,es:string,en:string)=>lang==="es"?es:en;
const fmt=(value:number)=>new Intl.NumberFormat("es-AR").format(value);

export function WalletBar({state,lang,compact=false}:{state:EconomyState;lang:EconomyLang;compact?:boolean}){
  return <div className={`v2-wallet ${compact?"compact":""}`}>
    <span className="coin"><i>MSC</i><b>{fmt(state.msc)}</b></span>
    <span className="gems"><i>◆</i><b>{fmt(state.gems)}</b></span>
    {!compact&&<span className="gem-progress"><small>{tr(lang,"PRÓXIMAS 10 GEMAS","NEXT 10 GEMS")}</small><b>{state.realWinStreakProgress}/5 {tr(lang,"victorias","wins")}</b><em><i style={{width:`${state.realWinStreakProgress*20}%`}}/></em></span>}
  </div>;
}

export function EconomyHub({lang,state:rawState,teams,onChange,onBack}:{lang:EconomyLang;state:EconomyState;teams:EconomyTeam[];onChange:(state:EconomyState)=>void;onBack:()=>void}){
  const state=refreshDailyMissions(rawState),[tab,setTab]=useState<"KITS"|"RESOURCES"|"INVENTORY"|"MISSIONS">("KITS"),[notice,setNotice]=useState("");
  const kits=useMemo(()=>nationalKitCatalog(teams),[teams]);
  const flash=(text:string)=>{setNotice(text);window.setTimeout(()=>setNotice(""),1300)};
  const purchaseKit=(id:string,price:number)=>{const result=buyKit(state,id,price);if(!result.ok){flash(result.reason==="OWNED"?tr(lang,"Ya la tenés.","Already owned."):tr(lang,"No tenés suficientes MSC.","Not enough MSC."));return}onChange(result.state);flash(tr(lang,"Camiseta desbloqueada para siempre.","Kit permanently unlocked."))};
  const purchaseResource=(id:ResourceId)=>{const result=buyResource(state,id);if(!result.ok){flash(tr(lang,"No tenés suficientes MSC.","Not enough MSC."));return}onChange(result.state);flash(tr(lang,"Recurso agregado al inventario.","Resource added to inventory."))};
  const claim=(id:(typeof MISSION_CATALOG)[number]["id"])=>{const result=claimMission(state,id);if(!result.ok)return;onChange(result.state);flash(tr(lang,"Recompensa cobrada.","Reward claimed."))};
  return <div className="page-shell v2-economy-page">
    <button className="back" onClick={onBack}>← {tr(lang,"INICIO","HOME")}</button>
    <div className="v2-economy-head"><div><span className="eyebrow">MINI SOCCER COMPLETE 2.0</span><h1>{tr(lang,"CLUB MSC","MSC CLUB")}</h1><p>{tr(lang,"Jugá, completá misiones y usá tus recompensas para personalizar o preparar cada partido.","Play, complete missions and use rewards to customize or prepare each match.")}</p></div><WalletBar state={state} lang={lang}/></div>
    <nav className="v2-economy-tabs"><button className={tab==="KITS"?"active":""} onClick={()=>setTab("KITS")}>👕 {tr(lang,"CAMISETAS","KITS")}</button><button className={tab==="RESOURCES"?"active":""} onClick={()=>setTab("RESOURCES")}>⚡ {tr(lang,"RECURSOS","RESOURCES")}</button><button className={tab==="INVENTORY"?"active":""} onClick={()=>setTab("INVENTORY")}>▦ {tr(lang,"INVENTARIO","INVENTORY")}</button><button className={tab==="MISSIONS"?"active":""} onClick={()=>setTab("MISSIONS")}>✓ {tr(lang,"MISIONES","MISSIONS")}</button></nav>
    {notice&&<div className="v2-notice">{notice}</div>}
    {tab==="KITS"&&<section><div className="v2-section-title"><div><span className="eyebrow">{tr(lang,"COLECCIÓN DE SELECCIONES","NATIONAL TEAM COLLECTION")}</span><h2>{tr(lang,"Comprás una vez. Es tuya para siempre.","Buy once. Keep forever.")}</h2></div><small>{tr(lang,"Precio según nivel de la selección: 5.000 / 8.000 / 12.000 MSC","Price by team tier: 5,000 / 8,000 / 12,000 MSC")}</small></div><div className="v2-kit-grid">{kits.map(kit=>{const owned=state.inventory.kits.includes(kit.id),equipped=state.equippedKitId===kit.id;return <article className={`v2-kit-card ${equipped?"equipped":""}`} key={kit.id}><div className="v2-shirt" style={{"--kit-main":kit.color,"--kit-accent":kit.accent} as React.CSSProperties}><i/><b>{kit.short}</b></div><div><span>{kit.rating>=89?tr(lang,"MUY GRANDE","ELITE"):kit.rating>=85?tr(lang,"GRANDE","MAJOR"):tr(lang,"SELECCIÓN","NATIONAL TEAM")}</span><h3>{kit.name}</h3><p>{kit.rating} {tr(lang,"MEDIA","RATING")}</p></div><footer>{owned?<button className={equipped?"equipped":""} onClick={()=>onChange(equipKit(state,equipped?null:kit.id))}>{equipped?`✓ ${tr(lang,"EQUIPADA","EQUIPPED")}`:tr(lang,"EQUIPAR","EQUIP")}</button>:<button onClick={()=>purchaseKit(kit.id,kit.price)}><b>{fmt(kit.price)} MSC</b><small>{tr(lang,"COMPRAR","BUY")}</small></button>}</footer></article>})}</div></section>}
    {tab==="RESOURCES"&&<section><div className="v2-section-title"><div><span className="eyebrow">{tr(lang,"AYUDAS CONSUMIBLES","CONSUMABLE ASSISTS")}</span><h2>{tr(lang,"Compralas acá o justo antes del partido.","Buy here or right before a match.")}</h2></div><small>{tr(lang,"Una unidad se consume al iniciar el partido.","One unit is consumed when the match starts.")}</small></div><div className="v2-resource-grid">{RESOURCE_CATALOG.map(item=><article key={item.id}><span className="resource-icon">{item.icon}</span><div><small>{state.inventory.resources[item.id]} {tr(lang,"DISPONIBLES","AVAILABLE")}</small><h3>{tr(lang,...item.name)}</h3><p>{tr(lang,...item.description)}</p></div><button onClick={()=>purchaseResource(item.id)}><b>{fmt(item.price)} MSC</b><small>{tr(lang,"COMPRAR 1","BUY 1")}</small></button></article>)}</div><div className="v2-gem-info"><span>◆</span><div><h3>{tr(lang,"Las gemas no se compran en esta versión","Gems cannot be purchased in this version")}</h3><p>{tr(lang,"Cada 5 victorias jugadas recibís 10 gemas. Se usan para ventajas excepcionales antes del partido.","Every 5 played wins grants 10 gems. They are used for exceptional pre-match advantages.")}</p></div></div></section>}
    {tab==="INVENTORY"&&<section><div className="v2-section-title"><div><span className="eyebrow">{tr(lang,"TU COLECCIÓN","YOUR COLLECTION")}</span><h2>{tr(lang,"Todo lo que ya desbloqueaste.","Everything you have unlocked.")}</h2></div></div><div className="v2-inventory-summary"><article><b>{state.inventory.kits.length}</b><span>{tr(lang,"CAMISETAS","KITS")}</span><p>{state.equippedKitId?`${tr(lang,"Equipada","Equipped")}: ${kits.find(kit=>kit.id===state.equippedKitId)?.name??state.equippedKitId}`:tr(lang,"Usando colores normales del equipo.","Using normal team colors.")}</p></article><article><b>{Object.values(state.inventory.resources).reduce((a,b)=>a+b,0)}</b><span>{tr(lang,"RECURSOS","RESOURCES")}</span><div>{RESOURCE_CATALOG.map(item=><small key={item.id}>{item.icon} {tr(lang,...item.name)} ×{state.inventory.resources[item.id]}</small>)}</div></article><article><b>{fmt(state.totalEarnedMsc)}</b><span>MSC {tr(lang,"GANADOS","EARNED")}</span><p>{tr(lang,"Histórico acumulado; gastar monedas no lo reduce.","Lifetime earned; spending coins does not reduce it.")}</p></article></div></section>}
    {tab==="MISSIONS"&&<section><div className="v2-section-title"><div><span className="eyebrow">{tr(lang,"MISIONES DIARIAS","DAILY MISSIONS")}</span><h2>{tr(lang,"Objetivos coherentes con lo que pasa en la cancha.","Objectives tied to real match actions.")}</h2></div><small>{state.missionDay}</small></div><div className="v2-mission-list">{MISSION_CATALOG.map(mission=>{const progress=Math.min(mission.target,state.missionProgress[mission.id]??0),done=progress>=mission.target,claimed=state.claimedMissions.includes(mission.id);return <article className={`${done?"done":""} ${claimed?"claimed":""}`} key={mission.id}><span>{mission.icon}</span><div><small>{tr(lang,...mission.name)}</small><h3>{tr(lang,...mission.description)}</h3><em><i style={{width:`${Math.min(100,progress/mission.target*100)}%`}}/></em><p>{progress}/{mission.target}</p></div><button disabled={!done||claimed} onClick={()=>claim(mission.id)}>{claimed?`✓ ${tr(lang,"COBRADA","CLAIMED")}`:`+${mission.reward} MSC`}</button></article>})}</div></section>}
  </div>;
}

export function PreMatchResources({lang,state,onChange,onBack,onPlay,onAutoWin}:{lang:EconomyLang;state:EconomyState;onChange:(state:EconomyState)=>void;onBack:()=>void;onPlay:(selection:MatchBoostSelection,nextState:EconomyState)=>void;onAutoWin:(nextState:EconomyState)=>void}){
  const [selected,setSelected]=useState<ResourceId[]>([]),[gemBoost,setGemBoost]=useState<GemBoostId|null>(null),[notice,setNotice]=useState("");
  const flash=(text:string)=>{setNotice(text);window.setTimeout(()=>setNotice(""),1400)};
  const directBuy=(id:ResourceId)=>{const result=buyResource(state,id);if(!result.ok){flash(tr(lang,"No tenés suficientes MSC.","Not enough MSC."));return}onChange(result.state);flash(tr(lang,"Comprado. Ya podés activarlo.","Purchased. You can activate it now."))};
  const toggleResource=(id:ResourceId)=>{if(state.inventory.resources[id]<=0){directBuy(id);return}setSelected(current=>{const next=current.includes(id)?current.filter(item=>item!==id):[...current,id];if(id==="AI_FIRST_GOAL"&&gemBoost==="THREE_GOAL_START")setGemBoost(null);return next})};
  const selectGem=(id:GemBoostId)=>{if(state.gems<5){flash(tr(lang,"Necesitás 5 gemas.","You need 5 gems."));return}if(id==="THREE_GOAL_START")setSelected(current=>current.filter(item=>item!=="AI_FIRST_GOAL"));setGemBoost(current=>current===id?null:id)};
  const start=()=>{const selection:MatchBoostSelection={resources:selected,gemBoost};const result=consumeMatchSelection(state,selection);if(!result.ok){flash(result.reason==="GEMS"?tr(lang,"No alcanzan las gemas.","Not enough gems."):tr(lang,"Te falta un recurso seleccionado.","A selected resource is missing."));return}onPlay(selection,result.state)};
  const autoWin=()=>{const result=consumeMatchSelection(state,{resources:[],gemBoost:"AUTO_WIN"});if(!result.ok){flash(tr(lang,"Necesitás 5 gemas.","You need 5 gems."));return}onAutoWin(result.state)};
  return <div className="page-shell v2-prematch"><button className="back" onClick={onBack}>← {tr(lang,"PLANTEL","SQUAD")}</button><div className="v2-prematch-head"><div><span className="eyebrow">{tr(lang,"ÚLTIMO PASO","FINAL STEP")}</span><h1>{tr(lang,"PREPARÁ TUS RECURSOS","PREPARE YOUR RESOURCES")}</h1><p>{tr(lang,"No hace falta volver a la tienda: comprá, elegí y salí a jugar desde acá.","No need to return to the shop: buy, choose and play from here.")}</p></div><WalletBar state={state} lang={lang}/></div>{notice&&<div className="v2-notice">{notice}</div>}
    <section className="v2-prematch-resources"><h2>{tr(lang,"RECURSOS MSC","MSC RESOURCES")}</h2><div>{RESOURCE_CATALOG.map(item=>{const active=selected.includes(item.id),stock=state.inventory.resources[item.id];return <article className={active?"active":""} key={item.id}><button className="resource-main" onClick={()=>toggleResource(item.id)}><span>{item.icon}</span><div><small>{stock} {tr(lang,"EN INVENTARIO","IN INVENTORY")}</small><h3>{tr(lang,...item.name)}</h3><p>{tr(lang,...item.description)}</p></div><i>{active?"✓":stock>0?tr(lang,"USAR","USE"):tr(lang,"COMPRAR","BUY")}</i></button>{stock===0&&<button className="direct-buy" onClick={()=>directBuy(item.id)}>{fmt(item.price)} MSC</button>}</article>})}</div></section>
    <section className="v2-gem-boosts"><h2>◆ {tr(lang,"PODERES DE GEMAS","GEM POWERS")}</h2><p>{tr(lang,"Son muy fuertes, por eso las gemas solo se consiguen jugando y las victorias simuladas no generan recompensas.","They are intentionally powerful, so gems are earned only by playing and simulated wins grant no rewards.")}</p><div>{GEM_BOOSTS.map(boost=>boost.id==="AUTO_WIN"?<article key={boost.id}><span>{boost.icon}</span><div><h3>{tr(lang,...boost.name)}</h3><p>{tr(lang,...boost.description)}</p></div><button disabled={state.gems<boost.cost} onClick={autoWin}>{boost.cost} ◆ · {tr(lang,"USAR AHORA","USE NOW")}</button></article>:<article className={gemBoost===boost.id?"active":""} key={boost.id}><span>{boost.icon}</span><div><h3>{tr(lang,...boost.name)}</h3><p>{tr(lang,...boost.description)}</p></div><button disabled={state.gems<boost.cost} onClick={()=>selectGem(boost.id)}>{gemBoost===boost.id?`✓ ${tr(lang,"ACTIVA","ACTIVE")}`:`${boost.cost} ◆`}</button></article>)}</div></section>
    <div className="v2-prematch-footer"><div><b>{selected.length?`${selected.length} ${tr(lang,"recurso(s) seleccionado(s)","resource(s) selected")}`:tr(lang,"Sin recursos: partido normal","No resources: normal match")}</b>{gemBoost&&<small>◆ {tr(lang,"Ventaja de gemas activa","Gem advantage active")}</small>}</div><button className="primary big" onClick={start}>{tr(lang,"COMENZAR PARTIDO","START MATCH")} →</button></div>
  </div>;
}

export function MatchRewardPanel({lang,reward}:{lang:EconomyLang;reward:MatchEconomyReward|null}){
  if(!reward)return null;
  return <section className="v2-match-reward"><span>MSC</span><div><small>{tr(lang,"RECOMPENSAS DEL PARTIDO","MATCH REWARDS")}</small><h3>+{fmt(reward.msc)} MSC {reward.gems>0&&<> · +{reward.gems} ◆</>}</h3><p>{reward.breakdown.join(" · ")}</p></div></section>;
}

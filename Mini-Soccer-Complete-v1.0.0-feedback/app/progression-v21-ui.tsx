"use client";

import { useMemo, useState } from "react";
import { type EconomyState } from "./economy-v2";
import {
  ACHIEVEMENTS,
  DAILY_MISSIONS,
  WEEKLY_MISSIONS,
  claimProgressMission,
  equipTitle,
  levelFromXp,
  refreshProgressMissions,
  type ProgressMissionId,
  type ProgressionState,
} from "./progression-v21";

type Lang = "es" | "en";
const tr=(lang:Lang,es:string,en:string)=>lang==="es"?es:en;
const fmt=(value:number)=>new Intl.NumberFormat("es-AR").format(value);

export function ProgressionMini({state,lang,onOpen}:{state:ProgressionState;lang:Lang;onOpen:()=>void}){
  const level=levelFromXp(state.totalXp);
  const pct=level.xpForNext===0?100:Math.min(100,level.xpIntoLevel/level.xpForNext*100);
  return <button type="button" className="v21-level-mini" onClick={onOpen} title={tr(lang,"Abrir progresión","Open progression")}>
    <span>NV {level.level}</span><i><b style={{width:`${pct}%`}}/></i>
  </button>;
}

export function ProgressionHub({lang,state:rawState,economy,onChange,onEconomyChange,onBack}:{lang:Lang;state:ProgressionState;economy:EconomyState;onChange:(state:ProgressionState)=>void;onEconomyChange:(state:EconomyState)=>void;onBack:()=>void}){
  const state=refreshProgressMissions(rawState),level=levelFromXp(state.totalXp),[tab,setTab]=useState<"OVERVIEW"|"MISSIONS"|"ACHIEVEMENTS"|"STATS">("OVERVIEW"),[notice,setNotice]=useState("");
  const xpPct=level.xpForNext===0?100:Math.min(100,level.xpIntoLevel/Math.max(1,level.xpForNext)*100);
  const allMissions=useMemo(()=>[...DAILY_MISSIONS,...WEEKLY_MISSIONS],[state.missions.dayKey,state.missions.weekKey]);
  const flash=(text:string)=>{setNotice(text);window.setTimeout(()=>setNotice(""),1500)};
  const claim=(id:ProgressMissionId)=>{const result=claimProgressMission(state,id);if(!result.ok)return;onChange(result.state);onEconomyChange({...economy,msc:economy.msc+result.msc,totalEarnedMsc:economy.totalEarnedMsc+result.msc});flash(tr(lang,`+${result.xp} XP · +${result.msc} MSC`,`+${result.xp} XP · +${result.msc} MSC`))};
  const setTitle=(title:string|null)=>onChange(equipTitle(state,title));
  const stats=state.stats,winRate=stats.matches?Math.round(stats.wins/stats.matches*100):0,goalDiff=stats.goalsFor-stats.goalsAgainst;
  return <div className="page-shell v21-progression-page">
    <button className="back" onClick={onBack}>← {tr(lang,"INICIO","HOME")}</button>
    <header className="v21-progression-hero"><div className="v21-level-orb"><span>NV</span><b>{level.level}</b></div><div className="v21-hero-copy"><span className="eyebrow">MINI SOCCER COMPLETE · PROGRESIÓN</span><h1>{tr(lang,"TU CAMINO MSC","YOUR MSC JOURNEY")}</h1><p>{state.equippedTitle?`◆ ${state.equippedTitle}`:tr(lang,"Jugá para desbloquear títulos, logros y niveles.","Play to unlock titles, achievements and levels.")}</p><div className="v21-xp"><span><b>{fmt(level.xpIntoLevel)} XP</b><small>{level.xpForNext?`/ ${fmt(level.xpForNext)} XP`:`· MAX`}</small></span><em><i style={{width:`${xpPct}%`}}/></em></div></div><div className="v21-hero-stats"><span><b>{fmt(stats.matches)}</b><small>{tr(lang,"PARTIDOS","MATCHES")}</small></span><span><b>{winRate}%</b><small>{tr(lang,"VICTORIAS","WIN RATE")}</small></span><span><b>{fmt(stats.tournamentsWon)}</b><small>{tr(lang,"TÍTULOS","TITLES")}</small></span></div></header>
    <nav className="v21-tabs"><button className={tab==="OVERVIEW"?"active":""} onClick={()=>setTab("OVERVIEW")}>{tr(lang,"RESUMEN","OVERVIEW")}</button><button className={tab==="MISSIONS"?"active":""} onClick={()=>setTab("MISSIONS")}>{tr(lang,"MISIONES","MISSIONS")}</button><button className={tab==="ACHIEVEMENTS"?"active":""} onClick={()=>setTab("ACHIEVEMENTS")}>{tr(lang,"LOGROS","ACHIEVEMENTS")}</button><button className={tab==="STATS"?"active":""} onClick={()=>setTab("STATS")}>{tr(lang,"ESTADÍSTICAS","STATS")}</button></nav>
    {notice&&<div className="v21-notice">{notice}</div>}
    {tab==="OVERVIEW"&&<div className="v21-overview"><section><div className="v21-section-title"><span className="eyebrow">{tr(lang,"OBJETIVOS ACTIVOS","ACTIVE GOALS")}</span><h2>{tr(lang,"Lo próximo que podés completar","What you can complete next")}</h2></div><div className="v21-quick-missions">{allMissions.filter(m=>!state.missions.claimed.includes(m.id)).slice(0,4).map(m=>{const p=Math.min(m.target,state.missions.progress[m.id]??0);return <article key={m.id}><span>{m.id.startsWith("D_")?tr(lang,"DIARIA","DAILY"):tr(lang,"SEMANAL","WEEKLY")}</span><b>{m.label}</b><em><i style={{width:`${Math.min(100,p/m.target*100)}%`}}/></em><small>{p}/{m.target} · +{m.xp} XP · +{m.msc} MSC</small></article>})}</div></section><section><div className="v21-section-title"><span className="eyebrow">{tr(lang,"IDENTIDAD","IDENTITY")}</span><h2>{tr(lang,"Título equipado","Equipped title")}</h2></div><div className="v21-title-picker"><button className={!state.equippedTitle?"active":""} onClick={()=>setTitle(null)}>{tr(lang,"Sin título","No title")}</button>{state.unlockedTitles.map(title=><button className={state.equippedTitle===title?"active":""} key={title} onClick={()=>setTitle(title)}>◆ {title}</button>)}</div></section></div>}
    {tab==="MISSIONS"&&<div className="v21-missions"><MissionGroup title={tr(lang,"MISIONES DIARIAS","DAILY MISSIONS")} subtitle={state.missions.dayKey} missions={DAILY_MISSIONS} state={state} onClaim={claim}/><MissionGroup title={tr(lang,"MISIONES SEMANALES","WEEKLY MISSIONS")} subtitle={state.missions.weekKey} missions={WEEKLY_MISSIONS} state={state} onClaim={claim}/></div>}
    {tab==="ACHIEVEMENTS"&&<section className="v21-achievements"><div className="v21-section-title"><span className="eyebrow">{state.achievements.length}/{ACHIEVEMENTS.length}</span><h2>{tr(lang,"Logros permanentes","Permanent achievements")}</h2></div><div>{ACHIEVEMENTS.map(item=>{const unlocked=state.achievements.includes(item.id);return <article className={unlocked?"unlocked":"locked"} key={item.id}><span>{unlocked?"◆":"◇"}</span><div><b>{item.title}</b><small>{unlocked?tr(lang,"DESBLOQUEADO","UNLOCKED"):tr(lang,"BLOQUEADO","LOCKED")}</small></div></article>})}</div></section>}
    {tab==="STATS"&&<section className="v21-stats"><div className="v21-section-title"><span className="eyebrow">{tr(lang,"HISTORIAL PERMANENTE","PERMANENT HISTORY")}</span><h2>{tr(lang,"Todo lo que hiciste en la cancha","Everything you have done on the pitch")}</h2></div><div className="v21-stat-grid"><Stat label={tr(lang,"Partidos","Matches")} value={stats.matches}/><Stat label={tr(lang,"Victorias","Wins")} value={stats.wins}/><Stat label={tr(lang,"Empates","Draws")} value={stats.draws}/><Stat label={tr(lang,"Derrotas","Losses")} value={stats.losses}/><Stat label={tr(lang,"Goles","Goals")} value={stats.goalsFor}/><Stat label={tr(lang,"Diferencia de gol","Goal difference")} value={goalDiff>0?`+${goalDiff}`:goalDiff}/><Stat label={tr(lang,"Pases completos","Completed passes")} value={stats.completedPasses}/><Stat label={tr(lang,"Arcos invictos","Clean sheets")} value={stats.cleanSheets}/><Stat label={tr(lang,"Mejor racha","Best streak")} value={stats.bestWinStreak}/><Stat label={tr(lang,"Máx. goles/partido","Most goals/match")} value={stats.bestGoalsInMatch}/><Stat label={tr(lang,"Mayor remontada","Biggest comeback")} value={stats.biggestComeback}/><Stat label={tr(lang,"Equipos usados","Teams used")} value={stats.teamsUsed.length}/></div></section>}
  </div>;
}

function MissionGroup({title,subtitle,missions,state,onClaim}:{title:string;subtitle:string;missions:readonly {id:ProgressMissionId;target:number;xp:number;msc:number;label:string}[];state:ProgressionState;onClaim:(id:ProgressMissionId)=>void}){
  return <section><div className="v21-section-title"><span className="eyebrow">{subtitle}</span><h2>{title}</h2></div><div className="v21-mission-list">{missions.map(m=>{const p=Math.min(m.target,state.missions.progress[m.id]??0),done=p>=m.target,claimed=state.missions.claimed.includes(m.id);return <article className={`${done?"done":""} ${claimed?"claimed":""}`} key={m.id}><div><b>{m.label}</b><small>{p}/{m.target}</small><em><i style={{width:`${Math.min(100,p/m.target*100)}%`}}/></em></div><button disabled={!done||claimed} onClick={()=>onClaim(m.id)}>{claimed?"✓":`+${m.xp} XP · +${m.msc} MSC`}</button></article>})}</div></section>;
}

function Stat({label,value}:{label:string;value:number|string}){return <article><b>{typeof value==="number"?fmt(value):value}</b><span>{label}</span></article>}

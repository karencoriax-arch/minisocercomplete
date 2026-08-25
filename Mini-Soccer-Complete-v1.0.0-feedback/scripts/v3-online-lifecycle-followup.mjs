import { readFileSync,writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";
const here=dirname(fileURLToPath(import.meta.url)),root=join(here,".."),pagePath=join(root,"app","page.tsx"),onlinePath=join(root,"app","online-match-v3.tsx");
const patch=(source,from,to,label)=>{const next=source.replace(from,to);if(next===source)throw new Error(`V3 online lifecycle did not match: ${label}`);return next};
let page=readFileSync(pagePath,"utf8");
if(!page.includes("MSC_V3_ONLINE_LIFECYCLE")){
 page=page.replace('// MSC_V3_ONLINE_MATCH_RUNTIME — PC/mobile casual realtime crossplay screen.','// MSC_V3_ONLINE_MATCH_RUNTIME — PC/mobile casual realtime crossplay screen.\n// MSC_V3_ONLINE_LIFECYCLE — READY remains joinable until both peers connect.');
 page=patch(page,'setMatchBoosts(EMPTY_MATCH_BOOSTS);void setOnlineRoomStatusV3(room.id,"PLAYING");setScreen("onlineMatchV3")','setMatchBoosts(EMPTY_MATCH_BOOSTS);setScreen("onlineMatchV3")',"do not close lobby early");
 writeFileSync(pagePath,page);
}
let online=readFileSync(onlinePath,"utf8");
if(!online.includes("MSC_V3_PRESENCE_GATE")){
 online=online.replace('"use client";','"use client";\n// MSC_V3_PRESENCE_GATE — match time starts only with both peers present.');
 online=patch(online,'channel.current=ch;setStatus(ch?"LIVE":"RECONNECTING");return()=>{try{void ch?.unsubscribe()}catch{}channel.current=null}','channel.current=ch;setStatus(ch?"CONNECTING":"RECONNECTING");const presenceTimer=window.setInterval(()=>{if(!ch){setStatus("RECONNECTING");return}try{const presence=ch.presenceState(),count=Object.values(presence).reduce((total,entries)=>total+(Array.isArray(entries)?entries.length:0),0);setStatus(current=>current==="FINISHED"?current:count>=2?"LIVE":"CONNECTING")}catch{setStatus(current=>current==="FINISHED"?current:"RECONNECTING")}},350);return()=>{window.clearInterval(presenceTimer);try{void ch?.unsubscribe()}catch{}channel.current=null}',"presence polling");
 online=patch(online,'const tick=(now:number)=>{const dt=Math.min(.034,(now-lastFrame.current)/1000||.016);lastFrame.current=now;if(status==="FINISHED")return;clockRef.current=Math.max(0,clockRef.current-dt);','const tick=(now:number)=>{const dt=Math.min(.034,(now-lastFrame.current)/1000||.016);lastFrame.current=now;if(status==="FINISHED")return;if(status!=="LIVE"){raf=requestAnimationFrame(tick);return}clockRef.current=Math.max(0,clockRef.current-dt);',"host waits for peer");
 writeFileSync(onlinePath,online);
}
const finalPage=readFileSync(pagePath,"utf8"),finalOnline=readFileSync(onlinePath,"utf8");for(const [ok,label] of [[!finalPage.includes('setOnlineRoomStatusV3(room.id,"PLAYING")'),"joinable ready room"],[finalOnline.includes("presenceState"),"presence state"],[finalOnline.includes('status!=="LIVE"'),"clock gate"]])if(!ok)throw new Error(`V3 online lifecycle verification failed: ${label}`);console.log("Mini Soccer Complete v3 crossplay presence lifecycle verified.");

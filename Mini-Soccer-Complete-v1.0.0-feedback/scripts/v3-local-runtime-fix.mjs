import { readFileSync,writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";
const here=dirname(fileURLToPath(import.meta.url)),path=join(here,"..","app","local-match-v3.tsx");let source=readFileSync(path,"utf8");
if(!source.includes("MSC_V3_LOCAL_INPUT_FIX")){
 const from='const p2={move:p2Move,pass:pad2?pad2.actions.PASS:Boolean(p2Keyboard.actions.PASS),shoot:pad2?pad2.actions.SHOOT:Boolean(p2Keyboard.actions.SHOOT),tackle:pad2?pad2.actions.TACKLE:Boolean(p2Keyboard.actions.TACKLE),switch:pad2?pad2.actions.SWITCH:Boolean(p2Keyboard.actions.SWITCH_PLAYER),sprint:pad2?pad2.actions.SPRINT:false};';
 const to='const p2={move:p2Move,pass:pad2?pad2.actions.PASS:p2Keyboard.pass,shoot:pad2?pad2.actions.SHOOT:p2Keyboard.shoot,tackle:pad2?pad2.actions.TACKLE:p2Keyboard.tackle,switch:pad2?pad2.actions.SWITCH:p2Keyboard.switchPlayer,sprint:pad2?pad2.actions.SPRINT:p2Keyboard.sprint};';
 const next=source.replace(from,to);if(next===source)throw new Error("V3 local input fix did not match");source=source.replace('"use client";','"use client";\n// MSC_V3_LOCAL_INPUT_FIX — keyboard and gamepad P2 share the same normalized input shape.').replace(from,to);writeFileSync(path,source);
}
const final=readFileSync(path,"utf8");if(final.includes("p2Keyboard.actions"))throw new Error("V3 local input fix verification failed");console.log("Mini Soccer Complete v3 local input mapping verified.");

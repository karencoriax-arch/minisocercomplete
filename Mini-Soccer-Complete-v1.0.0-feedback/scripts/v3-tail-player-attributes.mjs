import { readFileSync,writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";
const here=dirname(fileURLToPath(import.meta.url)),path=join(here,"..","app","page.tsx");let source=readFileSync(path,"utf8");
if(!source.includes("MSC_V3_PLAYER_ATTRIBUTES_COMPLETE")){
  source=source.replace('// MSC_V3_GAMEPLAY_FOLLOWUP — shot styles, player attributes, cloud sync, academy and subtle weather physics.','// MSC_V3_GAMEPLAY_FOLLOWUP — shot styles, player attributes, cloud sync, academy and subtle weather physics.\n// MSC_V3_PLAYER_ATTRIBUTES_COMPLETE — pace, stamina, passing and finishing all affect live gameplay.');
  source=source.replaceAll('finishing:carrier.rating','finishing:derivePlayerAttributes(carrier.name,carrier.rating,carrier.role).shoot');
  source=source.replaceAll('finishing:shooter.rating','finishing:derivePlayerAttributes(shooter.name,shooter.rating,shooter.role).shoot');
  source=source.replaceAll('passer:carrier,players:bodies.current','passer:{...carrier,rating:Math.round(derivePlayerAttributes(carrier.name,carrier.rating,carrier.role).pass)},players:bodies.current');
  source=source.replaceAll('passer,players:bodies.current','passer:{...passer,rating:Math.round(derivePlayerAttributes(passer.name,passer.rating,passer.role).pass)},players:bodies.current');
  writeFileSync(path,source);
}
const final=readFileSync(path,"utf8");for(const token of [".role).shoot",".role).pass"])if(!final.includes(token))throw new Error(`V3 player attribute verification missing ${token}`);console.log("Mini Soccer Complete v3 player attributes fully connected.");

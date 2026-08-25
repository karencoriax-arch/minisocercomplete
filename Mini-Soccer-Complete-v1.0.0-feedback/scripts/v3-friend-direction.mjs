import { readFileSync,writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";
const here=dirname(fileURLToPath(import.meta.url)),root=join(here,".."),app=join(root,"app"),cloudPath=join(app,"cloud-v3.ts"),uiPath=join(app,"progression-v3-ui.tsx");
const replace=(source,from,to,label)=>{const next=source.replace(from,to);if(next===source)throw new Error(`V3 friend direction did not match: ${label}`);return next};
let cloud=readFileSync(cloudPath,"utf8");
if(!cloud.includes("MSC_V3_FRIEND_DIRECTION")){
 cloud=cloud.replace('export interface FriendEntryV3 {userId:string;handle:string;level:number;rating:number;status:"PENDING"|"ACCEPTED";}','// MSC_V3_FRIEND_DIRECTION — request direction is exposed to prevent self-acceptance.\nexport interface FriendEntryV3 {userId:string;handle:string;level:number;rating:number;status:"PENDING"|"ACCEPTED";requestedBy:string;}');
 cloud=replace(cloud,'status:row.status==="ACCEPTED"?"ACCEPTED":"PENDING"}))','status:row.status==="ACCEPTED"?"ACCEPTED":"PENDING",requestedBy:String(row.requested_by??"")}))',"friend row mapping");
 writeFileSync(cloudPath,cloud);
}
let ui=readFileSync(uiPath,"utf8");
if(!ui.includes("MSC_V3_FRIEND_DIRECTION_UI")){
 ui=ui.replace('// MSC_V3_UI_FOLLOWUP — real room join, editable cloud handle and full friend workflow.','// MSC_V3_UI_FOLLOWUP — real room join, editable cloud handle and full friend workflow.\n// MSC_V3_FRIEND_DIRECTION_UI — sent requests cannot be self-accepted.');
 ui=replace(ui,'{friend.status==="PENDING"?<button onClick={()=>acceptFriend(friend.userId)}>{t(lang,"ACEPTAR","ACCEPT")}</button>:<em>{t(lang,"AMIGO","FRIEND")}</em>}','{friend.status==="PENDING"?(friend.requestedBy===cloudUserId?<em>{t(lang,"ENVIADA","SENT")}</em>:<button onClick={()=>acceptFriend(friend.userId)}>{t(lang,"ACEPTAR","ACCEPT")}</button>):<em>{t(lang,"AMIGO","FRIEND")}</em>}',"friend request action");
 writeFileSync(uiPath,ui);
}
const finalCloud=readFileSync(cloudPath,"utf8"),finalUi=readFileSync(uiPath,"utf8");if(!finalCloud.includes("requestedBy")||!finalUi.includes('friend.requestedBy===cloudUserId'))throw new Error("V3 friend direction verification failed");console.log("Mini Soccer Complete v3 friend request direction verified.");

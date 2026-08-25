import { readFileSync,writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";
const here=dirname(fileURLToPath(import.meta.url)),path=join(here,"..","app","progression-v3-ui.tsx");let source=readFileSync(path,"utf8");
const patch=(from,to,label)=>{const next=source.replace(from,to);if(next===source)throw new Error(`V3 account link did not match: ${label}`);source=next};
if(!source.includes("MSC_V3_SAFE_ACCOUNT_LINK")){
  const importAnchor='import { refreshOnlineRoomV3 } from "./online-lobby-v3";';
  patch(importAnchor,`${importAnchor}\nimport { cloudAccountInfoV3, connectCloudEmailV3 } from "./account-v3";\n// MSC_V3_SAFE_ACCOUNT_LINK — anonymous progress is linked before cross-device magic login.`,"account imports");
  patch('[cloudUserId,setCloudUserId]=useState("");','[cloudUserId,setCloudUserId]=useState(""),[cloudEmailV3,setCloudEmailV3]=useState<string|null>(null);',"cloud email state");
  const rankingEffect='useEffect(()=>{if(tab!=="RANKING"||!cloudEnabledV3())return;leaderboardV3(50).then(setRanking)},[tab]);';
  patch(rankingEffect,`${rankingEffect}\n  useEffect(()=>{if((tab!=="RANKING"&&tab!=="ONLINE")||!cloudEnabledV3())return;cloudAccountInfoV3().then(info=>{setCloudEmailV3(info?.email??null);if(info?.id)setCloudUserId(info.id)})},[tab]);`,"account info effect");
  const createAnchor='const saveHandle=()=>';
  patch(createAnchor,'const connectEmailV3=async()=>{const result=await connectCloudEmailV3(email);setCloudMessage(result.ok?(result.mode==="LINK_CURRENT"?t(lang,"Revisá tu correo para confirmar y conservar esta cuenta.","Check your email to confirm and keep this account."):result.mode==="ALREADY_LINKED"?t(lang,"Ese correo ya está vinculado.","That email is already linked."):t(lang,"Magic link enviado.","Magic link sent.")):result.error??t(lang,"No se pudo vincular.","Could not link."));const info=await cloudAccountInfoV3();setCloudEmailV3(info?.email??null);if(info?.id)setCloudUserId(info.id)};\n  '+createAnchor,"connect email function");
  source=source.replaceAll('onClick={sendMagicLink}','onClick={connectEmailV3}');
  source=source.replaceAll('{cloudMessage&&<small>{cloudMessage}</small>}','{cloudEmailV3&&<small className="v3-cloud-email">☁ {cloudEmailV3}</small>}{cloudMessage&&<small>{cloudMessage}</small>}');
  writeFileSync(path,source);
}
const final=readFileSync(path,"utf8");for(const token of ["connectCloudEmailV3","connectEmailV3","v3-cloud-email"])if(!final.includes(token))throw new Error(`V3 account link verification missing ${token}`);console.log("Mini Soccer Complete v3 safe account linking verified.");

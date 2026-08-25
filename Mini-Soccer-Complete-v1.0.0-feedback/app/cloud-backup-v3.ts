import { cloudClientV3 } from "./cloud-v3";

export interface MscStateBackupV3 {
  version: 1;
  savedAt: string;
  entries: Record<string,string>;
}

const PREFIX="msc-";
const EXCLUDED_KEYS=new Set(["msc-cloud-restore-marker-v3"]);
const MAX_ENTRY_CHARS=180_000;
const MAX_TOTAL_CHARS=900_000;

export function snapshotMscLocalStateV3(storage:Pick<Storage,"length"|"key"|"getItem">=localStorage):MscStateBackupV3{
  const entries:Record<string,string>={};
  let total=0;
  for(let i=0;i<storage.length;i++){
    const key=storage.key(i);
    if(!key||!key.startsWith(PREFIX)||EXCLUDED_KEYS.has(key))continue;
    const value=storage.getItem(key);
    if(value===null||value.length>MAX_ENTRY_CHARS)continue;
    const cost=key.length+value.length;
    if(total+cost>MAX_TOTAL_CHARS)continue;
    entries[key]=value;
    total+=cost;
  }
  return{version:1,savedAt:new Date().toISOString(),entries};
}

export function parseStateBackupV3(value:unknown):MscStateBackupV3|null{
  if(!value||typeof value!=="object")return null;
  const source=value as Partial<MscStateBackupV3>;
  if(source.version!==1||!source.entries||typeof source.entries!=="object")return null;
  const entries:Record<string,string>={};
  let total=0;
  for(const [key,raw] of Object.entries(source.entries)){
    if(!key.startsWith(PREFIX)||EXCLUDED_KEYS.has(key)||typeof raw!=="string"||raw.length>MAX_ENTRY_CHARS)continue;
    const cost=key.length+raw.length;
    if(total+cost>MAX_TOTAL_CHARS)continue;
    entries[key]=raw;
    total+=cost;
  }
  return{version:1,savedAt:typeof source.savedAt==="string"?source.savedAt:new Date(0).toISOString(),entries};
}

export function restoreMscLocalStateV3(backup:MscStateBackupV3,storage:Pick<Storage,"getItem"|"setItem">=localStorage){
  let changed=0;
  for(const [key,value] of Object.entries(backup.entries)){
    if(storage.getItem(key)===value)continue;
    try{storage.setItem(key,value);changed++}catch{}
  }
  return changed;
}

export async function loadStateBackupV3(userId:string):Promise<MscStateBackupV3|null>{
  const client=cloudClientV3();if(!client)return null;
  const {data,error}=await client.from("msc_profiles_v3").select("state_blob").eq("user_id",userId).maybeSingle();
  if(error||!data)return null;
  return parseStateBackupV3(data.state_blob);
}

export async function saveStateBackupV3(userId:string,backup:MscStateBackupV3){
  const client=cloudClientV3();if(!client)return{ok:false,error:"Cloud no configurado"};
  const safe=parseStateBackupV3(backup);if(!safe)return{ok:false,error:"Backup inválido"};
  const {error}=await client.from("msc_profiles_v3").update({state_blob:safe}).eq("user_id",userId);
  return{ok:!error,error:error?.message??null};
}

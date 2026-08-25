import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { ProgressStateV3 } from "./progression-v3";

export type CloudStatus="DISABLED"|"OFFLINE"|"CONNECTING"|"SYNCED"|"ERROR";
export interface CloudProfileV3 {userId:string;handle:string;displayName:string;progress:ProgressStateV3;msc:number;gems:number;updatedAt:string;}
export interface LeaderboardEntryV3 {userId:string;handle:string;level:number;rating:number;wins:number;goals:number;tournaments:number;updatedAt:string;}
export interface FriendEntryV3 {userId:string;handle:string;level:number;rating:number;status:"PENDING"|"ACCEPTED";}

let singleton:SupabaseClient|null|undefined;
export function cloudClientV3(){
  if(singleton!==undefined)return singleton;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  singleton=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true},realtime:{params:{eventsPerSecond:30}}}):null;
  return singleton;
}

export function sanitizeHandle(value:string){return value.normalize("NFKD").replace(/[^a-zA-Z0-9_]/g,"").slice(0,18).toLowerCase()}
export function cloudEnabledV3(){return Boolean(cloudClientV3())}

export async function ensureCloudUserV3():Promise<User|null>{
  const client=cloudClientV3();if(!client)return null;
  const existing=await client.auth.getUser();if(existing.data.user)return existing.data.user;
  const anonymous=await client.auth.signInAnonymously();if(anonymous.error)return null;return anonymous.data.user;
}

export async function signInWithEmailV3(email:string){const client=cloudClientV3();if(!client)return{ok:false,error:"Cloud no configurado"};const value=email.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(value))return{ok:false,error:"Email inválido"};const {error}=await client.auth.signInWithOtp({email:value,options:{emailRedirectTo:typeof location!=="undefined"?location.origin:undefined}});return{ok:!error,error:error?.message??null}}
export async function signOutCloudV3(){const client=cloudClientV3();if(!client)return;await client.auth.signOut()}

export async function loadCloudProfileV3(userId:string):Promise<CloudProfileV3|null>{
  const client=cloudClientV3();if(!client)return null;const {data,error}=await client.from("msc_profiles_v3").select("user_id,handle,display_name,progress,msc,gems,updated_at").eq("user_id",userId).maybeSingle();if(error||!data)return null;
  return{userId:data.user_id,handle:data.handle,displayName:data.display_name,progress:data.progress as ProgressStateV3,msc:Number(data.msc)||0,gems:Number(data.gems)||0,updatedAt:data.updated_at};
}

export async function saveCloudProfileV3(profile:CloudProfileV3){
  const client=cloudClientV3();if(!client)return{ok:false,error:"Cloud no configurado"};const payload={user_id:profile.userId,handle:sanitizeHandle(profile.handle)||`msc_${profile.userId.slice(0,8)}`,display_name:profile.displayName.slice(0,28),progress:profile.progress,msc:Math.max(0,Math.floor(profile.msc)),gems:Math.max(0,Math.floor(profile.gems)),level:profile.progress.level,rating:profile.progress.rating,wins:profile.progress.stats.wins,goals:profile.progress.stats.goalsFor,tournaments:profile.progress.stats.tournaments,updated_at:profile.updatedAt};
  const {error}=await client.from("msc_profiles_v3").upsert(payload,{onConflict:"user_id"});return{ok:!error,error:error?.message??null};
}

export function chooseNewestProfileV3(local:CloudProfileV3,remote:CloudProfileV3|null){if(!remote)return local;const localTime=Date.parse(local.updatedAt)||0,remoteTime=Date.parse(remote.updatedAt)||0;return remoteTime>localTime?remote:local}

export async function leaderboardV3(limit=50):Promise<LeaderboardEntryV3[]>{
  const client=cloudClientV3();if(!client)return[];const {data,error}=await client.from("msc_profiles_v3").select("user_id,handle,level,rating,wins,goals,tournaments,updated_at").order("rating",{ascending:false}).order("wins",{ascending:false}).limit(Math.max(1,Math.min(100,limit)));if(error||!data)return[];
  return data.map(row=>({userId:row.user_id,handle:row.handle,level:Number(row.level)||1,rating:Number(row.rating)||0,wins:Number(row.wins)||0,goals:Number(row.goals)||0,tournaments:Number(row.tournaments)||0,updatedAt:row.updated_at}));
}

export async function findPlayerV3(handle:string):Promise<LeaderboardEntryV3|null>{const client=cloudClientV3();if(!client)return null;const clean=sanitizeHandle(handle);if(!clean)return null;const {data,error}=await client.from("msc_profiles_v3").select("user_id,handle,level,rating,wins,goals,tournaments,updated_at").eq("handle",clean).maybeSingle();if(error||!data)return null;return{userId:data.user_id,handle:data.handle,level:data.level,rating:data.rating,wins:data.wins,goals:data.goals,tournaments:data.tournaments,updatedAt:data.updated_at}}

export async function requestFriendV3(fromUserId:string,toUserId:string){const client=cloudClientV3();if(!client||fromUserId===toUserId)return false;const pair=[fromUserId,toUserId].sort();const {error}=await client.from("msc_friendships_v3").upsert({user_low:pair[0],user_high:pair[1],requested_by:fromUserId,status:"PENDING"},{onConflict:"user_low,user_high"});return!error}
export async function acceptFriendV3(userId:string,otherUserId:string){const client=cloudClientV3();if(!client)return false;const pair=[userId,otherUserId].sort();const {error}=await client.from("msc_friendships_v3").update({status:"ACCEPTED",accepted_at:new Date().toISOString()}).eq("user_low",pair[0]).eq("user_high",pair[1]);return!error}

export async function friendsV3(userId:string):Promise<FriendEntryV3[]>{const client=cloudClientV3();if(!client)return[];const {data,error}=await client.rpc("msc_friends_v3",{p_user_id:userId});if(error||!Array.isArray(data))return[];return data.map((row:any)=>({userId:String(row.user_id),handle:String(row.handle),level:Number(row.level)||1,rating:Number(row.rating)||0,status:row.status==="ACCEPTED"?"ACCEPTED":"PENDING"}))}

export interface OnlineRoomV3 {id:string;code:string;hostUserId:string;guestUserId:string|null;status:"OPEN"|"READY"|"PLAYING"|"FINISHED";format:3|4;createdAt:string;}
export async function createOnlineRoomV3(hostUserId:string,format:3|4):Promise<OnlineRoomV3|null>{const client=cloudClientV3();if(!client)return null;const code=Math.random().toString(36).slice(2,8).toUpperCase();const {data,error}=await client.from("msc_rooms_v3").insert({code,host_user_id:hostUserId,format,status:"OPEN"}).select("id,code,host_user_id,guest_user_id,status,format,created_at").single();if(error||!data)return null;return{id:data.id,code:data.code,hostUserId:data.host_user_id,guestUserId:data.guest_user_id,status:data.status,format:data.format,createdAt:data.created_at}}
export async function joinOnlineRoomV3(code:string,userId:string):Promise<OnlineRoomV3|null>{const client=cloudClientV3();if(!client)return null;const clean=code.trim().toUpperCase();const {data,error}=await client.rpc("msc_join_room_v3",{p_code:clean,p_user_id:userId});if(error||!data)return null;return{id:data.id,code:data.code,hostUserId:data.host_user_id,guestUserId:data.guest_user_id,status:data.status,format:data.format,createdAt:data.created_at}}

export function createRealtimeMatchChannelV3(roomId:string,userId:string,onMessage:(event:{type:string;payload:any;from:string})=>void){const client=cloudClientV3();if(!client)return null;const channel=client.channel(`msc-match-${roomId}`,{config:{broadcast:{self:false,ack:false},presence:{key:userId}}});channel.on("broadcast",{event:"input"},message=>onMessage({type:"input",payload:message.payload,from:String(message.payload?.from??"")}));channel.on("broadcast",{event:"snapshot"},message=>onMessage({type:"snapshot",payload:message.payload,from:String(message.payload?.from??"")}));channel.subscribe(async status=>{if(status==="SUBSCRIBED")await channel.track({userId,onlineAt:new Date().toISOString()})});return channel}

import { cloudClientV3, type OnlineRoomV3 } from "./cloud-v3";

const mapRoom=(data:any):OnlineRoomV3=>({id:String(data.id),code:String(data.code),hostUserId:String(data.host_user_id),guestUserId:data.guest_user_id?String(data.guest_user_id):null,status:data.status,format:Number(data.format)===4?4:3,createdAt:String(data.created_at)});
export async function refreshOnlineRoomV3(code:string):Promise<OnlineRoomV3|null>{const client=cloudClientV3();if(!client)return null;const {data,error}=await client.from("msc_rooms_v3").select("id,code,host_user_id,guest_user_id,status,format,created_at").eq("code",code.trim().toUpperCase()).maybeSingle();return error||!data?null:mapRoom(data)}
export async function setOnlineRoomStatusV3(roomId:string,status:"READY"|"PLAYING"|"FINISHED"){const client=cloudClientV3();if(!client)return false;const {error}=await client.from("msc_rooms_v3").update({status,updated_at:new Date().toISOString()}).eq("id",roomId);return!error}

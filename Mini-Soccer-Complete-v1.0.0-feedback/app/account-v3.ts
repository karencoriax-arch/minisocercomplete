import { cloudClientV3 } from "./cloud-v3";

export async function connectCloudEmailV3(email:string){
  const client=cloudClientV3(),clean=email.trim().toLowerCase();
  if(!client||!clean.includes("@"))return{ok:false,mode:"ERROR" as const,error:"Correo inválido"};
  const {data}=await client.auth.getUser();
  const user=data.user;
  if(user?.is_anonymous){
    const {error}=await client.auth.updateUser({email:clean});
    return error?{ok:false,mode:"ERROR" as const,error:error.message}:{ok:true,mode:"LINK_CURRENT" as const,error:null};
  }
  if(user?.email?.toLowerCase()===clean)return{ok:true,mode:"ALREADY_LINKED" as const,error:null};
  const {error}=await client.auth.signInWithOtp({email:clean,options:{emailRedirectTo:typeof window!=="undefined"?window.location.origin:undefined}});
  return error?{ok:false,mode:"ERROR" as const,error:error.message}:{ok:true,mode:"MAGIC_LINK" as const,error:null};
}

export async function cloudAccountInfoV3(){
  const client=cloudClientV3();if(!client)return null;
  const {data}=await client.auth.getUser();const user=data.user;if(!user)return null;
  return{id:user.id,email:user.email??null,anonymous:Boolean(user.is_anonymous)};
}

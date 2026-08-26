export type ReboundKind="SIDELINE"|"POST"|"GOAL_FRAME";
export type ReboundVector={x:number;y:number};

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

export const REBOUND_TUNING:Record<ReboundKind,{normal:number;tangent:number;minimum:number}>={
  SIDELINE:{normal:.73,tangent:.94,minimum:18},
  POST:{normal:.86,tangent:.97,minimum:34},
  GOAL_FRAME:{normal:.81,tangent:.95,minimum:28},
};

/** Resolve a collision against a unit surface normal without injecting energy. */
export function resolveRebound(velocity:ReboundVector,normal:ReboundVector,kind:ReboundKind):ReboundVector{
  const length=Math.hypot(normal.x,normal.y)||1,nx=normal.x/length,ny=normal.y/length;
  const normalVelocity=velocity.x*nx+velocity.y*ny;
  if(normalVelocity>=0)return{...velocity};
  const tangentX=velocity.x-normalVelocity*nx,tangentY=velocity.y-normalVelocity*ny,tuning=REBOUND_TUNING[kind];
  let next={x:tangentX*tuning.tangent-normalVelocity*nx*tuning.normal,y:tangentY*tuning.tangent-normalVelocity*ny*tuning.normal};
  const before=Math.hypot(velocity.x,velocity.y),after=Math.hypot(next.x,next.y),limit=before*.985;
  if(after>limit&&after>0)next={x:next.x/after*limit,y:next.y/after*limit};
  if(before>tuning.minimum&&Math.hypot(next.x,next.y)<tuning.minimum){const magnitude=Math.hypot(next.x,next.y)||1;next={x:next.x/magnitude*tuning.minimum,y:next.y/magnitude*tuning.minimum}}
  return next;
}

export function postNormal(ball:{x:number;y:number},post:{x:number;y:number}){
  const dx=ball.x-post.x,dy=ball.y-post.y,length=Math.hypot(dx,dy)||1;
  return{x:dx/length,y:dy/length};
}

export function reboundEnergyRatio(before:ReboundVector,after:ReboundVector){
  const a=Math.hypot(before.x,before.y),b=Math.hypot(after.x,after.y);
  return a<=.001?0:clamp(b/a,0,2);
}

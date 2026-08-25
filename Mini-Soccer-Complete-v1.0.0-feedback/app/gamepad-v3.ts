export type GamepadAction="PASS"|"SHOOT"|"TACKLE"|"SWITCH"|"SPRINT"|"PAUSE"|"SHOT_MODE";
export interface GamepadFrame {connected:boolean;index:number;id:string;move:{x:number;y:number};aim:{x:number;y:number};actions:Record<GamepadAction,boolean>;pressed:GamepadAction[];}
export interface LocalInputFrame {player1:GamepadFrame|null;player2:GamepadFrame|null;}

const ACTIONS:GamepadAction[]=["PASS","SHOOT","TACKLE","SWITCH","SPRINT","PAUSE","SHOT_MODE"];
const clampAxis=(value:number,deadZone=.16)=>{const abs=Math.abs(value);if(abs<=deadZone)return 0;const scaled=(abs-deadZone)/(1-deadZone);return Math.sign(value)*Math.min(1,scaled)};
const radial=(x:number,y:number)=>{const cx=clampAxis(x),cy=clampAxis(y),length=Math.hypot(cx,cy);if(length<=1)return{x:cx,y:cy};return{x:cx/length,y:cy/length}};

export function mapStandardGamepad(pad:Pick<Gamepad,"index"|"id"|"axes"|"buttons"|"connected">,previous?:GamepadFrame|null):GamepadFrame{
  const move=radial(pad.axes[0]??0,pad.axes[1]??0),aimRaw=radial(pad.axes[2]??0,pad.axes[3]??0),aim=Math.hypot(aimRaw.x,aimRaw.y)>.08?aimRaw:move;
  const button=(index:number)=>Boolean(pad.buttons[index]?.pressed||(pad.buttons[index]?.value??0)>.5);
  const actions:Record<GamepadAction,boolean>={PASS:button(0),SHOOT:button(1),TACKLE:button(2),SWITCH:button(4),SPRINT:button(5),PAUSE:button(9),SHOT_MODE:button(3)};
  const pressed=ACTIONS.filter(action=>actions[action]&&!previous?.actions[action]);
  return{connected:pad.connected,index:pad.index,id:pad.id||"Gamepad",move,aim,actions,pressed};
}

export class GamepadManagerV3 {
  private previous=new Map<number,GamepadFrame>();
  poll(source?:ArrayLike<Gamepad|null>):GamepadFrame[]{
    const pads=source??(typeof navigator!=="undefined"&&navigator.getGamepads?navigator.getGamepads():[]),frames:GamepadFrame[]=[];
    for(let i=0;i<pads.length;i++){const pad=pads[i];if(!pad?.connected)continue;const frame=mapStandardGamepad(pad,this.previous.get(pad.index));this.previous.set(pad.index,frame);frames.push(frame)}
    const active=new Set(frames.map(frame=>frame.index));for(const key of this.previous.keys())if(!active.has(key))this.previous.delete(key);return frames;
  }
  reset(){this.previous.clear()}
}

export function keyboardLocalPlayer2(keys:Record<string,boolean>):{move:{x:number;y:number};actions:Partial<Record<GamepadAction,boolean>>}{
  const x=(keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0),y=(keys.ArrowDown?1:0)-(keys.ArrowUp?1:0),length=Math.hypot(x,y)||1;
  return{move:{x:x/length,y:y/length},actions:{PASS:Boolean(keys.Enter),SHOOT:Boolean(keys.Shift),TACKLE:Boolean(keys.Control),SWITCH:Boolean(keys["0"])}};
}

export function gamepadLabel(id:string){const value=id.toLowerCase();if(value.includes("xbox"))return"Xbox Controller";if(value.includes("dualsense")||value.includes("wireless controller")||value.includes("playstation"))return"PlayStation Controller";return id.trim().slice(0,44)||"Gamepad"}

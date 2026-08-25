import type { BallFeedback } from "./gameplay-v3";

export type SoundEventV3="PASS"|"SHOT"|"POST"|"SAVE"|"BLOCK"|"TACKLE"|"GOAL"|"WHISTLE"|"UI";

export class SoundscapeV3 {
  private context:AudioContext|null=null;
  private ctx(){if(typeof window==="undefined")return null;const AC=window.AudioContext||(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;this.context=this.context??new AC();return this.context}
  impact(event:SoundEventV3,feedback?:BallFeedback,volume=.5){const c=this.ctx();if(!c)return;const now=c.currentTime,o=c.createOscillator(),g=c.createGain(),filter=c.createBiquadFilter(),strength=Math.max(.05,Math.min(1,feedback?.impact??.45));o.type=event==="POST"?"square":event==="GOAL"?"sawtooth":"triangle";const base=event==="PASS"?145:event==="SHOT"?82:event==="POST"?720:event==="SAVE"?210:event==="BLOCK"?165:event==="TACKLE"?105:event==="GOAL"?180:event==="WHISTLE"?1480:380;o.frequency.setValueAtTime(base+(feedback?.pitch??0)*.25,now);o.frequency.exponentialRampToValueAtTime(Math.max(50,base*.55),now+.08+strength*.08);filter.type="lowpass";filter.frequency.value=event==="POST"?2600:900+strength*1500;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.004,volume*.08*strength),now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+.1+strength*.18);o.connect(filter).connect(g).connect(c.destination);o.start(now);o.stop(now+.35)}
  crowd(intensity:number,goal=false,volume=.5){const c=this.ctx();if(!c)return;const now=c.currentTime,length=Math.floor(c.sampleRate*(goal?1.1:.28)),buffer=c.createBuffer(1,length,c.sampleRate),data=buffer.getChannelData(0),amp=Math.max(.02,Math.min(1,intensity))*volume;for(let i=0;i<length;i++){const fade=1-i/length;data[i]=(Math.random()*2-1)*fade}const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=buffer;filter.type="bandpass";filter.frequency.value=goal?720:430;filter.Q.value=.5;gain.gain.value=(goal?.11:.025)*amp;source.connect(filter).connect(gain).connect(c.destination);source.start(now)}
}

export function hapticV3(pattern:number|number[]){try{if(typeof navigator!=="undefined"&&navigator.vibrate)navigator.vibrate(pattern)}catch{}}

export class ClipRecorderV3 {
  private recorder:MediaRecorder|null=null;private chunks:Blob[]=[];
  supported(){return typeof MediaRecorder!=="undefined"}
  start(canvas:HTMLCanvasElement,fps=30){if(!this.supported()||this.recorder?.state==="recording")return false;const stream=canvas.captureStream(Math.max(15,Math.min(60,fps))),mime=["video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"].find(type=>MediaRecorder.isTypeSupported(type))??"video/webm";this.chunks=[];this.recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4_000_000});this.recorder.ondataavailable=event=>{if(event.data.size)this.chunks.push(event.data)};this.recorder.start(250);return true}
  stop(){return new Promise<Blob|null>(resolve=>{const recorder=this.recorder;if(!recorder||recorder.state==="inactive"){resolve(null);return}recorder.onstop=()=>{const blob=new Blob(this.chunks,{type:recorder.mimeType||"video/webm"});this.recorder=null;this.chunks=[];resolve(blob)};recorder.stop()})}
}

export async function shareResultV3(text:string,blob?:Blob|null){const files=blob&&typeof File!=="undefined"?[new File([blob],"mini-soccer-complete-goal.webm",{type:blob.type||"video/webm"})]:[];try{if(typeof navigator!=="undefined"&&navigator.share){const data:ShareData={title:"Mini Soccer Complete",text};if(files.length&&navigator.canShare?.({files}))data.files=files;await navigator.share(data);return true}}catch{}try{await navigator.clipboard?.writeText(text);return true}catch{return false}}

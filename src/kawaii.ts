import type { Controls, Emotion, PetState } from './character'

export type MascotEyeMode = 'open' | 'happy' | 'closed' | 'wink' | 'half' | 'sparkle'
export type MouthKind = 'line' | 'fill'

export interface MascotEyeFrame { x:number; y:number; width:number; height:number; rotation:number; pupilX:number; pupilY:number; pupilRadius:number; pupilOpacity:number; mode:MascotEyeMode; sparkle:number; tear:number; lash:number }
export interface KawaiiFrame {
  eyes:[MascotEyeFrame,MascotEyeFrame]; eyebrowLeft:string; eyebrowRight:string; eyebrowOpacity:number;
  mouthPath:string; mouthKind:MouthKind; mouthOpacity:number; tongueOpacity:number;
  bodyScaleX:number; bodyScaleY:number; bodyOffsetY:number; headRotation:number; headOffsetX:number; headOffsetY:number;
  leftEarRotation:number; rightEarRotation:number; earScaleY:number; blushOpacity:number; blushScale:number; armLift:number;
  listeningOpacity:number; accentOpacity:number; accentScale:number; accentText:string; statusLabel:string
}
interface MascotGrammar { eyeW:number; eyeH:number; eyeTilt:number; pupilScale:number; gazeX:number; gazeY:number; mode?:MascotEyeMode; asymmetry?:number; headTilt?:number; earL?:number; earR?:number; blush?:number; armLift?:number; browTilt?:number; browY?:number; sparkle?:number; tear?:number; lash?:number }

const grammar:Record<Emotion,MascotGrammar>={
 neutral:{eyeW:36,eyeH:47,eyeTilt:0,pupilScale:1.04,gazeX:0,gazeY:0,blush:.38,lash:.72},
 attentive:{eyeW:38,eyeH:50,eyeTilt:0,pupilScale:1,gazeX:0,gazeY:-2,earL:-4,earR:4,blush:.32,browY:-2,lash:.76},
 happy:{eyeW:38,eyeH:24,eyeTilt:0,pupilScale:.8,gazeX:0,gazeY:0,mode:'happy',blush:.86,earL:-6,earR:6,armLift:5,browY:-1},
 laugh:{eyeW:39,eyeH:22,eyeTilt:0,pupilScale:.75,gazeX:0,gazeY:0,mode:'happy',blush:1,earL:-8,earR:8,armLift:9,browY:-2},
 excited:{eyeW:40,eyeH:52,eyeTilt:1,pupilScale:1.05,gazeX:0,gazeY:-2,blush:.92,earL:-7,earR:7,armLift:10,sparkle:1,lash:.85},
 surprised:{eyeW:41,eyeH:55,eyeTilt:0,pupilScale:.62,gazeX:0,gazeY:0,blush:.42,earL:-2,earR:2,browY:-7,lash:.78},
 curious:{eyeW:37,eyeH:49,eyeTilt:3,pupilScale:.98,gazeX:6,gazeY:-3,asymmetry:.13,headTilt:-6,earL:-12,earR:5,blush:.48,browTilt:5,lash:.78},
 confused:{eyeW:36,eyeH:41,eyeTilt:8,pupilScale:.94,gazeX:-5,gazeY:1,asymmetry:.22,headTilt:5,earL:10,earR:17,blush:.34,browTilt:12,lash:.72},
 proud:{eyeW:37,eyeH:26,eyeTilt:5,pupilScale:.82,gazeX:0,gazeY:-2,mode:'half',blush:.58,headTilt:-3,armLift:3,browTilt:5},
 shy:{eyeW:35,eyeH:42,eyeTilt:0,pupilScale:.94,gazeX:-5,gazeY:5,blush:1,headTilt:4,earL:8,earR:-4,browTilt:-3,lash:.82},
 worried:{eyeW:36,eyeH:41,eyeTilt:-7,pupilScale:.92,gazeX:0,gazeY:3,blush:.3,earL:13,earR:-13,browTilt:-13,tear:.25,lash:.7},
 sad:{eyeW:36,eyeH:40,eyeTilt:-10,pupilScale:.94,gazeX:0,gazeY:5,mode:'sparkle',blush:.26,headTilt:3,earL:18,earR:-18,browTilt:-16,tear:1,sparkle:.75,lash:.68},
 angry:{eyeW:38,eyeH:33,eyeTilt:13,pupilScale:.9,gazeX:0,gazeY:1,mode:'half',blush:.18,earL:14,earR:-14,armLift:5,browTilt:18},
 bored:{eyeW:37,eyeH:24,eyeTilt:0,pupilScale:.88,gazeX:-5,gazeY:2,mode:'half',blush:.24,earL:10,earR:-6,browY:3},
 sleepy:{eyeW:37,eyeH:17,eyeTilt:0,pupilScale:.8,gazeX:0,gazeY:3,mode:'closed',blush:.2,earL:21,earR:-21,browY:3},
 scared:{eyeW:42,eyeH:56,eyeTilt:0,pupilScale:.52,gazeX:0,gazeY:3,blush:.22,earL:6,earR:-6,browY:-8,tear:.15,lash:.76}
}
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v)); const lerp=(a:number,b:number,t:number)=>a+(b-a)*t
function noise(t:number,p:number){return Math.sin(t*.73+p)*.58+Math.sin(t*1.49+p*1.41)*.28+Math.sin(t*2.27+p*.63)*.14}
function blinkOpen(t:number,state:PetState){if(state==='sleep')return .08;const c=(t+.8)%(state==='listening'?5.4:4.25);if(c<.16){const p=c/.16;return p<.45?1-p/.45:(p-.45)/.55}return 1}
function forcedEmotion(state:PetState):Emotion|null{switch(state){case'listening':return'attentive';case'interrupted':return'surprised';case'success':return'happy';case'error':return'confused';case'sleep':return'sleepy';default:return null}}
function ellipsePath(cx:number,cy:number,rx:number,ry:number){const k=.5522847498;return `M ${cx-rx} ${cy} C ${cx-rx} ${cy-ry*k} ${cx-rx*k} ${cy-ry} ${cx} ${cy-ry} C ${cx+rx*k} ${cy-ry} ${cx+rx} ${cy-ry*k} ${cx+rx} ${cy} C ${cx+rx} ${cy+ry*k} ${cx+rx*k} ${cy+ry} ${cx} ${cy+ry} C ${cx-rx*k} ${cy+ry} ${cx-rx} ${cy+ry*k} ${cx-rx} ${cy} Z`}
function mouthFor(emotion:Emotion,state:PetState,talk:number,t:number){
 if(state==='speaking'){const phase=Math.floor((t*8.5)%5);if(talk<.12)return{path:'M 111 133 Q 120 138 129 133',kind:'line' as MouthKind,opacity:.95,tongue:0};if(phase===0)return{path:ellipsePath(120,135,5+talk*4,7+talk*7),kind:'fill' as MouthKind,opacity:1,tongue:.65};if(phase===1)return{path:`M 108 134 Q 120 ${141+talk*5} 132 134 Q 120 ${137+talk*2} 108 134 Z`,kind:'fill' as MouthKind,opacity:1,tongue:.35};if(phase===2)return{path:ellipsePath(120,135,8+talk*6,3+talk*4),kind:'fill' as MouthKind,opacity:1,tongue:.2};if(phase===3)return{path:ellipsePath(120,135,4+talk*3,5+talk*5),kind:'fill' as MouthKind,opacity:1,tongue:.45};return{path:`M 108 132 Q 120 ${146+talk*4} 132 132 Q 120 139 108 132 Z`,kind:'fill' as MouthKind,opacity:1,tongue:.75}}
 switch(emotion){case'happy':return{path:'M 108 131 Q 120 143 132 131',kind:'line' as MouthKind,opacity:1,tongue:0};case'laugh':return{path:'M 106 129 Q 120 149 134 129 Q 120 141 106 129 Z',kind:'fill' as MouthKind,opacity:1,tongue:.8};case'excited':return{path:ellipsePath(120,135,7,7),kind:'fill' as MouthKind,opacity:1,tongue:.65};case'surprised':case'scared':return{path:ellipsePath(120,136,5.5,9),kind:'fill' as MouthKind,opacity:.98,tongue:.2};case'sad':case'worried':return{path:'M 109 140 Q 120 128 131 140',kind:'line' as MouthKind,opacity:.94,tongue:0};case'angry':return{path:'M 109 136 L 116 132 L 123 137 L 131 132',kind:'line' as MouthKind,opacity:.92,tongue:0};case'confused':return{path:'M 109 135 Q 115 130 120 135 Q 126 141 132 135',kind:'line' as MouthKind,opacity:.92,tongue:0};case'bored':return{path:'M 111 136 L 129 136',kind:'line' as MouthKind,opacity:.78,tongue:0};case'sleepy':return{path:'M 113 137 Q 120 140 127 137',kind:'line' as MouthKind,opacity:.65,tongue:0};case'shy':return{path:'M 113 135 Q 120 140 127 135',kind:'line' as MouthKind,opacity:.8,tongue:0};default:return{path:'M 112 132 Q 120 139 128 132',kind:'line' as MouthKind,opacity:.92,tongue:0}}
}
function eyebrowPath(x:number,y:number,tilt:number,side:-1|1){const dx=15,dy=Math.tan(tilt*Math.PI/180)*dx*.45;return `M ${x-dx} ${y+dy*side} Q ${x} ${y-3} ${x+dx} ${y-dy*side}`}
export function sampleKawaii(t:number,controls:Controls):KawaiiFrame{
 const stateEmotion=forcedEmotion(controls.state),emotion=stateEmotion??controls.emotion,target=grammar[emotion],neutral=grammar.neutral,weight=stateEmotion?1:clamp(controls.emotionWeight),blink=blinkOpen(t,controls.state)
 let mode:MascotEyeMode=target.mode??'open';if((mode==='open'||mode==='sparkle')&&blink<.22)mode='closed';const w=lerp(neutral.eyeW,target.eyeW,weight),openH=lerp(neutral.eyeH,target.eyeH,weight),h=(mode==='open'||mode==='sparkle'||mode==='half')?Math.max(4,openH*Math.max(.1,blink)):openH,tilt=lerp(neutral.eyeTilt,target.eyeTilt,weight),asym=(target.asymmetry??0)*weight
 const still=controls.state==='listening'?.18:controls.state==='speaking'?.35:1,scan=controls.state==='thinking'?Math.sin(t*1.25)*5:0,gx=clamp(controls.gazeX*8+target.gazeX*weight+noise(t*.25,1.1)*1.5*still+scan,-11,11),gy=clamp(controls.gazeY*6+target.gazeY*weight+noise(t*.22,2.4)*1.1*still,-8,8),pr=9.8*lerp(1,target.pupilScale,weight),po=(mode==='open'||mode==='sparkle'||mode==='half')?clamp((blink-.12)/.5):0,sparkle=lerp(0,target.sparkle??0,weight),tear=lerp(0,target.tear??0,weight),lash=lerp(neutral.lash??.7,target.lash??.7,weight)
 const eyes:[MascotEyeFrame,MascotEyeFrame]=[{x:98,y:101-asym*3,width:w*(1+asym*.18),height:h*(1+asym*.08),rotation:-tilt,pupilX:gx,pupilY:gy,pupilRadius:pr*(1+asym*.08),pupilOpacity:po,mode,sparkle,tear,lash},{x:142,y:101+asym*3,width:w*(1-asym*.16),height:h*(1-asym*.1),rotation:tilt,pupilX:gx*.94,pupilY:gy,pupilRadius:pr*(1-asym*.06),pupilOpacity:po,mode,sparkle,tear,lash}];if(emotion==='curious'&&mode==='open')eyes[1].mode='wink'
 const talk=controls.state==='speaking'?clamp(controls.talkLevel):0,mouth=mouthFor(emotion,controls.state,talk,t),breath=Math.sin(t*(controls.state==='sleep'?1.12:1.62)),bounce=controls.state==='success'||emotion==='excited'||emotion==='laugh'?Math.abs(Math.sin(t*4.8))*2.8:0,interrupted=controls.state==='interrupted'?Math.sin(t*28)*2.8*Math.exp(-(t%1)*5):0,browTilt=(target.browTilt??0)*weight,browY=77+(target.browY??0)*weight,headTilt=(target.headTilt??0)*weight+(controls.state==='thinking'?Math.sin(t*1.1)*2.2:0),baseEarL=(target.earL??0)*weight,baseEarR=(target.earR??0)*weight,perk=controls.state==='listening'?Math.sin(t*3.1)*1.5:0,thinkingEar=controls.state==='thinking'?Math.sin(t*2.3)*5:0
 let accentText='',accentOpacity=0;if(controls.state==='thinking'){accentText='···';accentOpacity=.75}if(controls.state==='notify'){accentText='!';accentOpacity=1}if(controls.state==='success'){accentText='✦';accentOpacity=1}if(controls.state==='error'){accentText='?';accentOpacity=.95}if(controls.state==='sleep'){accentText='Z';accentOpacity=.65}
 return{eyes,eyebrowLeft:eyebrowPath(98,browY,browTilt,-1),eyebrowRight:eyebrowPath(142,browY,browTilt,1),eyebrowOpacity:emotion==='sleepy'?.35:.92,mouthPath:mouth.path,mouthKind:mouth.kind,mouthOpacity:mouth.opacity,tongueOpacity:mouth.tongue,bodyScaleX:1-breath*.004-talk*.004,bodyScaleY:1+breath*(controls.state==='sleep'?.014:.006)+talk*.008,bodyOffsetY:breath*(controls.state==='sleep'?1.4:.55)-bounce,headRotation:headTilt,headOffsetX:interrupted,headOffsetY:-bounce*.25,leftEarRotation:baseEarL+perk+thinkingEar,rightEarRotation:baseEarR-perk-thinkingEar*.35,earScaleY:controls.state==='listening'?1.07:controls.state==='sleep'?.92:1,blushOpacity:lerp(neutral.blush??0,target.blush??0,weight),blushScale:.94+.06*Math.sin(t*2.2),armLift:(target.armLift??0)*weight+(controls.state==='speaking'?talk*2:0),listeningOpacity:controls.state==='listening'?.45+.35*(.5+.5*Math.sin(t*4.1)):0,accentOpacity,accentScale:.92+.08*Math.sin(t*3.8),accentText,statusLabel:`${controls.state.toUpperCase()} · ${emotion.toUpperCase()} · KAWAII`}
}

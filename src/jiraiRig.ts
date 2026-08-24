export type JiraiEmotion='neutral'|'happy'|'wink'|'surprised'|'sad'|'annoyed'|'sleepy'|'excited'
export type EyeMode='open'|'happy'|'wink'|'half'|'closed'|'sparkle'
export type Viseme='REST'|'SMILE'|'A'|'E'|'I'|'O'|'U'
export type VectorMouth='neutral'|'smile'|'frown'|'annoyed'
export interface SpriteRect{x:number;y:number;w:number;h:number}

export const JIRAI_EMOTIONS:JiraiEmotion[]=['neutral','happy','wink','surprised','sad','annoyed','sleepy','excited']
export const VISEMES:Viseme[]=['REST','SMILE','A','E','I','O','U']
const asset=(path:string)=>`${import.meta.env.BASE_URL}assets/jirai/rig-v3/${path}`
const referenceAsset=(emotion:JiraiEmotion)=>`${import.meta.env.BASE_URL}assets/jirai/expressions/${emotion}.png`
export const RIG_BASE_ASSET=asset('base/base_clean.png')
export const PARTS_ATLAS_ASSET=asset('parts_atlas.png')
export const PARTS_ATLAS_SIZE={width:256,height:331} as const
export const REFERENCE_ASSET:Record<JiraiEmotion,string>=Object.fromEntries(JIRAI_EMOTIONS.map(e=>[e,referenceAsset(e)])) as Record<JiraiEmotion,string>

const R=(x:number,y:number,w:number,h:number):SpriteRect=>({x,y,w,h})
const SPRITE={
 closedL:R(4,4,48,14),closedR:R(56,4,48,14),halfL:R(108,4,49,34),halfR:R(161,4,45,34),
 happyL:R(4,42,50,27),happyR:R(58,42,50,27),openL:R(112,42,52,55),openR:R(168,42,52,55),
 sparkleL:R(4,101,54,51),sparkleR:R(62,101,54,51),winkR:R(120,101,40,31),
 mouthA:R(164,101,43,35),mouthE:R(4,156,46,29),mouthI:R(54,156,42,32),mouthO:R(100,156,23,32),
 mouthREST:R(127,156,38,10),mouthSMILE:R(169,156,42,13),mouthU:R(215,156,18,25),
 annoyedL:R(4,192,69,43),annoyedR:R(77,192,68,47),sadL:R(149,192,59,63),sadR:R(4,259,63,68)
} as const

interface EyeAssetPair{left:SpriteRect;right:SpriteRect}
export const EYE_ASSET:Record<EyeMode,EyeAssetPair>={
 open:{left:SPRITE.openL,right:SPRITE.openR},happy:{left:SPRITE.happyL,right:SPRITE.happyR},
 wink:{left:SPRITE.openL,right:SPRITE.winkR},half:{left:SPRITE.halfL,right:SPRITE.halfR},
 closed:{left:SPRITE.closedL,right:SPRITE.closedR},sparkle:{left:SPRITE.sparkleL,right:SPRITE.sparkleR}
}
export const VISEME_RECT:Record<Viseme,SpriteRect>={REST:SPRITE.mouthREST,SMILE:SPRITE.mouthSMILE,A:SPRITE.mouthA,E:SPRITE.mouthE,I:SPRITE.mouthI,O:SPRITE.mouthO,U:SPRITE.mouthU}

interface BrowPose{y:number;tilt:number;arch:number}
interface Pose{eyes:EyeMode;eyeX:number;eyeY:number;leftEyeRotation:number;rightEyeRotation:number;brow:BrowPose;mouth:{kind:'vector';value:VectorMouth}|{kind:'sprite';value:Viseme;transitionLine:VectorMouth};rootY:number;rootRotation:number;gesture?:'sad'|'annoyed'}
const POSE:Record<JiraiEmotion,Pose>={
 neutral:{eyes:'open',eyeX:0,eyeY:0,leftEyeRotation:0,rightEyeRotation:0,brow:{y:133,tilt:0,arch:4},mouth:{kind:'vector',value:'neutral'},rootY:0,rootRotation:0},
 happy:{eyes:'happy',eyeX:0,eyeY:2,leftEyeRotation:0,rightEyeRotation:0,brow:{y:134,tilt:-2,arch:5},mouth:{kind:'sprite',value:'A',transitionLine:'smile'},rootY:-.3,rootRotation:0},
 wink:{eyes:'wink',eyeX:0,eyeY:1,leftEyeRotation:0,rightEyeRotation:0,brow:{y:133,tilt:2,arch:4},mouth:{kind:'sprite',value:'A',transitionLine:'smile'},rootY:0,rootRotation:-.28},
 surprised:{eyes:'open',eyeX:0,eyeY:-1,leftEyeRotation:0,rightEyeRotation:0,brow:{y:126,tilt:0,arch:5},mouth:{kind:'sprite',value:'O',transitionLine:'neutral'},rootY:-.4,rootRotation:0},
 sad:{eyes:'sparkle',eyeX:0,eyeY:3,leftEyeRotation:0,rightEyeRotation:0,brow:{y:132,tilt:-13,arch:2},mouth:{kind:'vector',value:'frown'},rootY:.7,rootRotation:.15,gesture:'sad'},
 annoyed:{eyes:'half',eyeX:0,eyeY:7,leftEyeRotation:0,rightEyeRotation:0,brow:{y:135,tilt:14,arch:1},mouth:{kind:'vector',value:'annoyed'},rootY:.25,rootRotation:.2,gesture:'annoyed'},
 sleepy:{eyes:'closed',eyeX:0,eyeY:7,leftEyeRotation:0,rightEyeRotation:0,brow:{y:137,tilt:0,arch:3},mouth:{kind:'sprite',value:'U',transitionLine:'neutral'},rootY:.65,rootRotation:0},
 excited:{eyes:'open',eyeX:0,eyeY:0,leftEyeRotation:0,rightEyeRotation:0,brow:{y:130,tilt:-2,arch:5},mouth:{kind:'sprite',value:'E',transitionLine:'smile'},rootY:-.25,rootRotation:0}
}

export interface EyeFrame{rect:SpriteRect;closedRect:SpriteRect;x:number;y:number;rotation:number;reveal:number;closedOpacity:number}
export interface MouthSpriteLayer{rect:SpriteRect;reveal:number}
export interface GestureLayer{rect:SpriteRect;x:number;y:number;offsetY:number}
export interface JiraiFrame{baseSrc:string;atlasSrc:string;referenceSrc:string;emotion:JiraiEmotion;transitionProgress:number;rootY:number;rootRotation:number;eyes:[EyeFrame,EyeFrame];browLeft:string;browRight:string;mouthVectorPath?:string;mouthVectorVisible:boolean;mouthSprites:MouthSpriteLayer[];gestures:GestureLayer[];statusLabel:string}
export interface JiraiInput{t:number;fromEmotion:JiraiEmotion;toEmotion:JiraiEmotion;emotionProgress:number;speaking:boolean;fromViseme:Viseme;toViseme:Viseme;visemeProgress:number;talkLevel:number}

const LEFT_EYE_X=125,RIGHT_EYE_X=233,EYE_Y=168
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v)),lerp=(a:number,b:number,t:number)=>a+(b-a)*t
const smoothstep=(a:number,b:number,x:number)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)}
const ease=(p:number)=>{p=clamp(p);return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2}
function idleBlink(t:number,mode:EyeMode){if(mode==='closed'||mode==='happy')return 0;const c=(t+.37)%4.35;if(c>.18)return 0;const p=c/.18;return clamp(p<.46?p/.46:(1-p)/.54)}
function transitionClosure(p:number){if(p<=0||p>=1)return 0;return Math.pow(Math.sin(Math.PI*p),6)}
function browPath(cx:number,y:number,tilt:number,arch:number,side:-1|1){const h=17,s=Math.tan(tilt*Math.PI/180)*h,y0=y+(side===-1?-s:s),y1=y+(side===-1?s:-s);return `M ${(cx-h).toFixed(2)} ${y0.toFixed(2)} Q ${cx.toFixed(2)} ${(y-arch).toFixed(2)} ${(cx+h).toFixed(2)} ${y1.toFixed(2)}`}
type Point=[number,number];type MouthControl=[Point,Point,Point,Point,Point,Point,Point]
const VECTOR_MOUTH:Record<VectorMouth,MouthControl>={neutral:[[164,217],[168,224],[173,224],[179,217],[185,224],[190,224],[194,217]],smile:[[164,216],[168,221],[173,223],[179,224],[185,223],[190,221],[194,216]],frown:[[164,222],[168,217],[173,214],[179,214],[185,214],[190,217],[194,222]],annoyed:[[164,220],[168,216],[173,221],[179,217],[185,221],[190,216],[194,220]]}
function interpolateMouth(a:VectorMouth,b:VectorMouth,p:number){const A=VECTOR_MOUTH[a],B=VECTOR_MOUTH[b],P=A.map((pt,i)=>[lerp(pt[0],B[i][0],p),lerp(pt[1],B[i][1],p)] as Point) as MouthControl;return `M ${P[0][0].toFixed(2)} ${P[0][1].toFixed(2)} C ${P[1][0].toFixed(2)} ${P[1][1].toFixed(2)} ${P[2][0].toFixed(2)} ${P[2][1].toFixed(2)} ${P[3][0].toFixed(2)} ${P[3][1].toFixed(2)} C ${P[4][0].toFixed(2)} ${P[4][1].toFixed(2)} ${P[5][0].toFixed(2)} ${P[5][1].toFixed(2)} ${P[6][0].toFixed(2)} ${P[6][1].toFixed(2)}`}
const sprite=(v:Viseme,reveal:number):MouthSpriteLayer=>({rect:VISEME_RECT[v],reveal:clamp(reveal)})
function emotionMouth(from:Pose['mouth'],to:Pose['mouth'],p:number){const q=ease(p);if(from.kind==='vector'&&to.kind==='vector')return{path:interpolateMouth(from.value,to.value,q),visible:true,sprites:[] as MouthSpriteLayer[]};if(from.kind==='vector'&&to.kind==='sprite'){const reveal=smoothstep(.58,1,q);return{path:interpolateMouth(from.value,to.transitionLine,clamp(q/.68)),visible:reveal<.28,sprites:[sprite(to.value,reveal)]}};if(from.kind==='sprite'&&to.kind==='vector'){const close=1-smoothstep(0,.43,q);return{path:interpolateMouth(from.transitionLine,to.value,smoothstep(.34,1,q)),visible:q>.34,sprites:[sprite(from.value,close)]}};const a=from as Extract<Pose['mouth'],{kind:'sprite'}>,b=to as Extract<Pose['mouth'],{kind:'sprite'}>;return{path:interpolateMouth(a.transitionLine,b.transitionLine,smoothstep(.38,.62,q)),visible:q>=.38&&q<=.62,sprites:[sprite(a.value,1-smoothstep(0,.43,q)),sprite(b.value,smoothstep(.57,1,q))]}}
function speakingMouth(from:Viseme,to:Viseme,p:number,talk:number){const a=talk<.1?'REST':from,b=talk<.1?'REST':to;if(a===b||p>=1)return{visible:false,sprites:[sprite(b,1)] as MouthSpriteLayer[]};const q=ease(p),bridge=smoothstep(.3,.48,q)*(1-smoothstep(.52,.7,q));return{visible:false,sprites:[sprite(a,1-smoothstep(0,.46,q)),sprite('REST',bridge),sprite(b,smoothstep(.54,1,q))] as MouthSpriteLayer[]}}
function gestureFor(kind:'sad'|'annoyed',offsetY:number):GestureLayer[]{return kind==='sad'?[{rect:SPRITE.sadL,x:143.5,y:274.5,offsetY},{rect:SPRITE.sadR,x:219.5,y:276,offsetY}]:[{rect:SPRITE.annoyedL,x:146.5,y:317.5,offsetY},{rect:SPRITE.annoyedR,x:217,y:315.5,offsetY}]}

export function sampleJirai(input:JiraiInput):JiraiFrame{const p=clamp(input.emotionProgress),q=ease(p),from=POSE[input.fromEmotion],to=POSE[input.toEmotion],mode=p<.5?from.eyes:to.eyes,eyeAsset=EYE_ASSET[mode],closure=Math.max(transitionClosure(p),idleBlink(input.t,input.toEmotion===input.fromEmotion?to.eyes:mode)),reveal=1-closure,closedOpacity=smoothstep(.62,.94,closure),eyeX=lerp(from.eyeX,to.eyeX,q),eyeY=lerp(from.eyeY,to.eyeY,q),browY=lerp(from.brow.y,to.brow.y,q),browTilt=lerp(from.brow.tilt,to.brow.tilt,q),browArch=lerp(from.brow.arch,to.brow.arch,q),breath=Math.sin(input.t*(input.toEmotion==='sleepy'?1.1:1.48))*.36,excited=input.toEmotion==='excited'?Math.abs(Math.sin(input.t*3.4))*.7:0,rootY=lerp(from.rootY,to.rootY,q)+breath-excited,rootRotation=lerp(from.rootRotation,to.rootRotation,q),mouth=input.speaking?speakingMouth(input.fromViseme,input.toViseme,clamp(input.visemeProgress),clamp(input.talkLevel)):emotionMouth(from.mouth,to.mouth,p),gestures:GestureLayer[]=[];if(from.gesture===to.gesture&&to.gesture)gestures.push(...gestureFor(to.gesture,0));else{if(from.gesture&&q<.5)gestures.push(...gestureFor(from.gesture,smoothstep(0,.5,q)*16));if(to.gesture&&q>=.5)gestures.push(...gestureFor(to.gesture,(1-smoothstep(.5,1,q))*16))}return{baseSrc:RIG_BASE_ASSET,atlasSrc:PARTS_ATLAS_ASSET,referenceSrc:REFERENCE_ASSET[input.toEmotion],emotion:input.toEmotion,transitionProgress:p,rootY,rootRotation,eyes:[{rect:eyeAsset.left,closedRect:SPRITE.closedL,x:LEFT_EYE_X+eyeX,y:EYE_Y+eyeY,rotation:lerp(from.leftEyeRotation,to.leftEyeRotation,q),reveal,closedOpacity},{rect:eyeAsset.right,closedRect:SPRITE.closedR,x:RIGHT_EYE_X+eyeX,y:EYE_Y+eyeY,rotation:lerp(from.rightEyeRotation,to.rightEyeRotation,q),reveal,closedOpacity}],browLeft:browPath(125,browY,browTilt,browArch,-1),browRight:browPath(233,browY,browTilt,browArch,1),mouthVectorPath:mouth.path,mouthVectorVisible:mouth.visible,mouthSprites:mouth.sprites,gestures,statusLabel:`${input.toEmotion.toUpperCase()} · CUTOUT RIG V3${input.speaking?` · ${input.toViseme}`:''}`}}
export const RIG_V3_RULES={rasterMorph:false,emotionTransitionMs:430,eyeSwapAtProgress:.5,eyeSwapRequiresClosure:.9,visemeGateMs:90} as const

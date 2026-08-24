export type JiraiEmotion = 'neutral' | 'happy' | 'wink' | 'surprised' | 'sad' | 'annoyed' | 'sleepy' | 'excited'
export type EyeMode = 'open' | 'happy' | 'wink' | 'half' | 'closed' | 'sparkle'
export type Viseme = 'REST' | 'SMILE' | 'A' | 'E' | 'I' | 'O' | 'U'
export type VectorMouth = 'neutral' | 'smile' | 'frown' | 'annoyed'

export const JIRAI_EMOTIONS: JiraiEmotion[] = ['neutral','happy','wink','surprised','sad','annoyed','sleepy','excited']
export const VISEMES: Viseme[] = ['REST','SMILE','A','E','I','O','U']

const asset = (path: string) => `${import.meta.env.BASE_URL}assets/jirai/rig-v3/${path}`
const referenceAsset = (emotion: JiraiEmotion) => `${import.meta.env.BASE_URL}assets/jirai/expressions/${emotion}.png`

export const RIG_BASE_ASSET = asset('base/base_clean.png')
export const REFERENCE_ASSET: Record<JiraiEmotion,string> = Object.fromEntries(
  JIRAI_EMOTIONS.map(emotion => [emotion, referenceAsset(emotion)])
) as Record<JiraiEmotion,string>

interface EyeAssetPair {
  left: string
  right: string
  leftW: number
  leftH: number
  rightW: number
  rightH: number
}

export const EYE_ASSET: Record<EyeMode,EyeAssetPair> = {
  open:    { left:asset('eyes/open_L.png'),    right:asset('eyes/open_R.png'),    leftW:52,leftH:55,rightW:52,rightH:55 },
  happy:   { left:asset('eyes/happy_L.png'),   right:asset('eyes/happy_R.png'),   leftW:50,leftH:27,rightW:50,rightH:27 },
  wink:    { left:asset('eyes/open_L.png'),    right:asset('eyes/wink_R.png'),    leftW:52,leftH:55,rightW:40,rightH:31 },
  half:    { left:asset('eyes/half_L.png'),    right:asset('eyes/half_R.png'),    leftW:49,leftH:34,rightW:45,rightH:34 },
  closed:  { left:asset('eyes/closed_L.png'),  right:asset('eyes/closed_R.png'),  leftW:48,leftH:14,rightW:48,rightH:14 },
  sparkle: { left:asset('eyes/sparkle_L.png'), right:asset('eyes/sparkle_R.png'), leftW:54,leftH:51,rightW:54,rightH:51 }
}

export const VISEME_ASSET: Record<Viseme,string> = Object.fromEntries(
  VISEMES.map(v => [v, asset(`mouth/${v}.png`)])
) as Record<Viseme,string>

const VISEME_SIZE: Record<Viseme,[number,number]> = {
  REST:[38,10], SMILE:[42,13], A:[43,35], E:[46,29], I:[42,32], O:[23,32], U:[18,25]
}

interface BrowPose { y:number; tilt:number; arch:number }
interface Pose {
  eyes: EyeMode
  eyeX: number
  eyeY: number
  leftEyeRotation: number
  rightEyeRotation: number
  brow: BrowPose
  mouth: { kind:'vector'; value:VectorMouth } | { kind:'sprite'; value:Viseme; transitionLine:VectorMouth }
  rootY: number
  rootRotation: number
  gesture?: 'sad' | 'annoyed'
}

const POSE: Record<JiraiEmotion,Pose> = {
  neutral:   { eyes:'open',    eyeX:0, eyeY:0,  leftEyeRotation:0,rightEyeRotation:0,brow:{y:133,tilt:0,arch:4},   mouth:{kind:'vector',value:'neutral'}, rootY:0,  rootRotation:0 },
  happy:     { eyes:'happy',   eyeX:0, eyeY:2,  leftEyeRotation:0,rightEyeRotation:0,brow:{y:134,tilt:-2,arch:5},  mouth:{kind:'sprite',value:'A',transitionLine:'smile'}, rootY:-.3,rootRotation:0 },
  wink:      { eyes:'wink',    eyeX:0, eyeY:1,  leftEyeRotation:0,rightEyeRotation:0,brow:{y:133,tilt:2,arch:4},   mouth:{kind:'sprite',value:'A',transitionLine:'smile'}, rootY:0,  rootRotation:-.28 },
  surprised: { eyes:'open',    eyeX:0, eyeY:-1, leftEyeRotation:0,rightEyeRotation:0,brow:{y:126,tilt:0,arch:5},   mouth:{kind:'sprite',value:'O',transitionLine:'neutral'}, rootY:-.4,rootRotation:0 },
  sad:       { eyes:'sparkle', eyeX:0, eyeY:3,  leftEyeRotation:0,rightEyeRotation:0,brow:{y:132,tilt:-13,arch:2}, mouth:{kind:'vector',value:'frown'}, rootY:.7, rootRotation:.15, gesture:'sad' },
  annoyed:   { eyes:'half',    eyeX:0, eyeY:7,  leftEyeRotation:0,rightEyeRotation:0,brow:{y:135,tilt:14,arch:1},  mouth:{kind:'vector',value:'annoyed'}, rootY:.25,rootRotation:.2, gesture:'annoyed' },
  sleepy:    { eyes:'closed',  eyeX:0, eyeY:7,  leftEyeRotation:0,rightEyeRotation:0,brow:{y:137,tilt:0,arch:3},   mouth:{kind:'sprite',value:'U',transitionLine:'neutral'}, rootY:.65,rootRotation:0 },
  excited:   { eyes:'open',    eyeX:0, eyeY:0,  leftEyeRotation:0,rightEyeRotation:0,brow:{y:130,tilt:-2,arch:5},  mouth:{kind:'sprite',value:'E',transitionLine:'smile'}, rootY:-.25,rootRotation:0 }
}

export interface EyeFrame {
  src: string
  closedSrc: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  reveal: number
  closedOpacity: number
}

export interface MouthSpriteLayer {
  src: string
  width: number
  height: number
  reveal: number
}

export interface GestureLayer {
  src: string
  x: number
  y: number
  width: number
  height: number
  offsetY: number
}

export interface JiraiFrame {
  baseSrc: string
  referenceSrc: string
  emotion: JiraiEmotion
  transitionProgress: number
  rootY: number
  rootRotation: number
  eyes: [EyeFrame,EyeFrame]
  browLeft: string
  browRight: string
  mouthVectorPath?: string
  mouthVectorVisible: boolean
  mouthSprites: MouthSpriteLayer[]
  gestures: GestureLayer[]
  statusLabel: string
}

export interface JiraiInput {
  t: number
  fromEmotion: JiraiEmotion
  toEmotion: JiraiEmotion
  emotionProgress: number
  speaking: boolean
  fromViseme: Viseme
  toViseme: Viseme
  visemeProgress: number
  talkLevel: number
}

const LEFT_EYE_X = 125
const RIGHT_EYE_X = 233
const EYE_Y = 168
const MOUTH_X = 179
const MOUTH_Y = 220

const clamp = (v:number,min=0,max=1) => Math.max(min,Math.min(max,v))
const lerp = (a:number,b:number,t:number) => a+(b-a)*t
const smoothstep = (a:number,b:number,x:number) => {
  const t=clamp((x-a)/(b-a))
  return t*t*(3-2*t)
}
const ease = (p:number) => {
  p=clamp(p)
  return p<.5 ? 4*p*p*p : 1-Math.pow(-2*p+2,3)/2
}

function idleBlink(t:number, mode:EyeMode):number {
  if (mode==='closed' || mode==='happy') return 0
  const cycle=(t+.37)%4.35
  if (cycle>.18) return 0
  const p=cycle/.18
  const tri=p<.46?p/.46:(1-p)/.54
  return clamp(tri)
}

function transitionClosure(p:number):number {
  if (p<=0 || p>=1) return 0
  return Math.pow(Math.sin(Math.PI*p),6)
}

function browPath(cx:number,y:number,tilt:number,arch:number,side:-1|1):string {
  const half=17
  const slope=Math.tan(tilt*Math.PI/180)*half
  const y0=y+(side===-1?-slope:slope)
  const y1=y+(side===-1?slope:-slope)
  return `M ${(cx-half).toFixed(2)} ${y0.toFixed(2)} Q ${cx.toFixed(2)} ${(y-arch).toFixed(2)} ${(cx+half).toFixed(2)} ${y1.toFixed(2)}`
}

type Point=[number,number]
type MouthControl=[Point,Point,Point,Point,Point,Point,Point]
const VECTOR_MOUTH: Record<VectorMouth,MouthControl> = {
  neutral:[[164,217],[168,224],[173,224],[179,217],[185,224],[190,224],[194,217]],
  smile:[[164,216],[168,221],[173,223],[179,224],[185,223],[190,221],[194,216]],
  frown:[[164,222],[168,217],[173,214],[179,214],[185,214],[190,217],[194,222]],
  annoyed:[[164,220],[168,216],[173,221],[179,217],[185,221],[190,216],[194,220]]
}

function interpolateMouth(a:VectorMouth,b:VectorMouth,p:number):string {
  const A=VECTOR_MOUTH[a],B=VECTOR_MOUTH[b],P=A.map((pt,i)=>[lerp(pt[0],B[i][0],p),lerp(pt[1],B[i][1],p)] as Point) as MouthControl
  return `M ${P[0][0].toFixed(2)} ${P[0][1].toFixed(2)} C ${P[1][0].toFixed(2)} ${P[1][1].toFixed(2)} ${P[2][0].toFixed(2)} ${P[2][1].toFixed(2)} ${P[3][0].toFixed(2)} ${P[3][1].toFixed(2)} C ${P[4][0].toFixed(2)} ${P[4][1].toFixed(2)} ${P[5][0].toFixed(2)} ${P[5][1].toFixed(2)} ${P[6][0].toFixed(2)} ${P[6][1].toFixed(2)}`
}

function sprite(viseme:Viseme,reveal:number):MouthSpriteLayer {
  const [width,height]=VISEME_SIZE[viseme]
  return {src:VISEME_ASSET[viseme],width,height,reveal:clamp(reveal)}
}

function emotionMouth(from:Pose['mouth'],to:Pose['mouth'],p:number):{path?:string;visible:boolean;sprites:MouthSpriteLayer[]} {
  const q=ease(p)
  if (from.kind==='vector' && to.kind==='vector') {
    return {path:interpolateMouth(from.value,to.value,q),visible:true,sprites:[]}
  }
  if (from.kind==='vector' && to.kind==='sprite') {
    const lineP=clamp(q/.68)
    const reveal=smoothstep(.58,1,q)
    return {path:interpolateMouth(from.value,to.transitionLine,lineP),visible:reveal<.28,sprites:[sprite(to.value,reveal)]}
  }
  if (from.kind==='sprite' && to.kind==='vector') {
    const close=1-smoothstep(0,.43,q)
    const lineP=smoothstep(.34,1,q)
    return {path:interpolateMouth(from.transitionLine,to.value,lineP),visible:q>.34,sprites:[sprite(from.value,close)]}
  }
  const fromSprite=from as Extract<Pose['mouth'],{kind:'sprite'}>
  const toSprite=to as Extract<Pose['mouth'],{kind:'sprite'}>
  const close=1-smoothstep(0,.43,q)
  const open=smoothstep(.57,1,q)
  const bridgeVisible=q>=.38 && q<=.62
  return {path:interpolateMouth(fromSprite.transitionLine,toSprite.transitionLine,smoothstep(.38,.62,q)),visible:bridgeVisible,sprites:[sprite(fromSprite.value,close),sprite(toSprite.value,open)]}
}

function speakingMouth(fromViseme:Viseme,toViseme:Viseme,p:number,talkLevel:number):{path?:string;visible:boolean;sprites:MouthSpriteLayer[]} {
  const target=talkLevel<.1?'REST':toViseme
  const source=talkLevel<.1?'REST':fromViseme
  if (source===target || p>=1) return {visible:false,sprites:[sprite(target,1)]}
  const q=ease(p)
  const close=1-smoothstep(0,.46,q)
  const open=smoothstep(.54,1,q)
  const bridge=smoothstep(.3,.48,q)*(1-smoothstep(.52,.7,q))
  return {visible:false,sprites:[sprite(source,close),sprite('REST',bridge),sprite(target,open)]}
}

function gestureFor(kind:'sad'|'annoyed',offsetY:number):GestureLayer[] {
  if (kind==='sad') return [
    {src:asset('gestures/sad_left.png'),x:143.5,y:274.5,width:59,height:63,offsetY},
    {src:asset('gestures/sad_right.png'),x:219.5,y:276,width:63,height:68,offsetY}
  ]
  return [
    {src:asset('gestures/annoyed_left.png'),x:146.5,y:317.5,width:69,height:43,offsetY},
    {src:asset('gestures/annoyed_right.png'),x:217,y:315.5,width:68,height:47,offsetY}
  ]
}

export function sampleJirai(input:JiraiInput):JiraiFrame {
  const p=clamp(input.emotionProgress)
  const q=ease(p)
  const from=POSE[input.fromEmotion]
  const to=POSE[input.toEmotion]
  const activeEyes=p<.5?from.eyes:to.eyes
  const eyeAsset=EYE_ASSET[activeEyes]
  const eyeClosure=Math.max(transitionClosure(p),idleBlink(input.t,input.toEmotion===input.fromEmotion?to.eyes:activeEyes))
  const eyeReveal=1-eyeClosure
  const closedOpacity=smoothstep(.62,.94,eyeClosure)
  const eyeX=lerp(from.eyeX,to.eyeX,q)
  const eyeY=lerp(from.eyeY,to.eyeY,q)
  const browY=lerp(from.brow.y,to.brow.y,q)
  const browTilt=lerp(from.brow.tilt,to.brow.tilt,q)
  const browArch=lerp(from.brow.arch,to.brow.arch,q)
  const breath=Math.sin(input.t*(input.toEmotion==='sleepy'?1.1:1.48))*.36
  const excited=input.toEmotion==='excited'?Math.abs(Math.sin(input.t*3.4))*.7:0
  const rootY=lerp(from.rootY,to.rootY,q)+breath-excited
  const rootRotation=lerp(from.rootRotation,to.rootRotation,q)
  const mouth=input.speaking
    ? speakingMouth(input.fromViseme,input.toViseme,clamp(input.visemeProgress),clamp(input.talkLevel))
    : emotionMouth(from.mouth,to.mouth,p)

  const gestures:GestureLayer[]=[]
  if (from.gesture===to.gesture && to.gesture) gestures.push(...gestureFor(to.gesture,0))
  else {
    if (from.gesture && q<.5) gestures.push(...gestureFor(from.gesture,smoothstep(0,.5,q)*16))
    if (to.gesture && q>=.5) gestures.push(...gestureFor(to.gesture,(1-smoothstep(.5,1,q))*16))
  }

  return {
    baseSrc:RIG_BASE_ASSET,
    referenceSrc:REFERENCE_ASSET[input.toEmotion],
    emotion:input.toEmotion,
    transitionProgress:p,
    rootY,
    rootRotation,
    eyes:[
      {src:eyeAsset.left,closedSrc:EYE_ASSET.closed.left,x:LEFT_EYE_X+eyeX,y:EYE_Y+eyeY,width:eyeAsset.leftW,height:eyeAsset.leftH,rotation:lerp(from.leftEyeRotation,to.leftEyeRotation,q),reveal:eyeReveal,closedOpacity},
      {src:eyeAsset.right,closedSrc:EYE_ASSET.closed.right,x:RIGHT_EYE_X+eyeX,y:EYE_Y+eyeY,width:eyeAsset.rightW,height:eyeAsset.rightH,rotation:lerp(from.rightEyeRotation,to.rightEyeRotation,q),reveal:eyeReveal,closedOpacity}
    ],
    browLeft:browPath(125,browY,browTilt,browArch,-1),
    browRight:browPath(233,browY,browTilt,browArch,1),
    mouthVectorPath:mouth.path,
    mouthVectorVisible:mouth.visible,
    mouthSprites:mouth.sprites,
    gestures,
    statusLabel:`${input.toEmotion.toUpperCase()} · CUTOUT RIG V3${input.speaking?` · ${input.toViseme}`:''}`
  }
}

export const RIG_V3_RULES = {
  rasterMorph:false,
  emotionTransitionMs:430,
  eyeSwapAtProgress:.5,
  eyeSwapRequiresClosure:.9,
  visemeGateMs:90
} as const

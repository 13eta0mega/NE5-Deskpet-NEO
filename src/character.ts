export type PetState = 'boot' | 'idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted' | 'notify' | 'success' | 'error' | 'sleep'
export type Emotion = 'neutral' | 'attentive' | 'happy' | 'laugh' | 'excited' | 'surprised' | 'curious' | 'confused' | 'proud' | 'shy' | 'worried' | 'sad' | 'angry' | 'bored' | 'sleepy' | 'scared'

export interface Controls {
  state: PetState
  emotion: Emotion
  emotionWeight: number
  gazeX: number
  gazeY: number
  talkLevel: number
  pointerActive: boolean
}

export interface EyeFrame {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  open: number
}

export interface CharacterFrame {
  bodyPath: string
  eyes: [EyeFrame, EyeFrame]
  mouthPath: string | null
  mouthOpacity: number
  accentOpacity: number
  accentScale: number
  bodyScaleX: number
  bodyScaleY: number
  bodyRotation: number
  bodyOffsetY: number
  statusLabel: string
}

interface EyeGrammar {
  w: number
  h: number
  tilt: number
  gazeX: number
  gazeY: number
  asymmetry?: number
  openness?: number
}

const TAU = Math.PI * 2
const SAMPLES = 64
const cx = 160
const cy = 160
const baseRadius = 94

export const STATES: PetState[] = ['boot', 'idle', 'listening', 'thinking', 'speaking', 'interrupted', 'notify', 'success', 'error', 'sleep']
export const EMOTIONS: Emotion[] = ['neutral', 'attentive', 'happy', 'laugh', 'excited', 'surprised', 'curious', 'confused', 'proud', 'shy', 'worried', 'sad', 'angry', 'bored', 'sleepy', 'scared']

const grammar: Record<Emotion, EyeGrammar> = {
  neutral:    { w: 20, h: 38, tilt: 0, gazeX: 0, gazeY: 0 },
  attentive:  { w: 21, h: 42, tilt: 0, gazeX: 0, gazeY: -2 },
  happy:      { w: 25, h: 16, tilt: 12, gazeX: 0, gazeY: -3 },
  laugh:      { w: 28, h: 11, tilt: 18, gazeX: 0, gazeY: -5 },
  excited:    { w: 25, h: 46, tilt: 6, gazeX: 0, gazeY: -4 },
  surprised:  { w: 29, h: 49, tilt: 0, gazeX: 0, gazeY: 0 },
  curious:    { w: 21, h: 42, tilt: 6, gazeX: 7, gazeY: -4, asymmetry: 0.08 },
  confused:   { w: 22, h: 35, tilt: 16, gazeX: -8, gazeY: 0, asymmetry: 0.35 },
  proud:      { w: 25, h: 14, tilt: 17, gazeX: 0, gazeY: -7 },
  shy:        { w: 18, h: 32, tilt: 0, gazeX: -8, gazeY: 6 },
  worried:    { w: 20, h: 37, tilt: -20, gazeX: 0, gazeY: 4 },
  sad:        { w: 19, h: 37, tilt: -25, gazeX: 0, gazeY: 7 },
  angry:      { w: 25, h: 15, tilt: 25, gazeX: 0, gazeY: 2 },
  bored:      { w: 24, h: 12, tilt: 0, gazeX: -8, gazeY: 2 },
  sleepy:     { w: 21, h: 34, tilt: 0, gazeX: 0, gazeY: 5, openness: 0.38 },
  scared:     { w: 28, h: 50, tilt: 0, gazeX: 0, gazeY: 4 }
}

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (t: number) => 1 - Math.pow(1 - clamp(t), 5)

function hashNoise(t: number, phase: number): number {
  return Math.sin(t * 0.71 + phase) * 0.58 + Math.sin(t * 1.37 + phase * 1.73) * 0.28 + Math.sin(t * 2.11 + phase * 0.43) * 0.14
}

function blinkOpen(t: number, sleeping: boolean): number {
  if (sleeping) return 0.12
  const cycle = t % 3.7
  if (cycle < 0.17) {
    const k = cycle / 0.17
    return k < 0.44 ? 1 - k / 0.44 : (k - 0.44) / 0.56
  }
  const doubleCycle = (t + 1.1) % 13.2
  if (doubleCycle < 0.16) {
    const k = doubleCycle / 0.16
    return k < 0.44 ? 1 - k / 0.44 : (k - 0.44) / 0.56
  }
  return 1
}

function pebblePath(t: number, state: PetState): string {
  const points: Array<[number, number]> = []
  const thought = state === 'thinking' ? Math.sin(t * 2.2) * 0.018 : 0
  const alert = state === 'interrupted' ? 0.06 * Math.exp(-((t % 1) * 5)) : 0
  for (let i = 0; i < SAMPLES; i++) {
    const a = (i / SAMPLES) * TAU
    const asym = 1 + 0.035 * Math.sin(a - 0.55) + 0.022 * Math.sin(2 * a + 1.35)
    const softCorner = 1 + 0.018 * Math.cos(4 * a + 0.45)
    const thinkingRipple = thought * Math.sin(3 * a + t)
    const r = baseRadius * (asym + softCorner + thinkingRipple + alert * Math.cos(a))
    points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`
  for (let i = 0; i < SAMPLES; i++) {
    const p0 = points[(i - 1 + SAMPLES) % SAMPLES]
    const p1 = points[i]
    const p2 = points[(i + 1) % SAMPLES]
    const p3 = points[(i + 2) % SAMPLES]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`
  }
  return d + ' Z'
}

function stateEmotion(state: PetState): Emotion | null {
  switch (state) {
    case 'listening': return 'attentive'
    case 'interrupted': return 'surprised'
    case 'success': return 'happy'
    case 'error': return 'confused'
    case 'sleep': return 'sleepy'
    default: return null
  }
}

export function sampleCharacter(t: number, controls: Controls): CharacterFrame {
  const forcedEmotion = stateEmotion(controls.state)
  const requested = grammar[controls.emotion]
  const target = grammar[forcedEmotion ?? controls.emotion]
  const ew = forcedEmotion ? 1 : clamp(controls.emotionWeight)

  const w = lerp(grammar.neutral.w, target.w, ew)
  const h = lerp(grammar.neutral.h, target.h, ew)
  const tilt = lerp(0, target.tilt, ew)
  const asym = (target.asymmetry ?? 0) * ew
  const baseOpen = lerp(1, target.openness ?? 1, ew)

  const stateLookLock = controls.state === 'listening' || controls.state === 'speaking'
  const idleGazeX = stateLookLock ? 0 : hashNoise(t * 0.36, 0.9) * 4.2
  const idleGazeY = stateLookLock ? 0 : hashNoise(t * 0.31, 2.2) * 3.1
  const gx = controls.gazeX * 17 + target.gazeX + idleGazeX
  const gy = controls.gazeY * 11 + target.gazeY + idleGazeY

  const blink = blinkOpen(t, controls.state === 'sleep')
  const stateOpen = controls.state === 'listening' ? 1.08 : controls.state === 'interrupted' ? 1.18 : 1
  const open = clamp(blink * baseOpen * stateOpen, 0.06, 1.18)

  const eyeSpacing = controls.state === 'surprised' as unknown as PetState ? 47 : 45
  const eyeY = 151 + gy
  const left: EyeFrame = {
    x: cx - eyeSpacing + gx,
    y: eyeY,
    width: w * (1 + asym * 0.35),
    height: h * open * (1 + asym * 0.18),
    rotation: -tilt + controls.gazeX * 3,
    open
  }
  const right: EyeFrame = {
    x: cx + eyeSpacing + gx * 0.88,
    y: eyeY + asym * 5,
    width: w * (1 - asym * 0.45),
    height: h * open * (1 - asym * 0.28),
    rotation: tilt + controls.gazeX * 3,
    open
  }

  const talk = controls.state === 'speaking' ? clamp(controls.talkLevel) : 0
  const breath = controls.state === 'sleep' ? Math.sin(t * 1.5) * 0.018 : Math.sin(t * 1.85) * 0.006
  const talkStretch = talk * 0.026
  const listeningStillness = controls.state === 'listening' ? 0.3 : 1
  const driftY = hashNoise(t * 0.22, 3.1) * 1.5 * listeningStillness

  let mouthPath: string | null = null
  let mouthOpacity = 0
  if (controls.state === 'speaking' || controls.emotion === 'laugh') {
    const mh = 4 + talk * 18 + (controls.emotion === 'laugh' ? 9 : 0)
    const mw = 17 + talk * 9
    mouthPath = `M ${cx - mw} 196 Q ${cx} ${196 + mh} ${cx + mw} 196 Q ${cx} ${196 + mh * 0.25} ${cx - mw} 196 Z`
    mouthOpacity = controls.state === 'speaking' ? 0.9 : 0.7
  }

  let bodyRotation = 0
  if (controls.emotion === 'curious') bodyRotation = -4 * ew
  if (controls.emotion === 'shy') bodyRotation = 3 * ew
  if (controls.state === 'thinking') bodyRotation += Math.sin(t * 1.4) * 1.2
  if (controls.state === 'interrupted') bodyRotation += Math.sin(t * 21) * 1.5 * Math.exp(-((t % 1) * 4))

  const accentOpacity = controls.state === 'thinking' || controls.state === 'notify' || controls.state === 'success' || controls.state === 'error' ? 1 : 0
  const accentScale = 0.85 + 0.15 * Math.sin(t * 4.2)

  return {
    bodyPath: pebblePath(t, controls.state),
    eyes: [left, right],
    mouthPath,
    mouthOpacity,
    accentOpacity,
    accentScale,
    bodyScaleX: 1 - breath * 0.3 - talkStretch * 0.2,
    bodyScaleY: 1 + breath + talkStretch,
    bodyRotation,
    bodyOffsetY: driftY,
    statusLabel: `${controls.state.toUpperCase()} · ${(forcedEmotion ?? controls.emotion).toUpperCase()}`
  }
}

export function eyeTransform(e: EyeFrame): string {
  return `translate(${e.x.toFixed(2)} ${e.y.toFixed(2)}) rotate(${e.rotation.toFixed(2)})`
}

export function pillPath(width: number, height: number): string {
  const rx = width / 2
  const ry = height / 2
  return `M 0 ${(-ry).toFixed(2)} C ${rx.toFixed(2)} ${(-ry).toFixed(2)} ${rx.toFixed(2)} ${ry.toFixed(2)} 0 ${ry.toFixed(2)} C ${(-rx).toFixed(2)} ${ry.toFixed(2)} ${(-rx).toFixed(2)} ${(-ry).toFixed(2)} 0 ${(-ry).toFixed(2)} Z`
}

export { smooth }

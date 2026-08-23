import type { Controls, Emotion, PetState } from './character'

export type MascotEyeMode = 'open' | 'happy' | 'closed'

export interface MascotEyeFrame {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  pupilX: number
  pupilY: number
  pupilRadius: number
  pupilOpacity: number
  mode: MascotEyeMode
}

export interface KawaiiFrame {
  eyes: [MascotEyeFrame, MascotEyeFrame]
  mouthPath: string
  mouthFilled: boolean
  mouthOpacity: number
  bodyScaleX: number
  bodyScaleY: number
  bodyOffsetY: number
  headRotation: number
  headOffsetX: number
  headOffsetY: number
  leftEarRotation: number
  rightEarRotation: number
  earScaleY: number
  blushOpacity: number
  blushScale: number
  armLift: number
  listeningOpacity: number
  accentOpacity: number
  accentScale: number
  accentText: string
  statusLabel: string
}

interface MascotGrammar {
  eyeW: number
  eyeH: number
  eyeTilt: number
  pupilScale: number
  gazeX: number
  gazeY: number
  mode?: MascotEyeMode
  asymmetry?: number
  headTilt?: number
  earL?: number
  earR?: number
  blush?: number
  armLift?: number
}

const grammar: Record<Emotion, MascotGrammar> = {
  neutral:   { eyeW: 34, eyeH: 43, eyeTilt: 0, pupilScale: 1, gazeX: 0, gazeY: 0, blush: 0.38 },
  attentive: { eyeW: 36, eyeH: 47, eyeTilt: 0, pupilScale: 0.94, gazeX: 0, gazeY: -2, earL: -3, earR: 3, blush: 0.34 },
  happy:     { eyeW: 35, eyeH: 22, eyeTilt: 0, pupilScale: 0.8, gazeX: 0, gazeY: 0, mode: 'happy', blush: 0.82, earL: -5, earR: 5, armLift: 5 },
  laugh:     { eyeW: 37, eyeH: 20, eyeTilt: 0, pupilScale: 0.75, gazeX: 0, gazeY: 0, mode: 'happy', blush: 0.95, earL: -7, earR: 7, armLift: 8 },
  excited:   { eyeW: 37, eyeH: 49, eyeTilt: 1, pupilScale: 1.08, gazeX: 0, gazeY: -2, blush: 0.9, earL: -6, earR: 6, armLift: 10 },
  surprised: { eyeW: 39, eyeH: 51, eyeTilt: 0, pupilScale: 0.62, gazeX: 0, gazeY: 0, blush: 0.42, earL: -2, earR: 2 },
  curious:   { eyeW: 35, eyeH: 45, eyeTilt: 3, pupilScale: 0.95, gazeX: 6, gazeY: -3, asymmetry: 0.13, headTilt: -6, earL: -11, earR: 5, blush: 0.48 },
  confused:  { eyeW: 34, eyeH: 39, eyeTilt: 8, pupilScale: 0.92, gazeX: -5, gazeY: 1, asymmetry: 0.22, headTilt: 5, earL: 10, earR: 17, blush: 0.34 },
  proud:     { eyeW: 35, eyeH: 24, eyeTilt: 5, pupilScale: 0.8, gazeX: 0, gazeY: -2, blush: 0.58, headTilt: -3, armLift: 3 },
  shy:       { eyeW: 33, eyeH: 39, eyeTilt: 0, pupilScale: 0.92, gazeX: -5, gazeY: 5, blush: 1, headTilt: 4, earL: 8, earR: -4 },
  worried:   { eyeW: 34, eyeH: 38, eyeTilt: -7, pupilScale: 0.9, gazeX: 0, gazeY: 3, blush: 0.3, earL: 13, earR: -13 },
  sad:       { eyeW: 33, eyeH: 36, eyeTilt: -10, pupilScale: 0.9, gazeX: 0, gazeY: 5, blush: 0.24, headTilt: 3, earL: 18, earR: -18 },
  angry:     { eyeW: 35, eyeH: 31, eyeTilt: 13, pupilScale: 0.88, gazeX: 0, gazeY: 1, blush: 0.18, earL: 14, earR: -14, armLift: 5 },
  bored:     { eyeW: 35, eyeH: 21, eyeTilt: 0, pupilScale: 0.86, gazeX: -5, gazeY: 2, blush: 0.24, earL: 10, earR: -6 },
  sleepy:    { eyeW: 35, eyeH: 16, eyeTilt: 0, pupilScale: 0.78, gazeX: 0, gazeY: 3, mode: 'closed', blush: 0.2, earL: 21, earR: -21 },
  scared:    { eyeW: 40, eyeH: 52, eyeTilt: 0, pupilScale: 0.52, gazeX: 0, gazeY: 3, blush: 0.22, earL: 6, earR: -6 }
}

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function noise(t: number, phase: number): number {
  return Math.sin(t * 0.73 + phase) * 0.58 + Math.sin(t * 1.49 + phase * 1.41) * 0.28 + Math.sin(t * 2.27 + phase * 0.63) * 0.14
}

function blinkOpen(t: number, state: PetState): number {
  if (state === 'sleep') return 0.08
  const cycle = (t + 0.8) % (state === 'listening' ? 5.4 : 4.25)
  if (cycle < 0.16) {
    const p = cycle / 0.16
    return p < 0.45 ? 1 - p / 0.45 : (p - 0.45) / 0.55
  }
  const doubleBlink = (t + 2.2) % 12.7
  if (doubleBlink < 0.15) {
    const p = doubleBlink / 0.15
    return p < 0.45 ? 1 - p / 0.45 : (p - 0.45) / 0.55
  }
  return 1
}

function forcedEmotion(state: PetState): Emotion | null {
  switch (state) {
    case 'listening': return 'attentive'
    case 'interrupted': return 'surprised'
    case 'success': return 'happy'
    case 'error': return 'confused'
    case 'sleep': return 'sleepy'
    default: return null
  }
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  const k = 0.5522847498
  return `M ${cx - rx} ${cy} C ${cx - rx} ${cy - ry * k} ${cx - rx * k} ${cy - ry} ${cx} ${cy - ry} C ${cx + rx * k} ${cy - ry} ${cx + rx} ${cy - ry * k} ${cx + rx} ${cy} C ${cx + rx} ${cy + ry * k} ${cx + rx * k} ${cy + ry} ${cx} ${cy + ry} C ${cx - rx * k} ${cy + ry} ${cx - rx} ${cy + ry * k} ${cx - rx} ${cy} Z`
}

function mouthFor(emotion: Emotion, state: PetState, talk: number): { path: string; filled: boolean; opacity: number } {
  if (state === 'speaking') {
    if (talk < 0.12) return { path: 'M 112 131 Q 120 137 128 131', filled: false, opacity: 0.95 }
    return { path: ellipsePath(120, 134, 4.5 + talk * 7.5, 2.5 + talk * 8.5), filled: true, opacity: 0.96 }
  }
  switch (emotion) {
    case 'happy': return { path: 'M 108 130 Q 120 143 132 130', filled: false, opacity: 1 }
    case 'laugh': return { path: 'M 106 129 Q 120 148 134 129 Q 120 139 106 129 Z', filled: true, opacity: 1 }
    case 'excited': return { path: ellipsePath(120, 134, 7, 6.5), filled: true, opacity: 0.95 }
    case 'surprised':
    case 'scared': return { path: ellipsePath(120, 135, 5.5, 8), filled: true, opacity: 0.95 }
    case 'sad':
    case 'worried': return { path: 'M 109 139 Q 120 128 131 139', filled: false, opacity: 0.92 }
    case 'angry': return { path: 'M 109 135 L 116 131 L 123 136 L 131 131', filled: false, opacity: 0.9 }
    case 'confused': return { path: 'M 109 134 Q 115 129 120 134 Q 126 140 132 134', filled: false, opacity: 0.9 }
    case 'bored': return { path: 'M 111 135 L 129 135', filled: false, opacity: 0.75 }
    case 'sleepy': return { path: 'M 113 136 Q 120 139 127 136', filled: false, opacity: 0.65 }
    case 'shy': return { path: 'M 113 134 Q 120 139 127 134', filled: false, opacity: 0.78 }
    default: return { path: 'M 112 131 Q 120 138 128 131', filled: false, opacity: 0.92 }
  }
}

export function sampleKawaii(t: number, controls: Controls): KawaiiFrame {
  const stateEmotion = forcedEmotion(controls.state)
  const emotion = stateEmotion ?? controls.emotion
  const target = grammar[emotion]
  const neutral = grammar.neutral
  const weight = stateEmotion ? 1 : clamp(controls.emotionWeight)
  const blink = blinkOpen(t, controls.state)

  let mode: MascotEyeMode = target.mode ?? 'open'
  if (mode === 'open' && blink < 0.22) mode = 'closed'

  const w = lerp(neutral.eyeW, target.eyeW, weight)
  const openH = lerp(neutral.eyeH, target.eyeH, weight)
  const h = mode === 'open' ? Math.max(4, openH * Math.max(0.1, blink)) : openH
  const tilt = lerp(neutral.eyeTilt, target.eyeTilt, weight)
  const asym = (target.asymmetry ?? 0) * weight

  const stateStill = controls.state === 'listening' ? 0.18 : controls.state === 'speaking' ? 0.35 : 1
  const thinkingScan = controls.state === 'thinking' ? Math.sin(t * 1.25) * 5 : 0
  const gazeX = clamp(controls.gazeX * 8 + target.gazeX * weight + noise(t * 0.25, 1.1) * 1.5 * stateStill + thinkingScan, -11, 11)
  const gazeY = clamp(controls.gazeY * 6 + target.gazeY * weight + noise(t * 0.22, 2.4) * 1.1 * stateStill, -8, 8)
  const pupilRadius = 9.5 * lerp(1, target.pupilScale, weight)
  const pupilOpacity = mode === 'open' ? clamp((blink - 0.12) / 0.5) : 0

  const eyes: [MascotEyeFrame, MascotEyeFrame] = [
    { x: 99, y: 101 - asym * 3, width: w * (1 + asym * 0.18), height: h * (1 + asym * 0.08), rotation: -tilt, pupilX: gazeX, pupilY: gazeY, pupilRadius: pupilRadius * (1 + asym * 0.08), pupilOpacity, mode },
    { x: 141, y: 101 + asym * 3, width: w * (1 - asym * 0.16), height: h * (1 - asym * 0.1), rotation: tilt, pupilX: gazeX * 0.94, pupilY: gazeY, pupilRadius: pupilRadius * (1 - asym * 0.06), pupilOpacity, mode }
  ]

  const talk = controls.state === 'speaking' ? clamp(controls.talkLevel) : 0
  const mouth = mouthFor(emotion, controls.state, talk)
  const slowBreath = controls.state === 'sleep' ? 1.12 : 1.62
  const breath = Math.sin(t * slowBreath)
  const bounce = controls.state === 'success' || emotion === 'excited' || emotion === 'laugh' ? Math.abs(Math.sin(t * 4.8)) * 2.8 : 0
  const interrupted = controls.state === 'interrupted' ? Math.sin(t * 28) * 2.8 * Math.exp(-(t % 1) * 5) : 0

  const headTilt = (target.headTilt ?? 0) * weight + (controls.state === 'thinking' ? Math.sin(t * 1.1) * 2.2 : 0)
  const baseEarL = (target.earL ?? 0) * weight
  const baseEarR = (target.earR ?? 0) * weight
  const listeningPerk = controls.state === 'listening' ? Math.sin(t * 3.1) * 1.5 : 0
  const thinkingEar = controls.state === 'thinking' ? Math.sin(t * 2.3) * 5 : 0
  const earScaleY = controls.state === 'listening' ? 1.07 : controls.state === 'sleep' ? 0.92 : 1

  let accentText = ''
  let accentOpacity = 0
  if (controls.state === 'thinking') { accentText = '···'; accentOpacity = 0.75 }
  if (controls.state === 'notify') { accentText = '!'; accentOpacity = 1 }
  if (controls.state === 'success') { accentText = '✦'; accentOpacity = 1 }
  if (controls.state === 'error') { accentText = '?'; accentOpacity = 0.95 }
  if (controls.state === 'sleep') { accentText = 'Z'; accentOpacity = 0.65 }

  return {
    eyes,
    mouthPath: mouth.path,
    mouthFilled: mouth.filled,
    mouthOpacity: mouth.opacity,
    bodyScaleX: 1 - breath * 0.004 - talk * 0.004,
    bodyScaleY: 1 + breath * (controls.state === 'sleep' ? 0.014 : 0.006) + talk * 0.008,
    bodyOffsetY: breath * (controls.state === 'sleep' ? 1.4 : 0.55) - bounce,
    headRotation: headTilt,
    headOffsetX: interrupted,
    headOffsetY: -bounce * 0.25,
    leftEarRotation: baseEarL + listeningPerk + thinkingEar,
    rightEarRotation: baseEarR - listeningPerk - thinkingEar * 0.35,
    earScaleY,
    blushOpacity: lerp(neutral.blush ?? 0, target.blush ?? 0, weight),
    blushScale: 0.94 + 0.06 * Math.sin(t * 2.2),
    armLift: (target.armLift ?? 0) * weight + (controls.state === 'speaking' ? talk * 2 : 0),
    listeningOpacity: controls.state === 'listening' ? 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(t * 4.1)) : 0,
    accentOpacity,
    accentScale: 0.92 + 0.08 * Math.sin(t * 3.8),
    accentText,
    statusLabel: `${controls.state.toUpperCase()} · ${emotion.toUpperCase()} · KAWAII`
  }
}

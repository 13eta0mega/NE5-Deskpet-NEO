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
  pupilX: number
  pupilY: number
  pupilWidth: number
  pupilHeight: number
  pupilOpacity: number
  highlightX: number
  highlightY: number
  highlightRadius: number
}

export interface CharacterFrame {
  eyes: [EyeFrame, EyeFrame]
  mouthPath: string
  mouthOpacity: number
  mouthStrokeWidth: number
  faceScaleX: number
  faceScaleY: number
  faceRotation: number
  faceOffsetX: number
  faceOffsetY: number
  listeningOpacity: number
  accentOpacity: number
  accentScale: number
  accentText: string
  screenGlow: number
  statusLabel: string
}

interface EyeGrammar {
  w: number
  h: number
  tilt: number
  pupilScale: number
  gazeX: number
  gazeY: number
  openness?: number
  pupilOpacity?: number
  asymmetry?: number
  ySplit?: number
}

export const STATES: PetState[] = ['boot', 'idle', 'listening', 'thinking', 'speaking', 'interrupted', 'notify', 'success', 'error', 'sleep']
export const EMOTIONS: Emotion[] = ['neutral', 'attentive', 'happy', 'laugh', 'excited', 'surprised', 'curious', 'confused', 'proud', 'shy', 'worried', 'sad', 'angry', 'bored', 'sleepy', 'scared']

// The reference character works because the eyes dominate the screen. The neutral pair
// intentionally overlaps slightly at the center, producing a friendly binocular silhouette.
const grammar: Record<Emotion, EyeGrammar> = {
  neutral:    { w: 86, h: 102, tilt: 0, pupilScale: 1, gazeX: 0, gazeY: 0 },
  attentive:  { w: 89, h: 107, tilt: 0, pupilScale: 0.96, gazeX: 0, gazeY: -2 },
  happy:      { w: 90, h: 48, tilt: 8, pupilScale: 0.78, gazeX: 0, gazeY: -2, openness: 0.76, pupilOpacity: 0.18 },
  laugh:      { w: 92, h: 33, tilt: 11, pupilScale: 0.7, gazeX: 0, gazeY: -3, openness: 0.72, pupilOpacity: 0 },
  excited:    { w: 91, h: 110, tilt: 3, pupilScale: 0.9, gazeX: 0, gazeY: -4 },
  surprised:  { w: 94, h: 114, tilt: 0, pupilScale: 0.7, gazeX: 0, gazeY: 0 },
  curious:    { w: 88, h: 105, tilt: 5, pupilScale: 0.94, gazeX: 7, gazeY: -4, asymmetry: 0.11, ySplit: 4 },
  confused:   { w: 85, h: 83, tilt: 13, pupilScale: 0.94, gazeX: -6, gazeY: 1, asymmetry: 0.22, ySplit: 8 },
  proud:      { w: 88, h: 53, tilt: 10, pupilScale: 0.8, gazeX: 0, gazeY: -5, openness: 0.82, pupilOpacity: 0.32 },
  shy:        { w: 83, h: 88, tilt: 0, pupilScale: 0.93, gazeX: -7, gazeY: 7 },
  worried:    { w: 84, h: 82, tilt: -11, pupilScale: 0.9, gazeX: 0, gazeY: 4, ySplit: 3 },
  sad:        { w: 83, h: 78, tilt: -15, pupilScale: 0.9, gazeX: 0, gazeY: 7, ySplit: 4 },
  angry:      { w: 88, h: 61, tilt: 15, pupilScale: 0.88, gazeX: 0, gazeY: 2 },
  bored:      { w: 87, h: 44, tilt: 0, pupilScale: 0.86, gazeX: -7, gazeY: 3, openness: 0.82, pupilOpacity: 0.48 },
  sleepy:     { w: 86, h: 45, tilt: 0, pupilScale: 0.82, gazeX: 0, gazeY: 5, openness: 0.62, pupilOpacity: 0.2 },
  scared:     { w: 95, h: 116, tilt: 0, pupilScale: 0.62, gazeX: 0, gazeY: 4 }
}

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function hashNoise(t: number, phase: number): number {
  return Math.sin(t * 0.71 + phase) * 0.56 + Math.sin(t * 1.37 + phase * 1.73) * 0.29 + Math.sin(t * 2.11 + phase * 0.43) * 0.15
}

function blinkOpen(t: number, state: PetState): number {
  if (state === 'sleep') return 0.11
  const interval = state === 'listening' ? 5.1 : 4.15
  const cycle = (t + 0.46) % interval
  if (cycle < 0.155) {
    const k = cycle / 0.155
    return k < 0.46 ? 1 - k / 0.46 : (k - 0.46) / 0.54
  }
  const doubleCycle = (t + 1.84) % 12.6
  if (doubleCycle < 0.145) {
    const k = doubleCycle / 0.145
    return k < 0.44 ? 1 - k / 0.44 : (k - 0.44) / 0.56
  }
  return 1
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

function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  const k = 0.5522847498
  return [
    `M ${(cx - rx).toFixed(2)} ${cy.toFixed(2)}`,
    `C ${(cx - rx).toFixed(2)} ${(cy - ry * k).toFixed(2)} ${(cx - rx * k).toFixed(2)} ${(cy - ry).toFixed(2)} ${cx.toFixed(2)} ${(cy - ry).toFixed(2)}`,
    `C ${(cx + rx * k).toFixed(2)} ${(cy - ry).toFixed(2)} ${(cx + rx).toFixed(2)} ${(cy - ry * k).toFixed(2)} ${(cx + rx).toFixed(2)} ${cy.toFixed(2)}`,
    `C ${(cx + rx).toFixed(2)} ${(cy + ry * k).toFixed(2)} ${(cx + rx * k).toFixed(2)} ${(cy + ry).toFixed(2)} ${cx.toFixed(2)} ${(cy + ry).toFixed(2)}`,
    `C ${(cx - rx * k).toFixed(2)} ${(cy + ry).toFixed(2)} ${(cx - rx).toFixed(2)} ${(cy + ry * k).toFixed(2)} ${(cx - rx).toFixed(2)} ${cy.toFixed(2)} Z`
  ].join(' ')
}

function mouthFor(emotion: Emotion, state: PetState, talk: number): { path: string; opacity: number; width: number } {
  if (state === 'speaking') {
    if (talk < 0.14) {
      return { path: 'M 109 174 Q 114 180 119 174 Q 121 181 125 174 Q 130 180 135 174', opacity: 1, width: 3.1 }
    }
    const rx = 5.5 + talk * 7.5
    const ry = 2.2 + talk * 10.5
    return { path: ellipsePath(121, 178, rx, ry), opacity: 1, width: 3.1 }
  }

  switch (emotion) {
    case 'happy':
      return { path: 'M 108 173 Q 120 185 133 173', opacity: 1, width: 3.2 }
    case 'laugh':
      return { path: 'M 103 169 Q 120 191 138 169', opacity: 1, width: 4.1 }
    case 'excited':
      return { path: ellipsePath(121, 177, 8, 7), opacity: 1, width: 3.1 }
    case 'surprised':
    case 'scared':
      return { path: ellipsePath(121, 178, 6.5, 9), opacity: 0.95, width: 3.1 }
    case 'sad':
    case 'worried':
      return { path: 'M 108 181 Q 120 169 133 181', opacity: 0.95, width: 3.1 }
    case 'angry':
      return { path: 'M 109 178 L 116 174 L 123 179 L 131 174', opacity: 0.9, width: 3.1 }
    case 'shy':
      return { path: 'M 113 178 Q 120 182 127 178', opacity: 0.75, width: 2.8 }
    case 'sleepy':
    case 'bored':
      return { path: 'M 113 179 Q 121 181 129 179', opacity: 0.62, width: 2.7 }
    default:
      return { path: 'M 109 174 Q 114 180 119 174 Q 121 181 125 174 Q 130 180 135 174', opacity: 0.94, width: 3.0 }
  }
}

export function sampleCharacter(t: number, controls: Controls): CharacterFrame {
  const forcedEmotion = stateEmotion(controls.state)
  const emotion = forcedEmotion ?? controls.emotion
  const target = grammar[emotion]
  const weight = forcedEmotion ? 1 : clamp(controls.emotionWeight)

  const neutral = grammar.neutral
  const w = lerp(neutral.w, target.w, weight)
  const h = lerp(neutral.h, target.h, weight)
  const tilt = lerp(0, target.tilt, weight)
  const asymmetry = (target.asymmetry ?? 0) * weight
  const ySplit = (target.ySplit ?? 0) * weight

  const stateStillness = controls.state === 'listening' ? 0.22 : controls.state === 'speaking' ? 0.38 : 1
  const idlePupilX = hashNoise(t * 0.29, 0.81) * 3.1 * stateStillness
  const idlePupilY = hashNoise(t * 0.25, 2.14) * 2.2 * stateStillness
  const thinkingSweep = controls.state === 'thinking' ? Math.sin(t * 1.26) * 9 : 0
  const requestedX = controls.gazeX * 15 + target.gazeX * weight + idlePupilX + thinkingSweep
  const requestedY = controls.gazeY * 10 + target.gazeY * weight + idlePupilY
  const pupilX = clamp(requestedX, -18, 18)
  const pupilY = clamp(requestedY, -13, 13)

  const blink = blinkOpen(t, controls.state)
  const targetOpen = lerp(1, target.openness ?? 1, weight)
  const stateOpen = controls.state === 'listening' ? 1.035 : controls.state === 'interrupted' ? 1.07 : 1
  const open = clamp(blink * targetOpen * stateOpen, 0.07, 1.08)

  const basePupil = 31 * lerp(1, target.pupilScale, weight)
  const targetPupilOpacity = lerp(1, target.pupilOpacity ?? 1, weight)
  const blinkPupilVisibility = clamp((open - 0.12) / 0.42)
  const pupilOpacity = targetPupilOpacity * blinkPupilVisibility

  const leftW = w * (1 + asymmetry * 0.38)
  const rightW = w * (1 - asymmetry * 0.32)
  const leftH = h * open * (1 + asymmetry * 0.16)
  const rightH = h * open * (1 - asymmetry * 0.18)
  const baseY = 108

  const left: EyeFrame = {
    x: 78,
    y: baseY - ySplit * 0.5,
    width: leftW,
    height: Math.max(7, leftH),
    rotation: -tilt,
    pupilX,
    pupilY,
    pupilWidth: basePupil * (1 + asymmetry * 0.12),
    pupilHeight: basePupil * 1.08,
    pupilOpacity,
    highlightX: pupilX - basePupil * 0.17,
    highlightY: pupilY - basePupil * 0.22,
    highlightRadius: Math.max(2.2, basePupil * 0.12)
  }

  const right: EyeFrame = {
    x: 162,
    y: baseY + ySplit * 0.5,
    width: rightW,
    height: Math.max(7, rightH),
    rotation: tilt,
    pupilX: pupilX * 0.94,
    pupilY,
    pupilWidth: basePupil * (1 - asymmetry * 0.1),
    pupilHeight: basePupil * 1.08,
    pupilOpacity,
    highlightX: pupilX * 0.94 - basePupil * 0.17,
    highlightY: pupilY - basePupil * 0.22,
    highlightRadius: Math.max(2.2, basePupil * 0.12)
  }

  const talk = controls.state === 'speaking' ? clamp(controls.talkLevel) : 0
  const mouth = mouthFor(emotion, controls.state, talk)
  const breathPhase = Math.sin(t * (controls.state === 'sleep' ? 1.18 : 1.55))
  const breathAmount = controls.state === 'sleep' ? 0.016 : 0.0065
  const microDrift = hashNoise(t * 0.18, 4.21) * 0.65 * stateStillness

  let faceRotation = 0
  if (emotion === 'curious') faceRotation -= 2.6 * weight
  if (emotion === 'shy') faceRotation += 1.8 * weight
  if (controls.state === 'thinking') faceRotation += Math.sin(t * 1.05) * 0.9

  let faceOffsetX = hashNoise(t * 0.21, 1.6) * 0.45 * stateStillness
  if (controls.state === 'interrupted') {
    const phase = t % 1
    faceOffsetX += Math.sin(t * 30) * 3.2 * Math.exp(-phase * 5)
  }

  let accentText = ''
  let accentOpacity = 0
  if (controls.state === 'thinking') { accentText = '···'; accentOpacity = 0.78 }
  if (controls.state === 'notify') { accentText = '!'; accentOpacity = 1 }
  if (controls.state === 'success') { accentText = '✦'; accentOpacity = 1 }
  if (controls.state === 'error') { accentText = '?'; accentOpacity = 0.95 }
  if (controls.state === 'sleep') { accentText = 'Z'; accentOpacity = 0.62 }

  return {
    eyes: [left, right],
    mouthPath: mouth.path,
    mouthOpacity: mouth.opacity,
    mouthStrokeWidth: mouth.width,
    faceScaleX: 1 - breathPhase * breathAmount * 0.18,
    faceScaleY: 1 + breathPhase * breathAmount + talk * 0.008,
    faceRotation,
    faceOffsetX,
    faceOffsetY: breathPhase * (controls.state === 'sleep' ? 2.0 : 0.85) + microDrift,
    listeningOpacity: controls.state === 'listening' ? 0.58 + 0.32 * (0.5 + 0.5 * Math.sin(t * 4.2)) : 0,
    accentOpacity,
    accentScale: 0.92 + 0.08 * Math.sin(t * 3.8),
    accentText,
    screenGlow: controls.state === 'speaking' ? 0.82 + talk * 0.18 : controls.state === 'listening' ? 0.9 : 0.72,
    statusLabel: `${controls.state.toUpperCase()} · ${emotion.toUpperCase()}`
  }
}

export function eyeTransform(e: EyeFrame): string {
  return `translate(${e.x.toFixed(2)} ${e.y.toFixed(2)}) rotate(${e.rotation.toFixed(2)})`
}

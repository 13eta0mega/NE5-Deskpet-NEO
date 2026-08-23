import { describe, expect, it } from 'vitest'
import { EMOTIONS, STATES, sampleCharacter, type Controls } from '../src/character'

const base: Controls = {
  state: 'idle', emotion: 'neutral', emotionWeight: 1, gazeX: 0, gazeY: 0, talkLevel: 0, pointerActive: false
}

describe('LCD character engine', () => {
  it('is deterministic for identical time and controls', () => {
    expect(sampleCharacter(3.25, base)).toEqual(sampleCharacter(3.25, base))
  })

  it('renders every state without invalid numeric output', () => {
    for (const state of STATES) {
      const frame = sampleCharacter(1.37, { ...base, state })
      expect(frame.eyes).toHaveLength(2)
      expect(frame.mouthPath).not.toContain('NaN')
      for (const eye of frame.eyes) {
        const sum = eye.x + eye.y + eye.width + eye.height + eye.rotation + eye.pupilX + eye.pupilY + eye.pupilWidth + eye.pupilHeight
        expect(Number.isFinite(sum)).toBe(true)
        expect(eye.width).toBeGreaterThan(0)
        expect(eye.height).toBeGreaterThan(0)
      }
    }
  })

  it('keeps all emotions inside the 240x240 LCD safe area', () => {
    for (const emotion of EMOTIONS) {
      const frame = sampleCharacter(5.1, { ...base, emotion })
      for (const eye of frame.eyes) {
        expect(eye.x - eye.width / 2).toBeGreaterThanOrEqual(20)
        expect(eye.x + eye.width / 2).toBeLessThanOrEqual(220)
        expect(eye.y - eye.height / 2).toBeGreaterThanOrEqual(35)
        expect(eye.y + eye.height / 2).toBeLessThanOrEqual(185)
      }
    }
  })

  it('uses large close-set eyes at neutral idle', () => {
    const frame = sampleCharacter(2.3, base)
    expect(frame.eyes[0].width).toBeGreaterThan(80)
    expect(frame.eyes[1].width).toBeGreaterThan(80)
    const centerGap = frame.eyes[1].x - frame.eyes[0].x
    expect(centerGap).toBeLessThan(90)
  })

  it('changes mouth aperture with speaking amplitude', () => {
    const quiet = sampleCharacter(2, { ...base, state: 'speaking', talkLevel: 0.08 })
    const loud = sampleCharacter(2, { ...base, state: 'speaking', talkLevel: 0.9 })
    expect(quiet.mouthPath).not.toEqual(loud.mouthPath)
    expect(loud.faceScaleY).toBeGreaterThan(quiet.faceScaleY)
  })

  it('maps listening to attentive visuals and enables listening arcs', () => {
    const frame = sampleCharacter(2.2, { ...base, state: 'listening', emotion: 'angry' })
    expect(frame.statusLabel).toContain('ATTENTIVE')
    expect(frame.listeningOpacity).toBeGreaterThan(0)
  })

  it('moves pupils in the requested gaze direction', () => {
    const left = sampleCharacter(2.8, { ...base, state: 'listening', gazeX: -1 })
    const right = sampleCharacter(2.8, { ...base, state: 'listening', gazeX: 1 })
    expect(left.eyes[0].pupilX).toBeLessThan(right.eyes[0].pupilX)
    expect(left.eyes[1].pupilX).toBeLessThan(right.eyes[1].pupilX)
  })

  it('breathing subtly changes the face transform over time', () => {
    const a = sampleCharacter(0.5, base)
    const b = sampleCharacter(1.5, base)
    expect(a.faceScaleY).not.toBe(b.faceScaleY)
  })
})

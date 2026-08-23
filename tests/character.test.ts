import { describe, expect, it } from 'vitest'
import { EMOTIONS, STATES, sampleCharacter, type Controls } from '../src/character'

const base: Controls = {
  state: 'idle',
  emotion: 'neutral',
  emotionWeight: 1,
  gazeX: 0,
  gazeY: 0,
  talkLevel: 0,
  pointerActive: false
}

describe('character engine', () => {
  it('is deterministic for identical time and controls', () => {
    const a = sampleCharacter(3.25, base)
    const b = sampleCharacter(3.25, base)
    expect(a).toEqual(b)
  })

  it('renders every state without invalid numeric output', () => {
    for (const state of STATES) {
      const frame = sampleCharacter(1.37, { ...base, state })
      expect(frame.bodyPath).not.toContain('NaN')
      expect(frame.eyes).toHaveLength(2)
      for (const eye of frame.eyes) {
        expect(Number.isFinite(eye.x + eye.y + eye.width + eye.height + eye.rotation)).toBe(true)
        expect(eye.width).toBeGreaterThan(0)
        expect(eye.height).toBeGreaterThan(0)
      }
    }
  })

  it('renders every emotion and keeps the face inside a safe viewport', () => {
    for (const emotion of EMOTIONS) {
      const frame = sampleCharacter(5.1, { ...base, emotion })
      for (const eye of frame.eyes) {
        expect(eye.x).toBeGreaterThan(65)
        expect(eye.x).toBeLessThan(255)
        expect(eye.y).toBeGreaterThan(80)
        expect(eye.y).toBeLessThan(235)
      }
    }
  })

  it('shows a mouth while speaking and hides it at neutral idle', () => {
    expect(sampleCharacter(2, base).mouthPath).toBeNull()
    expect(sampleCharacter(2, { ...base, state: 'speaking', talkLevel: 0.8 }).mouthPath).not.toBeNull()
  })

  it('maps listening to an attentive visual state', () => {
    const frame = sampleCharacter(2.2, { ...base, state: 'listening', emotion: 'angry' })
    expect(frame.statusLabel).toContain('ATTENTIVE')
  })

  it('changes gaze in the requested direction', () => {
    const left = sampleCharacter(2.8, { ...base, state: 'listening', gazeX: -1 })
    const right = sampleCharacter(2.8, { ...base, state: 'listening', gazeX: 1 })
    expect(left.eyes[0].x).toBeLessThan(right.eyes[0].x)
    expect(left.eyes[1].x).toBeLessThan(right.eyes[1].x)
  })
})

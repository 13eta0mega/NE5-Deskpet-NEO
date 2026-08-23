import { describe, expect, it } from 'vitest'
import { EMOTIONS, STATES, type Controls } from '../src/character'
import { sampleKawaii } from '../src/kawaii'

const base: Controls = { state:'idle', emotion:'neutral', emotionWeight:1, gazeX:0, gazeY:0, talkLevel:0, pointerActive:false }

describe('kawaii mascot engine', () => {
  it('is deterministic', () => {
    expect(sampleKawaii(2.4, base)).toEqual(sampleKawaii(2.4, base))
  })

  it('renders every state with finite geometry', () => {
    for (const state of STATES) {
      const frame = sampleKawaii(1.5, { ...base, state })
      expect(frame.eyes).toHaveLength(2)
      expect(frame.mouthPath).not.toContain('NaN')
      expect(Number.isFinite(frame.bodyScaleX + frame.bodyScaleY + frame.headRotation + frame.leftEarRotation + frame.rightEarRotation)).toBe(true)
    }
  })

  it('supports every emotion and keeps eyes in the mascot head', () => {
    for (const emotion of EMOTIONS) {
      const frame = sampleKawaii(3.1, { ...base, emotion })
      for (const eye of frame.eyes) {
        expect(eye.x).toBeGreaterThan(70)
        expect(eye.x).toBeLessThan(170)
        expect(eye.y).toBeGreaterThan(70)
        expect(eye.y).toBeLessThan(125)
        expect(eye.width).toBeGreaterThan(20)
        expect(eye.height).toBeGreaterThan(0)
      }
    }
  })

  it('uses ears and head tilt for curious expression', () => {
    const neutral = sampleKawaii(2, base)
    const curious = sampleKawaii(2, { ...base, emotion:'curious' })
    expect(curious.headRotation).not.toBe(neutral.headRotation)
    expect(curious.leftEarRotation).not.toBe(neutral.leftEarRotation)
  })

  it('moves pupils with gaze input', () => {
    const left = sampleKawaii(2.8, { ...base, state:'listening', gazeX:-1 })
    const right = sampleKawaii(2.8, { ...base, state:'listening', gazeX:1 })
    expect(left.eyes[0].pupilX).toBeLessThan(right.eyes[0].pupilX)
  })

  it('changes lip-sync mouth and body with talk amplitude', () => {
    const quiet = sampleKawaii(1.9, { ...base, state:'speaking', talkLevel:.05 })
    const loud = sampleKawaii(1.9, { ...base, state:'speaking', talkLevel:.92 })
    expect(quiet.mouthPath).not.toEqual(loud.mouthPath)
    expect(loud.bodyScaleY).toBeGreaterThan(quiet.bodyScaleY)
  })

  it('breathes and perks ears while listening', () => {
    const a = sampleKawaii(.5, base)
    const b = sampleKawaii(1.5, base)
    expect(a.bodyScaleY).not.toBe(b.bodyScaleY)
    expect(sampleKawaii(1.1, { ...base, state:'listening' }).listeningOpacity).toBeGreaterThan(0)
  })
})

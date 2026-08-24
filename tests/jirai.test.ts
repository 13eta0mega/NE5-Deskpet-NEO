import { describe, expect, it } from 'vitest'
import { EXPRESSION_ASSET, JIRAI_EMOTIONS, MOUTHLESS_ASSET, VISEME_ASSET, sampleJirai } from '../src/jiraiRig'

describe('Jirai reference rig', () => {
  it('keeps only the eight approved reference expressions', () => {
    expect(JIRAI_EMOTIONS).toEqual(['neutral','happy','wink','surprised','sad','annoyed','sleepy','excited'])
  })

  it('maps every expression to a PNG asset', () => {
    for (const emotion of JIRAI_EMOTIONS) {
      expect(EXPRESSION_ASSET[emotion]).toContain('/assets/jirai/expressions/')
      expect(EXPRESSION_ASSET[emotion]).toMatch(/\.png$/)
    }
    expect(MOUTHLESS_ASSET).toMatch(/neutral_mouthless\.png$/)
  })

  it('maps the complete approved viseme set', () => {
    expect(Object.keys(VISEME_ASSET).sort()).toEqual(['A','E','I','O','REST','SMILE','U'].sort())
    for (const src of Object.values(VISEME_ASSET)) expect(src).toMatch(/\/assets\/jirai\/visemes\/.+\.png$/)
  })

  it('keeps idle breathing within the restrained reference-safe range', () => {
    for (const emotion of JIRAI_EMOTIONS) {
      for (let i = 0; i <= 120; i++) {
        const f = sampleJirai(i / 30, emotion, false, 0)
        expect(Math.abs(f.scaleY - 1)).toBeLessThanOrEqual(0.006)
        expect(Math.abs(f.rotation)).toBeLessThanOrEqual(0.45)
        expect(Math.abs(f.y)).toBeLessThanOrEqual(3.5)
      }
    }
  })

  it('uses the mouthless reference base only while speaking', () => {
    const idle = sampleJirai(1, 'happy', false, 0.5)
    const talking = sampleJirai(1, 'happy', true, 0.5)
    expect(idle.characterSrc).toBe(EXPRESSION_ASSET.happy)
    expect(idle.mouthSrc).toBeUndefined()
    expect(talking.characterSrc).toBe(MOUTHLESS_ASSET)
    expect(talking.mouthSrc).toBeDefined()
  })

  it('clamps lip-sync amplitude safely', () => {
    const low = sampleJirai(0, 'neutral', true, -10)
    const high = sampleJirai(0.33, 'neutral', true, 10)
    expect(low.mouthScale).toBeGreaterThanOrEqual(0.86)
    expect(high.mouthScale).toBeLessThanOrEqual(1.02)
  })
})

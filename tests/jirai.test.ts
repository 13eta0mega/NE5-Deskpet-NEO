import { describe, expect, it } from 'vitest'
import { EYE_ASSET, JIRAI_EMOTIONS, RIG_BASE_ASSET, RIG_V3_RULES, VISEME_ASSET, VISEMES, sampleJirai, type JiraiInput } from '../src/jiraiRig'

const input=(patch:Partial<JiraiInput>={}):JiraiInput=>({
  t:1,fromEmotion:'neutral',toEmotion:'neutral',emotionProgress:1,speaking:false,
  fromViseme:'REST',toViseme:'REST',visemeProgress:1,talkLevel:0,...patch
})

describe('Jirai cutout rig v3',()=>{
  it('keeps only the eight reference-approved expressions',()=>{
    expect(JIRAI_EMOTIONS).toEqual(['neutral','happy','wink','surprised','sad','annoyed','sleepy','excited'])
  })

  it('never enables raster mesh morphing',()=>{
    expect(RIG_V3_RULES.rasterMorph).toBe(false)
    expect(RIG_BASE_ASSET).toContain('/assets/jirai/rig-v3/base/base_clean.png')
  })

  it('uses discrete PNG eye poses instead of deforming one eye bitmap',()=>{
    expect(EYE_ASSET.open.left).not.toBe(EYE_ASSET.happy.left)
    expect(EYE_ASSET.open.right).not.toBe(EYE_ASSET.closed.right)
    for(const mode of Object.values(EYE_ASSET)){
      expect(mode.left).toMatch(/\.png$/)
      expect(mode.right).toMatch(/\.png$/)
    }
  })

  it('hides an eye-asset swap behind near-total closure',()=>{
    const before=sampleJirai(input({fromEmotion:'neutral',toEmotion:'happy',emotionProgress:.49}))
    const after=sampleJirai(input({fromEmotion:'neutral',toEmotion:'happy',emotionProgress:.51}))
    expect(before.eyes[0].src).toContain('open_L.png')
    expect(after.eyes[0].src).toContain('happy_L.png')
    expect(before.eyes[0].reveal).toBeLessThan(.02)
    expect(after.eyes[0].reveal).toBeLessThan(.02)
    expect(before.eyes[0].closedOpacity).toBeGreaterThan(.9)
    expect(after.eyes[0].closedOpacity).toBeGreaterThan(.9)
  })

  it('interpolates a simple neutral mouth into a smile before revealing the detailed happy mouth',()=>{
    const start=sampleJirai(input({fromEmotion:'neutral',toEmotion:'happy',emotionProgress:0}))
    const mid=sampleJirai(input({fromEmotion:'neutral',toEmotion:'happy',emotionProgress:.35}))
    const end=sampleJirai(input({fromEmotion:'neutral',toEmotion:'happy',emotionProgress:1}))
    expect(start.mouthVectorPath).toBeDefined()
    expect(mid.mouthVectorPath).not.toBe(start.mouthVectorPath)
    expect(end.mouthSprites.some(m=>m.src.endsWith('/A.png')&&m.reveal>.99)).toBe(true)
  })

  it('uses the complete discrete viseme set and REST gate for speech changes',()=>{
    expect(VISEMES).toEqual(['REST','SMILE','A','E','I','O','U'])
    expect(Object.keys(VISEME_ASSET).sort()).toEqual([...VISEMES].sort())
    const mid=sampleJirai(input({speaking:true,fromViseme:'A',toViseme:'O',visemeProgress:.5,talkLevel:.8}))
    const rest=mid.mouthSprites.find(m=>m.src.endsWith('/REST.png'))
    expect(rest).toBeDefined()
    expect(rest!.reveal).toBeGreaterThan(0)
  })

  it('keeps root animation restrained while changing expressions',()=>{
    for(const emotion of JIRAI_EMOTIONS){
      for(let i=0;i<=60;i++){
        const f=sampleJirai(input({t:i/30,fromEmotion:'neutral',toEmotion:emotion,emotionProgress:i/60}))
        expect(Math.abs(f.rootRotation)).toBeLessThanOrEqual(.3)
        expect(Math.abs(f.rootY)).toBeLessThanOrEqual(2)
      }
    }
  })
})

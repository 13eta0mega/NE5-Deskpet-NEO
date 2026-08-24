import { describe, expect, it } from 'vitest'
import { EYE_ASSET, JIRAI_EMOTIONS, PARTS_ATLAS_ASSET, PARTS_ATLAS_SIZE, REFERENCE_VIEW, RIG_BASE_ASSET, RIG_V3_RULES, VISEME_RECT, VISEMES, sampleJirai, type JiraiInput } from '../src/jiraiRig'

const input=(patch:Partial<JiraiInput>={}):JiraiInput=>({t:1,fromEmotion:'neutral',toEmotion:'neutral',emotionProgress:1,speaking:false,fromViseme:'REST',toViseme:'REST',visemeProgress:1,talkLevel:0,...patch})

describe('Jirai cutout rig v3',()=>{
  it('keeps only the eight reference-approved expressions',()=>{
    expect(JIRAI_EMOTIONS).toEqual(['neutral','happy','wink','surprised','sad','annoyed','sleepy','excited'])
  })
  it('never enables raster mesh morphing and uses a single 1:1 parts atlas',()=>{
    expect(RIG_V3_RULES.rasterMorph).toBe(false)
    expect(RIG_BASE_ASSET).toContain('/assets/jirai/rig-v3/base/base_clean.png')
    expect(PARTS_ATLAS_ASSET).toContain('/assets/jirai/rig-v3/parts_atlas.png')
    expect(PARTS_ATLAS_SIZE).toEqual({width:256,height:331})
  })
  it('uses discrete atlas rectangles for eye poses instead of deforming one bitmap',()=>{
    expect(EYE_ASSET.open.left).not.toEqual(EYE_ASSET.happy.left)
    expect(EYE_ASSET.open.right).not.toEqual(EYE_ASSET.closed.right)
    for(const pair of Object.values(EYE_ASSET))for(const rect of [pair.left,pair.right]){
      expect(rect.w).toBeGreaterThan(0);expect(rect.h).toBeGreaterThan(0)
      expect(rect.x+rect.w).toBeLessThanOrEqual(PARTS_ATLAS_SIZE.width)
      expect(rect.y+rect.h).toBeLessThanOrEqual(PARTS_ATLAS_SIZE.height)
    }
  })
  it('hides the open-to-happy eye rectangle swap behind near-total closure',()=>{
    const before=sampleJirai(input({fromEmotion:'neutral',toEmotion:'happy',emotionProgress:.49}))
    const after=sampleJirai(input({fromEmotion:'neutral',toEmotion:'happy',emotionProgress:.51}))
    expect(before.eyes[0].rect).toEqual(EYE_ASSET.open.left)
    expect(after.eyes[0].rect).toEqual(EYE_ASSET.happy.left)
    expect(before.eyes[0].reveal).toBeLessThan(.02)
    expect(after.eyes[0].reveal).toBeLessThan(.02)
    expect(before.eyes[0].closedOpacity).toBeGreaterThan(.9)
    expect(after.eyes[0].closedOpacity).toBeGreaterThan(.9)
  })
  it('interpolates the simple neutral mouth before revealing the detailed happy sprite',()=>{
    const start=sampleJirai(input({fromEmotion:'neutral',toEmotion:'happy',emotionProgress:0}))
    const mid=sampleJirai(input({fromEmotion:'neutral',toEmotion:'happy',emotionProgress:.35}))
    const end=sampleJirai(input({fromEmotion:'neutral',toEmotion:'happy',emotionProgress:1}))
    expect(start.mouthVectorPath).toBeDefined()
    expect(mid.mouthVectorPath).not.toBe(start.mouthVectorPath)
    expect(end.mouthSprites.some(m=>JSON.stringify(m.rect)===JSON.stringify(VISEME_RECT.A)&&m.reveal>.99)).toBe(true)
  })
  it('matches the supplied layout end-pose eye and brow anchors',()=>{
    const expected={neutral:[168,137],happy:[170,138],wink:[169,137],surprised:[167,132],sad:[171,135],annoyed:[175,139],sleepy:[175,142],excited:[168,134]} as const
    for(const emotion of JIRAI_EMOTIONS){
      const f=sampleJirai(input({fromEmotion:emotion,toEmotion:emotion,emotionProgress:1}))
      expect(f.eyes[0].y).toBe(expected[emotion][0])
      expect(f.browLeft).toContain(` ${expected[emotion][1].toFixed(2)}`)
    }
  })
  it('normalizes every QA reference into the neutral 351x345 coordinate system',()=>{
    expect(REFERENCE_VIEW.neutral).toEqual({x:0,y:0,width:351,height:345})
    for(const view of Object.values(REFERENCE_VIEW)){
      expect(view.width).toBeGreaterThan(340);expect(view.width).toBeLessThan(375)
      expect(view.height).toBeGreaterThan(340);expect(view.height).toBeLessThan(370)
    }
  })
  it('uses distinct reference-derived sad and annoyed vector mouth endpoints',()=>{
    const neutral=sampleJirai(input())
    const sad=sampleJirai(input({fromEmotion:'sad',toEmotion:'sad'}))
    const annoyed=sampleJirai(input({fromEmotion:'annoyed',toEmotion:'annoyed'}))
    expect(sad.mouthVectorPath).not.toBe(neutral.mouthVectorPath)
    expect(annoyed.mouthVectorPath).not.toBe(neutral.mouthVectorPath)
    expect(annoyed.mouthVectorPath).not.toBe(sad.mouthVectorPath)
  })
  it('uses the complete discrete viseme set and a REST rectangle gate',()=>{
    expect(VISEMES).toEqual(['REST','SMILE','A','E','I','O','U'])
    expect(Object.keys(VISEME_RECT).sort()).toEqual([...VISEMES].sort())
    const mid=sampleJirai(input({speaking:true,fromViseme:'A',toViseme:'O',visemeProgress:.5,talkLevel:.8}))
    const rest=mid.mouthSprites.find(m=>JSON.stringify(m.rect)===JSON.stringify(VISEME_RECT.REST))
    expect(rest).toBeDefined();expect(rest!.reveal).toBeGreaterThan(0)
  })
  it('keeps root animation restrained while changing expressions',()=>{
    for(const emotion of JIRAI_EMOTIONS)for(let i=0;i<=60;i++){
      const f=sampleJirai(input({t:i/30,fromEmotion:'neutral',toEmotion:emotion,emotionProgress:i/60}))
      expect(Math.abs(f.rootRotation)).toBeLessThanOrEqual(.3)
      expect(Math.abs(f.rootY)).toBeLessThanOrEqual(2)
    }
  })
})

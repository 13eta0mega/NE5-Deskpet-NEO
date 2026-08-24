import {test,expect} from '@playwright/test'
import pixelmatch from 'pixelmatch'
import {PNG} from 'pngjs'
import fs from 'node:fs'

const emotions=['neutral','happy','wink','surprised','sad','annoyed','sleepy','excited']
const expected={neutral:{mouth:0,gesture:0},happy:{mouth:1,gesture:0},wink:{mouth:1,gesture:0},surprised:{mouth:1,gesture:0},sad:{mouth:0,gesture:2},annoyed:{mouth:0,gesture:2},sleepy:{mouth:1,gesture:0},excited:{mouth:1,gesture:0}}

async function ready(page,emotion,reference=false){await page.goto(`/?qaEmotion=${emotion}${reference?'&qaReference=1':''}`);await page.locator('.rig-base').waitFor();await page.waitForFunction(()=>[...document.images].every(i=>i.complete));await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}.rig-root{transform:none!important}'});await page.waitForTimeout(100)}
function comparePng(actualBuf,referenceBuf){const a=PNG.sync.read(actualBuf),r=PNG.sync.read(referenceBuf);expect(a.width).toBe(r.width);expect(a.height).toBe(r.height);const diff=new PNG({width:a.width,height:a.height});const pixels=pixelmatch(a.data,r.data,diff.data,a.width,a.height,{threshold:.12,includeAA:false});return{ratio:pixels/(a.width*a.height),diff:PNG.sync.write(diff)}}
async function state(page){return page.locator('[data-testid=rig-output]').evaluate(el=>({emotion:el.dataset.emotion,mouth:el.dataset.mouthLayers,gesture:el.dataset.gestureLayers,eyes:[...el.querySelectorAll('.eye-slot')].map(n=>n.getAttribute('style')),closed:[...el.querySelectorAll('.closed-eye-slot')].map(n=>n.getAttribute('style')),mouths:[...el.querySelectorAll('.mouth-slot')].map(n=>n.getAttribute('style')),brows:[...el.querySelectorAll('.brows path')].map(n=>n.getAttribute('d')),vector:el.querySelector('.rig-mouth-line')?.getAttribute('d')??null}))}

test.describe('Jirai strict rendered QA',()=>{
  for(const emotion of emotions)test(`${emotion}: rendered endpoint matches normalized supplied reference`,async({page},testInfo)=>{
    await ready(page,emotion,true)
    const overlay=page.locator('[data-testid=reference-overlay]')
    await overlay.evaluate(el=>el.style.visibility='hidden')
    const actual=await page.locator('[data-testid=rig-root]').screenshot({animations:'disabled'})
    await overlay.evaluate(el=>el.style.visibility='visible')
    const reference=await overlay.screenshot({animations:'disabled'})
    const {ratio,diff}=comparePng(actual,reference)
    if(ratio>.08){const ap=testInfo.outputPath(`${emotion}-actual.png`),rp=testInfo.outputPath(`${emotion}-reference.png`),dp=testInfo.outputPath(`${emotion}-diff.png`);fs.writeFileSync(ap,actual);fs.writeFileSync(rp,reference);fs.writeFileSync(dp,diff);await testInfo.attach('actual',{path:ap,contentType:'image/png'});await testInfo.attach('reference',{path:rp,contentType:'image/png'});await testInfo.attach('diff',{path:dp,contentType:'image/png'})}
    expect(ratio,`${emotion} visual mismatch ratio ${(ratio*100).toFixed(2)}% exceeds 8%`).toBeLessThanOrEqual(.08)
  })

  for(const emotion of emotions)test(`${emotion}: endpoint contains only allowed active parts`,async({page})=>{
    await ready(page,emotion)
    const root=page.locator('[data-testid=rig-output]')
    await expect(root).toHaveAttribute('data-emotion',emotion)
    await expect(root).toHaveAttribute('data-mouth-layers',String(expected[emotion].mouth))
    await expect(root).toHaveAttribute('data-gesture-layers',String(expected[emotion].gesture))
    await expect(root.locator('.eye-slot')).toHaveCount(2)
    await expect(root.locator('.closed-eye-slot')).toHaveCount(2)
  })

  test('transition history cannot contaminate the final expression',async({page})=>{
    await ready(page,'neutral')
    for(const emotion of ['happy','sad','annoyed','wink','sleepy','excited','surprised','neutral']){await page.locator(`[data-emotion-button="${emotion}"]`).click();await page.waitForTimeout(560)}
    const afterHistory=await state(page)
    await ready(page,'neutral')
    const clean=await state(page)
    expect(afterHistory).toEqual(clean)
  })
})

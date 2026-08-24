import {test,expect} from '@playwright/test'
import pixelmatch from 'pixelmatch'
import {PNG} from 'pngjs'
import fs from 'node:fs'

const emotions=['neutral','happy','wink','surprised','sad','annoyed','sleepy','excited']
const expected={neutral:{mouth:0,gesture:0},happy:{mouth:1,gesture:0},wink:{mouth:1,gesture:0},surprised:{mouth:1,gesture:0},sad:{mouth:0,gesture:2},annoyed:{mouth:0,gesture:2},sleepy:{mouth:1,gesture:0},excited:{mouth:1,gesture:0}}

async function ready(page,emotion,reference=false){
  await page.goto(`/?qaEmotion=${emotion}${reference?'&qaReference=1':''}`)
  await page.locator('.rig-base').waitFor()
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete))
  await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}.rig-root{transform:none!important}.reference-overlay{opacity:1!important;mix-blend-mode:normal!important;filter:none!important}'})
  await page.waitForTimeout(60)
}
function comparePng(actualBuf,referenceBuf){
  const a=PNG.sync.read(actualBuf),r=PNG.sync.read(referenceBuf)
  expect(a.width).toBe(r.width);expect(a.height).toBe(r.height)
  const diff=new PNG({width:a.width,height:a.height})
  const pixels=pixelmatch(a.data,r.data,diff.data,a.width,a.height,{threshold:.1,includeAA:false})
  return{ratio:pixels/(a.width*a.height),diff:PNG.sync.write(diff)}
}
async function state(page){return page.locator('[data-testid=rig-output]').evaluate(el=>({emotion:el.dataset.emotion,mouth:el.dataset.mouthLayers,gesture:el.dataset.gestureLayers,eyes:[...el.querySelectorAll('.eye-slot')].map(n=>n.getAttribute('style')),closed:[...el.querySelectorAll('.closed-eye-slot')].map(n=>n.getAttribute('style')),mouths:[...el.querySelectorAll('.mouth-slot')].map(n=>n.getAttribute('style')),brows:[...el.querySelectorAll('.brows path')].map(n=>n.getAttribute('d')),vector:el.querySelector('.rig-mouth-line')?.getAttribute('d')??null}))}
async function assertVisibleParts(page,emotion){const root=page.locator('[data-testid=rig-output]');await expect(root).toHaveAttribute('data-emotion',emotion);await expect(root).toHaveAttribute('data-mouth-layers',String(expected[emotion].mouth));await expect(root).toHaveAttribute('data-gesture-layers',String(expected[emotion].gesture));await expect(root.locator('.eye-slot')).toHaveCount(2);await expect(root.locator('.closed-eye-slot')).toHaveCount(2);const eyeBoxes=await root.locator('.eye-slot').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return{w:r.width,h:r.height,opacity:Number(s.opacity)}}));for(const eye of eyeBoxes){expect(eye.w).toBeGreaterThan(20);expect(eye.h).toBeGreaterThan(8);expect(eye.opacity).toBeGreaterThan(.95)}const mouthBoxes=await root.locator('.mouth-slot').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return{w:r.width,h:r.height,opacity:Number(s.opacity)}}));expect(mouthBoxes.length).toBe(expected[emotion].mouth);for(const mouth of mouthBoxes){expect(mouth.w).toBeGreaterThan(8);expect(mouth.h).toBeGreaterThan(6);expect(mouth.opacity).toBeGreaterThan(.99)}const gestureBoxes=await root.locator('.gesture-slot').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{w:r.width,h:r.height}}));expect(gestureBoxes.length).toBe(expected[emotion].gesture)}

test.describe('Jirai strict rendered QA',()=>{
  for(const emotion of emotions)test(`${emotion}: isolated rendered endpoint matches isolated normalized reference`,async({page},testInfo)=>{await ready(page,emotion,true);await assertVisibleParts(page,emotion);const overlay=page.locator('[data-testid=reference-overlay]'),rig=page.locator('[data-testid=rig-root]');await overlay.evaluate(el=>el.style.visibility='hidden');await rig.evaluate(el=>el.style.visibility='visible');const actual=await rig.screenshot({animations:'disabled'});await rig.evaluate(el=>el.style.visibility='hidden');await overlay.evaluate(el=>{el.style.visibility='visible';el.style.opacity='1'});const reference=await overlay.screenshot({animations:'disabled'});await rig.evaluate(el=>el.style.visibility='visible');const{ratio,diff}=comparePng(actual,reference),limit=emotion==='neutral'?0.045:0.06;if(ratio>limit){const ap=testInfo.outputPath(`${emotion}-actual.png`),rp=testInfo.outputPath(`${emotion}-reference.png`),dp=testInfo.outputPath(`${emotion}-diff.png`);fs.writeFileSync(ap,actual);fs.writeFileSync(rp,reference);fs.writeFileSync(dp,diff);await testInfo.attach('actual',{path:ap,contentType:'image/png'});await testInfo.attach('reference',{path:rp,contentType:'image/png'});await testInfo.attach('diff',{path:dp,contentType:'image/png'})}expect(ratio,`${emotion} visual mismatch ratio ${(ratio*100).toFixed(2)}% exceeds ${(limit*100).toFixed(1)}%`).toBeLessThanOrEqual(limit)})
  for(const emotion of emotions)test(`${emotion}: endpoint contains only allowed active visible parts`,async({page})=>{await ready(page,emotion);await assertVisibleParts(page,emotion)})
  test('transition history cannot contaminate the final expression',async({page})=>{await ready(page,'neutral');for(const emotion of ['happy','sad','annoyed','wink','sleepy','excited','surprised','neutral']){await page.locator(`[data-emotion-button="${emotion}"]`).click();await page.waitForTimeout(560)}const afterHistory=await state(page);await ready(page,'neutral');const clean=await state(page);expect(afterHistory).toEqual(clean)})
})

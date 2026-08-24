<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { JIRAI_EMOTIONS, RIG_V3_RULES, VISEMES, sampleJirai, type JiraiEmotion, type Viseme } from './jiraiRig'

const now=ref(0),fps=ref(60),speaking=ref(false),autoViseme=ref(true),talkLevel=ref(.42),showReference=ref(false)
const fromEmotion=ref<JiraiEmotion>('neutral'),toEmotion=ref<JiraiEmotion>('neutral'),emotionProgress=ref(1)
const fromViseme=ref<Viseme>('REST'),toViseme=ref<Viseme>('REST'),visemeProgress=ref(1)
const transitionMs=ref(RIG_V3_RULES.emotionTransitionMs),qaPaused=ref(false),qaProgress=ref(.5)
let emotionStarted=0,visemeStarted=0,raf=0,last=performance.now(),frames=0,fpsSince=last,lastAutoSlot=-1
const visemeMs=RIG_V3_RULES.visemeGateMs
const phraseTrack:Viseme[]=['REST','A','A','E','I','REST','O','O','U','E','REST','SMILE','A','I','O','REST']

const effectiveEmotionProgress=computed(()=>qaPaused.value?qaProgress.value:emotionProgress.value)
const frame=computed(()=>sampleJirai({
  t:now.value,fromEmotion:fromEmotion.value,toEmotion:toEmotion.value,emotionProgress:effectiveEmotionProgress.value,
  speaking:speaking.value,fromViseme:fromViseme.value,toViseme:toViseme.value,visemeProgress:visemeProgress.value,talkLevel:talkLevel.value
}))

function setEmotion(next:JiraiEmotion){
  if(next===toEmotion.value&&emotionProgress.value>=1&&!qaPaused.value)return
  const effective=effectiveEmotionProgress.value<.5?fromEmotion.value:toEmotion.value
  fromEmotion.value=effective
  toEmotion.value=next
  emotionProgress.value=0
  qaProgress.value=0
  qaPaused.value=false
  emotionStarted=performance.now()
}
function previewTransition(from:JiraiEmotion,to:JiraiEmotion){
  speaking.value=false
  fromEmotion.value=from
  toEmotion.value=to
  qaProgress.value=.5
  qaPaused.value=true
}
function setViseme(next:Viseme){
  if(next===toViseme.value&&visemeProgress.value>=1)return
  const effective=visemeProgress.value<.5?fromViseme.value:toViseme.value
  fromViseme.value=effective;toViseme.value=next;visemeProgress.value=0;visemeStarted=performance.now()
}
function startSpeaking(){speaking.value=true;qaPaused.value=false;setEmotion('neutral');setViseme('REST')}
function stopSpeaking(){speaking.value=false;setViseme('REST')}
function tick(ms:number){
  const dt=Math.min((ms-last)/1000,.05);last=ms;now.value+=dt
  if(!qaPaused.value) emotionProgress.value=Math.min(1,(ms-emotionStarted)/transitionMs.value)
  visemeProgress.value=Math.min(1,(ms-visemeStarted)/visemeMs)
  if(speaking.value&&autoViseme.value){
    const slot=Math.floor(now.value/.13)
    if(slot!==lastAutoSlot){lastAutoSlot=slot;setViseme(phraseTrack[slot%phraseTrack.length])}
    const envelope=.14+Math.abs(Math.sin(now.value*7.2)*Math.sin(now.value*2.15))*.78
    talkLevel.value=envelope
    if(envelope<.18)setViseme('REST')
  }
  frames++
  if(ms-fpsSince>=500){fps.value=Math.round(frames*1000/(ms-fpsSince));frames=0;fpsSince=ms}
  raf=requestAnimationFrame(tick)
}
function playDemo(){
  qaPaused.value=false;stopSpeaking();setEmotion('neutral')
  const seq:Array<[number,()=>void]>=[[700,()=>setEmotion('happy')],[1900,()=>setEmotion('wink')],[2950,()=>setEmotion('surprised')],[4050,()=>setEmotion('sad')],[5250,()=>setEmotion('annoyed')],[6450,()=>setEmotion('sleepy')],[7600,()=>setEmotion('excited')],[8750,()=>startSpeaking()],[11600,()=>{stopSpeaking();setEmotion('neutral')}]]
  for(const[d,fn]of seq)window.setTimeout(fn,d)
}
onMounted(()=>{last=performance.now();fpsSince=last;emotionStarted=last-transitionMs.value;visemeStarted=last-visemeMs;raf=requestAnimationFrame(tick)})
onBeforeUnmount(()=>cancelAnimationFrame(raf))
</script>

<template>
<main class="app-shell">
  <section class="hero-panel">
    <header class="topbar"><div><p class="eyebrow">NE5 DESKPET NEO / JIRAI CUTOUT RIG V3</p><h1>Part-rig Character Simulator</h1></div><div class="metrics"><span><i class="dot"></i>{{fps}} FPS</span><span>No raster morph</span><span>1:1 sprite atlas</span></div></header>
    <div class="stage jirai-stage"><div class="character-frame"><svg class="rig-canvas" viewBox="0 0 351 345" :aria-label="frame.statusLabel"><defs><clipPath v-for="(eye,i) in frame.eyes" :id="`eyeClip${i}`" :key="`ec-${i}`"><rect :x="eye.x-eye.rect.w/2-4" :y="eye.y-eye.rect.h/2+eye.rect.h*(1-eye.reveal)/2-2" :width="eye.rect.w+8" :height="Math.max(1,eye.rect.h*eye.reveal+4)"/></clipPath><clipPath v-for="(mouth,i) in frame.mouthSprites" :id="`mouthClip${i}`" :key="`mc-${i}`"><rect :x="179-mouth.rect.w/2-3" :y="220-mouth.rect.h/2+mouth.rect.h*(1-mouth.reveal)/2-2" :width="mouth.rect.w+6" :height="Math.max(1,mouth.rect.h*mouth.reveal+4)"/></clipPath></defs><g :transform="`translate(0 ${frame.rootY}) rotate(${frame.rootRotation} 176 180)`"><image :href="frame.baseSrc" x="0" y="0" width="351" height="345"/><g class="brows" :opacity="frame.browOpacity"><path :d="frame.browLeft"/><path :d="frame.browRight"/></g><g v-for="(eye,i) in frame.eyes" :key="`eye-${i}`" :transform="`rotate(${eye.rotation} ${eye.x} ${eye.y})`"><svg :x="eye.x-eye.rect.w/2" :y="eye.y-eye.rect.h/2" :width="eye.rect.w" :height="eye.rect.h" :viewBox="`${eye.rect.x} ${eye.rect.y} ${eye.rect.w} ${eye.rect.h}`" preserveAspectRatio="none" :clip-path="`url(#eyeClip${i})`"><image :href="frame.atlasSrc" x="0" y="0" width="256" height="331"/></svg><svg :x="eye.x-eye.closedRect.w/2" :y="eye.y-eye.closedRect.h/2" :width="eye.closedRect.w" :height="eye.closedRect.h" :viewBox="`${eye.closedRect.x} ${eye.closedRect.y} ${eye.closedRect.w} ${eye.closedRect.h}`" preserveAspectRatio="none" :opacity="eye.closedOpacity"><image :href="frame.atlasSrc" x="0" y="0" width="256" height="331"/></svg></g><path v-if="frame.mouthVectorPath&&frame.mouthVectorVisible" :d="frame.mouthVectorPath" class="rig-mouth-line"/><svg v-for="(mouth,i) in frame.mouthSprites" :key="`mouth-${i}`" :x="179-mouth.rect.w/2" :y="220-mouth.rect.h/2" :width="mouth.rect.w" :height="mouth.rect.h" :viewBox="`${mouth.rect.x} ${mouth.rect.y} ${mouth.rect.w} ${mouth.rect.h}`" preserveAspectRatio="none" :clip-path="`url(#mouthClip${i})`"><image :href="frame.atlasSrc" x="0" y="0" width="256" height="331"/></svg><svg v-for="(gesture,i) in frame.gestures" :key="`gesture-${i}`" :x="gesture.x-gesture.rect.w/2" :y="gesture.y-gesture.rect.h/2+gesture.offsetY" :width="gesture.rect.w" :height="gesture.rect.h" :viewBox="`${gesture.rect.x} ${gesture.rect.y} ${gesture.rect.w} ${gesture.rect.h}`" preserveAspectRatio="none"><image :href="frame.atlasSrc" x="0" y="0" width="256" height="331"/></svg></g></svg><svg v-if="showReference" class="reference-overlay" viewBox="0 0 351 345"><image :href="frame.referenceSrc" :x="frame.referenceView.x" :y="frame.referenceView.y" :width="frame.referenceView.width" :height="frame.referenceView.height" preserveAspectRatio="none"/></svg></div><div class="state-card"><span>CUTOUT OUTPUT</span><strong>{{frame.statusLabel}}</strong><small>{{fromEmotion}} → {{toEmotion}} · {{Math.round(effectiveEmotionProgress*100)}}%</small></div></div>
  </section>

  <aside class="control-panel">
    <div class="panel-heading"><div><p class="eyebrow">RIG V3 CONTROLS</p><h2>Natural expression transition</h2></div><button class="primary" @click="playDemo">Run transition demo</button></div>
    <section class="control-section"><div class="section-title"><span>01</span><h3>Reference expressions</h3></div><div class="chip-grid emotion-grid"><button v-for="e in JIRAI_EMOTIONS" :key="e" :class="{active:toEmotion===e&&!speaking}" @click="speaking=false;setEmotion(e)">{{e}}</button></div><label class="slider-row"><span>Transition duration <b>{{transitionMs}} ms</b></span><input v-model.number="transitionMs" type="range" min="220" max="1200" step="20"/></label></section>
    <section class="control-section"><div class="section-title"><span>02</span><h3>Transition QA scrub</h3></div><div class="renderer-dock"><button @click="previewTransition('neutral','happy')">Neutral → Happy</button><button @click="previewTransition('neutral','sad')">Neutral → Sad</button></div><label class="toggle"><input v-model="qaPaused" type="checkbox"/>Pause transition for frame inspection</label><label class="slider-row"><span>Transition frame <b>{{Math.round(qaProgress*100)}}%</b></span><input v-model.number="qaProgress" :disabled="!qaPaused" type="range" min="0" max="1" step=".01"/></label><p class="qa-copy">50% is the eye occlusion/sprite-swap region. Scrub 40–60% to inspect whether the swap is visible.</p></section>
    <section class="control-section"><div class="section-title"><span>03</span><h3>Speech / viseme</h3></div><div class="renderer-dock"><button :class="{active:!speaking}" @click="stopSpeaking">Expression</button><button :class="{active:speaking}" @click="startSpeaking">Speaking</button></div><div class="chip-grid viseme-grid"><button v-for="v in VISEMES" :key="v" :disabled="autoViseme" :class="{active:toViseme===v&&speaking}" @click="speaking=true;setViseme(v)">{{v}}</button></div><label class="slider-row"><span>Amplitude <b>{{talkLevel.toFixed(2)}}</b></span><input v-model.number="talkLevel" :disabled="autoViseme" type="range" min="0" max="1" step=".01"/></label><label class="toggle"><input v-model="autoViseme" type="checkbox"/>Demo phoneme/viseme timeline</label></section>
    <section class="control-section"><div class="section-title"><span>04</span><h3>Reference QA</h3></div><label class="toggle"><input v-model="showReference" type="checkbox"/>Overlay target reference PNG</label><p class="qa-copy">The reference is landmark-normalized to the same 351×345 canvas so eye/mouth offsets can be visually inspected.</p></section>
    <section class="notes"><p><strong>Recommended test:</strong> select Neutral → Happy, enable pause, and scrub 0→100%. The neutral mouth should bend continuously toward a smile before the detailed open-mouth sprite appears. Eye art swaps only near maximum closure.</p><p>Final TTS should supply phoneme/viseme timestamps. Auto mode remains a deterministic preview timeline.</p></section>
  </aside>
</main>
</template>

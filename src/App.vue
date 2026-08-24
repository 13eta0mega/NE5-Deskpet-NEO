<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { JIRAI_EMOTIONS, RIG_V3_RULES, VISEMES, sampleJirai, type JiraiEmotion, type Viseme } from './jiraiRig'

const now=ref(0),fps=ref(60),speaking=ref(false),autoViseme=ref(true),talkLevel=ref(.42),showReference=ref(false)
const fromEmotion=ref<JiraiEmotion>('neutral'),toEmotion=ref<JiraiEmotion>('neutral'),emotionProgress=ref(1)
const fromViseme=ref<Viseme>('REST'),toViseme=ref<Viseme>('REST'),visemeProgress=ref(1)
let emotionStarted=0,visemeStarted=0,raf=0,last=performance.now(),frames=0,fpsSince=last,lastAutoSlot=-1

const emotionMs=RIG_V3_RULES.emotionTransitionMs
const visemeMs=RIG_V3_RULES.visemeGateMs
const phraseTrack:Viseme[]=['REST','A','A','E','I','REST','O','O','U','E','REST','SMILE','A','I','O','REST']

const frame=computed(()=>sampleJirai({
  t:now.value,fromEmotion:fromEmotion.value,toEmotion:toEmotion.value,emotionProgress:emotionProgress.value,
  speaking:speaking.value,fromViseme:fromViseme.value,toViseme:toViseme.value,visemeProgress:visemeProgress.value,talkLevel:talkLevel.value
}))

function setEmotion(next:JiraiEmotion){
  if(next===toEmotion.value&&emotionProgress.value>=1)return
  const effective=emotionProgress.value<.5?fromEmotion.value:toEmotion.value
  fromEmotion.value=effective;toEmotion.value=next;emotionProgress.value=0;emotionStarted=performance.now()
}
function setViseme(next:Viseme){
  if(next===toViseme.value&&visemeProgress.value>=1)return
  const effective=visemeProgress.value<.5?fromViseme.value:toViseme.value
  fromViseme.value=effective;toViseme.value=next;visemeProgress.value=0;visemeStarted=performance.now()
}
function startSpeaking(){speaking.value=true;setEmotion('neutral');setViseme('REST')}
function stopSpeaking(){speaking.value=false;setViseme('REST')}

function tick(ms:number){
  const dt=Math.min((ms-last)/1000,.05);last=ms;now.value+=dt
  emotionProgress.value=Math.min(1,(ms-emotionStarted)/emotionMs)
  visemeProgress.value=Math.min(1,(ms-visemeStarted)/visemeMs)
  if(speaking.value&&autoViseme.value){
    const slot=Math.floor(now.value/0.13)
    if(slot!==lastAutoSlot){
      lastAutoSlot=slot
      const next=phraseTrack[slot%phraseTrack.length]
      setViseme(next)
    }
    const envelope=.14+Math.abs(Math.sin(now.value*7.2)*Math.sin(now.value*2.15))*.78
    talkLevel.value=envelope
    if(envelope<.18)setViseme('REST')
  }
  frames++;if(ms-fpsSince>=500){fps.value=Math.round(frames*1000/(ms-fpsSince));frames=0;fpsSince=ms}
  raf=requestAnimationFrame(tick)
}

function playDemo(){
  stopSpeaking();setEmotion('neutral')
  const seq:Array<[number,()=>void]>=[
    [700,()=>setEmotion('happy')],[1900,()=>setEmotion('wink')],[2950,()=>setEmotion('surprised')],
    [4050,()=>setEmotion('sad')],[5250,()=>setEmotion('annoyed')],[6450,()=>setEmotion('sleepy')],
    [7600,()=>setEmotion('excited')],[8750,()=>{startSpeaking()}],[11600,()=>{stopSpeaking();setEmotion('neutral')}]
  ]
  for(const[delay,fn]of seq)window.setTimeout(fn,delay)
}

onMounted(()=>{last=performance.now();fpsSince=last;emotionStarted=last-emotionMs;visemeStarted=last-visemeMs;raf=requestAnimationFrame(tick)})
onBeforeUnmount(()=>cancelAnimationFrame(raf))
</script>

<template>
<main class="app-shell">
  <section class="hero-panel">
    <header class="topbar"><div><p class="eyebrow">NE5 DESKPET NEO / JIRAI CUTOUT RIG V3</p><h1>Part-rig Character Simulator</h1></div><div class="metrics"><span><i class="dot"></i>{{fps}} FPS</span><span>No raster morph</span><span>Occlusion-swap rig</span></div></header>
    <div class="stage jirai-stage">
      <div class="character-frame">
        <svg class="rig-canvas" viewBox="0 0 351 345" :aria-label="frame.statusLabel">
          <defs>
            <clipPath v-for="(eye,i) in frame.eyes" :id="`eyeClip${i}`" :key="`clip-${i}`"><rect :x="eye.x-eye.width/2-5" :y="eye.y-eye.height/2+eye.height*(1-eye.reveal)/2-3" :width="eye.width+10" :height="Math.max(1,eye.height*eye.reveal+6)"/></clipPath>
            <clipPath v-for="(mouth,i) in frame.mouthSprites" :id="`mouthClip${i}`" :key="`mouthclip-${i}`"><rect :x="179-mouth.width/2-3" :y="220-mouth.height/2+mouth.height*(1-mouth.reveal)/2-2" :width="mouth.width+6" :height="Math.max(1,mouth.height*mouth.reveal+4)"/></clipPath>
          </defs>
          <g :transform="`translate(0 ${frame.rootY}) rotate(${frame.rootRotation} 176 180)`">
            <image :href="frame.baseSrc" x="0" y="0" width="351" height="345" preserveAspectRatio="none"/>
            <g class="brows"><path :d="frame.browLeft"/><path :d="frame.browRight"/></g>
            <g v-for="(eye,i) in frame.eyes" :key="`eye-${i}`">
              <image :href="eye.src" :x="eye.x-eye.width/2" :y="eye.y-eye.height/2" :width="eye.width" :height="eye.height" :transform="`rotate(${eye.rotation} ${eye.x} ${eye.y})`" :clip-path="`url(#eyeClip${i})`"/>
              <image :href="eye.closedSrc" :x="eye.x-24" :y="eye.y-7" width="48" height="14" :opacity="eye.closedOpacity"/>
            </g>
            <path v-if="frame.mouthVectorPath&&frame.mouthVectorVisible" :d="frame.mouthVectorPath" class="rig-mouth-line"/>
            <image v-for="(mouth,i) in frame.mouthSprites" :key="`mouth-${i}`" :href="mouth.src" :x="179-mouth.width/2" :y="220-mouth.height/2" :width="mouth.width" :height="mouth.height" :clip-path="`url(#mouthClip${i})`"/>
            <image v-for="(gesture,i) in frame.gestures" :key="`gesture-${i}`" :href="gesture.src" :x="gesture.x-gesture.width/2" :y="gesture.y-gesture.height/2+gesture.offsetY" :width="gesture.width" :height="gesture.height"/>
          </g>
        </svg>
        <img v-if="showReference" class="reference-overlay" :src="frame.referenceSrc" alt="target reference"/>
      </div>
      <div class="state-card"><span>CUTOUT OUTPUT</span><strong>{{frame.statusLabel}}</strong><small>Eyes/mouth sprites are never mesh-morphed. Swaps occur while visually occluded.</small></div>
    </div>
  </section>

  <aside class="control-panel">
    <div class="panel-heading"><div><p class="eyebrow">RIG V3 CONTROLS</p><h2>Natural expression transition</h2></div><button class="primary" @click="playDemo">Run transition demo</button></div>
    <section class="control-section"><div class="section-title"><span>01</span><h3>Reference expressions</h3></div><div class="chip-grid emotion-grid"><button v-for="e in JIRAI_EMOTIONS" :key="e" :class="{active:toEmotion===e&&!speaking}" @click="speaking=false;setEmotion(e)">{{e}}</button></div><div class="progress-note">Transition {{Math.round(emotionProgress*100)}}% · {{emotionMs}} ms</div></section>
    <section class="control-section"><div class="section-title"><span>02</span><h3>Speech / viseme</h3></div><div class="renderer-dock"><button :class="{active:!speaking}" @click="stopSpeaking">Expression</button><button :class="{active:speaking}" @click="startSpeaking">Speaking</button></div><div class="chip-grid viseme-grid"><button v-for="v in VISEMES" :key="v" :disabled="autoViseme" :class="{active:toViseme===v&&speaking}" @click="speaking=true;setViseme(v)">{{v}}</button></div><label class="slider-row"><span>Amplitude <b>{{talkLevel.toFixed(2)}}</b></span><input v-model.number="talkLevel" :disabled="autoViseme" type="range" min="0" max="1" step=".01"/></label><label class="toggle"><input v-model="autoViseme" type="checkbox"/>Demo phoneme/viseme timeline</label></section>
    <section class="control-section"><div class="section-title"><span>03</span><h3>Reference QA</h3></div><label class="toggle"><input v-model="showReference" type="checkbox"/>Overlay target reference PNG</label><p class="qa-copy">Use this overlay only for alignment QA. Runtime rendering is the clean base + cutout reference parts.</p></section>
    <section class="notes"><p><strong>No raster mesh morph.</strong> Neutral→happy uses a closing eye occlusion, swaps to the happy eye sprite near maximum closure, then opens into the target pose. Simple mouth curves interpolate control points; detailed open mouths use discrete PNG visemes through a short REST gate.</p><p>The final TTS integration should feed phoneme/viseme timing directly. The current auto mode is a deterministic preview timeline, not random amplitude-driven mouth selection.</p></section>
  </aside>
</main>
</template>

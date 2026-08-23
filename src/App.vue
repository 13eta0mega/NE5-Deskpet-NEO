<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { EMOTIONS, STATES, eyeTransform, sampleCharacter, type Controls, type Emotion, type PetState } from './character'
import { sampleKawaii } from './kawaii'

const controls = reactive<Controls>({ state: 'idle', emotion: 'neutral', emotionWeight: 1, gazeX: 0, gazeY: 0, talkLevel: 0.42, pointerActive: true })
const renderer = ref<'face' | 'kawaii'>('kawaii')
const now = ref(0)
const fps = ref(60)
const autoTalk = ref(true)
const canvas = ref<HTMLElement | null>(null)
let raf = 0
let last = performance.now()
let frames = 0
let fpsSince = last

const faceFrame = computed(() => sampleCharacter(now.value, controls))
const kawaiiFrame = computed(() => sampleKawaii(now.value, controls))
const statusLabel = computed(() => renderer.value === 'kawaii' ? kawaiiFrame.value.statusLabel : faceFrame.value.statusLabel)

function tick(ms: number) {
  const dt = Math.min((ms - last) / 1000, 0.05)
  last = ms
  now.value += dt
  if (autoTalk.value && controls.state === 'speaking') {
    controls.talkLevel = 0.08 + Math.abs(Math.sin(now.value * 8.6) * Math.sin(now.value * 2.4)) * 0.9
  }
  frames += 1
  if (ms - fpsSince >= 500) {
    fps.value = Math.round((frames * 1000) / (ms - fpsSince))
    frames = 0
    fpsSince = ms
  }
  raf = requestAnimationFrame(tick)
}

function setState(state: PetState) { controls.state = state }
function setEmotion(emotion: Emotion) { controls.emotion = emotion }

function pointerMove(event: PointerEvent) {
  if (!controls.pointerActive || !canvas.value) return
  const box = canvas.value.getBoundingClientRect()
  controls.gazeX = Math.max(-1, Math.min(1, (event.clientX - (box.left + box.width / 2)) / (box.width / 2)))
  controls.gazeY = Math.max(-1, Math.min(1, (event.clientY - (box.top + box.height / 2)) / (box.height / 2)))
}
function pointerLeave() {
  if (!controls.pointerActive) return
  controls.gazeX = 0
  controls.gazeY = 0
}

function playDemo() {
  const sequence: Array<[PetState, Emotion, number]> = [
    ['idle', 'neutral', 900], ['listening', 'attentive', 1500], ['thinking', 'curious', 1500],
    ['speaking', 'happy', 2300], ['success', 'happy', 900], ['idle', 'neutral', 1200]
  ]
  let delay = 0
  for (const [state, emotion, duration] of sequence) {
    window.setTimeout(() => { controls.state = state; controls.emotion = emotion }, delay)
    delay += duration
  }
}

onMounted(() => { last = performance.now(); fpsSince = last; raf = requestAnimationFrame(tick) })
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <main class="app-shell">
    <section class="hero-panel">
      <header class="topbar">
        <div>
          <p class="eyebrow">NE5 DESKPET NEO / LCD CHARACTER LAB</p>
          <h1>240 × 240 Character Simulator</h1>
        </div>
        <div class="metrics">
          <span><i class="dot live"></i>{{ fps }} FPS</span>
          <span>{{ renderer === 'kawaii' ? 'Kawaii mascot' : 'Big-eye face' }}</span>
          <span>ESP32-S3 target</span>
        </div>
      </header>

      <div ref="canvas" class="stage" @pointermove="pointerMove" @pointerleave="pointerLeave">
        <div class="screen-shell">
          <svg class="lcd" :class="{ 'kawaii-lcd': renderer === 'kawaii' }" viewBox="0 0 240 240" role="img" :aria-label="statusLabel">
            <defs>
              <radialGradient id="screenBg" cx="50%" cy="42%" r="70%"><stop offset="0%" stop-color="#111822"/><stop offset="64%" stop-color="#05080d"/><stop offset="100%" stop-color="#010203"/></radialGradient>
              <linearGradient id="eyeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f8ffff"/><stop offset="72%" stop-color="#dffcff"/><stop offset="100%" stop-color="#b9f8fb"/></linearGradient>
              <radialGradient id="pupilFill" cx="38%" cy="30%" r="70%"><stop offset="0%" stop-color="#243c55"/><stop offset="62%" stop-color="#142739"/><stop offset="100%" stop-color="#08111b"/></radialGradient>
              <linearGradient id="mascotFill" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0%" stop-color="#ffe5ee"/><stop offset="100%" stop-color="#ffcbdc"/></linearGradient>
              <filter id="eyeGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#6f4960" flood-opacity=".18"/></filter>
            </defs>

            <template v-if="renderer === 'face'">
              <rect width="240" height="240" rx="31" fill="url(#screenBg)"/>
              <ellipse cx="120" cy="118" rx="92" ry="82" fill="#61edf4" :opacity="0.025 + faceFrame.screenGlow * 0.035"/>
              <g :transform="`translate(${faceFrame.faceOffsetX} ${faceFrame.faceOffsetY}) translate(120 120) rotate(${faceFrame.faceRotation}) scale(${faceFrame.faceScaleX} ${faceFrame.faceScaleY}) translate(-120 -120)`">
                <g v-for="(eye, index) in faceFrame.eyes" :key="index" :transform="eyeTransform(eye)">
                  <ellipse :rx="eye.width/2" :ry="eye.height/2" fill="#8ff7ff" opacity=".12" filter="url(#eyeGlow)"/>
                  <ellipse :rx="eye.width/2" :ry="eye.height/2" fill="url(#eyeFill)"/>
                  <g :transform="`translate(${eye.pupilX} ${eye.pupilY})`" :opacity="eye.pupilOpacity">
                    <ellipse :rx="eye.pupilWidth/2" :ry="eye.pupilHeight/2" fill="url(#pupilFill)"/>
                    <circle :cx="eye.highlightX-eye.pupilX" :cy="eye.highlightY-eye.pupilY" :r="eye.highlightRadius" fill="#fff"/>
                  </g>
                </g>
                <path :d="faceFrame.mouthPath" class="mouth-line" :opacity="faceFrame.mouthOpacity" :stroke-width="faceFrame.mouthStrokeWidth"/>
              </g>
              <g :opacity="faceFrame.listeningOpacity" class="listen-arcs"><path d="M24 99 Q12 120 24 141"/><path d="M216 99 Q228 120 216 141"/></g>
              <g class="accent" :opacity="faceFrame.accentOpacity" :transform="`translate(204 38) scale(${faceFrame.accentScale})`"><circle r="17"/><text text-anchor="middle" dominant-baseline="central">{{ faceFrame.accentText }}</text></g>
            </template>

            <template v-else>
              <rect width="240" height="240" rx="31" fill="#fff5cf"/>
              <circle cx="34" cy="33" r="28" fill="#ffdbe7" opacity=".34"/>
              <circle cx="206" cy="202" r="35" fill="#c9f1e8" opacity=".5"/>
              <ellipse cx="120" cy="224" rx="51" ry="8" fill="#c6909d" opacity=".16"/>

              <g :transform="`translate(120 138) scale(${kawaiiFrame.bodyScaleX} ${kawaiiFrame.bodyScaleY}) translate(-120 -138) translate(0 ${kawaiiFrame.bodyOffsetY})`" filter="url(#softShadow)">
                <path d="M82 155 C68 158 64 169 71 178 C75 183 82 184 88 181 L89 202 C90 218 101 222 109 211 L131 211 C139 222 150 218 151 202 L152 181 C158 184 165 183 169 178 C176 169 172 158 158 155 C149 148 139 145 120 145 C101 145 91 148 82 155 Z" fill="url(#mascotFill)" stroke="#3a3038" stroke-width="4" stroke-linejoin="round"/>
                <g :transform="`rotate(${-kawaiiFrame.armLift} 82 170)`"><path d="M85 164 Q69 158 68 171 Q70 181 87 177" fill="#ffd5e2" stroke="#3a3038" stroke-width="4" stroke-linecap="round"/></g>
                <g :transform="`rotate(${kawaiiFrame.armLift} 158 170)`"><path d="M155 164 Q171 158 172 171 Q170 181 153 177" fill="#ffd5e2" stroke="#3a3038" stroke-width="4" stroke-linecap="round"/></g>
              </g>

              <g :transform="`translate(${kawaiiFrame.headOffsetX} ${kawaiiFrame.headOffsetY}) translate(120 100) rotate(${kawaiiFrame.headRotation}) translate(-120 -100)`">
                <g :transform="`translate(82 55) rotate(${kawaiiFrame.leftEarRotation}) scale(1 ${kawaiiFrame.earScaleY}) translate(-82 -55)`"><path d="M78 67 C65 45 67 19 79 15 C91 11 100 36 94 64 Z" fill="url(#mascotFill)" stroke="#3a3038" stroke-width="4" stroke-linejoin="round"/><path d="M80 57 C73 41 75 25 80 23 C86 21 91 40 88 57 Z" fill="#f6a9c2" opacity=".55"/></g>
                <g :transform="`translate(158 55) rotate(${kawaiiFrame.rightEarRotation}) scale(1 ${kawaiiFrame.earScaleY}) translate(-158 -55)`"><path d="M146 64 C140 36 149 11 161 15 C173 19 175 45 162 67 Z" fill="url(#mascotFill)" stroke="#3a3038" stroke-width="4" stroke-linejoin="round"/><path d="M152 57 C149 40 154 21 160 23 C165 25 167 41 160 57 Z" fill="#f6a9c2" opacity=".55"/></g>

                <path d="M61 104 C61 68 84 47 120 47 C156 47 179 68 179 104 C179 137 158 154 120 154 C82 154 61 137 61 104 Z" fill="url(#mascotFill)" stroke="#3a3038" stroke-width="4.5" stroke-linejoin="round"/>
                <ellipse cx="76" cy="126" rx="14" ry="7" fill="#f79bb5" :opacity="kawaiiFrame.blushOpacity" :transform="`scale(${kawaiiFrame.blushScale}) translate(${(1-kawaiiFrame.blushScale)*76} ${(1-kawaiiFrame.blushScale)*126})`"/>
                <ellipse cx="164" cy="126" rx="14" ry="7" fill="#f79bb5" :opacity="kawaiiFrame.blushOpacity"/>

                <g v-for="(eye, index) in kawaiiFrame.eyes" :key="index" :transform="`translate(${eye.x} ${eye.y}) rotate(${eye.rotation})`">
                  <template v-if="eye.mode === 'open'">
                    <ellipse :rx="eye.width/2" :ry="eye.height/2" fill="#fffdf7" stroke="#3a3038" stroke-width="3"/>
                    <g :transform="`translate(${eye.pupilX} ${eye.pupilY})`" :opacity="eye.pupilOpacity"><circle :r="eye.pupilRadius" fill="#3a3038"/><circle :cx="-eye.pupilRadius*.27" :cy="-eye.pupilRadius*.31" :r="Math.max(2.1,eye.pupilRadius*.24)" fill="#fff"/></g>
                  </template>
                  <template v-else-if="eye.mode === 'happy'">
                    <path :d="`M ${-eye.width/2} 3 Q 0 ${-eye.height} ${eye.width/2} 3`" fill="none" stroke="#3a3038" stroke-width="5" stroke-linecap="round"/>
                  </template>
                  <template v-else><path :d="`M ${-eye.width/2} 0 Q 0 7 ${eye.width/2} 0`" fill="none" stroke="#3a3038" stroke-width="5" stroke-linecap="round"/></template>
                </g>

                <path :d="kawaiiFrame.mouthPath" :fill="kawaiiFrame.mouthFilled ? '#3a3038' : 'none'" stroke="#3a3038" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" :opacity="kawaiiFrame.mouthOpacity"/>
              </g>

              <g :opacity="kawaiiFrame.listeningOpacity" class="kawaii-listen"><path d="M43 95 Q33 106 43 117"/><path d="M197 95 Q207 106 197 117"/></g>
              <g class="kawaii-accent" :opacity="kawaiiFrame.accentOpacity" :transform="`translate(202 34) scale(${kawaiiFrame.accentScale})`"><circle r="16"/><text text-anchor="middle" dominant-baseline="central">{{ kawaiiFrame.accentText }}</text></g>
            </template>
          </svg>
        </div>

        <div class="state-card"><span>LCD OUTPUT</span><strong>{{ statusLabel }}</strong><small>Only these pixels are intended for the physical DeskPet LCD.</small></div>
      </div>
    </section>

    <aside class="control-panel">
      <div class="panel-heading"><div><p class="eyebrow">CHARACTER CONTROLS</p><h2>Expression & interaction</h2></div><button class="primary" @click="playDemo">Run conversation demo</button></div>

      <section class="control-section">
        <div class="section-title"><span>00</span><h3>Character renderer</h3></div>
        <div class="renderer-switch"><button :class="{active:renderer==='kawaii'}" @click="renderer='kawaii'">Kawaii mascot</button><button :class="{active:renderer==='face'}" @click="renderer='face'">Big-eye face</button></div>
      </section>

      <section class="control-section"><div class="section-title"><span>01</span><h3>Conversation state</h3></div><div class="chip-grid state-grid"><button v-for="state in STATES" :key="state" :class="{active:controls.state===state}" @click="setState(state)">{{state}}</button></div></section>
      <section class="control-section"><div class="section-title"><span>02</span><h3>Emotion grammar</h3></div><div class="chip-grid emotion-grid"><button v-for="emotion in EMOTIONS" :key="emotion" :class="{active:controls.emotion===emotion}" @click="setEmotion(emotion)">{{emotion}}</button></div><label class="slider-row"><span>Intensity <b>{{controls.emotionWeight.toFixed(2)}}</b></span><input v-model.number="controls.emotionWeight" type="range" min="0" max="1" step="0.01"/></label></section>
      <section class="control-section split"><div><div class="section-title"><span>03</span><h3>Gaze</h3></div><label class="slider-row"><span>X <b>{{controls.gazeX.toFixed(2)}}</b></span><input v-model.number="controls.gazeX" type="range" min="-1" max="1" step="0.01"/></label><label class="slider-row"><span>Y <b>{{controls.gazeY.toFixed(2)}}</b></span><input v-model.number="controls.gazeY" type="range" min="-1" max="1" step="0.01"/></label><label class="toggle"><input v-model="controls.pointerActive" type="checkbox"/><span></span>Pointer follow</label></div><div><div class="section-title"><span>04</span><h3>Lip sync</h3></div><label class="slider-row"><span>Talk level <b>{{controls.talkLevel.toFixed(2)}}</b></span><input v-model.number="controls.talkLevel" :disabled="autoTalk" type="range" min="0" max="1" step="0.01"/></label><label class="toggle"><input v-model="autoTalk" type="checkbox"/><span></span>Simulated PCM envelope</label></div></section>

      <section class="notes"><p><strong>Kawaii mode.</strong> The mascot is deliberately built from simple geometric parts that can later be reproduced on ESP32-S3 without image assets: oversized head, rabbit ears, tiny body, blush, large readable eyes and a very small mouth.</p><p>Emotion is expressed through eyes, pupils, ears, head tilt, blush, arm lift and squash/bounce together. Lip sync remains amplitude-driven so a future Gemini/TTS PCM stream can drive the same interface.</p></section>
    </aside>
  </main>
</template>

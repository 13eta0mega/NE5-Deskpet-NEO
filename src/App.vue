<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { EMOTIONS, STATES, eyeTransform, sampleCharacter, type Controls, type Emotion, type PetState } from './character'

const controls = reactive<Controls>({ state: 'idle', emotion: 'neutral', emotionWeight: 1, gazeX: 0, gazeY: 0, talkLevel: 0.42, pointerActive: true })
const now = ref(0)
const fps = ref(60)
const autoTalk = ref(true)
const canvas = ref<HTMLElement | null>(null)
let raf = 0
let last = performance.now()
let frames = 0
let fpsSince = last

const frame = computed(() => sampleCharacter(now.value, controls))

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
          <p class="eyebrow">NE5 DESKPET NEO / LCD FACE LAB</p>
          <h1>240 × 240 Face Simulator</h1>
        </div>
        <div class="metrics">
          <span><i class="dot live"></i>{{ fps }} FPS</span>
          <span>LCD-only preview</span>
          <span>ESP32-S3 target</span>
        </div>
      </header>

      <div ref="canvas" class="stage" @pointermove="pointerMove" @pointerleave="pointerLeave">
        <div class="screen-shell">
          <svg class="lcd" viewBox="0 0 240 240" role="img" :aria-label="frame.statusLabel">
            <defs>
              <radialGradient id="screenBg" cx="50%" cy="42%" r="70%">
                <stop offset="0%" stop-color="#111822" />
                <stop offset="64%" stop-color="#05080d" />
                <stop offset="100%" stop-color="#010203" />
              </radialGradient>
              <linearGradient id="eyeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f8ffff" />
                <stop offset="72%" stop-color="#dffcff" />
                <stop offset="100%" stop-color="#b9f8fb" />
              </linearGradient>
              <radialGradient id="pupilFill" cx="38%" cy="30%" r="70%">
                <stop offset="0%" stop-color="#243c55" />
                <stop offset="62%" stop-color="#142739" />
                <stop offset="100%" stop-color="#08111b" />
              </radialGradient>
              <filter id="eyeGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4.2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.6" /></filter>
            </defs>

            <rect width="240" height="240" rx="31" fill="url(#screenBg)" />
            <ellipse cx="120" cy="118" rx="92" ry="82" fill="#61edf4" :opacity="0.025 + frame.screenGlow * 0.035" filter="url(#softGlow)" />

            <g :transform="`translate(${frame.faceOffsetX} ${frame.faceOffsetY}) translate(120 120) rotate(${frame.faceRotation}) scale(${frame.faceScaleX} ${frame.faceScaleY}) translate(-120 -120)`">
              <g v-for="(eye, index) in frame.eyes" :key="index" :transform="eyeTransform(eye)">
                <ellipse :rx="eye.width / 2" :ry="eye.height / 2" fill="#8ff7ff" opacity="0.12" filter="url(#eyeGlow)" />
                <ellipse :rx="eye.width / 2" :ry="eye.height / 2" fill="url(#eyeFill)" />
                <g :transform="`translate(${eye.pupilX} ${eye.pupilY})`" :opacity="eye.pupilOpacity">
                  <ellipse :rx="eye.pupilWidth / 2" :ry="eye.pupilHeight / 2" fill="url(#pupilFill)" />
                  <circle :cx="eye.highlightX - eye.pupilX" :cy="eye.highlightY - eye.pupilY" :r="eye.highlightRadius" fill="#fff" opacity="0.98" />
                </g>
              </g>

              <path :d="frame.mouthPath" class="mouth-line" :opacity="frame.mouthOpacity" :stroke-width="frame.mouthStrokeWidth" />
            </g>

            <g :opacity="frame.listeningOpacity" class="listen-arcs">
              <path d="M 24 99 Q 12 120 24 141" />
              <path d="M 216 99 Q 228 120 216 141" />
            </g>

            <g class="accent" :opacity="frame.accentOpacity" :transform="`translate(204 38) scale(${frame.accentScale})`">
              <circle r="17" />
              <text text-anchor="middle" dominant-baseline="central">{{ frame.accentText }}</text>
            </g>
          </svg>
        </div>

        <div class="state-card">
          <span>LCD OUTPUT</span>
          <strong>{{ frame.statusLabel }}</strong>
          <small>This square is the content that will be rendered on the physical LCD.</small>
        </div>
      </div>
    </section>

    <aside class="control-panel">
      <div class="panel-heading">
        <div><p class="eyebrow">FACE CONTROLS</p><h2>Expression & interaction</h2></div>
        <button class="primary" @click="playDemo">Run conversation demo</button>
      </div>

      <section class="control-section">
        <div class="section-title"><span>01</span><h3>Conversation state</h3></div>
        <div class="chip-grid state-grid"><button v-for="state in STATES" :key="state" :class="{ active: controls.state === state }" @click="setState(state)">{{ state }}</button></div>
      </section>

      <section class="control-section">
        <div class="section-title"><span>02</span><h3>Emotion grammar</h3></div>
        <div class="chip-grid emotion-grid"><button v-for="emotion in EMOTIONS" :key="emotion" :class="{ active: controls.emotion === emotion }" @click="setEmotion(emotion)">{{ emotion }}</button></div>
        <label class="slider-row"><span>Intensity <b>{{ controls.emotionWeight.toFixed(2) }}</b></span><input v-model.number="controls.emotionWeight" type="range" min="0" max="1" step="0.01" /></label>
      </section>

      <section class="control-section split">
        <div>
          <div class="section-title"><span>03</span><h3>Gaze</h3></div>
          <label class="slider-row"><span>X <b>{{ controls.gazeX.toFixed(2) }}</b></span><input v-model.number="controls.gazeX" type="range" min="-1" max="1" step="0.01" /></label>
          <label class="slider-row"><span>Y <b>{{ controls.gazeY.toFixed(2) }}</b></span><input v-model.number="controls.gazeY" type="range" min="-1" max="1" step="0.01" /></label>
          <label class="toggle"><input v-model="controls.pointerActive" type="checkbox" /><span></span>Pointer follow</label>
        </div>
        <div>
          <div class="section-title"><span>04</span><h3>Lip sync</h3></div>
          <label class="slider-row"><span>Talk level <b>{{ controls.talkLevel.toFixed(2) }}</b></span><input v-model.number="controls.talkLevel" :disabled="autoTalk" type="range" min="0" max="1" step="0.01" /></label>
          <label class="toggle"><input v-model="autoTalk" type="checkbox" /><span></span>Simulated PCM envelope</label>
        </div>
      </section>

      <section class="notes">
        <p><strong>Changed concept.</strong> The PC app now previews only the character pixels intended for the DeskPet LCD. The product enclosure is deliberately not rendered here.</p>
        <p>Large, nearly touching eyes dominate the 240×240 frame. Blink, gaze, breathing, emotional eye deformation and amplitude-driven mouth motion are all generated locally so the same semantic controls can later be ported to ESP32-S3.</p>
      </section>
    </aside>
  </main>
</template>

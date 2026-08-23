<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { EMOTIONS, STATES, eyeTransform, pillPath, sampleCharacter, type Controls, type Emotion, type PetState } from './character'

const controls = reactive<Controls>({
  state: 'idle',
  emotion: 'neutral',
  emotionWeight: 1,
  gazeX: 0,
  gazeY: 0,
  talkLevel: 0.45,
  pointerActive: true
})

const now = ref(0)
const fps = ref(60)
const autoTalk = ref(true)
const canvas = ref<HTMLElement | null>(null)
let raf = 0
let last = performance.now()
let frames = 0
let fpsSince = last

const frame = computed(() => sampleCharacter(now.value, controls))
const accentText = computed(() => {
  if (controls.state === 'thinking') return '···'
  if (controls.state === 'notify') return '!'
  if (controls.state === 'success') return '✓'
  if (controls.state === 'error') return '?'
  return ''
})

function tick(ms: number) {
  const dt = Math.min((ms - last) / 1000, 0.05)
  last = ms
  now.value += dt
  if (autoTalk.value && controls.state === 'speaking') {
    controls.talkLevel = 0.15 + Math.abs(Math.sin(now.value * 8.2) * Math.sin(now.value * 2.7)) * 0.78
  }
  frames += 1
  if (ms - fpsSince >= 500) {
    fps.value = Math.round((frames * 1000) / (ms - fpsSince))
    frames = 0
    fpsSince = ms
  }
  raf = requestAnimationFrame(tick)
}

function setState(state: PetState) {
  controls.state = state
}

function setEmotion(emotion: Emotion) {
  controls.emotion = emotion
}

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
  const sequence: Array<[PetState, number]> = [
    ['idle', 900], ['listening', 1300], ['thinking', 1500], ['speaking', 2200], ['success', 900], ['idle', 1200]
  ]
  let delay = 0
  for (const [state, duration] of sequence) {
    window.setTimeout(() => setState(state), delay)
    delay += duration
  }
}

onMounted(() => {
  last = performance.now()
  fpsSince = last
  raf = requestAnimationFrame(tick)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <main class="app-shell">
    <section class="hero-panel">
      <header class="topbar">
        <div>
          <p class="eyebrow">NE5 DESKPET NEO / PC PROTOTYPE</p>
          <h1>Character Lab</h1>
        </div>
        <div class="metrics">
          <span><i class="dot live"></i>{{ fps }} FPS</span>
          <span>Procedural SVG</span>
          <span>ESP-ready state model</span>
        </div>
      </header>

      <div ref="canvas" class="stage" @pointermove="pointerMove" @pointerleave="pointerLeave">
        <div class="halo"></div>
        <svg class="pet" viewBox="0 0 320 320" role="img" :aria-label="frame.statusLabel">
          <g :transform="`translate(160 160) translate(0 ${frame.bodyOffsetY}) rotate(${frame.bodyRotation}) scale(${frame.bodyScaleX} ${frame.bodyScaleY}) translate(-160 -160)`">
            <path :d="frame.bodyPath" class="body" />
            <path
              v-for="(eye, index) in frame.eyes"
              :key="index"
              :d="pillPath(eye.width, eye.height)"
              :transform="eyeTransform(eye)"
              class="eye"
            />
            <path v-if="frame.mouthPath" :d="frame.mouthPath" class="mouth" :opacity="frame.mouthOpacity" />
          </g>
          <g class="accent" :opacity="frame.accentOpacity" :transform="`translate(248 72) scale(${frame.accentScale})`">
            <circle r="25" />
            <text text-anchor="middle" dominant-baseline="central">{{ accentText }}</text>
          </g>
        </svg>

        <div class="state-card">
          <span>NOW</span>
          <strong>{{ frame.statusLabel }}</strong>
          <small>Move the pointer around the pet to test gaze tracking.</small>
        </div>
      </div>
    </section>

    <aside class="control-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">LIVE CONTROLS</p>
          <h2>Interaction console</h2>
        </div>
        <button class="primary" @click="playDemo">Run conversation demo</button>
      </div>

      <section class="control-section">
        <div class="section-title"><span>01</span><h3>Conversation state</h3></div>
        <div class="chip-grid state-grid">
          <button v-for="state in STATES" :key="state" :class="{ active: controls.state === state }" @click="setState(state)">{{ state }}</button>
        </div>
      </section>

      <section class="control-section">
        <div class="section-title"><span>02</span><h3>Emotion grammar</h3></div>
        <div class="chip-grid emotion-grid">
          <button v-for="emotion in EMOTIONS" :key="emotion" :class="{ active: controls.emotion === emotion }" @click="setEmotion(emotion)">{{ emotion }}</button>
        </div>
        <label class="slider-row">
          <span>Intensity <b>{{ controls.emotionWeight.toFixed(2) }}</b></span>
          <input v-model.number="controls.emotionWeight" type="range" min="0" max="1" step="0.01" />
        </label>
      </section>

      <section class="control-section split">
        <div>
          <div class="section-title"><span>03</span><h3>Gaze</h3></div>
          <label class="slider-row"><span>X <b>{{ controls.gazeX.toFixed(2) }}</b></span><input v-model.number="controls.gazeX" type="range" min="-1" max="1" step="0.01" /></label>
          <label class="slider-row"><span>Y <b>{{ controls.gazeY.toFixed(2) }}</b></span><input v-model.number="controls.gazeY" type="range" min="-1" max="1" step="0.01" /></label>
          <label class="toggle"><input v-model="controls.pointerActive" type="checkbox" /><span></span>Pointer follow</label>
        </div>
        <div>
          <div class="section-title"><span>04</span><h3>Voice motion</h3></div>
          <label class="slider-row"><span>Talk level <b>{{ controls.talkLevel.toFixed(2) }}</b></span><input v-model.number="controls.talkLevel" :disabled="autoTalk" type="range" min="0" max="1" step="0.01" /></label>
          <label class="toggle"><input v-model="autoTalk" type="checkbox" /><span></span>Simulated audio envelope</label>
        </div>
      </section>

      <section class="notes">
        <p><strong>Design intent.</strong> Soft asymmetrical pebble silhouette, capsule-eye grammar, subtle idle breathing and gaze, and a mouth that appears only while speaking/laughing.</p>
        <p>The state and emotion layers are separate so Gemini Live can later drive semantic state while the local character engine keeps blink, breath and micro motion autonomous.</p>
      </section>
    </aside>
  </main>
</template>

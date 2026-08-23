<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { JIRAI_EMOTIONS, sampleJirai, type JiraiEmotion } from './jiraiRig'

const emotion = ref<JiraiEmotion>('neutral')
const speaking = ref(false)
const autoTalk = ref(true)
const talkLevel = ref(0.35)
const now = ref(0)
const fps = ref(60)
let raf = 0
let last = performance.now()
let frames = 0
let fpsSince = last

const frame = computed(() => sampleJirai(now.value, emotion.value, speaking.value, talkLevel.value))

function tick(ms: number) {
  const dt = Math.min((ms - last) / 1000, 0.05)
  last = ms
  now.value += dt
  if (autoTalk.value && speaking.value) {
    talkLevel.value = 0.08 + Math.abs(Math.sin(now.value * 8.7) * Math.sin(now.value * 2.3)) * 0.9
  }
  frames++
  if (ms - fpsSince >= 500) {
    fps.value = Math.round((frames * 1000) / (ms - fpsSince))
    frames = 0
    fpsSince = ms
  }
  raf = requestAnimationFrame(tick)
}

function playDemo() {
  const seq: Array<[JiraiEmotion, boolean, number]> = [
    ['neutral', false, 900], ['happy', false, 1100], ['wink', false, 850], ['surprised', false, 900],
    ['neutral', true, 2600], ['excited', false, 1000], ['sad', false, 900], ['annoyed', false, 900], ['sleepy', false, 1200], ['neutral', false, 900]
  ]
  let delay = 0
  for (const [e, talk, duration] of seq) {
    window.setTimeout(() => { emotion.value = e; speaking.value = talk }, delay)
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
          <p class="eyebrow">NE5 DESKPET NEO / JIRAI REFERENCE RIG</p>
          <h1>Reference-locked Character Simulator</h1>
        </div>
        <div class="metrics">
          <span><i class="dot"></i>{{ fps }} FPS</span>
          <span>PNG reference rig</span>
          <span>ESP32-S3 later</span>
        </div>
      </header>

      <div class="stage jirai-stage">
        <div class="character-frame">
          <div class="character-transform" :style="{
            transform: `translate(${frame.x}px, ${frame.y}px) rotate(${frame.rotation}deg) scale(${frame.scaleX}, ${frame.scaleY})`
          }">
            <img class="character-png" :src="frame.characterSrc" :alt="frame.statusLabel" draggable="false" />
            <img v-if="frame.mouthSrc" class="mouth-png" :src="frame.mouthSrc" alt="lip sync mouth" draggable="false"
              :style="{ transform: `translate(-50%, -50%) scale(${frame.mouthScale})` }" />
          </div>
        </div>
        <div class="state-card"><span>REFERENCE OUTPUT</span><strong>{{ frame.statusLabel }}</strong><small>Static expressions use reference-derived transparent PNGs. Motion is intentionally minimal.</small></div>
      </div>
    </section>

    <aside class="control-panel">
      <div class="panel-heading">
        <div><p class="eyebrow">REFERENCE CONTROLS</p><h2>Expression & lip sync</h2></div>
        <button class="primary" @click="playDemo">Run reference demo</button>
      </div>

      <section class="control-section">
        <div class="section-title"><span>01</span><h3>Reference expressions</h3></div>
        <div class="chip-grid emotion-grid">
          <button v-for="e in JIRAI_EMOTIONS" :key="e" :class="{ active: emotion === e }" @click="emotion = e; speaking = false">{{ e }}</button>
        </div>
      </section>

      <section class="control-section">
        <div class="section-title"><span>02</span><h3>Lip sync</h3></div>
        <div class="renderer-dock jirai-toggle">
          <button :class="{active: !speaking}" @click="speaking = false">Expression</button>
          <button :class="{active: speaking}" @click="speaking = true; emotion = 'neutral'">Speaking</button>
        </div>
        <label class="slider-row"><span>Talk level <b>{{ talkLevel.toFixed(2) }}</b></span><input v-model.number="talkLevel" :disabled="autoTalk" type="range" min="0" max="1" step="0.01" /></label>
        <label class="toggle"><input v-model="autoTalk" type="checkbox" /><span></span>Simulated PCM envelope</label>
      </section>

      <section class="notes">
        <p><strong>Reference lock enabled.</strong> The previous procedural Kawaii/Big-eye emotion set is no longer used in this simulator. Only the attached Jirai-compatible expression set remains.</p>
        <p>Idle motion is limited to sub-pixel translation, roughly 0.28% vertical breathing, and less than 0.5° rotation so the source proportions are preserved.</p>
      </section>
    </aside>
  </main>
</template>

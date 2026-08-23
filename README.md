# NE5 DeskPet NEO

PC-first prototype for the NE5 DeskPet character system.

## Current milestone

This branch implements the first **PC Character Lab** before ESP32-S3 integration.

Implemented now:

- Original soft-asymmetrical pebble character (not a Grok/Taby visual clone)
- 64-sample procedural body silhouette
- 16 emotion grammar presets
- 10 conversation states
- Deterministic `sampleCharacter(time, controls)` character engine
- Blink, subtle breathing, idle gaze drift and pointer gaze tracking
- State overrides for listening/interrupted/success/error/sleep
- Speaking-only mouth with simulated audio-envelope motion
- Interactive state/emotion/gaze/talk controls
- Conversation demo sequence
- Vitest coverage and GitHub Actions build/test validation

## Run on PC

Requirements: Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5190
```

## Validation

```bash
npm test
npm run build
```

## Recommended things to test visually

1. Move the mouse around the character and check whether gaze feels natural.
2. Compare `neutral`, `happy`, `angry`, `sad`, `confused`, `curious`, `sleepy`, and `surprised`.
3. Switch through `listening -> thinking -> speaking -> success -> idle`.
4. In `speaking`, toggle the simulated audio envelope and inspect the mouth/body response.
5. Run the conversation demo and judge whether the DeskPet feels alive without excessive idle movement.

## Architecture direction

The current renderer is SVG because this is the PC design-validation phase. The semantic interface is already separated into state, emotion, gaze and talk level so the same character behavior can later drive an ESP32-S3 framebuffer renderer without sending graphical frames from the PC.

## Next planned milestone

After the character direction is approved:

1. Refine the original visual identity and signature motion.
2. Add explicit transition blending between state/emotion changes.
3. Wrap the simulator in Tauri 2 as a native desktop application.
4. Add Gemini Live PC microphone/speaker integration.
5. Add ESP32-S3 transport and LCD renderer later.

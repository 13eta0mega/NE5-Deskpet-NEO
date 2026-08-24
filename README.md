# NE5 DeskPet NEO

PC-first prototype for the NE5 DeskPet character system.

## Current milestone

The project now uses **Jirai Cutout Rig v3** for PC-side character validation before ESP32-S3 integration.

Implemented now:

- Reference-derived transparent PNG base and 1:1 sprite atlas
- Eight approved expressions: `neutral`, `happy`, `wink`, `surprised`, `sad`, `annoyed`, `sleepy`, `excited`
- No raster mesh morphing for eyes or detailed mouths
- Eye pose swaps hidden behind blink/occlusion
- Vector interpolation for eyebrows and simple mouth lines
- Discrete viseme sprites: `REST`, `SMILE`, `A`, `E`, `I`, `O`, `U`
- Short REST gate between detailed viseme changes
- Sad/annoyed reference-derived gesture sprites
- Landmark-normalized reference QA overlay
- Transition-duration control and frame-by-frame scrub QA
- Vitest and production-build validation

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

## GitHub Pages test build

The production simulator is deployed from `main` through `.github/workflows/pages.yml`.

Expected project Pages URL:

```text
https://13eta0mega.github.io/NE5-Deskpet-NEO/
```

## Validation

```bash
npm test
npm run build
```

## Recommended visual QA

1. Test `Neutral -> Happy` with transition pause enabled.
2. Scrub through 40-60% and inspect the eye occlusion swap.
3. Confirm the simple mouth line changes continuously before the detailed happy mouth appears.
4. Test `Neutral -> Sad` and compare the final pose with the reference overlay.
5. Enable speaking and inspect the REST-gated viseme changes.

## Architecture direction

The PC renderer uses a cutout-part rig: reference PNG sprites remain undeformed while simple vector curves and transform parameters are interpolated. The same semantic pose data can later drive an ESP32-S3 renderer without streaming graphical frames from the PC.

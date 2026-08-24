# Jirai Cutout Rig v3

## Why v3 exists

The previous renderer swapped complete expression PNG files. That preserves pixels but does not animate facial intent. v3 keeps the supplied Jirai reference artwork while moving only semantic parts.

## Non-negotiable rendering rules

1. Raster eye and detailed-mouth PNGs are never mesh-morphed, warped, stretched, or cross-dissolved into another expression.
2. Eye pose changes use occlusion swap: close/clip the current eye, swap the discrete reference sprite near maximum closure, then reveal the target eye.
3. Simple eyebrow and closed-mouth lines may interpolate vector control points because they are clean strokes, not textured artwork.
4. Detailed open mouths and visemes remain discrete PNG sprites. A short REST gate hides sprite changes.
5. Whole-character movement stays restrained. Emotion must be communicated primarily by facial parts and reference gesture sprites.
6. The original complete expression PNGs remain QA references only and are not the runtime expression renderer.

## Expression transition example: neutral -> happy

- 0-35%: neutral eyes remain visible; eyebrow and vector mouth controls begin moving toward a smile.
- 35-50%: eye clipping closes the current open-eye artwork.
- around 50%: while the eye region is almost fully occluded, switch open-eye PNG to happy-eye PNG.
- 50-75%: reveal the happy-eye artwork.
- 58-100%: replace the vector smile bridge with the detailed happy mouth PNG.

There is no glow, flash, dissolve, or full-frame image swap.

## Speech

Speech has two independent values:

- `viseme`: phoneme-derived mouth shape target.
- `talkLevel`: amplitude/opening energy.

For the PC preview, a deterministic phoneme-like timeline is used. It is not random amplitude-driven viseme selection. Future TTS/Gemini integration should supply real phoneme/viseme timestamps.

## Required asset package

Upload `assets/jirai/rig-v3/` from `NE5_Jirai_Rig_v3_Assets.zip` to the repository root. Keep filenames unchanged.

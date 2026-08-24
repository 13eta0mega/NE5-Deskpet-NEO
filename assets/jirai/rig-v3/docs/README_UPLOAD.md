# Jirai Rig v3 asset pack

Upload the `assets/jirai/rig-v3` folder to the repository root without renaming files.

This pack is derived from the supplied Jirai reference/part atlases. It is intentionally a cutout/sprite rig, not a raster mesh-morph rig.

- `base/base_clean.png`: neutral bust with the facial feature region cleared.
- `eyes/*.png`: discrete reference eye poses. Runtime swaps are hidden behind blink/clip occlusion.
- `mouth/*.png`: discrete complex mouth/viseme sprites.
- `rig-v3-layout.json`: canonical anchors and reference-safe pose rules.

The repository code uses vector interpolation only for simple eyebrow and closed-line mouth curves. Raster assets are not deformed.

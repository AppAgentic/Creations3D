# Replicate Text-to-3D Provider Research

Date: 2026-05-04

## Decision

Use `hyper3d/rodin` as the default text-to-3D provider for Creations3D.

Why:

- Replicate's 3D model collection labels Rodin the highest-quality 3D model.
- Its API schema accepts direct text prompts and returns a GLB URI.
- A live prompt test produced a much more legible car model than Hunyuan for the same prompt.
- It supports PBR, quad mesh output, and GLB downloads, which matches the paid product promise.

Current app defaults:

- Provider model: `hyper3d/rodin`
- Tier: `Gen-2`
- Quality: `medium`
- Material: `PBR`
- Mesh mode: `Quad`
- Geometry format: `glb`
- Preview render: `true`

## Shortlist

### Tencent Hunyuan 3D 3.1

Source: https://replicate.com/tencent/hunyuan-3d-3.1

Replicate collection placement: best all-around 3D model.

Fit:

- Direct text-to-3D support.
- Image-to-3D support as well.
- Good paid-product positioning because the model targets texture fidelity and geometry precision.
- Strong fallback candidate because it supports both text and image input.

Risk:

- In the live prompt test, the output rendered as a low-readability white object in our viewer.
- Still worth benchmarking for other prompt categories, but it is no longer the default.

### Hyper3D Rodin

Source: https://replicate.com/hyper3d/rodin

Replicate collection placement: highest-quality 3D model.

Fit:

- Best current default candidate for text prompts.
- Outputs GLB and supports PBR/quad mesh style settings.
- Live test returned a visually legible model in about 100 seconds.

Risk:

- Its public positioning is more image-led than text-led, even though the API includes prompt input.
- Cost per successful run should be monitored before final credit pricing is locked.

### TRELLIS

Sources:

- https://replicate.com/firtoz/trellis
- https://replicate.com/fishwowater/trellis2

Fit:

- Strong image-to-3D path.
- `firtoz/trellis` is already wired for image upload generation.

Risk:

- Not the right default for pure text-to-3D.

### DreamCraft3D

Source: https://replicate.com/jd7h/dreamcraft3d

Fit:

- Text/image-conditioned 3D research model.

Risk:

- Not a good default for Creations3D because the model card/license notes non-commercial research use.

## Implementation Notes

- New text generations now start async Replicate predictions with `hyper3d/rodin`.
- The client polling window remains long enough for high-quality text-to-3D runs.
- Saved model records now store the provider model, title, preview URL when available, size, format, and prompt metadata.
- The library/detail UI should say GLB/OBJ/GLTF only when the generated output actually has that format.
- GLB/GLTF preview uses `@google/model-viewer`, which rendered Rodin and saved R2 models correctly. The Three.js path remains for OBJ fallback.

## Next Benchmark

Run the same five prompts through Rodin medium, Rodin high, and Hunyuan 3D 3.1, then compare:

- shape faithfulness
- material quality
- GLB size
- generation time
- texture/UV usability
- cost per successful output

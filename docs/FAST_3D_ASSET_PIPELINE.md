# CUNCUN FISHING WORLD — Fast 3D Asset Pipeline (Staging)

## Target
Create one attractive, mobile-friendly Chinese-style float fishing (台钓) playable vertical slice. The visual target is a subjective quality goal inspired by 钓鱼大咖, **not** a claim of asset equivalence or permission to copy proprietary art.

## Asset acquisition order (do not model from scratch)
1. **Rigged male human:** start from existing CUNCUN Angler .blend if usable; otherwise obtain a properly licensed, rigged human base from MakeHuman (https://www.makehumancommunity.org/) or another verified source. Preserve original files. Refine proportions, face, hair, clothing, five-finger hands.
2. **Animations:** source legally reusable walk/idle/sit animation clips (e.g. Mixamo, https://www.mixamo.com/, subject to current license/terms), retarget to one shared humanoid skeleton. Hand-author cast/strike/fight poses only where necessary.
3. **Fishing pond:** use a small licensed outdoor environment assembled from modular assets. Sources to evaluate: Poly Haven (https://polyhaven.com/), Kenney (https://kenney.nl/assets), Sketchfab (https://sketchfab.com/). Check license for each individual asset; don't assume every download is free for commercial use.
4. **Fishing props:** one telescopic hand pole without reel, float, line, chair, landing net, one fish. Prefer a few custom low-cost meshes where suitable rather than long asset searches.

## Required license checklist
For each downloaded asset record: name, original URL, author, license, attribution requirements, permitted commercial use, modification rights, redistribution limits, and download date. Reject assets with uncertain rights. Never import meshes or textures ripped from 钓鱼大咖.

## Blender -> Web
- Keep untouched source and working .blend files separate.
- Standardize scale, skeleton, material naming, pivot points and texture size.
- Export selected assets as glTF 2.0 (.glb); inspect animation playback, normals and materials.
- Use Three.js for float movement, rod bending, water surface, fish behavior and mobile touch controls. These are gameplay systems, not Blender-only animations.
- Profile actual iPhone performance before adding more characters.

## First playable acceptance criteria
- One rigged male avatar renders correctly from front, side and rear.
- One pond scene loads on mobile Safari.
- Touch cast -> float settles -> bite signal -> timed strike -> rod bends -> fish lands -> result shown.
- Source attribution/license manifest exists for any third-party assets.
- No edits to main, production, paid services or unrelated software.

## Current status
This document records the agreed workflow only. No asset downloads, Blender edits, working fishing mechanics or 90% visual quality have been verified by this file.

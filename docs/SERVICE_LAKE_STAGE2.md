# Stage 1–2 verification — 2026-11-05

Child branch: `feature/practice-fishing-stage2-20261105`, based on `26276ef` of the requested practice branch. Main and production are not edited or deployed.

## Implemented and exercised

- Repaired the legacy practice syntax error, retained progression/profile controls, bundled the exact existing Three.js r160.1 version and replaced the optional remote lamp with an original Blender lamp. Immutable scenery is instanced without changing interactive object references. Existing browser flow passes again.
- New isolated service-lake entry from `practice.html`, shared EXP rules, original Blender environment/decor pack, five functional decks and lower-detail background boxes.
- Compatible rod/mainline/leader/float/sinker/hook setup; bait mixing/feeding; per-deck depth measurement and calibration; realistic/easy modes; bite/strike/fight/surface/net/weigh/photo/retry.
- Five existing fish catalog IDs are rendered with actual GLBs; all 25 species and 14 bait definitions are preserved for later expansion. Bait preference, feeding and line/rod configuration affect the demo rules.
- Avatar reuses Angler V4 and 52 rest bones. Stand/walk/run clips were added to the existing fishing clips. Hand names are normalized after glTF loading, so pole/net/fish attachments bind to actual bones rather than silent fallbacks.
- Landscape controls, three quality levels, day/sunset/night lighting, player/first-person/overview cameras, exact letterboxed LIVE 9:16 and bounded shore walking.
- Demo EXP/coins are session-only. No calls to ticket/player/event write APIs, no persistent account awards or cash conversion.

## Acceptance limits

This is a playable stage-2 build, not completion of all V1.0 P0/P1 requirements. Exact finger grip, full-body IK/foot contacts during locomotion, realistic net/line collision, professional animation, facial/hair polish and water/shore art still require work. Camera lighting is visual; weather AI is not implemented. No female GLB, river, hub/shop/garage, persistent economy or 200-user test is claimed. Physical iPhone Safari testing and a separate public staging deployment remain pending.

The handoff contains Blender scenes, GLBs, actual gameplay captures, validator reports and local test results. Performance figures must be labelled Mac M4/headless with simulated viewport; they are not iPhone FPS claims.

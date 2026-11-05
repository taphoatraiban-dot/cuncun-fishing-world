# CUNCUN FISHING WORLD — V1.0 implementation blueprint
Status: approved design; implementation pending. Scope: feature/practice-fishing-mvp-20261104 only. Date: 2026-11-05.

## Product vision
Vietnamese southern-region semi-open-world 3D float-fishing game, landscape mobile browser, with a 9:16 separate LIVE camera. Original artwork and assets; no copying proprietary games. Start with traditional pole float fishing (câu đài), add spinning/reel fishing in later versions.

## Current baseline (verify, do not assume)
Repository README describes Three.js lake/pier/rod/fish, first-person/LIVE cameras, demo players, tickets, points, leaderboard and boss toggle. Existing commits mention 25 fish species, 14 bait products, seat assignment, ticket pricing and catalog API. Inspect implementation and tests before replacing any existing system. Blender Angler V4, Lake V2 and Fishing Box V1 are reported locally on Mac mini but are not verified in this repository. Do not invent GLB paths or claim these assets are integrated until verified.

## Release scope
### P0 — playable vertical slice (must complete first)
- Landscape iPhone Safari 3D scene, safe areas and responsive touch HUD; separate portrait LIVE composition.
- One compact CUNCUN hub with tackle shop, inventory and map interaction.
- One service fishing lake with 5 functional platforms; one natural riverbank spot with flexible placement.
- One avatar (reuse verified Angler V4 if present), seated animation, fishing box, pole, float, hook, bait and landing net.
- Equipment assembly: pole, mainline, leader, float, sinker, hook; validate compatible load and rig.
- Bait mixing, groundbait feeding, depth and float calibration.
- Full state machine: prepare -> cast -> wait -> float bite -> strike -> fight -> net -> weigh -> photo -> inventory/sell.
- Fish AI with bite probabilities and pulling behavior, water depth/substrate effects; five distinct fish for first playable demo, expand existing catalog rather than replacing it.
- Virtual coins, purchase, inventory, upgrades, NPC fish market; no real-money exchange or cash payouts.
- Save/load demo state safely; clear demo vs authenticated persistence.
- Onboarding and accessible UI; automated tests for state transitions, purchases, persistence and regressions.

### P1 — V1.0 extension
- Region selection map with 8 conceptual locations (4 service, 4 natural); initially 2 open, other 6 clearly marked coming soon. Do not imply all 8 are built.
- Hub walkable area, garage, motorcycle/car catalog and quick travel; driving physics and intercity roads are deferred.
- Weather, day/night, changing fish behavior, boss fish, record photo album, quests, achievements.
- Player customization (appearance and clothing) and stronger asset optimization.
- Ticket/seat reservation systems built on existing implementation, avoiding duplicate charging/seat collisions.
- NPC tutorials, shop categories, upgrades, fish journal and leaderboards.

### P2 — later
- Multiplayer target up to 200 concurrent users subject to server/load tests; do not equate 200 simulated names with real concurrency.
- TikTok LIVE event integration only after official approval; until then local simulated events.
- Additional provinces, natural lakes, boats, vehicle driving, camping, player-owned lakes, trading and reel fishing.
- Real payments only after explicit product/legal/security design approval.

## Game architecture
- Three.js client: SceneRouter (hub/lake/river), AssetLoader with GLB lazy loading, PlayerController, CameraManager (landscape game / portrait LIVE), FishingController state machine, FishAI, WeatherClock, UI.
- Data-driven catalogs: location, fish, equipment, bait, vehicle, prices, quests; IDs stable and versioned. Reuse existing catalog and ticket endpoints where possible.
- Separate economy and persistence from visuals; server-authoritative transactions and seats once multiplayer/payments exist.
- Distinct test/demo data from real accounts; no automatic account upgrades or money movement.
- Scene-specific asset loading, LOD, texture compression, animation budgets, FPS/memory checks on iPhone.

## Suggested repo structure (adapt to actual code)
src/game/{scene-router,player-controller,camera-manager,fishing-controller,fish-ai}.js
src/data/{locations,equipment,vehicles}.js
src/ui/{hub,shop,inventory,fishing-hud,map}.js
assets/{characters,environment,equipment,fish}/
tests/{fishing-loop,economy,inventory,mobile}.test.mjs
docs/{asset-manifest,qa-checklist,release-notes}.md

## Execution order and acceptance gates
1. Audit repo files, branch, tests, current APIs and local Blender exports. Back up working state. Report verified baseline.
2. Make P0 fishing loop playable using placeholders if GLBs absent. Test deterministic bite/strike/fight/net flow.
3. Import/optimize actual Blender assets when verified; verify hands grip rod, seat contact, float and net alignment.
4. Build hub, shop, inventory and one riverbank. Test coin balances, no negative inventory, persistence and scene travel.
5. Add iPhone landscape touch HUD and LIVE portrait camera; test rotation, safe areas, Safari WebGL and performance.
6. Add P1 incrementally; run tests after each change; show actual screenshots/video and reproducible test instructions.
7. Deploy staging preview only after tests. Never merge to main or change production without a separate user instruction.

## Acceptance criteria
- From a fresh demo account, a user can visit shop, buy compatible rig and bait, travel to a lake, place/select seat, assemble rig, mix/feed bait, cast, see float bite, strike, fight, net and weigh a fish, take record photo, sell to NPC and spend earned coins.
- User can also travel to one natural river spot and choose a valid fishing position.
- Both realistic and easy LIVE fishing modes work with different tuning but same shared state machine.
- On iPhone Safari in landscape: controls work, no clipped buttons, no blocking crashes, and acceptable measured FPS.
- LIVE 9:16 camera shows meaningful action without stretching.
- Tests pass and no existing ticket/catalog/seat features regress.
- No edits to main, no edits to ÔNG THẦN TÀI, no external paid services, no claim of unverified features.

## Instructions for execution agent on Mac mini
Read this document and inspect actual repository and Blender files before acting. Work only on feature/practice-fishing-mvp-20261104 or a new child feature branch. Make incremental commits, run tests, report real changed files, screenshots, blockers and what remains. Do not silently replace working systems, publish production, charge users, or assume unverified local assets exist.


## Environment art direction — approved visual polish
Target: attractive semi-realistic Vietnamese freshwater scenery, colorful and inviting but not cartoonish; visual quality should be noticeably above placeholder geometry while remaining mobile-friendly. Use original assets and legally reusable textures only.

### Service fishing lake
- Organic lake shoreline, natural terrain transitions, varied grass and shrubs, clusters of trees, flowers and rocks.
- Well-spaced wooden fishing piers and boxes, rod rests, small resting shelters, walking path, tackle shop backdrop, subtle props (buckets, lamps, benches).
- Clear water with subtle animated ripples, reflected sky/shore impression, soft bank foam and fish splash effects. Avoid expensive full-scene reflections on mobile.
- Warm morning and sunset lighting; pleasant night lamps. Preserve playable visibility of float and strike cues.

### Natural river
- Meandering river with varied bank slope, sand/mud/stone, bamboo and tropical vegetation; distinctive composition from commercial lake.
- Multiple safe fishing positions along bank, clear collision and walking paths, reeds, driftwood, underwater depth zones.
- Flow direction, gentle current cues, occasional birds/insects ambient audio and non-intrusive particles.

### Mobile art and performance requirements
- Three quality presets (low/medium/high), default based on actual device capability; prefer baked lighting and selective real-time shadows.
- Use instanced foliage, LOD, compressed textures, culled props, lazy-loaded scenes and lightweight water shader.
- Keep interactive elements legible on landscape iPhone; no visual obstruction of fishing float, rod or HUD.
- Profile actual Safari device frame time, memory and load time; do not assert a fixed FPS without measurements.
- Produce screenshots of each location from player camera and LIVE portrait camera; compare against approved art direction before calling it complete.

### Visual acceptance
- Both locations have clearly different silhouettes and mood, not the same lake with swapped textures.
- Camera views show depth, rich but controlled vegetation, natural banks and cohesive materials.
- Character, fishing box, rod, float and landing net are correctly placed in scenes; users can walk to fishing positions and complete the fishing loop.
- A lightweight fallback remains playable on less powerful iPhones.

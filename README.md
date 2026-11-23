# Emberwake

A little life beside a sleeping dragon. A small, single-player browser game about settling into a village, growing something, and finding out that being chosen need not involve a sword.

**Play:** https://audicar.github.io/emberwake/

## A quiet beginning

Make a home in a small village beneath a sleeping mountain. Grow a garden, get to know your neighbours, and explore paths where old stories are beginning to stir. Build a bond with dragons in a gentle fantasy adventure about kindness, belonging and finding your courage.

This free, single-player prototype currently offers roughly ten minutes of play, with time to wander. Create a character with 12 skin tones, 12 hairstyles, eight outfits and six accessories. Your chosen character also appears in a short opening scene. Change your name or appearance at any time. Relaxed village life sits alongside real-time action, with a journal that keeps one main quest in focus.

## Controls

| Action | Control |
| --- | --- |
| Opening dialogue | E, Space, Enter or Continue; Escape to skip |
| Move | Arrow keys or WASD |
| Talk, gather, plant, water, harvest | E, Space or Enter |
| Inventory | I |
| Journal | J |
| Village map | M |
| Blade attack | Z (hold to repeat) |
| Dodge | X |
| Dragon command | C |
| Menu / close / leave a conversation | Escape |
| Touch devices | On-screen direction pad and E button |

Inventory, journal and map can also be opened from the toolbar. Press the same key again or Escape to close; I, J and M switch directly between these screens. The map shows landmarks and your current position, with gathering locations marked during the relevant quest. The inventory includes item quantities and descriptions, plus a shortcut to the wardrobe. These screens pause movement and the in-game clock.

The in-game day advances slowly and stops before midnight. There is no forced bedtime or penalty. Press E at the front door of your red-roofed cottage, north-west of the square, to enter its furnished interior. Approach the bed from either side or the foot and press E to sleep. New stories begin with character creation and a short opening, followed by a scenic coach journey to the cottage. Each scene can be skipped independently. Press E, Space or Enter to continue; written close-ups stay open until you do. The opening resumes at the current shot if you reload; existing saves continue normally. The journey has its own gentle original score. The tall wardrobe stands in the north-west corner, books sit along the west wall, and the kitchen counter and dining table have their own clear spaces.

## Run locally

No installation, build, framework or third-party runtime dependency is needed to play. From this directory:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173 in a modern browser. ES modules require HTTP: opening `index.html` directly with `file://` is not supported.

For the model and map checks, use Node.js 20 or newer:

```sh
npm test
```

## Saves and privacy

Progress is automatically saved in `localStorage` after interactions, every ten seconds during play, and when leaving the page. Saves are local to a browser profile and origin. Clearing site data, switching devices or using a different web address will not carry a save across. Private browsing may discard it on exit; browser restrictions may prevent storage entirely. Reloading inside the cottage keeps you indoors. Expeditions restart from the village after a page reload; permanent story progress and collected equipment remain saved. Encounters reset on a new visit until their story is complete. Returning home restores your health. Defeat brings you home with your items intact.

The menu reports storage errors and provides save download and import without needing an account. Import validates the file before replacing progress, and asks before replacing the current story.

There are no analytics, network game services, external fonts or downloaded art assets. All scenery and sprites are drawn in Canvas. Original background music is synthesised in the browser, with different themes for village life and exploration. Enable it with the Music button and adjust its volume in the menu. Music pauses when the tab is hidden; no audio is downloaded.

## Hosting

The repository is a static site published from `main` at the repository root, with `.nojekyll` disabling Jekyll processing. GitHub Pages serves public repositories on GitHub Free, subject to its usage limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits. No paid service, custom domain, account for players or server is required.

## Source layout

- `core.js`: serialisable game state, save validation and garden/story rules.
- `art.js`: original procedural pixel scenery and collision geometry.
- `character.js`: layered character sprites, body silhouettes, hair, garments and accessories.
- `cast.js`: shared villager appearances and dialogue portraits.
- `combat.js`: real-time encounter rules, collision, combat and companion commands.
- `wilds.js`, `dragon.js`: woodland scenery and dragon sprites.
- `home.js`: cottage interior, furniture interactions and collision geometry.
- `music.js`: original musical themes and the Web Audio scheduler.
- `workshop-script.js`, `workshop-art.js`: isolated opening sequence and pixel scenery.
- `inventory.js`: item definitions, quantities derived from save data, and pixel icons.
- `game.js`: browser input, interface, persistence, dialogue, audio and render loop.
- `style.css`, `index.html`: responsive game screen and modal panels.
- `tests/core.test.js`: first-chapter progression, save validation, old-save migration and map reachability.
- `tests/character.test.js`: render bounds, walking directions and visibly distinct appearance options.
- `tests/inventory.test.js`: item quantities across planting, harvesting and shrine offerings.
- `tests/combat.test.js`: attack direction, dodging, cooldowns, encounter progression and old-save compatibility.
- `tests/music.test.js`: musical data and audio scheduling lifecycle.
- `tests/story.test.js`: sequential main quests and reachable cottage interactions.
- `tests/workshop.test.js`: opening progression, skipping, save compatibility and character-name handling.

The title is a working name. This game uses original art, writing and code; it contains no assets or characters from its inspirations.

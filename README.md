# Emberwake

A little life beside a sleeping dragon. A small, single-player browser game about settling into a village, growing something, and finding out that being chosen need not involve a sword.

**Play:** https://audicar.github.io/emberwake/

## The first chapter

Name your character and choose a female or male body, skin tone, hairstyle, hair colour, clothes, cloth colour and an accessory. The wardrobe has 12 hairstyles, eight outfits, six accessories and eight hair and cloth colours. Both body choices can wear every style; a four-direction preview shows the same sprite used in the village. Conversations show the speaker’s face in a portrait to the left of the dialogue. Meet Rowan and Mira, grow moonroot in the village garden, gather three starflowers, and visit the old shrine. The first chapter takes roughly 5–10 minutes; you can stay in the village afterwards. Appearance and name can be changed from the menu at any time. Existing saves keep their progress and option selections; saves created before body selection was added load with the female body, which can be changed in the wardrobe.

This is an initial playable prototype. There is one outdoor map, two neighbours, a simple garden and a short story. Building interiors, further chapters, fishing, trading and seasonal simulation are future possibilities, rather than implemented features.

## Controls

| Action | Control |
| --- | --- |
| Move | Arrow keys or WASD |
| Talk, gather, plant, water, harvest | E, Space or Enter |
| Inventory | I |
| Journal | J |
| Village map | M |
| Menu / close / leave a conversation | Escape |
| Touch devices | On-screen direction pad and E button |

Inventory, journal and map can also be opened from the toolbar. Press the same key again or Escape to close; I, J and M switch directly between these screens. The map shows the village landmarks and your current position. The inventory includes item quantities and descriptions, plus a shortcut to the wardrobe. These screens pause movement and the in-game clock.

The in-game day advances slowly and stops before midnight. There is no forced bedtime or penalty. Sleep by interacting with the front door of your red-roofed cottage, north-west of the square. Plant and water a moonroot before sleeping; it will be ready the next morning.

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

Progress is automatically saved in `localStorage` after interactions, every ten seconds during play, and when leaving the page. Saves are local to a browser profile and origin. Clearing site data, switching devices or using a different web address will not carry a save across. Private browsing may discard it on exit; browser restrictions may prevent storage entirely. The menu reports storage errors and provides save download and import without needing an account. Import validates the file before replacing progress, and asks before replacing the current story.

There are no analytics, network game services, external fonts or downloaded art assets. All scenery and sprites are drawn in Canvas. Optional ambient audio is synthesised in the browser and starts only when enabled.

## Hosting

The repository is a static site published from `main` at the repository root, with `.nojekyll` disabling Jekyll processing. GitHub Pages serves public repositories on GitHub Free, subject to its usage limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits. No paid service, custom domain, account for players or server is required.

## Source layout

- `core.js`: serialisable game state, save validation and garden/story rules.
- `art.js`: original procedural pixel scenery and collision geometry.
- `character.js`: layered character sprites, body silhouettes, hair, garments and accessories.
- `cast.js`: shared villager appearances and dialogue portraits.
- `inventory.js`: item definitions, quantities derived from save data, and pixel icons.
- `game.js`: browser input, interface, persistence, dialogue, audio and render loop.
- `style.css`, `index.html`: responsive game screen and modal panels.
- `tests/core.test.js`: first-chapter progression, save validation, old-save migration and map reachability.
- `tests/character.test.js`: render bounds, walking directions and visibly distinct appearance options.
- `tests/inventory.test.js`: item quantities across planting, harvesting and shrine offerings.

The title is a working name. This game uses original art, writing and code; it contains no assets or characters from its inspirations.

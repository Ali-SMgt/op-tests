# get the cat food 🐱

A small, playful browser mini-game built with **plain HTML, CSS and vanilla
JavaScript** (no frameworks, no dependencies, no backend).

Move the cat `≽^•⩊•^≼` with your mouse (or the arrow keys) to collect food
circles `◉`, earn coupons and try to finish the game!

## How to run

1. Place your images at:
   ```
   cat-game/assets/images/bg.jpg      # game background (~30% opacity layer)
   cat-game/assets/images/coupon.jpg  # coupon photo (top-left box + final popup)
   ```
   *(Both are referenced with relative paths. `bg.jpg` renders on a dedicated
   layer at ~30% opacity so the UI stays fully visible; `coupon.jpg` fills the
   themed image areas — until the files exist, a pink/purple/blue placeholder
   with the word "coupon" is shown instead.)*

2. Open `cat-game/index.html` directly in any modern desktop browser
   (double-click the file). It is fully static, so it also works when hosted
   on GitHub Pages.

   Optionally, serve it with a tiny local server instead:

   ```
   python -m http.server 8000
   ```

   then visit `http://localhost:8000/cat-game/`.

## How to play

- **Start screen:** answer `do you trust me?` with `yes` or `no`.
  Pressing `no` shows `T-T` plus `yes` / `but whyy`; `but whyy` adds another
  `T-T` and shows `now im sad`; `now im sad` adds a third `T-T` and finally
  shows two `yes` buttons. Every `yes` starts the game.
- **Mouse:** move the cursor and the cat follows smoothly.
- **Arrow keys:** Up / Down / Left / Right fallback movement
  (delta-time based, so speed is the same on any monitor).
- **Collect** the `◉` circles by touching them with the cat.

## Rules & limits

| Rule | Value |
| --- | --- |
| Active circles on screen | max **20** |
| Circle lifetime | **10 seconds** (they pulse before expiring) |
| Replacement distance | ~**300 px** away from the collected circle |
| Global spawn limit | **300 circles** per game |
| Treat countdown | appears at **5** collected → `25 treats to coupon` |
| Coupon milestone | every **30** collected → `coupons available : N` |
| Game over | **5 coupons** (150 collected) **or** the 300th circle spawned (immediate) |

Final message: `thanks for playing, luv u <3`

## Project structure

```
cat-game/
├── index.html            # markup: trust screen, game, HUD, game-over modal
├── css/
│   └── styles.css        # pink/purple/blue theme, fixed viewport, 30% bg layer
├── js/
│   └── game.js           # game logic: movement, spawning, collisions, counters
├── assets/
│   └── images/
│       ├── bg.jpg        # ← add this image manually
│       └── coupon.jpg    # ← add this image manually
└── README.md
```

## Notes

- The page never scrolls: `html/body` use `overflow: hidden` and the main
  container is `position: fixed; inset: 0; overflow: hidden`.
- The background lives in its own layer (`#bg-layer`, `opacity: 0.3`), so the
  game elements are **not** affected by the opacity.
- Resizing the window re-measures the playable area and keeps the cat and all
  circles inside it.

# Next Dough Bakehouse

Website for Next Dough Bakehouse — slow-made sourdough, handmade by Carly in her home kitchen.

## Pages
- `index.html` — homepage. The hero loaf turns left-to-right like a 3D model as you scroll; menu ("Our bakes"), how ordering works, and a "Say hello" order form that opens a pre-filled email.
- `about.html` — "Our kitchen": meet Carly.

## Files
- `styles.css`, `script.js` — shared styles and behavior (scroll turntable, reveal animations, order form).
- `assets/loaf-3d.js` — unwrapped crust texture + loaf profile used by the turntable (embedded so it also works when opened straight from disk).
- `assets/sourdough-loaf.webp` — still loaf image (no-JS fallback).
- `assets/carly.jpg` — Carly's photo.

## Run it
Open `index.html` in a browser. No build step. Any static host works (GitHub Pages, Netlify, Vercel).

## Before launch
Replace the placeholder menu items and prices, order/pickup times, and the `hello@nextdough.com` email (also set in `data-email` on the order form).

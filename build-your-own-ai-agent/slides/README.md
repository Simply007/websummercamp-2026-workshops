# Slides, Build a team agent in Claude Code

The talk-through deck, **implemented from the Claude Design design** (`claude-design/`)
into a single self-contained file: `index.html`. 22 slides, black + orange brand,
1920×1080. **No CDN, no runtime, no network**, it opens and presents in any browser,
fully offline.

## Present it

```bash
open slides/index.html
# or serve it:  cd slides && python3 -m http.server 8000  → http://localhost:8000
```

Controls:
- **→ / Space** next · **←** back · **Home / End** jump
- **F** fullscreen
- **S** (or **N**) toggle the **speaker notes** overlay for the current slide
  (your `Say:` / `Do:` script, baked into each slide)

The deck auto-scales to the window, and the slide number + an orange progress bar
sit at the bottom. The current slide is in the URL hash, so you can deep-link or
refresh without losing your place.

## Fill in the [bracketed] bits first

A few slides have `[your … ]` placeholders, your name/bio (slide 2), the Stacklist
one-liner + a public-stack URL (slide 3), your handle (close). Search `index.html`
for `[` and replace them.

## PDF backup (offline)

`index.html` has a print stylesheet that lays out one slide per page. In Chrome:
Print → **Save as PDF** → **Landscape** → Scale **Fit to page** → Background
graphics **on**. Keep it on a USB stick as your no-tech-needed fallback.

## Re-skin

Brand colors are inline on each slide (`#FF6A00` accent, `#111` ink, `#FAFAFA` bg).
To recolor globally, find/replace those hex values, or edit in the Claude Design
project (see `claude-design/README.md`) and re-implement.

# Asset pipeline — Claude Code + free AI generators

How to take this design system off the platform, run it inside Claude Code, and have Claude
generate or fetch real assets (logo, photos, illustrations, video) straight into `assets/`
without breaking the brand.

Free-tier limits change constantly — check each service before you rely on it. Nothing below
requires a paid plan to start.

---

## Part 1 — Get the system into Claude Code

The project is already shaped like an Agent Skill: `SKILL.md` at the root, `readme.md` as the
guide, plus tokens, components and kits.

1. **Download the project** (the download card in chat, or ask me for one) and unzip it.
2. **Put it where Claude Code looks for skills:**
   - just this project → `<your-repo>/.claude/skills/ubite-design/`
   - every project on your machine → `~/.claude/skills/ubite-design/`
   The folder must contain `SKILL.md` at its top level.
3. **Check it loaded:** open Claude Code in that repo and run `/skills` (or ask "what skills do
   you have?"). `ubite-design` should be listed.
4. **Use it:** "folosește skill-ul ubite-design și fă-mi ecranul de recompense" — Claude reads
   `readme.md`, the tokens and the component prompt files, and builds in-brand.
5. **Keep it in sync.** The skill folder is a copy. When the design system changes here, either
   re-download, or add it as a git submodule / symlink so one update serves both:
   ```bash
   ln -s ~/work/ubite-design-system ~/.claude/skills/ubite-design
   ```

**Also do this once**, so Claude Code stops re-deciding things: copy the "Hard rules" block at
the bottom of this file into your repo's `CLAUDE.md`.

---

## Part 2 — Pick your generators

### Images and illustration

| Route | Cost | Key needed | Good for | How Claude Code calls it |
|---|---|---|---|---|
| **Pollinations** | free, unlimited-ish | none | fastest path, placeholder photography, textures | plain `curl` of a URL with the prompt in the path |
| **Hugging Face Inference API** (FLUX.1-schnell, SDXL) | free tier | free token | best quality of the no-cost options | `curl` POST with your token, returns image bytes |
| **Stable Horde** | free, community GPUs | free anonymous key | batch generation, no rate anxiety | async: submit job, poll, download |
| **Google AI Studio** (Imagen / Gemini image) | free tier | free key | clean product shots, text rendering | REST call, base64 response |
| **Leonardo / Ideogram / Bing Image Creator** | free daily credits | account | one-off hero images, in-image text | manual, download by hand |

### Logo and vector

- Generate raster first (any route above) with the prompt in
  [`logo-brief.md`](logo-brief.md), then **vectorise**: `vtracer` or `potrace` locally, or
  Recraft's free SVG export. Claude Code can run the CLI and clean the resulting paths.
- Or skip AI: give Claude Code the `logo-brief.md` concept and ask it to draw the mark as
  hand-written SVG geometry (circles and a rounded U are trivially expressible) — for a
  geometric mark this often beats a generator, and the output is already a clean vector.

### Photography from the web (usually the right answer for the canteen)

- **Openverse** (openverse.org API) — no key, CC-licensed only, returns attribution.
- **Unsplash / Pexels / Pixabay APIs** — free keys, generous limits, high quality.
- For the *actual* canteen: nothing on the internet is a photo of Cantina Mihail Kogălniceanu.
  Take them on the site visit. Use stock only for mood, and never pass it off as the canteen.

### Video

| Route | Cost | Good for |
|---|---|---|
| **Kling / Luma Dream Machine / Pika** free credits | a few clips a day | a 5s hero loop for the pitch deck |
| **Remotion** (React video, local) | free | screen-recorded product demo rendered from real components — on-brand by construction |
| **ffmpeg + your own screen capture** | free | the jury demo: record the kit, cut to music, no AI needed |
| **CSS/keyframes in the kit itself** | free | the loyalty dot, the level change — already built |

For the funding jury, a Remotion or screen-capture demo of the real UI beats a generated video
every time: it shows the product, not a fantasy of it.

---

## Part 3 — Wire it up (the 15-minute version)

1. Put keys in `.env` at the repo root and add it to `.gitignore`:
   ```
   HF_TOKEN=...
   PEXELS_KEY=...
   ```
2. Ask Claude Code: *"scrie-mi `scripts/asset.sh` care ia un prompt și un nume de fișier,
   generează imaginea prin <ruta aleasă>, o salvează în `assets/generated/<nume>.png`, o
   redimensionează la max 1600px cu `sips`/`magick`, și adaugă o linie în
   `assets/manifest.json` cu promptul, sursa, data și licența."*
3. Ask it to add a `--photo` mode that searches Openverse/Pexels instead of generating, and
   writes the attribution into the same manifest.
4. From then on the workflow is one sentence: *"generează o fotografie de tavă de cantină
   pentru slotul `dish-papanasi`, stil UBite"* — Claude runs the script, drops the file in
   `assets/`, and points the `image-slot` at it.
5. Commit `assets/generated/` **and** `assets/manifest.json` together. A generated asset with no
   recorded prompt and licence is a liability in a public university repo.

### Getting a generated image into a design

Every photo position in the kits is an `<image-slot id="…">`. Two ways to fill one:

- **Drag** the file onto the slot in the preview — it sticks, and survives reload.
- **Point at it in code**: `<image-slot id="dish-papanasi" src="../../assets/generated/papanasi.png">`.
  Add `credit` and `credit-href` when the source requires attribution.

---

## Part 4 — Keeping generated assets on-brand

Paste this into any image prompt, after your subject:

```
Palette: deep blue #1F4FD8, ink #11161B, paper #F7F8FA, one accent of teal #128A6B,
amber #C47A0A or terracotta #D1512F. Flat, calm, institutional, student-not-corporate.
No gradient mesh, no glass, no glow, no 3D render, no lens flare, no text, no watermark,
no mascot, no stock-photo smiling.
```

For canteen photography specifically: *natural window light, real trays and real portions,
slightly imperfect, shot at eye level from a queue, no food-styling gloss.*

### Hard rules (copy into `CLAUDE.md`)

- Assets live in `assets/`. **Never hotlink** a generator or stock URL from a component — the
  canteen Wi-Fi and a dead CDN will both break it.
- Every generated or fetched file gets a row in `assets/manifest.json`: file, source, prompt or
  page URL, licence, date.
- **Generated imagery is art-directed, never ad hoc** (team decision, 22 Sep 2026). Every
  image goes through a preset in `scripts/art-direction.mjs`; generated dish photos carry
  `status: placeholder` until the canteen's real photos replace them.
- Icons come from the Lucide set already in `assets/icons/` — never generate an icon.
- The logo is drawn once, vectorised, and committed. It is never regenerated per use.
- Colour, type, spacing and motion come from `styles.css`. A generator never decides them.

---

## Part 5 — Three ways to run this, pick one

**A. Lean** — no keys, no scripts. Openverse for mood images, `logo-brief.md` prompt pasted
into any free generator by hand, everything else drawn by Claude Code as SVG/CSS. Fastest, and
nothing to maintain.

**B. Scripted** — `.env` + `scripts/asset.sh` + `assets/manifest.json`, Hugging Face for
generation and Pexels for photography. One sentence to Claude Code produces a committed,
attributed, resized asset. Best for a five-week build with a public repo.

**C. Full studio** — B, plus `vtracer` for logo vectorisation, Remotion for the demo video, and
a `scripts/check-assets.cjs` that fails CI if a file in `assets/` has no manifest row. Most
work, but the repo becomes genuinely portfolio-grade.

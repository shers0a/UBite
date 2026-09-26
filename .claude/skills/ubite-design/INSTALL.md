# Install this design system in Claude Code

Five minutes, once. After that you talk to Claude Code in plain Romanian and it builds
in-brand, generates assets and records their licences by itself.

## 1 · Download and place the folder

Download the project (the download card in chat) and unzip it, then:

```bash
# just for the UBite repo
mkdir -p <your-repo>/.claude/skills
cp -R ~/Downloads/ubite-design-system <your-repo>/.claude/skills/ubite-design

# or for every project on your machine
cp -R ~/Downloads/ubite-design-system ~/.claude/skills/ubite-design
```

`SKILL.md` must sit at the top level of that folder. Keeping the design system in its own git
repo and symlinking is better than copying, because updates then arrive for free:

```bash
ln -s ~/work/ubite-design-system ~/.claude/skills/ubite-design
```

## 2 · Check Claude Code sees it

```bash
cd <your-repo> && claude
```

Ask "ce skill-uri ai?" — `ubite-design` should be listed. If it is not, the folder is in the
wrong place or `SKILL.md` is nested one level too deep.

## 3 · Keys (one, free)

```bash
cp .env.example .env
```

Paste a free Hugging Face token from <https://huggingface.co/settings/tokens> into `HF_TOKEN`.
That is the only key you need. `PEXELS_KEY` is optional and only used if you ask for stock
photography.

Make sure `.env` is ignored:

```bash
echo ".env" >> .gitignore
```

## 4 · Make the scripts runnable

```bash
chmod +x scripts/asset.sh scripts/photo.sh
```

Requirements: `curl` and `node` (already on your machine if you run any JS tooling).
`imagemagick` or macOS `sips` is optional — it only resizes the output.

## 5 · Use it

Talk normally. Claude Code does the rest:

| You say | What happens |
|---|---|
| „folosește ubite-design și fă ecranul de recompense" | reads the tokens and components, writes the screen in-brand |
| „generează o fotografie de papanași pentru slotul `dish-papanasi`" | runs `scripts/asset.sh`, saves to `assets/generated/`, records the prompt and licence, points the slot at it |
| „caută o poză de cantină universitară pentru mood" | runs `scripts/photo.sh`, downloads a CC-licensed image with attribution |
| „verifică asset-urile" | runs `node scripts/check-assets.cjs` |

`CLAUDE.md` at the repo root already carries the hard rules, so you do not have to repeat them
in every conversation.

## 6 · Optional: fail the build on unrecorded assets

```yaml
# .github/workflows/assets.yml
name: assets
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: node scripts/check-assets.cjs
```

In a public university repo this is the cheapest way to prove every image is legitimately
licensed.

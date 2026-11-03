# FigCraft export

Rebuilds `D:\Romeo\ClaudeDesign\Mellow.figcraft` from the running app. The file has three pages:

- **Design system**: colour, size and motion variables; text and shadow styles; icons and Mel; components and variants.
- **Screens**: desktop (1440) and phone (375) frames, measured 1:1.
- **Prototype**: desktop frames, wired together.

## Steps

1. Build and serve the app on port 3100:

   ```bash
   npm run build
   ```

   ```bash
   npx next start -p 3100
   ```

2. Capture every screen state. This writes `captures/*.json` and reference screenshots in `shots/`:

   ```bash
   node design/export/capture.mjs
   ```

3. Build the file. This writes `out/Mellow.json`, `out/Mellow.variables.json` and the id map:

   ```bash
   node design/export/build.mjs
   ```

   ```bash
   node design/export/idmap.mjs
   ```

   ```bash
   node design/export/post.mjs
   ```

4. In FigCraft:
   1. Open `out/Mellow.json`.
   2. Run `out/post-commands.json` as one batch. It turns on page scrolling, makes Generate move on by itself and binds size variables.
   3. Save as `Mellow.figcraft`.

## Files

- `spec.mjs`: screen rows, prototype routes, tokens, text styles and the component rules.
- `capture.js` and `capture.mjs`: the page measurement script and the code that clicks into each state.

## Font

Figtree has to be installed for the file to look right: use `design/fonts/Figtree[wght].ttf` (OFL licence).

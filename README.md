# MysteryMind: AI Logic Detective

A rule-based symbolic AI demo (AIES mini project). It uses structural **unification** and **forward chaining** to derive conclusions from facts and rules in fictional detective cases. You can also build your own cases in the Case Builder.

No framework, no server, no API keys. Open `index.html` and it runs.

## Files
- `index.html`: the complete website (everything inlined). This is what you deploy.
- `src/`: the same code split into readable parts (`data.js` cases, `engine.js` unification + inference, `ui1.js` / `ui2.js` interface, `style.css` + `theme.css` look).
- `build.js` / `build.sh`: rebuild `index.html` from `src/` after you edit anything (`node build.js` works on Windows too).
- `package.json`: optional. `npm run build` and `npm start` shortcuts.
- `render.yaml`: optional Render config.

## Open in VS Code
1. Unzip, then in VS Code: **File > Open Folder** and choose the `mysterymind` folder.
2. VS Code will suggest the **Live Server** extension. Install it, then right-click `index.html` > **Open with Live Server**. The site opens in your browser and refreshes when you save.
3. Edit the files in `src/` (cases are in `src/data.js`, the engine in `src/engine.js`). After editing, rebuild the single file with `node build.js` (or `npm run build`, or `sh build.sh`), then refresh the browser.

## Run locally (without VS Code)
Double-click `index.html`, or run `python3 -m http.server 8000` and open http://localhost:8000

## Put it on GitHub
1. Create a new empty repository on github.com (for example `mysterymind`).
2. In this folder run:
   ```
   git init
   git add .
   git commit -m "MysteryMind"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/mysterymind.git
   git push -u origin main
   ```

## Make it live on Render (free static site)
1. Go to render.com, sign in with GitHub.
2. New + > **Static Site** > pick your `mysterymind` repo.
3. Build Command: leave empty (or `echo ok`). Publish Directory: `.`
4. Click **Create Static Site**. In about a minute you get a link like `https://mysterymind.onrender.com`.
5. Every `git push` to `main` redeploys automatically.

## Alternative: GitHub Pages
Repo > Settings > Pages > Deploy from branch > `main` / root. Your site appears at `https://YOUR-USERNAME.github.io/mysterymind/`.

## Notes
- Cases you create in the Case Builder are saved in the visitor's own browser (localStorage), per site address.
- Fonts load from Google Fonts. Offline, it falls back to system fonts.
- All people, places and incidents are fictional. A derived fact never proves real-world guilt.

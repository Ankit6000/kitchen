# TTM Kitchen

This repository contains the source code for TTM Kitchen, an iPhone-friendly Emoji Kitchen style web app.

The app lets people type two emoji, browse mashups in a sticker-style tray, and tap a result to copy or download it quickly.

There are currently over 100,000 possible valid combinations showcasing the unique illustrations and combined emoji!

## Getting Started

This repository leverages [VSCode's devcontainer](https://code.visualstudio.com/docs/remote/containers) feature to ensure all necessary dependencies are available inside the container for development.

### Application

To get started, fetch the supporting metadata into `public/`, then install and start the project:

```bash
npm install
npm run fetch:metadata
npm start
```

The metadata is loaded asynchronously after the app, which keeps the initial JavaScript bundle small and improves startup time.

`npm run build` also auto-fetches metadata if `public/metadata.json` is missing, which keeps Vercel and Netlify deploys simple without committing a 90MB+ data file.

This will start the application on your local machine, running on [http://localhost:5173/](http://localhost:5173).

### Deployments

The app is ready for all three of these deployment paths:

- GitHub Pages: already configured in [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml). The workflow downloads fresh metadata and deploys the Vite `build/` output.
- Vercel: import the repo and deploy. [`vercel.json`](./vercel.json) points Vercel at `npm run build` and `build/`. The `prebuild` hook downloads metadata automatically.
- Netlify: import the repo and deploy. [`netlify.toml`](./netlify.toml) sets the publish directory to `build/` and adds an SPA fallback. The `prebuild` hook downloads metadata automatically.

If you deploy to your own domain, update the social/share metadata in [`index.html`](./index.html) if you want the preview URL tags to point to that final domain.

### App Icon Path

If you want to replace the PWA icon before pushing, put your final icon files here:

- `public/branding/ttm-kitchen-app-icon.png`
- `public/branding/ttm-kitchen-app-icon-192.png`
- `public/branding/ttm-kitchen-app-icon-512.png`

Those paths are already wired into the manifest and iPhone home-screen icon tags.

Additionally, application dependencies are automatically managed and updated via Dependabot and the [`./.github/workflows/automerge-dependabot.yml`](./.github/workflows/automerge-dependabot.yml) workflow.

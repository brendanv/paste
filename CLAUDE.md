# paste.

A semi-private paste service (similar to Pastebin/GitHub Gist) built for self-hosting on Cloudflare Workers with KV storage.

## Tech Stack

- **SvelteKit 2** + **Svelte 5** — UI framework and routing
- **Cloudflare Workers** + **Cloudflare KV** — serverless compute and storage
- **Auth.js** + **Auth0** — authentication
- **Shiki** — syntax highlighting
- **TypeScript** — strict mode throughout
- **Bun** — package manager and runtime

## Commands

```bash
bun install         # Install dependencies
bun run dev         # Start dev server
bun run build       # Build for production
bun run deploy      # Deploy to Cloudflare Workers
bun run preview     # Preview built version locally
bun run check       # Type-check with svelte-check
bun run lint        # Run ESLint + Prettier check
bun run format      # Auto-format with Prettier
bun run cf-typegen  # Regenerate Cloudflare Worker type definitions
```

## Local Setup

1. Copy `.dev.vars.example` to `.dev.vars` and fill in credentials:
   - `AUTH_SECRET` — session signing secret
   - `AUTH_AUTH0_ID` — Auth0 client ID
   - `AUTH_AUTH0_SECRET` — Auth0 client secret
2. Update `wrangler.jsonc` with your Auth0 domain and GitHub repo URL
3. Create a Cloudflare KV namespace: `wrangler kv:namespace create "PASTE_KV"` and update the binding ID in `wrangler.jsonc`
4. Create a Cloudflare R2 bucket: `wrangler r2 bucket create paste-images` (used for image uploads)

## Code Style

- **Formatter**: Prettier — tabs, single quotes, 100-char line width, no trailing commas
- **Linter**: ESLint with TypeScript + Svelte plugins
- Run `bun run format` before committing; `bun run lint` to check

## Project Structure

```
src/
├── lib/
│   ├── components/       # Reusable Svelte components
│   ├── paste.ts          # Core paste creation/storage logic
│   └── index.ts
├── routes/
│   ├── +page.svelte      # Home page (create paste form)
│   ├── api/create/       # JSON API endpoint (POST /api/create)
│   ├── api/upload/       # JSON API endpoint (POST /api/upload) — image uploads
│   ├── api/image/[slug]/ # Image serving endpoint (GET /api/image/[slug])
│   ├── p/[slug]/[[lang]] # Paste display route
│   ├── manage/           # Paste management
│   └── ...
├── auth.ts               # Auth.js + Auth0 configuration
└── hooks.server.ts       # Server hooks
```

## Key Implementation Notes

- Pastes are stored in KV as `paste-{slug}` with optional TTL for expiration
- Slugs are 5 random characters or custom (3–50 chars, alphanumeric + `-_`)
- Visibility options: public, private, logged-in users only
- Syntax highlighting runs client-side via Shiki
- The KV binding is named `PASTE_KV` (configured in `wrangler.jsonc`)

### Image Uploads

- Images are uploaded **API-only** via `POST /api/upload` (multipart/form-data) — no web UI
- Image binary data is stored in Cloudflare R2 as `image-{slug}`; KV stores metadata only (value is `""`)
- KV metadata includes `type: 'image'` and `contentType` fields; text pastes use `type: 'text'`
- Supported MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`
- Maximum image size: 10 MB
- Images are served through the app at `GET /api/image/[slug]` (not via public R2 URLs) so visibility rules are enforced
- The R2 binding is named `PASTE_IMAGES` (configured in `wrangler.jsonc`)
- Deleting a paste also deletes the corresponding R2 object for image pastes

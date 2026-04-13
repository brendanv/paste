<p align="center">
   <img src="src/lib/assets/logo.webp" height="125px">
</p>

# paste.

A semi-private paste service, self-hostable on the free tier of Cloudflare Workers and KV.

## Features

- **Privacy controls** - Straightforward controls for who can view your pastes (public, private, or logged-in users only)
- **Syntax highlighting** - Code formatting for ~all programming languages
- **Expiration options** - Set pastes to expire from 1 hour to 1 year, or keep forever
- **Image uploads** - Store and share images via API (JPEG, PNG, GIF, WebP, SVG — up to 10 MB), served through the app so visibility rules apply
- **API access** - Simple JSON API for creating pastes and uploading images programmatically
- **Serverless** - Built on Cloudflare Workers with KV and R2 storage
- **SSO Authentication** - Integration with Auth0 out of the box, but any providers supported by [Auth.js](https://authjs.dev/) are easy enough to add

## Setup

### Prerequisites

- [Bun](https://bun.sh) runtime
- Cloudflare account with Workers and KV access
- Auth0 account for authentication

### Development

1. Clone the repository:
2. Install dependencies:

   ```bash
   bun install
   ```

3. Create a `.dev.vars` file with your Auth0 credentials. For production you'll need to do this in your Cloudflare dashboard.

   ```
   AUTH_SECRET="your-auth-secret-key-here"
   AUTH_AUTH0_ID=your-auth0-client-id
   AUTH_AUTH0_SECRET=your-auth0-client-secret
   ```

4. Update `wrangler.jsonc` with your Auth0 domain:

   ```json
   "vars": {
     "AUTH_AUTH0_DOMAIN": "https://your-auth0-domain.auth0.com",
     "GITHUB_REPO": "https://github.com/your-username/paste"
   }
   ```

5. Create a KV namespace and update the binding in `wrangler.jsonc`:

   ```bash
   wrangler kv:namespace create "PASTE_KV"
   ```

6. Create an R2 bucket for image storage and update the binding in `wrangler.jsonc`:

   ```bash
   wrangler r2 bucket create paste-images
   ```

7. Start the development server:
   ```bash
   bun run dev
   ```

## API

### Create a text paste

```bash
curl -X POST https://your-domain/api/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"content": "hello world", "visibility": "public"}'
```

### Upload an image

```bash
curl -X POST https://your-domain/api/upload \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@image.png" \
  -F "visibility=public"
```

Images are served at `/api/image/[slug]` and respect visibility settings. The paste page at `/p/[slug]` displays the image inline.

## License

MIT

# Personal Photography Site (Next.js + Cloudinary)

Production-style personal photography site using Next.js App Router + TypeScript + Cloudinary, ready to deploy on Vercel.

## Features

- Public pages:
  - Header with nav (`Gallery`, `About`)
  - `/gallery` responsive thumbnail grid, newest first
  - Client-side tag filtering
  - `/photo/[publicId]` detail page with title, description, date, tags
  - SEO + OpenGraph metadata on photo detail pages
- Admin pages:
  - `/admin` login form (single password)
  - HttpOnly cookie session after login
  - Signed upload flow via `/api/cloudinary/sign`
  - Direct browser-to-Cloudinary upload
  - Metadata stored in Cloudinary `context` + `tags`
- Data layer:
  - Cloudinary folder: `personal-photos`
  - Cloudinary transformations for thumbnails (`w_600`, `q_auto`, `f_auto`)
  - Server-side gallery fetch from Cloudinary Search API
  - Next.js cache revalidate set to 60 seconds

## Tech Stack

- Next.js (App Router)
- TypeScript
- Cloudinary Node SDK
- Zod

## File Structure

```text
app/
  about/page.tsx
  admin/page.tsx
  api/admin/login/route.ts
  api/admin/logout/route.ts
  api/cloudinary/sign/route.ts
  gallery/page.tsx
  photo/[...publicId]/page.tsx
  layout.tsx
  page.tsx
components/
  admin-login-form.tsx
  admin-logout-button.tsx
  admin-upload-form.tsx
  gallery-client.tsx
  header.tsx
lib/
  auth.ts
  cloudinary.ts
  constants.ts
  env.ts
  metadata.ts
  types.ts
middleware.ts
```

## Environment Variables

Create `.env.local`:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ADMIN_PASSWORD=your_strong_password
```

`CLOUDINARY_API_SECRET` remains server-only and is never exposed to the client.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Open:

- `http://localhost:3000/gallery`
- `http://localhost:3000/admin`

## Admin Upload Flow

1. Go to `/admin` and log in with `ADMIN_PASSWORD`.
2. Fill upload form:
   - file
   - title
   - description
   - optional date
   - comma-separated tags
3. Form requests signed params from `/api/cloudinary/sign`.
4. Browser uploads directly to Cloudinary.
5. App redirects to the uploaded photo detail page.

## Vercel Deployment

1. Push repository to GitHub.
2. Import project in Vercel.
3. Add environment variables in Vercel Project Settings:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `ADMIN_PASSWORD`
4. Deploy.

No extra build settings are required (standard Next.js build).

## Security Notes

- Admin session is stored in an HttpOnly cookie.
- `/api/cloudinary/sign` requires a valid admin session cookie.
- Middleware applies auth checks for `/api/cloudinary/sign` and admin sub-routes.
- Sensitive keys are read only on the server.

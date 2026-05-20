# Domain Glossary

This file defines the core concepts in the photography portfolio domain. Use these terms consistently across code, comments, and conversations.

## Photo Management

**Photo** — A single photograph with metadata. Stored in Cloudinary with custom context fields for title, description, camera EXIF, and sort order. Photos belong to zero or more Collections via tags.

**Photo Metadata** — Title, description (bilingual), camera EXIF (camera, lens, aperture, shutter speed, ISO, focal length), taken date, upload date, sort order. Stored in Cloudinary's `context` field as pipe-delimited key=value pairs.

**Public ID** — Cloudinary's unique identifier for a photo resource. Format: `folder/filename` or `filename`. Used in URLs as `/photo/[...publicId]`.

**Photo Normalization** — Converting Cloudinary's raw resource response into the app's `Photo` type. Extracts metadata from context field, parses tags, resolves dates (takenAt → createdAt → uploadedAt fallback).

## Collections

**Collection** — A curated group of photos. Four tagged collections (`travel`, `life`, `architecture`, `street`) are defined in `lib/collections.ts`. Photos belong to collections via Cloudinary tags matching collection slugs. The `all` collection is synthetic (all photos).

**Collection Tag** — A Cloudinary tag that assigns a photo to a collection. Must match a slug from `TAGGED_COLLECTIONS`. Examples: `travel`, `architecture`.

**Featured Photo** — The cover image for a collection on the homepage. Determined by lowest `sortOrder` value among photos in that collection.

**Collection Validation** — Ensuring tags assigned to photos match valid collection slugs. Rejects unknown tags.

## Gallery & Caching

**Gallery Snapshot** — A JSON cache of all photos stored in Vercel Blob (`gallery-snapshot-v1.json`). Primary read path for gallery pages. Avoids rate-limiting Cloudinary Search API on every page load.

**Snapshot Cache** — The system that manages the gallery snapshot. Reads from Blob on query, rebuilds from Cloudinary Search API on mutation.

**Snapshot Rebuild** — Fetching fresh photo data from Cloudinary Search API and writing to Blob. Triggered after any photo mutation (create, update, delete, reorder).

**Photo Mutation** — Any operation that changes photo data: upload, metadata edit, tag change, deletion, sort order update. Triggers snapshot rebuild and path revalidation.

## Ordering & Sorting

**Sort Order** — A numeric field on each photo (`sortOrder`, stored in Cloudinary context). Lower numbers appear first. Used for manual photo ordering via drag-and-drop in `/admin/order`.

**Gallery Sorting** — Photos with explicit `sortOrder` appear first (ascending), then photos without `sortOrder` appear sorted by `takenAt` (descending), falling back to `createdAt` or `uploadedAt`.

**Manual Ordering** — Admin drag-and-drop interface that assigns `sortOrder` values to photos.

## Admin & Mutations

**Admin Session** — HttpOnly cookie-based authentication. Single password (`ADMIN_PASSWORD` env var). Required for all `/admin/*` pages and `/api/cloudinary/*` mutation routes.

**Photo Upload** — Browser direct-uploads to Cloudinary (unsigned), then calls `/api/cloudinary/upload-complete` to save metadata to context and rebuild snapshot.

**Metadata Update** — Editing photo fields via `/admin/edit`. Calls `/api/cloudinary/update` which merges changes into Cloudinary context, rebuilds snapshot, and revalidates paths.

**Batch Update** — Updating multiple photos at once (e.g., `batch-update-sort-order` for drag-and-drop reordering).

## Path Revalidation

**Path Revalidation** — Invalidating Next.js cache for paths affected by a photo mutation. After any mutation, revalidate: affected photo detail page, affected collection pages, homepage, admin pages.

**Revalidation Matrix** — The set of paths that must be revalidated for each mutation type:
- Photo create/update/delete: photo detail path, all collections the photo belongs to, homepage
- Sort order change: all collections, homepage
- Collection tag change: old collections + new collections

## Bilingual Content

**Language** — User's selected language for UI and photo metadata. Default language (stored in env) or English. Managed by `LanguageProvider` (React context + localStorage).

**Bilingual Fallback** — Photos have optional `title_en` and `description_en`. Display logic: if language is English and `title_en` exists, show `title_en`; otherwise show `title`. Encapsulated in `getPhotoTitle()` and `getPhotoDescription()`.

## Technical Integrations

**Cloudinary Client** — SDK wrapper for Cloudinary API. Handles configuration, resource queries, metadata updates, deletions, upload signature generation.

**Vercel Blob** — Storage backend for gallery snapshot cache. Read/write via `@vercel/blob` SDK.

**Context Encoding** — Cloudinary's custom metadata format. Pipe-delimited key=value pairs with escaping for `|` and `=` characters. Example: `title=Sunset|description=Golden hour`.

---

## Anti-Patterns

**Inline Context Parsing** — Don't parse Cloudinary context strings outside `photo-normalization` module. Use `mapResourceToPhoto()`.

**Manual Revalidation** — Don't call `revalidatePath()` directly in routes. Use `revalidateAfterPhotoMutation()` from `lib/revalidation.ts`.

**Duplicate Tag Validation** — Don't implement collection tag validation inline. Use `validateCollectionTags()` from `lib/collections.ts`.

**URL Path Construction** — Don't build `/photo/[publicId]` URLs manually. Use `buildPhotoDetailPath()` from `lib/urls.ts`.

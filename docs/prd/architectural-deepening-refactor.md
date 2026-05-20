# PRD: Architectural Deepening Refactor

## Problem Statement

The photography portfolio codebase has accumulated architectural debt that makes it difficult to understand, test, and maintain. Key friction points:

- **Poor locality**: Understanding one concept requires reading multiple files. The "Cloudinary context encoding" concept spans 4 files. Photo URL encoding is duplicated in 4+ places. Path revalidation logic is scattered across 5 API routes.

- **God module**: `lib/cloudinary.ts` (496 lines) conflates Cloudinary SDK client, photo normalization, snapshot caching, and business logic. Every photo-related concern touches this file, making changes risky and testing difficult.

- **Shallow modules**: Several utility modules provide minimal leverage — their interfaces are nearly as complex as their implementations. `photo-order.ts` wraps 6 lines of sorting. `formatPortfolioDate` is a pass-through function.

- **Untestable code**: The `updatePhotoMetadata` function (81 lines) conflates fetching, merging, and persisting. Cannot test merge semantics without mocking Cloudinary API. Admin components have 18+ useState hooks with manual dirty-checking spanning 25 lines.

- **Duplicated business logic**: Collection tag validation appears inline in 2 routes. Photo URL encoding is reimplemented 4 times with subtle variations.

Developers lose control of the code as these patterns compound. Changes require editing multiple files. Tests can't isolate business logic from I/O. New features carry high cognitive load.

## Solution

Systematically refactor the codebase to create deep, testable modules with clear interfaces. Apply the deletion test and locality principle:

1. **Extract URL builders** to `lib/urls.ts` — concentrate path construction in one module
2. **Extract collection validation** to `lib/collections.ts` — remove duplication from routes
3. **Extract revalidation logic** to `lib/revalidation.ts` — replace scattered `revalidatePath()` calls
4. **Delete shallow modules** — inline pass-throughs that provide no leverage
5. **Extract metadata merging** — make null-handling semantics testable
6. **Split god module** — separate Cloudinary client, photo normalization, and snapshot cache

Establish domain language in `CONTEXT.md` and write unit tests for pure functions.

## User Stories

As a **developer maintaining this codebase**, I want:

1. To understand photo URL construction by reading one function, so that I don't need to search 4+ files for duplicated logic
2. To change URL structure (e.g., adding `/gallery/` prefix) in one place, so that I don't risk inconsistent URLs across routes and components
3. To test URL encoding edge cases (special characters, nested folders) without hitting Next.js APIs, so that I can verify correctness quickly
4. To validate collection tags using a single function from `lib/collections.ts`, so that validation logic stays synchronized across routes
5. To add a new collection and have all validation update automatically, so that I don't need to remember to edit multiple API routes
6. To understand which paths get revalidated after photo mutations by reading one function, so that I don't need to mentally aggregate 5 route files
7. To add a new page that needs revalidation by editing one function, so that I don't need to touch all 5 mutation routes
8. To test revalidation logic (which mutations invalidate which paths) without hitting Next.js cache, so that I can verify the revalidation matrix in milliseconds
9. To see sorting logic inline at call sites when it's only 6 lines, so that I don't need to open a separate file for a simple filter+sort
10. To have fewer files in `lib/` that provide no architectural value, so that I can focus on modules that encapsulate real complexity
11. To understand photo metadata merge semantics (undefined = ignore, null = delete, value = set) from types or tests, so that I don't need to reverse-engineer 81 lines of imperative code
12. To test metadata merging with fixture data in isolation, so that I can verify null-handling without mocking Cloudinary API
13. To change merge semantics in one place, so that admin UI and API routes stay synchronized
14. To find Cloudinary API calls by opening `lib/cloudinary-client.ts`, so that I know exactly where external I/O happens
15. To understand photo normalization (Cloudinary resource → app Photo type) by reading `lib/photo-normalization.ts`, so that I don't need to parse 496 lines
16. To test normalization logic with Cloudinary API fixtures, so that I can verify field extraction without hitting the real API
17. To understand snapshot caching by reading `lib/snapshot-cache.ts`, so that rebuild semantics are isolated from SDK concerns
18. To test snapshot fallback chain (Blob read → rebuild → error recovery) in isolation, so that I can verify cache-miss behavior without controlling Blob storage
19. To import only what I need from specific modules (e.g., `import { mapResourceToPhoto } from 'lib/photo-normalization'`), so that my dependencies are explicit
20. To change snapshot storage backend (Blob → S3) by editing one module, so that the seam between caching and SDK is clear
21. To reference domain concepts using consistent vocabulary from `CONTEXT.md`, so that code, comments, and conversations use the same language
22. To understand what "Photo Mutation", "Snapshot Rebuild", "Collection Validation" mean without asking, so that I can navigate the codebase independently
23. To see architectural anti-patterns documented in `CONTEXT.md`, so that I don't reintroduce scattered logic
24. To run unit tests for URL builders in <50ms, so that I can verify correctness without slow integration tests
25. To run unit tests for tag validation that check allowed tags, deduplication, and normalization, so that collection rules are regression-proof
26. To run unit tests for metadata merging that verify every null-handling case, so that merge semantics are documented in executable form
27. To see test coverage for pure functions (URL builders, tag validation, revalidation logic, metadata merging, photo normalization), so that I can refactor confidently
28. To have consistent import paths after refactoring (`lib/cloudinary-client`, `lib/photo-normalization`, `lib/snapshot-cache`), so that the codebase structure is predictable

As a **new developer onboarding to this project**, I want:

29. To read `CONTEXT.md` and understand domain concepts before diving into code, so that I have a mental model of Photo, Collection, Snapshot Cache, Photo Mutation
30. To see module names that match domain concepts (e.g., `photo-normalization.ts` not `utils.ts`), so that I can guess where functionality lives
31. To open a module and find focused, cohesive code (not 496-line god modules), so that I can understand one concern at a time
32. To see tests that demonstrate how modules are used, so that I can learn interfaces by example

As a **developer adding new features**, I want:

33. To add a "photos by year" page and have it auto-revalidate after mutations by editing `revalidateAfterPhotoMutation()`, so that I don't need to touch all API routes
34. To add a new photo field (e.g., `location`) by editing `mergePhotoMetadata()` and its tests, so that merge semantics are centralized
35. To add a new collection and have tag validation work automatically, so that I don't need to edit inline validation in routes
36. To build URLs for new page types using `lib/urls.ts` utilities, so that encoding stays consistent

As a **developer debugging production issues**, I want:

37. To trace "which paths were revalidated after this mutation" by reading one function, so that I can diagnose stale cache issues quickly
38. To verify "is this tag valid for collections" by checking `validateCollectionTags()`, so that I don't need to mentally simulate inline validation
39. To understand "how was this Photo normalized from Cloudinary" by reading `photo-normalization.ts`, so that I can debug field mapping issues
40. To see test failures that pinpoint broken merge semantics, so that I catch bugs before they reach production

## Implementation Decisions

### Module Architecture

Split `lib/cloudinary.ts` (496 lines) into three focused modules with clear seams:

**`lib/cloudinary-client.ts`**: Pure Cloudinary SDK adapter
- Configuration (SDK setup, env vars)
- Query functions (Search API, resource fetching)
- Mutation operations (update, delete, batch updates)
- Upload signature generation
- Error detection utilities (`isCloudinaryRateLimitError`)
- Image URL building (`buildCloudinaryUrl`)

**`lib/photo-normalization.ts`**: Resource-to-Photo mapping
- Context parsing (`parseCloudinaryContext`) — handles both pipe-delimited and object formats
- Resource-to-Photo transformation (`mapResourceToPhoto`)
- EXIF normalization (`normalizeAperture`, `normalizeFocalLength`, etc.)
- Date resolution (takenAt → createdAt → uploadedAt fallback)
- Photo metadata merge semantics (`mergePhotoMetadata`)

**`lib/snapshot-cache.ts`**: Blob-backed query acceleration
- Snapshot read with Blob (`readGallerySnapshot`)
- Snapshot rebuild orchestration (`rebuildGallerySnapshot`)
- Fallback chain (Blob read → rebuild from Cloudinary → direct query on error)
- Public query interface (`queryGalleryPhotos`)

### New Modules

**`lib/urls.ts`**: URL path construction
```typescript
export function buildPhotoDetailPath(publicId: string): string {
  return `/photo/${publicId
    .split("/")
    .map(segment => encodeURIComponent(segment))
    .join("/")}`;
}

export function buildCollectionPath(slug: string): string {
  return `/collections/${slug}`;
}

export function buildAboutPath(lang?: string): string {
  return lang === "en" ? "/about" : "/about";
}
```

**`lib/revalidation.ts`**: Path invalidation after mutations
```typescript
export function revalidateAfterPhotoMutation(options: {
  publicId?: string;
  collectionsAffected?: string[];
  mutationType: 'create' | 'update' | 'delete' | 'reorder';
}): void {
  // Revalidate homepage (always)
  revalidatePath("/");
  
  // Revalidate photo detail page (if provided)
  if (options.publicId) {
    revalidatePath(buildPhotoDetailPath(options.publicId));
  }
  
  // Revalidate collections (if provided, else all)
  const collections = options.collectionsAffected || TAGGED_COLLECTIONS.map(c => c.slug);
  for (const slug of collections) {
    revalidatePath(buildCollectionPath(slug));
  }
  
  // Revalidate admin pages
  revalidatePath("/admin/edit");
  revalidatePath("/admin/featured");
}
```

**Extracted to `lib/collections.ts`**: Collection tag validation
```typescript
export function validateCollectionTags(tags: string[]): string[] {
  const allowedTags = new Set(TAGGED_COLLECTIONS.map(c => c.slug));
  return tags
    .map(tag => tag.trim().toLowerCase())
    .filter((tag, index, arr) => 
      tag && 
      allowedTags.has(tag as CollectionSlug) && 
      arr.indexOf(tag) === index // deduplicate
    );
}
```

**Extracted in `lib/photo-normalization.ts`**: Metadata merging
```typescript
/**
 * Merge photo metadata with explicit null-handling:
 * - undefined = don't change existing value
 * - null = delete field (set to null in Cloudinary context)
 * - value = set to value
 */
export function mergePhotoMetadata(
  existing: Partial<PhotoMetadata>,
  updates: Partial<PhotoMetadata>
): PhotoMetadata {
  // Returns merged metadata with all null semantics explicit
}
```

### Deleted Shallow Modules

**`lib/photo-order.ts`**: Inline at call sites (3-4 uses)
- The sorting logic is 6 lines: filter photos with sortOrder, sort ascending, concat photos without sortOrder sorted by date descending
- No leverage — interface complexity equals implementation complexity
- Deletion test: inlining concentrates logic at call sites without scattering complexity

**`lib/metadata.ts` `formatPortfolioDate`**: Remove or inline
- Pass-through to `formatPhotoDate` with hardcoded locale
- No leverage

**`lib/timeline.ts`**: Check usage, delete if unused
- 44 lines of year-grouping utilities
- Exploration found no active usage in components

Keep `lib/photo-text.ts` `getPhotoTitle` and `getPhotoDescription` — these provide real leverage via bilingual fallback logic (10+ call sites).

### API Route Updates

All mutation routes (`update`, `delete`, `upload-complete`, `batch-update-sort-order`, `bulk-classify`) will:
1. Import `revalidateAfterPhotoMutation` instead of calling `revalidatePath` 7 times
2. Import `validateCollectionTags` from `lib/collections.ts` instead of inline validation
3. Import `buildPhotoDetailPath` from `lib/urls.ts` instead of defining `toPhotoPath`
4. Import from split modules (`cloudinary-client`, `photo-normalization`, `snapshot-cache`) instead of monolithic `cloudinary.ts`

### Domain Language

`CONTEXT.md` defines:
- Core domain concepts (Photo, Collection, Photo Mutation, Snapshot Cache, etc.)
- Anti-patterns to avoid (inline context parsing, manual revalidation, duplicate tag validation, manual URL construction)
- Consistent vocabulary for code, comments, conversations

### Refactoring Sequence

1. **URLs** (safest, no logic changes) → `lib/urls.ts`
2. **Collection tags** (small, clear win) → `validateCollectionTags()` in `lib/collections.ts`
3. **Revalidation** (high impact, touches all routes) → `lib/revalidation.ts`
4. **Delete shallow modules** (cleanup, reduces noise)
5. **Metadata merging** (sets up god module split) → `mergePhotoMetadata()` in `lib/photo-normalization.ts`
6. **Split god module** (biggest change) → `cloudinary-client.ts`, `photo-normalization.ts`, `snapshot-cache.ts`

Each step is independently valuable. Phased approach allows verification between refactors.

## Testing Decisions

### What Makes a Good Test

- Test external behavior (interface), not implementation details
- Pure functions testable with fixtures (no mocks)
- One assertion per logical behavior, not per line of code
- Fast (<50ms per test suite) — no real I/O in unit tests

### Modules to Test

**`lib/urls.ts`** (unit tests):
- `buildPhotoDetailPath()` with simple publicId (`"sunset"` → `"/photo/sunset"`)
- `buildPhotoDetailPath()` with nested publicId (`"travel/paris"` → `"/photo/travel/paris"`)
- `buildPhotoDetailPath()` with special characters (`"my photo!"` → `"/photo/my%20photo%21"`)
- `buildCollectionPath()` with all collection slugs

**`lib/collections.ts` `validateCollectionTags()`** (unit tests):
- Filters unknown tags (`["travel", "unknown"]` → `["travel"]`)
- Normalizes case (`["Travel"]` → `["travel"]`)
- Trims whitespace (`[" travel "]` → `["travel"]`)
- Deduplicates (`["travel", "travel"]` → `["travel"]`)
- Handles empty strings (`["", "travel"]` → `["travel"]`)

**`lib/revalidation.ts`** (unit tests with mocks):
- Mock `revalidatePath` to capture calls
- Verify `mutationType: 'create'` revalidates homepage + all collections + admin pages
- Verify `publicId` provided revalidates photo detail page
- Verify `collectionsAffected: ['travel']` only revalidates travel collection (not all)
- Verify revalidation matrix matches documented behavior

**`lib/photo-normalization.ts` `mergePhotoMetadata()`** (unit tests):
- `updates.title = "New"` replaces existing title
- `updates.title = null` deletes title (sets to null)
- `updates.title = undefined` preserves existing title
- Verify all 18 fields respect null semantics
- Edge case: empty string `""` is treated as truthy value (not null)

**`lib/photo-normalization.ts` `mapResourceToPhoto()`** (unit tests with fixtures):
- Mock Cloudinary API response with full context fields
- Verify all metadata extracted correctly
- Verify date fallback (takenAt → createdAt → uploadedAt)
- Verify EXIF normalization (aperture, focal length)
- Verify tag parsing (string → array, normalization)

**`lib/snapshot-cache.ts`** (integration tests or skip):
- Fallback chain hard to test without controlling Blob storage
- May skip unit tests, rely on manual verification in dev server
- Or: mock Blob `get` / `put` and verify fallback logic

### Prior Art

This codebase has no existing tests. Tests will be written using:
- **Vitest** (or Jest) for test runner
- **Testing conventions**: One file per module (`urls.test.ts`, `collections.test.ts`, etc.)
- **Fixture pattern**: For `mapResourceToPhoto()`, create `fixtures/cloudinary-resource.json` with sample API responses

### What NOT to Test

- Next.js framework behavior (revalidatePath, Image component)
- Cloudinary SDK (assumes it works correctly)
- React component rendering (focus on logic, not UI)
- API routes (tested manually in dev server)

## Out of Scope

**Not changing behavior**: Refactoring preserves all existing functionality. No new features, no UI changes, no schema changes.

**Not testing everything**: Focus on pure functions (URL builders, tag validation, metadata merging, photo normalization). Skip integration tests for snapshot cache unless easy to mock.

**Not optimizing performance**: Goal is maintainability (locality, testability), not faster execution.

**Not documenting every function**: `CONTEXT.md` defines domain concepts. Module interfaces documented via JSDoc where semantics are non-obvious (e.g., null-handling in `mergePhotoMetadata`). Code should be self-explanatory otherwise.

**Not creating ADRs yet**: If refactoring surfaces architectural decisions worth recording (e.g., "why separate snapshot cache from client?"), consider ADRs later. For now, focus on execution.

**Not refactoring admin components**: `admin-edit-photos.tsx` (566 lines, 18+ useState hooks) has poor locality, but that's a separate effort. This PRD focuses on lib/ modules.

**Not adding TypeScript strict mode**: Codebase may have type issues, but fixing them is orthogonal to architectural refactoring.

**Not changing Cloudinary context encoding**: The pipe-delimited format is established. Refactoring normalizes how it's accessed (via `photo-normalization.ts`), not the format itself.

## Further Notes

**Breaking Changes**: All imports from `lib/cloudinary.ts` will change. This touches ~10-15 files (API routes, components, admin pages). Acceptable because import updates are mechanical and caught by TypeScript.

**Risk Mitigation**: Phased approach allows verification between refactors. Run dev server, test admin upload/edit/delete/reorder after each phase.

**Future Work**: After refactoring, consider:
- Testing admin component logic (extract business logic from 566-line component)
- ADRs for architectural decisions (why Blob caching, why single Cloudinary backend, etc.)
- Stricter TypeScript (enable `strict` mode, fix type issues)
- Performance profiling (is snapshot cache actually helping?)

**Success Metrics**:
- `lib/cloudinary.ts` no longer exists (split into 3 focused modules)
- Zero duplicated `toPhotoPath` / `toPhotoHref` implementations
- Zero inline `revalidatePath()` calls in routes (all via `revalidateAfterPhotoMutation`)
- Zero inline collection tag validation (all via `validateCollectionTags`)
- Unit tests cover URL builders, tag validation, revalidation logic, metadata merging, photo normalization
- `CONTEXT.md` provides domain glossary for future developers

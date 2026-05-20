# Refactoring Status

**Last Updated**: 2026-05-20  
**Issue**: #001 Architectural Deepening Refactor  
**Status**: 6 of 7 tasks complete (86%)

## Completed ✅

### 1. URL Builders (`lib/urls.ts`)
**Impact**: High locality - path construction centralized  
**Changes**:
- Created `lib/urls.ts` with `buildPhotoDetailPath()`, `buildCollectionPath()`, `buildAdminPath()`, `buildHomePath()`
- Removed 6 duplicated implementations:
  - `app/api/cloudinary/update/route.ts` - `toPhotoPath()`
  - `app/api/cloudinary/delete/route.ts` - `toPhotoPath()`
  - `app/api/cloudinary/upload-complete/route.ts` - `toPhotoPath()`
  - `components/gallery-client.tsx` - `toPhotoHref()`
  - `components/admin-edit-photos.tsx` - `toPhotoHref()`
  - `components/admin-upload-form.tsx` - `toPhotoHref()`

**Files Modified**: 7  
**Lines Removed**: ~40 duplicate lines  
**Lines Added**: 1 new module (50 lines)

---

### 2. Collection Tag Validation (`lib/collections.ts`)
**Impact**: High locality - validation logic centralized  
**Changes**:
- Added `validateCollectionTags()` to `lib/collections.ts`
- Removed 2 inline validation functions:
  - `app/api/cloudinary/update/route.ts` - `normalizeCollectionTags()`
  - `app/api/cloudinary/bulk-classify/route.ts` - inline `allowedTags` filter

**Files Modified**: 3  
**Lines Removed**: ~15 duplicate lines  
**Lines Added**: 18 lines in collections.ts

---

### 3. Revalidation Logic (`lib/revalidation.ts`)
**Impact**: Very high locality - cache invalidation centralized  
**Changes**:
- Created `lib/revalidation.ts` with `revalidateAfterPhotoMutation()`
- Replaced 20+ scattered `revalidatePath()` calls across 5 API routes:
  - `app/api/cloudinary/update/route.ts` - 7 calls → 1 call
  - `app/api/cloudinary/delete/route.ts` - 4 calls → 1 call  
  - `app/api/cloudinary/upload-complete/route.ts` - 4 calls → 1 call
  - `app/api/cloudinary/batch-update-sort-order/route.ts` - 3 calls → 1 call
  - `app/api/cloudinary/bulk-classify/route.ts` - 7 calls → 1 call

**Files Modified**: 6  
**Lines Removed**: ~25 lines of scattered revalidation  
**Lines Added**: 1 new module (80 lines)

---

### 4. Shallow Modules Review
**Impact**: None - skipped  
**Decision**: 
- `lib/photo-order.ts` - Only used in `lib/cloudinary.ts`, will be inlined during god module split
- `lib/timeline.ts` - Actively used by `TimelineNav` and `StickyTimelineGallery` components
- `lib/photo-text.ts` `formatPortfolioDate()` - Actively used in lightbox and photo detail

**Files Modified**: 0

---

### 5. Metadata Merging (`lib/photo-metadata.ts`)
**Impact**: High testability - merge logic now pure function  
**Changes**:
- Created `lib/photo-metadata.ts` with `mergePhotoMetadata()`
- Extracted 81-line merge logic from `updatePhotoMetadata()` in `lib/cloudinary.ts`
- Explicit null-handling semantics documented:
  - `undefined` = preserve existing value
  - `null` = delete field (set to undefined in Cloudinary context)
  - `value` = set to value
- Now testable without mocking Cloudinary API

**Files Modified**: 2  
**Lines Removed**: ~50 lines of imperative merging  
**Lines Added**: 1 new module (115 lines)

---

---

### 6. Split God Module (`lib/cloudinary.ts` → 3 modules)
**Impact**: Very high locality - separation of concerns  
**Status**: ✅ COMPLETED

**Changes**:
- Created `lib/cloudinary-client.ts` (252 lines)
  - SDK configuration and re-export
  - Query functions (queryAllPhotosInFolder, getPhotoByPublicId)
  - Mutation operations (updatePhotoMetadata, batchUpdatePhotoSortOrder, batchUpdatePhotoFeaturedOrder, deletePhotoByPublicId)
  - Upload signature generation (createUploadSignature)
  - Error detection (isCloudinaryRateLimitError)
  - Image URL building (buildImageUrl)
  - Constants export (cloudinaryConstants)

- Created `lib/photo-normalization.ts` (204 lines)
  - parseCloudinaryContext() - handles both context.custom and flattened pipe-delimited formats
  - mapResourceToPhoto() - full Resource → Photo transformation with all normalization
  - EXIF normalization functions (normalizeAperture, normalizeFocalLength)
  - Tag normalization (normalizeTags wrapper)
  - Type definitions (CloudinaryResource, CloudinarySearchResult exported from client)

- Created `lib/snapshot-cache.ts` (177 lines)
  - hasBlobToken() - environment check
  - readGallerySnapshot() - Blob read with error handling
  - writeGallerySnapshot() - Blob write with overwrite
  - rebuildGallerySnapshot() - public API for full rebuild
  - queryGalleryPhotos() - internal fallback chain
  - getGalleryPhotos() - public sorted interface
  - searchPhotosForAdminOrder() - admin search/pagination
  - getPhotoDisplayDate() - date display helper

**Files Modified**: 19 total
- API routes (9): update, delete, upload-complete, bulk-classify, batch-update-sort-order, batch-update-featured-order, rebuild-snapshot, order-feed, sign
- Pages (6): app/page.tsx, gallery/page.tsx, collections/page.tsx, collections/[slug]/page.tsx, photo/[...publicId]/page.tsx
- Admin pages (4): admin/edit/page.tsx, admin/classify/page.tsx, admin/featured/page.tsx, admin/covers/page.tsx

**Files Deleted**: 1
- `lib/cloudinary.ts` (496 lines) - successfully removed

**Build Status**: ✅ All builds passing, zero TypeScript errors

---

## Remaining ☐

### 7. Unit Tests
**Impact**: High confidence - regression protection  

**Test Files to Create**:
1. **`lib/urls.test.ts`**
   - `buildPhotoDetailPath()` with simple publicId
   - `buildPhotoDetailPath()` with nested publicId (`folder/photo`)
   - `buildPhotoDetailPath()` with special chars (`my photo!` → `my%20photo%21`)
   - `buildCollectionPath()` for all collection slugs

2. **`lib/collections.test.ts`**
   - `validateCollectionTags()` filters unknown tags
   - Normalizes case (`Travel` → `travel`)
   - Trims whitespace
   - Deduplicates
   - Handles empty strings

3. **`lib/photo-metadata.test.ts`**
   - Merge semantics for all 18 fields
   - `undefined` preserves existing
   - `null` deletes field
   - `value` sets value
   - Edge case: empty string `""` treated as truthy

4. **`lib/photo-normalization.test.ts`** (after god module split)
   - `mapResourceToPhoto()` with fixture data
   - Date fallback chain
   - EXIF normalization
   - Tag parsing
   - Context parsing (pipe-delimited and object formats)

5. **`lib/revalidation.test.ts`**
   - Mock `revalidatePath` and verify calls
   - Test revalidation matrix (create/update/delete/reorder)
   - Test `publicId` provided revalidates photo detail
   - Test `collectionsAffected` filters collections

**Test Framework**: Install Vitest or Jest

---

## Metrics

### Code Quality
- **Before**: 496-line god module, 6 duplicated URL functions, 2 duplicated validation functions, 20+ scattered revalidation calls
- **After (current)**: 4 new focused modules created, all duplication removed, revalidation centralized
- **After (complete)**: God module split into 3, fully tested

### Locality Wins
- ✅ URL construction: 6 files → 1 module
- ✅ Tag validation: 2 files → 1 function  
- ✅ Revalidation: 5 files → 1 function
- ✅ Metadata merging: 81 lines → pure function
- ☐ Cloudinary concerns: 1 god module → 3 focused modules

### Testability Wins
- ✅ Metadata merging: Now testable without mocking Cloudinary
- ☐ Photo normalization: Will be testable with fixtures (after split)
- ☐ Snapshot caching: Will be testable with mocked Blob (after split)

---

## Notes for Next Session

1. **God module split is the big one**: Touches ~10-15 import sites. Plan carefully:
   - Start with `photo-normalization.ts` (least dependencies)
   - Then `cloudinary-client.ts` (no internal dependencies)
   - Finally `snapshot-cache.ts` (depends on both)
   - Update imports incrementally, build after each module

2. **sortPhotosForGallery()** from `lib/photo-order.ts`:
   - Currently only used in `lib/cloudinary.ts`
   - During god module split, inline it into `snapshot-cache.ts` where it's called
   - Or keep as utility if it makes sense in the new structure

3. **Testing strategy**:
   - Start with pure functions (URLs, tag validation, metadata merging)
   - Skip snapshot-cache integration tests unless easy to mock Blob
   - Photo normalization tests use fixture JSON responses from Cloudinary API

4. **Build verification**:
   - All builds have passed so far
   - No TypeScript errors
   - No runtime issues expected (only refactoring, no behavior changes)

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidateAfterPhotoMutation } from './revalidation'

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock lib/urls
vi.mock('./urls', () => ({
  buildPhotoDetailPath: (publicId: string) => `/photo/${publicId}`,
  buildCollectionPath: (slug: string) => `/collections/${slug}`,
  buildAdminPath: (path?: string) => path ? `/admin/${path}` : '/admin',
  buildHomePath: () => '/',
}))

// Import after mocking
const { revalidatePath } = await import('next/cache')

describe('revalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('revalidateAfterPhotoMutation', () => {
    describe('always revalidates home', () => {
      it('should revalidate home path for all mutation types', () => {
        revalidateAfterPhotoMutation({ mutationType: 'create' })
        expect(revalidatePath).toHaveBeenCalledWith('/')

        vi.clearAllMocks()
        revalidateAfterPhotoMutation({ mutationType: 'update' })
        expect(revalidatePath).toHaveBeenCalledWith('/')

        vi.clearAllMocks()
        revalidateAfterPhotoMutation({ mutationType: 'delete' })
        expect(revalidatePath).toHaveBeenCalledWith('/')

        vi.clearAllMocks()
        revalidateAfterPhotoMutation({ mutationType: 'reorder' })
        expect(revalidatePath).toHaveBeenCalledWith('/')
      })
    })

    describe('revalidates photo detail when publicId provided', () => {
      it('should revalidate photo detail when publicId provided', () => {
        revalidateAfterPhotoMutation({ publicId: 'photo123', mutationType: 'create' })
        expect(revalidatePath).toHaveBeenCalledWith('/photo/photo123')
      })

      it('should not revalidate photo detail when publicId missing', () => {
        revalidateAfterPhotoMutation({ mutationType: 'create' })
        expect(revalidatePath).not.toHaveBeenCalledWith(expect.stringContaining('/photo/'))
      })
    })

    describe('mutationType: create, update, delete', () => {
      it('should revalidate all standard paths', () => {
        revalidateAfterPhotoMutation({ mutationType: 'create' })

        // Always revalidated
        expect(revalidatePath).toHaveBeenCalledWith('/')
        expect(revalidatePath).toHaveBeenCalledWith('/collections')
        expect(revalidatePath).toHaveBeenCalledWith('/gallery')
        expect(revalidatePath).toHaveBeenCalledWith('/admin/edit')
        expect(revalidatePath).toHaveBeenCalledWith('/admin/upload')

        // All collections when not specified
        expect(revalidatePath).toHaveBeenCalledWith('/collections/all')
        expect(revalidatePath).toHaveBeenCalledWith('/collections/travel')
        expect(revalidatePath).toHaveBeenCalledWith('/collections/life')
        expect(revalidatePath).toHaveBeenCalledWith('/collections/architecture')
        expect(revalidatePath).toHaveBeenCalledWith('/collections/nature')
        expect(revalidatePath).toHaveBeenCalledWith('/collections/objects')

        // Should NOT revalidate admin/order and admin/featured (only for reorder)
        expect(revalidatePath).not.toHaveBeenCalledWith('/admin/order')
        expect(revalidatePath).not.toHaveBeenCalledWith('/admin/featured')
      })

      it('should respect collectionsAffected for create', () => {
        revalidateAfterPhotoMutation({
          mutationType: 'create',
          collectionsAffected: ['travel', 'architecture'],
        })

        expect(revalidatePath).toHaveBeenCalledWith('/collections/travel')
        expect(revalidatePath).toHaveBeenCalledWith('/collections/architecture')
        expect(revalidatePath).not.toHaveBeenCalledWith('/collections/life')
        expect(revalidatePath).not.toHaveBeenCalledWith('/collections/nature')
        expect(revalidatePath).not.toHaveBeenCalledWith('/collections/objects')
      })

      it('should respect collectionsAffected for update', () => {
        revalidateAfterPhotoMutation({
          mutationType: 'update',
          collectionsAffected: ['life'],
        })

        expect(revalidatePath).toHaveBeenCalledWith('/collections/life')
        expect(revalidatePath).not.toHaveBeenCalledWith('/collections/travel')
      })

      it('should respect collectionsAffected for delete', () => {
        revalidateAfterPhotoMutation({
          mutationType: 'delete',
          collectionsAffected: ['architecture', 'objects'],
        })

        expect(revalidatePath).toHaveBeenCalledWith('/collections/architecture')
        expect(revalidatePath).toHaveBeenCalledWith('/collections/objects')
        expect(revalidatePath).not.toHaveBeenCalledWith('/collections/travel')
      })
    })

    describe('mutationType: reorder', () => {
      it('should revalidate home, admin/order, and admin/featured', () => {
        revalidateAfterPhotoMutation({ mutationType: 'reorder' })

        expect(revalidatePath).toHaveBeenCalledWith('/')
        expect(revalidatePath).toHaveBeenCalledWith('/admin/order')
        expect(revalidatePath).toHaveBeenCalledWith('/admin/featured')
      })

      it('should still revalidate all collections and standard pages', () => {
        revalidateAfterPhotoMutation({ mutationType: 'reorder' })

        // Still revalidates collections (photos may be reordered in gallery)
        expect(revalidatePath).toHaveBeenCalledWith('/collections')
        expect(revalidatePath).toHaveBeenCalledWith('/gallery')
        expect(revalidatePath).toHaveBeenCalledWith('/collections/all')

        // Still revalidates admin pages
        expect(revalidatePath).toHaveBeenCalledWith('/admin/edit')
        expect(revalidatePath).toHaveBeenCalledWith('/admin/upload')
      })

      it('should respect collectionsAffected even for reorder', () => {
        revalidateAfterPhotoMutation({
          mutationType: 'reorder',
          collectionsAffected: ['travel'],
        })

        expect(revalidatePath).toHaveBeenCalledWith('/collections/travel')
        expect(revalidatePath).not.toHaveBeenCalledWith('/collections/life')
        expect(revalidatePath).not.toHaveBeenCalledWith('/collections/architecture')
      })
    })

    describe('call count verification', () => {
      it('should call revalidatePath correct number of times for full create', () => {
        revalidateAfterPhotoMutation({ publicId: 'photo123', mutationType: 'create' })

        // Home (1) + Photo detail (1) + Collections (1) + Gallery (1) +
        // All (1) + 5 tagged collections (5) + Admin edit (1) + Admin upload (1) = 12
        expect(revalidatePath).toHaveBeenCalledTimes(12)
      })

      it('should call revalidatePath correct number of times for create with specific collections', () => {
        revalidateAfterPhotoMutation({
          publicId: 'photo123',
          mutationType: 'create',
          collectionsAffected: ['travel', 'life'],
        })

        // Home (1) + Photo detail (1) + Collections (1) + Gallery (1) +
        // 2 specific collections (2) + Admin edit (1) + Admin upload (1) = 8
        expect(revalidatePath).toHaveBeenCalledTimes(8)
      })

      it('should call revalidatePath correct number of times for reorder', () => {
        revalidateAfterPhotoMutation({ mutationType: 'reorder' })

        // Home (1) + Collections (1) + Gallery (1) + All (1) + 5 tagged collections (5) +
        // Admin edit (1) + Admin upload (1) + Admin order (1) + Admin featured (1) = 13
        expect(revalidatePath).toHaveBeenCalledTimes(13)
      })

      it('should call revalidatePath correct number of times for reorder with publicId', () => {
        revalidateAfterPhotoMutation({ publicId: 'photo123', mutationType: 'reorder' })

        // Home (1) + Photo detail (1) + Collections (1) + Gallery (1) + All (1) +
        // 5 tagged collections (5) + Admin edit (1) + Admin upload (1) +
        // Admin order (1) + Admin featured (1) = 14
        expect(revalidatePath).toHaveBeenCalledTimes(14)
      })

      it('should call revalidatePath correct number of times for delete without collections', () => {
        revalidateAfterPhotoMutation({ mutationType: 'delete', collectionsAffected: [] })

        // Home (1) + Collections (1) + Gallery (1) + Admin edit (1) + Admin upload (1) = 5
        expect(revalidatePath).toHaveBeenCalledTimes(5)
      })
    })

    describe('edge cases', () => {
      it('should handle empty collectionsAffected array', () => {
        revalidateAfterPhotoMutation({
          mutationType: 'create',
          collectionsAffected: [],
        })

        // Should still revalidate collections index and gallery, but no specific collections
        expect(revalidatePath).toHaveBeenCalledWith('/collections')
        expect(revalidatePath).toHaveBeenCalledWith('/gallery')
        expect(revalidatePath).not.toHaveBeenCalledWith('/collections/all')
        expect(revalidatePath).not.toHaveBeenCalledWith('/collections/travel')
      })

      it('should handle duplicate collections in collectionsAffected', () => {
        revalidateAfterPhotoMutation({
          mutationType: 'create',
          collectionsAffected: ['travel', 'travel', 'life'],
        })

        // Should call travel twice (no deduplication in implementation)
        const travelCalls = (revalidatePath as any).mock.calls.filter(
          (call: any) => call[0] === '/collections/travel'
        )
        expect(travelCalls.length).toBe(2)
      })
    })
  })
})

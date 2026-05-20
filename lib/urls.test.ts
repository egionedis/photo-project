import { describe, it, expect } from 'vitest'
import {
  buildPhotoDetailPath,
  buildCollectionPath,
  buildAdminPath,
  buildHomePath,
} from './urls'

describe('urls', () => {
  describe('buildPhotoDetailPath', () => {
    it('should build path for simple publicId', () => {
      expect(buildPhotoDetailPath('photo123')).toBe('/photo/photo123')
    })

    it('should build path for nested publicId', () => {
      expect(buildPhotoDetailPath('folder/photo')).toBe('/photo/folder/photo')
    })

    it('should encode spaces', () => {
      expect(buildPhotoDetailPath('my photo')).toBe('/photo/my%20photo')
    })

    it('should encode multiple special characters', () => {
      expect(buildPhotoDetailPath('photo @#$%')).toBe('/photo/photo%20%40%23%24%25')
    })

    it('should handle nested path with special characters', () => {
      expect(buildPhotoDetailPath('folder name/photo title')).toBe('/photo/folder%20name/photo%20title')
    })

    it('should encode each segment separately', () => {
      expect(buildPhotoDetailPath('folder/sub folder/my photo.jpg')).toBe(
        '/photo/folder/sub%20folder/my%20photo.jpg'
      )
    })

    it('should handle publicId with only slashes', () => {
      expect(buildPhotoDetailPath('a/b/c')).toBe('/photo/a/b/c')
    })

    it('should not encode characters that are valid in URLs', () => {
      // encodeURIComponent doesn't encode: - _ . ! ~ * ' ( )
      // But we're OK with that for publicIds
      expect(buildPhotoDetailPath('my-photo_2024.jpg')).toBe('/photo/my-photo_2024.jpg')
    })
  })

  describe('buildCollectionPath', () => {
    it('should build path for "all" collection', () => {
      expect(buildCollectionPath('all')).toBe('/collections/all')
    })

    it('should build path for "travel" collection', () => {
      expect(buildCollectionPath('travel')).toBe('/collections/travel')
    })

    it('should build path for "life" collection', () => {
      expect(buildCollectionPath('life')).toBe('/collections/life')
    })

    it('should build path for "architecture" collection', () => {
      expect(buildCollectionPath('architecture')).toBe('/collections/architecture')
    })

    it('should build path for "nature" collection', () => {
      expect(buildCollectionPath('nature')).toBe('/collections/nature')
    })

    it('should build path for "objects" collection', () => {
      expect(buildCollectionPath('objects')).toBe('/collections/objects')
    })
  })

  describe('buildAdminPath', () => {
    it('should build admin root path', () => {
      expect(buildAdminPath()).toBe('/admin')
    })

    it('should build admin edit path', () => {
      expect(buildAdminPath('edit')).toBe('/admin/edit')
    })

    it('should build admin order path', () => {
      expect(buildAdminPath('order')).toBe('/admin/order')
    })

    it('should build admin upload path', () => {
      expect(buildAdminPath('upload')).toBe('/admin/upload')
    })

    it('should build admin classify path', () => {
      expect(buildAdminPath('classify')).toBe('/admin/classify')
    })

    it('should build admin featured path', () => {
      expect(buildAdminPath('featured')).toBe('/admin/featured')
    })

    it('should build admin covers path', () => {
      expect(buildAdminPath('covers')).toBe('/admin/covers')
    })
  })

  describe('buildHomePath', () => {
    it('should build home path', () => {
      expect(buildHomePath()).toBe('/')
    })
  })
})

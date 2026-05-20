import { describe, it, expect, vi } from 'vitest'

// Mock cloudinary-client to avoid env var requirements
vi.mock('./cloudinary-client', () => ({
  cloudinary: {
    url: vi.fn((publicId: string) => `https://mocked.cloudinary.com/${publicId}`),
  },
}))

import {
  parseCloudinaryContext,
  normalizeAperture,
  normalizeFocalLength,
  mapResourceToPhoto,
  type CloudinaryResource,
} from './photo-normalization'

describe('photo-normalization', () => {
  describe('parseCloudinaryContext', () => {
    it('should parse context.custom format', () => {
      const resource: CloudinaryResource = {
        public_id: 'test/photo',
        secure_url: 'https://example.com/image.jpg',
        context: {
          custom: {
            title: 'Test Photo',
            description: 'Test Description',
            taken_at: '2024-01-01',
          },
        },
      }
      const result = parseCloudinaryContext(resource)
      expect(result).toEqual({
        title: 'Test Photo',
        description: 'Test Description',
        taken_at: '2024-01-01',
      })
    })

    it('should parse flattened pipe-delimited format', () => {
      const resource: CloudinaryResource = {
        public_id: 'test/photo',
        secure_url: 'https://example.com/image.jpg',
        context: {
          title: 'Test Photo',
          description: 'Test Description',
          taken_at: '2024-01-01',
        },
      }
      const result = parseCloudinaryContext(resource)
      expect(result).toEqual({
        title: 'Test Photo',
        description: 'Test Description',
        taken_at: '2024-01-01',
      })
    })

    it('should prefer context.custom over flattened', () => {
      const resource: CloudinaryResource = {
        public_id: 'test/photo',
        secure_url: 'https://example.com/image.jpg',
        context: {
          custom: {
            title: 'Custom Title',
          },
          title: 'Flattened Title',
        },
      }
      const result = parseCloudinaryContext(resource)
      expect(result.title).toBe('Custom Title')
    })

    it('should return empty object when context is missing', () => {
      const resource: CloudinaryResource = {
        public_id: 'test/photo',
        secure_url: 'https://example.com/image.jpg',
      }
      const result = parseCloudinaryContext(resource)
      expect(result).toEqual({})
    })

    it('should skip non-string values and custom key in flattened format', () => {
      const resource: CloudinaryResource = {
        public_id: 'test/photo',
        secure_url: 'https://example.com/image.jpg',
        context: {
          title: 'Test Photo',
          description: 'Valid string',
          custom: {},  // Empty custom - should fall through to flattened
          number: 123,
        },
      }
      const result = parseCloudinaryContext(resource)
      expect(result.title).toBe('Test Photo')
      expect(result.description).toBe('Valid string')
      expect(result.number).toBeUndefined()
      expect(result.custom).toBeUndefined()
    })

    it('should return empty object when context.custom is empty', () => {
      const resource: CloudinaryResource = {
        public_id: 'test/photo',
        secure_url: 'https://example.com/image.jpg',
        context: {
          custom: {},
        },
      }
      const result = parseCloudinaryContext(resource)
      expect(result).toEqual({})
    })
  })

  describe('normalizeAperture', () => {
    it('should normalize aperture with f/ prefix', () => {
      expect(normalizeAperture('f/2.8')).toBe('f/2.8')
    })

    it('should add f/ prefix to numeric value', () => {
      expect(normalizeAperture('2.8')).toBe('f/2.8')
    })

    it('should handle uppercase F/', () => {
      expect(normalizeAperture('F/2.8')).toBe('f/2.8')
    })

    it('should handle mixed case f/', () => {
      expect(normalizeAperture('F/4.0')).toBe('f/4.0')
    })

    it('should format to one decimal place', () => {
      expect(normalizeAperture('2')).toBe('f/2.0')
      expect(normalizeAperture('5.6')).toBe('f/5.6')
    })

    it('should return undefined for undefined input', () => {
      expect(normalizeAperture(undefined)).toBeUndefined()
    })

    it('should return undefined for empty string', () => {
      expect(normalizeAperture('')).toBeUndefined()
    })

    it('should return original value for invalid numeric', () => {
      expect(normalizeAperture('invalid')).toBe('invalid')
    })

    it('should return original value for negative number', () => {
      expect(normalizeAperture('-2.8')).toBe('-2.8')
    })

    it('should return original value for zero', () => {
      expect(normalizeAperture('0')).toBe('0')
    })
  })

  describe('normalizeFocalLength', () => {
    it('should normalize focal length with mm suffix', () => {
      expect(normalizeFocalLength('50mm')).toBe('50.00mm')
    })

    it('should add mm suffix to numeric value', () => {
      expect(normalizeFocalLength('50')).toBe('50.00mm')
    })

    it('should handle decimal values', () => {
      expect(normalizeFocalLength('50.5')).toBe('50.50mm')
    })

    it('should handle comma as decimal separator', () => {
      expect(normalizeFocalLength('50,5')).toBe('50.50mm')
    })

    it('should format to two decimal places', () => {
      expect(normalizeFocalLength('24')).toBe('24.00mm')
      expect(normalizeFocalLength('85.123')).toBe('85.12mm')
    })

    it('should return undefined for undefined input', () => {
      expect(normalizeFocalLength(undefined)).toBeUndefined()
    })

    it('should return undefined for null input', () => {
      expect(normalizeFocalLength(null)).toBeUndefined()
    })

    it('should return undefined for empty string', () => {
      expect(normalizeFocalLength('')).toBeUndefined()
    })

    it('should return undefined for whitespace only', () => {
      expect(normalizeFocalLength('   ')).toBeUndefined()
    })

    it('should return original value for non-numeric', () => {
      expect(normalizeFocalLength('invalid')).toBe('invalid')
    })

    it('should extract numeric from mixed string', () => {
      expect(normalizeFocalLength('focal: 50mm')).toBe('50.00mm')
    })

    it('should handle negative values', () => {
      expect(normalizeFocalLength('-50')).toBe('-50.00mm')
    })
  })

  describe('mapResourceToPhoto', () => {
    it('should map complete resource with all fields', () => {
      const resource: CloudinaryResource = {
        public_id: 'travel/sunset',
        secure_url: 'https://res.cloudinary.com/test/image/upload/travel/sunset.jpg',
        width: 4000,
        height: 3000,
        created_at: '2024-01-15T10:30:00Z',
        uploaded_at: '2024-01-15T10:35:00Z',
        context: {
          custom: {
            title: 'Sunset in Paris',
            description: 'Beautiful sunset over the Eiffel Tower',
            title_en: 'Sunset in Paris EN',
            description_en: 'Beautiful sunset over the Eiffel Tower EN',
            featured: 'true',
            sort_order: '10',
            featured_order: '5',
            taken_at: '2024-01-14',
            camera_make: 'Canon',
            camera_model: 'EOS R5',
            lens_model: 'RF 24-70mm',
            focal_length: '50',
            aperture: 'f/2.8',
            shutter: '1/200',
            iso: '400',
          },
        },
        tags: ['travel', 'architecture'],
      }

      const photo = mapResourceToPhoto(resource)

      expect(photo.publicId).toBe('travel/sunset')
      expect(photo.title).toBe('Sunset in Paris')
      expect(photo.description).toBe('Beautiful sunset over the Eiffel Tower')
      expect(photo.titleEn).toBe('Sunset in Paris EN')
      expect(photo.descriptionEn).toBe('Beautiful sunset over the Eiffel Tower EN')
      expect(photo.featured).toBe(true)
      expect(photo.sortOrder).toBe(10)
      expect(photo.featuredOrder).toBe(5)
      expect(photo.takenAt).toBe('2024-01-14')
      expect(photo.createdAt).toBe('2024-01-15T10:30:00Z')
      expect(photo.uploadedAt).toBe('2024-01-15T10:35:00Z')
      expect(photo.tags).toEqual(['travel', 'architecture'])
      expect(photo.width).toBe(4000)
      expect(photo.height).toBe(3000)
      expect(photo.aspectRatio).toBe(4000 / 3000)
      expect(photo.camera.make).toBe('Canon')
      expect(photo.camera.model).toBe('EOS R5')
      expect(photo.camera.lens).toBe('RF 24-70mm')
      expect(photo.camera.focalLength).toBe('50.00mm')
      expect(photo.camera.aperture).toBe('f/2.8')
      expect(photo.camera.shutter).toBe('1/200')
      expect(photo.camera.iso).toBe('400')
      expect(photo.secureUrl).toBe('https://res.cloudinary.com/test/image/upload/travel/sunset.jpg')
      expect(photo.thumbnailUrl).toContain('travel/sunset')
    })

    it('should map minimal resource with defaults', () => {
      const resource: CloudinaryResource = {
        public_id: 'photo123',
        secure_url: 'https://example.com/photo123.jpg',
      }

      const photo = mapResourceToPhoto(resource)

      expect(photo.publicId).toBe('photo123')
      expect(photo.title).toBe('photo123')
      expect(photo.description).toBe('')
      expect(photo.titleEn).toBeUndefined()
      expect(photo.descriptionEn).toBeUndefined()
      expect(photo.featured).toBeUndefined()
      expect(photo.sortOrder).toBeUndefined()
      expect(photo.featuredOrder).toBeUndefined()
      expect(photo.takenAt).toBeUndefined()
      expect(photo.tags).toEqual([])
      expect(photo.width).toBe(1200)
      expect(photo.height).toBe(800)
      expect(photo.aspectRatio).toBe(1200 / 800)
      expect(photo.camera.make).toBeUndefined()
      expect(photo.camera.model).toBeUndefined()
      expect(photo.camera.lens).toBeUndefined()
      expect(photo.camera.focalLength).toBeUndefined()
      expect(photo.camera.aperture).toBeUndefined()
      expect(photo.camera.shutter).toBeUndefined()
      expect(photo.camera.iso).toBeUndefined()
    })

    it('should use last segment of publicId as title when no context title', () => {
      const resource: CloudinaryResource = {
        public_id: 'folder/subfolder/my-photo',
        secure_url: 'https://example.com/image.jpg',
      }

      const photo = mapResourceToPhoto(resource)
      expect(photo.title).toBe('my-photo')
    })

    it('should handle legacy display_order field', () => {
      const resource: CloudinaryResource = {
        public_id: 'photo',
        secure_url: 'https://example.com/image.jpg',
        context: {
          custom: {
            display_order: '25',
          },
        },
      }

      const photo = mapResourceToPhoto(resource)
      expect(photo.sortOrder).toBe(25)
    })

    it('should prefer sort_order over display_order', () => {
      const resource: CloudinaryResource = {
        public_id: 'photo',
        secure_url: 'https://example.com/image.jpg',
        context: {
          custom: {
            sort_order: '10',
            display_order: '25',
          },
        },
      }

      const photo = mapResourceToPhoto(resource)
      expect(photo.sortOrder).toBe(10)
    })

    it('should handle featured flag variations', () => {
      const trueResource: CloudinaryResource = {
        public_id: 'photo1',
        secure_url: 'https://example.com/image.jpg',
        context: { custom: { featured: 'true' } },
      }
      expect(mapResourceToPhoto(trueResource).featured).toBe(true)

      const falseResource: CloudinaryResource = {
        public_id: 'photo2',
        secure_url: 'https://example.com/image.jpg',
        context: { custom: { featured: 'false' } },
      }
      expect(mapResourceToPhoto(falseResource).featured).toBeUndefined()

      const emptyResource: CloudinaryResource = {
        public_id: 'photo3',
        secure_url: 'https://example.com/image.jpg',
        context: { custom: { featured: '' } },
      }
      expect(mapResourceToPhoto(emptyResource).featured).toBeUndefined()
    })

    it('should fallback to created_at when uploaded_at missing', () => {
      const resource: CloudinaryResource = {
        public_id: 'photo',
        secure_url: 'https://example.com/image.jpg',
        created_at: '2024-01-15T10:30:00Z',
      }

      const photo = mapResourceToPhoto(resource)
      expect(photo.createdAt).toBe('2024-01-15T10:30:00Z')
      expect(photo.uploadedAt).toBe('2024-01-15T10:30:00Z')
    })

    it('should handle invalid sort order values', () => {
      const resource: CloudinaryResource = {
        public_id: 'photo',
        secure_url: 'https://example.com/image.jpg',
        context: {
          custom: {
            sort_order: 'invalid',
          },
        },
      }

      const photo = mapResourceToPhoto(resource)
      expect(photo.sortOrder).toBeUndefined()
    })

    it('should handle invalid featured order values', () => {
      const resource: CloudinaryResource = {
        public_id: 'photo',
        secure_url: 'https://example.com/image.jpg',
        context: {
          custom: {
            featured_order: 'NaN',
          },
        },
      }

      const photo = mapResourceToPhoto(resource)
      expect(photo.featuredOrder).toBeUndefined()
    })

    it('should trim whitespace from text fields', () => {
      const resource: CloudinaryResource = {
        public_id: 'photo',
        secure_url: 'https://example.com/image.jpg',
        context: {
          custom: {
            title: '  My Photo  ',
            description: '  Description with spaces  ',
            camera_make: '  Canon  ',
          },
        },
      }

      const photo = mapResourceToPhoto(resource)
      expect(photo.title).toBe('My Photo')
      expect(photo.description).toBe('Description with spaces')
      expect(photo.camera.make).toBe('Canon')
    })

    it('should handle zero/negative dimensions', () => {
      const resource: CloudinaryResource = {
        public_id: 'photo',
        secure_url: 'https://example.com/image.jpg',
        width: 0,
        height: -100,
      }

      const photo = mapResourceToPhoto(resource)
      expect(photo.width).toBe(1200)
      expect(photo.height).toBe(800)
    })

    it('should normalize tags from context when not in tags field', () => {
      const resource: CloudinaryResource = {
        public_id: 'photo',
        secure_url: 'https://example.com/image.jpg',
        context: {
          custom: {
            tags: 'travel,architecture',
          },
        },
      }

      const photo = mapResourceToPhoto(resource)
      expect(photo.tags).toEqual(['travel', 'architecture'])
    })
  })
})

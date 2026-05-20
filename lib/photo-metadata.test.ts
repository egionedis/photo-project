import { describe, it, expect, vi } from 'vitest'
import { mergePhotoMetadata, type PhotoMetadataFields } from './photo-metadata'

describe('photo-metadata', () => {
  describe('mergePhotoMetadata', () => {
    const mockNormalizeFocalLength = vi.fn((value: string | null | undefined) => {
      if (!value) return undefined
      return `${value}mm`
    })

    const existingContext = {
      title: 'Old Title',
      description: 'Old Description',
      title_en: 'Old English Title',
      description_en: 'Old English Description',
      featured: 'true',
      sort_order: '10',
      featured_order: '5',
      taken_at: '2023-01-01',
      camera_make: 'Canon',
      camera_model: 'EOS R5',
      lens_model: 'RF 24-70mm',
      focal_length: '50mm',
      aperture: 'f/2.8',
      shutter: '1/200',
      iso: '400',
    }

    describe('undefined preserves existing value', () => {
      it('should preserve title when undefined', () => {
        const updates: PhotoMetadataFields = { title: undefined, description: '' }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.title).toBe('Old Title')
      })

      it('should preserve description when undefined', () => {
        const updates: PhotoMetadataFields = { title: '', description: undefined }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.description).toBe('Old Description')
      })

      it('should preserve titleEn when undefined', () => {
        const updates: PhotoMetadataFields = { title: '', description: '', titleEn: undefined }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.title_en).toBe('Old English Title')
      })

      it('should preserve descriptionEn when undefined', () => {
        const updates: PhotoMetadataFields = { title: '', description: '', descriptionEn: undefined }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.description_en).toBe('Old English Description')
      })

      it('should preserve featured when undefined', () => {
        const updates: PhotoMetadataFields = { title: '', description: '', featured: undefined }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.featured).toBe('true')
      })

      it('should preserve sortOrder when undefined', () => {
        const updates: PhotoMetadataFields = { title: '', description: '', sortOrder: undefined }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.sort_order).toBe('10')
      })

      it('should preserve featuredOrder when undefined', () => {
        const updates: PhotoMetadataFields = { title: '', description: '', featuredOrder: undefined }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.featured_order).toBe('5')
      })

      it('should preserve takenAt when undefined', () => {
        const updates: PhotoMetadataFields = { title: '', description: '', takenAt: undefined }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.taken_at).toBe('2023-01-01')
      })

      it('should preserve camera fields when undefined', () => {
        const updates: PhotoMetadataFields = {
          title: '',
          description: '',
          cameraMake: undefined,
          cameraModel: undefined,
          lensModel: undefined,
          focalLength: undefined,
          aperture: undefined,
          shutter: undefined,
          iso: undefined,
        }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.camera_make).toBe('Canon')
        expect(result.camera_model).toBe('EOS R5')
        expect(result.lens_model).toBe('RF 24-70mm')
        expect(result.focal_length).toBe('50mm')
        expect(result.aperture).toBe('f/2.8')
        expect(result.shutter).toBe('1/200')
        expect(result.iso).toBe('400')
      })
    })

    describe('null deletes field', () => {
      it('should delete titleEn when null', () => {
        const updates: PhotoMetadataFields = { title: '', description: '', titleEn: null }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.title_en).toBeUndefined()
      })

      it('should delete descriptionEn when null', () => {
        const updates: PhotoMetadataFields = { title: '', description: '', descriptionEn: null }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.description_en).toBeUndefined()
      })

      it('should delete sortOrder when null', () => {
        const updates: PhotoMetadataFields = { title: '', description: '', sortOrder: null }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.sort_order).toBeUndefined()
      })

      it('should delete featuredOrder when null', () => {
        const updates: PhotoMetadataFields = { title: '', description: '', featuredOrder: null }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.featured_order).toBeUndefined()
      })

      it('should delete takenAt when null', () => {
        const updates: PhotoMetadataFields = { title: '', description: '', takenAt: null }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.taken_at).toBeUndefined()
      })

      it('should delete camera fields when null', () => {
        const updates: PhotoMetadataFields = {
          title: '',
          description: '',
          cameraMake: null,
          cameraModel: null,
          lensModel: null,
          focalLength: null,
          aperture: null,
          shutter: null,
          iso: null,
        }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.camera_make).toBeUndefined()
        expect(result.camera_model).toBeUndefined()
        expect(result.lens_model).toBeUndefined()
        expect(result.focal_length).toBeUndefined()
        expect(result.aperture).toBeUndefined()
        expect(result.shutter).toBeUndefined()
        expect(result.iso).toBeUndefined()
      })
    })

    describe('value sets field', () => {
      it('should set title when provided', () => {
        const updates: PhotoMetadataFields = { title: 'New Title', description: '' }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.title).toBe('New Title')
      })

      it('should set description when provided', () => {
        const updates: PhotoMetadataFields = { title: '', description: 'New Description' }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.description).toBe('New Description')
      })

      it('should set titleEn when provided', () => {
        const updates: PhotoMetadataFields = { title: '', description: '', titleEn: 'New English Title' }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.title_en).toBe('New English Title')
      })

      it('should set descriptionEn when provided', () => {
        const updates: PhotoMetadataFields = {
          title: '',
          description: '',
          descriptionEn: 'New English Description',
        }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.description_en).toBe('New English Description')
      })

      it('should set sortOrder when provided', () => {
        const updates: PhotoMetadataFields = { title: '', description: '', sortOrder: 20 }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.sort_order).toBe('20')
      })

      it('should set featuredOrder when provided', () => {
        const updates: PhotoMetadataFields = { title: '', description: '', featuredOrder: 15 }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.featured_order).toBe('15')
      })

      it('should set takenAt when provided', () => {
        const updates: PhotoMetadataFields = { title: '', description: '', takenAt: '2024-05-20' }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.taken_at).toBe('2024-05-20')
      })

      it('should set camera fields when provided', () => {
        const updates: PhotoMetadataFields = {
          title: '',
          description: '',
          cameraMake: 'Sony',
          cameraModel: 'A7 IV',
          lensModel: 'FE 24-70mm',
          focalLength: '35',
          aperture: 'f/4.0',
          shutter: '1/500',
          iso: '800',
        }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.camera_make).toBe('Sony')
        expect(result.camera_model).toBe('A7 IV')
        expect(result.lens_model).toBe('FE 24-70mm')
        expect(result.focal_length).toBe('35mm')
        expect(result.aperture).toBe('f/4.0')
        expect(result.shutter).toBe('1/500')
        expect(result.iso).toBe('800')
      })
    })

    describe('featured boolean edge cases', () => {
      it('should set featured to "true" when true', () => {
        const updates: PhotoMetadataFields = { title: '', description: '', featured: true }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.featured).toBe('true')
      })

      it('should delete featured when false', () => {
        const updates: PhotoMetadataFields = { title: '', description: '', featured: false }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.featured).toBeUndefined()
      })
    })

    describe('empty string edge cases', () => {
      it('should treat empty string title as truthy value', () => {
        const updates: PhotoMetadataFields = { title: '', description: 'desc' }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.title).toBe('')
      })

      it('should treat empty string description as truthy value', () => {
        const updates: PhotoMetadataFields = { title: 'title', description: '' }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.description).toBe('')
      })

      it('should treat empty string optional fields as truthy value', () => {
        const updates: PhotoMetadataFields = {
          title: '',
          description: '',
          titleEn: '',
          descriptionEn: '',
          cameraMake: '',
          cameraModel: '',
        }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.title_en).toBe('')
        expect(result.description_en).toBe('')
        expect(result.camera_make).toBe('')
        expect(result.camera_model).toBe('')
      })
    })

    describe('normalizeFocalLength is called', () => {
      it('should call normalizeFocalLength when focalLength is provided', () => {
        mockNormalizeFocalLength.mockClear()
        const updates: PhotoMetadataFields = { title: '', description: '', focalLength: '50' }
        mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(mockNormalizeFocalLength).toHaveBeenCalledWith('50')
      })

      it('should not call normalizeFocalLength when focalLength is null', () => {
        mockNormalizeFocalLength.mockClear()
        const updates: PhotoMetadataFields = { title: '', description: '', focalLength: null }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(mockNormalizeFocalLength).not.toHaveBeenCalled()
        expect(result.focal_length).toBeUndefined()
      })

      it('should not call normalizeFocalLength when focalLength is undefined', () => {
        mockNormalizeFocalLength.mockClear()
        const updates: PhotoMetadataFields = { title: '', description: '', focalLength: undefined }
        mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(mockNormalizeFocalLength).not.toHaveBeenCalled()
      })
    })

    describe('complete merge scenarios', () => {
      it('should handle empty existing context', () => {
        const updates: PhotoMetadataFields = {
          title: 'New Title',
          description: 'New Description',
          titleEn: 'English Title',
        }
        const result = mergePhotoMetadata({}, updates, mockNormalizeFocalLength)
        expect(result.title).toBe('New Title')
        expect(result.description).toBe('New Description')
        expect(result.title_en).toBe('English Title')
      })

      it('should handle mixed operations (preserve, delete, set)', () => {
        const updates: PhotoMetadataFields = {
          title: 'Updated Title', // set
          description: '', // set to empty
          titleEn: undefined, // preserve
          descriptionEn: null, // delete
          sortOrder: 100, // set
          featuredOrder: null, // delete
          takenAt: undefined, // preserve
        }
        const result = mergePhotoMetadata(existingContext, updates, mockNormalizeFocalLength)
        expect(result.title).toBe('Updated Title')
        expect(result.description).toBe('')
        expect(result.title_en).toBe('Old English Title')
        expect(result.description_en).toBeUndefined()
        expect(result.sort_order).toBe('100')
        expect(result.featured_order).toBeUndefined()
        expect(result.taken_at).toBe('2023-01-01')
      })
    })
  })
})

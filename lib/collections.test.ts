import { describe, it, expect } from 'vitest'
import { validateCollectionTags } from './collections'

describe('collections', () => {
  describe('validateCollectionTags', () => {
    it('should filter unknown tags', () => {
      expect(validateCollectionTags(['travel', 'unknown', 'life'])).toEqual(['travel', 'life'])
    })

    it('should normalize case to lowercase', () => {
      expect(validateCollectionTags(['Travel', 'LIFE', 'Architecture'])).toEqual([
        'travel',
        'life',
        'architecture',
      ])
    })

    it('should trim whitespace', () => {
      expect(validateCollectionTags(['  travel  ', ' life ', 'architecture   '])).toEqual([
        'travel',
        'life',
        'architecture',
      ])
    })

    it('should deduplicate tags', () => {
      expect(validateCollectionTags(['travel', 'travel', 'life', 'life'])).toEqual([
        'travel',
        'life',
      ])
    })

    it('should deduplicate after normalization', () => {
      expect(validateCollectionTags(['Travel', 'travel', 'TRAVEL'])).toEqual(['travel'])
    })

    it('should handle empty strings', () => {
      expect(validateCollectionTags(['', 'travel', '', 'life'])).toEqual(['travel', 'life'])
    })

    it('should return empty array for no valid tags', () => {
      expect(validateCollectionTags(['unknown', 'invalid', 'notreal'])).toEqual([])
    })

    it('should return empty array for empty input', () => {
      expect(validateCollectionTags([])).toEqual([])
    })

    it('should handle all valid collection slugs', () => {
      expect(
        validateCollectionTags(['travel', 'life', 'architecture', 'nature', 'objects'])
      ).toEqual(['travel', 'life', 'architecture', 'nature', 'objects'])
    })

    it('should preserve order of first occurrence after deduplication', () => {
      expect(validateCollectionTags(['life', 'travel', 'life', 'architecture', 'travel'])).toEqual([
        'life',
        'travel',
        'architecture',
      ])
    })

    it('should handle mixed valid and invalid with normalization', () => {
      expect(
        validateCollectionTags(['TRAVEL', 'invalid', '  life  ', '', 'unknown', 'Architecture'])
      ).toEqual(['travel', 'life', 'architecture'])
    })
  })
})

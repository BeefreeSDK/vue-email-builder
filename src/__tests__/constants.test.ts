import { describe, it, expect } from 'vitest'
import { DEFAULT_CONTAINER, SDK_LOADER_URL } from '../constants'

describe('constants', () => {
  it('exports DEFAULT_CONTAINER as non-empty string', () => {
    expect(typeof DEFAULT_CONTAINER).toBe('string')
    expect(DEFAULT_CONTAINER.length).toBeGreaterThan(0)
  })

  it('exports SDK_LOADER_URL as valid URL string', () => {
    expect(typeof SDK_LOADER_URL).toBe('string')
    expect(SDK_LOADER_URL).toMatch(/^https:\/\//)
  })
})

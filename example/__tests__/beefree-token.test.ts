import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getBuilderToken } from '../beefree-token'

describe('beefree-token', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset()
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: 'test-token', v2: true }),
    } as Response)
  })

  it('returns token on successful fetch', async () => {
    const token = await getBuilderToken('client-id', 'client-secret', 'user-1')
    expect(token).toEqual({ access_token: 'test-token', v2: true })
    expect(fetch).toHaveBeenCalledWith(
      'https://auth.getbee.io/loginV2',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })

  it('throws on network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
    await expect(getBuilderToken('a', 'b')).rejects.toThrow('Network error')
  })

  it('throws when response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response)
    await expect(getBuilderToken('a', 'b')).rejects.toThrow('Authentication failed')
  })

  it('throws when response has no access_token', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response)
    await expect(getBuilderToken('a', 'b')).rejects.toThrow('Invalid credentials')
  })
})

import { describe, it, expect, vi } from 'vitest'
import { downloadFile } from '../utils'

describe('utils.downloadFile', () => {
  it('downloads a file with default content type and cleans up DOM/url', () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL')

    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const removeSpy = vi.spyOn(document.body, 'removeChild')

    const anchor = document.createElement('a')
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {})
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchor)

    downloadFile('template.json', '{"ok":true}')

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(anchor.download).toBe('template.json')
    expect(anchor.href).toBe('blob:mock-url')
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(appendSpy).toHaveBeenCalledWith(anchor)
    expect(removeSpy).toHaveBeenCalledWith(anchor)

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
    const blob = createObjectURLSpy.mock.calls[0][0] as Blob
    expect(blob.type).toBe('application/json')
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
  })

  it('uses a custom content type when provided', () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL')
    const anchor = document.createElement('a')
    vi.spyOn(anchor, 'click').mockImplementation(() => {})
    vi.spyOn(document, 'createElement').mockReturnValue(anchor)

    downloadFile('design.html', '<h1>Hello</h1>', 'text/html;charset=utf-8')

    const blob = createObjectURLSpy.mock.calls[0][0] as Blob
    expect(blob.type).toBe('text/html;charset=utf-8')
    expect(anchor.download).toBe('design.html')
  })
})

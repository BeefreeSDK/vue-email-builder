import { resetRegistry } from '../../src/composables/useRegistry'

let originalAnchorClick: () => void
let consoleErrorSpy: ReturnType<typeof vi.spyOn>
let consoleLogSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  resetRegistry()
  // Suppress expected console output from component under test (do not use restoreAllMocks — it would restore fetch)
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  // Prevent <a download>.click() from triggering "Not implemented: navigation" in jsdom
  originalAnchorClick = HTMLAnchorElement.prototype.click
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    if (this.getAttribute('download') != null) return
    return originalAnchorClick.call(this)
  }
})

afterEach(() => {
  consoleErrorSpy.mockRestore()
  consoleLogSpy.mockRestore()
  HTMLAnchorElement.prototype.click = originalAnchorClick
})

vi.mock('@beefree.io/sdk', () => {
  const mockInstance = {
    start: vi.fn().mockResolvedValue(undefined),
    join: vi.fn().mockResolvedValue(undefined),
    loadConfig: vi.fn(),
    getTemplateJson: vi.fn().mockResolvedValue({ data: { json: { page: {} } } }),
    load: vi.fn(),
    preview: vi.fn(),
    save: vi.fn(),
    saveAsTemplate: vi.fn(),
  }
  return {
    __esModule: true,
    default: vi.fn(() => mockInstance),
  }
})

vi.stubGlobal(
  'fetch',
  vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ access_token: 'mock-token', v2: true }),
  }),
)

vi.stubGlobal('URL', {
  ...globalThis.URL,
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
})

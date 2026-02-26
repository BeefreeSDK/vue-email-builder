import { resetRegistry } from '../composables/useRegistry'

beforeEach(() => {
  resetRegistry()
})

vi.mock('@beefree.io/sdk', () => {
  const mockInstance = {
    start: vi.fn().mockResolvedValue(undefined),
    join: vi.fn().mockResolvedValue(undefined),
    loadConfig: vi.fn(),
  }
  return {
    __esModule: true,
    default: vi.fn(() => mockInstance),
  }
})

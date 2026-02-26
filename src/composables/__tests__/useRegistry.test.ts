import BeefreeSDK from '@beefree.io/sdk'
import {
  useSDKInstanceRegistry,
  setSDKInstanceToRegistry,
  removeSDKInstanceFromRegistry,
  setConfigInRegistry,
  removeConfigFromRegistry,
  getConfigRegistry,
  resetRegistry,
} from '../useRegistry'

describe('useRegistry', () => {
  beforeEach(() => {
    resetRegistry()
  })

  describe('SDK instance registry', () => {
    it('starts empty', () => {
      const { registry, version } = useSDKInstanceRegistry()
      expect(registry.size).toBe(0)
      expect(version.value).toBe(0)
    })

    it('registers and retrieves SDK instances', () => {
      const mockInstance = new BeefreeSDK({ access_token: 'test', v2: true })
      const { registry, version } = useSDKInstanceRegistry()

      setSDKInstanceToRegistry('test-container', mockInstance)

      expect(registry.get('test-container')).toBe(mockInstance)
      expect(version.value).toBe(1)
    })

    it('removes SDK instances', () => {
      const mockInstance = new BeefreeSDK({ access_token: 'test', v2: true })
      const { registry, version } = useSDKInstanceRegistry()

      setSDKInstanceToRegistry('test-container', mockInstance)
      removeSDKInstanceFromRegistry('test-container')

      expect(registry.has('test-container')).toBe(false)
      expect(version.value).toBe(2)
    })

    it('increments version on each change', () => {
      const mockInstance = new BeefreeSDK({ access_token: 'test', v2: true })
      const { version } = useSDKInstanceRegistry()

      expect(version.value).toBe(0)

      setSDKInstanceToRegistry('a', mockInstance)
      expect(version.value).toBe(1)

      setSDKInstanceToRegistry('b', mockInstance)
      expect(version.value).toBe(2)

      removeSDKInstanceFromRegistry('a')
      expect(version.value).toBe(3)
    })
  })

  describe('config registry', () => {
    it('starts empty', () => {
      const configRegistry = getConfigRegistry()
      expect(configRegistry.size).toBe(0)
    })

    it('sets and retrieves config', () => {
      const config = { container: 'test', uid: 'user-1' }
      setConfigInRegistry('test', config)

      const configRegistry = getConfigRegistry()
      expect(configRegistry.get('test')).toEqual(config)
    })

    it('removes config', () => {
      setConfigInRegistry('test', { container: 'test' })
      removeConfigFromRegistry('test')

      const configRegistry = getConfigRegistry()
      expect(configRegistry.has('test')).toBe(false)
    })

    it('ignores remove with undefined key', () => {
      setConfigInRegistry('test', { container: 'test' })
      removeConfigFromRegistry(undefined)

      const configRegistry = getConfigRegistry()
      expect(configRegistry.has('test')).toBe(true)
    })
  })

  describe('resetRegistry', () => {
    it('clears all registries and resets version', () => {
      const mockInstance = new BeefreeSDK({ access_token: 'test', v2: true })

      setSDKInstanceToRegistry('test', mockInstance)
      setConfigInRegistry('test', { container: 'test' })

      resetRegistry()

      const { registry, version } = useSDKInstanceRegistry()
      const configRegistry = getConfigRegistry()

      expect(registry.size).toBe(0)
      expect(configRegistry.size).toBe(0)
      expect(version.value).toBe(0)
    })
  })
})

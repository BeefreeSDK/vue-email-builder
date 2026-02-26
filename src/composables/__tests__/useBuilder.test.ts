import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import BeefreeSDK from '@beefree.io/sdk'
import { IBeeConfig } from '@beefree.io/sdk/dist/types/bee'
import { useBuilder } from '../useBuilder'
import {
  setSDKInstanceToRegistry,
  removeSDKInstanceFromRegistry,
  getConfigRegistry,
  setConfigInRegistry,
} from '../useRegistry'
import type { UseBuilder } from '../../types'

function withSetup(composable: () => UseBuilder) {
  let result: UseBuilder
  const TestComponent = defineComponent({
    setup() {
      result = composable()
      return () => h('div')
    },
  })
  const wrapper = mount(TestComponent)
  return { result: result!, wrapper }
}

describe('useBuilder', () => {
  const mockConfig: IBeeConfig = {
    container: 'test',
    uid: 'user-1',
    username: 'TestUser',
    templateLanguage: {
      label: 'English (US)',
      value: 'en-US',
    },
    templateLanguages: [
      { value: 'it-IT', label: 'Italiano' },
    ],
  }

  it('stores config in registry on mount', () => {
    withSetup(() => useBuilder(mockConfig))

    const registryConfig = getConfigRegistry().get(mockConfig.container)

    expect(registryConfig).toEqual(mockConfig)
  })

  it('uses empty string when config has no container', () => {
    const configWithoutContainer = { ...mockConfig, container: undefined } as IBeeConfig
    const { result } = withSetup(() => useBuilder(configWithoutContainer))
    expect(result.id).toBe('')
  })

  it('does not overwrite config in registry when container already registered', () => {
    setConfigInRegistry('test', { ...mockConfig, username: 'PreExisting' })
    withSetup(() => useBuilder(mockConfig))
    expect(getConfigRegistry().get('test')?.username).toBe('PreExisting')
  })

  it('version watcher does not update instance or config when unchanged', async () => {
    const mockInstance = {
      loadConfig: vi.fn().mockResolvedValue(undefined),
    } as unknown as BeefreeSDK
    const { result } = withSetup(() => useBuilder(mockConfig))
    setSDKInstanceToRegistry('test', mockInstance)
    await nextTick()
    getConfigRegistry().delete('test')
    removeSDKInstanceFromRegistry('test')
    setSDKInstanceToRegistry('test', mockInstance)
    await nextTick()
    const returned = await result.updateConfig({})
    expect(returned).toEqual(mockConfig)
  })

  it('forwards method calls to SDK instance', async () => {
    const mockInstance = {
      save: vi.fn(),
      preview: vi.fn(),
      reload: vi.fn(),
      load: vi.fn(),
      getConfig: vi.fn(),
      loadConfig: vi.fn().mockResolvedValue({}),
    } as unknown as BeefreeSDK

    const { result } = withSetup(() => useBuilder(mockConfig))

    setSDKInstanceToRegistry('test', mockInstance)
    await nextTick()

    result.save()
    result.preview()
    result.getConfig()

    expect(mockInstance.save).toHaveBeenCalledTimes(1)
    expect(mockInstance.preview).toHaveBeenCalledTimes(1)
    expect(mockInstance.getConfig).toHaveBeenCalledTimes(1)
  })

  it('methods return undefined before instance is ready', () => {
    const { result } = withSetup(() => useBuilder(mockConfig))

    expect(() => {
      result.save()
      result.preview()
      result.getConfig()
    }).not.toThrow()

    expect(result.save()).toBeUndefined()
  })

  it('updateConfig calls SDK loadConfig', async () => {
    const mockLoadConfig = vi.fn().mockResolvedValue({ language: 'it-IT' })
    const mockInstance = {
      loadConfig: mockLoadConfig,
    } as unknown as BeefreeSDK

    const { result } = withSetup(() => useBuilder(mockConfig))

    setSDKInstanceToRegistry('test', mockInstance)
    await nextTick()

    await result.updateConfig({ language: 'it-IT' })

    expect(mockLoadConfig).toHaveBeenCalledWith({ language: 'it-IT' })
  })

  it('updateConfig returns current config when loadConfig resolves with falsy value', async () => {
    const mockLoadConfig = vi.fn().mockResolvedValue(undefined)
    const mockInstance = {
      loadConfig: mockLoadConfig,
    } as unknown as BeefreeSDK

    const { result } = withSetup(() => useBuilder(mockConfig))

    setSDKInstanceToRegistry('test', mockInstance)
    await nextTick()

    const returned = await result.updateConfig({ language: 'x' })

    expect(mockLoadConfig).toHaveBeenCalled()
    expect(returned).toEqual(mockConfig)
  })

  it('updateConfig returns current config when no instance', async () => {
    const { result } = withSetup(() => useBuilder(mockConfig))

    const returned = await result.updateConfig({ language: 'it-IT' })

    expect(returned).toEqual(mockConfig)
  })

  it('updateConfig calls onWarning when loadConfig rejects with code 3001', async () => {
    const onWarning = vi.fn()
    const mockLoadConfig = vi.fn().mockRejectedValue({ code: 3001 })
    const mockInstance = { loadConfig: mockLoadConfig } as unknown as BeefreeSDK
    const configWithWarning = { ...mockConfig, onWarning }

    const { result } = withSetup(() => useBuilder(configWithWarning))
    setSDKInstanceToRegistry('test', mockInstance)
    await nextTick()

    const returned = await result.updateConfig({ language: 'x' })

    expect(onWarning).toHaveBeenCalled()
    expect(returned).toEqual(configWithWarning)
  })

  it('updateConfig calls onError and throws when loadConfig rejects with other error', async () => {
    const onError = vi.fn()
    const mockLoadConfig = vi.fn().mockRejectedValue(new Error('Config failed'))
    const mockInstance = { loadConfig: mockLoadConfig } as unknown as BeefreeSDK
    const configWithError = { ...mockConfig, onError }

    const { result } = withSetup(() => useBuilder(configWithError))
    setSDKInstanceToRegistry('test', mockInstance)
    await nextTick()

    await expect(result.updateConfig({ language: 'x' })).rejects.toThrow('Config failed')
    expect(onError).toHaveBeenCalled()
  })

  it('removes config from registry on unmount', () => {
    const { wrapper } = withSetup(() => useBuilder(mockConfig))
    expect(getConfigRegistry().has(mockConfig.container)).toBe(true)
    wrapper.unmount()
    expect(getConfigRegistry().has(mockConfig.container)).toBe(false)
  })

  it('id property matches container from initial config', () => {
    const { result } = withSetup(() => useBuilder(mockConfig))
    expect(result.id).toBe(mockConfig.container)
  })
})

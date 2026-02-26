import { watch, onUnmounted, ref } from 'vue'
import { IBeeConfig } from '@beefree.io/sdk/dist/types/bee'
import {
  useSDKInstanceRegistry,
  setConfigInRegistry,
  removeConfigFromRegistry,
  getConfigRegistry,
} from './useRegistry'
import type { SDKInstance, UseBuilder } from '../types'

/**
 * Composable for programmatic control of a Beefree SDK builder instance.
 *
 * Provides methods to interact with the builder and allows
 * dynamic configuration updates after initialization.
 *
 * @param initialConfig - The initial configuration for the builder instance
 * @returns Object containing builder methods and configuration update function
 *
 * @example
 * ```ts
 * const config = {
 *   container: 'bee-editor',
 *   uid: 'user-123',
 *   language: 'en-US'
 * }
 *
 * const { updateConfig, save, getConfig } = useBuilder(config)
 *
 * // Update configuration dynamically
 * await updateConfig({ language: 'it-IT' })
 *
 * // Save content
 * const result = await save()
 * ```
 */
export const useBuilder = (initialConfig: IBeeConfig): UseBuilder => {
  const { registry, version } = useSDKInstanceRegistry()
  const getContainerKey = (container: IBeeConfig['container']) =>
    typeof container === 'string' ? container : ''
  const containerKey = getContainerKey(initialConfig.container)
  const configRef = ref<IBeeConfig>(initialConfig)
  const instance = ref<SDKInstance | null>(registry.get(containerKey) ?? null)

  const configRegistry = getConfigRegistry()
  if (!configRegistry.has(containerKey)) {
    setConfigInRegistry(containerKey, initialConfig)
  }

  const updateConfig = async (partialConfig: Partial<IBeeConfig>): Promise<IBeeConfig> => {
    if (!instance.value) {
      return configRef.value
    }

    try {
      const configResponse = await instance.value.loadConfig(partialConfig)
      if (configResponse) {
        configRef.value = configResponse
        return configResponse
      }
      return configRef.value
    } catch (error) {
      const err = error as { code?: number }
      if (err.code === 3001) {
        configRef.value.onWarning?.(err as never)
        return configRef.value
      } else {
        configRef.value.onError?.({
          code: 1000,
          message: `Error updating builder config: ${error}`,
        })
        throw error
      }
    }
  }

  watch(version, () => {
    const newInstance = registry.get(containerKey) ?? null
    if (instance.value !== newInstance) {
      instance.value = newInstance
    }

    const updatedConfig = configRegistry.get(getContainerKey(configRef.value.container))
    if (updatedConfig) {
      configRef.value = updatedConfig
    }
  })

  onUnmounted(() => {
    removeConfigFromRegistry(containerKey)
  })

  const bindMethod = <K extends keyof SDKInstance>(methodName: K) => {
    return (...args: Parameters<SDKInstance[K]>) => {
      const method = instance.value?.[methodName]
      return typeof method === 'function' ? method(...args) : undefined
    }
  }

  return {
    id: containerKey,
    updateConfig,
    reload: bindMethod('reload'),
    preview: bindMethod('preview'),
    load: bindMethod('load'),
    save: bindMethod('save'),
    saveAsTemplate: bindMethod('saveAsTemplate'),
    send: bindMethod('send'),
    join: bindMethod('join'),
    start: bindMethod('start'),
    loadRows: bindMethod('loadRows'),
    switchPreview: bindMethod('switchPreview'),
    togglePreview: bindMethod('togglePreview'),
    toggleComments: bindMethod('toggleComments'),
    switchTemplateLanguage: bindMethod('switchTemplateLanguage'),
    getTemplateJson: bindMethod('getTemplateJson'),
    loadConfig: bindMethod('loadConfig'),
    showComment: bindMethod('showComment'),
    updateToken: bindMethod('updateToken'),
    toggleMergeTagsPreview: bindMethod('toggleMergeTagsPreview'),
    execCommand: bindMethod('execCommand'),
    getConfig: bindMethod('getConfig'),
    loadStageMode: bindMethod('loadStageMode'),
    toggleStructure: bindMethod('toggleStructure'),
    loadWorkspace: bindMethod('loadWorkspace'),
    startFileManager: bindMethod('startFileManager'),
  }
}

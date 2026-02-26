import { ref, readonly } from 'vue'
import BeefreeSDK from '@beefree.io/sdk'
import { IBeeConfig } from '@beefree.io/sdk/dist/types/bee'

type SDKRegistry = Map<string, BeefreeSDK | null>
type ConfigRegistry = Map<string, IBeeConfig>

/**
 * Module-level singleton registries.
 * WARNING: Not SSR-safe — these are shared across all requests in a server context.
 * For Nuxt SSR, wrap Builder components in <ClientOnly>.
 * A future version may migrate to provide/inject for SSR isolation.
 */
const sdkInstanceRegistry: SDKRegistry = new Map()
const configRegistry: ConfigRegistry = new Map()

const registryVersion = ref(0)

const notifySdkInstanceRegistryChanged = () => {
  registryVersion.value += 1
}

export function useSDKInstanceRegistry() {
  return {
    registry: sdkInstanceRegistry,
    version: readonly(registryVersion),
  }
}

export const getConfigRegistry = () => configRegistry

export const setConfigInRegistry = (key: string, config: IBeeConfig) => {
  configRegistry.set(key, config)
}

export const removeConfigFromRegistry = (key?: string) => {
  if (key) {
    configRegistry.delete(key)
  }
}

export const setSDKInstanceToRegistry = (key: string, instance: BeefreeSDK | null) => {
  sdkInstanceRegistry.set(key, instance)
  notifySdkInstanceRegistryChanged()
}

export const removeSDKInstanceFromRegistry = (key: string) => {
  sdkInstanceRegistry.delete(key)
  notifySdkInstanceRegistryChanged()
}

export const resetRegistry = () => {
  sdkInstanceRegistry.clear()
  configRegistry.clear()
  registryVersion.value = 0
}

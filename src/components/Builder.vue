<template>
  <div
    :id="container"
    :style="{ width: props.width, height: props.height }"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, ref, toRaw } from 'vue'
import BeefreeSDK from '@beefree.io/sdk'
import { IBeeConfig, IEntityContentJson, IToken } from '@beefree.io/sdk/dist/types/bee'
import { DEFAULT_CONTAINER, SDK_LOADER_URL } from '../constants'
import {
  removeSDKInstanceFromRegistry,
  setConfigInRegistry,
  setSDKInstanceToRegistry,
} from '../composables/useRegistry'

/**
 * Maps SDK callback names (used in IBeeConfig) to Vue emit event names.
 * Events use a "bb-" (Beefree Builder) prefix with kebab-case to follow
 * Vue conventions and avoid collisions with native DOM events.
 */
const SDK_TO_EMIT: Record<string, string> = {
  onAutoSave: 'bb-auto-save',
  onChange: 'bb-change',
  onComment: 'bb-comment',
  onError: 'bb-error',
  onInfo: 'bb-info',
  onLoad: 'bb-load',
  onLoadWorkspace: 'bb-load-workspace',
  onPreview: 'bb-preview',
  onPreviewChange: 'bb-preview-change',
  onRemoteChange: 'bb-remote-change',
  onSave: 'bb-save',
  onSaveAsTemplate: 'bb-save-as-template',
  onSaveRow: 'bb-save-row',
  onSend: 'bb-send',
  onSessionChange: 'bb-session-change',
  onSessionStarted: 'bb-session-started',
  onStart: 'bb-start',
  onTemplateLanguageChange: 'bb-template-language-change',
  onTogglePreview: 'bb-toggle-preview',
  onViewChange: 'bb-view-change',
  onWarning: 'bb-warning',
}

interface Props {
  token: IToken
  template?: IEntityContentJson | null
  config?: IBeeConfig
  width?: string
  height?: string
  shared?: boolean
  sessionId?: string | null
  loaderUrl?: string | null
  bucketDir?: string
}

const props = withDefaults(defineProps<Props>(), {
  template: null,
  config: () => ({ container: DEFAULT_CONTAINER }),
  width: '100%',
  height: '100%',
  shared: false,
  sessionId: null,
  loaderUrl: null,
  bucketDir: undefined,
})

const emit = defineEmits<{
  'bb-auto-save': [value: string]
  'bb-change': [value: [string, unknown, number]]
  'bb-comment': [value: [unknown, string]]
  'bb-error': [value: unknown]
  'bb-info': [value: unknown]
  'bb-load': [value: unknown]
  'bb-load-workspace': [value: unknown]
  'bb-preview': [value: boolean]
  'bb-preview-change': [value: unknown]
  'bb-remote-change': [value: [string, unknown, number]]
  'bb-save': [value: [string, string, string | null, number, string | null]]
  'bb-save-as-template': [value: [string, number]]
  'bb-save-row': [value: [string, string, string]]
  'bb-send': [value: string]
  'bb-session-change': [value: unknown]
  'bb-session-started': [value: unknown]
  'bb-start': []
  'bb-template-language-change': [value: { label: string; value: string; isMain: boolean }]
  'bb-toggle-preview': [value: boolean]
  'bb-view-change': [value: unknown]
  'bb-warning': [value: unknown]
}>()

const bee = ref<BeefreeSDK | null>(null)
const editorReady = ref(false)
let isInitializing = false

const container = computed(() => {
  return (props.config?.container as string) || DEFAULT_CONTAINER
})

defineExpose<{
  bee: typeof bee
  initializeBeefree: () => void
}>({ bee, initializeBeefree })

function buildCallbackOverrides(): Partial<IBeeConfig> {
  const overrides: Record<string, (...args: never[]) => void> = {}
  const emitAny = emit as unknown as (event: string, ...payload: unknown[]) => void
  const rawConfig = toRaw(props.config)

  for (const [sdkName, emitName] of Object.entries(SDK_TO_EMIT)) {
    const configCb = rawConfig[sdkName as keyof IBeeConfig] as
      | ((...args: never[]) => void)
      | undefined

    overrides[sdkName] = (...args: never[]) => {
      configCb?.(...args)
      emitAny(emitName, ...(args.length === 1 ? [args[0]] : [args]))
    }
  }

  return overrides as Partial<IBeeConfig>
}

function buildMergedConfig(): IBeeConfig {
  const rawConfig = toRaw(props.config)
  const callbacks = buildCallbackOverrides()

  const data: Record<string, unknown> = {}
  const fns: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(rawConfig)) {
    if (typeof value === 'function') {
      fns[key] = value
    } else {
      data[key] = value
    }
  }

  return {
    ...structuredClone(data),
    ...fns,
    container: container.value,
    ...callbacks,
  } as IBeeConfig
}

function syncCallbacks(): void {
  const callbacks = buildCallbackOverrides()
  bee.value?.loadConfig?.(callbacks).catch((err: { code?: number }) => {
    if (err.code === 3001) {
      props.config.onWarning?.(err as never)
    } else {
      props.config.onError?.({ code: 1000, message: `Error updating builder config: ${err}` })
    }
  })
}

function initializeBeefree(): void {
  if (isInitializing) {
    return
  }

  if (!props.token) {
    emit('bb-error', { message: 'Can\'t start the builder without a token' })
    return
  }

  if (!props.config.uid) {
    emit('bb-error', { message: 'Can\'t start the builder without a uid in config' })
    return
  }

  cleanup()
  isInitializing = true

  const rawToken = toRaw(props.token)
  bee.value = new BeefreeSDK(rawToken, {
    beePluginUrl: props.loaderUrl ?? SDK_LOADER_URL,
  })

  const mergedConfig = buildMergedConfig()
  setConfigInRegistry(container.value, mergedConfig)

  const onStarted = () => {
    isInitializing = false
    handleStartupSuccess()
  }

  const onFailed = (err: unknown, msg: string) => {
    isInitializing = false
    mergedConfig.onError?.({ message: `${msg}: ${err}` })
  }

  if (props.shared && props.sessionId) {
    bee.value
      .join(mergedConfig, props.sessionId, props.bucketDir)
      .then(onStarted)
      .catch((err: unknown) => onFailed(err, 'Error joining the shared session'))
  } else {
    const rawTemplate = props.template ? toRaw(props.template) : ({} as IEntityContentJson)
    bee.value
      .start(mergedConfig, rawTemplate, props.bucketDir, {
        shared: props.shared,
      })
      .then(onStarted)
      .catch((err: unknown) => onFailed(err, 'Error starting the builder'))
  }
}

function handleStartupSuccess(): void {
  editorReady.value = true
  setSDKInstanceToRegistry(container.value, bee.value!)
}

function cleanup(): void {
  if (bee.value) {
    removeSDKInstanceFromRegistry(container.value)
    const el = document.getElementById(container.value)
    if (el) {
      el.innerHTML = ''
    }
    bee.value = null
    editorReady.value = false
  }
}

watch(
  () => props.token,
  () => {
    isInitializing = false
    initializeBeefree()
  },
)

watch(
  () => props.config,
  () => {
    if (editorReady.value) {
      syncCallbacks()
    }
  },
  { deep: true },
)

onMounted(() => {
  initializeBeefree()
})

onUnmounted(() => {
  cleanup()
})
</script>

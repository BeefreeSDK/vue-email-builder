<template>
  <div class="beefree-example">
    <div v-if="credentialsError" class="credentials-notice">
      <h2>{{ i18nStrings.title }}</h2>
      <p>
        <template v-for="(seg, i) in descriptionSegments" :key="i">
          <strong v-if="seg.style === 'bold'">{{ seg.text }}</strong>
          <code v-else-if="seg.style === 'code'">{{ seg.text }}</code>
          <template v-else>{{ seg.text }}</template>
        </template>
      </p>
      <ol>
        <li>
          <a href="https://developers.beefree.io/console" target="_blank" rel="noopener">
            {{ i18nStrings.step1 }}
          </a>
        </li>
        <li>{{ i18nStrings.step2 }}</li>
        <li>{{ i18nStrings.step3 }}</li>
      </ol>
      <p>
        {{ i18nStrings.docs }}
        <a href="https://docs.beefree.io/get-started" target="_blank" rel="noopener">
          Getting Started guide
        </a>.
      </p>
      <button @click="refreshToken">{{ i18nStrings.retry }}</button>
    </div>

    <div v-else-if="isLoadingToken" class="loading">
      Loading {{ builderType }}...
    </div>

    <div v-else-if="tokenError" class="error">
      <p>{{ tokenError }}</p>
      <button @click="refreshToken">Retry</button>
    </div>

    <div
      v-else-if="beefreeToken"
      ref="buildersArea"
      class="builders-area"
      :class="{ 'co-editing': isShared }"
    >
      <div
        class="builder-panel"
        :style="{ width: isShared ? splitPosition + '%' : '100%' }"
        :class="{ dragging: isDragging }"
      >
        <div class="controls">
          <div class="button-group">
            <button :disabled="!builderReady || isExecuting" @click="onPreview(MAIN_CONTAINER)">
              Preview
            </button>
            <button :disabled="!builderReady || isExecuting" @click="onSave(MAIN_CONTAINER)">
              Save
            </button>
            <button :disabled="!builderReady || isExecuting" @click="onSaveAsTemplate(MAIN_CONTAINER)">
              Save as Template
            </button>
            <button v-if="!isShared" :disabled="!builderReady || isExecuting" @click="loadSampleTemplate">
              Load Sample Template
            </button>
            <button :disabled="!builderReady || isExecuting" @click="exportTemplateJson(MAIN_CONTAINER)">
              Export JSON
            </button>
          </div>
        </div>
        <div class="builder-container">
          <Builder
            :token="beefreeToken"
            :config="clientConfig"
            :shared="isShared"
            v-bind="pendingTemplate ? { template: pendingTemplate } : {}"
            @bb-save="onBuilderSave"
            @bb-save-as-template="onBuilderSaveAsTemplate"
            @bb-send="onBuilderSend"
            @bb-error="onBuilderError"
            @bb-session-started="onSessionStarted"
          />
        </div>
      </div>

      <template v-if="isShared">
        <div
          class="split-divider"
          :class="{ dragging: isDragging }"
          role="separator"
          aria-orientation="vertical"
          :aria-valuenow="splitPosition"
          :aria-valuemin="25"
          :aria-valuemax="75"
          aria-label="Resize panels"
          tabindex="0"
          @mousedown="onDividerMouseDown"
          @keydown="onDividerKeyDown"
        >
          <div class="split-divider-handle" />
        </div>
        <div
          class="builder-panel"
          :style="{ width: (100 - splitPosition) + '%' }"
          :class="{ dragging: isDragging }"
        >
          <div class="controls">
            <div class="button-group">
              <button :disabled="!builderReady || isExecuting" @click="onPreview(CO_EDITING_CONTAINER)">
                Preview
              </button>
              <button :disabled="!builderReady || isExecuting" @click="onSave(CO_EDITING_CONTAINER)">
                Save
              </button>
              <button :disabled="!builderReady || isExecuting" @click="onSaveAsTemplate(CO_EDITING_CONTAINER)">
                Save as Template
              </button>
              <button :disabled="!builderReady || isExecuting" @click="exportTemplateJson(CO_EDITING_CONTAINER)">
                Export JSON
              </button>
            </div>
          </div>
          <div class="builder-container">
            <template v-if="secondToken && sessionId">
              <Builder
                :token="secondToken"
                :config="coEditingConfig"
                :shared="true"
                :session-id="sessionId"
                @bb-save="onBuilderSave"
                @bb-save-as-template="onBuilderSaveAsTemplate"
                @bb-send="onBuilderSend"
                @bb-error="onBuilderError"
              />
            </template>
            <div v-else class="loading">Joining session...</div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
export type BuilderType = 'emailBuilder' | 'pageBuilder' | 'popupBuilder' | 'fileManager'
</script>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch, nextTick } from 'vue'
import { Builder, useBuilder } from '@beefree.io/vue-email-builder'
import type { IToken, IEntityContentJson, BeePluginError } from '@beefree.io/sdk/dist/types/bee'
import { getBuilderToken } from './beefree-token'
import { environment } from './environment'

import i18nEnUS from './i18n/en-US.json'
import i18nItIT from './i18n/it-IT.json'
import i18nEsES from './i18n/es-ES.json'
import i18nFrFR from './i18n/fr-FR.json'
import i18nDeDE from './i18n/de-DE.json'
import i18nPtBR from './i18n/pt-BR.json'
import i18nIdID from './i18n/id-ID.json'
import i18nJaJP from './i18n/ja-JP.json'
import i18nZhCN from './i18n/zh-CN.json'
import i18nZhHK from './i18n/zh-HK.json'
import i18nCsCZ from './i18n/cs-CZ.json'
import i18nNbNO from './i18n/nb-NO.json'
import i18nDaDK from './i18n/da-DK.json'
import i18nSvSE from './i18n/sv-SE.json'
import i18nPlPL from './i18n/pl-PL.json'
import i18nHuHU from './i18n/hu-HU.json'
import i18nRuRU from './i18n/ru-RU.json'
import i18nKoKR from './i18n/ko-KR.json'
import i18nNlNL from './i18n/nl-NL.json'
import i18nFiFI from './i18n/fi-FI.json'
import i18nRoRO from './i18n/ro-RO.json'
import i18nSlSI from './i18n/sl-SI.json'

const MAIN_CONTAINER = 'beefree-sdk-builder'
const CO_EDITING_CONTAINER = 'beefree-sdk-builder-2'

interface DescriptionSegment {
  text: string
  style: 'text' | 'bold' | 'code'
}

const props = defineProps<{
  builderType: BuilderType
  builderLanguage: string
}>()

const emit = defineEmits<{
  (e: 'notify', message: string, type: 'success' | 'error' | 'info', title?: string): void
}>()

const beefreeToken = ref<IToken | null>(null)
const isLoadingToken = ref(true)
const tokenError = ref<string | null>(null)
const credentialsError = ref(false)
const isExecuting = ref(false)

const isShared = ref(false)
const sessionId = ref<string | null>(null)
const secondToken = ref<IToken | null>(null)
const splitPosition = ref(50)
const isDragging = ref(false)
const buildersArea = ref<HTMLElement | null>(null)
const pendingTemplate = ref<IEntityContentJson | null>(null)

const builderReady = computed(() =>
  !!beefreeToken.value && !credentialsError.value && !tokenError.value && !isLoadingToken.value,
)

// --- i18n ---

const defaultContentLanguage = { label: 'en-US', value: 'en-US' }

const additionalContentLanguages = [
  { label: 'it-IT', value: 'it-IT' },
  { label: 'es-ES', value: 'es-ES' },
  { label: 'fr-FR', value: 'fr-FR' },
  { label: 'de-DE', value: 'de-DE' },
  { label: 'pt-BR', value: 'pt-BR' },
  { label: 'id-ID', value: 'id-ID' },
  { label: 'ja-JP', value: 'ja-JP' },
  { label: 'zh-CN', value: 'zh-CN' },
  { label: 'zh-HK', value: 'zh-HK' },
  { label: 'cs-CZ', value: 'cs-CZ' },
  { label: 'nb-NO', value: 'nb-NO' },
  { label: 'da-DK', value: 'da-DK' },
  { label: 'sv-SE', value: 'sv-SE' },
  { label: 'pl-PL', value: 'pl-PL' },
  { label: 'hu-HU', value: 'hu-HU' },
  { label: 'ru-RU', value: 'ru-RU' },
  { label: 'ko-KR', value: 'ko-KR' },
  { label: 'nl-NL', value: 'nl-NL' },
  { label: 'fi-FI', value: 'fi-FI' },
  { label: 'ro-RO', value: 'ro-RO' },
  { label: 'sl-SI', value: 'sl-SI' },
]

const i18nMap: Record<string, typeof i18nEnUS> = {
  'en-US': i18nEnUS,
  'it-IT': i18nItIT,
  'es-ES': i18nEsES,
  'fr-FR': i18nFrFR,
  'de-DE': i18nDeDE,
  'pt-BR': i18nPtBR,
  'id-ID': i18nIdID,
  'ja-JP': i18nJaJP,
  'zh-CN': i18nZhCN,
  'zh-HK': i18nZhHK,
  'cs-CZ': i18nCsCZ,
  'nb-NO': i18nNbNO,
  'da-DK': i18nDaDK,
  'sv-SE': i18nSvSE,
  'pl-PL': i18nPlPL,
  'hu-HU': i18nHuHU,
  'ru-RU': i18nRuRU,
  'ko-KR': i18nKoKR,
  'nl-NL': i18nNlNL,
  'fi-FI': i18nFiFI,
  'ro-RO': i18nRoRO,
  'sl-SI': i18nSlSI,
}

const i18nStrings = computed(() =>
  (i18nMap[props.builderLanguage] ?? i18nEnUS).credentials,
)

function interpolate(template: string): DescriptionSegment[] {
  const placeholderMap: Record<string, { text: string; style: 'bold' | 'code' }> = {
    type: { text: props.builderType, style: 'bold' },
    clientId: { text: 'VITE_*_CLIENT_ID', style: 'code' },
    clientSecret: { text: 'VITE_*_CLIENT_SECRET', style: 'code' },
    envFile: { text: 'example/.env', style: 'code' },
  }

  const segments: DescriptionSegment[] = []
  const regex = /\{(\w+)\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: template.slice(lastIndex, match.index), style: 'text' })
    }
    const placeholder = placeholderMap[match[1]]
    if (placeholder) {
      segments.push({ text: placeholder.text, style: placeholder.style })
    } else {
      segments.push({ text: match[0], style: 'text' })
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < template.length) {
    segments.push({ text: template.slice(lastIndex), style: 'text' })
  }

  return segments
}

const descriptionSegments = computed(() =>
  interpolate(i18nStrings.value.description),
)

// --- Builder event handlers ---

function onBuilderSave(args: [string, string, string | null, number, string | null]) {
  const [pageJson, pageHtml, ampHtml, templateVersion, language] = args
  console.log('onSave:', { pageJson, pageHtml, ampHtml, templateVersion, language })
  emit('notify', 'Check console for details.', 'success', 'Design saved')
}

function onBuilderSaveAsTemplate(args: [string, number]) {
  const [pageJson, templateVersion] = args
  console.log('onSaveAsTemplate:', { pageJson, templateVersion })
  emit('notify', 'Check console for details.', 'success', 'Design saved as template')
}

function onBuilderSend(htmlFile: string) {
  console.log('onSend:', htmlFile)
  emit('notify', 'Check console for details.', 'success', 'Template sent')
}

function onBuilderError(error: unknown) {
  const pluginError = error as BeePluginError
  console.error('Beefree error:', pluginError)
  const msg = pluginError.message || JSON.stringify(pluginError)
  if (/co.?editing/i.test(msg) && /(superpowers|enterprise)/i.test(msg)) {
    emit('notify', 'Co-editing is only available on Superpowers or Enterprise plans.', 'error')
  } else {
    emit('notify', msg, 'error', 'Error')
  }
}

// --- Builder configs ---

const clientConfig = reactive({
  uid: 'demo-user',
  container: MAIN_CONTAINER,
  language: props.builderLanguage,
  username: 'User 1',
  userColor: '#00aced',
  userHandle: 'user1',
  templateLanguage: defaultContentLanguage,
  templateLanguages: additionalContentLanguages,
})

const coEditingConfig = reactive({
  uid: 'demo-user-2',
  container: CO_EDITING_CONTAINER,
  language: props.builderLanguage,
  username: 'User 2',
  userColor: '#000000',
  userHandle: 'user2',
  templateLanguage: defaultContentLanguage,
  templateLanguages: additionalContentLanguages,
})

// --- Builder composables ---

const primaryBuilder = useBuilder(clientConfig)
const coEditingBuilder = useBuilder(coEditingConfig)

function getBuilderForContainer(containerId: string) {
  return containerId === MAIN_CONTAINER ? primaryBuilder : coEditingBuilder
}

// --- Auth ---

function isAuthError(error: unknown): boolean {
  return error instanceof Error
    && (
      /^Authentication failed: [45]\d{2}\b/.test(error.message)
      || error.message.startsWith('Invalid credentials:')
    )
}

async function loadBeefreeToken(builderType: BuilderType) {
  try {
    isLoadingToken.value = true
    tokenError.value = null
    credentialsError.value = false

    const token = await getBuilderToken(
      environment[builderType].clientId,
      environment[builderType].clientSecret,
      environment[builderType].userId,
    )

    beefreeToken.value = token
  } catch (error) {
    console.error('Failed to load Beefree token:', error)
    if (isAuthError(error)) {
      credentialsError.value = true
    } else {
      tokenError.value = `Failed to load ${builderType}. Please try again.`
    }
  } finally {
    isLoadingToken.value = false
  }
}

async function refreshToken() {
  await loadBeefreeToken(props.builderType)
}

// --- Template operations ---

async function loadSampleTemplate() {
  try {
    isExecuting.value = true
    const response = await fetch(environment[props.builderType].templateUrl)
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.status} ${response.statusText}`)
    }
    const sampleTemplate: { json: IEntityContentJson } = await response.json()
    primaryBuilder.load(sampleTemplate.json)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Load template failed:', error)
    emit('notify', msg, 'error', 'Load failed')
  } finally {
    isExecuting.value = false
  }
}

async function exportTemplateJson(containerId: string) {
  try {
    isExecuting.value = true
    const builder = getBuilderForContainer(containerId)
    const json = await builder.getTemplateJson()
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Export failed:', error)
    emit('notify', msg, 'error', 'Export failed')
  } finally {
    isExecuting.value = false
  }
}

function onPreview(containerId: string) {
  getBuilderForContainer(containerId).preview()
}

function onSave(containerId: string) {
  getBuilderForContainer(containerId).save()
}

function onSaveAsTemplate(containerId: string) {
  getBuilderForContainer(containerId).saveAsTemplate()
}

// --- Co-editing ---

let toggleGeneration = 0

async function toggleCoEditing() {
  const gen = ++toggleGeneration

  try {
    const result = await primaryBuilder.getTemplateJson()
    if (gen !== toggleGeneration) return
    if (result?.data?.json) {
      pendingTemplate.value = result.data.json
    }
  } catch {
    if (gen !== toggleGeneration) return
  }

  if (isShared.value) {
    stopCoEditing()
  } else {
    isShared.value = true
    reinitializeBuilder()
  }

  nextTick(() => {
    pendingTemplate.value = null
  })
}

function stopCoEditing() {
  isShared.value = false
  sessionId.value = null
  secondToken.value = null
  reinitializeBuilder()
}

function reinitializeBuilder() {
  if (beefreeToken.value) {
    beefreeToken.value = { ...beefreeToken.value }
  }
}

function onSessionStarted(event: { sessionId?: string }) {
  if (event?.sessionId) {
    sessionId.value = event.sessionId
    fetchSecondToken()
  }
}

async function fetchSecondToken() {
  try {
    secondToken.value = await getBuilderToken(
      environment[props.builderType].clientId,
      environment[props.builderType].clientSecret,
      'demo-user-2',
    )
  } catch (error) {
    console.error('Failed to get second token:', error)
  }
}

// --- Draggable split divider ---

function onDividerMouseDown(e: MouseEvent) {
  e.preventDefault()
  isDragging.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  const rect = buildersArea.value!.getBoundingClientRect()
  const pct = ((e.clientX - rect.left) / rect.width) * 100
  splitPosition.value = Math.min(75, Math.max(25, pct))
}

function onMouseUp() {
  isDragging.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

function onDividerKeyDown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    splitPosition.value = Math.max(25, splitPosition.value - 2)
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    splitPosition.value = Math.min(75, splitPosition.value + 2)
  }
}

// --- Watchers ---

watch(() => props.builderType, async (newType) => {
  pendingTemplate.value = null
  if (isShared.value) {
    stopCoEditing()
  }
  await loadBeefreeToken(newType)
})

watch(() => props.builderLanguage, (lang) => {
  clientConfig.language = lang
  coEditingConfig.language = lang
  if (builderReady.value) {
    primaryBuilder.loadConfig({ language: lang })
    if (isShared.value) {
      coEditingBuilder.loadConfig({ language: lang })
    }
  }
})

onMounted(async () => {
  await loadBeefreeToken(props.builderType)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})

defineExpose<{
  builderReady: typeof builderReady
  isExecuting: typeof isExecuting
  isShared: typeof isShared
  toggleCoEditing: typeof toggleCoEditing
}>({
  builderReady,
  isExecuting,
  isShared,
  toggleCoEditing,
})
</script>

<style scoped>
.beefree-example {
  padding: 0;
  margin: 0 auto;
}

.controls {
  background: #262626;
  color: white;
  font-size: 13px;
  padding: 6px 10px;
  min-height: 40px;
  display: flex;
  gap: 5px;
  align-items: center;
  flex-shrink: 0;
}

.button-group {
  display: flex;
  gap: 5px;
  align-items: center;
  flex-wrap: wrap;
}

.button-group button {
  padding: 6px 12px;
  background: var(--ultraviolet);
  color: white;
  border: 1px solid var(--ultraviolet);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 12px;
}

.button-group button:disabled {
  cursor: not-allowed;
  background:
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 4px,
      rgba(255, 255, 255, 0.15) 4px,
      rgba(255, 255, 255, 0.15) 6px
    ),
    var(--ultraviolet);
  opacity: 0.6;
}

.button-group button:hover:not(:disabled) {
  opacity: 0.8;
}

.loading, .error {
  text-align: center;
  padding: 40px;
}

/* Credentials notice */
.credentials-notice {
  max-width: 560px;
  margin: 60px auto;
  padding: 32px;
  background: #eefbf3;
  border: 1px solid #8fe0b0;
  border-radius: 8px;
  color: #333;
  line-height: 1.6;
}

.credentials-notice h2 {
  margin: 0 0 12px;
  font-size: 18px;
  background: linear-gradient(315deg, #42d392 25%, #647eff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}

.credentials-notice code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 13px;
}

.credentials-notice ol {
  padding-left: 20px;
  margin: 12px 0;
}

.credentials-notice a {
  color: #1677ff;
  text-decoration: none;
}

.credentials-notice a:hover {
  text-decoration: underline;
}

.credentials-notice button {
  margin-top: 8px;
  padding: 8px 16px;
  background: linear-gradient(315deg, #42d392 25%, #647eff);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.credentials-notice button:hover {
  opacity: 0.85;
}

.error button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Builders area and split pane */
.builders-area {
  display: flex;
  width: 100%;
  height: calc(100vh - 64px);
  overflow: hidden;
}

.builder-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  min-width: 0;
  position: relative;
}

.builder-panel.dragging {
  pointer-events: none;
}

.builder-container {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.split-divider {
  flex-shrink: 0;
  width: 6px;
  cursor: col-resize;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.split-divider:hover,
.split-divider.dragging {
  background: #b0b0b0;
}

.split-divider:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}

.split-divider-handle {
  width: 2px;
  height: 32px;
  border-radius: 1px;
  background: #999;
}

.split-divider.dragging .split-divider-handle {
  background: #666;
}
</style>

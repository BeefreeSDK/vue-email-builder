<template>
  <div class="beefree-example">
    <div v-if="credentialsError" class="credentials-notice">
      <h2>{{ credentialsStrings.title }}</h2>
      <p>
        <template v-for="(seg, i) in descriptionSegments" :key="i">
          <strong v-if="seg.style === 'bold'">{{ seg.text }}</strong>
          <code v-else-if="seg.style === 'code'">{{ seg.text }}</code>
          <template v-else>
            {{ seg.text }}
          </template>
        </template>
      </p>
      <ol>
        <li>
          <a href="https://developers.beefree.io/console" target="_blank" rel="noopener">
            {{ credentialsStrings.step1 }}
          </a>
        </li>
        <li>{{ credentialsStrings.step2 }}</li>
        <li>{{ credentialsStrings.step3 }}</li>
      </ol>
      <p>
        {{ credentialsStrings.docs }}
        <a href="https://docs.beefree.io/get-started" target="_blank" rel="noopener">
          {{ credentialsStrings.gettingStartedGuide }} </a
        >.
      </p>
      <button @click="refreshToken">
        {{ exampleStrings.retry }}
      </button>
    </div>

    <div v-else-if="isLoadingToken" class="loading">{{ loadingLabel }}</div>

    <div v-else-if="tokenError" class="error">
      <p>{{ tokenError }}</p>
      <button @click="refreshToken">{{ exampleStrings.retry }}</button>
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
            <button
              :disabled="!builderReady || isExecuting || builderType === 'fileManager'"
              @click="onPreview(MAIN_CONTAINER)"
            >
              {{ exampleStrings.preview }}
            </button>
            <button
              :disabled="!builderReady || isExecuting || builderType === 'fileManager'"
              @click="onSave(MAIN_CONTAINER)"
            >
              {{ exampleStrings.save }}
            </button>
            <button
              :disabled="!builderReady || isExecuting || builderType === 'fileManager'"
              @click="onSaveAsTemplate(MAIN_CONTAINER)"
            >
              {{ exampleStrings.saveAsTemplate }}
            </button>
            <button
              v-if="!isShared"
              :disabled="!builderReady || isExecuting || builderType === 'fileManager'"
              @click="onLoadTemplateButton"
            >
              {{ loadTemplateButtonLabel }}
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
          :aria-label="exampleStrings.resizePanels"
          tabindex="0"
          @mousedown="onDividerMouseDown"
          @keydown="onDividerKeyDown"
        >
          <div class="split-divider-handle" />
        </div>
        <div
          class="builder-panel"
          :style="{ width: 100 - splitPosition + '%' }"
          :class="{ dragging: isDragging }"
        >
          <div class="controls">
            <div class="button-group">
              <button
                :disabled="!builderReady || isExecuting || builderType === 'fileManager'"
                @click="onPreview(CO_EDITING_CONTAINER)"
              >
                {{ exampleStrings.preview }}
              </button>
              <button
                :disabled="!builderReady || isExecuting || builderType === 'fileManager'"
                @click="onSave(CO_EDITING_CONTAINER)"
              >
                {{ exampleStrings.save }}
              </button>
              <button
                :disabled="!builderReady || isExecuting || builderType === 'fileManager'"
                @click="onSaveAsTemplate(CO_EDITING_CONTAINER)"
              >
                {{ exampleStrings.saveAsTemplate }}
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
            <div v-else class="loading">{{ exampleStrings.joiningSession }}</div>
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
import { messages } from './i18n'
import type { LocaleCode } from './i18n'
import { downloadFile } from './utils'

const MAIN_CONTAINER = 'beefree-sdk-builder'
const CO_EDITING_CONTAINER = 'beefree-sdk-builder-2'

interface DescriptionSegment {
  text: string
  style: 'text' | 'bold' | 'code'
}

const props = defineProps<{
  builderType: BuilderType
  builderLanguage: LocaleCode
}>()

const emit = defineEmits<{
  (e: 'notify', message: string, type: 'success' | 'error' | 'info', title?: string): void
}>()

const beefreeToken = ref<IToken | null>(null)
const isLoadingToken = ref(true)
const tokenErrorType = ref<BuilderType | null>(null)
const credentialsError = ref(false)
const isExecuting = ref(false)

const isShared = ref(false)
const sessionId = ref<string | null>(null)
const secondToken = ref<IToken | null>(null)
const splitPosition = ref(50)
const isDragging = ref(false)
const buildersArea = ref<HTMLElement | null>(null)
const pendingTemplate = ref<IEntityContentJson | null>(null)
const loadedTemplate = ref<'sample' | 'blank' | null>(null)

const builderReady = computed(
  () =>
    !!beefreeToken.value && !credentialsError.value && !tokenError.value && !isLoadingToken.value,
)

// --- i18n ---

const localeStrings = computed(() => messages[props.builderLanguage] ?? messages['en-US'])
const appStrings = computed(() => localeStrings.value.app)
const exampleStrings = computed(() => localeStrings.value.example)
const credentialsStrings = computed(() => localeStrings.value.credentials)
const localizedBuilderType = computed(() => appStrings.value.builderTypes[props.builderType])
const tokenError = computed(() =>
  tokenErrorType.value
    ? formatMessage(exampleStrings.value.loadFailed, {
        type: appStrings.value.builderTypes[tokenErrorType.value],
      })
    : null,
)
const loadingLabel = computed(() =>
  formatMessage(exampleStrings.value.loading, { type: localizedBuilderType.value }),
)

function formatMessage(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? `{${key}}`)
}

function interpolate(template: string): DescriptionSegment[] {
  const placeholderMap: Record<string, { text: string; style: 'bold' | 'code' }> = {
    type: { text: localizedBuilderType.value, style: 'bold' },
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

const descriptionSegments = computed(() => interpolate(credentialsStrings.value.description))

// --- Builder event handlers ---

function onBuilderSave(args: [string, string, string | null, number, string | null]) {
  const [, pageHtml] = args
  downloadFile(`design-${Date.now()}.html`, pageHtml, 'text/html;charset=utf-8')
}

function onBuilderSaveAsTemplate(args: [string, number]) {
  const [pageJson] = args
  const parsed = typeof pageJson === 'string' ? JSON.parse(pageJson) : pageJson
  const content = JSON.stringify(parsed, null, 2)
  downloadFile(`template-${Date.now()}.json`, content, 'application/json')
}

function onBuilderSend(htmlFile: string) {
  console.log('onSend:', htmlFile)
  emit('notify', exampleStrings.value.checkConsole, 'success', exampleStrings.value.templateSent)
}

function onBuilderError(error: unknown) {
  const pluginError = error as BeePluginError
  console.error('Beefree error:', pluginError)
  const msg = pluginError.message || JSON.stringify(pluginError)
  if (/co.?editing/i.test(msg) && /(superpowers|enterprise)/i.test(msg)) {
    emit('notify', exampleStrings.value.coEditingPlanError, 'error', exampleStrings.value.error)
  } else {
    emit('notify', msg, 'error', exampleStrings.value.error)
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
})

const coEditingConfig = reactive({
  uid: 'demo-user-2',
  container: CO_EDITING_CONTAINER,
  language: props.builderLanguage,
  username: 'User 2',
  userColor: '#000000',
  userHandle: 'user2',
})

// --- Builder composables ---

const primaryBuilder = useBuilder(clientConfig)
const coEditingBuilder = useBuilder(coEditingConfig)

function getBuilderForContainer(containerId: string) {
  return containerId === MAIN_CONTAINER ? primaryBuilder : coEditingBuilder
}

// --- Auth ---

function isAuthError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (/^Authentication failed: [45]\d{2}\b/.test(error.message) ||
      error.message.startsWith('Invalid credentials:'))
  )
}

async function loadBeefreeToken(builderType: BuilderType) {
  try {
    isLoadingToken.value = true
    tokenErrorType.value = null
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
      tokenErrorType.value = builderType
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
    const response = await fetch(environment[props.builderType].sampleTemplateUrl)
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.status} ${response.statusText}`)
    }
    const template = (await response.json()) as IEntityContentJson
    primaryBuilder.load(template)
    loadedTemplate.value = 'sample'
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Load template failed:', error)
    emit('notify', msg, 'error', exampleStrings.value.loadFailedTitle)
  } finally {
    isExecuting.value = false
  }
}

async function loadBlankTemplate() {
  try {
    isExecuting.value = true
    const response = await fetch(environment[props.builderType].blankTemplateUrl)
    if (!response.ok) {
      throw new Error(`Failed to load blank template: ${response.status} ${response.statusText}`)
    }
    const template = (await response.json()) as IEntityContentJson
    primaryBuilder.load(template)
    loadedTemplate.value = 'blank'
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Load blank template failed:', error)
    emit('notify', msg, 'error', exampleStrings.value.loadFailedTitle)
  } finally {
    isExecuting.value = false
  }
}

const loadTemplateButtonLabel = computed(() =>
  loadedTemplate.value === 'sample'
    ? exampleStrings.value.loadBlankTemplate
    : exampleStrings.value.loadSampleTemplate,
)

function onLoadTemplateButton() {
  if (loadedTemplate.value === 'sample') {
    loadBlankTemplate()
  } else {
    loadSampleTemplate()
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

function onSessionStarted(event: unknown) {
  const maybeEvent = event as { sessionId?: string } | undefined
  if (maybeEvent?.sessionId) {
    sessionId.value = maybeEvent.sessionId
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

watch(
  () => props.builderType,
  async (newType) => {
    pendingTemplate.value = null
    loadedTemplate.value = null
    if (isShared.value) {
      stopCoEditing()
    }
    await loadBeefreeToken(newType)
  },
)

watch(
  () => props.builderLanguage,
  (lang) => {
    clientConfig.language = lang
    coEditingConfig.language = lang
    if (builderReady.value) {
      primaryBuilder.loadConfig({ language: lang })
      if (isShared.value) {
        coEditingBuilder.loadConfig({ language: lang })
      }
    }
  },
)

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

.loading,
.error {
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

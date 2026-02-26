<template>
  <main class="main">
    <header>
      <div class="left-side">
        <img src="/images/logo.svg" height="40" alt="Beefree SDK" />
      </div>
      <div class="right-side">
        <div class="header-controls">
          <div class="header-select-group">
            <label for="headerBuilderType">{{ appStrings.builderLabel }}</label>
            <select id="headerBuilderType" v-model="selectedBuilderType">
              <option
                v-for="builder in builderTypeOptions"
                :key="builder.value"
                :value="builder.value"
              >
                {{ builder.label }}
              </option>
            </select>
          </div>
          <div class="header-select-group">
            <label for="headerLanguage">{{ appStrings.languageLabel }}</label>
            <select id="headerLanguage" v-model="selectedBuilderLanguage">
              <option v-for="lang in uiLanguages" :key="lang" :value="lang">
                {{ lang }}
              </option>
            </select>
          </div>
          <button
            class="co-editing-btn"
            :disabled="
              !beefreeRef?.builderReady ||
              beefreeRef?.isExecuting ||
              selectedBuilderType === 'fileManager'
            "
            :class="{ active: beefreeRef?.isShared }"
            @click="beefreeRef?.toggleCoEditing()"
          >
            {{ appStrings.coEditing }}
          </button>
        </div>
        <img src="/images/vue-wordmark-white.svg" alt="Vue.js" />
      </div>
    </header>
    <div class="content">
      <BeefreeExample
        ref="beefreeRef"
        :builder-type="selectedBuilderType"
        :builder-language="selectedBuilderLanguage"
        @notify="handleNotify"
      />
    </div>
  </main>

  <Transition name="toast">
    <div v-if="toast" class="toast" :class="'toast-' + toast.type">
      <h3 v-if="toast.title" :class="{ 'error-title': toast.type === 'error' }">
        {{ toast.title }}
      </h3>
      <p>{{ toast.message }}</p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import BeefreeExample from './BeefreeExample.vue'
import type { BuilderType } from './BeefreeExample.vue'
import { messages, uiLanguages } from './i18n'
import type { LocaleCode } from './i18n'

interface Toast {
  message: string
  type: 'success' | 'error' | 'info'
  title?: string
}

const toast = ref<Toast | null>(null)
const selectedBuilderType = ref<BuilderType>('emailBuilder')
const selectedBuilderLanguage = ref<LocaleCode>('en-US')
const beefreeRef = ref<InstanceType<typeof BeefreeExample> | null>(null)

let showTimerId: ReturnType<typeof setTimeout> | undefined
let hideTimerId: ReturnType<typeof setTimeout> | undefined

const localeStrings = computed(() => messages[selectedBuilderLanguage.value] ?? messages['en-US'])
const appStrings = computed(() => localeStrings.value.app)

const builderTypeOptions = computed<{ value: BuilderType; label: string }[]>(() => [
  { value: 'emailBuilder', label: appStrings.value.builderTypes.emailBuilder },
  { value: 'pageBuilder', label: appStrings.value.builderTypes.pageBuilder },
  { value: 'popupBuilder', label: appStrings.value.builderTypes.popupBuilder },
  { value: 'fileManager', label: appStrings.value.builderTypes.fileManager },
])

function handleNotify(
  message: string,
  type: 'success' | 'error' | 'info',
  title?: string,
  durationMs = 5000,
) {
  clearTimeout(showTimerId)
  clearTimeout(hideTimerId)

  toast.value = { message, type, title }

  hideTimerId = setTimeout(() => {
    toast.value = null
  }, durationMs)
}

onMounted(() => {
  showTimerId = setTimeout(() => {
    handleNotify(appStrings.value.welcomeMessage, 'success', appStrings.value.welcomeTitle)
  }, 500)
})

onUnmounted(() => {
  clearTimeout(showTimerId)
  clearTimeout(hideTimerId)
})
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
}

:root {
  --bright-blue: oklch(51.01% 0.274 263.83);
  --electric-violet: oklch(53.18% 0.28 296.97);
  --ultraviolet: #7638ff;
  --french-violet: oklch(47.66% 0.246 305.88);
  --vivid-pink: oklch(69.02% 0.277 332.77);
  --hot-red: oklch(61.42% 0.238 15.34);
  --orange-red: oklch(63.32% 0.24 31.68);

  --gray-900: oklch(19.37% 0.006 300.98);
  --gray-700: oklch(36.98% 0.014 302.71);
  --gray-400: oklch(70.9% 0.015 304.04);
  --gray-200: oklch(88.89% 0.015 304.04);

  --white-to-vue-horizontal-gradient: linear-gradient(
    90deg,
    #ffffff 0%,
    #ffffff 40%,
    #42d392 65%,
    #647eff 82%,
    #7638ff 100%
  );

  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif,
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol';
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1 {
  font-size: 1.6rem;
  font-weight: 500;
  margin: 0;
}

p {
  margin: 0;
}

header {
  display: flex;
  height: 64px;
}

header .left-side {
  display: flex;
  align-items: center;
  padding-left: 1rem;
}

header .right-side {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-grow: 1;
  padding-right: 1rem;
  gap: 20px;
  background: var(--white-to-vue-horizontal-gradient);
  height: 100%;
}

header .right-side img {
  height: 28px;
  width: auto;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-select-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-select-group label {
  font-size: 13px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

.header-select-group select {
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  padding: 6px 28px 6px 10px;
  font-size: 13px;
  cursor: pointer;
  background-image: url('data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M7 10l5 5 5-5z" fill="white"/><path d="M0 0h24v24H0z" fill="none"/></svg>');
  background-repeat: no-repeat;
  background-position: right 4px center;
  background-size: 18px;
}

.header-select-group select option {
  background: #333;
  color: white;
}

.co-editing-btn {
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.co-editing-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.co-editing-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
}

.co-editing-btn.active {
  background: #28a745;
  border-color: #28a745;
}

.main {
  width: 100%;
  min-height: 100%;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  box-sizing: inherit;
  position: relative;
}

header,
.content {
  margin: 0;
  align-items: center;
  width: 100%;
}

.content {
  height: calc(100vh - 64px);
}

.toast {
  position: fixed;
  top: 4.75rem;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border-radius: 12px;
  padding: 20px 28px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  min-width: 280px;
  max-width: 420px;
  border-left: 4px solid;
}

.toast-success {
  border-left-color: #16a34a;
}
.toast-error {
  border-left-color: #dc2626;
}
.toast-info {
  border-left-color: #2563eb;
}

.toast h3 {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--gray-900);
}

.toast h3.error-title {
  color: #dc2626;
}

.toast p {
  margin: 0;
  font-size: 13px;
  color: var(--gray-700);
  line-height: 1.4;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-enter-from,
.toast-leave-to {
  transform: translateX(-50%) translateY(-30px);
  opacity: 0;
}
</style>

import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { waitFor } from '@testing-library/dom'

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../beefree-token')
})

describe('BeefreeExample interpolate edge cases', () => {
  it('handles descriptions ending with a placeholder', async () => {
    vi.resetModules()
    vi.doMock('../beefree-token', () => ({
      getBuilderToken: vi
        .fn()
        .mockRejectedValue(new Error('Authentication failed: 401 Unauthorized')),
    }))
    const { default: BeefreeExample } = await import('../BeefreeExample.vue')
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })

    await waitFor(() => expect(wrapper.find('.credentials-notice').exists()).toBe(true), {
      timeout: 2000,
    })
    expect(wrapper.text()).toContain('Email Builder')
    expect(wrapper.text()).toContain('example/.env')
  })

  it('keeps unknown placeholders and uses format fallback for missing tokens', async () => {
    vi.resetModules()
    let rejectToken!: (reason: unknown) => void
    vi.doMock('../beefree-token', () => ({
      getBuilderToken: vi.fn(
        () =>
          new Promise((_, reject) => {
            rejectToken = reject
          }),
      ),
    }))
    vi.doMock('../i18n', () => ({
      messages: {
        'en-US': {
          app: {
            builderLabel: 'Builder:',
            languageLabel: 'Language:',
            coEditing: 'Co-editing',
            builderTypes: {
              emailBuilder: 'Email Builder',
              pageBuilder: 'Page Builder',
              popupBuilder: 'Popup Builder',
              fileManager: 'File Manager',
            },
            welcomeTitle: 'Welcome',
            welcomeMessage: 'Welcome message',
          },
          example: {
            loading: 'Loading {missingToken}...',
            retry: 'Retry',
            preview: 'Preview',
            save: 'Save',
            saveAsTemplate: 'Save as Template',
            loadSampleTemplate: 'Load Sample Template',
            loadBlankTemplate: 'Load Blank Template',
            joiningSession: 'Joining session...',
            resizePanels: 'Resize panels',
            checkConsole: 'Check console',
            templateSent: 'Template sent',
            coEditingPlanError: 'Co-editing plan error',
            error: 'Error',
            loadFailed: 'Failed to load {missingType}.',
            loadFailedTitle: 'Load failed',
          },
          credentials: {
            title: 'Invalid credentials',
            description: 'Auth failed for {unknownPlaceholder}',
            step1: 'Step 1',
            step2: 'Step 2',
            step3: 'Step 3',
            docs: 'Docs',
            retry: 'Retry',
            gettingStartedGuide: 'Getting Started guide',
          },
        },
      },
    }))

    const { default: BeefreeExample } = await import('../BeefreeExample.vue')
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })

    expect(wrapper.text()).toContain('Loading {missingToken}...')

    rejectToken(new Error('Authentication failed: 401 Unauthorized'))

    await waitFor(() => expect(wrapper.find('.credentials-notice').exists()).toBe(true), {
      timeout: 2000,
    })
    expect(wrapper.text()).toContain('{unknownPlaceholder}')
  })
})

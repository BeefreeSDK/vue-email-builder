import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { waitFor } from '@testing-library/dom'

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../beefree-token')
  vi.doUnmock('../i18n/en-US.json')
})

describe('BeefreeExample interpolate edge cases', () => {
  it('handles descriptions ending with a placeholder', async () => {
    vi.resetModules()
    vi.doMock('../beefree-token', () => ({
      getBuilderToken: vi.fn().mockRejectedValue(new Error('Authentication failed: 401 Unauthorized')),
    }))
    vi.doMock('../i18n/en-US.json', () => ({
      default: {
        credentials: {
          title: 'Invalid credentials',
          description: 'Auth failed for {type} in {envFile}',
          step1: 'Step 1',
          step2: 'Step 2',
          step3: 'Step 3',
          docs: 'Docs',
          retry: 'Retry',
        },
      },
    }))

    const { default: BeefreeExample } = await import('../BeefreeExample.vue')
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })

    await waitFor(() => expect(wrapper.find('.credentials-notice').exists()).toBe(true), { timeout: 2000 })
    expect(wrapper.text()).toContain('emailBuilder')
    expect(wrapper.text()).toContain('example/.env')
  })
})

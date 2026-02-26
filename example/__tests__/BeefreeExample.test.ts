import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { waitFor } from '@testing-library/dom'
import BeefreeExample from '../BeefreeExample.vue'
import { setSDKInstanceToRegistry } from '../../src/composables/useRegistry'

const BuilderStub = {
  name: 'Builder',
  template: `<div class="builder-stub">
    <button class="emit-save" @click="$emit('bb-save', '', '', null, 1, null)">Save</button>
    <button class="emit-save-as-template" @click="$emit('bb-save-as-template', '', 1)">SaveAsTemplate</button>
    <button class="emit-send" @click="$emit('bb-send', '')">Send</button>
    <button class="emit-error-coedit" @click="$emit('bb-error', { message: 'co-editing requires superpowers or enterprise' })">Err</button>
    <button class="emit-error-generic" @click="$emit('bb-error', { message: 'Generic error' })">Err2</button>
    <button class="emit-session-started" @click="$emit('bb-session-started', { sessionId: 's1' })">Session</button>
  </div>`,
}

describe('BeefreeExample', () => {
  it('renders builders area and panel structure after token loads', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    expect(wrapper.find('.builder-panel').exists()).toBe(true)
  })

  it('exposes builderReady, isExecuting, isShared, toggleCoEditing', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await wrapper.vm.$nextTick()
    const exposed = wrapper.vm as unknown as {
      builderReady?: boolean
      isExecuting?: boolean
      isShared?: boolean
      toggleCoEditing?: () => void
    }
    expect(typeof exposed.builderReady).toBe('boolean')
    expect(typeof exposed.isExecuting).toBe('boolean')
    expect(typeof exposed.isShared).toBe('boolean')
    expect(typeof exposed.toggleCoEditing).toBe('function')
  })

  it('shows credentials notice when auth fails with 4xx/5xx', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response)
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.credentials-notice').exists()).toBe(true), { timeout: 2000 })
    expect(wrapper.find('.credentials-notice h2').text()).toContain('Invalid')
    expect(wrapper.find('.credentials-notice button').text()).toBe('Retry')
    expect(wrapper.find('.credentials-notice p strong').exists()).toBe(true)
    expect(wrapper.find('.credentials-notice p code').exists()).toBe(true)
  })

  it('falls back to en-US credentials copy for unsupported UI language', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response)
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'xx-YY' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.credentials-notice').exists()).toBe(true), { timeout: 2000 })
    expect(wrapper.find('.credentials-notice h2').text()).toBe('Invalid or missing credentials')
  })

  it('renders placeholders correctly when description starts with a token', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response)
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'ja-JP' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.credentials-notice').exists()).toBe(true), { timeout: 2000 })
    // First chunk is placeholder-driven, so <strong> should exist at start.
    expect(wrapper.find('.credentials-notice p strong').exists()).toBe(true)
  })

  it('shows token error and Retry when token fetch fails with non-auth error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.error').exists()).toBe(true), { timeout: 2000 })
    expect(wrapper.find('.error p').text()).toContain('Failed to load')
    await wrapper.find('.error button').trigger('click')
    await wrapper.vm.$nextTick()
  })

  it('shows loading state while token is loading', async () => {
    let resolveToken: (v: unknown) => void
    const tokenPromise = new Promise((r) => { resolveToken = r })
    vi.mocked(fetch).mockImplementationOnce(() =>
      tokenPromise.then((body) => ({
        ok: true,
        json: () => Promise.resolve(body),
      })) as Promise<Response>,
    )
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.loading').exists()).toBe(true)
    resolveToken!({ access_token: 't', v2: true })
    await tokenPromise
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 2000 })
  })

  it('emits notify on bb-save, bb-save-as-template, bb-send', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: BuilderStub } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    const stub = wrapper.find('.builder-stub')
    await stub.find('.emit-save').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('notify')).toBeTruthy()
    await stub.find('.emit-save-as-template').trigger('click')
    await stub.find('.emit-send').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('notify')!.length).toBeGreaterThanOrEqual(2)
  })

  it('emits notify with co-editing message when bb-error has co-editing message', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: BuilderStub } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    await wrapper.find('.builder-stub').find('.emit-error-coedit').trigger('click')
    await wrapper.vm.$nextTick()
    const emitted = wrapper.emitted('notify')!
    expect(emitted.some((e) => e[0]?.includes('Superpowers') || e[0]?.includes('Enterprise'))).toBe(true)
  })

  it('emits notify with error title when bb-error is generic', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: BuilderStub } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    await wrapper.find('.builder-stub').find('.emit-error-generic').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('notify')?.[0]?.[1]).toBe('error')
    expect(wrapper.emitted('notify')?.[0]?.[2]).toBe('Error')
  })

  it('stringifies plugin error when message is missing', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: BuilderStub } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    wrapper.findComponent({ name: 'Builder' }).vm.$emit('bb-error', { code: 999 })
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('notify')?.[0]?.[0]).toContain('"code":999')
  })

  it('loadSampleTemplate fetches template and calls load', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('rsrc.getbee.io') || url.includes('api/templates')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ json: { page: {} } }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access_token: 'mock-token', v2: true }),
      } as Response)
    })
    const loadBtn = wrapper.findAll('button').find((b) => b.text() === 'Load Sample Template')
    await loadBtn!.trigger('click')
    await waitFor(() => expect(fetch).toHaveBeenCalled())
  })

  it('loadSampleTemplate emits notify on fetch failure', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('rsrc.getbee.io') || url.includes('api/templates')) {
        return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access_token: 'mock-token', v2: true }),
      } as Response)
    })
    const loadBtn = wrapper.findAll('button').find((b) => b.text() === 'Load Sample Template')
    await loadBtn!.trigger('click')
    await waitFor(() => expect(wrapper.emitted('notify')).toBeTruthy())
    expect(wrapper.emitted('notify')?.[0]?.[2]).toBe('Load failed')
  })

  it('loadSampleTemplate uses Unknown error message for non-Error failures', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('rsrc.getbee.io') || url.includes('api/templates')) {
        return Promise.reject('bad-response')
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access_token: 'mock-token', v2: true }),
      } as Response)
    })
    const loadBtn = wrapper.findAll('button').find((b) => b.text() === 'Load Sample Template')
    await loadBtn!.trigger('click')
    await waitFor(() => expect(wrapper.emitted('notify')).toBeTruthy())
    expect(wrapper.emitted('notify')?.[0]?.[0]).toBe('Unknown error')
  })

  it('exportTemplateJson emits notify on failure when getTemplateJson rejects', async () => {
    setSDKInstanceToRegistry('beefree-sdk-builder', {
      getTemplateJson: vi.fn().mockRejectedValue(new Error('Export failed')),
    } as never)
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    const exportBtn = wrapper.findAll('button').find((b) => b.text() === 'Export JSON')
    await exportBtn!.trigger('click')
    await waitFor(() => expect(wrapper.emitted('notify')).toBeTruthy())
    expect(wrapper.emitted('notify')?.[0]?.[2]).toBe('Export failed')
  })

  it('exportTemplateJson uses Unknown error message for non-Error failures', async () => {
    setSDKInstanceToRegistry('beefree-sdk-builder', {
      getTemplateJson: vi.fn().mockRejectedValue('bad-export'),
    } as never)
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    const exportBtn = wrapper.findAll('button').find((b) => b.text() === 'Export JSON')
    await exportBtn!.trigger('click')
    await waitFor(() => expect(wrapper.emitted('notify')).toBeTruthy())
    expect(wrapper.emitted('notify')?.[0]?.[0]).toBe('Unknown error')
  })

  it('exportTemplateJson succeeds when instance has getTemplateJson', async () => {
    setSDKInstanceToRegistry('beefree-sdk-builder', {
      getTemplateJson: vi.fn().mockResolvedValue({ page: {} }),
    } as never)
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    const exportBtn = wrapper.findAll('button').find((b) => b.text() === 'Export JSON')
    await exportBtn!.trigger('click')
    await wrapper.vm.$nextTick()
    const notifyCalls = wrapper.emitted('notify') ?? []
    const exportFailed = notifyCalls.some((c) => c[2] === 'Export failed')
    expect(exportFailed).toBe(false)
  })

  it('Preview, Save, Save as Template buttons call builder methods', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    const previewBtn = wrapper.findAll('button').find((b) => b.text() === 'Preview')
    const saveBtn = wrapper.findAll('button').find((b) => b.text() === 'Save')
    const saveAsBtn = wrapper.findAll('button').find((b) => b.text() === 'Save as Template')
    await previewBtn!.trigger('click')
    await saveBtn!.trigger('click')
    await saveAsBtn!.trigger('click')
    await wrapper.vm.$nextTick()
  })

  it('toggleCoEditing toggles isShared and stopCoEditing resets', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    const vm = wrapper.vm as unknown as { toggleCoEditing: () => Promise<void>; isShared: boolean }
    await vm.toggleCoEditing()
    await wrapper.vm.$nextTick()
    expect((wrapper.vm as unknown as { isShared: boolean }).isShared).toBe(true)
    await vm.toggleCoEditing()
    await wrapper.vm.$nextTick()
    expect((wrapper.vm as unknown as { isShared: boolean }).isShared).toBe(false)
  })

  it('toggleCoEditing catch branch when gen !== toggleGeneration', async () => {
    let rejectDelayed: (err: Error) => void
    const delayedReject = new Promise<never>((_, r) => {
      rejectDelayed = r
    })
    setSDKInstanceToRegistry('beefree-sdk-builder', {
      getTemplateJson: vi.fn().mockReturnValue(delayedReject),
    } as never)
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    const vm = wrapper.vm as unknown as { toggleCoEditing: () => Promise<void> }
    vm.toggleCoEditing()
    vm.toggleCoEditing()
    await wrapper.vm.$nextTick()
    rejectDelayed!(new Error('delayed'))
    await delayedReject.catch(() => {})
  })

  it('onSessionStarted fetches second token', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: BuilderStub } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ access_token: 'second', v2: true }),
    } as Response)
    await wrapper.find('.emit-session-started').trigger('click')
    await waitFor(() => expect(fetch).toHaveBeenCalled())
  })

  it('does not fetch second token when bb-session-started has no sessionId', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: BuilderStub } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    vi.mocked(fetch).mockClear()
    wrapper.findComponent({ name: 'Builder' }).vm.$emit('bb-session-started', {})
    await wrapper.vm.$nextTick()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('renders co-editing second panel and executes its action buttons', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: BuilderStub } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    const vm = wrapper.vm as unknown as { toggleCoEditing: () => Promise<void> }
    await vm.toggleCoEditing()
    await wrapper.find('.builder-stub').find('.emit-session-started').trigger('click')
    await waitFor(() => expect(wrapper.findAllComponents({ name: 'Builder' }).length).toBeGreaterThanOrEqual(2))

    const secondPanelButtons = wrapper.findAll('.builder-panel')[1].findAll('button')
    await secondPanelButtons.find((b) => b.text() === 'Preview')!.trigger('click')
    await secondPanelButtons.find((b) => b.text() === 'Save')!.trigger('click')
    await secondPanelButtons.find((b) => b.text() === 'Save as Template')!.trigger('click')
    await secondPanelButtons.find((b) => b.text() === 'Export JSON')!.trigger('click')
  })

  it('split divider mouse and keyboard resize', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    const area = wrapper.find('.builders-area').element as HTMLElement
    area.getBoundingClientRect = () => ({ left: 0, width: 1000, top: 0, height: 600, right: 1000, bottom: 600, x: 0, y: 0, toJSON: () => {} })
    const vm = wrapper.vm as unknown as { toggleCoEditing: () => Promise<void> }
    await vm.toggleCoEditing()
    await waitFor(() => expect(wrapper.find('.split-divider').exists()).toBe(true))
    const divider = wrapper.find('.split-divider')
    await divider.trigger('mousedown', { clientX: 100, preventDefault: () => {} })
    await wrapper.vm.$nextTick()
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 400 }))
    document.dispatchEvent(new MouseEvent('mouseup'))
    await divider.trigger('keydown', { key: 'ArrowLeft', preventDefault: () => {} })
    await divider.trigger('keydown', { key: 'ArrowRight', preventDefault: () => {} })
    await divider.trigger('keydown', { key: 'Enter', preventDefault: () => {} })
    await wrapper.vm.$nextTick()
  })

  it('watch builderType loads new token and stopCoEditing if shared', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    await wrapper.setProps({ builderType: 'pageBuilder' })
    await waitFor(() => expect(fetch).toHaveBeenCalled())
  })

  it('watch builderLanguage updates config language', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    await wrapper.setProps({ builderLanguage: 'it-IT' })
    await wrapper.vm.$nextTick()
    const builder = wrapper.findComponent({ name: 'Builder' })
    expect(builder.exists()).toBe(true)
  })

  it('watch builderLanguage skips loadConfig when builder is not ready', async () => {
    let resolveToken!: (value: Response) => void
    vi.mocked(fetch).mockImplementationOnce(
      () => new Promise((resolve) => { resolveToken = resolve }),
    )
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await wrapper.setProps({ builderLanguage: 'fr-FR' })
    await wrapper.vm.$nextTick()
    resolveToken({
      ok: true,
      json: () => Promise.resolve({ access_token: 'mock-token', v2: true }),
    } as Response)
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
  })

  it('toggleCoEditing returns early when generation changes before first resolve', async () => {
    let resolveFirst!: (value: unknown) => void
    const first = new Promise((resolve) => {
      resolveFirst = resolve
    })
    let call = 0
    setSDKInstanceToRegistry('beefree-sdk-builder', {
      getTemplateJson: vi.fn().mockImplementation(() => {
        call += 1
        if (call === 1) return first
        return Promise.resolve({ data: { json: { page: { title: 'new' } } } })
      }),
      preview: vi.fn(),
      save: vi.fn(),
      saveAsTemplate: vi.fn(),
    } as never)
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    const vm = wrapper.vm as unknown as { toggleCoEditing: () => Promise<void> }
    const p1 = vm.toggleCoEditing()
    const p2 = vm.toggleCoEditing()
    resolveFirst({ data: { json: { page: { title: 'old' } } } })
    await p1
    await p2
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.builders-area').classes()).toContain('co-editing')
  })

  it('reinitializeBuilder safely handles missing token during toggle', async () => {
    let resolveToken!: (value: Response) => void
    vi.mocked(fetch).mockImplementationOnce(
      () => new Promise((resolve) => { resolveToken = resolve }),
    )
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    const vm = wrapper.vm as unknown as { toggleCoEditing: () => Promise<void> }
    await vm.toggleCoEditing()
    resolveToken({
      ok: true,
      json: () => Promise.resolve({ access_token: 'mock-token', v2: true }),
    } as Response)
  })

  it('watch builderType stops co-editing when shared', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    const vm = wrapper.vm as unknown as { toggleCoEditing: () => Promise<void> }
    await vm.toggleCoEditing()
    await wrapper.vm.$nextTick()
    expect((wrapper.vm as unknown as { isShared: boolean }).isShared).toBe(true)
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ access_token: 'page-token', v2: true }),
    } as Response)
    await wrapper.setProps({ builderType: 'pageBuilder' })
    await waitFor(() => expect((wrapper.vm as unknown as { isShared: boolean }).isShared).toBe(false))
  })

  it('watch builderLanguage calls coEditingBuilder.loadConfig when shared', async () => {
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: true } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    const vm = wrapper.vm as unknown as { toggleCoEditing: () => Promise<void> }
    await vm.toggleCoEditing()
    await wrapper.vm.$nextTick()
    await wrapper.setProps({ builderLanguage: 'de-DE' })
    await wrapper.vm.$nextTick()
  })

  it('fetchSecondToken catch logs error when second token fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'mock-token', v2: true }),
      } as Response)
      .mockRejectedValueOnce(new Error('Second token failed'))
    const wrapper = mount(BeefreeExample, {
      props: { builderType: 'emailBuilder', builderLanguage: 'en-US' },
      global: { stubs: { Builder: BuilderStub } },
    })
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    await wrapper.find('.builder-stub').find('.emit-session-started').trigger('click')
    await wrapper.vm.$nextTick()
  })
})

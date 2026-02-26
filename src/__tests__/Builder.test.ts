import { mount } from '@vue/test-utils'
import { waitFor } from '@testing-library/dom'
import BeefreeSDK from '@beefree.io/sdk'
import { IBeeConfig, IEntityContentJson, IToken } from '@beefree.io/sdk/dist/types/bee'
import Builder from '../components/Builder.vue'
import { setConfigInRegistry } from '../composables/useRegistry'

describe('Builder Component', () => {
  const mockToken: IToken = {
    access_token: 'test-token',
    v2: true,
  }

  const config: IBeeConfig = { container: 'test-container', uid: 'test-uid' }
  const mockTemplate: IEntityContentJson = {
    comments: {},
    page: {
      body: {
        type: '',
        webFonts: [],
        container: {
          style: {
            'background-color': '',
          },
        },
        content: {
          style: {
            'font-family': '',
            'color': '',
          },
          computedStyle: {
            align: '',
            linkColor: '',
            messageBackgroundColor: '',
            messageWidth: '',
          },
        },
      },
      description: '',
      rows: [],
      template: {
        name: '',
        type: '',
        version: '',
      },
      title: 'a title',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setConfigInRegistry('test-container', config)
  })

  it('renders container div with default height and width', () => {
    const wrapper = mount(Builder, {
      props: {
        token: mockToken,
        template: mockTemplate,
        config,
      },
    })

    const div = wrapper.find('#test-container')
    expect(div.exists()).toBe(true)
    expect(div.attributes('style')).toContain('width: 100%')
    expect(div.attributes('style')).toContain('height: 100%')
  })

  it('uses DEFAULT_CONTAINER when config has no container', () => {
    const mockStart = vi.fn().mockResolvedValue(undefined)
    ;(BeefreeSDK as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      start: mockStart,
      join: vi.fn(),
      loadConfig: vi.fn(),
    }))

    const wrapper = mount(Builder, {
      props: {
        token: mockToken,
        template: mockTemplate,
        config: { uid: 'test-uid' } as IBeeConfig,
      },
    })

    const defaultContainer = wrapper.find('#beefree-sdk-container')
    expect(defaultContainer.exists()).toBe(true)
  })

  it('passes empty template object when template prop is null', () => {
    const mockStart = vi.fn().mockResolvedValue(undefined)
    ;(BeefreeSDK as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      start: mockStart,
      join: vi.fn(),
      loadConfig: vi.fn(),
    }))

    mount(Builder, {
      props: {
        token: mockToken,
        template: null,
        config,
      },
    })

    expect(mockStart).toHaveBeenCalledWith(
      expect.anything(),
      {},
      undefined,
      expect.anything(),
    )
  })

  it('renders container div with custom height and width', () => {
    const wrapper = mount(Builder, {
      props: {
        token: mockToken,
        template: mockTemplate,
        config,
        height: '600px',
        width: '80%',
      },
    })

    const div = wrapper.find('#test-container')
    expect(div.attributes('style')).toContain('height: 600px')
    expect(div.attributes('style')).toContain('width: 80%')
  })

  it('calls start when no sessionId', () => {
    const mockStart = vi.fn().mockResolvedValue(undefined);
    (BeefreeSDK as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      start: mockStart,
      join: vi.fn(),
      loadConfig: vi.fn(),
    }))

    mount(Builder, {
      props: {
        token: mockToken,
        template: mockTemplate,
        config,
      },
    })

    expect(mockStart).toHaveBeenCalled()
  })

  it('calls join when shared and sessionId provided', () => {
    const mockJoin = vi.fn().mockResolvedValue(undefined);
    (BeefreeSDK as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      start: vi.fn(),
      join: mockJoin,
      loadConfig: vi.fn(),
    }))

    mount(Builder, {
      props: {
        token: mockToken,
        template: mockTemplate,
        config,
        shared: true,
        sessionId: 'test-session',
      },
    })

    expect(mockJoin).toHaveBeenCalledWith(
      expect.objectContaining({ container: 'test-container' }),
      'test-session',
      undefined,
    )
  })

  it('emits bb-error when token is missing', () => {
    const wrapper = mount(Builder, {
      props: {
        token: undefined as unknown as IToken,
        template: mockTemplate,
        config,
      },
    })

    const errorEvents = wrapper.emitted('bb-error')
    expect(errorEvents).toBeTruthy()
    expect(errorEvents![0][0]).toEqual(
      expect.objectContaining({ message: expect.stringContaining('token') }),
    )
  })

  it('emits bb-error when uid is missing in config', () => {
    const wrapper = mount(Builder, {
      props: {
        token: mockToken,
        template: mockTemplate,
        config: { container: 'test-container' } as IBeeConfig,
      },
    })

    const errorEvents = wrapper.emitted('bb-error')
    expect(errorEvents).toBeTruthy()
    expect(errorEvents![0][0]).toEqual(
      expect.objectContaining({ message: expect.stringContaining('uid') }),
    )
  })

  it('calls config onSave then emits bb-save when SDK invokes callback', async () => {
    const onSave = vi.fn()
    const mockStart = vi.fn().mockImplementation((mergedConfig: IBeeConfig) => {
      mergedConfig.onSave?.('pageJson', 'pageHtml', null, 1, null)
      return Promise.resolve()
    })
    ;(BeefreeSDK as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      start: mockStart,
      join: vi.fn(),
      loadConfig: vi.fn(),
    }))

    const wrapper = mount(Builder, {
      props: {
        token: mockToken,
        template: mockTemplate,
        config: { ...config, onSave },
      },
    })

    await waitFor(() => expect(mockStart).toHaveBeenCalled())
    expect(onSave).toHaveBeenCalledWith('pageJson', 'pageHtml', null, 1, null)
    const saveEvents = wrapper.emitted('bb-save')
    expect(saveEvents).toBeTruthy()
    expect(saveEvents![0][0]).toEqual(['pageJson', 'pageHtml', null, 1, null])
  })

  it('calls syncCallbacks when config changes after editor is ready', async () => {
    const mockLoadConfig = vi.fn().mockResolvedValue(undefined)
    const mockStart = vi.fn().mockResolvedValue(undefined)
    ;(BeefreeSDK as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      start: mockStart,
      join: vi.fn(),
      loadConfig: mockLoadConfig,
    }))

    const wrapper = mount(Builder, {
      props: {
        token: mockToken,
        template: mockTemplate,
        config: { ...config },
      },
    })

    await waitFor(() => expect(mockStart).toHaveBeenCalled())
    mockLoadConfig.mockClear()
    await wrapper.setProps({ config: { ...config, language: 'it-IT' } })
    await waitFor(() => expect(mockLoadConfig).toHaveBeenCalled())
  })

  it('does not call syncCallbacks when config changes before editor is ready', async () => {
    const mockLoadConfig = vi.fn()
    let resolveStart: () => void = () => {}
    const startPromise = new Promise<void>((r) => {
      resolveStart = r
    })
    const mockStart = vi.fn().mockReturnValue(startPromise)
    ;(BeefreeSDK as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      start: mockStart,
      join: vi.fn(),
      loadConfig: mockLoadConfig,
    }))

    const wrapper = mount(Builder, {
      props: {
        token: mockToken,
        template: mockTemplate,
        config: { ...config },
      },
    })

    await waitFor(() => expect(mockStart).toHaveBeenCalled())
    await wrapper.setProps({ config: { ...config, uid: 'other-uid' } })
    expect(mockLoadConfig).not.toHaveBeenCalled()
    resolveStart()
  })

  it('calls onWarning when syncCallbacks loadConfig fails with code 3001', async () => {
    const onWarning = vi.fn()
    const mockLoadConfig = vi.fn().mockRejectedValue({ code: 3001 })
    const mockStart = vi.fn().mockResolvedValue(undefined)
    ;(BeefreeSDK as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      start: mockStart,
      join: vi.fn(),
      loadConfig: mockLoadConfig,
    }))

    const wrapper = mount(Builder, {
      props: {
        token: mockToken,
        template: mockTemplate,
        config: { ...config, onWarning },
      },
    })

    await waitFor(() => expect(mockStart).toHaveBeenCalled())
    await wrapper.setProps({ config: { ...config, language: 'de-DE', onWarning } })
    await waitFor(() => expect(onWarning).toHaveBeenCalled(), { timeout: 2000 })
  })

  it('calls onError when syncCallbacks loadConfig fails with other code', async () => {
    const onError = vi.fn()
    const mockLoadConfig = vi.fn().mockRejectedValue(new Error('Config error'))
    const mockStart = vi.fn().mockResolvedValue(undefined)
    ;(BeefreeSDK as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      start: mockStart,
      join: vi.fn(),
      loadConfig: mockLoadConfig,
    }))

    const wrapper = mount(Builder, {
      props: {
        token: mockToken,
        template: mockTemplate,
        config: { ...config, onError },
      },
    })

    await waitFor(() => expect(mockStart).toHaveBeenCalled())
    await wrapper.setProps({ config: { ...config, language: 'fr-FR', onError } })
    await waitFor(() => expect(onError).toHaveBeenCalled(), { timeout: 2000 })
  })

  it('token watcher re-initializes when token prop changes', async () => {
    const mockStart = vi.fn().mockResolvedValue(undefined)
    ;(BeefreeSDK as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      start: mockStart,
      join: vi.fn(),
      loadConfig: vi.fn(),
    }))

    const wrapper = mount(Builder, {
      props: {
        token: mockToken,
        template: mockTemplate,
        config,
      },
    })

    await waitFor(() => expect(mockStart).toHaveBeenCalledTimes(1))
    mockStart.mockClear()
    await wrapper.setProps({
      token: { ...mockToken, access_token: 'new-token' },
    })
    await waitFor(() => expect(mockStart).toHaveBeenCalledTimes(1))
  })

  it('guards against re-entry when initializeBeefree is called again before first init completes', async () => {
    let resolveStart: () => void = () => {}
    const startPromise = new Promise<void>((r) => {
      resolveStart = r
    })
    const mockStart = vi.fn().mockReturnValue(startPromise)
    ;(BeefreeSDK as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      start: mockStart,
      join: vi.fn(),
      loadConfig: vi.fn(),
    }))

    const wrapper = mount(Builder, {
      props: {
        token: mockToken,
        template: mockTemplate,
        config,
      },
    })

    await waitFor(() => expect(mockStart).toHaveBeenCalledTimes(1))
    const exposed = wrapper.vm as unknown as { initializeBeefree: () => void }
    exposed.initializeBeefree()
    expect(mockStart).toHaveBeenCalledTimes(1)
    resolveStart()
    await startPromise
  })

  it('calls onError when SDK start fails', async () => {
    const mockStart = vi.fn().mockRejectedValue(new Error('SDK initialization failed'));
    (BeefreeSDK as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      start: mockStart,
      join: vi.fn(),
    }))

    const onError = vi.fn()
    mount(Builder, {
      props: {
        token: mockToken,
        template: mockTemplate,
        config: { ...config, onError },
      },
    })

    await waitFor(() => expect(onError).toHaveBeenCalled())
  })

  it('calls onError when SDK join fails', async () => {
    const mockJoin = vi.fn().mockRejectedValue(new Error('Join session failed'));
    (BeefreeSDK as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      start: vi.fn(),
      join: mockJoin,
    }))

    const onError = vi.fn()
    mount(Builder, {
      props: {
        token: mockToken,
        template: mockTemplate,
        config: { ...config, onError },
        shared: true,
        sessionId: 'test-session',
      },
    })

    await waitFor(() => expect(onError).toHaveBeenCalled())
  })

  it('clears container content on unmount', async () => {
    const mockStart = vi.fn().mockResolvedValue(undefined);
    (BeefreeSDK as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      start: mockStart,
      join: vi.fn(),
    }))

    const externalContainer = document.createElement('div')
    externalContainer.id = 'test-container'
    document.body.appendChild(externalContainer)
    externalContainer.innerHTML = '<iframe>SDK Content</iframe>'

    const wrapper = mount(Builder, {
      props: {
        token: mockToken,
        template: mockTemplate,
        config,
      },
    })

    await waitFor(() => expect(mockStart).toHaveBeenCalled())

    wrapper.unmount()

    expect(externalContainer.innerHTML).toBe('')

    document.body.removeChild(externalContainer)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { waitFor } from '@testing-library/dom'
import App from '../App.vue'

describe('App', () => {
  it('renders header with logo and builder type selector', () => {
    const wrapper = mount(App)
    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('img[alt="Beefree SDK"]').exists()).toBe(true)
    expect(wrapper.find('#headerBuilderType').exists()).toBe(true)
    expect(wrapper.find('select#headerBuilderType').element.tagName).toBe('SELECT')
  })

  it('renders language selector and co-editing button', () => {
    const wrapper = mount(App)
    expect(wrapper.find('#headerLanguage').exists()).toBe(true)
    expect(wrapper.find('.co-editing-btn').exists()).toBe(true)
  })

  it('renders BeefreeExample in content', () => {
    const wrapper = mount(App)
    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'BeefreeExample' }).exists()).toBe(true)
  })

  it('co-editing button is disabled when builder type is fileManager', async () => {
    const wrapper = mount(App)
    const btn = wrapper.find('.co-editing-btn')
    await wrapper.find('#headerBuilderType').setValue('fileManager')
    await wrapper.vm.$nextTick()
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('shows toast with title and message after mount (welcome notification)', async () => {
    vi.useFakeTimers()
    const wrapper = mount(App)
    expect(wrapper.find('.toast').exists()).toBe(false)
    await vi.advanceTimersByTime(500)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.toast').exists()).toBe(true)
    expect(wrapper.find('.toast h3').text()).toBe('Congratulations!')
    expect(wrapper.find('.toast p').text()).toBe('Your Vue.js Beefree SDK app is up and running.')
    expect(wrapper.find('.toast-success').exists()).toBe(true)
    vi.useRealTimers()
  })

  it('clears toast after duration and clears timers on unmount', async () => {
    vi.useFakeTimers()
    const wrapper = mount(App)
    await vi.advanceTimersByTime(500)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.toast').exists()).toBe(true)
    await vi.advanceTimersByTime(5000)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.toast').exists()).toBe(false)
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('renders toast with error title class when BeefreeExample emits notify with type error', async () => {
    const wrapper = mount(App)
    const beefree = wrapper.findComponent({ name: 'BeefreeExample' })
    beefree.vm.$emit('notify', 'Something failed', 'error', 'Error')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.toast-error').exists()).toBe(true)
    expect(wrapper.find('.toast h3.error-title').text()).toBe('Error')
  })

  it('renders language options from uiLanguages', () => {
    const wrapper = mount(App)
    const options = wrapper.findAll('select#headerLanguage option')
    expect(options.length).toBeGreaterThan(0)
    expect(options.some((o) => o.attributes('value') === 'en-US')).toBe(true)
  })

  it('updates selected builder language through header select', async () => {
    const wrapper = mount(App)
    await wrapper.find('#headerLanguage').setValue('it-IT')
    await wrapper.vm.$nextTick()
    const beefree = wrapper.findComponent({ name: 'BeefreeExample' })
    expect(beefree.props('builderLanguage')).toBe('it-IT')
  })

  it('does not apply error-title class when toast type is not error', async () => {
    const wrapper = mount(App)
    const beefree = wrapper.findComponent({ name: 'BeefreeExample' })
    beefree.vm.$emit('notify', 'All good', 'success', 'Done')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.toast h3').exists()).toBe(true)
    expect(wrapper.find('.toast h3').classes('error-title')).toBe(false)
  })

  it('does not render toast title element when notify has no title', async () => {
    const wrapper = mount(App)
    const beefree = wrapper.findComponent({ name: 'BeefreeExample' })
    beefree.vm.$emit('notify', 'Info only', 'info')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.toast').exists()).toBe(true)
    expect(wrapper.find('.toast h3').exists()).toBe(false)
  })

  it('co-editing button gets active class when toggleCoEditing is on', async () => {
    const wrapper = mount(App)
    await waitFor(() => expect(wrapper.find('.builders-area').exists()).toBe(true), { timeout: 3000 })
    const btn = wrapper.find('.co-editing-btn')
    await btn.trigger('click')
    await wrapper.vm.$nextTick()
    await waitFor(() => expect(btn.classes()).toContain('active'))
  })
})

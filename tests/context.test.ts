import type { Editor } from '@triggerix/editor'
import type { ShallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, shallowRef } from 'vue'
import { injectEditor, provideEditor } from '@/context'
import { createMockEditor } from './helpers/createMockEditor'

/**
 * `provideEditor` / `injectEditor` 是 `useEditor` 与 `useEditorState` 的
 * 通讯桥梁，必须成对使用。本文件只测注入/取出与错误处理。
 */

interface TestState {
  count: number
}

// 通用 consumer：拿到 editor 后只把它打到 data 属性上
const Consumer = defineComponent({
  name: 'Consumer',
  setup() {
    const { editor, state } = injectEditor<TestState>()
    return () => h('div', { 'data-count': state.value.count, 'data-editor': editor ? 'yes' : 'no' })
  }
})

// 通用 provider：接收 editor 与 state，通过 props 注入并渲染默认 slot
const Provider = defineComponent({
  name: 'Provider',
  props: {
    editor: { type: Object, required: true },
    state: { type: Object, required: true }
  },
  setup(props, { slots }) {
    provideEditor(props.editor as Editor<unknown>, props.state as ShallowRef<unknown>)
    return () => slots.default?.()
  }
})

const OrphanComp = defineComponent({
  name: 'OrphanConsumer',
  setup() {
    injectEditor()
    return () => h('div', 'orphan')
  }
})

describe('context: provideEditor + injectEditor', () => {
  it('should expose editor & state to descendants after provideEditor()', () => {
    const editor = createMockEditor<TestState>({ initialState: { count: 0 } })
    const state = shallowRef<TestState>(editor.getState())

    const wrapper = mount(Provider, {
      props: { editor, state },
      slots: { default: () => h(Consumer) }
    })

    // 子组件能读到 provider 注入的 editor
    expect(wrapper.find('[data-editor="yes"]').exists()).toBe(true)
    // state 是 shallowRef，默认值是 mock 的 initial state
    expect(wrapper.find('[data-count="0"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('should return values typed by the caller via the generic parameter', () => {
    const editor = createMockEditor<{ name: string }>({ initialState: { name: 'foo' } })
    const state = shallowRef<{ name: string }>({ name: 'foo' })

    let captured: ReturnType<typeof injectEditor<{ name: string }>> | undefined

    mount(Provider, {
      props: { editor, state },
      slots: {
        default: () => h(defineComponent({
          setup() {
            captured = injectEditor<{ name: string }>()
            return () => h('div')
          }
        }))
      }
    })

    expect(captured).toBeDefined()
    expect(captured!.state.value).toEqual({ name: 'foo' })
  })

  it('should throw a descriptive error when injectEditor is called without a provider', () => {
    // 抑制组件内的渲染错误冒泡到控制台
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => mount(OrphanComp)).toThrowError(
      /No editor provided\. Make sure to call useEditor\(\) in a parent component\./
    )

    errSpy.mockRestore()
    warnSpy.mockRestore()
  })
})

import type { MockEditor } from '../helpers/createMockEditor'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { useEditor } from '@/composables/useEditor'
import { useEditorState } from '@/composables/useEditorState'
import { createMockEditor } from '../helpers/createMockEditor'

/**
 * useEditorState 是供子组件使用的"只读"快捷方式：
 * 1. 行为上等价于直接调用 injectEditor()；
 * 2. 返回值结构符合 UseEditorStateReturn 契约；
 * 3. 当 editor 状态变化时，state 仍能保持响应式（与父组件共享同一 ref）；
 * 4. 不应额外订阅 editor（订阅在 useEditor 那一层）。
 */

interface TestState {
  value: string
  flag: boolean
}

let capturedState: ReturnType<typeof useEditorState<TestState>>['state'] | undefined

const Child = defineComponent({
  name: 'Child',
  setup() {
    const { editor, state } = useEditorState<TestState>()
    capturedState = state
    return () => h('div', {
      'data-value': state.value.value,
      'data-flag': String(state.value.flag),
      'data-has-editor': editor ? 'yes' : 'no'
    })
  }
})

// 通用 Provider：调用 useEditor，然后渲染默认 slot 中的子组件
const EditorHost = defineComponent({
  name: 'EditorHost',
  props: {
    editor: { type: Object, required: true }
  },
  setup(props, { slots }) {
    useEditor<TestState>(props.editor as MockEditor<TestState>)
    return () => slots.default?.()
  }
})

function mountWithEditor(editor: MockEditor<TestState>) {
  return mount(EditorHost, {
    props: { editor },
    slots: { default: () => h(Child) }
  })
}

describe('composable: useEditorState', () => {
  it('should expose the same state ref injected by the parent', () => {
    const editor = createMockEditor<TestState>({ initialState: { value: 'init', flag: false } })
    const wrapper = mountWithEditor(editor)

    expect(wrapper.find('[data-value="init"]').exists()).toBe(true)
    expect(wrapper.find('[data-flag="false"]').exists()).toBe(true)
    expect(wrapper.find('[data-has-editor="yes"]').exists()).toBe(true)
  })

  it('should react to editor state changes propagated through the parent', async () => {
    const editor = createMockEditor<TestState>({ initialState: { value: 'init', flag: false } })
    const wrapper = mountWithEditor(editor)

    expect(wrapper.find('[data-value="init"]').exists()).toBe(true)

    // 通过编辑器触发一次状态变更，子组件应当响应
    editor.setState({ value: 'next', flag: true })
    await nextTick()

    expect(wrapper.find('[data-value="next"]').exists()).toBe(true)
    expect(wrapper.find('[data-flag="true"]').exists()).toBe(true)
  })

  it('should not register its own subscription (no extra onChange calls beyond useEditor)', () => {
    const editor = createMockEditor<TestState>({ initialState: { value: 'a', flag: false } })
    const callsBefore = editor.calls.onChange

    const wrapper = mountWithEditor(editor)

    // useEditor 自身会订阅一次；useEditorState 仅复用 inject，不应再 +1
    expect(editor.calls.onChange - callsBefore).toBe(1)
    expect(editor.listeners.size).toBe(1)

    wrapper.unmount()
    // 卸载后订阅应被解绑（来自 useEditor 那一层）
    expect(editor.listeners.size).toBe(0)
  })

  it('should return a UseEditorStateReturn-shaped object (editor + state)', () => {
    const editor = createMockEditor<TestState>({ initialState: { value: 'x', flag: false } })

    mountWithEditor(editor)

    expect(capturedState).toBeDefined()
    expect(capturedState!.value).toEqual({ value: 'x', flag: false })
  })
})

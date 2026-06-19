import type { Trigger } from '@triggerix/core'
import type { ShallowRef } from 'vue'
import type { MockEditor } from '../helpers/createMockEditor'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { useEditor } from '@/composables/useEditor'
import { injectEditor } from '@/context'
import { createMockEditor } from '../helpers/createMockEditor'

/**
 * useEditor 是整个库的入口组合式函数，需要覆盖：
 * 1. 初始 state 同步；
 * 2. 编辑器变更时 state 自动刷新；
 * 3. toTrigger / reset 是对 editor 的透传；
 * 4. provideEditor 把 editor+state 暴露给子组件；
 * 5. onScopeDispose 中正确释放订阅与 dispose。
 */

interface TestState {
  count: number
  name: string
}

type FixedToTriggerEditor = MockEditor<TestState> & { toTrigger: (id?: string) => Trigger }

const FIXED_TRIGGER: Trigger = {
  id: 't-1',
  event: { type: 'unit-test' },
  actions: []
}

function makeFixedToTriggerEditor(initial: TestState): FixedToTriggerEditor {
  const editor = createMockEditor<TestState>({ initialState: initial })
  const calls = editor.calls
  // 覆写 toTrigger，返回一个固定结构，方便断言
  editor.toTrigger = (id?: string) => {
    calls.toTrigger += 1
    if (id !== undefined) {
      editor.lastToTriggerWithId = { id, trigger: { ...FIXED_TRIGGER, id } }
      return editor.lastToTriggerWithId.trigger
    }
    editor.lastToTrigger = { ...FIXED_TRIGGER }
    return editor.lastToTrigger
  }
  return editor as FixedToTriggerEditor
}

// 通用 Host：调用 useEditor，把 handle 写到闭包变量中供测试断言
let lastHandle: ReturnType<typeof useEditor<TestState>> | undefined
let lastEditor: FixedToTriggerEditor | undefined

const Consumer = defineComponent({
  name: 'Consumer',
  setup() {
    const injected = injectEditor<TestState>()
    return () => h('span', { 'data-injected': injected.editor ? 'yes' : 'no' })
  }
})

const Host = defineComponent({
  name: 'Host',
  props: {
    initial: { type: Object, required: true }
  },
  setup(props) {
    const editor = makeFixedToTriggerEditor(props.initial as TestState)
    const handle = useEditor<TestState>(editor)

    lastHandle = handle
    lastEditor = editor

    return () => h('div', [
      h('span', { 'data-count': handle.state.value.count }),
      h(Consumer)
    ])
  }
})

function mountHost(initial: TestState) {
  // 重置闭包变量，避免上一例遗留
  lastHandle = undefined
  lastEditor = undefined
  return mount(Host, { props: { initial } })
}

function readHandle(): {
  handle: ReturnType<typeof useEditor<TestState>>
  editor: FixedToTriggerEditor
} {
  if (!lastHandle || !lastEditor) {
    throw new Error('mountHost() must be called before readHandle()')
  }
  return { handle: lastHandle, editor: lastEditor }
}

describe('composable: useEditor', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('should return the same editor instance that was passed in', () => {
    const editor = makeFixedToTriggerEditor({ count: 0, name: 'a' })
    let captured: ReturnType<typeof useEditor<TestState>> | undefined
    mount(defineComponent({
      setup() {
        captured = useEditor<TestState>(editor)
        return () => h('div')
      }
    }))
    expect(captured!.editor).toBe(editor)
  })

  it('should hydrate the returned state ref with editor.getState() at start', () => {
    const editor = makeFixedToTriggerEditor({ count: 7, name: 'init' })
    let stateRef: ShallowRef<TestState> | undefined
    mount(defineComponent({
      setup() {
        const handle = useEditor<TestState>(editor)
        stateRef = handle.state
        return () => h('div')
      }
    }))

    expect(stateRef!.value).toEqual({ count: 7, name: 'init' })
    expect(editor.calls.getState).toBeGreaterThanOrEqual(1)
  })

  it('should update the state ref when editor notifies a change', async () => {
    mountHost({ count: 0, name: 'init' })
    const { handle, editor } = readHandle()

    expect(handle.state.value.count).toBe(0)

    editor.setState({ count: 42, name: 'updated' })
    await nextTick()

    expect(handle.state.value).toEqual({ count: 42, name: 'updated' })
  })

  it('should subscribe to the editor exactly once and unsubscribe on unmount', () => {
    const wrapper = mountHost({ count: 0, name: 'init' })
    const { editor } = readHandle()

    expect(editor.calls.onChange).toBe(1)
    expect(editor.listeners.size).toBe(1)

    wrapper.unmount()

    // 卸载后订阅应被解绑
    expect(editor.listeners.size).toBe(0)
  })

  it('should call editor.dispose() on scope dispose', () => {
    const wrapper = mountHost({ count: 0, name: 'init' })
    const { editor } = readHandle()

    expect(editor.calls.dispose).toBe(0)
    wrapper.unmount()
    expect(editor.calls.dispose).toBe(1)
  })

  it('toTrigger(id) should forward both the optional id and the result to the editor', () => {
    let handle: ReturnType<typeof useEditor<TestState>> | undefined
    const editor = makeFixedToTriggerEditor({ count: 0, name: 'init' })
    mount(defineComponent({
      setup() {
        handle = useEditor<TestState>(editor)
        return () => h('div')
      }
    }))

    const trigger = handle!.toTrigger('custom-id')
    expect(editor.calls.toTrigger).toBe(1)
    expect(editor.lastToTriggerWithId).toEqual({ id: 'custom-id', trigger })
    expect(trigger.id).toBe('custom-id')

    // 不传 id 时走另一条分支
    const trigger2 = handle!.toTrigger()
    expect(editor.calls.toTrigger).toBe(2)
    expect(editor.lastToTrigger).toEqual(trigger2)
  })

  it('reset() should be a transparent pass-through to editor.reset()', () => {
    let handle: ReturnType<typeof useEditor<TestState>> | undefined
    const editor = makeFixedToTriggerEditor({ count: 9, name: 'z' })
    mount(defineComponent({
      setup() {
        handle = useEditor<TestState>(editor)
        return () => h('div')
      }
    }))

    handle!.reset()
    expect(editor.calls.reset).toBe(1)
  })

  it('should expose editor & state to descendants via provideEditor', () => {
    const wrapper = mountHost({ count: 5, name: 'p' })

    // Consumer 子组件的 data-injected=yes 表示 inject 成功
    expect(wrapper.find('[data-injected="yes"]').exists()).toBe(true)
    // 同时确认 state 已通过 provide 暴露（count 通过父组件渲染）
    expect(wrapper.find('[data-count="5"]').exists()).toBe(true)
  })

  it('should clean up exactly once even if state changes happen right before unmount', async () => {
    const wrapper = mountHost({ count: 1, name: 'x' })
    const { handle, editor } = readHandle()

    editor.setState({ count: 2, name: 'x' })
    await nextTick()
    editor.setState({ count: 3, name: 'x' })
    await nextTick()

    expect(handle.state.value.count).toBe(3)

    wrapper.unmount()
    // 状态再变更，state 不应再被更新（订阅已被解绑）
    editor.setState({ count: 999, name: 'x' })
    await nextTick()
    expect(handle.state.value.count).toBe(3)
    expect(editor.calls.dispose).toBe(1)
  })
})

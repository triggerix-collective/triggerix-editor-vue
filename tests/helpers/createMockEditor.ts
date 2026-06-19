import type { Trigger } from '@triggerix/core'
import type { Editor } from '@triggerix/editor'

export type { Trigger }

export interface MockEditorOptions<TState> {
  initialState: TState
}

export interface MockEditor<TState> extends Editor<TState> {
  /** 直接修改状态并通知订阅者（用于模拟编辑器内部变更） */
  setState: (next: TState) => void
  /** 工厂: 仅创建一个 Trigger（不传 id） */
  lastToTrigger: Trigger | undefined
  /** 工厂: 带 id 的 Trigger */
  lastToTriggerWithId: { id: string | undefined, trigger: Trigger } | undefined
  /** 调用次数: getState / onChange / toTrigger / reset / dispose */
  calls: {
    getState: number
    onChange: number
    toTrigger: number
    reset: number
    dispose: number
  }
  /** 订阅者列表（用于断言已成功注册 / 注销） */
  listeners: Set<() => void>
}

/**
 * 构造一个满足 Editor 接口的 Mock 实例，便于在组合式函数中观察副作用。
 * 不会依赖任何 Vue API，纯 JS 对象，可直接用于单测。
 */
export function createMockEditor<TState>(options: MockEditorOptions<TState>): MockEditor<TState> {
  const { initialState } = options
  const listeners = new Set<() => void>()

  let state: TState = initialState
  const calls = {
    getState: 0,
    onChange: 0,
    toTrigger: 0,
    reset: 0,
    dispose: 0
  }

  const triggerObject: Trigger = {
    id: 'mock-trigger',
    event: { type: 'mock' },
    actions: []
  }

  const editor: MockEditor<TState> = {
    getState: () => {
      calls.getState += 1
      return state
    },
    onChange: (listener) => {
      calls.onChange += 1
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    toTrigger: (id) => {
      calls.toTrigger += 1
      const trigger: Trigger = {
        ...triggerObject,
        ...(id !== undefined ? { id } : {})
      }
      if (id !== undefined) {
        editor.lastToTriggerWithId = { id, trigger }
      }
      else {
        editor.lastToTrigger = trigger
      }
      return trigger
    },
    reset: () => {
      calls.reset += 1
      state = initialState
    },
    dispose: () => {
      calls.dispose += 1
    },
    setState: (next) => {
      state = next
      listeners.forEach(fn => fn())
    },
    lastToTrigger: undefined,
    lastToTriggerWithId: undefined,
    calls,
    listeners
  }

  return editor
}

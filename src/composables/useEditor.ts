import type { EditorState, SlotValueEntry } from '@triggerix/editor'
import { createEditor } from '@triggerix/editor'
import { onScopeDispose, shallowRef, triggerRef } from 'vue'
import { provideEditor } from '../context'

export function useEditor() {
  const editor = createEditor()
  const state = shallowRef<EditorState>(editor.getState())

  // 桥接 listener → Vue reactivity
  const unsubscribe = editor.onChange(() => {
    triggerRef(state)
  })

  // 自动清理
  onScopeDispose(() => {
    unsubscribe()
  })

  // 向子组件注入
  provideEditor(editor)

  return {
    editor,
    state,
    // 代理状态操作
    setEvent: (type: string) => editor.setEvent(type),
    clearEvent: () => editor.clearEvent(),
    setEventSlot: (key: string, entry: SlotValueEntry) => editor.setEventSlot(key, entry),
    addAction: (type: string) => editor.addAction(type),
    removeAction: (index: number) => editor.removeAction(index),
    moveAction: (from: number, to: number) => editor.moveAction(from, to),
    setActionSlot: (actionIndex: number, key: string, entry: SlotValueEntry) => editor.setActionSlot(actionIndex, key, entry),
    addCondition: (type: string) => editor.addCondition(type),
    removeCondition: (index: number) => editor.removeCondition(index),
    setConditionSlot: (conditionIndex: number, key: string, entry: SlotValueEntry) => editor.setConditionSlot(conditionIndex, key, entry),
    reset: () => editor.reset(),
    toRule: (ruleId?: string) => editor.toRule(ruleId)
  }
}

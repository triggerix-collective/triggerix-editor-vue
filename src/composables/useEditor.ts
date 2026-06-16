import type { Editor } from '@triggerix/editor'
import { onScopeDispose, shallowRef, triggerRef } from 'vue'
import { provideEditor } from '../context'

/**
 * 通用 useEditor —— 接受任何实现了 Editor 接口的实例
 * War3 用：useEditor(createWar3Editor())
 * Workflow 用：useEditor(createWorkflowEditor())
 */
export function useEditor<TState>(editor: Editor<TState>) {
  const state = shallowRef<TState>(editor.getState())

  const unsubscribe = editor.onChange(() => {
    triggerRef(state)
  })

  onScopeDispose(() => {
    unsubscribe()
    editor.dispose()
  })

  provideEditor(editor as Editor<unknown>)

  return {
    editor,
    state,
    toRule: (id?: string) => editor.toRule(id),
    reset: () => editor.reset()
  }
}

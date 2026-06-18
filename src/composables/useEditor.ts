import type { Editor } from '@triggerix/editor'
import type { ShallowRef } from 'vue'
import type { UseEditorReturn } from '../types'
import { onScopeDispose, shallowRef } from 'vue'
import { provideEditor } from '../context'

/**
 * 通用 useEditor —— 接受任何实现了 Editor 接口的实例
 * War3 用：useEditor(createWar3Editor())
 * Workflow 用：useEditor(createWorkflowEditor())
 */
export function useEditor<TState>(editor: Editor<TState>): UseEditorReturn<TState> {
  const state = shallowRef<TState>(editor.getState())

  const unsubscribe = editor.onChange(() => {
    state.value = editor.getState()
  })

  onScopeDispose(() => {
    unsubscribe()
    editor.dispose()
  })

  provideEditor(editor as Editor<unknown>, state as ShallowRef<unknown>)

  return {
    editor,
    state,
    toRule: (id?: string) => editor.toRule(id),
    reset: () => editor.reset()
  }
}

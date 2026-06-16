import type { Editor } from '@triggerix/editor'
import type { UseEditorStateReturn } from '../types'
import { onScopeDispose, shallowRef, triggerRef } from 'vue'
import { injectEditor } from '../context'

/**
 * 在子组件中获取编辑器状态的响应式引用
 */
export function useEditorState<TState = unknown>(): UseEditorStateReturn<TState> {
  const editor: Editor<TState> = injectEditor<TState>()
  const state = shallowRef<TState>(editor.getState())

  const unsubscribe = editor.onChange(() => {
    triggerRef(state)
  })

  onScopeDispose(() => {
    unsubscribe()
  })

  return {
    editor,
    state
  }
}

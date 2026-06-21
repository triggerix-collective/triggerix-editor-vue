import type { Editor } from '@triggerix/editor'
import type { ShallowRef } from 'vue'
import type { UseEditorReturn } from '../types'
import { onScopeDispose, shallowRef } from 'vue'
import { provideEditor } from '../context'

export interface UseEditorOptions<TState> {
  /**
   * Optional external state ref to use instead of creating a new one.
   *
   * Use when multiple consumers need to share the same reactive state ref
   * (e.g. a composable that needs to expose the editor's state alongside
   * the `useEditor` return value, without losing the dispose side-effects
   * that `useEditor` provides).
   */
  state?: ShallowRef<TState>
}

/**
 * 通用 useEditor —— 接受任何实现了 Editor 接口的实例
 * War3 用：useEditor(createWar3Editor())
 * Workflow 用：useEditor(createWorkflowEditor())
 */
export function useEditor<TState>(
  editor: Editor<TState>,
  options?: UseEditorOptions<TState>
): UseEditorReturn<TState> {
  const state = options?.state ?? shallowRef<TState>(editor.getState())

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
    toTrigger: (id?: string) => editor.toTrigger(id),
    reset: () => editor.reset()
  }
}

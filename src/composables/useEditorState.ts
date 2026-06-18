import type { UseEditorStateReturn } from '../types'
import { injectEditor } from '../context'

/**
 * 在子组件中获取编辑器状态的响应式引用
 */
export function useEditorState<TState = unknown>(): UseEditorStateReturn<TState> {
  const { editor, state } = injectEditor<TState>()
  return { editor, state }
}

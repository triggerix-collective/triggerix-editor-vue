import type { EditorState } from '@triggerix/editor'
import { computed, onScopeDispose, shallowRef } from 'vue'
import { injectEditor } from '../context'

export function useEditorState() {
  const editor = injectEditor()
  const state = shallowRef<EditorState>(editor.getState())

  const unsubscribe = editor.onChange((newState) => {
    state.value = newState
  })

  onScopeDispose(() => {
    unsubscribe()
  })

  return {
    state,
    event: computed(() => state.value.event),
    actions: computed(() => state.value.actions),
    conditions: computed(() => state.value.conditions)
  }
}

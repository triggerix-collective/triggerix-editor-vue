import type { Editor } from '@triggerix/editor'
import type { ShallowRef } from 'vue'

export type { BaseItemDef, Editor, Preset } from '@triggerix/editor'

export interface UseEditorReturn<TState> {
  editor: Editor<TState>
  state: ShallowRef<TState>
  toRule: (id?: string) => ReturnType<Editor<TState>['toRule']>
  reset: () => ReturnType<Editor<TState>['reset']>
}

export interface UseEditorStateReturn<TState> {
  editor: Editor<TState>
  state: ShallowRef<TState>
}

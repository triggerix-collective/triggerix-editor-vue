import type { Editor } from '@triggerix/editor'
import type { InjectionKey, ShallowRef } from 'vue'
import { inject, provide } from 'vue'

const EDITOR_KEY: InjectionKey<Editor<unknown>> = Symbol('triggerix-editor')
const STATE_KEY: InjectionKey<ShallowRef<unknown>> = Symbol('triggerix-editor-state')

export function provideEditor(editor: Editor<unknown>, state: ShallowRef<unknown>): void {
  provide(EDITOR_KEY, editor)
  provide(STATE_KEY, state)
}

export function injectEditor<TState = unknown>(): { editor: Editor<TState>, state: ShallowRef<TState> } {
  const editor = inject(EDITOR_KEY)
  const state = inject(STATE_KEY)
  if (!editor || !state) {
    throw new Error('No editor provided. Make sure to call useEditor() in a parent component.')
  }
  return { editor: editor as Editor<TState>, state: state as ShallowRef<TState> }
}

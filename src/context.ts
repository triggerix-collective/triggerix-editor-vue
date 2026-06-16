import type { Editor } from '@triggerix/editor'
import type { InjectionKey } from 'vue'
import { inject, provide } from 'vue'

const EDITOR_KEY: InjectionKey<Editor<unknown>> = Symbol('triggerix-editor')

export function provideEditor(editor: Editor<unknown>): void {
  provide(EDITOR_KEY, editor)
}

export function injectEditor<TState = unknown>(): Editor<TState> {
  const editor = inject(EDITOR_KEY)
  if (!editor) {
    throw new Error('No editor provided. Make sure to call useEditor() in a parent component.')
  }
  return editor as Editor<TState>
}

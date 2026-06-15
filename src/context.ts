import type { TriggerixEditor } from '@triggerix/editor'
import type { InjectionKey } from 'vue'
import { inject, provide } from 'vue'

const EditorKey: InjectionKey<TriggerixEditor> = Symbol('TriggerixEditor')

export function provideEditor(editor: TriggerixEditor): void {
  provide(EditorKey, editor)
}

export function injectEditor(): TriggerixEditor {
  const editor = inject(EditorKey)
  if (!editor) {
    throw new Error('[triggerix-editor-vue] No editor instance found. Did you call useEditor() in a parent component?')
  }
  return editor
}

// Composables
export { useEditor } from './composables/useEditor'
export { useEditorState } from './composables/useEditorState'
export { useRegistry } from './composables/useRegistry'

// Context
export { injectEditor, provideEditor } from './context'

// Types (re-exported from @triggerix/editor)
export type {
  ActionDef,
  ChangeListener,
  CompositeToolDef,
  CompositeToolDescriptor,
  ConditionDef,
  EditorState,
  EventDef,
  ItemDescriptor,
  ItemState,
  LeafToolDef,
  LeafToolDescriptor,
  LeafToolInput,
  LeafToolInputNumber,
  LeafToolInputSelect,
  LeafToolInputText,
  Segment,
  SelectOption,
  SlotContext,
  SlotDef,
  SlotSegment,
  SlotValueEntry,
  TextSegment,
  ToolDef,
  ToolDescriptor,
  TriggerixEditor
} from './types'

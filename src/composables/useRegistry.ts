import type { ActionDef, ConditionDef, EventDef, ToolDef } from '@triggerix/editor'
import { injectEditor } from '../context'

export function useRegistry() {
  const editor = injectEditor()

  return {
    registerEvent: (def: EventDef) => editor.registerEvent(def),
    registerAction: (def: ActionDef) => editor.registerAction(def),
    registerCondition: (def: ConditionDef) => editor.registerCondition(def),
    registerTool: (name: string, def: ToolDef) => editor.registerTool(name, def),
    getAvailableEvents: () => editor.getAvailableEvents(),
    getAvailableActions: () => editor.getAvailableActions(),
    getAvailableConditions: () => editor.getAvailableConditions()
  }
}

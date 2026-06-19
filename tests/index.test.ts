import { describe, expect, it } from 'vitest'
import { useEditor } from '@/composables/useEditor'
import { useEditorState } from '@/composables/useEditorState'
import { injectEditor, provideEditor } from '@/context'
import * as publicApi from '@/index'

/**
 * 公共 API 导出完整性校验。
 * 一旦 `src/index.ts` 漏导出某个符号，构建结果里就用不到，
 * 业务侧会出现静默的「找不到函数」。这里锁住导出集合。
 */
describe('index public API', () => {
  it('should export the composables (useEditor / useEditorState)', () => {
    expect(publicApi.useEditor).toBe(useEditor)
    expect(publicApi.useEditorState).toBe(useEditorState)
  })

  it('should export the dependency injection helpers (injectEditor / provideEditor)', () => {
    expect(publicApi.injectEditor).toBe(injectEditor)
    expect(publicApi.provideEditor).toBe(provideEditor)
  })

  it('should expose type identifiers (BaseItemDef / Editor / Preset) as type-only re-exports', () => {
    // 类型在运行期会被擦除，无法在运行时断言。这里改为编译期断言：
    // 只要 `publicApi` 命名空间里能取到这些类型即可（由 TypeScript 保证）。
    interface _AssertTypes {
      BaseItemDef: publicApi.BaseItemDef
      Editor: publicApi.Editor
      // Preset 在 @triggerix/editor 中是带泛型的，这里用 Editor<unknown> 作为占位
      Preset: publicApi.Preset<publicApi.Editor>
    }
    const _typeCheck: _AssertTypes | undefined = undefined
    expect(_typeCheck).toBeUndefined()
  })
})

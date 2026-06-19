# triggerix-editor-vue

[![npm version](https://img.shields.io/npm/v/triggerix-editor-vue)](https://www.npmjs.com/package/triggerix-editor-vue)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Vue 3 组合式函数（Composition API）层，用于在 Vue 应用中集成 [@triggerix/editor](https://github.com/triggerix-collective/triggerix-editor)。提供响应式状态绑定、生命周期管理以及基于 Vue `provide/inject` 的编辑器实例传递能力。

> 适用于任何实现了 `Editor<TState>` 接口的实例（War3 编辑器、Workflow 编辑器等），不绑定特定业务。

## 特性

- **框架无关的核心 + Vue 响应式绑定**：底层 `@triggerix/editor` 与框架解耦，本包只负责桥接到 Vue 的响应式系统。
- **自动生命周期管理**：通过 `onScopeDispose` 在组件卸载时自动解绑事件并释放编辑器资源。
- **依赖注入友好**：基于 Vue 原生 `provide/inject`，可在深层子组件中获取编辑器与状态。
- **类型安全**：完整 TypeScript 类型支持，泛型 `TState` 透传状态类型。
- **零运行时依赖**：除 Vue（peer）与 `@triggerix/editor`（dependency）外无额外运行时依赖。

## 安装

```bash
pnpm add triggerix-editor-vue @triggerix/editor vue
```

> 需要 Vue `^3.5.0`。

## 快速开始

### 1. 在根组件中创建编辑器

```vue
<script setup lang="ts">
import { createWar3Editor } from '@triggerix/editor/war3' // 示例：具体实现由业务侧决定
import { useEditor } from 'triggerix-editor-vue'

const { editor, state, toTrigger, reset } = useEditor(createWar3Editor())
</script>

<template>
  <div>
    <pre>{{ state }}</pre>
    <button @click="toTrigger()">
      生成触发器
    </button>
    <button @click="reset()">
      重置
    </button>
  </div>
</template>
```

### 2. 在子组件中消费编辑器

```vue
<script setup lang="ts">
import { useEditorState } from 'triggerix-editor-vue'

const { editor, state } = useEditorState<MyState>()
</script>

<template>
  <div>{{ state }}</div>
</template>
```

### 3. 直接使用底层 `provide` / `inject`

```ts
import { injectEditor, provideEditor } from 'triggerix-editor-vue'

// 祖先组件
provideEditor(editorInstance, stateRef)

// 后代组件
const { editor, state } = injectEditor<MyState>()
```

> 若祖先组件未调用 `provideEditor`，`injectEditor` 会抛出错误提示你检查组件树。

## API 参考

### `useEditor(editor)`

创建响应式状态、订阅 `editor.onChange`、在组件卸载时释放资源，并通过 `provideEditor` 注入到组件树。

**参数**

| 名称     | 类型              | 说明                       |
| -------- | ----------------- | -------------------------- |
| `editor` | `Editor<TState>`  | 任意实现了 Editor 接口的实例 |

**返回** `UseEditorReturn<TState>`

| 字段       | 类型                          | 说明                       |
| ---------- | ----------------------------- | -------------------------- |
| `editor`   | `Editor<TState>`              | 原始编辑器实例             |
| `state`    | `ShallowRef<TState>`          | 响应式状态引用             |
| `toTrigger`| `(id?: string) => Trigger`    | 转发到 `editor.toTrigger`  |
| `reset`    | `() => void`                  | 转发到 `editor.reset`      |

### `useEditorState()`

从祖先组件注入的编辑器中获取响应式状态。仅返回 `{ editor, state }`，不提供 `toTrigger` / `reset` 等命令式 API（推荐用于只读展示组件）。

### `provideEditor(editor, state)`

将编辑器实例与状态 ref 注册到当前组件的作用域中，供后代通过 `injectEditor` 读取。

### `injectEditor<TState>()`

读取由 `provideEditor` 注册的编辑器与状态。若未找到会抛出错误。

### 类型导出

```ts
import type { BaseItemDef, Editor, Preset } from 'triggerix-editor-vue'
```

`UseEditorReturn<TState>` 与 `UseEditorStateReturn<TState>` 也可通过 `import type` 获取。

## 工作原理

```text
   ┌────────────────────────────┐
   │ @triggerix/editor          │  ← 框架无关，发布 onChange 事件
   └─────────────┬──────────────┘
                 │ Editor<TState>
                 ▼
   ┌────────────────────────────┐
   │ triggerix-editor-vue       │
   │  useEditor()               │
   │   ├─ shallowRef(state)     │
   │   ├─ editor.onChange(...)  │  ← 订阅变化，同步到 ref
   │   ├─ onScopeDispose(...)   │  ← 卸载时释放
   │   └─ provideEditor(...)    │  ← 注入到组件树
   └─────────────┬──────────────┘
                 │ provide / inject
                 ▼
   ┌────────────────────────────┐
   │  子组件 useEditorState()   │
   └────────────────────────────┘
```

## 源码结构

```
src/
├── composables/
│   ├── useEditor.ts        # 主组合式函数
│   └── useEditorState.ts   # 子组件读取
├── context.ts              # provideEditor / injectEditor
├── types.ts                # 类型导出
└── index.ts                # 统一出口
```

## 开发

```bash
# 安装依赖
pnpm install

# 构建（基于 unbuild，产出 ESM + CJS + d.ts）
pnpm build

# 开发态 stub（不打包，便于在 monorepo 内联调）
pnpm stub

# 代码检查
pnpm lint
```

### 发布

```bash
pnpm release   # bumpp 交互式升版本号
```

推送形如 `v*` 的 tag 后，GitHub Actions 会自动：

1. 调用 `changelogithub` 生成 Release Notes
2. 重新安装依赖并构建
3. 执行 `pnpm publish` 发布到 npm（无签名）

## 相关项目

- [@triggerix/editor](https://github.com/triggerix-collective/triggerix-editor) — 框架无关的编辑器核心
- [triggerix](https://github.com/triggerix-collective/triggerix) — Triggerix 规则引擎主仓库

## License

[MIT](./LICENSE) © 2026 imba97

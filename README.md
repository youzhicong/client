# vue-pcdemo

基于 Vue 3 + Vite + Electron 的桌面客户端。

## 技术栈

- Vue 3
- Vite
- Electron
- Element Plus
- TypeScript

## 目录结构

- `src/`：渲染进程（Vue 应用）
- `src-electron/`：主进程（Electron）
- `public/`：静态资源
- `dist/`：渲染进程构建产物
- `release/`：打包产物（electron-builder 输出）

## 运行时配置（config.json）

主进程会读取 `src-electron/config.json`。

示例：

```json
{
  "mainPageUrl": "https://zhjx.zafu.edu.cn/",
  "openDevTools": false
}
```

说明：
- 开发模式固定打开 `http://localhost:5173`。
- 打包后优先读取 `mainPageUrl`。
- 如果 `mainPageUrl` 为空，则回退到本地 `dist/index.html`。

## 配置文件说明

位置：
- 开发模式：`src-electron/config.json`
- 打包后：请将 `config.json` 放在 Electron 主进程文件旁边（应用的 `resources` 目录）。默认情况下通常为 `resources/app/src-electron/config.json`。

字段：
- `mainPageUrl`：打包后主窗口打开的地址。
- `openDevTools`：是否自动打开 DevTools（排查问题时可开启）。

优先级：
- 开发模式：始终使用 `http://localhost:5173`。
- 打包后：使用 `config.json` 的 `mainPageUrl`；为空则加载 `dist/index.html`。

更新方式：
- 修改 `config.json` 后重启应用即可生效。

## 环境要求

- Node.js `^20.19.0`
- pnpm

## 安装依赖

```sh
pnpm install
```

## 本地开发

```sh
pnpm dev
```

## 构建

```sh
pnpm build
```

## 打包（Electron）

```sh
pnpm electron:build
```

## 代码检查

```sh
pnpm lint
```

## 拖拽构建两种方案对比

方案 A：模板分支渲染（大量 `v-if`）
- 优点：直观易读、调试方便、组件细节可控。
- 缺点：模板膨胀快、重复代码多、组件越多越难维护。

方案 B：Schema + 组件映射（动态组件）
- 优点：可扩展、方便新增组件、可导出 Schema、模板更简洁。
- 缺点：多一层抽象、复杂组件可能需要封装、类型约束更复杂。

建议：
- 小型功能或快速原型：优先方案 A。
- 组件多、要长期维护：优先方案 B。

## Vue-Office Usage (Vue 3 + Vite + TS)

Install:
```sh
pnpm add @vue-office/docx @vue-office/excel @vue-office/pdf
```

Basic usage:
```vue
<template>
  <vue-office-pdf v-if="type === 'pdf'" :src="objectUrl" />
  <vue-office-docx v-else-if="type === 'docx'" :src="docxData" />
  <vue-office-excel v-else-if="type === 'excel'" :src="excelData" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import VueOfficeDocx from '@vue-office/docx'
import VueOfficeExcel from '@vue-office/excel'
import VueOfficePdf from '@vue-office/pdf'
import '@vue-office/docx/lib/index.css'
import '@vue-office/excel/lib/index.css'

const type = ref<'pdf' | 'docx' | 'excel'>('pdf')
const objectUrl = ref('')
const docxData = ref<ArrayBuffer | null>(null)
const excelData = ref<ArrayBuffer | null>(null)
</script>
```

Notes:
- PDF uses `objectUrl` from `URL.createObjectURL(file)`.
- DOCX/Excel use `ArrayBuffer` from `FileReader.readAsArrayBuffer`.
- `@vue-office/pdf` does not provide `lib/index.css`, so do not import it.

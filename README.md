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

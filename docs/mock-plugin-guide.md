# vite-plugin-mock 使用指南

本项目使用 `vite-plugin-mock` 和 `mockjs` 来模拟 API 数据，便于前端开发和测试。

## 安装

```bash
pnpm add -D vite-plugin-mock mockjs @types/mockjs
```

## 配置

在 `vite.config.ts` 中配置插件：

```typescript
import { viteMockServe } from 'vite-plugin-mock'

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      // ... 其他插件
      viteMockServe({
        mockPath: 'mock', // mock 文件目录
        enable: mode === 'development', // 仅开发环境启用
      }),
    ],
  }
})
```

## 目录结构

```
项目根目录/
├── mock/
│   ├── fund.ts      # 基金相关 API
│   ├── vending.ts   # 贩卖机相关 API
│   └── user.ts      # 用户相关 API（示例）
├── src/
└── vite.config.ts
```

## 编写 Mock 接口

### 基础示例

```typescript
// mock/example.ts
import type { MockMethod } from 'vite-plugin-mock'

export default [
  {
    url: '/api/example',
    method: 'get',
    response: () => {
      return {
        code: 200,
        message: 'success',
        data: {
          name: '示例数据',
        },
      }
    },
  },
] as MockMethod[]
```

### 带参数的接口

```typescript
{
  url: '/api/user/:id',
  method: 'get',
  response: ({ query, params }) => {
    // query: URL 查询参数 ?page=1&size=10
    // params: 路径参数 :id
    return {
      code: 200,
      data: {
        id: params.id,
        page: query.page
      }
    }
  }
}
```

### POST 请求

```typescript
{
  url: '/api/login',
  method: 'post',
  response: ({ body }) => {
    const { username, password } = body

    if (username === 'admin' && password === '123456') {
      return {
        code: 200,
        data: { token: 'mock-token-xxx' }
      }
    }

    return {
      code: 401,
      message: '用户名或密码错误'
    }
  }
}
```

## 使用 MockJS 生成数据

```typescript
import Mock from 'mockjs'

// 生成随机数据
const data = Mock.mock({
  'list|10': [
    {
      'id|+1': 1,
      name: '@cname', // 中文名
      email: '@email', // 邮箱
      'age|18-60': 1, // 18-60的随机数
      address: '@city(true)', // 城市
      createTime: '@datetime', // 日期时间
    },
  ],
})

// 常用占位符
Mock.Random.cname() // 中文名
Mock.Random.ctitle(5, 10) // 中文标题
Mock.Random.integer(1, 100) // 随机整数
Mock.Random.float(0, 100, 2, 2) // 随机浮点数
Mock.Random.pick(['A', 'B', 'C']) // 随机选择
Mock.Random.datetime() // 日期时间
Mock.Random.image('200x100') // 图片 URL
```

## 前端调用

```typescript
// 使用 fetch
const res = await fetch('/api/fund/list')
const data = await res.json()

// 使用 axios
import axios from 'axios'
const { data } = await axios.get('/api/fund/list')
```

## 注意事项

1. **仅开发环境生效**：构建生产版本时 mock 自动禁用
2. **热更新**：修改 mock 文件后自动生效，无需重启
3. **类型安全**：使用 TypeScript 编写 mock 文件
4. **响应延迟**：可添加 `timeout` 模拟网络延迟

```typescript
{
  url: '/api/slow',
  method: 'get',
  timeout: 2000,  // 延迟 2 秒响应
  response: () => ({ code: 200 })
}
```

## 项目中的 Mock 接口

### 基金估值 API

| 接口               | 方法   | 说明               |
| ------------------ | ------ | ------------------ |
| `/api/fund/list`   | GET    | 获取基金列表和估值 |
| `/api/fund/add`    | POST   | 添加基金           |
| `/api/fund/delete` | DELETE | 删除基金           |

### 贩卖机监控 API

| 接口                   | 方法 | 说明               |
| ---------------------- | ---- | ------------------ |
| `/api/vending/monitor` | GET  | 获取贩卖机监控数据 |

## 迁移到真实 API

当后端 API 开发完成后，只需：

1. 在生产环境配置中禁用 mock
2. 确保后端 API 路径与 mock 一致
3. 或修改前端请求地址

无需删除 mock 文件，它们可作为 API 文档和测试备用。

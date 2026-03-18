# 后端接口文档

## 1. 统一约定

- 所有接口都直接拼接到 `VITE_DEV_SERVER_URL`，不再使用统一 `/api` 前缀。
- 前端统一调用模板：

```ts
import { request } from '@/utils/request'

export const getExample = (params?: Record<string, unknown>) =>
  request<any>('/module/path', 'GET', params)
```

- 统一响应结构：

```json
{
  "code": 10000,
  "message": "success",
  "data": {}
}
```

- 成功固定使用 `code = 10000`。
- 失败时建议：
  - `400` 参数错误
  - `401` 未登录或登录失效
  - `403` 无权限
  - `404` 资源不存在
  - `409` 数据冲突
  - `422` 表单校验失败
  - `500` 服务端异常
- 时间字段建议统一格式：
  - 日期时间：`YYYY-MM-DD HH:mm:ss`
  - 日期：`YYYY-MM-DD`

## 2. 登录

### POST `/auth/login`

请求体：

```json
{
  "account": "admin",
  "password": "123456"
}
```

`data` 返回：

```json
{
  "user": {
    "token": "jwt-or-session-token",
    "name": "管理员",
    "username": "admin",
    "nickname": "管理员",
    "account": "admin",
    "email": "admin@example.com",
    "role": "管理员",
    "city": "上海",
    "avatar": "https://example.com/avatar.png"
  }
}
```

## 3. 首页

### GET `/home/dashboard`

`data` 返回：

```json
{
  "heroStats": [
    {
      "label": "今日访问",
      "value": "28640",
      "delta": "+8.4%",
      "deltaTone": "up"
    }
  ],
  "weekDays": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
  "uvData": [8200, 9320, 9010, 10420, 11920, 12800, 13100],
  "pvData": [15200, 16800, 16000, 17600, 19800, 20600, 21400],
  "channelData": [
    { "name": "自然搜索", "value": 42, "color": "#0f9d92" }
  ],
  "regionData": [
    { "name": "上海", "value": 1820 }
  ],
  "kpiCards": [
    {
      "label": "新增用户",
      "value": "3286",
      "trend": "+12.4%",
      "trendTone": "up",
      "tag": "Acq",
      "tone": "teal"
    }
  ],
  "healthMetrics": [
    {
      "label": "活跃用户规模",
      "value": "12980",
      "progress": 84,
      "trend": "+6.2%",
      "trendTone": "up",
      "color": "linear-gradient(90deg, #0f9d92, #11c5b8)"
    }
  ]
}
```

## 4. 公告

### GET `/announcement/list`

查询参数：

- `keyword?: string`
- `status?: draft | published`
- `page?: number`
- `pageSize?: number`

`data` 返回：

```json
{
  "list": [
    {
      "id": 1,
      "title": "公告标题",
      "summary": "摘要",
      "author": "管理员",
      "status": "published",
      "statusLabel": "已发布",
      "viewCount": 123,
      "publishedAt": "2026-03-17 12:00:00",
      "updatedAt": "2026-03-17 12:00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10,
  "summary": {
    "total": 1,
    "draft": 0,
    "published": 1
  }
}
```

### GET `/announcement/detail?id={id}`

`data` 返回：

```json
{
  "id": 1,
  "title": "公告标题",
  "summary": "摘要",
  "content": "<p>正文</p>",
  "cover": "",
  "author": "管理员",
  "status": "published",
  "statusLabel": "已发布",
  "viewCount": 123,
  "createdAt": "2026-03-17 12:00:00",
  "updatedAt": "2026-03-17 12:00:00",
  "publishedAt": "2026-03-17 12:00:00"
}
```

### POST `/announcement/create`

### POST `/announcement/update`

请求体：

```json
{
  "id": 1,
  "title": "公告标题",
  "summary": "摘要",
  "content": "<p>正文</p>",
  "cover": "",
  "author": "管理员"
}
```

### POST `/announcement/publish`

```json
{ "id": 1 }
```

### POST `/announcement/delete`

```json
{ "id": 1 }
```

## 5. 审批流

### GET `/approval-workflow/instances`

查询参数：

- `keyword?: string`
- `status?: pending | rejected | modified | approved`
- `page?: number`
- `pageSize?: number`

`data` 返回：

```json
{
  "list": [
    {
      "id": 1,
      "code": "WF202603170001",
      "applicant": "张三",
      "title": "费用申请",
      "type": "报销",
      "amount": 1200,
      "status": "pending",
      "statusLabel": "审批中",
      "currentStep": "财务审批",
      "rejectCount": 0,
      "updatedAt": "2026-03-17 12:00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 8,
  "summary": {
    "total": 1,
    "pending": 1,
    "rejected": 0,
    "modified": 0,
    "approved": 0
  }
}
```

### GET `/approval-workflow/detail/{id}`

`data` 返回：

```json
{
  "id": 1,
  "code": "WF202603170001",
  "applicant": "张三",
  "status": "pending",
  "currentStep": "财务审批",
  "rejectCount": 0,
  "formData": {
    "title": "费用申请",
    "type": "报销",
    "amount": 1200,
    "reason": "外出差旅"
  },
  "records": [
    {
      "id": 1,
      "action": "start",
      "operator": "张三",
      "comment": "发起申请",
      "createdAt": "2026-03-17 10:00:00"
    }
  ],
  "createdAt": "2026-03-17 10:00:00",
  "updatedAt": "2026-03-17 12:00:00"
}
```

### POST `/approval-workflow/start`

```json
{
  "title": "费用申请",
  "type": "报销",
  "amount": 1200,
  "reason": "外出差旅",
  "applicant": "张三"
}
```

### POST `/approval-workflow/action`

```json
{
  "id": 1,
  "action": "approve",
  "operator": "财务A",
  "comment": "通过",
  "patchData": {
    "amount": 1000
  }
}
```

## 6. 电子合同

### GET `/e-contract/list`

查询参数：

- `keyword?: string`
- `status?: draft | pending_a | pending_b | rejected | completed`
- `page?: number`
- `pageSize?: number`

### GET `/e-contract/detail?id={id}`

`data` 返回：

```json
{
  "id": 1,
  "code": "EC202603170001",
  "createdBy": "法务A",
  "status": "pending_a",
  "statusLabel": "待甲方签署",
  "currentStep": "甲方签章",
  "formData": {
    "title": "采购合同",
    "counterparty": "某某科技",
    "amount": 50000,
    "content": "合同正文"
  },
  "signatures": {
    "partyA": {
      "signerName": "张三",
      "signerRole": "partyA",
      "signedAt": "2026-03-17 10:00:00",
      "signatureData": "base64"
    }
  },
  "rejectReason": "",
  "records": [],
  "createdAt": "2026-03-17 09:00:00",
  "updatedAt": "2026-03-17 10:00:00"
}
```

### POST `/e-contract/create`

### POST `/e-contract/update`

### POST `/e-contract/submit`

### POST `/e-contract/reject`

### POST `/e-contract/sign`

请求体字段按前端当前 service：

```json
{
  "id": 1,
  "title": "采购合同",
  "counterparty": "某某科技",
  "amount": 50000,
  "content": "合同正文",
  "createdBy": "法务A",
  "operator": "张三",
  "comment": "同意",
  "signerRole": "partyA",
  "signatureData": "base64"
}
```

## 7. 用户管理

### GET `/users/list`

查询参数：

- `keyword?: string`
- `role?: string`
- `status?: active | invited | disabled`
- `page?: number`
- `pageSize?: number`

### POST `/users/add`

### PUT `/users/update`

### DELETE `/users/delete/{id}`

用户对象：

```json
{
  "id": 1,
  "code": "U-1001",
  "name": "李文心",
  "email": "wenxin@example.com",
  "department": "产品",
  "location": "上海",
  "role": "管理员",
  "status": "active",
  "lastActive": "10 分钟前",
  "joinedAt": "2026-03-01",
  "avatar": "https://example.com/avatar.png",
  "online": true
}
```

### POST `/users/visit/register`

```json
{
  "visitorName": "访客-001",
  "path": "/users"
}
```

### GET `/users/visit/logs`

查询参数：

- `page?: number`
- `pageSize?: number`

## 8. 分片上传

### POST `/upload/check`

```json
{
  "fileHash": "md5",
  "fileName": "a.zip",
  "fileSize": 1024,
  "chunkSize": 5242880,
  "totalChunks": 10
}
```

`data` 返回：

```json
{
  "shouldUpload": true,
  "merged": false,
  "uploadedChunks": [],
  "fileUrl": ""
}
```

### POST `/upload/chunk`

### POST `/upload/merge`

### GET `/upload/tasks?keyword=xxx`

### DELETE `/upload/remove/{fileHash}`

任务对象：

```json
{
  "fileHash": "md5",
  "fileName": "a.zip",
  "fileSize": 1024,
  "chunkSize": 5242880,
  "totalChunks": 10,
  "uploadedChunks": 3,
  "progress": 30,
  "status": "uploading",
  "createdAt": "2026-03-17 10:00:00",
  "updatedAt": "2026-03-17 10:01:00",
  "fileUrl": ""
}
```

## 9. 课堂抽签

### GET `/class-lottery/students`

`data` 返回：

```json
{
  "list": [
    { "id": "stu-1", "name": "张三" }
  ],
  "total": 1,
  "updatedAt": "2026-03-17 12:00:00"
}
```

### PUT `/class-lottery/students`

```json
{
  "students": ["张三", "李四", "王五"]
}
```

## 10. 基金

### GET `/fund/list`

`data` 返回数组：

```json
[
  {
    "code": "161725",
    "name": "招商中证白酒指数",
    "type": "指数型",
    "nav": 1.8234,
    "estimateNav": 1.8612,
    "estimateChange": 2.07,
    "updateTime": "14:05",
    "holdShares": 2000,
    "holdCost": 1.65
  }
]
```

### POST `/fund/add`

```json
{
  "code": "161725",
  "shares": 2000,
  "cost": 1.65
}
```

### DELETE `/fund/delete`

```json
{
  "code": "161725"
}
```

## 11. 售货机

### GET `/vending/list`

查询参数：

- `page?: number`
- `pageSize?: number`
- `keyword?: string`
- `status?: online | offline | warning`

`data` 返回：

```json
{
  "list": [
    {
      "id": "VM-001",
      "name": "1号售货机",
      "location": "办公楼 A 座一层",
      "status": "online",
      "temperature": 4.5,
      "productCount": 12,
      "todaySales": 68,
      "todayRevenue": 486,
      "lastMaintenance": "2026-03-01",
      "createTime": "2026-01-10 09:00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10
}
```

### POST `/vending/add`

### PUT `/vending/update`

```json
{
  "id": "VM-001",
  "name": "1号售货机",
  "location": "办公楼 A 座一层",
  "status": "online"
}
```

### DELETE `/vending/delete/{id}`

### GET `/vending/monitor?id={id}`

`data` 返回：

```json
{
  "machine": {
    "id": "VM-001",
    "name": "1号售货机",
    "location": "办公楼 A 座一层",
    "status": "online",
    "temperature": 4.5,
    "uptime": 720,
    "lastMaintenance": "2026-03-01"
  },
  "products": [
    {
      "id": "product-1",
      "name": "可口可乐",
      "slot": 1,
      "row": 0,
      "col": 0,
      "stock": 8,
      "maxStock": 10,
      "price": 5,
      "color": "#ef4444"
    }
  ],
  "sales": {
    "todaySales": 68,
    "todayRevenue": 486,
    "weekSales": [45, 52, 68, 41, 73, 89, 68],
    "topProducts": [
      {
        "name": "可口可乐",
        "count": 23,
        "revenue": 115
      }
    ]
  },
  "alerts": [
    {
      "id": "alert-1",
      "type": "warning",
      "message": "可口可乐库存不足",
      "time": "10:23"
    }
  ]
}
```

## 12. 装机中心

### GET `/pc-builder/prices`

`data` 返回：

```json
{
  "updatedAt": "2026-03-17T14:00:00.000Z",
  "categories": [
    {
      "key": "cpu",
      "label": "CPU",
      "options": [
        {
          "id": "cpu-7500f",
          "name": "AMD Ryzen 5 7500F",
          "specs": "6核12线程",
          "score": 79,
          "prices": [
            {
              "platform": "jd",
              "price": 1049,
              "url": "https://item.jd.com/"
            }
          ]
        }
      ]
    }
  ]
}
```

## 13. IM

### POST `/im/session/connect`

### POST `/im/session/disconnect`

### GET `/im/bootstrap`

`data` 返回：

```json
{
  "currentUser": {
    "id": "u-1",
    "name": "我",
    "avatar": "https://example.com/u-1.png",
    "status": "online"
  },
  "conversations": [
    {
      "id": "conv-1",
      "title": "产品讨论组",
      "avatar": "https://example.com/group.png",
      "mode": "group",
      "members": [
        {
          "id": "u-1",
          "name": "我",
          "avatar": "https://example.com/u-1.png",
          "status": "online"
        }
      ],
      "lastMessage": "今天下午同步一下版本节奏",
      "lastTime": 1770000000000,
      "unread": 2,
      "pinned": true,
      "typing": false
    }
  ],
  "activeConversationId": "conv-1"
}
```

### GET `/im/conversations/{convId}/messages`

`data` 返回：

```json
{
  "list": [
    {
      "id": "msg-1",
      "convId": "conv-1",
      "senderId": "u-2",
      "senderName": "梁欢",
      "content": "先对齐一下需求风险",
      "type": "text",
      "createdAt": 1770000000000,
      "status": "sent",
      "fileName": ""
    }
  ]
}
```

### POST `/im/conversations/{convId}/messages`

```json
{
  "convId": "conv-1",
  "content": "收到，10 分钟内回复",
  "type": "text",
  "fileName": ""
}
```

直接返回新消息对象。

### POST `/im/conversations/{convId}/read`

### POST `/im/conversations/{convId}/pin`

```json
{
  "pinned": true
}
```

## 14. 直播中心

### GET `/live-center/dashboard`

建议一次性返回整页快照。

`data` 顶层字段：

- `heroTags: string[]`
- `heroMetrics: HeroMetric[]`
- `kpiCards: KpiCard[]`
- `roomList: StreamRoom[]`
- `liveDataCards: LiveDataCard[]`
- `liveFeed: LiveFeedItem[]`
- `trafficHighlights: TrafficHighlight[]`
- `giftItems: GiftItem[]`
- `rechargePackages: RechargePackage[]`
- `walletSummary: WalletSummary`
- `recentTransactions: WalletTransaction[]`
- `scheduleItems: ScheduleItem[]`
- `scriptBlocks: ScriptBlock[]`
- `conversionRanking: ConversionRow[]`
- `productItems: ProductItem[]`
- `teamTasks: TeamTask[]`
- `alerts: AlertItem[]`
- `roomDetails: Record<string, LiveRoomDetail>`

### `roomDetails` 示例

```json
{
  "room-main": {
    "viewerRanking": [
      {
        "name": "用户A",
        "badge": "高贡献用户",
        "score": "27 连击",
        "bucket": "paying",
        "accent": "rose"
      }
    ],
    "roomProduct": {
      "name": "双抗修护精华套组",
      "badge": "爆品主推",
      "summary": "商品摘要",
      "price": "￥329",
      "sold": "4860",
      "inventory": "1280",
      "discount": "买一送一",
      "perks": ["赠面膜", "限时券"]
    },
    "metrics": {
      "interactRate": "18.4%",
      "cartRate": "9.2%",
      "stayDuration": "12m 18s",
      "latency": "1.2s",
      "hourlyGmv": "￥2.6万/h",
      "audienceTrend": "+12.8%",
      "payRate": "7.9%"
    },
    "sceneSegments": [
      {
        "id": "main-hero",
        "label": "爆品讲解",
        "window": "18:20 - 19:10",
        "goal": "聚焦高转化商品",
        "progress": 42,
        "tone": "rose"
      }
    ],
    "signals": [
      {
        "label": "商品点击率",
        "value": "28.6%",
        "note": "当前点击率高于均值",
        "tone": "amber"
      }
    ],
    "conversionHint": {
      "title": "当前转化窗口放大",
      "detail": "建议接下来 10 分钟连续挂限时券"
    },
    "quickActions": ["发限时券", "切商品卡", "插入福利口播"],
    "defaultSegmentId": "main-hero"
  }
}
```

### POST `/live-center/send-gift`

```json
{
  "roomId": "room-main",
  "giftId": "gift-rocket"
}
```

### POST `/live-center/recharge`

```json
{
  "roomId": "room-main",
  "packageId": "pkg-2"
}
```

两个接口统一返回：

```json
{
  "liveFeed": [],
  "recentTransactions": [],
  "walletSummary": {
    "balance": 8620,
    "giftSpendToday": 2860,
    "rechargeToday": 6480
  }
}
```

## 15. 高中课表

### GET `/high-school-schedule/courses`

`data` 返回：

```json
{
  "list": [
    {
      "id": "course-1",
      "teacherName": "王老师",
      "subject": "语文",
      "grade": "高一",
      "className": "1班",
      "weekday": "周一",
      "period": "第1节",
      "classroom": "高一(1)班"
    }
  ],
  "swapLogs": [
    {
      "id": "log-1",
      "timestamp": "2026-03-17 14:00:00",
      "summary": "王老师与李老师互换上课时间",
      "reason": "外出培训"
    }
  ],
  "updatedAt": "2026-03-17 14:00:00"
}
```

### POST `/high-school-schedule/courses`

### PUT `/high-school-schedule/courses/{id}`

请求体：

```json
{
  "teacherName": "王老师",
  "subject": "语文",
  "grade": "高一",
  "className": "1班",
  "weekday": "周一",
  "period": "第1节",
  "classroom": "高一(1)班"
}
```

### DELETE `/high-school-schedule/courses/{id}`

### POST `/high-school-schedule/courses/swap`

```json
{
  "firstCourseId": "course-1",
  "secondCourseId": "course-2",
  "mode": "timeslot",
  "reason": "外出培训"
}
```

返回建议直接复用 `GET /high-school-schedule/courses` 的结构。

### POST `/high-school-schedule/courses/import`

```json
{
  "courses": [
    {
      "teacherName": "王老师",
      "subject": "语文",
      "grade": "高一",
      "className": "1班",
      "weekday": "周一",
      "period": "第1节",
      "classroom": "高一(1)班"
    }
  ]
}
```

### POST `/high-school-schedule/courses/reset`

作用：恢复系统示例数据。

返回建议直接复用 `GET /high-school-schedule/courses` 的结构。

## 16. 现有真实接口示例

下面这 3 个接口是项目里已经存在的真实后端风格，可以继续沿用：

### GET `/media/zhzb/currentLiveCourses`

当前直播课程列表。

### GET `/media/appraiseTaskSend/submitDetail`

查询参数按当前业务传入，前端已接成：

```ts
request<any>('/media/appraiseTaskSend/submitDetail', 'GET', params)
```

### POST `/media/courseAttendance/send`

课程考勤提交。

## 17. 备注

- 前端开发环境已默认关闭 mock，通过 `VITE_USE_MOCK=false` 生效。
- 前端通过 `VITE_DEV_SERVER_URL` 直连后端。
- 当前前端已经按本文档中的路径和字段改造，后端按本文档实现即可直接联调。

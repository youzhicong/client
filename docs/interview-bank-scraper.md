# 面试题题库采集脚本

这个项目已经提供了一个基础版题库采集器，用来把外部题源同步到前端页面使用的题库模块。

## 目标

- 保留手写的高质量题库
- 支持从外部题源自动补题
- 生成一个可以直接被页面消费的 `generatedQuestionBank.ts`
- 自动跳过和手写题库重名的题目

## 命令

```bash
pnpm interview:sync
pnpm interview:test
```

## 当前结构

```text
scripts/interview-bank/
  sync.mjs
  test.mjs
  sources.json
  sources.test.json
  fixtures/
src/views/frontend-interview/
  questionBank.ts
  generatedQuestionBank.ts
```

其中：

- `sources.json` 用于真实站点采集
- `sources.test.json` 用于本地稳定测试

## 支持的题源类型

### 1. JSON 题源

适合页面背后存在公开接口的场景。

关键配置：

- `type: "json"`
- `itemPath`
- `titlePath`
- `tagsPath`
- `answerPath`
- `levelPath`

### 2. HTML 题源

适合只有页面、没有现成接口的场景。

关键配置：

- `type: "html"`
- `itemPattern`
- `titlePatterns`
- `tagPattern`
- `answerItemPattern`
- `answerBlockPatterns`

## 配置说明

`sources.json` 里每个 source 至少要有：

- `id`
- `name`
- `type`
- `framework`
- `url` 或 `filePath`

`framework` 只支持：

- `foundation`
- `handwriting`
- `vue`
- `react`

## 当前已接入

- 百度开发者中心文章页
- 掘金搜索接口
  - 通用前端题
  - Vue 题
  - React 题
  - 手写题

说明：

- 百度这边当前接的是开发者中心的面试题文章页，不是百度普通搜索结果页
- 掘金这边当前接的是搜索接口，按“前端 面试题”关键词拉取文章列表

## 接入真实网站时的建议

1. 先看网络面板，优先找 JSON 接口。
2. 如果只能抓 HTML，先把题目区块 pattern 跑通，再补标签和答案提取。
3. 不要整站照搬，先同步标题、标签、分类，答案建议统一清洗后再入库。
4. 注意目标网站的使用条款、版权和反爬限制。

## 页面数据合并方式

页面仍然保留手写题库；自动采集结果会写入 `generatedQuestionBank.ts`，并在运行时和手写题库合并：

- 同名题目默认跳过，避免重复展示
- 生成 section key 冲突时自动追加后缀

## 下一步可继续做

1. 增加 AI 清洗答案步骤
2. 增加 source 级别的去重规则
3. 增加定时同步和原始数据缓存
4. 给前端页面加上“最近同步时间”和“题源标签”

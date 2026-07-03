<template>
  <AgentPlatformPage title="" description="" active="api">
    <header class="platform-hero">
      <div class="platform-hero-inner">
        <div>
          <span class="platform-kicker">OpenAI Compatible</span>
          <h2>API 接入</h2>
          <p>Chat Completions 兼容接口说明 · 流式 SSE 已支持</p>
        </div>
        <div class="platform-hero-actions">
          <router-link to="/ai/settings" class="platform-btn-ghost"
            >模型配置</router-link
          >
          <button
            v-if="endpoint"
            type="button"
            class="platform-btn-primary"
            @click="copy(endpoint)"
          >
            复制 Endpoint
          </button>
        </div>
      </div>
    </header>

    <div class="api-grid">
      <article class="api-card platform-panel">
        <div class="api-card-head">
          <span class="api-icon">🔗</span>
          <strong>Endpoint</strong>
        </div>
        <code class="api-code">{{
          endpoint || '请先在模型配置页填写 Base URL'
        }}</code>
      </article>

      <article class="api-card platform-panel">
        <div class="api-card-head">
          <span class="api-icon">🔐</span>
          <strong>鉴权</strong>
        </div>
        <p>请求头：<code>Authorization: Bearer &lt;API_KEY&gt;</code></p>
        <p>Content-Type：<code>application/json</code></p>
      </article>

      <article class="api-card platform-panel span-2">
        <div class="api-card-head">
          <span class="api-icon">📋</span>
          <strong>请求示例</strong>
          <button
            type="button"
            class="platform-btn-ghost"
            @click="copy(curlSample)"
          >
            复制 cURL
          </button>
        </div>
        <pre>{{ curlSample }}</pre>
      </article>

      <article class="api-card platform-panel">
        <div class="api-card-head">
          <span class="api-icon">⚡</span>
          <strong>流式输出</strong>
        </div>
        <p>
          设置 <code>"stream": true</code> 即可使用 SSE 流式响应，Agent
          聊天与普通模式均已支持。
        </p>
      </article>

      <article class="api-card platform-panel">
        <div class="api-card-head">
          <span class="api-icon">🧪</span>
          <strong>快速验证</strong>
        </div>
        <p>配置完成后可在 Playground 或 Agent 聊天中直接验证接口连通性。</p>
        <router-link to="/ai/playground" class="api-link"
          >打开 Playground →</router-link
        >
      </article>
    </div>

    <section class="api-section platform-panel">
      <div class="api-section-head">
        <div>
          <span class="platform-kicker">FlowAgent Platform API</span>
          <h3>平台开放能力（规划中）</h3>
          <p>
            面向企业集成的工作流触发、Agent 对话与 Trace 查询接口 ·
            当前为产品规格说明
          </p>
        </div>
        <span class="api-roadmap-pill">Beta 规划</span>
      </div>
      <div class="platform-api-grid">
        <article
          v-for="item in platformApis"
          :key="item.method"
          class="platform-api-card"
        >
          <div class="platform-api-meta">
            <span class="http-method" :class="item.methodClass">{{
              item.method
            }}</span>
            <code>{{ item.path }}</code>
          </div>
          <strong>{{ item.title }}</strong>
          <p>{{ item.desc }}</p>
        </article>
      </div>
      <div class="api-section-foot">
        <p>
          生产环境需配合：API Key 管理、速率限制、Webhook
          回调与审计日志。详见账号设置 → 账单与 API 密钥（演示）。
        </p>
        <router-link to="/account-settings?tab=billing" class="api-link"
          >查看 API 密钥说明 →</router-link
        >
      </div>
    </section>
  </AgentPlatformPage>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import AgentPlatformPage from '@/components/agent/AgentPlatformPage.vue'
import {
  getAIChatEndpoint,
  getAISettings,
  normalizeAISettings
} from '@/services/ai'

const settings = computed(() => normalizeAISettings(getAISettings()))
const endpoint = computed(() => getAIChatEndpoint(settings.value))

const curlSample = computed(() => {
  const url =
    endpoint.value || 'https://your-api.example.com/v1/chat/completions'
  return `curl ${url} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "${settings.value.model || 'your-model'}",
    "messages": [{"role":"user","content":"你好"}],
    "stream": true
  }'`
})

const copy = async (text: string) => {
  await navigator.clipboard.writeText(text)
  ElMessage.success('已复制')
}

const platformApis = [
  {
    method: 'POST',
    methodClass: 'post',
    path: '/v1/workflows/run',
    title: '触发 Multi-Agent 工作流',
    desc: '传入 keyword、是否启用商务闭环，异步返回 taskId 与报告链接'
  },
  {
    method: 'POST',
    methodClass: 'post',
    path: '/v1/chat/completions',
    title: 'Agent 对话（平台代理）',
    desc: '统一鉴权与计量，支持 tools 与 stream，替代直连模型 Key'
  },
  {
    method: 'GET',
    methodClass: 'get',
    path: '/v1/traces',
    title: '查询调用 Trace',
    desc: '按 sessionId、类型、时间范围拉取观测记录'
  },
  {
    method: 'POST',
    methodClass: 'post',
    path: '/v1/knowledge/search',
    title: '知识库检索',
    desc: '向量 + 关键词混合检索，返回引用片段供 RAG'
  }
]
</script>

<style scoped lang="scss">
@use '@/style/platform-page.scss';

.api-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.api-card {
  &.span-2 {
    grid-column: 1 / -1;
  }

  p {
    margin: 0 0 8px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--app-text-sub);

    &:last-child {
      margin-bottom: 0;
    }

    code {
      font-size: 12px;
    }
  }
}

.api-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;

  strong {
    flex: 1;
    font-size: 15px;
    color: var(--app-text-main);
  }
}

.api-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--app-accent-soft);
  font-size: 18px;
}

.api-code {
  display: block;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--app-surface-muted);
  font-size: 12px;
  word-break: break-all;
  color: var(--app-text-main);
}

pre {
  margin: 0;
  padding: 14px;
  border-radius: 12px;
  background: #0f172a;
  color: #e2e8f0;
  white-space: pre-wrap;
  font-size: 12px;
  line-height: 1.6;
}

.api-link {
  display: inline-block;
  margin-top: 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--app-accent);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.api-section {
  margin-top: 16px;
  padding: 20px;
}

.api-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;

  h3 {
    margin: 8px 0 6px;
    font-size: 18px;
    color: var(--app-text-main);
  }

  p {
    margin: 0;
    font-size: 13px;
    color: var(--app-text-sub);
    line-height: 1.6;
  }
}

.api-roadmap-pill {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(217, 119, 6, 0.1);
  border: 1px solid rgba(217, 119, 6, 0.25);
  color: #b45309;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.platform-api-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.platform-api-card {
  padding: 14px;
  border-radius: 12px;
  border: 1px dashed var(--app-border-strong);
  background: var(--app-surface-muted);

  strong {
    display: block;
    margin: 8px 0 4px;
    font-size: 14px;
    color: var(--app-text-main);
  }

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.55;
    color: var(--app-text-sub);
  }
}

.platform-api-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  code {
    font-size: 11px;
    color: var(--app-accent);
  }
}

.http-method {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;

  &.post {
    background: rgba(37, 99, 235, 0.12);
    color: var(--app-accent);
  }

  &.get {
    background: rgba(22, 163, 74, 0.12);
    color: var(--app-success);
  }
}

.api-section-foot {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--app-border);

  p {
    margin: 0 0 8px;
    font-size: 12px;
    color: var(--app-text-sub);
    line-height: 1.6;
  }
}

@media (max-width: 960px) {
  .api-grid {
    grid-template-columns: 1fr;
  }

  .platform-api-grid {
    grid-template-columns: 1fr;
  }

  .api-card.span-2 {
    grid-column: auto;
  }
}
</style>

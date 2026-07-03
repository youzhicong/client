<template>
  <AgentPlatformPage title="" description="" active="tools">
    <header class="platform-hero">
      <div class="platform-hero-inner">
        <div>
          <span class="platform-kicker">Tool Plugins</span>
          <h2>工具插件</h2>
          <p>Agent 内置工具 + 可扩展 HTTP / MCP 插件，注册后聊天自动加载</p>
        </div>
        <div class="platform-hero-actions">
          <div class="platform-hero-stat">
            <strong>{{ totalToolCount }}</strong>
            <span>可用工具</span>
          </div>
          <div class="platform-hero-stat">
            <strong>{{ httpPluginCount }}</strong>
            <span>HTTP</span>
          </div>
          <div class="platform-hero-stat">
            <strong>{{ mcpPluginCount }}</strong>
            <span>MCP</span>
          </div>
        </div>
      </div>
    </header>

    <div class="tools-layout">
      <section class="platform-section">
        <div class="platform-section-head">
          <div>
            <strong>内置工具</strong>
            <span>{{ builtinTools.length }} 个 · Agent 默认加载</span>
          </div>
          <router-link to="/ai/chat" class="section-link">去验证 →</router-link>
        </div>
        <div class="tool-grid">
          <article
            v-for="tool in builtinTools"
            :key="tool.name"
            class="tool-card platform-card"
          >
            <span class="tool-icon">🔧</span>
            <strong>{{ tool.name }}</strong>
            <p>{{ tool.description }}</p>
            <ul>
              <li v-for="(meta, key) in tool.parameters" :key="key">
                {{ key }} · {{ meta.type }}{{ meta.required ? ' *' : '' }}
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section class="platform-section plugin-section">
        <div class="platform-section-head">
          <div>
            <strong>自定义插件</strong>
            <span>HTTP GET（参数 q）· MCP 演示模拟</span>
          </div>
        </div>

        <div class="plugin-register platform-panel">
          <div class="plugin-kind-toggle">
            <button
              type="button"
              :class="{ active: pluginForm.kind === 'http' }"
              @click="pluginForm.kind = 'http'"
            >
              HTTP
            </button>
            <button
              type="button"
              :class="{ active: pluginForm.kind === 'mcp' }"
              @click="pluginForm.kind = 'mcp'"
            >
              MCP
            </button>
          </div>
          <div class="plugin-form">
            <input
              v-model="pluginForm.name"
              placeholder="插件名称，如：天气查询"
            />
            <input
              v-if="pluginForm.kind === 'http'"
              v-model="pluginForm.url"
              placeholder="HTTP 端点，如：https://httpbin.org/get"
            />
            <input
              v-else
              v-model="pluginForm.mcpServer"
              placeholder="MCP Server 名称，如：filesystem"
            />
            <input
              v-if="pluginForm.kind === 'mcp'"
              v-model="pluginForm.url"
              placeholder="可选 MCP 网关 URL（留空则本地模拟）"
            />
            <textarea
              v-model="pluginForm.desc"
              rows="2"
              placeholder="描述（Agent 选择工具时会看到）"
            />
            <button type="button" class="register-btn" @click="handleAddPlugin">
              注册并启用
            </button>
          </div>
        </div>

        <div class="tool-grid custom-grid">
          <article
            v-for="plugin in customPlugins"
            :key="plugin.id"
            class="tool-card platform-card custom"
            :class="plugin.kind"
          >
            <div class="plugin-head">
              <span class="tool-icon">{{
                plugin.kind === 'mcp' ? '🔌' : '🌐'
              }}</span>
              <span class="live-badge">{{
                plugin.kind === 'mcp' ? 'MCP' : 'HTTP'
              }}</span>
            </div>
            <strong>{{ plugin.name }}</strong>
            <p>{{ plugin.desc }}</p>
            <code v-if="plugin.kind === 'http'">{{ plugin.url }}</code>
            <code v-else
              >{{ plugin.mcpServer || plugin.name
              }}{{ plugin.url ? ` · ${plugin.url}` : '' }}</code
            >
            <button
              type="button"
              class="remove-btn"
              @click="removePlugin(plugin.id)"
            >
              移除
            </button>
          </article>
          <div v-if="!customPlugins.length" class="platform-empty custom-empty">
            <div class="empty-icon">🧩</div>
            <p>
              暂无自定义插件。可注册 httpbin 等公开 GET 接口，或添加 MCP
              演示插件。
            </p>
          </div>
        </div>
      </section>
    </div>
  </AgentPlatformPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AgentPlatformPage from '@/components/agent/AgentPlatformPage.vue'
import {
  addCustomHttpPlugin,
  getCustomHttpPlugins,
  removeCustomHttpPlugin,
  type CustomHttpPlugin,
  type CustomPluginKind
} from '@/services/ai-agent/custom-plugins'
import { chatAgentTools, getChatAgentTools } from '@/services/ai-agent/tools'

const builtinTools = chatAgentTools
const customPlugins = ref<CustomHttpPlugin[]>([])
const pluginForm = ref({
  kind: 'http' as CustomPluginKind,
  name: '',
  url: '',
  mcpServer: '',
  desc: ''
})

const totalToolCount = computed(() => getChatAgentTools().length)
const httpPluginCount = computed(
  () => customPlugins.value.filter((item) => item.kind === 'http').length
)
const mcpPluginCount = computed(
  () => customPlugins.value.filter((item) => item.kind === 'mcp').length
)

const refresh = () => {
  customPlugins.value = getCustomHttpPlugins()
}

const handleAddPlugin = () => {
  if (!pluginForm.value.name.trim()) {
    ElMessage.warning('请填写名称')
    return
  }
  if (pluginForm.value.kind === 'http') {
    if (!pluginForm.value.url.trim()) {
      ElMessage.warning('请填写 HTTP URL')
      return
    }
    try {
      new URL(pluginForm.value.url.trim())
    } catch {
      ElMessage.warning('URL 格式不正确')
      return
    }
  } else if (
    !pluginForm.value.mcpServer.trim() &&
    !pluginForm.value.url.trim()
  ) {
    ElMessage.warning('MCP 插件请填写 Server 名称或网关 URL')
    return
  }

  if (pluginForm.value.kind === 'mcp' && pluginForm.value.url.trim()) {
    try {
      new URL(pluginForm.value.url.trim())
    } catch {
      ElMessage.warning('MCP 网关 URL 格式不正确')
      return
    }
  }

  addCustomHttpPlugin(pluginForm.value)
  refresh()
  pluginForm.value = {
    kind: 'http',
    name: '',
    url: '',
    mcpServer: '',
    desc: ''
  }
  ElMessage.success(
    `插件已注册，Agent 现有 ${getChatAgentTools().length} 个工具`
  )
}

const removePlugin = (id: string) => {
  removeCustomHttpPlugin(id)
  refresh()
  ElMessage.success('已移除')
}

onMounted(refresh)
</script>

<style scoped lang="scss">
@use '@/style/platform-page.scss';

.section-link {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-accent);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.tools-layout {
  display: grid;
  gap: 8px;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.custom-grid {
  margin-top: 14px;
}

.tool-card {
  strong {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    color: var(--app-text-main);
  }

  p {
    margin: 0 0 8px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--app-text-sub);
  }

  ul {
    margin: 0;
    padding-left: 18px;
    font-size: 12px;
    color: var(--app-text-faint);
  }

  code {
    display: block;
    margin-top: 8px;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--app-surface-muted);
    font-size: 11px;
    word-break: break-all;
  }
}

.tool-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  margin-bottom: 10px;
  border-radius: 11px;
  background: var(--app-surface-muted);
  font-size: 18px;
}

.plugin-register {
  margin-bottom: 4px;
}

.plugin-kind-toggle {
  display: inline-flex;
  margin-bottom: 12px;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);

  button {
    padding: 7px 16px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--app-text-sub);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;

    &.active {
      background: var(--app-accent);
      color: #fff;
    }
  }
}

.plugin-form {
  display: grid;
  gap: 10px;

  input,
  textarea {
    width: 100%;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--app-border);
    background: var(--app-surface-muted);
    color: var(--app-text-main);
    font-size: 13px;
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: var(--app-accent-muted);
      box-shadow: var(--app-search-focus-shadow);
    }
  }
}

.register-btn {
  width: fit-content;
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background: var(--app-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--app-accent-strong);
  }
}

.plugin-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.live-badge {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
  font-weight: 700;
}

.tool-card.mcp .live-badge {
  background: #ede9fe;
  color: #6d28d9;
  border-color: #ddd6fe;
}

.tool-card.custom.http {
  border-color: rgba(22, 163, 74, 0.2);
  background: linear-gradient(180deg, #f0fdf4 0%, var(--app-surface) 100%);
}

.tool-card.custom.mcp {
  border-color: rgba(109, 40, 217, 0.2);
  background: linear-gradient(180deg, #f5f3ff 0%, var(--app-surface) 100%);
}

.remove-btn {
  margin-top: 10px;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #fee2e2;
  }
}

.custom-empty {
  grid-column: 1 / -1;
}

@media (max-width: 960px) {
  .tool-grid {
    grid-template-columns: 1fr;
  }
}
</style>

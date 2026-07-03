<template>
  <AgentPlatformPage title="" description="" active="knowledge">
    <header class="platform-hero">
      <div class="platform-hero-inner">
        <div>
          <span class="platform-kicker">RAG Knowledge</span>
          <h2>知识库</h2>
          <p>
            本地文档切片与关键词检索 · Agent 可通过 search_knowledge_base
            工具检索
          </p>
        </div>
        <div class="platform-hero-actions">
          <div class="platform-hero-stat">
            <strong>{{ kbs.length }}</strong>
            <span>知识库</span>
          </div>
          <div class="platform-hero-stat">
            <strong>{{ totalDocs }}</strong>
            <span>文档</span>
          </div>
          <router-link to="/ai/chat" class="platform-btn-primary"
            >去聊天验证</router-link
          >
        </div>
      </div>
    </header>

    <div class="platform-toolbar">
      <input
        v-model="newKbName"
        class="toolbar-input"
        placeholder="新建知识库名称"
      />
      <button
        type="button"
        class="platform-btn-primary"
        @click="handleCreateKb"
      >
        创建
      </button>
      <input
        v-model="searchQuery"
        class="toolbar-input search"
        placeholder="检索文档…"
        @keyup.enter="runSearch"
      />
      <button type="button" class="platform-btn-ghost" @click="runSearch">
        搜索
      </button>
    </div>

    <div class="platform-workbench">
      <aside class="platform-panel kb-sidebar">
        <div class="studio-side-head">
          <strong>知识库列表</strong>
          <span>{{ kbs.length }} 个</span>
        </div>
        <div class="kb-list">
          <button
            v-for="kb in kbs"
            :key="kb.id"
            type="button"
            class="platform-list-item kb-item"
            :class="{ active: kb.id === activeKbId }"
            @click="activeKbId = kb.id"
          >
            <span class="platform-list-icon">📚</span>
            <div class="platform-list-copy">
              <strong>{{ kb.name }}</strong>
              <p>{{ kb.docs.length }} 篇文档</p>
            </div>
          </button>
        </div>
        <div v-if="!kbs.length" class="platform-empty">
          <div class="empty-icon">📂</div>
          <p>暂无知识库，先创建一个</p>
        </div>
      </aside>

      <section v-if="activeKb" class="platform-panel kb-main">
        <div class="panel-head">
          <div>
            <strong>{{ activeKb.name }}</strong>
            <p>{{ activeKb.desc || '暂无描述' }}</p>
          </div>
          <button type="button" class="btn-danger" @click="handleDeleteKb">
            删除库
          </button>
        </div>

        <div class="doc-form platform-form">
          <input v-model="docTitle" placeholder="文档标题" />
          <textarea v-model="docContent" rows="5" placeholder="粘贴文档内容…" />
          <button
            type="button"
            class="platform-btn-primary"
            @click="handleAddDoc"
          >
            添加文档
          </button>
        </div>

        <div class="studio-side-head">
          <strong>文档列表</strong>
          <span>{{ activeKb.docs.length }} 篇</span>
        </div>
        <div class="doc-list">
          <article
            v-for="doc in activeKb.docs"
            :key="doc.id"
            class="doc-card platform-card"
          >
            <strong>{{ doc.title }}</strong>
            <p>
              {{ doc.content.slice(0, 180)
              }}{{ doc.content.length > 180 ? '…' : '' }}
            </p>
          </article>
          <div v-if="!activeKb.docs.length" class="platform-empty compact">
            <p>还没有文档，在上方添加第一篇</p>
          </div>
        </div>
      </section>

      <section v-else class="platform-panel kb-placeholder">
        <div class="empty-icon">👈</div>
        <strong>选择或创建知识库</strong>
        <p>左侧选择知识库后，可添加文档供 Agent 检索</p>
      </section>
    </div>

    <div v-if="searchHits.length" class="search-results platform-section">
      <div class="platform-section-head">
        <div>
          <strong>检索结果</strong>
          <span>{{ searchHits.length }} 条命中</span>
        </div>
      </div>
      <div class="doc-list">
        <article
          v-for="(hit, index) in searchHits"
          :key="index"
          class="doc-card platform-card"
        >
          <strong>{{ hit.doc.title }} · {{ hit.kb }}</strong>
          <p>{{ hit.doc.content.slice(0, 240) }}</p>
        </article>
      </div>
    </div>
  </AgentPlatformPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AgentPlatformPage from '@/components/agent/AgentPlatformPage.vue'
import {
  addKnowledgeDoc,
  createKnowledgeBase,
  deleteKnowledgeBase,
  getKnowledgeBases,
  searchKnowledge,
  type KnowledgeBase
} from '@/services/ai-platform-store'

const kbs = ref<KnowledgeBase[]>([])
const activeKbId = ref('')
const newKbName = ref('')
const docTitle = ref('')
const docContent = ref('')
const searchQuery = ref('')
const searchHits = ref<
  Array<{ kb: string; doc: { title: string; content: string }; score: number }>
>([])

const activeKb = computed(() =>
  kbs.value.find((kb) => kb.id === activeKbId.value)
)
const totalDocs = computed(() =>
  kbs.value.reduce((sum, kb) => sum + kb.docs.length, 0)
)

const refresh = () => {
  kbs.value = getKnowledgeBases()
  if (!activeKbId.value && kbs.value.length) {
    activeKbId.value = kbs.value[0]!.id
  }
}

const handleCreateKb = () => {
  if (!newKbName.value.trim()) {
    ElMessage.warning('请输入知识库名称')
    return
  }
  const kb = createKnowledgeBase(newKbName.value)
  newKbName.value = ''
  refresh()
  activeKbId.value = kb.id
  ElMessage.success('知识库已创建')
}

const handleDeleteKb = () => {
  if (!activeKbId.value) return
  deleteKnowledgeBase(activeKbId.value)
  activeKbId.value = ''
  refresh()
  ElMessage.success('已删除')
}

const handleAddDoc = () => {
  if (!activeKbId.value || !docContent.value.trim()) {
    ElMessage.warning('请选择知识库并填写内容')
    return
  }
  addKnowledgeDoc(activeKbId.value, docTitle.value, docContent.value)
  docTitle.value = ''
  docContent.value = ''
  refresh()
  ElMessage.success('文档已添加')
}

const runSearch = () => {
  searchHits.value = searchKnowledge(searchQuery.value)
}

onMounted(() => {
  refresh()
  if (!kbs.value.length) {
    const kb = createKnowledgeBase('产品文档', 'FlowAgent 模块说明与 FAQ')
    addKnowledgeDoc(
      kb.id,
      '平台简介',
      'FlowAgent 提供 Multi-Agent 工作流、Agent 聊天、知识库、Prompt 工程、自动化与观测能力。'
    )
    refresh()
    activeKbId.value = kb.id
  }
})
</script>

<style scoped lang="scss">
@use '@/style/platform-page.scss';

.toolbar-input {
  flex: 1;
  min-width: 140px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  font-size: 13px;

  &.search {
    min-width: 200px;
  }
}

.kb-sidebar {
  min-height: 360px;
}

.kb-list {
  display: grid;
  gap: 8px;
}

.kb-item {
  width: 100%;
  text-align: left;
}

.kb-main {
  min-height: 360px;
}

.kb-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  text-align: center;
  background: var(--app-surface-muted);

  .empty-icon {
    font-size: 36px;
    margin-bottom: 10px;
  }

  strong {
    margin-bottom: 6px;
    color: var(--app-text-main);
  }

  p {
    margin: 0;
    font-size: 13px;
    color: var(--app-text-sub);
  }
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;

  strong {
    display: block;
    font-size: 16px;
    color: var(--app-text-main);
  }

  p {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--app-text-sub);
  }
}

.doc-form {
  margin-bottom: 18px;
  padding: 14px;
  border-radius: 14px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
}

.doc-list {
  display: grid;
  gap: 10px;
}

.doc-card {
  strong {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    color: var(--app-text-main);
  }

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.55;
    color: var(--app-text-sub);
    white-space: pre-wrap;
  }
}

.btn-danger {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.platform-empty.compact {
  padding: 24px 16px;
}

.search-results {
  margin-top: 18px;
}

@media (max-width: 960px) {
  .platform-workbench {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <header
    class="ai-agent-studio-head"
    :class="{
      'is-compact': compact,
      'is-portfolio-compact': compact && isPortfolioMode
    }"
  >
    <div class="ai-agent-studio-top" :class="{ 'is-titleless': !title }">
      <div v-if="title" class="ai-agent-studio-copy">
        <span class="ai-agent-studio-kicker">FlowAgent</span>
        <h1 class="ai-agent-studio-title">{{ title }}</h1>
        <p v-if="description && !compact" class="ai-agent-studio-desc">
          {{ description }}
        </p>
      </div>

      <div v-if="$slots.actions" class="ai-agent-head-actions">
        <slot name="actions" />
      </div>
    </div>

    <nav v-if="showSubnav" class="ai-agent-subnav" aria-label="Agent modules">
      <router-link
        class="ai-agent-subnav-link"
        :class="{ active: active === 'workflow' }"
        to="/ai/workflow"
      >
        产品工作流
      </router-link>
      <router-link
        class="ai-agent-subnav-link"
        :class="{ active: active === 'chat' }"
        to="/ai/chat"
      >
        Agent 聊天
      </router-link>
      <router-link
        class="ai-agent-subnav-link"
        :class="{ active: active === 'settings' }"
        to="/ai/settings"
      >
        模型配置
      </router-link>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { isPortfolioMode } from '@/config/portfolio'
import type { AiModuleKey } from '@/config/ai-platform'

defineOptions({
  name: 'AgentStudioHeader'
})

const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    active?: AiModuleKey | ''
    showNav?: boolean
    compact?: boolean
  }>(),
  {
    description: '',
    active: '',
    showNav: true,
    compact: false
  }
)

const showSubnav = computed(
  () => props.showNav && !(isPortfolioMode && props.compact)
)
</script>

<style scoped lang="scss">
@use '@/style/ai-agent-page.scss';

.ai-agent-studio-head.is-compact {
  margin-bottom: 12px;

  .ai-agent-studio-top {
    margin-bottom: 10px;
  }

  .ai-agent-studio-title {
    font-size: clamp(22px, 2.4vw, 28px);
  }
}

.ai-agent-studio-head.is-portfolio-compact {
  margin-bottom: 6px;

  .ai-agent-studio-top {
    margin-bottom: 0;
    align-items: center;

    &.is-titleless {
      min-height: 0;

      .ai-agent-studio-copy {
        display: none;
      }
    }

    &.is-titleless:not(:has(.ai-agent-head-actions > *)) {
      display: none;
    }
  }

  .ai-agent-studio-copy {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 8px 10px;
    min-width: 0;
  }

  .ai-agent-studio-kicker {
    margin-bottom: 0;
    padding: 2px 7px;
    font-size: 10px;
  }

  .ai-agent-studio-title {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
}
</style>

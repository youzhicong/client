<template>
  <div class="app-layout" :class="{ 'studio-route': isStudioRoute }">
    <!-- Header -->
    <headerNav></headerNav>
    <!-- Sidebar -->
    <sideMenu></sideMenu>
    <!-- Main content -->
    <main class="main-content">
      <div v-if="!isStudioRoute" class="breadcrumb-container">
        <div class="breadcrumb-inner">
          <AppBreadcrumb />
        </div>
      </div>
      <div class="content-scroll" :class="{ 'studio-scroll': isStudioRoute }">
        <router-view v-slot="{ Component }">
          <transition :name="isStudioRoute ? '' : 'page'" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import { useUserStore } from '@/stores'
import { registerVisit } from '@/services/users'
import {
  startAutomationScheduler,
  stopAutomationScheduler
} from '@/services/ai-automation/scheduler'

const route = useRoute()
const isStudioRoute = computed(() => route.path.startsWith('/ai'))

const VISIT_SESSION_KEY = 'pcdemo_visit_registered'
const VISIT_IP_KEY = 'pcdemo_current_visit_ip'
const VISITOR_NAME_KEY = 'pcdemo_visitor_name'

const userStore = useUserStore()

const resolveVisitorName = () => {
  const userData = userStore.user
  const candidates = [
    userData?.name,
    userData?.username,
    userData?.nickname,
    userData?.account
  ]
  const named = candidates.find(
    (item: unknown) => typeof item === 'string' && item.trim()
  )
  if (named) return String(named)

  const cached = localStorage.getItem(VISITOR_NAME_KEY)
  if (cached) return cached

  const generated = `访客-${Math.random().toString(36).slice(2, 6)}`
  localStorage.setItem(VISITOR_NAME_KEY, generated)
  return generated
}

onMounted(async () => {
  startAutomationScheduler()
  if (sessionStorage.getItem(VISIT_SESSION_KEY)) return

  try {
    const res = await registerVisit({
      visitorName: resolveVisitorName(),
      path: window.location.pathname
    })
    sessionStorage.setItem(VISIT_SESSION_KEY, '1')
    sessionStorage.setItem(VISIT_IP_KEY, res.data.ip)
  } catch {
    // Ignore analytics errors so the page remains usable.
  }
})

onUnmounted(() => {
  stopAutomationScheduler()
})
</script>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  background: var(--app-shell-bg);
}

.main-content {
  margin-top: var(--app-header-height);
  margin-left: var(--app-sidebar-width);
  min-height: calc(100vh - var(--app-header-height));
}

.content-scroll {
  min-height: calc(
    100vh - var(--app-header-height) - var(--app-breadcrumb-height)
  );
}

.content-scroll.studio-scroll {
  min-height: calc(100vh - var(--app-header-height));
  height: calc(100vh - var(--app-header-height));
  overflow: hidden;
  padding: 0 4px 4px;
  box-sizing: border-box;
}

.studio-route .breadcrumb-inner {
  max-width: none;
}

/* Page transition */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.22s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

.breadcrumb-container {
  background: var(--app-breadcrumb-bg);
  border-bottom: 1px solid var(--app-border);
}

.breadcrumb-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;
  min-height: var(--app-breadcrumb-height);
  display: flex;
  align-items: center;
}

@media (max-width: 1120px) {
  .main-content {
    margin-left: 248px;
  }
}

@media (max-width: 820px) {
  .main-content {
    margin-top: var(--app-header-height);
    margin-left: 0;
  }
}
</style>

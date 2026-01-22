<template>
  <div class="app-layout">
    <!-- 头部 -->
    <headerNav></headerNav>
    <!-- 侧边栏 -->
    <sideMenu></sideMenu>
    <!-- 主内容区 -->
    <main class="main-content">
      <div class="breadcrumb-container">
        <AppBreadcrumb />
      </div>
      <div class="content-scroll">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
</script>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%);
}

.main-content {
  margin-top: 64px;
  margin-left: 260px;
  min-height: calc(100vh - 64px);
}

.content-scroll {
  min-height: calc(100vh - 64px);
}

/* Page transition */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.breadcrumb-container {
  padding: 10px 20px;
  background: #fff;
  border-bottom: 1px solid #eef1f6;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}
</style>

<template>
  <div class="side">
    <el-menu :default-active="activePath" class="el-menu-vertical-demo" router>
      <el-menu-item
        v-for="item in menuItems"
        :key="item.index"
        :index="item.index"
      >
        <el-icon v-if="item.icon">
          <component :is="item.icon" />
        </el-icon>
        <span>{{ item.label }}</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ChatDotRound, Document, House, Rank } from '@element-plus/icons-vue'

const route = useRoute()

const menuItems = [
  { index: '/home', label: '首页', icon: House },
  { index: '/preview', label: '在线预览', icon: Document },
  { index: '/drag', label: '拖拽功能', icon: Rank },
  { index: '/im', label: '即时通信', icon: ChatDotRound }
]

const activePath = computed(() => route.path)
</script>

<style lang="scss" scoped>
.side {
  width: 200px;
  height: 100vh;
  background-color: #545c64;
  position: fixed;
  left: 0;
  top: 60px;
  z-index: 999;
}
</style>

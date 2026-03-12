<template>
  <nav class="live-subnav card" aria-label="直播模块页面导航">
    <router-link
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="live-subnav-link"
      :class="{ active: route.path === item.to }"
    >
      <span class="live-subnav-label">{{ item.label }}</span>
      <span class="live-subnav-desc">{{ item.desc }}</span>
    </router-link>
  </nav>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  {
    to: '/live-center/overview',
    label: '直播总览',
    desc: '模块总控与观看面板'
  },
  { to: '/live-center/data', label: '直播数据', desc: '流量热度与转化数据' },
  { to: '/live-center/rooms', label: '直播间', desc: '房间观看与切换流' },
  {
    to: '/live-center/monetization',
    label: '礼物充值',
    desc: '充值送礼与钱包流水'
  },
  {
    to: '/live-center/operations',
    label: '运营协同',
    desc: '排班、脚本与预警协同'
  }
]
</script>

<style scoped lang="scss">
.live-subnav {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.live-subnav-link {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 78px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid transparent;
  text-decoration: none;
  color: var(--lc-text);
  background: rgba(255, 255, 255, 0.82);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(15, 157, 146, 0.18);
    background: rgba(255, 255, 255, 0.96);
  }

  &.active {
    border-color: rgba(15, 157, 146, 0.24);
    background: linear-gradient(
      135deg,
      rgba(233, 249, 247, 0.96) 0%,
      rgba(241, 249, 255, 0.96) 100%
    );
    box-shadow: 0 12px 24px rgba(23, 57, 65, 0.08);
  }
}

.live-subnav-label {
  font-size: 14px;
  font-weight: 700;
}

.live-subnav-desc {
  color: var(--lc-muted);
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 1480px) {
  .live-subnav {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .live-subnav {
    grid-template-columns: 1fr;
  }
}
</style>

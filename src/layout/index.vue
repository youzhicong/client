<template>
  <!-- 头部 -->
  <headerNav></headerNav>
  <!-- 侧边栏 -->
  <sideMenu></sideMenu>
  <!-- 放二级路由出口 -->
  <div class="main-content">
    <router-view></router-view>
  </div>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.main-content {
  padding-top: 60px;
  padding-left: 200px;
}
</style>

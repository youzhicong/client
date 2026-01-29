<template>
  <div class="user-list-page">
    <el-card class="hero-card" shadow="never">
      <div class="hero-content">
        <div class="hero-text">
          <el-text class="hero-kicker">用户管理</el-text>
          <h1 class="hero-title">用户列表</h1>
          <p class="hero-desc">
            集中管理账号、角色与活跃状态，快速定位异常账号。
          </p>
        </div>
        <el-space>
          <el-button type="primary" @click="handleAdd">新增用户</el-button>
          <el-button @click="handleExport">导出列表</el-button>
        </el-space>
      </div>
    </el-card>

    <el-row :gutter="16" class="stats-row">
      <el-col v-for="stat in stats" :key="stat.label" :span="6">
        <el-card class="stat-card" shadow="never">
          <div class="stat-head">
            <div class="stat-icon" :style="{ background: stat.gradient }">
              {{ stat.icon }}
            </div>
            <el-statistic :value="stat.value" :title="stat.label" />
          </div>
          <div class="stat-foot">{{ stat.desc }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="filter-card" shadow="never">
      <div class="filter-content">
        <el-form :inline="true" class="filter-form">
          <el-form-item>
            <el-input
              v-model="keyword"
              clearable
              placeholder="搜索姓名 / 邮箱 / 部门"
            />
          </el-form-item>
          <el-form-item>
            <el-select v-model="roleFilter" clearable placeholder="全部角色">
              <el-option
                v-for="role in roleOptions"
                :key="role"
                :label="role"
                :value="role"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="statusFilter" clearable placeholder="全部状态">
              <el-option
                v-for="status in statusOptions"
                :key="status"
                :label="statusLabelMap[status]"
                :value="status"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <div class="filter-meta">
          <el-text size="small">共 {{ filteredUsers.length }} 位成员</el-text>
          <el-button type="info" link @click="resetFilters">
            清空筛选
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="pagedUsers" style="width: 100%">
        <el-table-column label="成员" min-width="220">
          <template #default="{ row }">
            <div class="user-cell">
              <el-badge v-if="row.online" is-dot type="success">
                <el-avatar :src="row.avatar" :size="44" />
              </el-badge>
              <el-avatar v-else :src="row.avatar" :size="44" />
              <div class="user-meta">
                <div class="user-name">
                  {{ row.name }}
                  <span class="user-code">#{{ row.code }}</span>
                </div>
                <div class="user-email">{{ row.email }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="部门" min-width="140">
          <template #default="{ row }">
            <div class="dept-cell">
              <div class="dept-name">{{ row.department }}</div>
              <div class="dept-location">{{ row.location }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" min-width="120">
          <template #default="{ row }">
            <el-tag :type="roleTagType[row.role] || 'info'" effect="light">
              {{ row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType[row.status]" effect="light">
              {{ statusLabelMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近活跃" min-width="160">
          <template #default="{ row }">
            <div class="active-cell">
              <div class="active-time">{{ row.lastActive }}</div>
              <div class="active-desc">加入 {{ row.joinedAt }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="180">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewProfile(row)">
              查看
            </el-button>
            <el-button type="primary" link @click="editUser(row)">
              编辑
            </el-button>
            <el-button type="danger" link @click="toggleStatus(row)">
              {{ row.status === 'disabled' ? '启用' : '停用' }}
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="没有匹配的用户" />
        </template>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredUsers.length"
          layout="prev, pager, next, total"
        />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

type UserStatus = 'active' | 'invited' | 'disabled'

interface UserItem {
  id: number
  code: string
  name: string
  email: string
  department: string
  location: string
  role: string
  status: UserStatus
  lastActive: string
  joinedAt: string
  avatar: string
  online: boolean
}

const users = ref<UserItem[]>([
  {
    id: 1,
    code: 'A-1024',
    name: '李文心',
    email: 'wenxin.li@yzc.com',
    department: '产品设计',
    location: '上海',
    role: '管理员',
    status: 'active',
    lastActive: '10 分钟前',
    joinedAt: '2023-08-12',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wenxin',
    online: true
  },
  {
    id: 2,
    code: 'B-0318',
    name: '陈默',
    email: 'chen.mo@yzc.com',
    department: '前端研发',
    location: '杭州',
    role: '研发',
    status: 'active',
    lastActive: '1 小时前',
    joinedAt: '2022-11-03',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenmo',
    online: true
  },
  {
    id: 3,
    code: 'C-2280',
    name: '周楠',
    email: 'zhou.nan@yzc.com',
    department: '运营',
    location: '深圳',
    role: '运营',
    status: 'invited',
    lastActive: '2 天前',
    joinedAt: '2024-06-29',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhounan',
    online: false
  },
  {
    id: 4,
    code: 'D-9051',
    name: '任泽',
    email: 'ren.ze@yzc.com',
    department: '数据平台',
    location: '北京',
    role: '研发',
    status: 'active',
    lastActive: '30 分钟前',
    joinedAt: '2021-04-18',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=renze',
    online: true
  },
  {
    id: 5,
    code: 'E-1107',
    name: '安晴',
    email: 'an.qing@yzc.com',
    department: '人力资源',
    location: '上海',
    role: '运营',
    status: 'disabled',
    lastActive: '1 个月前',
    joinedAt: '2020-09-01',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anqing',
    online: false
  },
  {
    id: 6,
    code: 'F-7742',
    name: '高屿',
    email: 'gao.yu@yzc.com',
    department: '视觉设计',
    location: '成都',
    role: '设计',
    status: 'active',
    lastActive: '3 小时前',
    joinedAt: '2022-01-15',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gaoyu',
    online: false
  },
  {
    id: 7,
    code: 'G-8806',
    name: '宋渺',
    email: 'song.miao@yzc.com',
    department: '产品策略',
    location: '南京',
    role: '管理员',
    status: 'active',
    lastActive: '刚刚',
    joinedAt: '2023-03-08',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=songmiao',
    online: true
  },
  {
    id: 8,
    code: 'H-5514',
    name: '丁赫',
    email: 'ding.he@yzc.com',
    department: '客户成功',
    location: '广州',
    role: '运营',
    status: 'invited',
    lastActive: '未激活',
    joinedAt: '2024-12-21',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dinghe',
    online: false
  },
  {
    id: 9,
    code: 'J-2121',
    name: '鲁雯',
    email: 'lu.wen@yzc.com',
    department: '市场',
    location: '上海',
    role: '运营',
    status: 'active',
    lastActive: '昨天',
    joinedAt: '2021-12-09',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luwen',
    online: true
  },
  {
    id: 10,
    code: 'K-4472',
    name: '彭聿',
    email: 'peng.yu@yzc.com',
    department: '后端研发',
    location: '杭州',
    role: '研发',
    status: 'active',
    lastActive: '20 分钟前',
    joinedAt: '2022-05-27',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pengyu',
    online: true
  },
  {
    id: 11,
    code: 'L-3029',
    name: '顾乔',
    email: 'gu.qiao@yzc.com',
    department: '品牌设计',
    location: '上海',
    role: '设计',
    status: 'active',
    lastActive: '4 小时前',
    joinedAt: '2021-07-19',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guqiao',
    online: false
  },
  {
    id: 12,
    code: 'M-1902',
    name: '张致',
    email: 'zhang.zhi@yzc.com',
    department: '风控合规',
    location: '北京',
    role: '管理员',
    status: 'disabled',
    lastActive: '2 个月前',
    joinedAt: '2019-02-14',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangzhi',
    online: false
  }
])

const keyword = ref('')
const roleFilter = ref('')
const statusFilter = ref<UserStatus | ''>('')
const currentPage = ref(1)
const pageSize = ref(8)

const roleOptions = computed(() => {
  return Array.from(new Set(users.value.map((user) => user.role)))
})

const statusOptions: UserStatus[] = ['active', 'invited', 'disabled']
const statusLabelMap: Record<UserStatus, string> = {
  active: '在职',
  invited: '待激活',
  disabled: '已停用'
}

const roleTagType: Record<string, string> = {
  管理员: 'danger',
  研发: 'success',
  设计: 'info',
  运营: 'warning'
}

const statusTagType: Record<UserStatus, string> = {
  active: 'success',
  invited: 'warning',
  disabled: 'danger'
}

const filteredUsers = computed(() => {
  const keywordValue = keyword.value.trim().toLowerCase()
  return users.value.filter((user) => {
    const matchKeyword =
      !keywordValue ||
      [user.name, user.email, user.department].some((field) =>
        field.toLowerCase().includes(keywordValue)
      )
    const matchRole = !roleFilter.value || user.role === roleFilter.value
    const matchStatus =
      !statusFilter.value || user.status === statusFilter.value
    return matchKeyword && matchRole && matchStatus
  })
})

const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

const stats = computed(() => {
  const total = users.value.length
  const active = users.value.filter((user) => user.status === 'active').length
  const invited = users.value.filter((user) => user.status === 'invited').length
  const disabled = users.value.filter(
    (user) => user.status === 'disabled'
  ).length
  return [
    {
      label: '总用户数',
      value: total,
      desc: '全员账号',
      icon: 'U',
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
    },
    {
      label: '在职账号',
      value: active,
      desc: '活跃成员',
      icon: 'A',
      gradient: 'linear-gradient(135deg, #22c55e, #4ade80)'
    },
    {
      label: '待激活',
      value: invited,
      desc: '新邀请',
      icon: 'P',
      gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)'
    },
    {
      label: '已停用',
      value: disabled,
      desc: '受限账号',
      icon: 'D',
      gradient: 'linear-gradient(135deg, #ef4444, #f87171)'
    }
  ]
})

watch([keyword, roleFilter, statusFilter], () => {
  currentPage.value = 1
})

watch(filteredUsers, () => {
  if (currentPage.value < 1) currentPage.value = 1
})

const resetFilters = () => {
  keyword.value = ''
  roleFilter.value = ''
  statusFilter.value = ''
}

const handleAdd = () => {
  ElMessage.info('新增用户功能开发中')
}

const handleExport = () => {
  ElMessage.success('已导出用户列表')
}

const viewProfile = (user: UserItem) => {
  ElMessage.info(`查看 ${user.name} 的资料`)
}

const editUser = (user: UserItem) => {
  ElMessage.info(`编辑 ${user.name} 的信息`)
}

const toggleStatus = (user: UserItem) => {
  user.status = user.status === 'disabled' ? 'active' : 'disabled'
  ElMessage.success(
    `${user.name} 已${user.status === 'disabled' ? '停用' : '启用'}`
  )
}
</script>

<style lang="scss" scoped>
.user-list-page {
  padding: 24px 32px 40px;
  min-height: calc(100vh - 64px);
  background: radial-gradient(circle at top right, #eef2ff 0%, #ffffff 55%);
}

.hero-card {
  margin-bottom: 18px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #111827 100%);
  color: #e2e8f0;
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.hero-title {
  margin: 6px 0 8px;
  font-size: 26px;
  font-weight: 700;
}

.hero-desc {
  margin: 0;
  font-size: 13px;
  color: rgba(226, 232, 240, 0.7);
}

.stats-row {
  margin-bottom: 18px;
}

.stat-card {
  height: 100%;
}

.stat-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 18px;
}

.stat-foot {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 8px;
}

.filter-card {
  margin-bottom: 18px;
}

.filter-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-card :deep(.el-card__body) {
  padding: 0;
}

.table-card :deep(.el-table__cell) {
  padding: 14px 0;
}

.table-card :deep(.el-table .cell) {
  line-height: 1.7;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-weight: 600;
  color: #1e293b;
}

.user-code {
  margin-left: 6px;
  font-size: 11px;
  color: #94a3b8;
}

.user-email {
  font-size: 12px;
  color: #64748b;
}

.dept-name {
  font-weight: 600;
  color: #1e293b;
}

.dept-location {
  font-size: 11px;
  color: #94a3b8;
}

.active-time {
  font-weight: 600;
  color: #1e293b;
}

.active-desc {
  font-size: 11px;
  color: #94a3b8;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
}

@media (max-width: 1200px) {
  .hero-content {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 960px) {
  .user-list-page {
    padding: 18px 16px 32px;
  }
}
</style>

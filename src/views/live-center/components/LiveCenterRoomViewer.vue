<template>
  <div class="live-room-shell">
    <section class="room-command-bar">
      <div class="room-switcher">
        <button
          v-for="room in rooms"
          :key="room.id"
          type="button"
          class="room-chip"
          :class="{ active: room.id === selectedRoom.id }"
          @click="emit('select-room', room.id)"
        >
          <span class="room-chip-status" :class="room.statusTone"></span>
          <div class="room-chip-copy">
            <strong>{{ room.name }}</strong>
            <small>{{ room.host }} · {{ room.slot }}</small>
          </div>
          <div class="room-chip-metrics">
            <span>{{ room.status }}</span>
            <strong>{{ room.audience }}</strong>
          </div>
        </button>
      </div>

      <div class="command-tools">
        <div class="source-input">
          <el-input
            v-model="externalLink"
            clearable
            placeholder="粘贴 m3u8 / flv / mp4 或 mock:// 房间ID"
          />
        </div>
        <button type="button" class="ghost-button" @click="shareRoom">
          分享预览
        </button>
        <button type="button" class="primary-button" @click="applyLink">
          切换流
        </button>
      </div>

      <div class="command-status">
        <div class="status-copy">
          <span class="section-kicker">直播态势</span>
          <strong>{{ statusHeadline }}</strong>
          <p>{{ pinNote }}</p>
        </div>

        <div class="status-pills">
          <span class="status-pill" :class="selectedRoom.statusTone">
            {{ selectedRoom.status }}
          </span>
          <span class="status-pill subtle">{{ streamHealth }}</span>
          <span class="status-pill subtle">{{ latencyLabel }}</span>
        </div>

        <div class="status-metrics">
          <div
            v-for="metric in quickMetrics"
            :key="metric.label"
            class="quick-metric"
          >
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
            <small>{{ metric.note }}</small>
          </div>
        </div>
      </div>
    </section>

    <div class="live-room-layout">
      <section class="stage-panel">
        <div class="stage-screen">
          <div class="stage-backdrop">
            <span>{{ selectedRoom.coverTitle }}</span>
          </div>

          <div class="stage-topbar">
            <button
              type="button"
              class="ghost-button compact"
              @click="enterRoom"
            >
              进入房间
            </button>

            <div class="anchor-card">
              <div class="anchor-avatar">{{ hostInitial }}</div>
              <div class="anchor-copy">
                <div class="anchor-title-row">
                  <strong>{{ selectedRoom.host }}</strong>
                  <span>{{ followerLabel }} 粉丝</span>
                </div>
                <p>{{ selectedRoom.category }} · {{ selectedRoom.slot }}</p>
              </div>
            </div>

            <div class="topbar-actions">
              <button
                type="button"
                class="ghost-button compact"
                @click="previewAction('粉丝团')"
              >
                粉丝团
              </button>
              <button
                type="button"
                class="ghost-button compact"
                @click="previewAction('优惠券')"
              >
                优惠券
              </button>
              <button
                type="button"
                class="ghost-button compact"
                @click="shareRoom"
              >
                分享
              </button>
            </div>
          </div>

          <div class="stage-main">
            <div class="viewer-column">
              <div class="viewer-stage-card">
                <div class="viewer-stage-head">
                  <div>
                    <span class="section-kicker">直播主画面</span>
                    <strong>{{ selectedRoom.name }}</strong>
                  </div>
                  <span class="sub-badge"
                    >{{ selectedRoom.host }} · {{ selectedRoom.category }}</span
                  >
                </div>

                <div class="viewer-stage-body">
                  <LiveCenterStreamSurface
                    :src="streamPreviewUrl"
                    :room="selectedRoom"
                  >
                    <LiveCenterPlayerCard
                      :room="selectedRoom"
                      @enter-room="enterRoom"
                    />
                  </LiveCenterStreamSurface>
                </div>
              </div>

              <div class="hero-stage">
                <div class="hero-badges">
                  <span class="live-badge" :class="selectedRoom.statusTone">
                    {{ selectedRoom.status }}
                  </span>
                  <span class="sub-badge"
                    >实时在线 {{ selectedRoom.audience }}</span
                  >
                  <span class="sub-badge">{{ progressHint }}</span>
                </div>

                <div class="hero-copy">
                  <span class="section-kicker">当前场次</span>
                  <h2>{{ selectedRoom.name }}</h2>
                  <p>{{ selectedRoom.summary }}</p>
                </div>

                <div class="stage-progress">
                  <div class="progress-copy">
                    <strong>直播进度 {{ progressPercent }}%</strong>
                    <span>
                      {{ activeSegment?.window ?? selectedRoom.slot }} ·
                      {{ activeSegment?.goal ?? '保持成交节奏稳定推进' }}
                    </span>
                  </div>
                  <div class="progress-track">
                    <span
                      class="progress-bar"
                      :style="{ width: `${progressPercent}%` }"
                    ></span>
                  </div>
                </div>

                <div class="tag-row">
                  <span
                    v-for="tag in selectedRoom.tags"
                    :key="tag"
                    class="tag-pill"
                  >
                    {{ tag }}
                  </span>
                </div>

                <div class="spotlight-card">
                  <div class="spotlight-head">
                    <span class="section-kicker">当前主推商品</span>
                    <span class="spotlight-badge">{{ roomProduct.badge }}</span>
                  </div>
                  <strong>{{ roomProduct.name }}</strong>
                  <p>{{ roomProduct.summary }}</p>
                  <div class="product-meta">
                    <div class="product-metric">
                      <span>到手价</span>
                      <strong>{{ roomProduct.price }}</strong>
                    </div>
                    <div class="product-metric">
                      <span>已售</span>
                      <strong>{{ roomProduct.sold }}</strong>
                    </div>
                    <div class="product-metric">
                      <span>库存</span>
                      <strong>{{ roomProduct.inventory }}</strong>
                    </div>
                  </div>
                  <div class="product-perks">
                    <span v-for="perk in roomProduct.perks" :key="perk">{{
                      perk
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <aside class="control-dock">
              <section class="dock-card">
                <div class="dock-head">
                  <span class="section-kicker">节奏脚本</span>
                  <strong>{{ activeSegment?.label ?? '场控流程' }}</strong>
                </div>
                <div class="segment-list">
                  <button
                    v-for="segment in sceneSegments"
                    :key="segment.id"
                    type="button"
                    class="segment-item"
                    :class="{
                      active: segment.id === activeSegmentId,
                      [segment.tone]: true
                    }"
                    @click="activateSegment(segment)"
                  >
                    <div>
                      <strong>{{ segment.label }}</strong>
                      <small>{{ segment.window }}</small>
                    </div>
                    <span>{{ segment.goal }}</span>
                  </button>
                </div>
              </section>

              <section class="dock-card">
                <div class="dock-head">
                  <span class="section-kicker">转化提示</span>
                  <strong>{{ conversionHint.title }}</strong>
                </div>
                <p class="dock-paragraph">{{ conversionHint.detail }}</p>
                <div class="cue-grid">
                  <div
                    v-for="cue in stageCues"
                    :key="cue.label"
                    class="cue-card"
                  >
                    <span>{{ cue.label }}</span>
                    <strong>{{ cue.value }}</strong>
                    <small>{{ cue.note }}</small>
                  </div>
                </div>
              </section>

              <section class="dock-card actions-card">
                <div class="dock-head">
                  <span class="section-kicker">快捷动作</span>
                  <strong>运营动作台</strong>
                </div>
                <div class="action-grid">
                  <button
                    v-for="action in quickActions"
                    :key="action"
                    type="button"
                    class="action-button"
                    @click="previewAction(action)"
                  >
                    {{ action }}
                  </button>
                </div>
              </section>
            </aside>
          </div>

          <div class="floating-strip">
            <div
              v-for="item in stageStats"
              :key="item.label"
              class="floating-stat"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </div>

        <footer class="stage-footer">
          <div class="footer-product">
            <span class="section-kicker">商品焦点</span>
            <strong>{{ roomProduct.name }}</strong>
            <p>{{ roomProduct.summary }}</p>
          </div>

          <div class="footer-scenes">
            <button
              v-for="item in giftRibbon"
              :key="item.gift.id"
              type="button"
              class="footer-chip"
              :class="item.gift.tone"
              @click="previewGift(item.gift)"
            >
              <span>{{ item.short }}</span>
              <strong>{{ item.gift.name }}</strong>
            </button>
          </div>
        </footer>
      </section>

      <aside class="interaction-panel">
        <section class="panel-card audience-board">
          <div class="panel-head">
            <div>
              <span class="section-kicker">在线观众</span>
              <strong>{{ audienceHeadline }}</strong>
              <p>{{ audienceSubline }}</p>
            </div>
          </div>

          <div class="rank-tabs">
            <button
              v-for="tab in viewerTabs"
              :key="tab.id"
              type="button"
              class="rank-tab"
              :class="{ active: viewerTab === tab.id }"
              @click="viewerTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>

          <div v-if="filteredViewerRanking.length" class="rank-list">
            <div
              v-for="(viewer, index) in filteredViewerRanking"
              :key="viewer.name"
              class="rank-row"
            >
              <span class="rank-index">{{ index + 1 }}</span>
              <div class="rank-avatar" :class="viewer.accent">
                {{ viewer.name.slice(0, 1) }}
              </div>
              <div class="rank-copy">
                <strong>{{ viewer.name }}</strong>
                <small>{{ viewer.badge }}</small>
              </div>
              <span class="rank-score">{{ viewer.score }}</span>
            </div>
          </div>
          <div v-else class="empty-state">当前筛选下暂无高活跃观众</div>
        </section>

        <section class="panel-card insight-board">
          <div class="panel-head">
            <div>
              <span class="section-kicker">运营雷达</span>
              <strong>{{ conversionHint.title }}</strong>
              <p>{{ hottestMoment }}</p>
            </div>
            <span class="status-pill subtle">{{
              activeSegment?.label ?? '待机中'
            }}</span>
          </div>

          <div class="insight-list">
            <div
              v-for="signal in operationSignals"
              :key="signal.label"
              class="insight-item"
              :class="signal.tone"
            >
              <div>
                <strong>{{ signal.label }}</strong>
                <p>{{ signal.note }}</p>
              </div>
              <span>{{ signal.value }}</span>
            </div>
          </div>
        </section>

        <section class="panel-card chat-board">
          <div class="panel-head">
            <div>
              <span class="section-kicker">实时互动</span>
              <strong>弹幕与成交播报</strong>
              <p>{{ pinNote }}</p>
            </div>
          </div>

          <div class="chat-list">
            <div v-for="item in visibleFeed" :key="item.id" class="chat-item">
              <span class="chat-badge" :class="item.tone">
                {{ feedToneLabel(item.tone) }}
              </span>
              <div class="chat-bubble">
                <div class="chat-meta">
                  <strong>{{ item.user }}</strong>
                  <span>{{ item.time }}</span>
                </div>
                <p>{{ item.action }} {{ item.highlight }}</p>
              </div>
            </div>
          </div>
        </section>

        <div class="chat-composer">
          <div class="composer-field">
            <el-input
              v-model="draftMessage"
              maxlength="60"
              placeholder="发送欢迎词、福利提醒或互动话术"
              show-word-limit
              @keyup.enter="sendComposerMessage"
            />
          </div>
          <button
            type="button"
            class="ghost-button"
            @click="previewAction('表情')"
          >
            表情
          </button>
          <button
            type="button"
            class="primary-button"
            @click="sendComposerMessage"
          >
            发送
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import LiveCenterPlayerCard from './LiveCenterPlayerCard.vue'
import LiveCenterStreamSurface from './LiveCenterStreamSurface.vue'
import {
  getStreamKindLabel,
  normalizeStreamUrl,
  resolveStreamSource
} from '../streamUtils'
import type { GiftItem, LiveFeedItem, StreamRoom } from '../types'

type ViewerTab = 'all' | 'paying' | 'vip'
type AccentTone = 'rose' | 'amber' | 'aqua' | 'violet'

interface ViewerRankItem {
  name: string
  badge: string
  score: string
  bucket: Exclude<ViewerTab, 'all'>
  accent: Exclude<AccentTone, 'violet'>
}

interface RoomProduct {
  name: string
  badge: string
  summary: string
  price: string
  sold: string
  inventory: string
  discount: string
  perks: string[]
}

interface SceneSegment {
  id: string
  label: string
  window: string
  goal: string
  progress: number
  tone: AccentTone
}

interface SignalItem {
  label: string
  value: string
  note: string
  tone: AccentTone
}

interface RoomMetricProfile {
  interactRate: string
  cartRate: string
  stayDuration: string
  latency: string
  hourlyGmv: string
  audienceTrend: string
  payRate: string
}

interface ConversionHint {
  title: string
  detail: string
}

const props = defineProps<{
  giftItems: GiftItem[]
  liveFeed: LiveFeedItem[]
  rooms: StreamRoom[]
  selectedRoom: StreamRoom
}>()

const emit = defineEmits<{ 'select-room': [roomId: string] }>()
const router = useRouter()

const viewerTabs = [
  { id: 'all', label: '全部' },
  { id: 'paying', label: '高贡献用户' },
  { id: 'vip', label: '高等级用户' }
] as const

const viewerRankingMap: Record<string, ViewerRankItem[]> = {
  'room-main': [
    {
      name: '牡丹反击',
      badge: '荣耀贡献用户',
      score: '27 连击',
      bucket: 'paying',
      accent: 'rose'
    },
    {
      name: '小稚',
      badge: '高等级粉丝',
      score: '40 级',
      bucket: 'vip',
      accent: 'amber'
    },
    {
      name: '洪琪',
      badge: '连送 44 次',
      score: '44 次',
      bucket: 'paying',
      accent: 'aqua'
    }
  ],
  'room-new': [
    {
      name: '樱桃可乐',
      badge: '新品预约用户',
      score: '18 次',
      bucket: 'paying',
      accent: 'rose'
    },
    {
      name: '奶盐桃桃',
      badge: '高等级粉丝',
      score: '32 级',
      bucket: 'vip',
      accent: 'amber'
    },
    {
      name: '云朵卷',
      badge: '试色团成员',
      score: '21 级',
      bucket: 'vip',
      accent: 'aqua'
    }
  ],
  'room-member': [
    {
      name: '晚风星河',
      badge: '会员复购用户',
      score: '16 单',
      bucket: 'paying',
      accent: 'rose'
    },
    {
      name: '青提汽水',
      badge: '高等级会员',
      score: '29 级',
      bucket: 'vip',
      accent: 'amber'
    },
    {
      name: '南桥',
      badge: '权益达人',
      score: '12 单',
      bucket: 'paying',
      accent: 'aqua'
    }
  ]
}

const roomProductMap: Record<string, RoomProduct> = {
  'room-main': {
    name: '鎏金臻萃修护套组',
    badge: '爆品主推',
    summary: '主打屏障修护与夜间抗老，适合在福利口播后接支付转化。',
    price: '￥329',
    sold: '4,860',
    inventory: '1,280',
    discount: '买一送一 + 限时券',
    perks: ['赠便携面霜', '限时 30 分钟', '支持会员加赠']
  },
  'room-new': {
    name: '柔雾镜面唇釉 07',
    badge: '新品首发',
    summary: '适合试色镜头拉近展示，重点引导收藏、预约和色号投票。',
    price: '￥119',
    sold: '1,320',
    inventory: '2,460',
    discount: '第二支半价',
    perks: ['试色卡展示', '收藏抽奖', '预约下场提醒']
  },
  'room-member': {
    name: '夜间修护会员礼盒',
    badge: '复购专属',
    summary: '主打会员权益回访和复购承接，适合配合回放切片进行口播。',
    price: '￥269',
    sold: '920',
    inventory: '860',
    discount: '会员券立减 40',
    perks: ['老客加赠积分', '回放高光承接', '售后答疑入口']
  }
}

const roomMetricMap: Record<string, RoomMetricProfile> = {
  'room-main': {
    interactRate: '18.4%',
    cartRate: '9.2%',
    stayDuration: '12m 18s',
    latency: '1.2s',
    hourlyGmv: '￥12.6 万/h',
    audienceTrend: '+12.8%',
    payRate: '7.9%'
  },
  'room-new': {
    interactRate: '22.1%',
    cartRate: '12.6%',
    stayDuration: '9m 42s',
    latency: '1.5s',
    hourlyGmv: '￥6.8 万/h',
    audienceTrend: '+18.2%',
    payRate: '5.4%'
  },
  'room-member': {
    interactRate: '11.7%',
    cartRate: '15.1%',
    stayDuration: '14m 06s',
    latency: '0.9s',
    hourlyGmv: '￥4.2 万/h',
    audienceTrend: '+6.1%',
    payRate: '13.2%'
  }
}

const roomSegmentMap: Record<string, SceneSegment[]> = {
  'room-main': [
    {
      id: 'main-warmup',
      label: '开场预热',
      window: '18:00 - 18:20',
      goal: '拉高停留和关注',
      progress: 18,
      tone: 'aqua'
    },
    {
      id: 'main-hero',
      label: '爆品讲解',
      window: '18:20 - 19:10',
      goal: '聚焦高转化商品',
      progress: 42,
      tone: 'rose'
    },
    {
      id: 'main-coupon',
      label: '福利放量',
      window: '19:10 - 20:00',
      goal: '限时券驱动下单',
      progress: 68,
      tone: 'amber'
    },
    {
      id: 'main-link',
      label: '连麦答疑',
      window: '20:00 - 20:30',
      goal: '承接犹豫用户',
      progress: 86,
      tone: 'violet'
    }
  ],
  'room-new': [
    {
      id: 'new-warmup',
      label: '预约蓄水',
      window: '20:10 - 20:30',
      goal: '提前聚集高意向用户',
      progress: 14,
      tone: 'aqua'
    },
    {
      id: 'new-show',
      label: '试色展示',
      window: '20:30 - 20:50',
      goal: '强化新品卖点',
      progress: 38,
      tone: 'rose'
    },
    {
      id: 'new-poll',
      label: '弹幕投票',
      window: '20:50 - 21:10',
      goal: '拉升收藏和互动',
      progress: 64,
      tone: 'amber'
    },
    {
      id: 'new-close',
      label: '限量收口',
      window: '21:10 - 21:30',
      goal: '完成收单闭环',
      progress: 92,
      tone: 'violet'
    }
  ],
  'room-member': [
    {
      id: 'member-review',
      label: '回放高光',
      window: '14:00 - 14:40',
      goal: '承接回放流量',
      progress: 34,
      tone: 'aqua'
    },
    {
      id: 'member-benefit',
      label: '权益口播',
      window: '14:40 - 15:10',
      goal: '提升会员感知',
      progress: 62,
      tone: 'rose'
    },
    {
      id: 'member-rebuy',
      label: '复购转化',
      window: '15:10 - 15:40',
      goal: '推动老客下单',
      progress: 86,
      tone: 'amber'
    },
    {
      id: 'member-replay',
      label: '售后答疑',
      window: '15:40 - 16:00',
      goal: '完成收尾与沉淀',
      progress: 100,
      tone: 'violet'
    }
  ]
}

const roomSignalMap: Record<string, SignalItem[]> = {
  'room-main': [
    {
      label: '弹幕应答率',
      value: '92%',
      note: '高频问题建议切到客服预设话术',
      tone: 'rose'
    },
    {
      label: '商品点击率',
      value: '28.6%',
      note: '主推商品卡点击明显高于均值',
      tone: 'amber'
    },
    {
      label: '关注转化',
      value: '16.4%',
      note: '福利口播后 5 分钟效果最佳',
      tone: 'aqua'
    }
  ],
  'room-new': [
    {
      label: '预约留资率',
      value: '34.1%',
      note: '新品人群对试色预告响应积极',
      tone: 'rose'
    },
    {
      label: '收藏触发率',
      value: '19.8%',
      note: '建议增加色号投票引导',
      tone: 'amber'
    },
    {
      label: '互动密度',
      value: '4.2k/min',
      note: '试色时镜头切近景效果更好',
      tone: 'aqua'
    }
  ],
  'room-member': [
    {
      label: '复购下单率',
      value: '13.2%',
      note: '会员券到期提醒对转化明显',
      tone: 'rose'
    },
    {
      label: '回放承接率',
      value: '21.4%',
      note: '高光切片可继续承接老客',
      tone: 'amber'
    },
    {
      label: '售后答疑完成率',
      value: '96%',
      note: '适合追加权益说明和客服入口',
      tone: 'aqua'
    }
  ]
}

const conversionHintMap: Record<string, ConversionHint> = {
  'room-main': {
    title: '爆品讲解窗口正在放大',
    detail:
      '建议在接下来的 12 分钟内连续挂出限时券和买赠信息，当前支付转化高于均值 1.8 个百分点。'
  },
  'room-new': {
    title: '新品用户更依赖试色和弹幕反馈',
    detail:
      '优先展示色号对比和上唇镜头，再用预约提醒承接未下单人群，比直接促单更有效。'
  },
  'room-member': {
    title: '老客决策更看重权益说明',
    detail:
      '回放承接阶段建议把会员券截止时间、积分返还和售后保障固定挂在画面下方。'
  }
}

const quickActionMap: Record<string, string[]> = {
  'room-main': ['发限时券', '切商品卡', '插入福利口播', '开启连麦'],
  'room-new': ['上试色卡', '开启预约提醒', '推收藏按钮', '发送色号弹幕'],
  'room-member': ['推会员券', '播放回放高光', '弹出复购清单', '提醒售后答疑']
}

const defaultSegmentIdMap: Record<string, string> = {
  'room-main': 'main-coupon',
  'room-new': 'new-warmup',
  'room-member': 'member-replay'
}

const nowTime = () =>
  new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })

const viewerTab = ref<ViewerTab>('all')
const externalLink = ref('')
const appliedLink = ref('')
const draftMessage = ref('')
const activeSegmentId = ref('')
const localFeed = ref<LiveFeedItem[]>([])

watch(
  () => props.selectedRoom.id,
  (roomId) => {
    viewerTab.value = 'all'
    externalLink.value = ''
    appliedLink.value = ''
    draftMessage.value = ''
    localFeed.value = []
    activeSegmentId.value =
      defaultSegmentIdMap[roomId] ?? roomSegmentMap[roomId]?.[0]?.id ?? ''
  },
  { immediate: true }
)

const selectedMetrics = computed(
  () =>
    roomMetricMap[props.selectedRoom.id] ?? {
      interactRate: '0%',
      cartRate: '0%',
      stayDuration: '0m',
      latency: '0s',
      hourlyGmv: '￥0',
      audienceTrend: '0%',
      payRate: '0%'
    }
)

const roomProduct = computed(
  () =>
    roomProductMap[props.selectedRoom.id] ?? {
      name: '待配置商品',
      badge: '未配置',
      summary: '当前房间尚未配置主推商品信息。',
      price: '-',
      sold: '-',
      inventory: '-',
      discount: '待配置',
      perks: ['待补充']
    }
)

const sceneSegments = computed(
  () => roomSegmentMap[props.selectedRoom.id] ?? []
)

const activeSegment = computed(
  () =>
    sceneSegments.value.find(
      (segment) => segment.id === activeSegmentId.value
    ) ?? sceneSegments.value[0]
)

const audienceValue = computed(() => {
  const matched = props.selectedRoom.audience.match(/\d+(?:,\d+)*/u)
  return matched ? Number(matched[0].replace(/,/gu, '')) : 0
})

const hostInitial = computed(
  () => props.selectedRoom.host.trim().slice(0, 1) || '主'
)

const followerLabel = computed(() => {
  const followers = audienceValue.value * 2.25
  if (followers >= 10000) {
    return `${(followers / 10000).toFixed(1).replace(/\.0$/u, '')}万`
  }
  return `${Math.round(followers)}`
})

const audienceHeadline = computed(() => {
  if (audienceValue.value >= 10000) {
    return `在线观众 ${(audienceValue.value / 10000).toFixed(1).replace(/\.0$/u, '')}万`
  }
  return `在线观众 ${props.selectedRoom.audience}`
})

const audienceSubline = computed(
  () =>
    `互动率 ${selectedMetrics.value.interactRate} · 支付转化 ${selectedMetrics.value.payRate} · 趋势 ${selectedMetrics.value.audienceTrend}`
)

const progressPercent = computed(() => activeSegment.value?.progress ?? 0)

const progressHint = computed(() => {
  if (!activeSegment.value) return '直播排期待配置'
  return `${activeSegment.value.label} · ${activeSegment.value.window}`
})

const statusHeadline = computed(() => {
  if (props.selectedRoom.statusTone === 'live') {
    return `${props.selectedRoom.host} 正在主讲，成交节奏保持稳定`
  }
  if (props.selectedRoom.statusTone === 'next') {
    return `${props.selectedRoom.host} 场次预热中，建议提前做预约蓄水`
  }
  return `${props.selectedRoom.host} 场次已结束，当前进入回放承接模式`
})

const streamHealth = computed(() => {
  if (streamPreviewSource.value.kind === 'unsupported') return '流地址待修正'
  if (hasCustomStream.value) {
    return `已接入${getStreamKindLabel(streamPreviewSource.value.kind)}`
  }
  if (props.selectedRoom.statusTone === 'live') return '1080P 推流正常'
  if (props.selectedRoom.statusTone === 'next') return '预热素材已就绪'
  return '回放链路正常'
})

const latencyLabel = computed(() => `延迟 ${selectedMetrics.value.latency}`)

const pinNote = computed(
  () =>
    (hasCustomStream.value
      ? `当前接入外部流：${streamPreviewUrl.value}`
      : '') ||
    `${props.selectedRoom.host} 正在讲解 ${props.selectedRoom.category}，当前主推 ${roomProduct.value.name}。`
)

const quickMetrics = computed(() => [
  {
    label: '互动率',
    value: selectedMetrics.value.interactRate,
    note: '点赞、弹幕、关注综合'
  },
  {
    label: '加购率',
    value: selectedMetrics.value.cartRate,
    note: '商品点击后加购转化'
  },
  {
    label: '停留时长',
    value: selectedMetrics.value.stayDuration,
    note: '当前平均观看停留'
  }
])

const defaultStreamUrl = computed(() =>
  normalizeStreamUrl(props.selectedRoom.previewStreamUrl)
)

const customStreamUrl = computed(() => normalizeStreamUrl(appliedLink.value))

const streamPreviewUrl = computed(
  () => customStreamUrl.value || defaultStreamUrl.value
)

const streamPreviewSource = computed(() =>
  resolveStreamSource(streamPreviewUrl.value)
)

const hasCustomStream = computed(() => Boolean(customStreamUrl.value))

const conversionHint = computed(
  () =>
    conversionHintMap[props.selectedRoom.id] ?? {
      title: '暂无转化建议',
      detail: '当前房间缺少可用的转化策略数据。'
    }
)

const operationSignals = computed(
  () => roomSignalMap[props.selectedRoom.id] ?? []
)

const quickActions = computed(
  () => quickActionMap[props.selectedRoom.id] ?? ['刷新面板']
)

const stageCues = computed(() => [
  {
    label: '当前脚本',
    value: activeSegment.value?.label ?? '待配置',
    note: activeSegment.value?.goal ?? '保持场控稳定'
  },
  {
    label: '主推优惠',
    value: roomProduct.value.discount,
    note: '建议保持口播一致'
  },
  {
    label: '小时 GMV',
    value: selectedMetrics.value.hourlyGmv,
    note: '按当前节奏预估'
  }
])

const stageStats = computed(() => [
  { label: '场观趋势', value: selectedMetrics.value.audienceTrend },
  { label: '支付转化', value: selectedMetrics.value.payRate },
  { label: '主推库存', value: roomProduct.value.inventory }
])

const giftRibbon = computed(() =>
  props.giftItems.slice(0, 4).map((gift) => ({
    gift,
    short: gift.name.slice(0, 2)
  }))
)

const filteredViewerRanking = computed(() => {
  const list =
    viewerRankingMap[props.selectedRoom.id] ??
    viewerRankingMap['room-main'] ??
    []
  if (viewerTab.value === 'all') return list
  return list.filter((item) => item.bucket === viewerTab.value)
})

const visibleFeed = computed(() =>
  [...localFeed.value, ...props.liveFeed].slice(0, 12)
)

const hottestMoment = computed(() =>
  activeSegment.value
    ? `${activeSegment.value.window} 正在执行 ${activeSegment.value.label}`
    : '等待当前房间进入脚本节奏'
)

const feedToneLabel = (tone: LiveFeedItem['tone']) => {
  if (tone === 'gift') return '礼物'
  if (tone === 'order') return '成交'
  if (tone === 'follow') return '关注'
  return '播报'
}

const pushLocalFeed = (item: Omit<LiveFeedItem, 'id' | 'time'>) => {
  localFeed.value = [
    {
      id: `local-${Date.now()}`,
      time: nowTime(),
      ...item
    },
    ...localFeed.value
  ].slice(0, 4)
}

const previewAction = (label: string) => {
  pushLocalFeed({
    user: '运营台',
    action: '执行动作',
    highlight: label,
    tone: 'notice'
  })
  ElMessage.success(`${label} 已接入 ${props.selectedRoom.name} 的运营动作台`)
}

const previewGift = (gift: GiftItem) => {
  pushLocalFeed({
    user: '运营台',
    action: '挂载礼物',
    highlight: gift.name,
    tone: 'gift'
  })
  ElMessage.success(
    `已将 ${gift.name} 加入 ${props.selectedRoom.name} 底部礼物栏`
  )
}

const enterRoom = () => {
  pushLocalFeed({
    user: '系统',
    action: '进入房间',
    highlight: props.selectedRoom.name,
    tone: 'notice'
  })
  router.push({
    name: 'live-center-room-studio',
    params: { roomId: props.selectedRoom.id },
    query: streamPreviewUrl.value ? { stream: streamPreviewUrl.value } : {}
  })
}

const shareRoom = async () => {
  const shareText = `${props.selectedRoom.name}｜${props.selectedRoom.host}｜${props.selectedRoom.slot}`
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareText)
      ElMessage.success('分享文案已复制到剪贴板')
      return
    }
  } catch {
    // Clipboard may be unavailable in some environments.
  }

  ElMessage.success(`已生成 ${props.selectedRoom.name} 的分享预览`)
}

const applyLink = () => {
  const value = normalizeStreamUrl(externalLink.value)
  if (!value) {
    ElMessage.warning('请先输入 m3u8、flv、mp4 或 mock:// 房间ID')
    return
  }

  appliedLink.value = value
  pushLocalFeed({
    user: '系统',
    action: '切换流',
    highlight: value,
    tone: 'notice'
  })

  if (resolveStreamSource(value).kind === 'unsupported') {
    ElMessage.warning('地址已写入，但它不是 m3u8、flv、mp4 直链')
    return
  }

  ElMessage.success('已切换到新的直播流')
}

const activateSegment = (segment: SceneSegment) => {
  activeSegmentId.value = segment.id
  ElMessage.success(`已切到 ${segment.label}`)
}

const sendComposerMessage = () => {
  const value = draftMessage.value.trim()
  if (!value) {
    ElMessage.warning('请输入要发送的话术')
    return
  }

  pushLocalFeed({
    user: '运营台',
    action: '发送话术',
    highlight: value,
    tone: 'notice'
  })
  draftMessage.value = ''
  ElMessage.success('互动话术已发送')
}
</script>

<style scoped lang="scss">
.live-room-shell {
  --panel-bg: linear-gradient(
    180deg,
    rgba(30, 35, 52, 0.96),
    rgba(17, 21, 35, 0.96)
  );
  --panel-border: rgba(255, 255, 255, 0.08);
  --text-main: #f5f7ff;
  --text-subtle: rgba(233, 238, 255, 0.68);
  --rose: #ff5d7c;
  --amber: #ffca65;
  --aqua: #66e3db;
  --violet: #8d7dff;
  --shadow-lg: 0 28px 70px rgba(4, 10, 24, 0.42);
  --shadow-sm: 0 14px 30px rgba(4, 10, 24, 0.22);
  --display-font: 'Bahnschrift', 'Segoe UI', sans-serif;

  display: grid;
  gap: 18px;
  color: var(--text-main);
}

.room-command-bar,
.stage-panel,
.interaction-panel,
.panel-card,
.dock-card,
.chat-composer {
  border: 1px solid var(--panel-border);
  border-radius: 28px;
  background: var(--panel-bg);
  box-shadow:
    var(--shadow-lg),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(18px);
}

.room-command-bar,
.stage-panel,
.interaction-panel {
  position: relative;
  overflow: hidden;
}

.room-command-bar::before,
.stage-panel::before,
.interaction-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      circle at top left,
      rgba(102, 227, 219, 0.14),
      transparent 28%
    ),
    radial-gradient(
      circle at top right,
      rgba(255, 93, 124, 0.16),
      transparent 26%
    );
  pointer-events: none;
}

.room-command-bar {
  display: grid;
  gap: 16px;
  padding: 18px;
}

.room-switcher {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.room-chip {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.04);
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.room-chip:hover,
.ghost-button:hover,
.primary-button:hover,
.action-button:hover,
.rank-tab:hover,
.segment-item:hover,
.footer-chip:hover {
  transform: translateY(-2px);
}

.room-chip.active {
  border-color: rgba(255, 93, 124, 0.34);
  background:
    linear-gradient(135deg, rgba(255, 93, 124, 0.16), rgba(102, 227, 219, 0.1)),
    rgba(255, 255, 255, 0.05);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    var(--shadow-sm);
}

.room-chip-status {
  width: 12px;
  height: 12px;
  border-radius: 999px;
}

.room-chip-status.live {
  background: var(--rose);
  box-shadow: 0 0 0 8px rgba(255, 93, 124, 0.14);
}

.room-chip-status.next {
  background: var(--aqua);
  box-shadow: 0 0 0 8px rgba(102, 227, 219, 0.12);
}

.room-chip-status.done {
  background: var(--amber);
  box-shadow: 0 0 0 8px rgba(255, 202, 101, 0.12);
}

.room-chip-copy,
.room-chip-copy strong,
.room-chip-copy small,
.room-chip-metrics span,
.room-chip-metrics strong {
  display: block;
}

.room-chip-copy strong,
.status-copy strong,
.hero-copy h2,
.spotlight-card > strong,
.dock-head strong,
.panel-head strong,
.footer-product strong {
  font-family: var(--display-font);
  letter-spacing: 0.02em;
}

.room-chip-copy strong {
  font-size: 15px;
}

.room-chip-copy small,
.room-chip-metrics span,
.status-copy p,
.anchor-copy p,
.hero-copy p,
.dock-paragraph,
.panel-head p,
.rank-copy small,
.chat-meta span,
.product-metric span,
.floating-stat span,
.quick-metric small {
  color: var(--text-subtle);
}

.room-chip-copy small {
  margin-top: 4px;
  font-size: 12px;
}

.room-chip-metrics {
  text-align: right;
}

.room-chip-metrics span {
  font-size: 11px;
}

.room-chip-metrics strong {
  margin-top: 4px;
  font-size: 14px;
}

.command-tools {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
}

.command-status {
  display: grid;
  grid-template-columns: minmax(280px, 1.1fr) auto minmax(0, 1.1fr);
  gap: 16px;
  align-items: stretch;
}

.status-copy {
  min-width: 0;
}

.status-copy strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
  line-height: 1.2;
}

.status-copy p {
  margin: 10px 0 0;
  line-height: 1.7;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.82);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.status-pills {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-content: flex-start;
}

.status-pill,
.live-badge,
.sub-badge,
.spotlight-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-pill.live,
.live-badge.live {
  color: #fff;
  background: linear-gradient(135deg, var(--rose), #ff8a5b);
}

.status-pill.next,
.live-badge.next {
  color: #062326;
  background: linear-gradient(135deg, var(--aqua), #9cf7f0);
}

.status-pill.done,
.live-badge.done {
  color: #442f05;
  background: linear-gradient(135deg, var(--amber), #ffe3aa);
}

.status-pill.subtle,
.sub-badge {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-main);
}

.status-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.quick-metric {
  padding: 14px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.04);
}

.quick-metric span,
.quick-metric strong,
.quick-metric small {
  display: block;
}

.quick-metric span {
  font-size: 12px;
}

.quick-metric strong {
  margin-top: 10px;
  font-size: 21px;
}

.quick-metric small {
  margin-top: 8px;
  line-height: 1.5;
}

.primary-button,
.ghost-button,
.action-button,
.rank-tab,
.segment-item,
.footer-chip {
  border: 0;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.primary-button,
.ghost-button {
  min-height: 46px;
  padding: 0 18px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 700;
}

.primary-button {
  color: #fff;
  background: linear-gradient(135deg, var(--rose), #ff8a5b);
  box-shadow: 0 14px 28px rgba(255, 93, 124, 0.28);
}

.ghost-button {
  color: inherit;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.ghost-button.compact {
  min-height: 38px;
  padding: 0 14px;
  border-radius: 14px;
}

.live-room-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  align-items: start;
}

.stage-panel,
.interaction-panel {
  padding: 18px;
}

.stage-screen {
  position: relative;
  overflow: hidden;
  min-height: 720px;
  padding: 22px;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background:
    radial-gradient(
      circle at top left,
      rgba(255, 93, 124, 0.2),
      transparent 24%
    ),
    radial-gradient(
      circle at top right,
      rgba(102, 227, 219, 0.14),
      transparent 22%
    ),
    linear-gradient(135deg, #151a2c 0%, #1b2237 48%, #111728 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    var(--shadow-lg);
}

.stage-screen::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 34px 34px;
  opacity: 0.22;
  pointer-events: none;
}

.stage-backdrop {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 28px;
  pointer-events: none;
}

.stage-backdrop span {
  font-family: var(--display-font);
  font-size: clamp(42px, 8vw, 88px);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.05);
  text-align: right;
}

.stage-topbar,
.stage-main,
.floating-strip {
  position: relative;
  z-index: 1;
}

.stage-topbar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.anchor-card {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: var(--shadow-sm);
}

.anchor-avatar {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffffff, #9feae3);
  color: #102032;
  font-size: 24px;
  font-weight: 800;
}

.anchor-title-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.anchor-title-row strong {
  font-size: 16px;
}

.anchor-title-row span {
  color: var(--text-subtle);
  font-size: 12px;
}

.anchor-copy p {
  margin: 6px 0 0;
  font-size: 12px;
}

.topbar-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.stage-main {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.84fr);
  gap: 18px;
  margin-top: 22px;
}

.viewer-column {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.viewer-stage-card {
  padding: 16px;
  border-radius: 24px;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.07),
      rgba(255, 255, 255, 0.03)
    ),
    rgba(7, 11, 20, 0.48);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: var(--shadow-sm);
}

.viewer-stage-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.viewer-stage-head strong {
  display: block;
  margin-top: 8px;
  font-family: var(--display-font);
  font-size: 22px;
}

.viewer-stage-body {
  overflow: hidden;
  border-radius: 20px;
  background: rgba(6, 10, 18, 0.78);
}

.viewer-stage-body :deep(.stream-surface) {
  min-height: 440px;
  border-radius: 20px;
}

.viewer-stage-body :deep(.player-shell) {
  min-height: 440px;
  height: 100%;
  border: 0;
  border-radius: 20px;
  box-shadow: none;
}

.viewer-stage-body :deep(.player-stage) {
  min-height: 440px;
}

.viewer-stage-body :deep(.stream-video),
.viewer-stage-body :deep(.stream-placeholder),
.viewer-stage-body :deep(.stream-state) {
  min-height: 440px;
  height: 440px;
}

.hero-stage {
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: space-between;
  min-height: 0;
}

.hero-badges,
.tag-row,
.product-perks {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-copy h2 {
  margin: 12px 0 0;
  font-size: clamp(34px, 4vw, 52px);
  line-height: 1.04;
}

.hero-copy p {
  max-width: 560px;
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.8;
}

.stage-progress,
.spotlight-card,
.dock-card,
.panel-card,
.chat-composer {
  border-radius: 24px;
}

.stage-progress {
  padding: 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.progress-copy {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
  flex-wrap: wrap;
}

.progress-copy strong {
  font-size: 20px;
}

.progress-copy span {
  color: var(--text-subtle);
  font-size: 13px;
}

.progress-track {
  position: relative;
  margin-top: 14px;
  height: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.progress-bar {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--aqua), var(--rose));
  box-shadow: 0 0 24px rgba(255, 93, 124, 0.4);
}

.tag-pill,
.product-perks span {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.84);
  font-size: 12px;
}

.spotlight-card {
  margin-top: auto;
  padding: 20px;
  background:
    linear-gradient(
      140deg,
      rgba(255, 93, 124, 0.16),
      rgba(102, 227, 219, 0.08)
    ),
    rgba(16, 20, 32, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: var(--shadow-sm);
}

.spotlight-head,
.dock-head,
.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.spotlight-head {
  margin-bottom: 12px;
}

.spotlight-badge {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.spotlight-card > strong {
  display: block;
  font-size: 24px;
}

.spotlight-card > p {
  margin: 10px 0 0;
  max-width: 520px;
  color: var(--text-subtle);
  line-height: 1.7;
}

.product-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.product-metric {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.product-metric span,
.product-metric strong {
  display: block;
}

.product-metric strong {
  margin-top: 8px;
  font-size: 18px;
}

.product-perks {
  margin-top: 16px;
}

.control-dock {
  display: grid;
  gap: 16px;
}

.dock-card {
  padding: 18px;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.06),
      rgba(255, 255, 255, 0.03)
    ),
    rgba(7, 11, 20, 0.42);
}

.dock-head strong {
  font-size: 18px;
}

.dock-paragraph {
  margin: 14px 0 0;
  line-height: 1.7;
}

.segment-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.segment-item {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 18px;
  text-align: left;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: inherit;
}

.segment-item > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}

.segment-item strong {
  font-size: 14px;
}

.segment-item small,
.segment-item span {
  color: var(--text-subtle);
  font-size: 12px;
}

.segment-item.active {
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.segment-item.rose.active {
  background: linear-gradient(
    135deg,
    rgba(255, 93, 124, 0.2),
    rgba(255, 255, 255, 0.04)
  );
}

.segment-item.amber.active {
  background: linear-gradient(
    135deg,
    rgba(255, 202, 101, 0.2),
    rgba(255, 255, 255, 0.04)
  );
}

.segment-item.aqua.active {
  background: linear-gradient(
    135deg,
    rgba(102, 227, 219, 0.2),
    rgba(255, 255, 255, 0.04)
  );
}

.segment-item.violet.active {
  background: linear-gradient(
    135deg,
    rgba(141, 125, 255, 0.2),
    rgba(255, 255, 255, 0.04)
  );
}

.cue-grid,
.action-grid {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.cue-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.cue-card {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.cue-card span,
.cue-card strong,
.cue-card small,
.floating-stat span,
.floating-stat strong {
  display: block;
}

.cue-card strong {
  margin-top: 10px;
  font-size: 16px;
}

.cue-card small {
  margin-top: 8px;
  color: var(--text-subtle);
  line-height: 1.6;
}

.action-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.action-button {
  min-height: 44px;
  padding: 0 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: inherit;
  font-size: 13px;
  font-weight: 700;
}

.floating-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.floating-stat {
  padding: 14px 16px;
  border-radius: 20px;
  background:
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.07),
      rgba(255, 255, 255, 0.03)
    ),
    rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: var(--shadow-sm);
}

.floating-stat strong {
  margin-top: 10px;
  font-size: 18px;
}

.stage-footer {
  display: grid;
  grid-template-columns: minmax(260px, 0.9fr) minmax(0, 1.1fr);
  gap: 16px;
  align-items: center;
  margin-top: 16px;
}

.footer-product,
.footer-scenes {
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.04);
}

.footer-product p {
  margin: 10px 0 0;
  color: var(--text-subtle);
  line-height: 1.7;
}

.footer-scenes {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.footer-chip {
  display: grid;
  gap: 8px;
  align-content: center;
  min-height: 88px;
  padding: 14px;
  border-radius: 18px;
  text-align: left;
  color: #fff;
}

.footer-chip span,
.footer-chip strong {
  display: block;
}

.footer-chip.rose {
  background: linear-gradient(
    135deg,
    rgba(255, 93, 124, 0.9),
    rgba(255, 140, 120, 0.72)
  );
}

.footer-chip.amber {
  color: #2c1d00;
  background: linear-gradient(
    135deg,
    rgba(255, 202, 101, 0.96),
    rgba(255, 233, 178, 0.8)
  );
}

.footer-chip.aqua {
  color: #082528;
  background: linear-gradient(
    135deg,
    rgba(102, 227, 219, 0.96),
    rgba(180, 252, 244, 0.78)
  );
}

.footer-chip.violet {
  background: linear-gradient(
    135deg,
    rgba(141, 125, 255, 0.94),
    rgba(195, 186, 255, 0.72)
  );
}

.interaction-panel {
  display: grid;
  gap: 16px;
}

.panel-card {
  padding: 18px;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.06),
      rgba(255, 255, 255, 0.03)
    ),
    rgba(7, 11, 20, 0.46);
}

.panel-head strong {
  display: block;
  margin-top: 8px;
  font-size: 22px;
}

.panel-head p {
  margin: 8px 0 0;
  line-height: 1.6;
}

.rank-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.rank-tab {
  min-height: 40px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: inherit;
  font-size: 12px;
  font-weight: 700;
}

.rank-tab.active {
  background: linear-gradient(
    135deg,
    rgba(255, 93, 124, 0.22),
    rgba(102, 227, 219, 0.12)
  );
  border-color: rgba(255, 255, 255, 0.12);
}

.rank-list,
.insight-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.rank-row {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.rank-index {
  width: 24px;
  text-align: center;
  color: var(--text-subtle);
  font-size: 12px;
  font-weight: 700;
}

.rank-avatar {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.rank-avatar.rose {
  background: rgba(255, 93, 124, 0.18);
  color: #ffd4dd;
}

.rank-avatar.amber {
  background: rgba(255, 202, 101, 0.18);
  color: #ffeab8;
}

.rank-avatar.aqua {
  background: rgba(102, 227, 219, 0.18);
  color: #d4fffa;
}

.rank-score {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.84);
}

.empty-state {
  margin-top: 16px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-subtle);
  text-align: center;
  font-size: 13px;
}

.insight-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.04);
}

.insight-item strong,
.insight-item p {
  display: block;
}

.insight-item strong {
  font-size: 14px;
}

.insight-item p {
  margin: 6px 0 0;
  color: var(--text-subtle);
  font-size: 12px;
  line-height: 1.6;
}

.insight-item > span {
  font-family: var(--display-font);
  font-size: 20px;
  font-weight: 700;
  white-space: nowrap;
}

.insight-item.rose {
  background: linear-gradient(
    135deg,
    rgba(255, 93, 124, 0.14),
    rgba(255, 255, 255, 0.03)
  );
}

.insight-item.amber {
  background: linear-gradient(
    135deg,
    rgba(255, 202, 101, 0.14),
    rgba(255, 255, 255, 0.03)
  );
}

.insight-item.aqua {
  background: linear-gradient(
    135deg,
    rgba(102, 227, 219, 0.14),
    rgba(255, 255, 255, 0.03)
  );
}

.insight-item.violet {
  background: linear-gradient(
    135deg,
    rgba(141, 125, 255, 0.14),
    rgba(255, 255, 255, 0.03)
  );
}

.chat-board {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chat-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
  max-height: 460px;
  overflow-y: auto;
  padding-right: 4px;
}

.chat-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.chat-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.chat-badge.gift {
  background: rgba(255, 93, 124, 0.18);
  color: #ffd7df;
}

.chat-badge.order {
  background: rgba(255, 202, 101, 0.18);
  color: #ffe8b0;
}

.chat-badge.follow {
  background: rgba(102, 227, 219, 0.18);
  color: #d4fffa;
}

.chat-badge.notice {
  background: rgba(141, 125, 255, 0.18);
  color: #e2dcff;
}

.chat-bubble {
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.chat-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}

.chat-bubble p {
  margin: 8px 0 0;
  line-height: 1.6;
}

.chat-composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  padding: 16px;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.06),
      rgba(255, 255, 255, 0.03)
    ),
    rgba(7, 11, 20, 0.46);
}

.source-input,
.composer-field {
  min-width: 0;
}

.source-input :deep(.el-input__wrapper),
.composer-field :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.07);
  box-shadow: none;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.source-input :deep(.el-input__inner),
.composer-field :deep(.el-input__inner),
.composer-field :deep(.el-input__count) {
  color: var(--text-main);
}

.source-input :deep(.el-input__inner::placeholder),
.composer-field :deep(.el-input__inner::placeholder) {
  color: var(--text-subtle);
}

@media (max-width: 1400px) {
  .live-room-layout {
    grid-template-columns: 1fr;
  }

  .interaction-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }

  .chat-board,
  .chat-composer {
    grid-column: 1 / -1;
  }
}

@media (max-width: 1180px) {
  .room-switcher,
  .status-metrics,
  .cue-grid,
  .footer-scenes {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .command-status,
  .stage-main,
  .stage-footer {
    grid-template-columns: 1fr;
  }

  .topbar-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 820px) {
  .room-switcher,
  .command-tools,
  .rank-tabs,
  .action-grid,
  .product-meta,
  .floating-strip,
  .interaction-panel,
  .chat-composer {
    grid-template-columns: 1fr;
  }

  .stage-topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-copy h2 {
    font-size: 32px;
  }

  .status-copy strong,
  .panel-head strong {
    font-size: 20px;
  }

  .viewer-stage-body :deep(.player-shell),
  .viewer-stage-body :deep(.player-stage),
  .viewer-stage-body :deep(.stream-video),
  .viewer-stage-body :deep(.stream-placeholder),
  .viewer-stage-body :deep(.stream-state) {
    min-height: 300px;
    height: 300px;
  }
}
</style>

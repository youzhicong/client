<template>
  <div class="monetization-grid">
    <div class="gift-card card">
      <div class="card-head">
        <div>
          <span class="section-kicker">礼物中心</span>
          <h3>用户送礼互动</h3>
        </div>
        <span class="pill">当前房间：{{ selectedRoomName }}</span>
      </div>
      <div class="gift-grid">
        <button
          v-for="item in giftItems"
          :key="item.id"
          type="button"
          class="gift-item-card"
          :class="{ active: item.id === selectedGiftId }"
          @click="emit('select-gift', item.id)"
        >
          <div class="gift-item-head">
            <strong>{{ item.name }}</strong
            ><span class="gift-badge">{{ item.badge }}</span>
          </div>
          <p>{{ item.desc }}</p>
          <span class="gift-price">{{ formatAmount(item.price) }} 金豆</span>
        </button>
      </div>
      <div class="action-bar">
        <el-button
          type="primary"
          :loading="sendingGift"
          @click="emit('send-gift')"
          >立即送礼</el-button
        >
      </div>
    </div>
    <div class="recharge-card card">
      <div class="card-head">
        <div>
          <span class="section-kicker">充值中心</span>
          <h3>礼物余额充值</h3>
        </div>
      </div>
      <div class="wallet-strip">
        <div class="wallet-card">
          <span>当前余额</span
          ><strong>{{ formatAmount(walletSummary.balance) }} 金豆</strong>
        </div>
        <div class="wallet-card">
          <span>今日送礼</span
          ><strong
            >{{ formatAmount(walletSummary.giftSpendToday) }} 金豆</strong
          >
        </div>
      </div>
      <div class="package-list">
        <button
          v-for="item in rechargePackages"
          :key="item.id"
          type="button"
          class="package-card"
          :class="{ active: item.id === selectedPackageId }"
          @click="emit('select-package', item.id)"
        >
          <div class="package-top">
            <div>
              <strong>{{ formatAmount(item.coins) }} 金豆</strong>
              <p>{{ item.desc }}</p>
            </div>
            <span class="gift-badge">{{ item.badge }}</span>
          </div>
          <div class="package-foot">
            <span>赠送 {{ formatAmount(item.bonus) }} 金豆</span
            ><strong>￥{{ item.price }}</strong>
          </div>
        </button>
      </div>
      <div class="action-bar">
        <el-button
          type="primary"
          plain
          :loading="recharging"
          @click="emit('recharge')"
          >立即充值</el-button
        >
      </div>
    </div>
    <div class="wallet-ledger card">
      <div class="card-head">
        <div>
          <span class="section-kicker">交易流水</span>
          <h3>送礼与充值记录</h3>
        </div>
        <span class="pill subtle"
          >今日充值 {{ formatAmount(walletSummary.rechargeToday) }}</span
        >
      </div>
      <div class="ledger-list">
        <div
          v-for="item in recentTransactions"
          :key="item.id"
          class="ledger-item"
        >
          <div class="ledger-top">
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ item.note }}</p>
            </div>
            <span
              class="ledger-amount"
              :class="{ income: item.amount > 0, expense: item.amount < 0 }"
              >{{ item.amount > 0 ? '+' : ''
              }}{{ formatAmount(item.amount) }}</span
            >
          </div>
          <div class="ledger-foot">
            <span>{{ item.time }}</span
            ><span
              class="status-chip small"
              :class="item.type === 'recharge' ? 'done' : 'live'"
              >{{ item.type === 'recharge' ? '充值' : '送礼' }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {
  GiftItem,
  RechargePackage,
  WalletSummary,
  WalletTransaction
} from '../types'
defineProps<{
  giftItems: GiftItem[]
  recentTransactions: WalletTransaction[]
  rechargePackages: RechargePackage[]
  recharging: boolean
  selectedGiftId: string
  selectedPackageId: string
  selectedRoomName: string
  sendingGift: boolean
  walletSummary: WalletSummary
}>()
const emit = defineEmits<{
  recharge: []
  'select-gift': [giftId: string]
  'select-package': [packageId: string]
  'send-gift': []
}>()
const formatAmount = (amount: number) =>
  new Intl.NumberFormat('zh-CN').format(Math.abs(amount))
</script>

<style scoped lang="scss">
.monetization-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr) minmax(0, 0.95fr);
  gap: 14px;
}
.gift-card,
.recharge-card,
.wallet-ledger {
  padding: 18px;
}
.gift-grid,
.package-list,
.ledger-list {
  display: grid;
  gap: 10px;
}
.gift-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.wallet-strip {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}
.wallet-card,
.gift-item-card,
.package-card,
.ledger-item {
  border-radius: 16px;
  border: 1px solid var(--lc-border);
  background: var(--lc-panel-strong);
}
.wallet-card {
  flex: 1;
  padding: 14px 16px;
}
.wallet-card span {
  font-size: 12px;
  color: var(--lc-muted);
}
.wallet-card strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
}
.gift-item-card,
.package-card {
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}
.gift-item-card:hover,
.package-card:hover {
  transform: translateY(-1px);
  border-color: rgba(15, 157, 146, 0.2);
}
.gift-item-card.active,
.package-card.active {
  border-color: rgba(15, 157, 146, 0.24);
  background: linear-gradient(
    135deg,
    rgba(233, 249, 247, 0.96),
    rgba(241, 249, 255, 0.96)
  );
}
.gift-item-head,
.package-top,
.package-foot,
.ledger-top,
.ledger-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.gift-item-card p,
.package-top p,
.ledger-top p {
  margin: 10px 0 0;
  color: var(--lc-muted);
  font-size: 12px;
  line-height: 1.6;
}
.gift-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: #e9f9f7;
  color: var(--lc-accent);
  font-size: 11px;
  font-weight: 700;
}
.gift-price {
  display: block;
  margin-top: 12px;
  color: var(--lc-secondary);
  font-size: 16px;
  font-weight: 700;
}
.action-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.ledger-item {
  padding: 14px 16px;
}
.ledger-amount {
  font-size: 18px;
  font-weight: 700;
}
.ledger-amount.income {
  color: #15803d;
}
.ledger-amount.expense {
  color: #d94732;
}
.ledger-foot span:first-child {
  color: var(--lc-muted);
  font-size: 12px;
}
@media (max-width: 1480px) {
  .monetization-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 980px) {
  .gift-grid {
    grid-template-columns: 1fr;
  }
  .wallet-strip,
  .gift-item-head,
  .package-top,
  .package-foot,
  .ledger-top,
  .ledger-foot {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

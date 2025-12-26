<template>
  <div class="login">
    <img src="../../assets/imgs/login/login-leftbg.png" class="imgs" />
    <div class="logins-1">
      <div class="de-car">
        <CpIcon :name="`log-gengduoquanzhong`"></CpIcon>
        <div class="textj-1">欢迎你来到萌聪系统</div>
        <el-form :model="form" label-width="auto" style="max-width: 800px">
          <el-form-item label="账号">
            <el-input v-model="form.name" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" type="password" />
          </el-form-item>
        </el-form>
        <div class="button-group">
          <el-button type="primary" @click="onSubmit" class="dels-1"
            >登录</el-button
          >
          <el-button>取消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const form = reactive({
  name: '',
  password: ''
})
const router = useRouter()
const onSubmit = () => {
  router.push('/home')
}
onMounted(() => {
  console.log('login page mounted')
})
</script>

<style lang="scss" scoped>
.login {
  width: 100%;
  height: 100%;
  display: flex;
}
.imgs {
  width: 68%;
  height: 100%;
}
.logins-1 {
  width: 32%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.de-car {
  width: 520px;
  height: 400px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 10px;
  transition:
    background 400ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 400ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 400ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: background, box-shadow, transform, border-color;
  /* 玻璃效果 */
  background: linear-gradient(
    135deg,
    rgba(120, 200, 255, 0.28),
    rgba(160, 130, 255, 0.22)
  );
  backdrop-filter: blur(26px) saturate(190%);

  border: 1px solid rgba(120, 200, 255, 0.35);
  box-shadow:
    0 18px 40px rgba(90, 120, 255, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
}
.de-car:hover {
  background: linear-gradient(
    135deg,
    rgba(100, 180, 255, 0.35),
    rgba(180, 140, 255, 0.3)
  );
  border-color: rgba(120, 200, 255, 0.55);
  box-shadow:
    0 24px 60px rgba(90, 120, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
  transform: translateY(-2px);
}
.textj-1 {
  font-size: 16px;
  margin: 20px 0;
}
.button-group {
  width: 100%;
  text-align: center;
}
.dels-1 {
  margin-left: 40px;
}
</style>

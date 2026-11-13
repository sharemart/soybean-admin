<script setup lang="ts">
import { computed } from 'vue';
import { Cloud, Cpu, Radio } from 'lucide-vue-next';
import { useAuthStore } from '@/store/modules/auth';

defineProps<{ time: string }>();

const authStore = useAuthStore();
const companyTitle = computed(() => `${authStore.userInfo.company_name || '智慧物业'} · 物业管理驾驶舱`);
</script>

<template>
  <div class="header-center">
    <div class="title-decoration"></div>
    <div class="title-content">
      <h1>{{ companyTitle }}</h1>
      <div class="title-meta">
        <span class="live-dot">
          <Radio :size="12" />
          实时运行
        </span>
        <span class="time">{{ time }}</span>
        <span class="meta-tag">
          <Cpu :size="11" />
          AI 调度已接入
        </span>
        <span class="meta-tag">
          <Cloud :size="11" />
          云端同步正常
        </span>
      </div>
    </div>
    <div class="title-decoration reverse"></div>
  </div>
</template>

<style scoped>
.header-center {
  display: flex;
  align-items: center;
  gap: 12px;
}
.title-decoration {
  width: 44px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #1cd9ff);
}
.title-decoration.reverse {
  background: linear-gradient(90deg, #1cd9ff, transparent);
}
.title-content {
  text-align: center;
}
h1 {
  margin: 0;
  color: #f2f8ff;
  font-size: clamp(17px, 1.55vw, 25px);
  font-weight: 800;
  letter-spacing: 1px;
  text-shadow: 0 0 18px rgba(16, 213, 255, 0.25);
}
.title-meta {
  margin-top: clamp(4px, 0.4vh, 7px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(8px, 0.9vw, 14px);
  color: #7799b8;
  font-size: clamp(10px, 1.1vw, 13px);
}
.live-dot {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #00d89a;
}
.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 8px;
  border: 1px solid rgba(74, 140, 180, 0.28);
  border-radius: 8px;
  background: rgba(18, 43, 71, 0.48);
}
</style>

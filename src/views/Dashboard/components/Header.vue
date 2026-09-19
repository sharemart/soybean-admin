<script setup lang="ts">
import { Cloud, Cpu, Radio } from 'lucide-vue-next';

defineProps<{ time: string }>();
</script>

<template>
  <div class="header-center">
    <div class="title-decoration"></div>
    <div class="title-content">
      <h1>小马养梯维保 · 全局监控驾驶舱</h1>
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
  white-space: nowrap;
}
.title-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 13px;
  margin-top: 5px;
  color: #8fa8c5;
  font-size: 10px;
}
.live-dot,
.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.live-dot {
  padding: 3px 10px;
  color: #00e3a1;
  border: 1px solid rgba(0, 227, 161, 0.3);
  border-radius: 10px;
  background: rgba(0, 227, 161, 0.08);
}
.time {
  color: #a7bad0;
  font-family: 'SFMono-Regular', Consolas, monospace;
}
@media (max-width: 720px) {
  .header-center {
    width: 100%;
    justify-content: center;
  }
  .title-decoration {
    display: none;
  }
  h1 {
    white-space: normal;
  }
  .meta-tag {
    display: none;
  }
}
</style>

<script setup lang="ts">
import { defineEmits, reactive, ref, watch } from 'vue';
import { NAlert, NInput, NSelect } from 'naive-ui';
import { Monitor, ShieldAlert, Video } from 'lucide-vue-next';

// 定义Props类型
interface Props {
  formData: Record<string, any>;
}

// 定义事件派发
const emit = defineEmits<{
  (e: 'update:formData', value: Record<string, any>): void;
  (e: 'update:field', field: string, value: any): void;
}>();

// 接收Props
const props = defineProps<Props>();

// 创建本地响应式副本（初始化默认值）
const localFormData = reactive<Record<string, any>>({
  // 初始化视频通道数据（避免undefined报错）
  video_channels: props.formData.video_channels || [
    { sn: '', channel: '' },
    { sn: '', channel: '' },
    { sn: '', channel: '' },
    { sn: '', channel: '' }
  ],
  video_protocol: '',
  camera_uuid: '',
  ...props.formData
});

// 监听父组件formData变化，同步到本地副本
watch(
  () => props.formData,
  newVal => {
    Object.assign(localFormData, newVal);
    // 确保video_channels始终是数组且有4个元素
    localFormData.video_channels = newVal.video_channels
      ? [...newVal.video_channels].slice(0, 4)
      : [
          { sn: '', channel: '' },
          { sn: '', channel: '' },
          { sn: '', channel: '' },
          { sn: '', channel: '' }
        ];
  },
  { immediate: true, deep: true }
);

// 监听本地副本变化，派发给父组件
watch(
  localFormData,
  newVal => {
    emit('update:formData', { ...newVal });
  },
  { deep: true }
);

// 便捷更新字段方法
const updateField = (field: string, value: any) => {
  localFormData[field] = value;
  emit('update:field', field, value);
};

// 更新视频通道数据
const updateVideoChannel = (index: number, key: 'sn' | 'channel', value: any) => {
  localFormData.video_channels[index][key] = value;
};
</script>

<template>
  <div class="animate-in fade-in duration-500 space-y-8">
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <!-- 边缘计算网关接入 -->
      <div class="space-y-6">
        <h4 class="flex items-center gap-2 text-xs text-slate-400 font-black tracking-widest uppercase">
          <Monitor :size="14" class="text-sky-500" />
          边缘计算网关接入
        </h4>
        <div class="grid grid-cols-1 gap-4">
          <div
            v-for="(channel, i) in localFormData.video_channels"
            :key="i"
            class="group flex items-center gap-4 border border-slate-100 rounded-2xl bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <div
              class="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-slate-400 transition-colors dark:bg-slate-900 group-hover:text-sky-500"
            >
              <Video :size="18" />
            </div>
            <div class="grid grid-cols-2 flex-1 gap-3">
              <NInput
                v-model:value="channel.sn"
                placeholder="序列号"
                class="rounded-[1.25rem] px-4 py-2 text-[11px] font-mono"
                @change="updateVideoChannel(i, 'sn', channel.sn)"
              />
              <NInput
                v-model:value="channel.channel"
                placeholder="通道号"
                class="rounded-[1.25rem] px-4 py-2 text-[11px] font-mono"
                @change="updateVideoChannel(i, 'channel', channel.channel)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 视频协议与标准 -->
      <div class="space-y-6">
        <h4 class="flex items-center gap-2 text-xs text-slate-400 font-black tracking-widest uppercase">
          <ShieldAlert :size="14" class="text-indigo-500" />
          视频协议与标准
        </h4>
        <div
          class="border border-slate-100 rounded-[2.5rem] bg-white p-8 space-y-6 dark:border-slate-800 dark:bg-slate-950/40"
        >
          <!-- 流媒体传输标准 -->
          <div class="space-y-2">
            <label class="text-[10px] text-slate-400 font-black tracking-widest uppercase">流媒体传输标准</label>
            <NSelect
              v-model:value="localFormData.video_protocol"
              :options="[
                { label: '萤石云 (Cloud P2P)', value: '1' },
                { label: 'GB/T 28181 (National Standard)', value: '2' }
              ]"
              class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            />
          </div>

          <!-- 全局摄像头 ID -->
          <div class="space-y-2">
            <label class="text-[10px] text-slate-400 font-black tracking-widest uppercase">全局摄像头 ID</label>
            <NInput
              v-model:value="localFormData.camera_uuid"
              placeholder="CAMERA_NODE_UUID..."
              class="rounded-[1.25rem] px-4 py-2.5 text-sm font-mono"
            />
          </div>

          <!-- 提示信息 -->
          <NAlert
            type="info"
            title="提示"
            class="pt-4 text-[9px] font-bold leading-relaxed uppercase italic opacity-50"
          >
            系统将根据所选协议自动分配资源。若使用国标协议，请确保已在信令网关完成注册。
          </NAlert>
        </div>
      </div>
    </div>
  </div>
</template>

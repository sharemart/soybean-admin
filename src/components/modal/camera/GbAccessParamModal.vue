<script setup lang="ts">
import { computed } from 'vue';
import { useMessage } from 'naive-ui';
import { Copy, Server, X } from 'lucide-vue-next';
import type { CameraAccessParam } from '@/service/api/camera/camera.d';

interface Props {
  isOpen: boolean;
  accessParam: CameraAccessParam | null;
  tip?: string;
}

const props = withDefaults(defineProps<Props>(), {
  tip: ''
});

const emit = defineEmits<{
  close: [];
}>();

const message = useMessage();

const fields = computed(() => {
  const p = props.accessParam;
  if (!p) return [];
  return [
    { label: 'SIP 服务器', value: p.sip_server },
    { label: 'SIP 端口', value: String(p.sip_port ?? '') },
    { label: 'SIP 服务器 ID', value: p.sip_server_id },
    { label: 'SIP 域', value: p.sip_domain },
    { label: '设备国标编码', value: p.device_id },
    { label: 'License 密码', value: p.password },
    { label: '心跳(秒)', value: String(p.heartbeat ?? '') },
    { label: '传输协议', value: p.transport },
    { label: '配置提示', value: p.tip || props.tip }
  ].filter(item => item.value);
});

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success('已复制');
  } catch {
    message.error('复制失败');
  }
};

const copyAll = async () => {
  const text = fields.value.map(f => `${f.label}: ${f.value}`).join('\n');
  await copyText(text);
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-lg overflow-hidden border border-slate-200 rounded-[2rem] bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
    >
      <header class="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <div class="rounded-xl bg-sky-500/10 p-2 text-sky-500">
            <Server :size="18" />
          </div>
          <div>
            <h3 class="text-sm text-slate-800 font-black dark:text-slate-100">国标 SIP 接入参数</h3>
            <p class="text-[10px] text-slate-400 font-bold tracking-widest uppercase">GB28181 Access</p>
          </div>
        </div>
        <button class="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" @click="emit('close')">
          <X :size="18" />
        </button>
      </header>

      <div class="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-3">
        <div
          v-for="item in fields"
          :key="item.label"
          class="flex items-start justify-between gap-3 border border-slate-100 rounded-2xl bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50"
        >
          <div class="min-w-0 flex-1">
            <div class="mb-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">{{ item.label }}</div>
            <div class="break-all text-xs text-slate-700 font-mono font-bold dark:text-slate-200">{{ item.value }}</div>
          </div>
          <button
            class="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-sky-500 dark:hover:bg-slate-800"
            @click="copyText(item.value)"
          >
            <Copy :size="14" />
          </button>
        </div>
      </div>

      <footer class="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
        <button
          class="rounded-2xl bg-slate-100 px-5 py-2.5 text-[10px] text-slate-600 font-black tracking-widest uppercase dark:bg-slate-800"
          @click="emit('close')"
        >
          关闭
        </button>
        <button
          class="flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-lg shadow-sky-500/20"
          @click="copyAll"
        >
          <Copy :size="14" />
          复制全部
        </button>
      </footer>
    </div>
  </div>
</template>

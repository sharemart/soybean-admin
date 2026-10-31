<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { NInput, NSelect, useMessage } from 'naive-ui';
import { Plus, RefreshCw, Video, X } from 'lucide-vue-next';
import { addCamera } from '@/service/api/camera/cameraApi';
import type { CameraAccessParam } from '@/service/api/camera/camera.d';
import CustomSelect from '@/components/selectOption/CustomSelect.vue';
import { useMaintainCompanySelector } from '@/components/selectOption/useMaintainCompanySelector';

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  success: [payload: { accessParam?: CameraAccessParam | null; syncError?: string }];
}>();

const message = useMessage();
const submitting = ref(false);
const { maintainCompanyOptions, loading: companyLoading, fetchMaintainCompanyList } = useMaintainCompanySelector();

const form = reactive({
  company_id: 0 as number,
  protocol: 'ys7' as string,
  name: '',
  device_serial: '',
  validate_code: ''
});

const protocolOptions = [
  { label: '萤石 YS7', value: 'ys7' },
  { label: '国标 GB28181', value: 'gb28181' }
];

watch(
  () => props.isOpen,
  open => {
    if (open) {
      form.company_id = 0;
      form.protocol = 'ys7';
      form.name = '';
      form.device_serial = '';
      form.validate_code = '';
      fetchMaintainCompanyList();
    }
  }
);

const handleSubmit = async () => {
  if (!form.name.trim()) {
    message.warning('请填写设备名称');
    return;
  }
  if (form.protocol === 'ys7') {
    if (!form.device_serial.trim()) {
      message.warning('萤石协议需填写序列号');
      return;
    }
    if (!form.validate_code.trim()) {
      message.warning('萤石协议需填写机身验证码');
      return;
    }
  }

  try {
    submitting.value = true;
    const payload: Record<string, any> = {
      protocol: form.protocol,
      name: form.name.trim()
    };
    if (form.company_id) payload.company_id = form.company_id;
    if (form.protocol === 'ys7') {
      payload.device_serial = form.device_serial.trim();
      payload.validate_code = form.validate_code.trim();
    }

    const res = await addCamera(payload as any);
    if (res?.data?.code === 2000) {
      const data = res.data.data;
      message.success(res.data.msg || res.data.message || '接入成功');
      emit('success', {
        accessParam: data?.access_param || null,
        syncError: data?.sync_error || ''
      });
      emit('close');
    } else {
      message.error(res?.data?.msg || res?.data?.message || '接入失败');
    }
  } catch (error) {
    message.error(`接入失败：${error}`);
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-md overflow-hidden border border-slate-200 rounded-[2rem] bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
    >
      <header class="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <div class="rounded-xl bg-sky-500/10 p-2 text-sky-500">
            <Video :size="18" />
          </div>
          <div>
            <h3 class="text-sm text-slate-800 font-black dark:text-slate-100">接入摄像头</h3>
            <p class="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Add Device</p>
          </div>
        </div>
        <button class="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" @click="emit('close')">
          <X :size="18" />
        </button>
      </header>

      <div class="px-6 py-5 space-y-4">
        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black tracking-widest uppercase">所属公司（可选）</label>
          <CustomSelect
            v-model="form.company_id"
            :options="[{ label: '默认登录公司', value: 0 }, ...maintainCompanyOptions]"
            :loading="companyLoading.maintainLoading"
            placeholder="默认登录公司"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black tracking-widest uppercase">协议</label>
          <NSelect v-model:value="form.protocol" :options="protocolOptions" />
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black tracking-widest uppercase">设备名称</label>
          <NInput v-model:value="form.name" placeholder="请输入名称" />
        </div>

        <template v-if="form.protocol === 'ys7'">
          <div class="space-y-1.5">
            <label class="text-[10px] text-slate-400 font-black tracking-widest uppercase">萤石序列号</label>
            <NInput v-model:value="form.device_serial" placeholder="设备机身序列号" />
          </div>
          <div class="space-y-1.5">
            <label class="text-[10px] text-slate-400 font-black tracking-widest uppercase">机身验证码</label>
            <NInput v-model:value="form.validate_code" placeholder="设备机身验证码" />
          </div>
        </template>

        <p v-else class="rounded-2xl bg-amber-500/10 px-4 py-3 text-[11px] text-amber-600 font-medium leading-relaxed">
          国标设备接入后将返回 SIP 参数，请在现场设备端完成注册配置。
        </p>
      </div>

      <footer class="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
        <button
          class="rounded-2xl bg-slate-100 px-5 py-2.5 text-[10px] text-slate-600 font-black tracking-widest uppercase dark:bg-slate-800"
          @click="emit('close')"
        >
          取消
        </button>
        <button
          class="flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-lg shadow-sky-500/20 disabled:opacity-60"
          :disabled="submitting"
          @click="handleSubmit"
        >
          <RefreshCw v-if="submitting" :size="14" class="animate-spin" />
          <Plus v-else :size="14" />
          接入
        </button>
      </footer>
    </div>
  </div>
</template>

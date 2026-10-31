<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { Link2, RefreshCw, X } from 'lucide-vue-next';
import { bindCamera } from '@/service/api/camera/cameraApi';
import type { CameraListItem } from '@/service/api/camera/camera.d';
import { getVillageList } from '@/service/api/community/community';
import { fetchElevatorList } from '@/service/api/component/component';
import CustomSelect from '@/components/selectOption/CustomSelect.vue';

interface Props {
  isOpen: boolean;
  camera: CameraListItem | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const message = useMessage();
const submitting = ref(false);
const villageLoading = ref(false);
const elevatorLoading = ref(false);

const form = reactive({
  village_id: 0 as number,
  elevator_id: 0 as number
});

const villageOptions = ref<Array<{ label: string; value: number }>>([{ label: '不解绑 / 未绑定', value: 0 }]);
const elevatorOptions = ref<Array<{ label: string; value: number }>>([{ label: '不解绑 / 未绑定', value: 0 }]);

const loadVillages = async (companyId?: number) => {
  try {
    villageLoading.value = true;
    const res = await getVillageList({
      company_id: companyId || undefined,
      page: 1,
      limit: 500
    });
    if (res?.data?.code === 2000) {
      const list = res.data.data?.list || [];
      villageOptions.value = [
        { label: '未绑定（解绑）', value: 0 },
        ...list.map(v => ({ label: v.village_name, value: v.village_id }))
      ];
    }
  } catch (error) {
    message.error(`加载小区失败：${error}`);
  } finally {
    villageLoading.value = false;
  }
};

const loadElevators = async (villageId?: number, companyId?: number) => {
  try {
    elevatorLoading.value = true;
    const res = await fetchElevatorList({
      village_id: villageId || undefined,
      company_id: companyId || undefined,
      page: 1,
      limit: 100
    });
    if (res?.data?.code === 2000) {
      const list = res.data.data?.list || [];
      elevatorOptions.value = [
        { label: '未绑定（解绑）', value: 0 },
        ...list.map(e => ({
          label: `${e.elevator_name || e.elevator_number} (${e.elevator_number})`,
          value: e.elevator_id
        }))
      ];
    }
  } catch (error) {
    message.error(`加载电梯失败：${error}`);
  } finally {
    elevatorLoading.value = false;
  }
};

const initializing = ref(false);

watch(
  () => props.isOpen,
  async open => {
    if (open && props.camera) {
      initializing.value = true;
      form.village_id = props.camera.village_id || 0;
      form.elevator_id = props.camera.elevator_id || 0;
      await loadVillages(props.camera.company_id);
      await loadElevators(form.village_id || undefined, props.camera.company_id);
      initializing.value = false;
    }
  }
);

watch(
  () => form.village_id,
  async vid => {
    if (!props.isOpen || !props.camera || initializing.value) return;
    form.elevator_id = 0;
    await loadElevators(vid || undefined, props.camera.company_id);
  }
);

const handleSubmit = async () => {
  if (!props.camera) return;
  try {
    submitting.value = true;
    const res = await bindCamera({
      id: props.camera.id,
      village_id: form.village_id,
      elevator_id: form.elevator_id
    });
    if (res?.data?.code === 2000) {
      message.success(res.data.msg || res.data.message || '保存成功');
      emit('success');
      emit('close');
    } else {
      message.error(res?.data?.msg || res?.data?.message || '保存失败');
    }
  } catch (error) {
    message.error(`保存失败：${error}`);
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
          <div class="rounded-xl bg-indigo-500/10 p-2 text-indigo-500">
            <Link2 :size="18" />
          </div>
          <div>
            <h3 class="text-sm text-slate-800 font-black dark:text-slate-100">绑定电梯 / 小区</h3>
            <p class="text-[10px] text-slate-400 font-bold">{{ camera?.name || '' }}</p>
          </div>
        </div>
        <button class="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" @click="emit('close')">
          <X :size="18" />
        </button>
      </header>

      <div class="px-6 py-5 space-y-4">
        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black tracking-widest uppercase">绑定小区</label>
          <CustomSelect
            v-model="form.village_id"
            :options="villageOptions"
            :loading="villageLoading"
            placeholder="选择小区"
          />
        </div>
        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black tracking-widest uppercase">绑定电梯</label>
          <CustomSelect
            v-model="form.elevator_id"
            :options="elevatorOptions"
            :loading="elevatorLoading"
            placeholder="选择电梯"
          />
        </div>
        <p class="text-[11px] text-slate-400 font-medium">选择「未绑定」并保存即可解绑对应关系。</p>
      </div>

      <footer class="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
        <button
          class="rounded-2xl bg-slate-100 px-5 py-2.5 text-[10px] text-slate-600 font-black tracking-widest uppercase dark:bg-slate-800"
          @click="emit('close')"
        >
          取消
        </button>
        <button
          class="flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-[10px] text-white font-black tracking-widest uppercase disabled:opacity-60"
          :disabled="submitting"
          @click="handleSubmit"
        >
          <RefreshCw v-if="submitting" :size="14" class="animate-spin" />
          保存
        </button>
      </footer>
    </div>
  </div>
</template>

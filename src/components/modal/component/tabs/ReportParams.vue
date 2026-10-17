<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NSelect } from 'naive-ui';
import { BellRing, Users } from 'lucide-vue-next';
import { getMaintainGroupDetail } from '@/service/api/company/company';
import type { MaintainGroupUser } from '@/service/api/company/company.d';

interface Props {
  formData: Record<string, any>;
  isBatchMode?: boolean;
}

const props = defineProps<Props>();

const levels = [2, 3, 4, 5];
const groupUsers = ref<MaintainGroupUser[]>([]);
const groupName = ref('');
const loading = ref(false);

const groupId = computed(() => {
  const id = Number(props.formData?.maintenance_group || props.formData?.group_id);
  return Number.isFinite(id) && id > 0 ? id : null;
});

const usersByLevel = (level: number) => groupUsers.value.filter(user => user.level === level);

const optionsFor = (level: number) => {
  return usersByLevel(level).map(user => ({
    label: user.realname,
    value: user.user_id
  }));
};

const personAt = (level: number, index: number) => usersByLevel(level)[index]?.user_id ?? null;

let requestSerial = 0;

watch(
  groupId,
  async id => {
    const serial = ++requestSerial;
    groupUsers.value = [];
    groupName.value = '';
    if (!id) return;

    loading.value = true;
    try {
      const res = await getMaintainGroupDetail({ group_id: id });
      if (serial !== requestSerial) return;
      if (res?.data?.code === 2000 && res.data.data) {
        groupUsers.value = res.data.data.users || [];
        groupName.value = res.data.data.group_name || '';
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (serial === requestSerial) loading.value = false;
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="animate-in fade-in duration-500 space-y-8">
    <div class="flex items-center justify-between gap-4 border border-indigo-500/10 rounded-[2rem] bg-indigo-500/5 p-6">
      <div class="flex items-center gap-4">
        <BellRing :size="24" class="text-indigo-500" />
        <div>
          <h4 class="text-xs text-indigo-600 font-black uppercase">突发告警多级联动矩阵</h4>
          <p class="text-[10px] text-slate-500 font-bold tracking-tight uppercase">推送人员来自当前电梯的维保小组</p>
        </div>
      </div>
      <div v-if="groupName" class="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
        <Users :size="14" class="text-indigo-400" />
        <span>{{ groupName }}</span>
      </div>
    </div>

    <div
      v-if="!groupId"
      class="border border-slate-200 rounded-[2rem] border-dashed bg-slate-50 px-6 py-10 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-950/40"
    >
      {{ isBatchMode ? '请先在维保参数中选择维保小组' : '该电梯尚未分配维保小组，请先在维保参数中选择' }}
    </div>

    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-3 md:grid-cols-2">
      <div
        v-for="lv in levels"
        :key="lv"
        class="border border-slate-100 rounded-[2rem] bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-950/40"
      >
        <div class="flex items-center justify-between">
          <span class="rounded-lg bg-slate-900 px-3 py-1 text-[9px] text-white font-black uppercase">
            {{ lv }}级应急推送
          </span>
          <div
            class="h-1.5 w-1.5 rounded-full"
            :class="usersByLevel(lv).length ? 'bg-emerald-500' : 'bg-slate-300'"
          ></div>
        </div>
        <div class="space-y-3">
          <NSelect
            :value="personAt(lv, 0)"
            :options="optionsFor(lv)"
            :loading="loading"
            disabled
            placeholder="未配置"
          />
          <NSelect
            :value="personAt(lv, 1)"
            :options="optionsFor(lv)"
            :loading="loading"
            disabled
            placeholder="未配置"
          />
        </div>
      </div>
    </div>
  </div>
</template>

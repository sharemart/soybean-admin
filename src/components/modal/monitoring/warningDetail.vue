<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import {
  Activity,
  ArrowUp,
  Brain,
  ChevronDown,
  ChevronUp,
  Database,
  Gauge,
  Info,
  Play,
  Ruler,
  Save,
  Settings,
  ShieldAlert,
  X
} from 'lucide-vue-next';
import {
  fetchAlgorithmResult,
  fetchFaultTemplateCauses,
  fetchFaultTemplateComponents,
  fetchSubmitFaultTemplate,
  fetchWarningAnalyze,
  fetchWarningCalculate,
  fetchWarningCalculateAccel,
  fetchWarningSoundList
} from '@/service/api/Warning/warning';
import type {
  AlgorithmResultData,
  FaultTemplateCauseItem,
  FaultTemplateComponentItem
} from '@/service/api/Warning/warning.d';
import WarningWaveChart from '@/components/composables/useWarningChart.vue';

const props = defineProps<{
  show: boolean;
  elevatorId?: string | number;
  warningData?: any;
}>();

const emit = defineEmits<{
  'update:show': [val: boolean];
}>();

// 诊断结果数据
const diagnosisData = ref<AlgorithmResultData | null>(null);
const diagnosisLoading = ref(false);

const analyzeResult = ref<any[]>([]);
const componentList = ref<FaultTemplateComponentItem[]>([]);
const selectedComponentId = ref<number | string>('');
const causeList = ref<FaultTemplateCauseItem[]>([]);
const selectedCauseId = ref<number | string>('');
const directionCode = ref('水平(平行轿门)');
const noteText = ref('');
const submitLoading = ref(false);
const expandedId = ref<string | null>(null);
const isManual = ref(false);
const soundList = ref<any[]>([]);
const loading = ref(false);
const currentRecord = ref<any>(null);
const waveData = ref<any[]>([]);
const isSpeedChart = ref(false);

const ElMessage = useMessage();

const pauseAllAudio = () => {
  document.querySelectorAll('audio').forEach(a => {
    try {
      a.pause();
    } catch (e) {
      console.error('暂停音频失败', e);
    }
  });
};

const closeModal = () => {
  pauseAllAudio();
  emit('update:show', false);
  expandedId.value = null;
  isManual.value = false;
  selectedComponentId.value = '';
  selectedCauseId.value = '';
  noteText.value = '';
  diagnosisData.value = null;
};

const playAudio = (sUrl: string) => {
  pauseAllAudio();
  const audio = document.querySelector(`audio[src="${sUrl}"]`) as HTMLAudioElement;
  if (audio) audio.play().catch(() => {});
};

const getSoundList = async () => {
  const sn = props.warningData?.sn;
  const trouble_code = props.warningData?.trouble_code;
  if (!sn || !trouble_code) return;
  loading.value = true;
  try {
    const res = await fetchWarningSoundList({ sn, trouble_code, days: 14 });
    if (res.data?.code === 2000) {
      soundList.value = res.data.data.sounds_list || [];
    }
  } catch (err) {
    console.error('获取声音记录失败：', err);
  } finally {
    loading.value = false;
  }
};

const loadAnalyzeData = async (record: any) => {
  try {
    const res = await fetchWarningAnalyze({
      url: record.a_url,
      elevator_id: Number(props.elevatorId)
    });
    analyzeResult.value = res.data?.code === 2000 && res.data.data?.candidates ? res.data.data.candidates : [];
  } catch (err) {
    console.error('分析失败', err);
    analyzeResult.value = [];
  }
};

/**
 * 获取AI算法诊断结果
 */
const loadAlgorithmResult = async (taskId: string) => {
  if (!taskId) {
    diagnosisData.value = null;
    return;
  }
  diagnosisLoading.value = true;
  try {
    const res = await fetchAlgorithmResult({ task_id: taskId, simple: 1 });
    console.log('AI算法诊断结果:', res.data);
    const responseData = res?.data?.data;

    if (responseData) {
      diagnosisData.value = {
        task_id: responseData.task_id,
        status: responseData.status,
        message: responseData.message,
        result: responseData
      };
    } else {
      diagnosisData.value = null;
      console.warn('⚠️ 获取诊断结果失败: 数据为空');
    }
  } catch (err) {
    console.error('❌ 获取诊断结果异常:', err);
    diagnosisData.value = null;
  } finally {
    diagnosisLoading.value = false;
  }
};

const loadFaultTemplateCauses = async (cid: number | string) => {
  if (!cid) {
    causeList.value = [];
    selectedCauseId.value = '';
    return;
  }
  try {
    const res = await fetchFaultTemplateCauses({ component_id: Number(cid) });
    if (res.data?.code === 2000) {
      causeList.value = res.data.data || [];
      selectedCauseId.value = causeList.value[0]?.id || '';
    }
  } catch (err) {
    console.error(err);
  }
};

const loadFaultTemplateComponents = async () => {
  try {
    const res = await fetchFaultTemplateComponents();
    if (res.data?.code === 2000) {
      componentList.value = res.data.data || [];
      if (componentList.value.length) {
        selectedComponentId.value = componentList.value[0].id;
        await loadFaultTemplateCauses(selectedComponentId.value);
      }
    }
  } catch (err) {
    console.error(err);
  }
};

watch(selectedComponentId, async cid => {
  causeList.value = [];
  selectedCauseId.value = '';
  if (cid) await loadFaultTemplateCauses(cid);
});

const handleSubmit = async () => {
  if (!selectedComponentId.value) return ElMessage.warning('请选择部件');
  if (!selectedCauseId.value) return ElMessage.warning('请选择成因');
  if (!noteText.value) return ElMessage.warning('请填写说明');

  submitLoading.value = true;
  try {
    const params = {
      elevator_id: props.elevatorId,
      component_id: selectedComponentId.value,
      cause_id: selectedCauseId.value,
      direction_code: directionCode.value,
      note: noteText.value,
      s_url: currentRecord.value?.s_url || '',
      save_template: 0,
      update_template: 0
    };
    const res = await fetchSubmitFaultTemplate(params);
    if (res.data?.code === 2000) {
      ElMessage.success('提交成功');
      isManual.value = false;
      noteText.value = '';
    } else {
      ElMessage.error(res.data?.message || '失败');
    }
  } catch (err) {
    ElMessage.error(`异常${err}`);
  } finally {
    submitLoading.value = false;
  }
};

const handleClickRecord = async (record: any) => {
  const id = String(record.id);
  if (expandedId.value === id) {
    pauseAllAudio();
    expandedId.value = null;
    analyzeResult.value = [];
    waveData.value = [];
    diagnosisData.value = null;
    return;
  }
  pauseAllAudio();
  expandedId.value = id;
  currentRecord.value = record;
  analyzeResult.value = [];
  waveData.value = [];
  diagnosisData.value = null;

  try {
    const troubleCode = props.warningData?.trouble_code;
    isSpeedChart.value = ['vavls', 'vaves'].includes(troubleCode);

    const res = isSpeedChart.value
      ? await fetchWarningCalculate({ fileUrl: record.a_url })
      : await fetchWarningCalculateAccel({ fileUrl: record.a_url });

    if (res.data?.code === 2000 && res.data.data) {
      waveData.value = res.data.data;
    }
  } catch (e) {
    console.error(e);
  }

  // 并行请求：故障模板匹配 + AI算法诊断结果
  await loadAnalyzeData(record);
  await loadAlgorithmResult(record.algo_remote_task_id || '');

  loadFaultTemplateComponents();
};

watch(
  () => props.show,
  async val => {
    if (val && props.warningData) {
      soundList.value = [];
      await getSoundList();
    }
  },
  { immediate: true }
);

onUnmounted(() => {});
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[20100] flex items-center justify-center p-4">
      <div class="animate-in fade-in absolute inset-0 bg-slate-950/80 backdrop-blur-md" @click.self="closeModal" />

      <div
        class="animate-in zoom-in-95 relative h-[90vh] max-w-5xl w-full flex flex-col overflow-hidden border border-white/10 rounded-[2.5rem] bg-white shadow-2xl dark:bg-slate-900"
      >
        <div
          class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/30"
        >
          <div class="flex items-center gap-4">
            <div class="rounded-2xl bg-amber-500/10 p-3 text-amber-500 shadow-inner">
              <ShieldAlert :size="24" />
            </div>
            <div>
              <h3 class="text-xl font-black tracking-tight">{{ warningData?.trouble_name }} - 异常波形分析记录</h3>
              <p class="mt-1 text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
                Diagnostic Waveform Analysis Terminal
              </p>
            </div>
          </div>
          <button
            class="rounded-full p-3 transition-all hover:bg-slate-200 dark:hover:bg-slate-800"
            @click="closeModal"
          >
            <X :size="24" />
          </button>
        </div>

        <div class="custom-scrollbar flex-1 overflow-y-auto p-6">
          <div class="space-y-4">
            <div
              v-for="record in soundList"
              :key="record.id"
              class="border rounded-3xl transition-all"
              :class="
                expandedId === String(record.id)
                  ? 'bg-slate-50 dark:bg-slate-950/40 border-sky-500/30'
                  : 'bg-white dark:bg-slate-900 border-slate-100'
              "
            >
              <div
                class="group flex cursor-pointer items-center justify-between p-5"
                @click="handleClickRecord(record)"
              >
                <div class="flex items-center gap-8">
                  <div class="text-left">
                    <p class="mb-0.5 text-[10px] text-slate-400 font-black uppercase">记录时间</p>
                    <p class="text-sm font-bold font-mono">{{ record.name_date }} {{ record.name_time }}</p>
                  </div>
                  <div class="flex gap-2">
                    <span
                      class="rounded-lg bg-sky-100 px-3 py-1 text-[10px] text-sky-600 font-black uppercase dark:bg-sky-900/30"
                    >
                      {{ record.name_buliding }}
                    </span>
                    <span
                      class="rounded-lg bg-violet-100 px-3 py-1 text-[10px] text-violet-600 font-black uppercase dark:bg-violet-900/30"
                    >
                      {{ record.floor }}
                    </span>
                  </div>
                </div>
                <ChevronUp v-if="expandedId === String(record.id)" class="text-slate-400" />
                <ChevronDown v-else class="text-slate-400" />
              </div>

              <div v-if="expandedId === String(record.id)" class="animate-in slide-in-from-top-4 px-6 pb-6 space-y-6">
                <!-- 波形图表 -->
                <div
                  class="h-64 w-full border border-slate-100 rounded-2xl bg-white p-4 shadow-inner dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <WarningWaveChart :data="waveData" :is-speed="isSpeedChart" height="100%" />
                </div>

                <!-- 音频播放 -->
                <div class="flex items-center gap-4 border border-white/5 rounded-2xl bg-slate-900 p-4">
                  <button
                    class="h-10 w-10 flex items-center justify-center rounded-full bg-sky-500 text-white shadow-lg"
                    @click="playAudio(record.s_url)"
                  >
                    <Play :size="18" fill="currentColor" />
                  </button>
                  <audio class="flex-1" controls :src="record.s_url"></audio>
                </div>

                <div class="border-t border-slate-200 pt-6 dark:border-slate-800">
                  <div v-if="isManual" class="animate-in fade-in space-y-4">
                    <h4 class="flex items-center gap-2 text-xs text-slate-400 font-black uppercase">
                      <Settings :size="14" class="text-sky-500" />
                      人工标注诊断报告
                    </h4>
                    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div class="space-y-1.5">
                        <label class="ml-1 text-[10px] text-slate-500 font-black uppercase">受损部件</label>
                        <select
                          v-model="selectedComponentId"
                          class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                        >
                          <option v-for="item in componentList" :key="item.id" :value="item.id">{{ item.name }}</option>
                        </select>
                      </div>
                      <div class="space-y-1.5">
                        <label class="ml-1 text-[10px] text-slate-500 font-black uppercase">故障成因</label>
                        <select
                          v-model="selectedCauseId"
                          :disabled="!causeList.length"
                          class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800"
                        >
                          <option v-for="item in causeList" :key="item.id" :value="item.id">{{ item.title }}</option>
                        </select>
                      </div>
                      <div class="space-y-1.5">
                        <label class="ml-1 text-[10px] text-slate-500 font-black uppercase">振动方向</label>
                        <select
                          v-model="directionCode"
                          class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                        >
                          <option>水平(平行轿门)</option>
                          <option>水平(垂直轿门)</option>
                          <option>垂直</option>
                        </select>
                      </div>
                    </div>
                    <div class="space-y-1.5">
                      <label class="ml-1 text-[10px] text-slate-500 font-black uppercase">分析说明</label>
                      <textarea
                        v-model="noteText"
                        class="min-h-[100px] w-full border border-slate-200 rounded-2xl px-4 py-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                        placeholder="输入检修发现..."
                      ></textarea>
                    </div>
                    <div class="flex justify-end gap-3 border border-sky-500/10 rounded-2xl bg-sky-500/5 p-4">
                      <button
                        class="border border-slate-200 rounded-xl bg-white px-6 py-2 text-[10px] font-black uppercase"
                        @click="isManual = false"
                      >
                        放弃
                      </button>
                      <button
                        class="flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-2 text-[10px] text-white font-black uppercase"
                        :loading="submitLoading"
                        @click="handleSubmit"
                      >
                        <Save :size="14" />
                        提交分析
                      </button>
                    </div>
                  </div>

                  <div v-else class="animate-in fade-in space-y-4">
                    <div class="flex justify-between">
                      <h4 class="flex items-center gap-2 text-xs text-slate-400 font-black uppercase">
                        <Database :size="14" class="text-sky-500" />
                        AI 故障模板匹配结果
                      </h4>
                      <button class="text-[10px] text-sky-500 font-black uppercase" @click="isManual = true">
                        未命中模板？人工介入
                      </button>
                    </div>
                    <div
                      v-for="(item, index) in analyzeResult"
                      :key="item.template_id || index"
                      class="border border-slate-100 rounded-2xl bg-white p-4 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div class="mb-3">
                        <p class="text-sm font-bold">{{ item.cause_title || item.template_name }}</p>
                        <p class="text-[9px] text-slate-400">
                          部件：{{ item.component_name }} &nbsp;&nbsp;|&nbsp;&nbsp; 置信度：{{
                            (item.similarity * 100).toFixed(0)
                          }}%
                        </p>
                      </div>
                      <div class="border border-slate-100 rounded-xl bg-slate-50 p-3 dark:border-slate-800">
                        <p class="text-[10px] text-slate-500 italic">
                          <Info :size="10" class="inline" />
                          维保建议：{{ item.suggestion || '暂无维保建议' }}
                        </p>
                      </div>
                    </div>
                    <div v-if="analyzeResult.length === 0" class="py-6 text-center text-sm text-slate-400">
                      AI 未匹配到故障模板
                    </div>

                    <!-- AI 算法诊断结果卡片 - 4个版块 -->
                    <div
                      v-if="diagnosisData && diagnosisData.result"
                      class="mt-4 border border-slate-200 rounded-2xl from-slate-50/80 to-white bg-gradient-to-br p-5 dark:border-slate-700 dark:from-slate-800/60 dark:to-slate-900/40"
                    >
                      <div class="mb-4 flex items-center gap-2">
                        <Activity :size="16" class="text-emerald-500" />
                        <h4 class="text-xs text-slate-400 font-black tracking-wider uppercase">AI 算法诊断结果</h4>
                      </div>

                      <!-- 4个版块：2x2 网格布局 -->
                      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <!-- 版块1: 最终诊断结果 -->
                        <div
                          class="border border-slate-200/80 rounded-xl bg-white/60 p-4 dark:border-slate-700/60 dark:bg-slate-800/30"
                        >
                          <p class="flex items-center gap-1 text-[10px] text-slate-400 font-black uppercase">
                            <ShieldAlert :size="12" class="text-rose-500" />
                            最终诊断结果
                          </p>
                          <p class="mt-1 text-lg text-rose-600 font-bold dark:text-rose-400">
                            {{ diagnosisData.result?.fault_name || '-' }}
                          </p>
                          <p class="mt-0.5 text-[10px] text-slate-400">
                            模型原始结果：{{
                              diagnosisData.result?.neural_network?.fault_name ||
                              diagnosisData.result?.fault_name ||
                              '-'
                            }}
                          </p>
                        </div>

                        <!-- 版块2: 可靠度评分 -->
                        <!--
 <div
                          class="border border-slate-200/80 rounded-xl bg-white/60 p-4 dark:border-slate-700/60 dark:bg-slate-800/30"
                        >
                          <div class="flex items-center justify-between">
                            <p class="flex items-center gap-1 text-[10px] text-slate-400 font-black uppercase">
                              <Gauge :size="12" class="text-blue-500" />
                              可靠度评分
                            </p>
                            <span class="text-[9px] text-slate-400">距离可靠度，仅作辅助参考</span>
                          </div>
                          <div class="mt-1 flex items-center gap-3">
                            <span class="text-2xl text-blue-600 font-black dark:text-blue-400">
                              {{ diagnosisData.result?.confidence ?? 0 }}%
                            </span>
                            <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                              <div
                                class="h-full rounded-full bg-blue-500 transition-all"
                                :style="{ width: (diagnosisData.result?.confidence ?? 0) + '%' }"
                              ></div>
                            </div>
                          </div>
                        </div> 
-->

                        <!-- 版块3: 距离判别 -->
                        <div
                          class="border border-slate-200/80 rounded-xl bg-white/60 p-4 dark:border-slate-700/60 dark:bg-slate-800/30"
                        >
                          <p class="flex items-center gap-1 text-xs text-slate-400 font-black uppercase">
                            <Ruler :size="14" class="text-purple-500" />
                            距离判别
                          </p>
                          <div class="grid grid-cols-3 mt-2 gap-3">
                            <div>
                              <p class="text-[10px] text-slate-400 font-medium">正常</p>
                              <p class="text-base text-emerald-600 font-bold dark:text-emerald-400">
                                d₁={{ (diagnosisData.result?.distance_normal ?? 0).toFixed(2) }}
                              </p>
                            </div>
                            <div>
                              <p class="text-[10px] text-slate-400 font-medium">轨靴磨损</p>
                              <p class="text-base text-amber-600 font-bold dark:text-amber-400">
                                d₂={{ (diagnosisData.result?.distance_shoe ?? 0).toFixed(2) }}
                              </p>
                            </div>
                            <div>
                              <p class="text-[10px] text-slate-400 font-medium">张力不均</p>
                              <p class="text-base text-rose-600 font-bold dark:text-rose-400">
                                d₃={{ (diagnosisData.result?.distance_tension ?? 0).toFixed(2) }}
                              </p>
                            </div>
                          </div>
                          <p class="mt-2 text-[10px] text-slate-400">正常不修正；故障距离按系数修正后取最小</p>
                        </div>
                      </div>
                    </div>

                    <!-- 加载中状态 -->
                    <div v-else-if="diagnosisLoading" class="mt-4 flex items-center justify-center py-8">
                      <div class="flex items-center gap-3 text-slate-400">
                        <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                          <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                            fill="none"
                          />
                          <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span class="text-sm font-medium">AI 诊断结果加载中...</span>
                      </div>
                    </div>

                    <!-- 无诊断结果 -->
                    <div
                      v-else-if="!diagnosisData && !diagnosisLoading"
                      class="mt-4 border border-slate-200 rounded-2xl bg-slate-50/50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/20"
                    >
                      <Activity :size="24" class="mx-auto mb-2 text-slate-300" />
                      <p class="text-sm text-slate-400">暂无 AI 算法诊断结果</p>
                      <p class="mt-0.5 text-[10px] text-slate-400">请确认该记录已通过算法分析</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="soundList.length === 0 && !loading" class="py-10 text-center">
              <Database class="mx-auto mb-3 text-slate-300" :size="36" />
              <p class="text-lg text-slate-400 font-medium">暂无声音记录</p>
            </div>
          </div>
        </div>

        <div class="flex justify-end border-t border-slate-100 bg-slate-50/30 p-6 dark:border-slate-800">
          <button
            class="rounded-2xl bg-slate-900 px-10 py-3 text-xs text-white font-black uppercase"
            @click="closeModal"
          >
            确认无误
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.custom-scrollbar {
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
}
</style>

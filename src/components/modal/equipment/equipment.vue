<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { NInput, NSelect, useMessage } from 'naive-ui';
import { Activity, Cpu, Info, Layers, RefreshCw, Save, Settings, ShieldCheck, Timer, X } from 'lucide-vue-next';
import * as echarts from 'echarts';
import { createElevatorPart, fetchElevatorPartOptions, updateElevatorPart } from '@/service/api/equipment/equipment';

// 定义Props类型
interface PartEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  initialData?: any | null;
}

// 定义接口返回的选项类型
interface OptionItem {
  value: number | string;
  label: string;
}

interface PartOptions {
  part_place_options: OptionItem[];
  part_code_options: OptionItem[];
  part_lift_type_options: OptionItem[];
}

// 新增/编辑接口参数类型
interface CreatePartParams {
  part_name: string;
  part_place: number;
  part_lift_type: number;
  part_lift: string;
  part_type: number;
  useTime: number;
}
interface UpdatePartParams extends CreatePartParams {
  id: number;
}

// 接收Props
const props = defineProps<PartEditModalProps>();

// 修复：统一数据类型，part_type 改为 number | null（和part_place保持一致）
const formData = reactive({
  part_name: '',
  part_place: null as number | null,
  part_lift_type: null as number | null,
  part_lift: '',
  useTime: 5,
  part_type: null as number | null // 关键修复1：从字符串改为number | null
});

const isSubmitting = ref(false);
const showEchartPreview = ref(false);
const echartRef = ref<HTMLDivElement | null>(null);
let echartInstance: echarts.ECharts | null = null;
const message = useMessage();

// 下拉选项数据
const partOptions = ref<PartOptions>({
  part_place_options: [],
  part_code_options: [],
  part_lift_type_options: []
});
const loadingOptions = ref(false);

// ========== 工具函数：安全转换数字（关键修复2） ==========
const safeToNumber = (value: any, fallback = 0): number => {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

// ========== 获取下拉选项数据 ==========
const getPartOptions = async () => {
  try {
    loadingOptions.value = true;
    const response = await fetchElevatorPartOptions();

    if (response?.data?.code === 2000) {
      partOptions.value = {
        part_place_options: response.data.data.part_place_options || [],
        part_code_options: response.data.data.part_code_options || [],
        part_lift_type_options: response.data.data.part_lift_type_options || []
      };

      // 新增模式默认选中第一个计算维度
      if (!props.initialData && partOptions.value.part_lift_type_options.length > 0) {
        formData.part_lift_type = safeToNumber(partOptions.value.part_lift_type_options[0].value);
      }
    }
  } catch (error) {
    console.error('获取部件选项失败:', error);
    message.error('获取选项数据失败，请重试');
    partOptions.value = {
      part_place_options: [{ value: 0, label: '获取选项失败' }], // 修复：value改为数字0
      part_code_options: [{ value: 0, label: '获取选项失败' }],
      part_lift_type_options: [{ value: 0, label: '获取选项失败' }]
    };
  } finally {
    loadingOptions.value = false;
  }
};

// ========== ECharts 相关函数 ==========
const destroyEchart = () => {
  if (echartInstance) {
    echartInstance.dispose();
    echartInstance = null;
  }
  window.removeEventListener('resize', resizeEchart);
};

const resizeEchart = () => {
  echartInstance?.resize();
};

const initEchart = () => {
  if (!echartRef.value || !props.isOpen) return;
  destroyEchart();

  echartInstance = echarts.init(echartRef.value);
  const option = {
    title: {
      text: '部件寿命趋势预测',
      textStyle: { fontSize: 12, color: '#64748b' }
    },
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['1年', '2年', '3年', '4年', '5年'] },
    yAxis: { type: 'value', name: '剩余寿命(%)' },
    series: [
      {
        name: '剩余寿命',
        type: 'line',
        data: [100, 80, 60, 30, 0],
        smooth: true,
        itemStyle: { color: '#0ea5e9' }
      }
    ]
  };
  echartInstance.setOption(option);
  window.addEventListener('resize', resizeEchart);
};

// ========== 监听与初始化 ==========
onMounted(() => {
  getPartOptions();
});

watch(
  [() => props.isOpen, () => props.initialData],
  ([newOpen, newInitialData]) => {
    if (newOpen) {
      if (partOptions.value.part_place_options.length === 0) {
        getPartOptions();
      }

      // 初始化表单（关键修复3：使用正确的字段名 + 安全类型转换）
      if (newInitialData) {
        formData.part_name = newInitialData.part_name || '';
        // 父组件传递的是 part_place_id/part_type_id，不是 part_place/part_type
        formData.part_place = safeToNumber(newInitialData.part_place_id || newInitialData.part_place, null);
        formData.part_lift_type = safeToNumber(newInitialData.part_lift_type_id || newInitialData.part_lift_type, null);
        formData.part_lift = newInitialData.part_lift || '';
        formData.useTime = safeToNumber(newInitialData.useTime, 5);
        formData.part_type = safeToNumber(newInitialData.part_type_id || newInitialData.part_type, null);
      } else {
        // 重置表单
        formData.part_name = '';
        formData.part_place = null;
        formData.part_lift_type =
          partOptions.value.part_lift_type_options.length > 0
            ? safeToNumber(partOptions.value.part_lift_type_options[0].value)
            : null;
        formData.part_lift = '';
        formData.useTime = 5;
        formData.part_type = null;
      }
      initEchart();
    } else {
      destroyEchart();
    }
  },
  { immediate: true }
);

// ========== 事件处理 ==========
const handleClose = () => {
  props.onClose();
};

// 表单校验（增强：更严格的类型校验）
const validateForm = (): boolean => {
  if (!formData.part_name.trim()) {
    message.error('请输入部件名称');
    return false;
  }
  if (formData.part_place === null || isNaN(formData.part_place)) {
    // 修复：校验null/NaN
    message.error('请选择部件位置');
    return false;
  }
  if (formData.part_type === null || isNaN(formData.part_type)) {
    // 修复：校验null/NaN
    message.error('请选择部件编码');
    return false;
  }
  if (formData.part_lift_type === null || isNaN(formData.part_lift_type)) {
    message.error('请选择寿命计算方式');
    return false;
  }
  if (!formData.part_lift.trim()) {
    message.error('请输入寿命参值');
    return false;
  }
  if (formData.part_lift_type === 1 && !formData.part_lift.includes('|')) {
    message.error('时间类型的寿命参值格式错误，需使用|分隔（如：2|8|50000）');
    return false;
  }
  if (formData.useTime <= 0) {
    message.error('请输入有效的使用寿命（大于0的数字）');
    return false;
  }
  return true;
};

// 提交表单（关键修复4：使用安全转换，避免NaN）
const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    isSubmitting.value = true;

    // 最终提交数据：确保所有数字字段都是有效数字
    const baseData = {
      part_name: formData.part_name.trim(),
      part_place: safeToNumber(formData.part_place), // 兜底转换
      part_lift_type: safeToNumber(formData.part_lift_type),
      part_lift: formData.part_lift.trim(),
      part_type: safeToNumber(formData.part_type), // 兜底转换
      useTime: safeToNumber(formData.useTime, 5)
    };

    let response;
    // 编辑模式
    if (props.initialData) {
      const updateData: UpdatePartParams = {
        id: safeToNumber(props.initialData.original_id || props.initialData.id),
        ...baseData
      };
      response = await updateElevatorPart(updateData);

      if (response?.data?.code === 2000) {
        message.success('部件修改成功');
      }
    }
    // 新增模式
    else {
      const createData: CreatePartParams = baseData;
      response = await createElevatorPart(createData);

      if (response?.data?.code === 2000) {
        message.success('部件新增成功');
      }
    }

    props.onConfirm(baseData);
    handleClose();
  } catch (error) {
    console.error('提交失败:', error);
    message.error('操作失败，请重试');
  } finally {
    isSubmitting.value = false;
  }
};

onUnmounted(() => {
  destroyEchart();
});
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[1500] flex items-center justify-center p-4">
      <div
        class="animate-in fade-in absolute inset-0 bg-slate-950/80 backdrop-blur-md duration-300"
        @click="handleClose"
      ></div>

      <div
        class="animate-in zoom-in-95 relative max-w-2xl w-full flex flex-col overflow-hidden border border-white/10 rounded-[3rem] bg-white font-sans shadow-2xl duration-500 dark:bg-slate-900"
      >
        <!-- 头部 -->
        <div
          class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/30"
        >
          <div class="flex items-center gap-4">
            <div class="rounded-2xl bg-sky-500 p-3 text-white shadow-lg">
              <Cpu :size="24" />
            </div>
            <div>
              <h3 class="text-xl font-black tracking-tight">
                {{ initialData ? '部件档案修正' : '新增部件数字化建档' }}
              </h3>
              <p class="mt-1 text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
                Elevator Components Archive
              </p>
            </div>
          </div>
          <button
            class="rounded-full p-2 transition-all hover:bg-slate-200 dark:hover:bg-slate-800"
            @click="handleClose"
          >
            <X :size="24" />
          </button>
        </div>

        <!-- 主体内容 -->
        <div class="custom-scrollbar flex-1 overflow-y-auto p-10">
          <form @submit.prevent="handleSubmit">
            <div class="space-y-8">
              <!-- 基础信息 -->
              <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                <!-- 部件名称 -->
                <div class="text-left space-y-1.5">
                  <label
                    class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                  >
                    <span class="text-rose-500">*</span>
                    <Cpu :size="10" class="text-slate-300" />
                    部件名称
                  </label>
                  <NInput v-model:value="formData.part_name" placeholder="如：曳引钢丝绳" required class="edit-input" />
                </div>

                <!-- 部件位置 -->
                <div class="text-left space-y-1.5">
                  <label
                    class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                  >
                    <span class="text-rose-500">*</span>
                    <Layers :size="10" class="text-slate-300" />
                    部件位置
                  </label>
                  <NSelect
                    v-model:value="formData.part_place"
                    :options="partOptions.part_place_options"
                    :loading="loadingOptions"
                    placeholder="请选择部件位置"
                    required
                    class="edit-input"
                  />
                </div>
              </div>

              <!-- 类别与寿命 -->
              <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div class="text-left space-y-1.5">
                  <label
                    class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                  >
                    <span class="text-rose-500">*</span>
                    <ShieldCheck :size="10" class="text-slate-300" />
                    部件类别/编码
                  </label>
                  <NSelect
                    v-model:value="formData.part_type"
                    :options="partOptions.part_code_options"
                    :loading="loadingOptions"
                    placeholder="请选择部件编码"
                    required
                    class="edit-input"
                  />
                </div>

                <!-- 使用寿命 -->
                <div class="text-left space-y-1.5">
                  <label
                    class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                  >
                    <span class="text-rose-500">*</span>
                    <Activity :size="10" class="text-slate-300" />
                    使用寿命 (年)
                  </label>
                  <NInputNumber
                    v-model:value="formData.useTime"
                    placeholder="请输入使用寿命"
                    :min="1"
                    class="edit-input"
                  />
                </div>
              </div>

              <!-- 寿命计算配置 -->
              <div
                class="border border-slate-100 rounded-[2rem] bg-slate-50 p-6 space-y-6 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div class="flex items-center justify-between">
                  <h4 class="text-[10px] text-sky-500 font-black tracking-widest uppercase">寿命计算逻辑配置</h4>
                  <Timer :size="16" class="text-sky-500" />
                </div>

                <div class="space-y-6">
                  <!-- 计算维度 -->
                  <div class="text-left space-y-1.5">
                    <label
                      class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                    >
                      <span class="text-rose-500">*</span>
                      <Settings :size="10" class="text-slate-300" />
                      计算维度
                    </label>
                    <div class="flex gap-2">
                      <button
                        v-for="item in partOptions.part_lift_type_options"
                        :key="item.value"
                        type="button"
                        class="flex-1 rounded-xl py-2.5 text-[10px] font-black tracking-widest uppercase transition-all"
                        :class="[
                          formData.part_lift_type === safeToNumber(item.value)
                            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400'
                        ]"
                        :disabled="loadingOptions"
                        @click="formData.part_lift_type = safeToNumber(item.value)"
                      >
                        {{ item.label }}
                      </button>
                    </div>
                  </div>

                  <!-- 规则参值 -->
                  <div class="text-left space-y-1.5">
                    <label
                      class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                    >
                      <span class="text-rose-500">*</span>
                      <Info :size="10" class="text-slate-300" />
                      规则参值设定
                    </label>
                    <NInput
                      v-model:value="formData.part_lift"
                      :placeholder="formData.part_lift_type === 1 ? '格式: 闲置|运行|临界' : '输入单位(米/次)'"
                      required
                      class="edit-input font-mono"
                    />
                    <div class="mt-2 flex gap-2">
                      <Info :size="12" class="mt-0.5 shrink-0 text-sky-500" />
                      <p class="text-[9px] text-slate-400 font-medium leading-relaxed uppercase italic">
                        {{
                          formData.part_lift_type === 1
                            ? '规则：闲置时间 | 运行时间 | 运行时长临界值 (单位：小时) 示例: 2|8|50000'
                            : formData.part_lift_type === 2
                              ? '规则：输入允许运行的最大累计距离 (单位：米) 示例: 50000'
                              : '规则：输入允许运行的最大累计次数 (单位：次) 示例: 100000'
                        }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ECharts 预览 -->
              <div v-if="showEchartPreview" class="h-60 w-full">
                <div ref="echartRef" class="h-full w-full"></div>
              </div>
            </div>
          </form>
        </div>

        <!-- 底部操作栏 -->
        <div
          class="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/30"
        >
          <span class="text-[9px] text-slate-400 font-black tracking-[0.3em] uppercase">Audit Trace: ERP-PART-LOG</span>
          <div class="flex gap-4">
            <button
              class="rounded-2xl bg-slate-100 px-10 py-3.5 text-[11px] text-slate-500 font-black tracking-widest uppercase transition-all dark:bg-slate-800 hover:bg-slate-200"
              @click="handleClose"
            >
              取消退出
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || loadingOptions"
              class="flex items-center gap-2 rounded-2xl bg-sky-500 px-12 py-3.5 text-[11px] text-white font-black tracking-widest uppercase shadow-sky-500/20 shadow-xl transition-all active:scale-95 hover:bg-sky-600 disabled:opacity-50"
              @click="handleSubmit"
            >
              <RefreshCw v-if="isSubmitting || loadingOptions" class="animate-spin" :size="16" />
              <Save v-else :size="16" />
              {{ initialData ? '保存修改' : '新增部件' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.edit-input {
  width: 100%;
  background: rgba(248, 250, 252, 0.6);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 1.25rem;
  padding: 0.875rem 1.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  transition: all 0.3s;
}

.dark .edit-input {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(30, 41, 59, 0.8);
  color: white;
}

.edit-input:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
  background: white;
}

.dark .edit-input:focus {
  background: #0f172a;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: #1e293b;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #475569;
}
</style>

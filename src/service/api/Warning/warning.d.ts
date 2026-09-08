import type { ApiResponse } from '@/service/api/types/common';

// ====================== 预警类型列表 ======================
export interface WarningTypeListParams {
  elevator_id?: number;
  page?: number;
  limit?: number;
}
export type WarningTypeListResponse = ApiResponse<any>;

// ====================== 预警异常记录 ======================
/**
 * 预警异常记录列表 - 请求参数
 */
export interface WarningSoundListParams {
  /** 预警编码 */
  trouble_code?: string;
  /** 电梯ID（与sn二选一） */
  elevator_id?: number;
  /** 注册码（与elevator_id二选一） */
  sn?: string;
  /** 统计天数，默认14 */
  days?: number;
}

/**
 * 预警异常记录项（通用结构，可根据实际返回扩展）
 */
export interface WarningSoundItem {
  id?: number;
  trouble_code?: string;
  elevator_id?: number;
  sn?: string;
  content?: string;
  create_time?: string;
  status?: number;
}

export interface WarningSoundPageData {
  list: WarningSoundItem[];
  total?: number;
  page?: number;
  limit?: number;
}
export type WarningSoundListResponse = ApiResponse<WarningSoundPageData>;

// ====================== 曲线计算接口 ======================
/**
 * 速度曲线计算 - 请求参数
 */
export interface WarningCalculateParams {
  /** 数据文件URL */
  fileUrl: string;
}
export type WarningCalculateResponse = ApiResponse<any>;

/**
 * 加速度曲线计算 - 请求参数
 */
export interface WarningCalculateAccelParams {
  /** 数据文件URL */
  fileUrl: string;
}
export type WarningCalculateAccelResponse = ApiResponse<any>;

// ====================== 故障模板AI分析 ======================
/**
 * 故障模板分析 - 请求参数
 */
export interface WarningAnalyzeParams {
  /** 数据文件URL */
  url: string;
  /** 电梯ID（用于匹配模板） */
  elevator_id: number;
}
export type WarningAnalyzeResponse = ApiResponse<any>;

// ====================== 故障模板-部件目录 ======================
/**
 * 故障模板-部件目录 - 单条部件数据
 */
export interface FaultTemplateComponentItem {
  /** 部件ID */
  id: number;
  /** 部件编码（英文常量，如 CAR_GUIDE_RAIL） */
  code: string;
  /** 部件名称 */
  name: string;
  /** 部件描述，无则为 null */
  description: string | null;
  /** 创建时间 Y-m-d H:i:s */
  created_at: string;
}
export type FaultTemplateComponentsResponse = ApiResponse<FaultTemplateComponentItem[]>;

// ====================== 故障模板-故障原因目录 ======================
/**
 * 故障模板-原因目录 - 请求参数
 */
export interface FaultTemplateCausesParams {
  /** 部件ID，传入则按部件筛选 */
  component_id?: number;
}

/**
 * 故障模板-原因目录 - 单条原因数据
 */
export interface FaultTemplateCauseItem {
  /** 原因记录ID */
  id: number;
  /** 原因编码 */
  code: string;
  /** 故障/原因名称 */
  title: string;
  /** 所属部件ID */
  component_id: number;
  /** 描述，可能为 null */
  description: string | null;
  /** 维修建议，可能为 null */
  suggest: string | null;
  /** 创建时间 Y-m-d H:i:s */
  created_at: string;
}
export type FaultTemplateCausesResponse = ApiResponse<FaultTemplateCauseItem[]>;

// ====================== 提交人工故障分析模板 ======================
/**
 * 故障模板-提交人工分析 - 请求参数
 */
export interface SubmitFaultTemplateParams {
  /** 已有检测记录ID，与 elevator_id+s_url 新建二选一 */
  detection_id?: number;
  /** 电梯ID（无 detection_id 且需解析数据时必填） */
  elevator_id?: number;
  /** 部件ID */
  component_id: number;
  /** 原因ID */
  cause_id: number;
  /** 方向编码 */
  direction_code: string;
  /** 备注 */
  note?: string;
  /** 1 则保存为新模板 */
  save_template?: number;
  /** 1 则按电梯更新已有模板 */
  update_template?: number;
  /** 传感器数据文件 URL或本地可读路径 */
  s_url?: string;
}

export interface SubmitFaultTemplateData {
  /** 是否新建了故障模板（save_template=1 且特征有效时为 true） */
  template_created: boolean;
  /** 关联的故障检测记录ID（新建或传入的 detection_id） */
  detection_id: number;
}
export type SubmitFaultTemplateResponse = ApiResponse<SubmitFaultTemplateData>;
/**
 * 获取AI算法诊断结果 - 请求参数
 */
export interface AlgorithmResultParams {
  /** 远端任务ID */
  task_id: string;
  simple?: number; // 1 则返回简化结果，0或不传则返回完整结果
}

/**
 * 获取AI算法诊断结果 - 响应数据
 */
export interface AlgorithmResultResponse {
  code: number;
  /** 业务信息 */
  msg?: string;
  /** 业务数据 */
  data: AlgorithmResultData;
  message: string;
}

/**
 * AI算法诊断结果 - 业务数据
 */
export interface AlgorithmResultData {
  /** 任务ID */
  task_id: string;
  /** 状态 */
  status: string;
  /** 消息 */
  message: string;
  /** 算法结果 */
  result: AlgorithmResult;
}

/**
 * 算法结果
 */
export interface AlgorithmResult {
  /** 状态 */
  status: string;
  /** 错误信息 */
  error: string;
  /** 输入文件路径 */
  input_file: string;
  /** 特征处理脚本路径 */
  feature_py: string;
  /** 权重矩阵路径 */
  weight_mat: string;
  /** 输出目录 */
  output_dir: string;
  /** 最终特征文件路径 */
  final_feature_path: string;
  /** 配置文件 */
  config: AlgorithmConfig;
  /** 特征信息 */
  feature_info: FeatureInfo;
  /** 特征形状 */
  feature_shapes: FeatureShapes;
  /** 诊断结果 */
  diagnosis: Diagnosis;
  /** Z向加速度托底 */
  acc_z_guard: AccZGuard;
  /** 调试信息 */
  debug: DebugInfo;
  /** 结果JSON文件路径 */
  result_json: string;
  /** 动态特征 */
  dynamic_features: DynamicFeatures;
  /** 轴承故障 */
  bearing_fault: BearingFault;
  /** 模块名 */
  module: string;
  /** 产物URL */
  artifact_urls: ArtifactUrls;
}

/**
 * 配置文件
 */
export interface AlgorithmConfig {
  /** 阶段代码 */
  stage_code: number;
  /** XZ配对代码 */
  pair_xz_code: number;
  /** YZ配对代码 */
  pair_yz_code: number;
  /** Top N */
  top_n: number;
  /** 权重模式 */
  weight_mode: string;
  /** Z向加速度限制 */
  acc_z_limit: number;
  /** Z向加速度保护低通频率 */
  acc_z_guard_lowpass_hz: number;
  /** 加速度缩放比例 */
  acc_scale_to_m_s2: number;
  /** 强制快速输出标志 */
  enforce_fast_output_flags: boolean;
  /** 保存结果JSON */
  save_result_json: boolean;
  /** 详细输出 */
  verbose: boolean;
}

/**
 * 特征信息
 */
export interface FeatureInfo {
  /** 输入文件路径 */
  input_file: string;
  /** 文件名 */
  file_name: string;
  /** 文件基础名 */
  file_stem: string;
  /** 输出目录 */
  output_dir: string;
  /** 状态 */
  status: string;
  /** 错误信息 */
  error: string;
  /** 采样频率 */
  fs_hz: number;
  /** 样本数量 */
  n_samples: number;
  /** 时长（秒） */
  duration_sec: number;
  /** 生成项目数量 */
  generated_count: number;
  /** 生成的项目列表 */
  generated_items: string;
}

/**
 * 特征形状
 */
export interface FeatureShapes {
  /** XZ特征形状 */
  features_xz_shape: number[];
  /** YZ特征形状 */
  features_yz_shape: number[];
  /** XZ选中的行数 */
  xz_selected_rows: number;
  /** YZ选中的行数 */
  yz_selected_rows: number;
  /** XZ在最终表中的索引 */
  xz_indices_in_final_table: number[];
  /** YZ在最终表中的索引 */
  yz_indices_in_final_table: number[];
}

/**
 * 诊断结果
 */
export interface Diagnosis {
  /** 模型标签 */
  model_label: number;
  /** 模型名称 */
  model_name: string;
  /** 最终标签 */
  final_label: number;
  /** 最终名称 */
  final_name: string;
  /** 可靠度 */
  reliability: number;
  /** 可靠度百分比 */
  reliability_percent: number;
  /** 距离数组 */
  distances: number[];
  /** 到标签1的距离 */
  distance_to_label1: number;
  /** 到标签2的距离 */
  distance_to_label2: number;
  /** 到标签3的距离 */
  distance_to_label3: number;
  /** 调整后到标签1的距离 */
  adjusted_distance_to_label1: number;
  /** 调整后到标签2的距离 */
  adjusted_distance_to_label2: number;
  /** 调整后到标签3的距离 */
  adjusted_distance_to_label3: number;
  /** 标签2使用的系数 */
  coeff_label2_used: number;
  /** 标签3使用的系数 */
  coeff_label3_used: number;
  /** 轴承使用的系数 */
  bearing_coeff_used: number;
  /** Z向加速度限制使用值 */
  acc_z_limit_used: number;
  /** 系数调整 */
  coefficient_adjustment: CoefficientAdjustment;
  /** 诊断结果 */
  diagnosis_result: string;
  /** 轴承状态 */
  bearing_status: string;
  /** 轴承阈值 */
  bearing_threshold: number;
  /** 轴承特征幅度 */
  bearing_feature_amplitude: number;
}

/**
 * 系数调整
 */
export interface CoefficientAdjustment {
  /** 标签2系数 */
  coeff_label2: number;
  /** 标签3系数 */
  coeff_label3: number;
  /** 轴承系数 */
  bearing_coeff: number;
  /** Z向加速度限制 */
  acc_z_limit: number;
  /** 调整后到标签1的距离 */
  adjusted_distance_to_label1: number;
  /** 调整后到标签2的距离 */
  adjusted_distance_to_label2: number;
  /** 调整后到标签3的距离 */
  adjusted_distance_to_label3: number;
  /** 规则说明 */
  rule?: string;
}

/**
 * Z向加速度托底
 */
export interface AccZGuard {
  /** 是否启用 */
  enabled: boolean;
  /** 是否超限 */
  exceed: boolean;
  /** Z向加速度限制值 (m/s²) */
  acc_z_limit_m_s2: number;
  /** Z向加速度最大绝对值 (m/s²) */
  acc_z_max_abs_m_s2: number;
  /** 加速度缩放比例 */
  acc_scale_to_m_s2: number;
  /** 消息 */
  message: string;
}

/**
 * 调试信息
 */
export interface DebugInfo {
  /** 权重模式 */
  weights_mode: string;
  /** 权重摘要 */
  weights_summary: WeightsSummary;
  /** XZ特征摘要 */
  feature_xz_summary: number[];
  /** YZ特征摘要 */
  feature_yz_summary: number[];
  /** 组合特征 */
  combined_features: number[];
  /** 对比特征 */
  comparison_features: number[];
  /** XZ索引 */
  idx_xz: IdxInfo;
  /** YZ索引 */
  idx_yz: IdxInfo;
  /** d12距离 */
  d12: number;
  /** d13距离 */
  d13: number;
  /** d23距离 */
  d23: number;
}

/**
 * 权重摘要
 */
export interface WeightsSummary {
  /** 系数 */
  coefs: Coefs;
  /** 阈值 */
  thresholds: Thresholds;
  /** 基线形状 */
  baseline_shape: number[];
}

/**
 * 系数
 */
export interface Coefs {
  /** FH系数 */
  fh_coef: number;
  /** FL系数 */
  fl_coef: number;
  /** FV系数 */
  fv_coef: number;
  /** 峰度系数 */
  kurtosis_coef: number;
  /** 相位系数 */
  phase_coef: number;
}

/**
 * 阈值
 */
export interface Thresholds {
  /** 饱和阈值 */
  sat_threshold: number;
}

/**
 * 索引信息
 */
export interface IdxInfo {
  /** FL索引（0-based） */
  idx_fl_0based: number[];
  /** FV索引（0-based） */
  idx_fv_0based: number[];
  /** FH索引（0-based） */
  idx_fh_0based: number[];
}

/**
 * 动态特征
 */
export interface DynamicFeatures {
  /** FL基础频率 */
  dyn_base_freq_fl: number;
  /** FV基础频率 */
  dyn_base_freq_fv: number;
  /** FH基础频率 */
  dyn_base_freq_fh: number;
  /** FL相位差 */
  dyn_phase_diff_fl: number;
  /** FV相位差 */
  dyn_phase_diff_fv: number;
  /** FH相位差 */
  dyn_phase_diff_fh: number;
  /** FL刚度比 */
  dyn_stiffness_ratio_fl: number;
  /** FV刚度比 */
  dyn_stiffness_ratio_fv: number;
  /** FH刚度比 */
  dyn_stiffness_ratio_fh: number;
  /** X轴峰度 */
  dyn_kurtosis_x: number;
  /** Y轴峰度 */
  dyn_kurtosis_y: number;
  /** Z轴峰度 */
  dyn_kurtosis_z: number;
}

/**
 * 轴承故障
 */
export interface BearingFault {
  /** 状态 */
  status: string;
  /** 模块名 */
  module: string;
  /** 输入文件路径 */
  input_file: string;
  /** 输出目录 */
  output_dir: string;
  /** 采样频率 */
  fs: number;
  /** 通道名 */
  channel: string;
  /** 通道索引 */
  channel_index: number;
  /** 源类型 */
  source_type: string;
  /** 核心频率 */
  core_frequency: CoreFrequency;
  /** 包络 */
  envelope: Envelope;
  /** DDC输出 */
  ddc_output: DdcOutput;
  /** 特征 */
  feature: BearingFeature;
  /** 判断 */
  judge: BearingJudge;
  /** 图表 */
  figures: Figures;
  /** 文件 */
  files: BearingFiles;
  /** 参数 */
  params: BearingParams;
}

/**
 * 核心频率
 */
export interface CoreFrequency {
  /** 模式 */
  mode: string;
  /** 搜索频带 */
  search_band: number[];
  /** 核心频率 (Hz) */
  core_frequency_hz: number;
  /** 核心峰值幅度 */
  core_peak_amplitude: number;
  /** 期望来源 */
  expected_source: string;
}

/**
 * 包络
 */
export interface Envelope {
  /** 方法 */
  method: string;
  /** 中心频率 (Hz) */
  fc_hz: number;
  /** CIC R */
  cic_R: number;
  /** CIC N */
  cic_N: number;
  /** CIC M */
  cic_M: number;
  /** 阶段2 Q */
  stage2_q: number;
  /** 阶段3 Q */
  stage3_q: number;
  /** 总抽取 */
  total_decimation: number;
  /** 原始采样频率 (Hz) */
  fs_original_hz: number;
  /** CIC后采样频率 (Hz) */
  fs_after_cic_hz: number;
  /** 阶段2后采样频率 (Hz) */
  fs_after_stage2_hz: number;
  /** 新采样频率 (Hz) */
  fs_new_hz: number;
  /** 新奈奎斯特频率 (Hz) */
  nyquist_new_hz: number;
  /** 原始样本数 */
  n_original: number;
  /** CIC后样本数 */
  n_after_cic: number;
  /** 最终样本数 */
  n_final: number;
  /** 移除包络均值 */
  remove_envelope_mean: boolean;
  /** 请求的FC带宽 (Hz) */
  requested_fc_bw_hz: number;
  /** 传统滤波器阶数 */
  legacy_filter_order: number;
  /** 请求的特征频带 (Hz) */
  requested_feature_band_hz: number[];
  /** 解决的特征频带 (Hz) */
  resolved_feature_band_hz: number[];
}

/**
 * DDC输出
 */
export interface DdcOutput {
  /** I样本数 */
  i_samples: number;
  /** Q样本数 */
  q_samples: number;
  /** 包络样本数 */
  envelope_samples: number;
}

/**
 * 轴承特征
 */
export interface BearingFeature {
  /** 特征峰值频率 (Hz) */
  feature_peak_frequency_hz: number;
  /** 特征峰值幅度 */
  feature_peak_amplitude: number;
  /** 特征频带 */
  feature_band: number[];
  /** 排除频带 */
  exclude_bands: number[];
  /** 请求的特征频带 */
  requested_feature_band: number[];
}

/**
 * 轴承判断
 */
export interface BearingJudge {
  /** 状态 */
  status: string;
  /** 是否故障 */
  is_fault: boolean;
  /** 阈值 */
  threshold: number;
  /** 警告阈值 */
  warning_threshold: number;
  /** 警告分数 */
  warning_score: number;
  /** 置信度 */
  confidence: number;
  /** 判断模式 */
  judge_mode: string;
  /** 阈值系数 */
  threshold_coefficient: number;
  /** 基础阈值 */
  base_threshold: number;
  /** 自适应阈值 */
  adaptive_threshold: AdaptiveThreshold;
  /** 阈值比率 */
  threshold_ratio: number;
}

/**
 * 自适应阈值
 */
export interface AdaptiveThreshold {
  /** 阈值系数 */
  threshold_coefficient: number;
  /** 背景中位幅度 */
  background_median_amplitude: number;
  /** 背景MAD */
  background_mad: number;
  /** 背景鲁棒Sigma */
  background_robust_sigma: number;
  /** 鲁棒Sigma因子 */
  robust_sigma_factor: number;
  /** 峰值到中位下限 */
  peak_to_median_floor: number;
  /** 高分位数 */
  high_quantile: number;
  /** 高分位数幅度 */
  high_quantile_amplitude: number;
  /** 高分位数因子 */
  high_quantile_factor: number;
  /** 基础阈值 */
  base_threshold: number;
  /** 有效阈值 */
  effective_threshold: number;
}

/**
 * 图表
 */
export interface Figures {
  /** 低频带FFT图路径 */
  low_band_fft: string;
  /** 包络频谱图路径 */
  envelope_spectrum: string;
}

/**
 * 轴承文件
 */
export interface BearingFiles {
  /** 摘要JSON文件路径 */
  summary_json: string;
}

/**
 * 轴承参数
 */
export interface BearingParams {
  /** 通道 */
  channel: number;
  /** 搜索频带 */
  search_band: number[];
  /** 核心频率 (Hz) */
  core_frequency_hz: number | null;
  /** FC带宽 (Hz) */
  fc_bw_hz: number;
  /** 特征频带 */
  feature_band: number[];
  /** 启用DDC */
  ddc_enabled: boolean;
  /** CIC R */
  cic_R: number;
  /** CIC N */
  cic_N: number;
  /** CIC M */
  cic_M: number;
  /** 阶段2 Q */
  stage2_q: number;
  /** 阶段3 Q */
  stage3_q: number;
  /** 排除频带 */
  exclude_bands: number[];
  /** 阈值 */
  threshold: number | null;
  /** 阈值系数 */
  threshold_coefficient: number;
  /** 鲁棒Sigma因子 */
  robust_sigma_factor: number;
  /** 峰值到中位下限 */
  peak_to_median_floor: number;
  /** 高分位数 */
  high_quantile: number;
  /** 高分位数因子 */
  high_quantile_factor: number;
  /** 警告比率 */
  warning_ratio: number;
  /** 最大绘图频率 */
  fmax_plot: number;
}

/**
 * 产物URL
 */
export interface ArtifactUrls {
  /** 文件列表 */
  files: ArtifactFiles;
}

/**
 * 产物文件
 */
export interface ArtifactFiles {
  /** 轴承包络频谱图 */
  'bearing_fault/bearing_envelope_spectrum.png': string;
  /** 轴承故障指标摘要 */
  'bearing_fault/bearing_fault_indicator_summary.json': string;
  /** 轴承低频带FFT */
  'bearing_fault/bearing_low_band_fft.png': string;
  /** 快速诊断结果JSON */
  'fast_diagnosis_result.json': string;
  /** 三个参考结果CSV */
  'three_reference_results.csv': string;
  /** 三个参考结果MAT */
  'three_reference_results.mat': string;
}

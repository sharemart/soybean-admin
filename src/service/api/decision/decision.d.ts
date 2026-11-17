import type { ApiResponse } from '@/service/api/types/common';

/** maintain 维保经营 / property 物业履约 / asset 资产概览 */
export type DecisionView = 'maintain' | 'property' | 'asset';

/** village 小区 / group 小组 / company 公司 / user 人员 */
export type RankDimension = 'village' | 'group' | 'company' | 'user';

/** 排行排序指标，按该值降序 */
export type RankMetric =
  | 'completion'
  | 'overdue'
  | 'on_time'
  | 'avg_work'
  | 'interval'
  | 'repair'
  | 'unreceived';

export interface DrillTarget {
  /** 前端路由，如 /scheduling、/decision/compare */
  route: string;
  /** 路由参数。日期，以及状态、小区、公司等 */
  query?: Record<string, unknown>;
}

export interface DecisionCompany {
  company_id: number;
  company_name: string;
  /** 1制造 2使用 3维保 4安装 5其他 */
  company_type: number;
  /** 使用单位子类，2 为物业 */
  use_comtype: number;
}

export interface DecisionMeta {
  view: DecisionView;
  view_text: string;
  /** 当前主体公司。超管未筛选时为 0 */
  company_id: number;
  /** 超管未筛选时为平台 */
  company_name: string;
  /** 超管为 0 */
  company_type: number;
  use_comtype: number;
  /** true 时可调 finance。物业为 false */
  finance_enabled: boolean;
  /** true 时可按下属公司排行 */
  group_compare: boolean;
  /** true 表示 company_id 越权 */
  out_of_scope: boolean;
  /** 本月 1 日 */
  default_start: string;
  /** 今天 */
  default_end: string;
  /** 允许的最长统计天数，92 */
  max_range_days: number;
  /** 可筛选公司。超管最多 200 家 */
  companies: DecisionCompany[];
  notes: string[];
}

export interface MetricValue {
  label: string;
  value: number | null;
  /** %、天、分钟或单 */
  unit: string;
  prev_value: number | null;
  /** 上期为 0 时为 null */
  delta_rate: number | null;
  /** ok 或 warn */
  level?: string;
  drill?: DrillTarget;
  note?: string;
}

export interface OverviewCard extends MetricValue {
  code: string;
}

export interface Timeliness {
  note: string;
  sample_total: number;
  late_count: number;
  interval_breach: number;
  interval_total: number;
  on_time_rate: MetricValue;
  avg_late_days: MetricValue;
  avg_deviation_days: MetricValue;
  avg_work_minutes: MetricValue;
  avg_plan_finish_minutes: MetricValue;
  interval_rate: MetricValue;
  duration_outlier: MetricValue;
  duration_missing: MetricValue;
}

export interface MaintainSummary {
  total: number;
  completed: number;
  overdue: number;
  unassigned: number;
  completion_rate: number;
  overdue_rate: number;
  unassigned_rate: number;
}

export interface RepairSummary {
  total: number;
  trapped: number;
  trapped_open: number;
  unfinished: number;
  arrival_recorded: number;
  arrival_missing: number;
  avg_arrival_minutes: number;
  arrival_within_30_rate: number;
}

export interface DecisionOverview {
  view: DecisionView;
  start_date: string;
  end_date: string;
  prev_start: string;
  prev_end: string;
  out_of_scope: boolean;
  elevator_total: number;
  elevator_online: number;
  cards: OverviewCard[];
  timeliness: Timeliness;
  maintain: MaintainSummary;
  repair: RepairSummary;
}

export interface DecisionAlert {
  type: string;
  title: string;
  value: number;
  unit: string;
  drill?: DrillTarget;
}

export interface DecisionAlerts {
  view: DecisionView;
  start_date: string;
  end_date: string;
  out_of_scope: boolean;
  list: DecisionAlert[];
}

export interface RankItem {
  id: number;
  name: string;
  phone: string;
  elevator_count: number;
  maintain_total: number;
  maintain_completed: number;
  maintain_overdue: number;
  completion_rate: number;
  overdue_rate: number;
  on_time_rate: number;
  avg_work_minutes: number;
  interval_rate: number;
  repair_count: number;
  /** 无资金权限时为 0 */
  unreceived_amount: number;
  /** 仅小组维度有缺勤人数 */
  absence_user_count: number;
  company_type?: number;
  company_type_text?: string;
  drill?: DrillTarget;
}

export interface DecisionRank {
  view: DecisionView;
  dimension: RankDimension;
  metric: RankMetric;
  /** false 表示当前视图不允许该维度或指标 */
  enabled: boolean;
  start_date: string;
  end_date: string;
  out_of_scope: boolean;
  total: number;
  page: number;
  limit: number;
  list: RankItem[];
}

export interface ExposureBucket {
  contracts: number;
  amount: number;
  elevators: number;
}

export interface FinanceAging {
  not_due: number;
  d1_30: number;
  d31_60: number;
  d61_plus: number;
}

export interface PipelineStatus {
  /** 0待组长 2待文员 4待业主确认 6采购中 7待安装 */
  status: number;
  status_text: string;
  count: number;
  amount: number;
}

export interface DecisionFinance {
  allowed: boolean;
  view: DecisionView;
  out_of_scope: boolean;
  start_date: string;
  end_date: string;
  active_contract_amount: number;
  active_contract_count: number;
  active_contract_elevators: number;
  period_receivable: number;
  period_received: number;
  period_unreceived: number;
  collection_rate: number;
  aging: FinanceAging;
  exposure: {
    within_30: ExposureBucket;
    within_60: ExposureBucket;
    within_90: ExposureBucket;
  };
  pipeline: {
    amount: number;
    count: number;
    by_status: PipelineStatus[];
  };
  receipt_amount: number;
  expense_amount: number;
  cash_approx: number;
  cash_label: string;
  drill?: {
    contract?: DrillTarget;
    receivable?: DrillTarget;
  };
}

export interface ComplianceRate {
  expected: number;
  submitted: number;
  rate: number;
  note: string;
}

export interface HazardVillage {
  village_id: number;
  village_name: string;
  total: number;
  closed: number;
  open_count: number;
}

export interface DecisionCompliance {
  view: DecisionView;
  start_date: string;
  end_date: string;
  out_of_scope?: boolean;
  daily: ComplianceRate;
  weekly: ComplianceRate;
  monthly: ComplianceRate;
  hazard: {
    total: number;
    closed: number;
    rate: number;
    note: string;
    by_village: HazardVillage[];
  };
  feedback: {
    open_count: number;
    avg_stay_hours: number;
    sampled: number;
  };
  /** 仅物业视图有值，其他视图为 null */
  contract_due_90: ExposureBucket | null;
  drill?: {
    daily?: DrillTarget;
    hazard?: DrillTarget;
    issue?: DrillTarget;
  };
}

export interface RiskElevator {
  elevator_id: number;
  name: string;
  register_code: string;
  village_id: number;
  village_name: string;
  /** 1 到 3 */
  hit_count: number;
  /** 1 表示区间有逾期签到 */
  overdue_maintain: number;
  /** 1 表示区间有未完成急修 */
  unfinished_repair: number;
  /** 1 表示当前有未闭环隐患 */
  open_hazard: number;
  drill?: DrillTarget;
}

export interface RiskElevatorResult {
  start_date?: string;
  end_date?: string;
  out_of_scope: boolean;
  total: number;
  page: number;
  limit: number;
  list: RiskElevator[];
}

export interface ExportBriefingResult {
  file_url: string;
  start_date: string;
  end_date: string;
  view: DecisionView;
}

export interface DecisionScopeParams {
  company_id?: number;
}

export interface DecisionRangeParams extends DecisionScopeParams {
  start_date?: string;
  end_date?: string;
}

export interface DecisionRankParams extends DecisionRangeParams {
  dimension?: RankDimension;
  metric?: RankMetric;
  page?: number;
  limit?: number;
}

export interface DecisionPageParams extends DecisionRangeParams {
  page?: number;
  limit?: number;
}

export type DecisionMetaResponse = ApiResponse<DecisionMeta>;
export type DecisionOverviewResponse = ApiResponse<DecisionOverview>;
export type DecisionAlertsResponse = ApiResponse<DecisionAlerts>;
export type DecisionRankResponse = ApiResponse<DecisionRank>;
export type DecisionFinanceResponse = ApiResponse<DecisionFinance>;
export type DecisionComplianceResponse = ApiResponse<DecisionCompliance>;
export type RiskElevatorResponse = ApiResponse<RiskElevatorResult>;
export type ExportBriefingResponse = ApiResponse<ExportBriefingResult>;

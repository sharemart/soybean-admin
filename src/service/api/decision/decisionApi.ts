import { request } from '../../request';
import type {
  DecisionAlertsResponse,
  DecisionComplianceResponse,
  DecisionFinanceResponse,
  DecisionMetaResponse,
  DecisionOverviewResponse,
  DecisionPageParams,
  DecisionRankParams,
  DecisionRankResponse,
  DecisionRangeParams,
  DecisionScopeParams,
  ExportBriefingResponse,
  RiskElevatorResponse
} from './decision.d';

const prefix = '/dashboard/decision';

/** 决策视图、可筛选公司与默认统计区间 */
export function fetchDecisionMeta(params?: DecisionScopeParams) {
  return request<DecisionMetaResponse>({
    url: `${prefix}/meta`,
    method: 'get',
    params
  });
}

/** 决策总览。卡片、计划时效、维保与急修 */
export function fetchDecisionOverview(params?: DecisionRangeParams) {
  return request<DecisionOverviewResponse>({
    url: `${prefix}/overview`,
    method: 'get',
    params
  });
}

/** 待处理告警。只返回数量或金额大于 0 的事项 */
export function fetchDecisionAlerts(params?: DecisionRangeParams) {
  return request<DecisionAlertsResponse>({
    url: `${prefix}/alerts`,
    method: 'get',
    params
  });
}

/** 履约排行。物业请求小组或人员时 enabled 为 false */
export function fetchDecisionRank(params?: DecisionRankParams) {
  return request<DecisionRankResponse>({
    url: `${prefix}/rank`,
    method: 'get',
    params
  });
}

/**
 * 资金与合同敞口。
 * 物业视图 HTTP 仍为 200，body.code 为 4030，data 为空数组。
 */
export function fetchDecisionFinance(params?: DecisionRangeParams) {
  return request<DecisionFinanceResponse>({
    url: `${prefix}/finance`,
    method: 'get',
    params
  });
}

/** 安全合规。日检、周报、月会、隐患与物业问题 */
export function fetchDecisionCompliance(params?: DecisionRangeParams) {
  return request<DecisionComplianceResponse>({
    url: `${prefix}/compliance`,
    method: 'get',
    params
  });
}

/** 风险电梯。命中项越多越靠前，最多 50 台 */
export function fetchRiskElevators(params?: DecisionPageParams) {
  return request<RiskElevatorResponse>({
    url: `${prefix}/riskElevators`,
    method: 'get',
    params
  });
}

/** 导出月度简报。有资金权限时 Excel 另含资金表 */
export function exportDecisionBriefing(params?: DecisionRangeParams) {
  return request<ExportBriefingResponse>({
    url: `${prefix}/exportBriefing`,
    method: 'get',
    params
  });
}

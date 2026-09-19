import { request } from '../../request';
import type {
  CompanyRankParams,
  CompanyRankResponse,
  ElevatorMapParams,
  ElevatorMapResponse,
  ElevatorStatusParams,
  ElevatorStatusResponse,
  FaultTrendParams,
  FaultTrendResponse,
  MaintainTrendParams,
  MaintainTrendResponse,
  MaintainerLocationsParams,
  MaintainerLocationsResponse,
  OverviewParams,
  OverviewResponse,
  PartnerCompaniesParams,
  PartnerCompaniesResponse,
  PersonnelWorkloadParams,
  PersonnelWorkloadResponse,
  ProblemListParams,
  ProblemListResponse,
  WorkProgressParams,
  WorkProgressResponse
} from './screen.d';

/**
 * 获取电梯经纬度（分布地图）
 *
 * @returns 电梯地图列表信息
 */
/**
 * 获取电梯经纬度（分布地图）
 *
 * @returns 电梯地图打点列表
 */
export function fetchElevatorMap(params: ElevatorMapParams) {
  return request<ElevatorMapResponse>({
    url: '/dashboard/dataScreen/getElevatorMap',
    method: 'get',
    params
  });
}

/**
 * 获取维保人员实时定位
 *
 * @returns 维保人员最新定位列表
 */
export function fetchMaintainerLocations(params: MaintainerLocationsParams) {
  return request<MaintainerLocationsResponse>({
    url: '/dashboard/dataScreen/getMaintainerLocations',
    method: 'get',
    params
  });
}
/**
 * 获取维保工作进度（按日）
 *
 * @returns 维保工作进度统计信息
 */
export function fetchWorkProgress(params: WorkProgressParams) {
  return request<WorkProgressResponse>({
    url: '/dashboard/dataScreen/getWorkProgress',
    method: 'get',
    params
  });
}
/**
 * 获取存在问题列表
 *
 * @returns 问题列表（按发生时间倒序）
 */
export function fetchProblemList(params: ProblemListParams) {
  return request<ProblemListResponse>({
    url: '/dashboard/dataScreen/getProblemList',
    method: 'get',
    params
  });
}
/**
 * 获取合作公司列表
 *
 * @returns 可访问范围内的合作公司列表
 */
export function fetchPartnerCompanies(params: PartnerCompaniesParams) {
  return request<PartnerCompaniesResponse>({
    url: '/dashboard/dataScreen/getPartnerCompanies',
    method: 'get',
    params
  });
}

/**
 * 急修故障趋势
 *
 * @param params 查询参数
 * @returns 急修故障趋势数据
 */
export function fetchFaultTrend(params: FaultTrendParams) {
  return request<FaultTrendResponse>({
    url: '/dashboard/report/getFaultTrend',
    method: 'get',
    params
  });
}
/**
 * 总览 KPI
 *
 * @param params 查询参数
 * @returns 总览 KPI 数据
 */
export function fetchOverview(params: OverviewParams) {
  return request<OverviewResponse>({
    url: '/dashboard/report/getOverview',
    method: 'get',
    params
  });
}
/**
 * 维保趋势
 *
 * @param params 查询参数
 * @returns 维保趋势数据
 */
export function fetchMaintainTrend(params: MaintainTrendParams) {
  return request<MaintainTrendResponse>({
    url: '/dashboard/report/getMaintainTrend',
    method: 'get',
    params
  });
}
/**
 * 下属公司对比
 *
 * @param params 查询参数
 * @returns 下属公司对比数据
 */
export function fetchCompanyRank(params: CompanyRankParams) {
  return request<CompanyRankResponse>({
    url: '/dashboard/report/getCompanyRank',
    method: 'get',
    params
  });
}
/**
 * 人员工作量
 *
 * @param params 查询参数
 * @returns 人员工作量数据
 */
export function fetchPersonnelWorkload(params: PersonnelWorkloadParams) {
  return request<PersonnelWorkloadResponse>({
    url: '/dashboard/report/getPersonnelWorkload',
    method: 'get',
    params
  });
}
/**
 * 电梯状态分布
 *
 * @param params 查询参数
 * @returns 电梯状态分布数据
 */
export function fetchElevatorStatus(params: ElevatorStatusParams) {
  return request<ElevatorStatusResponse>({
    url: '/dashboard/report/getElevatorStatus',
    method: 'get',
    params
  });
}

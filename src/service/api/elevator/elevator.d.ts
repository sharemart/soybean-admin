/**
 * 获取电梯简易列表的请求参数接口
 */
export interface GetElevatorSimpleListParams {
  /** 电梯名称（模糊搜索） */
  elevator_name?: string;
  /** 电梯编号（模糊搜索） */
  elevator_number?: string;
  /** 小区ID */
  village_id?: number;
  /** 维保小组ID */
  group_id?: number;
  /** 维保公司ID（company_id3） */
  company_id?: number;
}

/**
 * 获取电梯简易列表的响应数据接口
 */
export interface GetElevatorSimpleListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: {
    /** 电梯ID */
    elevator_id: number;
    /** 电梯名称 */
    elevator_name: string;
    /** 电梯编号 */
    elevator_number: string;
    /** 维保公司ID */
    company_id3: number;
    /** 小区名称 */
    village_name: string;
  }[]; // 假设返回的是数组形式的列表，若为单个对象可去掉 []
}

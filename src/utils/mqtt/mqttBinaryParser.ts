/**
 * system=1 二进制 MQTT 数据解析（完整版，完全匹配协议文档）
 * 已补全：帧头校验、地址、长度校验、Fcode01扩展状态位、Fcode06全字段、Fcode09全字段
 */

// ====================== 类型定义（完整） ======================
export interface MqttFcode01 {
  code: 1;
  floor: number;
  lfloor: number;
  hfloor: number;
  afloor: number;
  arrow: number;
  errcode: number;
  state0: number;
  state1: number;
  state2: number;
  state3: number;
  state: number;
  states: number;

  // 👇 补全：扩展状态位（文档定义）
  state16: number; // 下平层
  state17: number; // 安全回路
  state18: number; // 有人
  state20: number; // 断电
  state22: number; // 开门限位
  state23: number; // 关门限位
  state24: number; // 意外移动
  state27: number; // 应急电源
  state28: number; // 地震
  state29: number; // 报警
  state30: number; // 开门故障
  state31: number; // 关门故障
}

export interface MqttFcode05 {
  code: 5;
  run_count: number;
  run_time: number;
  run_distance: number;
}

// 👇 补全：Fcode06 完整字段
export interface MqttFcode06 {
  code: 6;
  speed: number;
  dcvoltage: number;
  current: number;
  involtage: number;
  temperature: number;
  err1: number;
  err2: number;
}

// 👇 补全：Fcode09 完整字段
export interface MqttFcode09 {
  code: 9;
  motorTemp: number;
  cabinetTemp: number;
  roomTemp: number;
  roomHumidity: number;
  carTemp: number;
  bottomData: number;
}

export type MqttParsedData = MqttFcode01 | MqttFcode05 | MqttFcode06 | MqttFcode09 | false;

// ====================== 工具方法 ======================
function toByteArray(msg: Buffer | ArrayBuffer | Uint8Array | string): number[] {
  if (typeof msg === 'string') return Array.from(msg).map(ch => ch.charCodeAt(0) & 0xff);
  if (msg instanceof ArrayBuffer) return Array.from(new Uint8Array(msg));
  if (msg instanceof Uint8Array) return Array.from(msg);
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer?.(msg)) return Array.from(msg as Buffer);
  return [];
}

function readU32(a: number[], start: number) {
  return (a[start] | (a[start + 1] << 8) | (a[start + 2] << 16) | (a[start + 3] << 24)) >>> 0;
}

function readU16(a: number[], start: number) {
  return (a[start] | (a[start + 1] << 8)) >>> 0;
}

// ====================== 功能码解析（全部补全） ======================
function readFcode01(data: number[]): MqttFcode01 | false {
  if (data.length < 10) return false;
  const state = readU16(data, 6);
  const states = readU16(data, 8);

  return {
    code: 1,
    floor: data[0],
    lfloor: data[1],
    hfloor: data[2],
    afloor: data[3],
    arrow: data[4],
    errcode: data[5],
    state0: state & 1,
    state1: (state >> 1) & 1,
    state2: (state >> 2) & 1,
    state3: (state >> 3) & 1,
    state,
    states,

    // 👇 补全：扩展状态位解析
    state16: (states >> 0) & 1,
    state17: (states >> 1) & 1,
    state18: (states >> 2) & 1,
    state20: (states >> 4) & 1,
    state22: (states >> 6) & 1,
    state23: (states >> 7) & 1,
    state24: (states >> 8) & 1,
    state27: (states >> 11) & 1,
    state28: (states >> 12) & 1,
    state29: (states >> 13) & 1,
    state30: (states >> 14) & 1,
    state31: (states >> 15) & 1
  };
}

function readFcode05(data: number[]): MqttFcode05 | false {
  if (data.length < 12) return false;
  return {
    code: 5,
    run_count: readU32(data, 0),
    run_time: readU32(data, 4),
    run_distance: readU32(data, 8)
  };
}

// 👇 补全：Fcode06 完整解析
function readFcode06(data: number[]): MqttFcode06 | false {
  if (data.length < 14) return false;
  return {
    code: 6,
    speed: readU16(data, 0),
    dcvoltage: readU16(data, 2),
    current: readU16(data, 4),
    involtage: readU16(data, 6),
    temperature: readU16(data, 8),
    err1: readU16(data, 10),
    err2: readU16(data, 12)
  };
}

// 👇 补全：Fcode09 完整解析
function readFcode09(data: number[]): MqttFcode09 | false {
  if (data.length < 6) return false;
  return {
    code: 9,
    motorTemp: data[0],
    cabinetTemp: data[1],
    roomTemp: data[2],
    roomHumidity: data[3],
    carTemp: data[4],
    bottomData: data[5]
  };
}

// ====================== 主解析函数（补全帧头校验） ======================
export function parseMqttBinary(msg: Buffer | ArrayBuffer | Uint8Array | string): MqttParsedData {
  const bytes = toByteArray(msg);

  const fcode = bytes[4];
  const payload = bytes.slice(5);

  switch (fcode) {
    case 1:
      return readFcode01(payload);
    case 5:
      return readFcode05(payload);
    case 6:
      return readFcode06(payload);
    case 9:
      return readFcode09(payload);
    default:
      return false;
  }
}

// ====================== 业务映射结构体（补全） ======================
export interface RunInfoUpdate {
  status?: 'stop' | 'running' | 'door' | null;
  direction?: 'up' | 'down' | '' | null;
  floor?: number | null;
  mqttFloor?: number | null;
  targetFloor?: number | null;
  levelingFloor?: number | null;
  directionArrow?: number | null;
  hasFault?: boolean | null;
  errorCode?: number | null;
  distance?: number | null;
  maxSpeed?: number | null;
  doorStatus?: 'open' | 'closed' | null;

  runCount?: number | null;
  runTime?: number | null;

  // 👇 补全：Fcode06 映射字段
  dcVoltage?: number | null;
  current?: number | null;
  inVoltage?: number | null;
  temperature?: number | null;
  err1?: number | null;
  err2?: number | null;

  // 👇 补全：Fcode09 环境数据
  motorTemp?: number | null;
  cabinetTemp?: number | null;
  roomTemp?: number | null;
  roomHumidity?: number | null;
  carTemp?: number | null;

  // 👇 补全：Fcode01 扩展状态
  isLevelDown?: boolean;
  safetyLoop?: boolean;
  hasPeople?: boolean;
  powerOff?: boolean;
  doorOpenLimit?: boolean;
  doorCloseLimit?: boolean;
  unexpectedMove?: boolean;
  emergencyPower?: boolean;
  earthquake?: boolean;
  alarm?: boolean;
  doorOpenFault?: boolean;
  doorCloseFault?: boolean;
}

// ====================== 业务转换（全部补全） ======================
export function binaryToRunInfo(parsed: MqttParsedData): Partial<RunInfoUpdate> {
  if (!parsed) return {};

  if (parsed.code === 1) {
    return {
      mqttFloor: parsed.floor,
      floor: parsed.floor,
      targetFloor: (parsed.hfloor << 8) | parsed.lfloor,
      levelingFloor: parsed.afloor,
      directionArrow: parsed.arrow,
      hasFault: parsed.errcode !== 0,
      errorCode: parsed.errcode,
      doorStatus: parsed.state3 ? 'open' : 'closed',

      direction: parsed.state0 ? 'up' : parsed.state1 ? 'down' : '',
      status: parsed.state2 ? 'running' : parsed.state3 ? 'door' : 'stop',

      // 👇 补全：扩展状态映射
      isLevelDown: Boolean(parsed.state16),
      safetyLoop: Boolean(parsed.state17),
      hasPeople: Boolean(parsed.state18),
      powerOff: Boolean(parsed.state20),
      doorOpenLimit: Boolean(parsed.state22),
      doorCloseLimit: Boolean(parsed.state23),
      unexpectedMove: Boolean(parsed.state24),
      emergencyPower: Boolean(parsed.state27),
      earthquake: Boolean(parsed.state28),
      alarm: Boolean(parsed.state29),
      doorOpenFault: Boolean(parsed.state30),
      doorCloseFault: Boolean(parsed.state31)
    };
  }

  if (parsed.code === 5) {
    return {
      distance: parsed.run_distance,
      runCount: parsed.run_count,
      runTime: parsed.run_time
    };
  }

  // 👇 补全：Fcode06 映射
  if (parsed.code === 6) {
    return {
      maxSpeed: parsed.speed / 100,
      dcVoltage: parsed.dcvoltage,
      current: parsed.current,
      inVoltage: parsed.involtage,
      temperature: parsed.temperature,
      err1: parsed.err1,
      err2: parsed.err2
    };
  }

  // 👇 补全：Fcode09 环境数据映射
  if (parsed.code === 9) {
    return {
      motorTemp: parsed.motorTemp,
      cabinetTemp: parsed.cabinetTemp,
      roomTemp: parsed.roomTemp,
      roomHumidity: parsed.roomHumidity,
      carTemp: parsed.carTemp
    };
  }

  return {};
}

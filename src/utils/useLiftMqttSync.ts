import { type Ref, isRef, onUnmounted, watch } from 'vue';
import { binaryToRunInfo, parseMqttBinary } from './mqtt/mqttBinaryParser';
import { createMqttClient } from './mqtt/mqttClient';

type LiftInfoLike = {
  system?: number;
  elevatorNumber?: string | number;
  registerCode?: string;
};

type RunInfoLike = Record<string, any>;

type UseLiftMqttSyncOptions = {
  liftInfo: Ref<LiftInfoLike> | LiftInfoLike;
  runInfo: Ref<RunInfoLike>;
};

export function useLiftMqttSync({ liftInfo: _liftInfo, runInfo }: UseLiftMqttSyncOptions) {
  // 每个调用独立一份实例，不会互相覆盖 ✅
  let client: any = null;
  const heartbeatTimers: NodeJS.Timeout[] = [];
  let isConnecting = false;
  let isDestroyed = false;

  // 工具：获取值
  const getVal = (obj: any) => (isRef(obj) ? obj.value : obj);

  // 清空定时器
  const clearTimers = () => {
    heartbeatTimers.forEach(t => clearInterval(t));
    heartbeatTimers.length = 0;
  };

  // 安全断开连接
  const disconnect = () => {
    if (isDestroyed) return;

    clearTimers();

    if (client) {
      try {
        client.end(true);
      } catch {
        // 忽略断开错误
      }
      client = null;
    }

    isConnecting = false;
    console.log('[MQTT] 断开成功');
  };

  const mapDirection = (status: string): 'up' | 'down' | 'idle' => {
    if (status === 'up') return 'up';
    if (status === 'down') return 'down';
    return 'idle';
  };

  // 门状态映射函数
  const mapDoorStatus = (door: number): 'open' | 'closed' => {
    return door === 1 ? 'open' : 'closed';
  };

  const parseMessage = (message: Buffer | Uint8Array, system: number) => {
    // 系统1：二进制解析
    if (system === 1) {
      const parsed = parseMqttBinary(message);
      return binaryToRunInfo(parsed);
    }

    // 系统3/4：JSON 解析
    const rawData = JSON.parse(message.toString());

    // 系统4：字段映射
    if (system === 4) {
      console.log('[MQTT] 系统4原始数据:', rawData);

      const mappedData = {
        // 楼层信息
        floor: rawData.floor,
        mqttFloor: rawData.floor,
        targetFloor: rawData.floor,

        // 方向（从 elestatus 推断）
        direction: mapDirection(rawData.elestatus),

        // 门状态（door: 1=开, 0=关）
        doorStatus: mapDoorStatus(rawData.door),

        // 速度
        maxSpeed: rawData.speed,
        speed: rawData.vel,

        // 荷载（通过 az 估算，az≈9.8 时为空载）
        load: Math.round((rawData.az / 9.8) * 1000),

        // 楼层范围
        totalFloor: rawData.floormax,
        floormin: rawData.floormin,
        floormax: rawData.floormax,

        // 电源状态
        powerStatus: rawData.DCout > 5,

        // 其他状态
        hasFault: false,
        hasPeople: rawData.az < 9.7,
        safetyCircuit: true,
        isLeveling: rawData.vel === 0 && rawData.door === 0,
        alarmButton: false,

        // 运行统计（系统4无这些数据）
        runCount: 0,
        runTime: 0,
        distance: 0,

        // 保留原始数据
        rawData
      };

      return mappedData;
    }

    // 系统3：字段映射
    if (system === 3) {
      console.log('[MQTT] 系统3原始数据:', rawData);

      const mappedData = {
        // 楼层信息
        floor: rawData.floor,
        mqttFloor: rawData.floor,
        targetFloor: rawData.floor,

        // 方向
        direction: rawData.direction || 'idle',

        // 门状态
        doorStatus: rawData.doorStatus ?? 'closed',

        // 速度
        maxSpeed: rawData.maxSpeed ?? 0,
        speed: rawData.maxSpeed ?? 0,

        // 荷载
        load: rawData.load ?? 0,

        // 楼层范围
        totalFloor: rawData.totalFloor ?? 10,
        floormin: rawData.floormin ?? 0,
        floormax: rawData.floormax ?? 10,

        // 电源状态
        powerStatus: rawData.powerStatus ?? true,

        // 其他状态
        hasFault: rawData.hasFault ?? false,
        hasPeople: rawData.hasPeople ?? false,
        safetyCircuit: rawData.safetyCircuit ?? true,
        isLeveling: rawData.isLeveling ?? true,
        alarmButton: rawData.alarmButton ?? false,

        // 运行统计
        runCount: rawData.runCount ?? 0,
        runTime: rawData.runTime ?? 0,
        distance: rawData.distance ?? 0,

        // 保留原始数据
        rawData
      };

      return mappedData;
    }

    // 其他系统：直接返回原始数据
    return rawData;
  };

  // 计算订阅主题（提取公共逻辑）
  const getTopic = (system: number, elevatorNumber: string | number, registerCode: string) => {
    if (system === 1) return `monitor/view/${elevatorNumber}`;
    if (system === 4) return `wit/realtime/862323089242419/up`;
    return `status/${registerCode}`;
  };

  // 连接 MQTT（独立实例）
  const connect = () => {
    const currentLift = getVal(_liftInfo);
    if (!currentLift) {
      console.warn('[MQTT] 电梯信息为空');
      return;
    }
    if (client || isConnecting || isDestroyed) return;

    isConnecting = true;
    disconnect();
    1;

    // 构建连接
    const clientId = `web_${Math.random().toString(16).slice(2, 10)}`;
    const mqttUrl = 'wss://sharemarttech.com:8084/mqtt';

    const urlObj = new URL(mqttUrl);
    const host = urlObj.hostname;
    const port = Number(urlObj.port) || (urlObj.protocol === 'wss:' ? 443 : 80);

    client = createMqttClient({
      host,
      port,
      url: mqttUrl,
      clientId,
      username: 'admin',
      password: 'admin'
    });

    const system = Number(currentLift.system ?? 3);
    const registerCode = currentLift.registerCode;
    const elevatorNumber = currentLift.elevatorNumber;

    if (system !== 1 && !registerCode) {
      console.warn('[MQTT] 缺少 registerCode，无法连接');
      isConnecting = false;
      client = null;
      return;
    }

    const topic = getTopic(system, elevatorNumber, registerCode);

    // 心跳
    const publishPageAccess = (code: '10' | '30') => {
      if (system !== 1 || !client?.connected) return;
      const payload = JSON.stringify({
        id: elevatorNumber,
        fcode: '1',
        code,
        version: [],
        pagecode: [1, 2, 3, 4],
        new: 0
      });
      try {
        client.publish('pageaccess', payload);
      } catch {
        // 忽略发布错误
      }
    };

    // 连接成功
    client.on('connect', () => {
      if (isDestroyed) return;
      console.log('[MQTT] 连接成功:', topic);
      isConnecting = false;

      try {
        client.subscribe(topic, (err: Error) => {
          if (err) console.error('[MQTT] 订阅失败', err);
        });
      } catch {
        // 忽略订阅错误
      }

      if (system === 1) {
        publishPageAccess('10');
        publishPageAccess('30');

        heartbeatTimers.push(
          setInterval(() => publishPageAccess('30'), 4000),
          setInterval(() => publishPageAccess('10'), 5000)
        );
      }
    });

    // 消息解析
    client.on('message', (topic: string, message: Buffer | Uint8Array) => {
      if (isDestroyed || !message) return;

      try {
        const update = parseMessage(message, system);
        runInfo.value = { ...runInfo.value, ...update };
      } catch (e) {
        console.error('[MQTT] 解析失败', e);
      }
    });

    client.on('error', (err: any) => {
      console.error('[MQTT] 异常', err);
      isConnecting = false;
    });

    client.on('close', () => {
      isConnecting = false;
    });
  };

  // 监听电梯变化重连
  if (isRef(_liftInfo)) {
    watch(
      _liftInfo,
      newVal => {
        if (!newVal) return;
        disconnect();
        setTimeout(() => {
          if (!isDestroyed) connect();
        }, 200);
      },
      { deep: true }
    );
  }

  // 组件销毁标记 + 释放
  onUnmounted(() => {
    isDestroyed = true;
    disconnect();
  });

  return { connect, disconnect };
}

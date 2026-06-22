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

  // 断开连接（安全）
  const disconnect = () => {
    if (isDestroyed) return;

    clearTimers();

    if (client) {
      try {
        client.end(true);
      } catch {}
      client = null;
    }

    isConnecting = false;
    console.log('[MQTT] 断开成功');
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

    const topic = system === 1 ? `monitor/view/${elevatorNumber}` : `status/${registerCode}`;

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
      } catch {}
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
      } catch {}

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
        if (system === 1) {
          const parsed = parseMqttBinary(message);
          const update = binaryToRunInfo(parsed);
          runInfo.value = { ...runInfo.value, ...update };
        } else {
          const data = JSON.parse(message.toString());
          runInfo.value = { ...runInfo.value, ...data };
        }
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

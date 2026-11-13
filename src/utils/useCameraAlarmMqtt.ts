// utils/useCameraAlarmMqtt.ts
import { type Ref, computed, getCurrentInstance, isRef, onUnmounted, ref, watch } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { createMqttClient } from './mqtt/mqttClient';
import { playBeep, unlockAudio } from './beep';

type CompanyIdLike = number | string;

type UseCameraAlarmMqttOptions = {
  /** 公司ID，默认取当前登录用户的 company_id */
  companyId?: Ref<CompanyIdLike | undefined> | CompanyIdLike;
  /** 收到告警推送时的回调 */
  onAlarm?: (alarm: any, topic: string) => void;
  /** 是否播放“滴滴”提示音，默认 true */
  sound?: boolean;
};

/**
 * 订阅摄像头告警主题：dashboard/company/{companyId}/camera/alarm
 * 收到推送时播放“滴滴”提示音，并把最新告警透传给调用方
 */
export function useCameraAlarmMqtt(options: UseCameraAlarmMqttOptions = {}) {
  const { onAlarm, sound = true } = options;

  const authStore = useAuthStore();

  const latestAlarm = ref<any>(null);

  let client: any = null;
  let isConnecting = false;
  let isDestroyed = false;

  const resolveCompanyId = (): string => {
    const raw = isRef(options.companyId) ? options.companyId.value : options.companyId;
    console.log('[CameraAlarmMQTT] resolveCompanyId', raw, authStore.userInfo.company_id);
    const value = raw ?? authStore.userInfo.company_id ?? '';
    return String(value);
  };

  const buildTopic = (companyId: string) => `dashboard/company/${companyId}/camera/alarm`;

  const disconnect = () => {
    if (client) {
      try {
        client.end(true);
      } catch {
        // 忽略断开错误
      }
      client = null;
    }
    isConnecting = false;
  };

  const connect = () => {
    if (isDestroyed || isConnecting || client) return;

    // 尽早解锁音频，保证告警提示音能触发（浏览器自动播放策略）
    unlockAudio();

    const companyId = resolveCompanyId();
    if (!companyId) {
      console.warn('[CameraAlarmMQTT] 缺少 company_id，无法订阅告警');
      return;
    }

    const topic = buildTopic(companyId);
    const clientId = `camera_alarm_${Math.random().toString(16).slice(2, 10)}`;
    const mqttUrl = 'wss://sharemarttech.com:8084/mqtt';

    isConnecting = true;

    client = createMqttClient({
      url: mqttUrl,
      clientId,
      username: 'admin',
      password: 'admin'
    });

    client.on('connect', () => {
      if (isDestroyed) return;
      console.log('[CameraAlarmMQTT] 连接成功，订阅主题:', topic);
      isConnecting = false;

      client?.subscribe(topic, (err: Error) => {
        if (err) console.error('[CameraAlarmMQTT] 订阅失败', err);
      });
    });

    client.on('message', (topic: string, message: Buffer | Uint8Array) => {
      if (isDestroyed || !message) return;

      let payload: any = null;
      try {
        payload = JSON.parse(message.toString());
      } catch {
        payload = message.toString();
      }

      console.log('[CameraAlarmMQTT] 收到告警推送:', { topic, payload });

      latestAlarm.value = payload;

      if (sound) playBeep(1);

      onAlarm?.(payload, topic);
    });

    client.on('error', (err: any) => {
      console.error('[CameraAlarmMQTT] 异常', err);
      isConnecting = false;
    });

    client.on('close', () => {
      isConnecting = false;
    });
  };

  // 公司ID变化时自动重连
  if (isRef(options.companyId)) {
    watch(options.companyId, () => {
      disconnect();
      if (!isDestroyed) connect();
    });
  }

  // 组件卸载时断开
  if (getCurrentInstance()) {
    onUnmounted(() => {
      isDestroyed = true;
      disconnect();
    });
  }

  return {
    latestAlarm,
    topic: computed(() => buildTopic(resolveCompanyId())),
    connect,
    disconnect
  };
}

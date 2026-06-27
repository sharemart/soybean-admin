// utils/mqtt.ts
import { onUnmounted } from 'vue';
import type { IClientOptions, MqttClient } from 'mqtt';
import mqtt from 'mqtt';

// 单例客户端，全局唯一
let client: MqttClient | null = null;

/**
 * 核心：创建/获取 MQTT 客户端（单例）
 * @param deviceID 订阅的主题
 * @param onMessage 消息回调
 * @returns MQTT 客户端实例
 */
const createMQTTClient = (deviceID: string, onMessage: (payload: any) => void) => {
  // 如果已有连接，先关闭旧连接
  if (client) {
    client.end(true);
  }

  const options: IClientOptions = {
    username: 'admin',
    password: 'admin',
    clientId: `vue_mqtt_${Math.random().toString(16).slice(2, 10)}`,
    reconnectPeriod: 3000,
    clean: true
  };

  // 修复：区分环境用正确的协议
  // 浏览器用 wss，微信小程序用 wxs
  const mqttUrl =
    typeof window !== 'undefined'
      ? 'wss://sharemarttech.com:8084/mqtt' // 浏览器：wss 协议（关键修复）
      : 'wxs://sharemarttech.com:8084/mqtt'; // 小程序：wxs 协议

  // 创建新连接
  client = mqtt.connect(mqttUrl, options);

  // 连接成功：订阅主题
  client.on('connect', () => {
    console.log('MQTT 连接成功');
    client?.subscribe(deviceID, err => {
      if (err) console.error('订阅失败', err);
      else console.log(`订阅主题成功: ${deviceID}`);
    });
  });

  // 接收消息：透传回调
  client.on('message', (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      console.log('收到MQTT消息：', payload);
      onMessage(payload);
    } catch (e) {
      console.error('MQTT 消息处理错误', e);
    }
  });

  // 错误/重连/关闭 日志（新增：更详细的错误信息）
  client.on('error', err => {
    console.error('MQTT 错误：', err);
    // 常见错误提示
    if (err.message.includes('Bad User Name or Password')) {
      console.error('⚠️ 用户名/密码错误，请核对');
    } else if (err.message.includes('Connection refused')) {
      console.error('⚠️ 服务器拒绝连接，请检查地址/端口/协议');
    }
  });
  client.on('reconnect', () => console.log('MQTT 重连中...'));
  client.on('close', () => console.log('MQTT 连接关闭'));

  return client;
};

/**
 * 断开 MQTT 连接
 */
export const disconnectMQTT = () => {
  if (client) {
    client.end(true);
    client = null; // 重置单例，避免残留
    console.log('MQTT 已断开');
  }
};

/**
 * 组合式函数：供 Vue 页面/组件复用
 * @param deviceID 订阅主题
 * @param onMessage 消息回调
 * @returns 包含断开连接的方法
 */
export const useMQTT = (deviceID: string, onMessage: (payload: any) => void) => {
  // 页面加载时创建连接
  const clientInstance = createMQTTClient(deviceID, onMessage);

  // 页面卸载时自动断开（防止内存泄漏）
  onUnmounted(() => {
    disconnectMQTT();
  });

  // 对外暴露手动断开的方法（可选）
  return {
    disconnectMQTT,
    clientInstance
  };
};

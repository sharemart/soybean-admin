// 网页端使用标准 mqtt 库（需先安装：npm install mqtt）
import mqtt from 'mqtt';

// MQTT 客户端配置类型
export type MqttClientOptions = {
  host?: string;
  port?: number;
  url: string;
  clientId: string;
  username?: string;
  password?: string;
};

/**
 * 创建网页端 MQTT 客户端（替换小程序的 wx-mqtt）
 */
export function createMqttClient(options: MqttClientOptions) {
  const { url, clientId, username, password } = options;

  // 网页端 MQTT 连接配置（优化版）
  const connectOptions = {
    clientId,
    username,
    password,
    clean: true, // 清理会话
    reconnectPeriod: 3000, // 重连间隔 3 秒
    connectTimeout: 10000, // 连接超时 10 秒
    keepalive: 60, // 心跳间隔 60 秒
    protocolVersion: 4 // MQTT 3.1.1 版本
  };

  // 创建客户端（网页端仅支持 url 方式连接）
  const client = mqtt.connect(url, connectOptions);

  // 连接成功回调
  client.on('connect', () => {
    console.log('[MQTT] 网页端连接成功');
  });

  // 错误回调
  client.on('error', (err: Error) => {
    console.error('[MQTT] 客户端错误:', err);
    client.end();
  });

  // 重连回调
  client.on('reconnect', () => {
    console.log('[MQTT] 正在重连...');
  });

  // 断开连接回调
  client.on('close', () => {
    console.log('[MQTT] 连接已关闭');
  });

  // 离线回调
  client.on('offline', () => {
    console.log('[MQTT] 客户端离线');
  });

  return client;
}

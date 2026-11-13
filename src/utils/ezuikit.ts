/** 萤石播放器：通过 public 下脚本加载，避免 Vite 打包超大 ezuikit-js 导致栈溢出 */

function withBase(path: string) {
  const base = import.meta.env.VITE_BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}` || normalizedPath;
}

export const EZUIKIT_STATIC_PATH = withBase('/ezuikit/ezuikit_static');

const EZUIKIT_SCRIPT_SRC = withBase('/ezuikit/ezuikit.js');

let loadPromise: Promise<any> | null = null;

declare global {
  interface Window {
    EZUIKit?: {
      EZUIKitPlayer: new (options: Record<string, unknown>) => any;
      [key: string]: any;
    };
  }
}

/**
 * EZUIKit SDK 内部有三套 logger（ezuikit / ezuikit #id / ezopen），且大量使用
 * console.log 直接打印，播放器实例的 setLoggerOptions 无法全部关闭。
 * 这里在源头拦截 console.log/info/debug，只屏蔽带 EZUIKit 特征的日志，
 * 不影响 MQTT（[CameraAlarmMQTT] / [MQTT]）等业务日志与 console.warn/error。
 */
const EZUIKIT_LOG_PATTERNS = [
  '[ezuikit',
  '[ezopen',
  '>>>JSPlayerInterface',
  'wasmplayer.min.js',
  'Decoder.js',
  'DecodeWorker.js',
  'JSPlayerSDK',
  'there will play by',
  'your browser protocol is'
];

let consoleFilterInstalled = false;

function installEzuikitConsoleFilter() {
  if (consoleFilterInstalled || typeof window === 'undefined') return;
  consoleFilterInstalled = true;

  const isEzuikitLog = (args: unknown[]): boolean => {
    const text = args
      .map(arg => {
        if (typeof arg === 'string') return arg;
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(' ');
    return EZUIKIT_LOG_PATTERNS.some(pattern => text.includes(pattern));
  };

  const originalLog = console.log.bind(console);
  const originalInfo = console.info.bind(console);
  const originalDebug = console.debug.bind(console);

  console.log = ((...args: unknown[]) => {
    if (isEzuikitLog(args)) return;
    originalLog(...args);
  }) as typeof console.log;

  console.info = ((...args: unknown[]) => {
    if (isEzuikitLog(args)) return;
    originalInfo(...args);
  }) as typeof console.info;

  console.debug = ((...args: unknown[]) => {
    if (isEzuikitLog(args)) return;
    originalDebug(...args);
  }) as typeof console.debug;
}

export function loadEZUIKitPlayer(): Promise<any> {
  installEzuikitConsoleFilter();

  if (window.EZUIKit?.EZUIKitPlayer) {
    return Promise.resolve(window.EZUIKit.EZUIKitPlayer);
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-ezuikit="1"]');
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.EZUIKit?.EZUIKitPlayer) resolve(window.EZUIKit.EZUIKitPlayer);
        else reject(new Error('EZUIKit 脚本已加载但未找到 EZUIKitPlayer'));
      });
      existing.addEventListener('error', () => reject(new Error('EZUIKit 脚本加载失败')));
      return;
    }

    const script = document.createElement('script');
    script.src = EZUIKIT_SCRIPT_SRC;
    script.async = true;
    script.dataset.ezuikit = '1';
    script.onload = () => {
      if (window.EZUIKit?.EZUIKitPlayer) resolve(window.EZUIKit.EZUIKitPlayer);
      else reject(new Error('EZUIKit 脚本已加载但未找到 EZUIKitPlayer'));
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error(`无法加载 EZUIKit 脚本：${EZUIKIT_SCRIPT_SRC}`));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** 规范为 ezopen 直播地址；接口若已返回 ezopen 则优先使用 */
export function resolveEzopenUrl(params: {
  url?: string;
  deviceSerial?: string;
  channelNo?: number;
  quality?: number;
}) {
  const { url, deviceSerial, channelNo = 1, quality = 1 } = params;
  if (url && /^ezopen:\/\//i.test(url)) return url;

  if (deviceSerial) {
    const serial = String(deviceSerial).toUpperCase();
    // quality: 1高清 2流畅
    const suffix = quality === 1 ? 'hd.live' : 'live';
    return `ezopen://open.ys7.com/${serial}/${channelNo}.${suffix}`;
  }

  return url || '';
}
// utils/beep.ts
// 使用 Web Audio API 直接生成“滴滴”两声提示音，无需任何音频文件

let audioCtx: AudioContext | null = null;
let unlockRegistered = false;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;

  const Ctor: typeof AudioContext | undefined =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!Ctor) return null;

  if (!audioCtx) audioCtx = new Ctor();

  // 浏览器自动播放策略：首次需用户交互后才能出声，这里尽力恢复
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }

  return audioCtx;
};

/**
 * 解锁浏览器自动播放限制：注册“首次交互即恢复 AudioContext”的监听。
 * 在进入大屏等页面时尽早调用，确保告警“滴滴”声能正常播放。
 */
export const unlockAudio = () => {
  if (typeof window === 'undefined' || unlockRegistered) return;
  unlockRegistered = true;

  const unlock = () => getAudioContext();

  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });

  // 若当前已处于用户手势中（例如点击菜单进入大屏），立即尝试解锁
  unlock();
};

const scheduleTone = (ctx: AudioContext, offset: number, frequency: number, duration: number, volume: number) => {
  const osc = ctx.createOscillator();
  const harmonic = ctx.createOscillator();
  const gain = ctx.createGain();
  const harmonicGain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = frequency;

  // 叠加二次谐波，让音色更亮、更有质感，而不是干瘪的纯正弦波
  harmonic.type = 'triangle';
  harmonic.frequency.value = frequency * 2;

  osc.connect(gain);
  harmonic.connect(harmonicGain);
  harmonicGain.gain.value = 0.3;
  harmonicGain.connect(gain);
  gain.connect(ctx.destination);

  const start = ctx.currentTime + offset;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.008);
  gain.gain.setValueAtTime(volume, start + duration - 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.start(start);
  harmonic.start(start);
  osc.stop(start + duration + 0.02);
  harmonic.stop(start + duration + 0.02);
};

/**
 * 播放“滴滴滴”三声警报音（同频急促三声）
 * @param times 播放组数（默认 1 组，即三声“滴滴滴”）
 */
export const playBeep = (times = 1) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // 三声同频高音，间隔 0.3s，形成急促的“滴滴滴”警报感
  const BEEP = 1174.66; // D6，高音“滴”
  const VOLUME = 0.6;
  const DURATION = 0.16;
  const INTERVAL = 0.3;

  for (let group = 0; group < times; group++) {
    const groupStart = group * 3 * INTERVAL;
    for (let i = 0; i < 3; i++) {
      scheduleTone(ctx, groupStart + i * INTERVAL, BEEP, DURATION, VOLUME);
    }
  }
};

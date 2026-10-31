declare module 'ezuikit-js' {
  export interface EZUIKitPlayerOptions {
    id: string;
    accessToken: string;
    url: string;
    template?: string;
    plugin?: string[];
    width?: string | number;
    height?: string | number;
    handleSuccess?: () => void;
    handleError?: (error: unknown) => void;
    [key: string]: unknown;
  }

  export class EZUIKitPlayer {
    static EVENTS: Record<string, string>;
    constructor(options: EZUIKitPlayerOptions);
    eventEmitter?: { on: (event: string, handler: (...args: any[]) => void) => void };
    on?: (event: string, handler: (...args: any[]) => void) => void;
    stop?: () => void;
    destroy?: () => void;
    play?: () => void;
    startTalk?: () => void;
    stopTalk?: () => void;
    setVolumeGain?: (volume: number) => void;
  }

  const EZUIKit: {
    EZUIKitPlayer: typeof EZUIKitPlayer;
  };

  export { EZUIKitPlayer };
  export default EZUIKit;
}

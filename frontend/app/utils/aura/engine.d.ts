export type AuraOptions = {
  speed?: number;
  intensity?: number;
  grain?: number;
  scale?: number;
  color?: string;
  midColor?: string;
  deepColor?: string;
  paused?: boolean;
  cursorInteraction?: boolean;
  dpr?: number;
  showLogo?: boolean;
  floatLogo?: boolean;
  logoColor?: string;
  logoSize?: number;
};

export type AuraController = {
  supported: boolean;
  update(partial?: AuraOptions): void;
  destroy(): void;
};

/** The WebGL aura renderer (engine.js, as delivered with the OneBranding aura files). */
export function createAura(canvas: HTMLCanvasElement, options?: AuraOptions): AuraController;

import type { PerspectiveCamera, Group, Scene, WebGLRenderer } from "three";

export interface NumeralModel {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  pivot: Group;
  resize: (width: number, height: number, devicePixelRatio?: number) => void;
  render: () => void;
  dispose: () => void;
}

export function createNumeral(canvas: HTMLCanvasElement, three: typeof import("three"), options?: Record<string, unknown>): NumeralModel;

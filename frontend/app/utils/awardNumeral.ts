import * as THREE from "three";
import { createNumeral } from "./award/numeralModel";

// The Awwwards "1": a numeral one of rounded mirror-chrome and green
// bands twisting round the form, modelled and lit procedurally (no images).
// The form, the band layout and the studio live in award/numeralModel.js; they
// were fitted to the design render and its camera, so the numeral reads as in
// the design inside an 800x960 frame (other boxes keep that view, centred).

export interface AwardNumeral {
  resize: (width: number, height: number) => void;
  render: () => void;
  dispose: () => void;
}

export function createAwardNumeral(canvas: HTMLCanvasElement): AwardNumeral {
  const model = createNumeral(canvas, THREE, {
    tone: "neutral",
    powerPreference: "low-power",
    // The bands that were satin black are a satin brand-green metal (#0cc23a, linear RGB),
    // reflecting the chrome's studio; the recessed channel stays a deep green.
    blackColor: [0.0037, 0.5395, 0.0423],
    blackMetal: 1,
    satinMix: 0,
    blackRough: 0.3,
    blackF90: 1,
    rimSheen: 0,
    bandOcclDiffuse: 0.8,
  });
  return {
    resize(width, height) {
      if (width <= 0 || height <= 0) return;
      model.resize(width, height, Math.min(window.devicePixelRatio || 1, 2));
    },
    render: () => model.render(),
    dispose() {
      model.dispose();
      model.renderer.forceContextLoss();
    },
  };
}

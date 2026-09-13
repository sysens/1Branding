# Awards Stage Assets

- `artwork/*.webp`: 30 individual, optimized project images sourced from `public/home/threeLayerLocal`. Regenerate with `bun scripts/prepare-awards-assets.ts` from the frontend workspace.
- `stage.v1.webp`: a static render of the numeral and ceiling lights, displayed while WebGL initializes or when it is unavailable. It does not contain gallery cards.

The gallery uses native HTML cards and images in seven independent rows, positioned by Three.js CSS3DRenderer. Each row has one uniform card size, a curved path, and an independent looping direction. CSS reflections and shadows stay attached to the cards. Only the beveled numeral and illuminated ceiling ribbons use WebGL. The reference images define the composition; card artwork comes from OneBranding's local projects, not the game covers in the reference.

The gallery is lazy-loaded, pauses outside the viewport and in hidden tabs, and respects reduced-motion preferences. It continues to work without WebGL. The static WebGL scene renders only on initialization or resize and releases GPU resources on navigation.

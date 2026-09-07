# Globe Preview Assets

`land-points.v1.bin` contains little-endian float32 XYZ coordinates generated
with `bun scripts/prepare-globe.ts`. No geographic parsing runs in the browser.

`preview.v1.webp` is a render of this project's own globe, used while the 3D
module loads or WebGL is unavailable. It is not an image from the reference site.

Source: Natural Earth 1:110m land, distributed by world-atlas 2.x.
Natural Earth geographic data is public domain:
https://www.naturalearthdata.com/about/terms-of-use/

Visual reference: https://unitedcarriers.com/ . Its application code, branding,
and proprietary artwork are not bundled here.

The temporary preview can be removed by removing `GlobePreviewSection` from
`app/pages/ContactPage.vue`. The reusable component is `ui/NetworkGlobe.vue`.

# WORLD Globe Assets

`land-points.v1.bin` contains little-endian float32 XYZ coordinates generated
with `bun scripts/prepare-globe.ts`. No geographic parsing runs in the browser.

`preview.v1.webp` is the legacy blue/orange render of this project's own globe.
It is not an image from the reference site.

`outlines.v1.bin` contains little-endian float32 XYZ line-segment endpoints,
generated with `bun scripts/prepare-globe-outlines.ts` from world-atlas countries.
The client only uploads these prepared coordinates; it does not parse geographic data.

`preview-green.v1.webp` is the current green renderer's fallback, captured without
the heading or controls. The blue/orange legacy preview remains unchanged.

Source: Natural Earth 1:110m land, distributed by world-atlas 2.x.
Natural Earth geographic data is public domain:
https://www.naturalearthdata.com/about/terms-of-use/

Visual reference: https://unitedcarriers.com/ . Its application code, branding,
and proprietary artwork are not bundled here.

The globe now belongs to `home/WorldSection.vue`, immediately below the homepage
3D marquee. It is no longer rendered on Contacts. The reusable component is
`ui/NetworkGlobe.vue`; rotation, drag, keyboard controls and reduced-motion support remain available.

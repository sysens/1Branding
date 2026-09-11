# Project Marquee Artwork

`reference.v1.webp` is a 1340 x 523 texture atlas derived from the user-supplied design reference, with the browser scrollbar excluded. The atlas retains the reference artwork, lighting and cropped outer edges; it is not an original high-resolution export of each project.

The Vue component renders separate Three.js card geometries. Coordinates in `app/utils/marquee/layout.ts` define the rounded, interlocking Hilal, Cleo and Luqman shapes and their texture coordinates. The assembly moves together so its complementary corners stay aligned.

To use original project exports, supply the `images` prop to `ThreeDMarquee.vue` in `MARQUEE_TILES` order. Missing entries fall back to the atlas. Individual exports use each card's full local texture area, including its shaped cutout.

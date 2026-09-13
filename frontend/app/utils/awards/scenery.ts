import {
  ExtrudeGeometry, Mesh, MeshStandardMaterial, Shape,
} from "three";

export function createAwardNumeral(): Mesh<ExtrudeGeometry, MeshStandardMaterial> {
  const shape = new Shape();
  shape.moveTo(-9, 0);
  shape.lineTo(78, 0);
  shape.lineTo(78, 320);
  shape.lineTo(-9, 320);
  shape.lineTo(-88, 245);
  shape.lineTo(-9, 245);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, { depth: 14, steps: 1, bevelEnabled: true, bevelSize: 4, bevelThickness: 6, bevelSegments: 5 });
  const material = new MeshStandardMaterial({ metalness: .15, roughness: .25 });
  // A per-fragment height gradient avoids visible triangulation across the broad front face.
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying float vHeight;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHeight = position.y / 320.;");
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vHeight;")
      .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb = mix(vec3(0., .0005, 0.), vec3(.3, .95, .035), pow(clamp(vHeight, 0., 1.), 1.9));");
  };
  const numeral = new Mesh(geometry, material);
  numeral.position.set(-20, -390, 30);
  numeral.scale.x = .94;
  numeral.rotation.y = -.06;
  return numeral;
}

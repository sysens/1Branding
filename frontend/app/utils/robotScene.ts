const SOURCE_SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";
export const BRANDED_ROBOT_SCENE = "/home/robot-one.v1.splinecode";

export function resolveBrandedRobotScene(source: string): string {
  return source.split("?")[0] === SOURCE_SCENE ? BRANDED_ROBOT_SCENE : source;
}

import { addExtension, Packr, Unpackr } from "msgpackr";

export type SplineValue =
  | null | undefined | string | number | boolean | Uint8Array
  | SplineValue[] | { [key: string]: SplineValue } | SplineExtension;

class SplineExtension {
  constructor(public value: SplineValue) {}
}
class SplineRecord extends SplineExtension {}
export class SplineList extends SplineExtension {}
class SplineTree extends SplineExtension {}
class SplineReference extends SplineExtension {}
class SplineInlineValue extends SplineExtension {}
class SplineDictionary extends SplineExtension {}

// Preserve Spline's MessagePack extension tags when authoring the local asset.
const extensions = [
  SplineRecord, SplineList, SplineTree,
  SplineReference, SplineInlineValue, SplineDictionary,
];
extensions.forEach((Class, index) => addExtension({
  Class,
  type: index + 1,
  read: (value: SplineValue) => new Class(value),
  write: (entry: SplineExtension) => entry.value,
}));

const decoder = new Unpackr({ structuredClone: true });
const encoder = new Packr({ structuredClone: true, useRecords: true });
export const decodeScene = (bytes: Uint8Array): SplineValue => decoder.unpack(bytes);
export const encodeScene = (scene: SplineValue): Uint8Array => encoder.pack(scene);

export function record(value: SplineValue): Record<string, SplineValue> {
  if (value instanceof SplineExtension) return record(value.value);
  if (!value || typeof value !== "object" || Array.isArray(value) || value instanceof Uint8Array) {
    throw new Error("Expected a Spline record.");
  }
  return value;
}

export function list(value: SplineValue): SplineValue[] {
  if (value instanceof SplineExtension) return list(value.value);
  if (!Array.isArray(value)) throw new Error("Expected a Spline list.");
  return value;
}

export function findNode(nodes: SplineValue[], id: string): Record<string, SplineValue> | undefined {
  for (const value of nodes) {
    const node = record(value);
    if (node.id === id) return node;
    const match = findNode(list(node.children ?? []), id);
    if (match) return match;
  }
}

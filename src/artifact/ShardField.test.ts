import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { ShardField } from "./ShardField";

describe("ShardField", () => {
  const field = new ShardField();

  it("has one shard per icosahedron face", () => {
    expect(field.count()).toBe(20);
  });

  it("finds the 30 edge-sharing pairs, each exactly once, three per face", () => {
    const pairs = field.neighbourPairs();
    expect(pairs).toHaveLength(30);
    expect(new Set(pairs.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`)).size).toBe(30);
    const degree = new Array<number>(20).fill(0);
    for (const [a, b] of pairs) {
      degree[a]++;
      degree[b]++;
    }
    expect(degree.every((d) => d === 3)).toBe(true);
  });

  it("builds closed prisms of eight triangles", () => {
    for (let i = 0; i < 20; i++) {
      expect(field.geometry(i).getAttribute("position").count).toBe(24);
    }
  });

  it("orients every triangle away from the prism, so normals point outward", () => {
    const geometry = field.geometry(3);
    const position = geometry.getAttribute("position");
    const normal = geometry.getAttribute("normal");
    const centre = new Vector3();
    for (let i = 0; i < position.count; i++) centre.add(new Vector3().fromBufferAttribute(position, i));
    centre.multiplyScalar(1 / position.count);
    for (let i = 0; i < position.count; i++) {
      const outward = new Vector3().fromBufferAttribute(position, i).sub(centre);
      expect(new Vector3().fromBufferAttribute(normal, i).dot(outward)).toBeGreaterThan(0);
    }
  });

  it("scatters identically on every construction", () => {
    const again = new ShardField();
    expect(again.shard(7).scatterOffset.toArray()).toEqual(field.shard(7).scatterOffset.toArray());
  });

  it("staggers window starts so every window ends by 1", () => {
    const starts = Array.from({ length: 20 }, (_, i) => field.shard(i).windowStart);
    expect(new Set(starts).size).toBe(20);
    expect(Math.max(...starts)).toBeLessThanOrEqual(0.55 + 1e-9);
    expect(Math.min(...starts)).toBe(0);
  });
});

import type { GeoCoordinate } from "@/lib/enterprise/liv-golf/geo/types";

/** Ray-casting point-in-polygon for a single closed ring (WGS84 lng/lat). */
export function isPointInsidePolygon(
  point: GeoCoordinate,
  polygon: readonly GeoCoordinate[],
): boolean {
  if (polygon.length < 3) return false;

  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersects =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

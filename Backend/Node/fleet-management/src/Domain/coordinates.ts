/** ~0.11 m precision at the equator — suitable for GPS coordinate comparison */
export const COORDINATE_EPSILON = 1e-6;

export function coordinatesEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= COORDINATE_EPSILON;
}

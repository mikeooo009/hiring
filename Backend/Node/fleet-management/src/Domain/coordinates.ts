/** ~0.11 m precision at the equator — aligned with PostgreSQL round(, 6) */
export const COORDINATE_PRECISION = 6;

export function roundCoordinate(value: number): number {
  return Number(value.toFixed(COORDINATE_PRECISION));
}

export function coordinatesEqual(a: number, b: number): boolean {
  return roundCoordinate(a) === roundCoordinate(b);
}

/** @deprecated use COORDINATE_PRECISION — kept for any legacy references */
export const COORDINATE_EPSILON = 1e-6;

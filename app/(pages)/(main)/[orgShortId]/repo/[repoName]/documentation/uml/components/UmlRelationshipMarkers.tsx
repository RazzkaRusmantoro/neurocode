'use client';

/**
 * UML relationship diamond markers for class diagrams.
 * - Composition: filled (black) diamond at source end of line.
 * - Aggregation: unfilled diamond at source end of line.
 *
 * Both are drawn with the tip at (tipX, tipY) and the base toward (target).
 */

export const DEFAULT_DIAMOND_LENGTH = 22;
export const DEFAULT_DIAMOND_WIDTH = 7;
export const DEFAULT_ARROW_LENGTH = 16;
export const DEFAULT_ARROW_WIDTH = 8;

export interface UmlDiamondProps {
  /** Tip of the diamond (touches the source node). */
  tipX: number;
  tipY: number;
  /** Unit vector from source toward target (direction of the line). */
  dirX: number;
  dirY: number;
  /** Stroke color. */
  stroke?: string;
  /** Length along the line (tip to base). Default: DEFAULT_DIAMOND_LENGTH */
  length?: number;
  /** Half-width perpendicular to the line. Default: DEFAULT_DIAMOND_WIDTH */
  width?: number;
}

/** Filled diamond for composition (strong ownership). */
export function CompositionDiamond({
  tipX,
  tipY,
  dirX,
  dirY,
  stroke = '#e4e4e7',
  length = DEFAULT_DIAMOND_LENGTH,
  width = DEFAULT_DIAMOND_WIDTH,
}: UmlDiamondProps) {
  const half = length / 2;
  const perpX = -dirY;
  const perpY = dirX;
  const baseX = tipX + dirX * length;
  const baseY = tipY + dirY * length;
  const p1 = `${tipX},${tipY}`;
  const p2 = `${tipX + dirX * half + perpX * width},${tipY + dirY * half + perpY * width}`;
  const p3 = `${baseX},${baseY}`;
  const p4 = `${tipX + dirX * half - perpX * width},${tipY + dirY * half - perpY * width}`;
  return (
    <polygon
      points={`${p1} ${p2} ${p3} ${p4}`}
      fill={stroke}
      stroke={stroke}
      strokeWidth={1.5}
    />
  );
}

/** Unfilled diamond for aggregation (weak / shared ownership). */
export function AggregationDiamond({
  tipX,
  tipY,
  dirX,
  dirY,
  stroke = '#e4e4e7',
  length = DEFAULT_DIAMOND_LENGTH,
  width = DEFAULT_DIAMOND_WIDTH,
  fill = 'transparent',
}: UmlDiamondProps & { fill?: string }) {
  const half = length / 2;
  const perpX = -dirY;
  const perpY = dirX;
  const baseX = tipX + dirX * length;
  const baseY = tipY + dirY * length;
  const p1 = `${tipX},${tipY}`;
  const p2 = `${tipX + dirX * half + perpX * width},${tipY + dirY * half + perpY * width}`;
  const p3 = `${baseX},${baseY}`;
  const p4 = `${tipX + dirX * half - perpX * width},${tipY + dirY * half - perpY * width}`;
  return (
    <polygon
      points={`${p1} ${p2} ${p3} ${p4}`}
      fill={fill}
      stroke={stroke}
      strokeWidth={1.5}
    />
  );
}

/**
 * Returns the (x, y) where the line should start after the diamond (base of diamond).
 * Use this to draw the edge line from base to target.
 */
export function diamondBase(
  tipX: number,
  tipY: number,
  dirX: number,
  dirY: number,
  length: number = DEFAULT_DIAMOND_LENGTH,
): { x: number; y: number } {
  return {
    x: tipX + dirX * length,
    y: tipY + dirY * length,
  };
}

/** Generalization arrow (unfilled triangle pointing to target). */
export function GeneralizationArrow({
  tipX,
  tipY,
  dirX,
  dirY,
  stroke = '#e4e4e7',
  length = DEFAULT_ARROW_LENGTH,
  width = DEFAULT_ARROW_WIDTH,
  fill = 'transparent',
}: UmlDiamondProps & { fill?: string }) {
  const perpX = -dirY;
  const perpY = dirX;
  const baseX = tipX - dirX * length;
  const baseY = tipY - dirY * length;
  const p1 = `${tipX},${tipY}`;
  const p2 = `${baseX + perpX * width},${baseY + perpY * width}`;
  const p3 = `${baseX - perpX * width},${baseY - perpY * width}`;
  return (
    <polygon
      points={`${p1} ${p2} ${p3}`}
      fill={fill}
      stroke={stroke}
      strokeWidth={1.5}
    />
  );
}

/** Directed association arrow (open -> pointing to target). */
export function DirectedAssociationArrow({
  tipX,
  tipY,
  dirX,
  dirY,
  stroke = '#e4e4e7',
  length = 10, // tighter length
  width = 5,   // tighter width
}: UmlDiamondProps) {
  const perpX = -dirY;
  const perpY = dirX;
  const baseX = tipX - dirX * length;
  const baseY = tipY - dirY * length;
  const p1 = `${baseX + perpX * width},${baseY + perpY * width}`;
  const p2 = `${tipX},${tipY}`;
  const p3 = `${baseX - perpX * width},${baseY - perpY * width}`;
  return (
    <polyline
      points={`${p1} ${p2} ${p3}`}
      fill="none"
      stroke={stroke}
      strokeWidth={1.5}
    />
  );
}

/**
 * Returns the (x, y) where the line should end before the arrow (base of arrow).
 * Use this to draw the edge line from source to arrow base.
 */
export function arrowBase(
  tipX: number,
  tipY: number,
  dirX: number,
  dirY: number,
  length: number = DEFAULT_ARROW_LENGTH,
): { x: number; y: number } {
  return {
    x: tipX - dirX * length,
    y: tipY - dirY * length,
  };
}

// =============================================================================
// Alignment Detection & Smart Snapping Engine
// Detects edge/center alignments between components and generates guide lines.
// =============================================================================

import type { AlignmentGuide, ComponentRect } from '../types/controls';

const ALIGNMENT_THRESHOLD = 5;
const SNAP_BREAK_THRESHOLD = 12;

interface ReferencePoint {
  position: number;
  source: 'edge' | 'center' | 'canvas-edge' | 'canvas-center' | 'safezone-edge';
  spanStart: number;
  spanEnd: number;
  type: 'vertical' | 'horizontal';
}

export function buildComponentRects(
  controls: { id: string; x: number; y: number; w: number; h: number }[]
): ComponentRect[] {
  return controls.map(c => ({
    id: c.id,
    x: c.x,
    y: c.y,
    w: c.w,
    h: c.h,
    cx: c.x + c.w / 2,
    cy: c.y + c.h / 2,
    right: c.x + c.w,
    bottom: c.y + c.h,
  }));
}

export function findAlignments(
  sourceRects: ComponentRect[],
  allRects: ComponentRect[],
  canvasW: number,
  canvasH: number,
  safeZone: { x: number; y: number; w: number; h: number } | null,
  threshold: number = ALIGNMENT_THRESHOLD
): AlignmentGuide[] {
  const sourceIds = new Set(sourceRects.map(r => r.id));
  const nonSourceRects = allRects.filter(r => !sourceIds.has(r.id));

  const guides: AlignmentGuide[] = [];

  // Collect reference points from non-moving components
  const refPoints: ReferencePoint[] = [];

  let globalMinY = Infinity;
  let globalMaxY = -Infinity;
  let globalMinX = Infinity;
  let globalMaxX = -Infinity;

  for (const r of nonSourceRects) {
    refPoints.push(
      { position: r.x, source: 'edge', spanStart: r.y, spanEnd: r.bottom, type: 'vertical' },
      { position: r.right, source: 'edge', spanStart: r.y, spanEnd: r.bottom, type: 'vertical' },
      { position: r.cx, source: 'center', spanStart: r.y, spanEnd: r.bottom, type: 'vertical' },
      { position: r.y, source: 'edge', spanStart: r.x, spanEnd: r.right, type: 'horizontal' },
      { position: r.bottom, source: 'edge', spanStart: r.x, spanEnd: r.right, type: 'horizontal' },
      { position: r.cy, source: 'center', spanStart: r.x, spanEnd: r.right, type: 'horizontal' },
    );
    globalMinY = Math.min(globalMinY, r.y);
    globalMaxY = Math.max(globalMaxY, r.bottom);
    globalMinX = Math.min(globalMinX, r.x);
    globalMaxX = Math.max(globalMaxX, r.right);
  }

  // Canvas boundaries
  refPoints.push(
    { position: 0, source: 'canvas-edge', spanStart: 0, spanEnd: canvasH, type: 'vertical' },
    { position: canvasW, source: 'canvas-edge', spanStart: 0, spanEnd: canvasH, type: 'vertical' },
    { position: canvasW / 2, source: 'canvas-center', spanStart: 0, spanEnd: canvasH, type: 'vertical' },
    { position: 0, source: 'canvas-edge', spanStart: 0, spanEnd: canvasW, type: 'horizontal' },
    { position: canvasH, source: 'canvas-edge', spanStart: 0, spanEnd: canvasW, type: 'horizontal' },
    { position: canvasH / 2, source: 'canvas-center', spanStart: 0, spanEnd: canvasW, type: 'horizontal' },
  );

  // SafeZone boundaries
  if (safeZone) {
    const szX = safeZone.x * canvasW;
    const szY = safeZone.y * canvasH;
    const szRight = szX + safeZone.w * canvasW;
    const szBottom = szY + safeZone.h * canvasH;
    refPoints.push(
      { position: szX, source: 'safezone-edge', spanStart: 0, spanEnd: canvasH, type: 'vertical' },
      { position: szRight, source: 'safezone-edge', spanStart: 0, spanEnd: canvasH, type: 'vertical' },
      { position: szY, source: 'safezone-edge', spanStart: 0, spanEnd: canvasW, type: 'horizontal' },
      { position: szBottom, source: 'safezone-edge', spanStart: 0, spanEnd: canvasW, type: 'horizontal' },
    );
  }

  // Include source rects in global span for guide rendering
  for (const r of sourceRects) {
    globalMinY = Math.min(globalMinY, r.y);
    globalMaxY = Math.max(globalMaxY, r.bottom);
    globalMinX = Math.min(globalMinX, r.x);
    globalMaxX = Math.max(globalMaxX, r.right);
  }

  // Check source rect edges/centers against reference points
  for (const src of sourceRects) {
    // Vertical checks (x, right, cx)
    const vChecks = [
      { pos: src.x, label: 'edge' },
      { pos: src.right, label: 'edge' },
      { pos: src.cx, label: 'center' },
    ];
    for (const check of vChecks) {
      for (const ref of refPoints) {
        if (ref.type !== 'vertical') continue;
        if (Math.abs(check.pos - ref.position) < threshold) {
          const guideStart = Math.min(globalMinY, src.y);
          const guideEnd = Math.max(globalMaxY, src.bottom);
          guides.push({
            id: `v-${check.pos}-${ref.position}`,
            type: 'vertical',
            position: ref.position,
            start: guideStart,
            end: guideEnd,
            source: ref.source,
            label: Math.abs(check.pos - ref.position) < 0.5 ? undefined : `${Math.round(Math.abs(check.pos - ref.position))}px`,
          });
        }
      }
    }

    // Horizontal checks (y, bottom, cy)
    const hChecks = [
      { pos: src.y, label: 'edge' },
      { pos: src.bottom, label: 'edge' },
      { pos: src.cy, label: 'center' },
    ];
    for (const check of hChecks) {
      for (const ref of refPoints) {
        if (ref.type !== 'horizontal') continue;
        if (Math.abs(check.pos - ref.position) < threshold) {
          const guideStart = Math.min(globalMinX, src.x);
          const guideEnd = Math.max(globalMaxX, src.right);
          guides.push({
            id: `h-${check.pos}-${ref.position}`,
            type: 'horizontal',
            position: ref.position,
            start: guideStart,
            end: guideEnd,
            source: ref.source,
            label: Math.abs(check.pos - ref.position) < 0.5 ? undefined : `${Math.round(Math.abs(check.pos - ref.position))}px`,
          });
        }
      }
    }
  }

  return deduplicateGuides(guides);
}

function deduplicateGuides(guides: AlignmentGuide[]): AlignmentGuide[] {
  const seen = new Map<string, AlignmentGuide>();
  for (const g of guides) {
    if (seen.has(g.id)) {
      const existing = seen.get(g.id)!;
      existing.start = Math.min(existing.start, g.start);
      existing.end = Math.max(existing.end, g.end);
    } else {
      seen.set(g.id, { ...g });
    }
  }
  return Array.from(seen.values());
}

export interface SnapResult {
  snapped: boolean;
  position: { x: number; y: number };
  guides: AlignmentGuide[];
}

export function computeSnappedPosition(
  currentRects: ComponentRect[],
  allRects: ComponentRect[],
  canvasW: number,
  canvasH: number,
  safeZone: { x: number; y: number; w: number; h: number } | null,
  threshold: number = ALIGNMENT_THRESHOLD
): SnapResult {
  const guides = findAlignments(currentRects, allRects, canvasW, canvasH, safeZone, threshold);

  if (guides.length === 0) {
    return { snapped: false, position: { x: currentRects[0]?.x ?? 0, y: currentRects[0]?.y ?? 0 }, guides: [] };
  }

  // Compute a snapped position from the first alignment guide found
  // For vertical guides, adjust x of the group; for horizontal, adjust y
  let snapDx = 0;
  let snapDy = 0;

  // Use a representative rect (the union bounding box center) for snapping
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of currentRects) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.right);
    maxY = Math.max(maxY, r.bottom);
  }

  for (const guide of guides) {
    if (guide.type === 'vertical') {
      // Check if left edge, right edge, or center of the group is close to guide
      const leftDist = Math.abs(minX - guide.position);
      const rightDist = Math.abs(maxX - guide.position);
      const centerDist = Math.abs((minX + maxX) / 2 - guide.position);

      if (leftDist < threshold) {
        snapDx = guide.position - minX;
      } else if (rightDist < threshold) {
        snapDx = guide.position - maxX;
      } else if (centerDist < threshold) {
        snapDx = guide.position - (minX + maxX) / 2;
      }
    }

    if (guide.type === 'horizontal') {
      const topDist = Math.abs(minY - guide.position);
      const bottomDist = Math.abs(maxY - guide.position);
      const centerDist = Math.abs((minY + maxY) / 2 - guide.position);

      if (topDist < threshold) {
        snapDy = guide.position - minY;
      } else if (bottomDist < threshold) {
        snapDy = guide.position - maxY;
      } else if (centerDist < threshold) {
        snapDy = guide.position - (minY + maxY) / 2;
      }
    }
  }

  return {
    snapped: snapDx !== 0 || snapDy !== 0,
    position: { x: minX + snapDx, y: minY + snapDy },
    guides,
  };
}

export { ALIGNMENT_THRESHOLD, SNAP_BREAK_THRESHOLD };

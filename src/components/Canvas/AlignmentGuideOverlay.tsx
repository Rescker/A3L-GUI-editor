// =============================================================================
// AlignmentGuideOverlay — Renders smart alignment guide lines during drag/resize
// Green vertical/horizontal guide lines with edge/center indicators.
// =============================================================================

import React from 'react';
import type { AlignmentGuide } from '../../types/controls';

interface Props {
  guides: AlignmentGuide[];
}

export const AlignmentGuideOverlay: React.FC<Props> = ({ guides }) => {
  if (guides.length === 0) return null;

  return (
    <>
      {guides.map((guide) => {
        const position = guide.position;

        if (guide.type === 'vertical') {
          const top = guide.start;
          const height = guide.end - guide.start;
          const isCenter = guide.source === 'center' || guide.source === 'canvas-center';
          return (
            <div
              key={guide.id}
              className="absolute pointer-events-none"
              style={{
                left: position,
                top,
                width: 1,
                height,
                borderLeft: isCenter ? '1px dashed #22c55e' : '1px solid #22c55e',
                zIndex: 25,
              }}
            >
              {guide.label && (
                <div
                  className="absolute text-[9px] text-[#22c55e] whitespace-nowrap"
                  style={{ left: 2, top: 0 }}
                >
                  {guide.label}
                </div>
              )}
            </div>
          );
        }

        // Horizontal guide
        const left = guide.start;
        const width = guide.end - guide.start;
        const isCenter = guide.source === 'center' || guide.source === 'canvas-center';
        return (
          <div
            key={guide.id}
            className="absolute pointer-events-none"
            style={{
              left,
              top: position,
              width,
              height: 1,
              borderTop: isCenter ? '1px dashed #22c55e' : '1px solid #22c55e',
              zIndex: 25,
            }}
          >
            {guide.label && (
              <div
                className="absolute text-[9px] text-[#22c55e] whitespace-nowrap"
                style={{ left: 0, top: -14 }}
              >
                {guide.label}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

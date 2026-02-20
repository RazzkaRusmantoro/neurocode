'use client';

import { useState, useCallback, useRef } from 'react';

export default function VisualTreeCanvas() {
  // Visual tree canvas panning state
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Visual tree canvas drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y,
      });
    }
  }, [panPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full" style={{ height: 'calc(100vh - 400px)', minHeight: '600px' }}>
      <div
        ref={canvasRef}
        className="w-full h-full border border-[#262626] bg-[#1a1a1d] relative overflow-hidden"
        style={{
          cursor: isDragging ? 'grabbing' : 'default',
          backgroundImage: `
            radial-gradient(circle, #2a2a2d 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: `${panPosition.x}px ${panPosition.y}px`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Canvas content will be rendered here */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${panPosition.x}px, ${panPosition.y}px)`,
          }}
        >
          {/* Visual tree nodes will be rendered here */}
        </div>
      </div>
    </div>
  );
}


import React, { useMemo } from 'react';
import { Shape } from 'react-konva';

interface VirtualizedPixelRendererProps {
  colorLookupMap: Map<string, { color: string; colorName: string | undefined }>;
  visibleBounds: { minX: number; minY: number; maxX: number; maxY: number };
  gridSize: number;
}

export const VirtualizedPixelRenderer: React.FC<VirtualizedPixelRendererProps> = ({
  colorLookupMap,
  visibleBounds,
  gridSize,
}) => {
  // Pre-compute visible pixels for better performance
  const visiblePixelData = useMemo(() => {
    const pixels: Array<{ x: number; y: number; color: string }> = [];
    const { minX, minY, maxX, maxY } = visibleBounds;
    
    colorLookupMap.forEach((colorInfo, key) => {
      const [x, y] = key.split(" - ").map(Number);
      
      // Only include pixels that are in the visible area
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        pixels.push({
          x: x * gridSize,
          y: y * gridSize,
          color: colorInfo.color,
        });
      }
    });
    
    return pixels;
  }, [colorLookupMap, visibleBounds, gridSize]);

  const sceneFunc = useMemo(() => {
    return (context: any, shape: any) => {
      // Batch drawing operations for better performance
      const colorGroups = new Map<string, Array<{ x: number; y: number }>>();
      
      // Group pixels by color to minimize context switches
      visiblePixelData.forEach(({ x, y, color }) => {
        if (!colorGroups.has(color)) {
          colorGroups.set(color, []);
        }
        colorGroups.get(color)!.push({ x, y });
      });
      
      // Draw pixels grouped by color
      colorGroups.forEach((positions, color) => {
        context.fillStyle = color;
        context.beginPath();
        
        positions.forEach(({ x, y }) => {
          context.rect(x, y, gridSize, gridSize);
        });
        
        context.fill();
      });
      
      // Tell Konva that we're done drawing
      context.fillStrokeShape(shape);
    };
  }, [visiblePixelData, gridSize]);

  return (
    <Shape
      sceneFunc={sceneFunc}
      listening={false} // Disable event handling for performance
      perfectDrawEnabled={false} // Disable pixel-perfect drawing for performance
    />
  );
};
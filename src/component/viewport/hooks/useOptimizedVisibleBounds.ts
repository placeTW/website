import { useMemo, useRef, useCallback } from 'react';
import Konva from 'konva';

interface VisibleBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface ViewportDimensions {
  width: number;
  height: number;
}

export const useOptimizedVisibleBounds = (
  stageRef: React.RefObject<Konva.Stage>,
  gridSize: number,
  dimensions: ViewportDimensions,
  zoomLevel: number
) => {
  const lastBoundsRef = useRef<VisibleBounds>({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  const lastCalculationParams = useRef({
    x: 0,
    y: 0,
    scaleX: 1,
    width: 0,
    height: 0
  });
  const lastUpdateTime = useRef<number>(0);

  const visibleBounds = useMemo(() => {
    if (!stageRef.current) {
      return lastBoundsRef.current;
    }

    const stage = stageRef.current;
    const stageX = stage.x();
    const stageY = stage.y();
    const scaleX = stage.scaleX();
    const { width, height } = dimensions;

    // Check if calculation parameters have changed significantly
    const params = lastCalculationParams.current;
    const currentTime = performance.now();
    
    // Make position threshold much smaller and scale-aware for smooth dragging
    // At higher zoom levels, even small pixel movements reveal/hide content
    const positionThreshold = Math.max(0.5, gridSize * 0.01 / scaleX); // Much more sensitive
    const scaleThreshold = 0.05; // 5% change in scale
    const maxTimeBetweenUpdates = 100; // Force update every 100ms during interactions
    
    const hasPositionChange = 
      Math.abs(stageX - params.x) > positionThreshold ||
      Math.abs(stageY - params.y) > positionThreshold;
      
    const hasScaleChange = 
      Math.abs(scaleX - params.scaleX) > params.scaleX * scaleThreshold;
      
    const hasSizeChange = 
      width !== params.width || height !== params.height;
      
    const hasTimeBasedUpdate = 
      (currentTime - lastUpdateTime.current) > maxTimeBetweenUpdates && 
      (hasPositionChange || hasScaleChange);

    const hasSignificantChange = 
      hasPositionChange || hasScaleChange || hasSizeChange || hasTimeBasedUpdate;

    if (!hasSignificantChange && lastBoundsRef.current.minX !== 0) {
      // Return cached bounds if no significant change
      return lastBoundsRef.current;
    }

    // Calculate new bounds
    const viewportWidth = width / scaleX;
    const viewportHeight = height / scaleX;

    // Calculate visible area in grid coordinates
    const minX = Math.floor(-stageX / (gridSize * scaleX)) - 1;
    const minY = Math.floor(-stageY / (gridSize * scaleX)) - 1;
    const maxX = Math.ceil((-stageX + viewportWidth) / (gridSize * scaleX)) + 1;
    const maxY = Math.ceil((-stageY + viewportHeight) / (gridSize * scaleX)) + 1;

    const newBounds = { minX, minY, maxX, maxY };
    
    // Update cache
    lastBoundsRef.current = newBounds;
    lastCalculationParams.current = {
      x: stageX,
      y: stageY,
      scaleX,
      width,
      height
    };
    lastUpdateTime.current = currentTime;

    return newBounds;
  }, [stageRef, gridSize, dimensions, zoomLevel]);

  // Force recalculation function for when we need to update immediately
  const forceRecalculation = useCallback(() => {
    lastCalculationParams.current = { x: 0, y: 0, scaleX: 0, width: 0, height: 0 };
    lastUpdateTime.current = 0;
  }, []);

  return { visibleBounds, forceRecalculation };
};
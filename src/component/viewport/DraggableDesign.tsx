import Konva from "konva";
import React, { useCallback, useMemo, useRef, useEffect } from "react";
import { Group, Rect } from "react-konva";
import { Design } from "../../types/art-tool";
import { GRID_SIZE } from "./constants";

// Visual feedback styles for different states
const getIndicatorStyle = (isDragging: boolean, isDragModeEnabled: boolean) => {
  if (isDragging) {
    return {
      stroke: "#ff6b6b",
      strokeWidth: 3,
      dash: [2, 2],
      fill: "rgba(255, 107, 107, 0.15)",
      opacity: 0.8,
    };
  }
  
  if (isDragModeEnabled) {
    return {
      stroke: "#ffa500",
      strokeWidth: 2.5,
      dash: [6, 2],
      fill: "rgba(255, 165, 0, 0.12)",
      opacity: 1,
    };
  }
  
  // No indicator if not dragging or in drag mode
  return null;
};

interface DraggableDesignProps {
  design: Design;
  isDragging?: boolean;
  isDragModeEnabled?: boolean;
  onDragStart: (designId: number) => void;
  onDragMove: (designId: number, x: number, y: number) => void;
  onDragEnd: (designId: number, x: number, y: number) => void;
  onDesignClick: (designId: number) => void;
  visible: boolean;
  isDragEnabled: boolean;
}

const DraggableDesign: React.FC<DraggableDesignProps> = ({
  design,
  isDragging = false,
  isDragModeEnabled = false,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDesignClick,
  visible,
  isDragEnabled,
}) => {
  const groupRef = useRef<Konva.Group>(null);

  // Sync group position with design coordinates from database
  useEffect(() => {
    if (groupRef.current && !isDragging) {
      const newX = design.x * GRID_SIZE;
      const newY = design.y * GRID_SIZE;
      const currentX = groupRef.current.x();
      const currentY = groupRef.current.y();
      
      // Only update if position actually changed to avoid unnecessary renders
      if (Math.abs(currentX - newX) > 0.1 || Math.abs(currentY - newY) > 0.1) {
        groupRef.current.x(newX);
        groupRef.current.y(newY);
        groupRef.current.getLayer()?.batchDraw();
      }
    }
  }, [design.x, design.y, isDragging, design.id]); // Add design.id to ensure fresh updates

  // Calculate design bounds
  const designBounds = useMemo(() => {
    if (!design.pixels || design.pixels.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }

    const minX = Math.min(...design.pixels.map(p => p.x));
    const minY = Math.min(...design.pixels.map(p => p.y));
    const maxX = Math.max(...design.pixels.map(p => p.x));
    const maxY = Math.max(...design.pixels.map(p => p.y));

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  }, [design.pixels]);

  const handleDragStart = useCallback(() => {
    onDragStart(design.id);
  }, [design.id, onDragStart]);

  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const target = e.target as Konva.Group;
    const x = Math.round(target.x() / GRID_SIZE);
    const y = Math.round(target.y() / GRID_SIZE);
    onDragMove(design.id, x, y);
  }, [design.id, onDragMove]);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const target = e.target as Konva.Group;
    const x = Math.round(target.x() / GRID_SIZE);
    const y = Math.round(target.y() / GRID_SIZE);
    
    // Snap to grid
    target.x(x * GRID_SIZE);
    target.y(y * GRID_SIZE);
    
    onDragEnd(design.id, x, y);
  }, [design.id, onDragEnd]);

  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onDesignClick(design.id);
  }, [design.id, onDesignClick]);


  if (!visible) {
    return null;
  }

  return (
    <Group
      ref={groupRef}
      x={design.x * GRID_SIZE}
      y={design.y * GRID_SIZE}
      draggable={isDragEnabled && isDragModeEnabled}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
    >
      {/* Invisible hitbox for dragging */}
      <Rect
        x={designBounds.minX * GRID_SIZE}
        y={designBounds.minY * GRID_SIZE}
        width={designBounds.width * GRID_SIZE}
        height={designBounds.height * GRID_SIZE}
        fill="transparent"
        strokeEnabled={false}
      />
      
      {/* Drag indicators */}
      {(isDragging || isDragModeEnabled) && (() => {
        const indicatorStyle = getIndicatorStyle(isDragging, isDragModeEnabled);
        return indicatorStyle ? (
          <Rect
            x={designBounds.minX * GRID_SIZE - 2}
            y={designBounds.minY * GRID_SIZE - 2}
            width={designBounds.width * GRID_SIZE + 4}
            height={designBounds.height * GRID_SIZE + 4}
            {...indicatorStyle}
            listening={false}
          />
        ) : null;
      })()}
    </Group>
  );
};

export default DraggableDesign;
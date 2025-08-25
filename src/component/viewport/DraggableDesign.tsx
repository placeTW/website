import Konva from "konva";
import React, { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { Group, Rect } from "react-konva";
import { Design } from "../../types/art-tool";
import { GRID_SIZE } from "./constants";

// Minimum hitbox size for small designs (in grid units)
const MIN_HITBOX_SIZE = 3;

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
  isDragModeEnabled = false,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDesignClick,
  visible,
  isDragEnabled,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  // Track Konva's internal dragging state for accurate synchronization
  const [isKonvaDragging, setIsKonvaDragging] = useState(false);

  // SINGLE RESPONSIBILITY: Sync database position -> visual position when not dragging
  useEffect(() => {
    if (groupRef.current && !isKonvaDragging) {
      const targetX = design.x * GRID_SIZE;
      const targetY = design.y * GRID_SIZE;
      
      groupRef.current.x(targetX);
      groupRef.current.y(targetY);
      groupRef.current.getLayer()?.batchDraw();
    }
  }, [design.x, design.y, design.id, isKonvaDragging]);

  // Calculate design bounds with minimum hitbox size for better dragging
  const designBounds = useMemo(() => {
    if (!design.pixels || design.pixels.length === 0) {
      return { 
        minX: 0, minY: 0, maxX: 0, maxY: 0, 
        width: MIN_HITBOX_SIZE, height: MIN_HITBOX_SIZE,
        hitboxMinX: -Math.floor(MIN_HITBOX_SIZE / 2),
        hitboxMinY: -Math.floor(MIN_HITBOX_SIZE / 2),
        hitboxWidth: MIN_HITBOX_SIZE,
        hitboxHeight: MIN_HITBOX_SIZE
      };
    }

    const minX = Math.min(...design.pixels.map(p => p.x));
    const minY = Math.min(...design.pixels.map(p => p.y));
    const maxX = Math.max(...design.pixels.map(p => p.x));
    const maxY = Math.max(...design.pixels.map(p => p.y));
    
    const actualWidth = maxX - minX + 1;
    const actualHeight = maxY - minY + 1;
    
    // Ensure minimum hitbox size for better dragging experience
    const hitboxWidth = Math.max(actualWidth, MIN_HITBOX_SIZE);
    const hitboxHeight = Math.max(actualHeight, MIN_HITBOX_SIZE);
    
    // Center the hitbox on the design
    const hitboxMinX = minX - Math.floor((hitboxWidth - actualWidth) / 2);
    const hitboxMinY = minY - Math.floor((hitboxHeight - actualHeight) / 2);

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: actualWidth,
      height: actualHeight,
      hitboxMinX,
      hitboxMinY,
      hitboxWidth,
      hitboxHeight,
    };
  }, [design.pixels]);

  const handleDragStart = useCallback(() => {
    setIsKonvaDragging(true);
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
    
    // Snap to grid immediately
    target.x(x * GRID_SIZE);
    target.y(y * GRID_SIZE);
    target.getLayer()?.batchDraw();
    
    // Clear Konva dragging state BEFORE calling onDragEnd
    // This prevents race conditions with database updates
    setIsKonvaDragging(false);
    
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
      draggable={isDragEnabled && isDragModeEnabled}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
    >
      {/* Invisible hitbox for dragging - uses larger area for small designs */}
      <Rect
        x={designBounds.hitboxMinX * GRID_SIZE}
        y={designBounds.hitboxMinY * GRID_SIZE}
        width={designBounds.hitboxWidth * GRID_SIZE}
        height={designBounds.hitboxHeight * GRID_SIZE}
        fill="transparent"
        strokeEnabled={false}
      />
      
      {/* Drag indicators - show around actual design, not hitbox */}
      {(isKonvaDragging || isDragModeEnabled) && (() => {
        const indicatorStyle = getIndicatorStyle(isKonvaDragging, isDragModeEnabled);
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
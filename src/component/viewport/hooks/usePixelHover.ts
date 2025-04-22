import { useState, useRef } from "react";
import Konva from "konva";
import { GRID_SIZE } from "../constants";

export const usePixelHover = () => {
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null);
  const coordinatesRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const scale = stage.scaleX();
    const x = Math.floor((pointer.x - stage.x()) / (GRID_SIZE * scale));
    const y = Math.floor((pointer.y - stage.y()) / (GRID_SIZE * scale));
    setHoveredPixel({ x, y });

    if (coordinatesRef.current) {
      coordinatesRef.current.style.left = `${pointer.x + 10}px`;
      coordinatesRef.current.style.top = `${pointer.y + 10}px`;
    }
  };

  return { hoveredPixel, coordinatesRef, handleMouseMove };
};
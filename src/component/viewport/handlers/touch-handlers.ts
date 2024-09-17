// src/component/viewport/handlers/touch-handlers.ts

import Konva from "konva";
import { GRID_SIZE } from "../constants";
import React from "react";

export const useTouchHandlers = (
  onPixelPaint?: (x: number, y: number) => void,
  isEditing?: boolean,
  setStageDraggable?: React.Dispatch<React.SetStateAction<boolean>>,
  stageRef?: React.RefObject<Konva.Stage>,
  onTransform?: () => void, // Add this parameter
) => {
  const isTouching = React.useRef(false);
  const lastCenter = React.useRef<{ x: number; y: number } | null>(null);
  const lastDist = React.useRef<number>(0);

  return {
    onTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => {
      const stage = stageRef?.current;
      if (!stage) return;

      if (e.evt.touches.length === 1 && isEditing) {
        e.evt.preventDefault();
        setStageDraggable && setStageDraggable(false); // Disable panning
        isTouching.current = true;

        const pos = stage.getPointerPosition();
        if (!pos) return;
        const scale = stage.scaleX();
        const x = Math.floor((pos.x - stage.x()) / (GRID_SIZE * scale));
        const y = Math.floor((pos.y - stage.y()) / (GRID_SIZE * scale));

        onPixelPaint?.(x, y); // Paint the initial pixel
      } else if (e.evt.touches.length === 2) {
        setStageDraggable && setStageDraggable(true); // Enable panning
        lastDist.current = 0; // Reset last distance for pinch-zooming
      }
    },

    onTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => {
      const stage = stageRef?.current;
      if (!stage) return;

      if (e.evt.touches.length === 1 && isEditing && onPixelPaint && isTouching.current) {
        e.evt.preventDefault();
        setStageDraggable && setStageDraggable(false); // Ensure panning is disabled

        const pos = stage.getPointerPosition();
        if (!pos) return;
        const scale = stage.scaleX();
        const x = Math.floor((pos.x - stage.x()) / (GRID_SIZE * scale));
        const y = Math.floor((pos.y - stage.y()) / (GRID_SIZE * scale));

        onPixelPaint(x, y);
      } else if (e.evt.touches.length === 2) {
        setStageDraggable && setStageDraggable(true); // Ensure panning is enabled
        e.evt.preventDefault();

        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];

        const dist = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );

        const center = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };

        if (lastDist.current === 0) {
          lastDist.current = dist;
          lastCenter.current = center;
          return;
        }

        // Continuous zoom scaling
        const scaleBy = dist / lastDist.current;
        const oldScale = stage.scaleX();
        const newScale = oldScale * scaleBy;

        const mousePointTo = {
          x: (center.x - stage.x()) / oldScale,
          y: (center.y - stage.y()) / oldScale,
        };

        stage.scale({ x: newScale, y: newScale });

        const dx = center.x - lastCenter.current!.x;
        const dy = center.y - lastCenter.current!.y;

        const newPos = {
          x: stage.x() + dx - mousePointTo.x * (newScale - oldScale),
          y: stage.y() + dy - mousePointTo.y * (newScale - oldScale),
        };

        stage.position(newPos);
        stage.batchDraw();

        lastDist.current = dist;
        lastCenter.current = center;

        // Call onTransform to update visible tiles
        onTransform && onTransform();
      }
    },

    onTouchEnd: (e: Konva.KonvaEventObject<TouchEvent>) => {
      isTouching.current = false;
      const stage = stageRef?.current;
      if (stage) {
        lastDist.current = 0;
        lastCenter.current = null;
      }

      if (e.evt.touches.length === 0) {
        setStageDraggable && setStageDraggable(false);
      } else if (e.evt.touches.length === 1 && isEditing) {
        setStageDraggable && setStageDraggable(false);
      }

      // Ensure the grid updates after touch ends
      onTransform && onTransform();
    },
  };
};

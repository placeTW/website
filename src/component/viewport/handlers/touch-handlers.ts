// src/component/viewport/handlers/touch-handlers.ts

import Konva from "konva";
import { GRID_SIZE } from "../constants";
import React from "react";

export const useTouchHandlers = (
  onPixelPaint?: (x: number, y: number) => void,
  isEditing?: boolean,
  setStageDraggable?: React.Dispatch<React.SetStateAction<boolean>>,
  stageRef?: React.RefObject<Konva.Stage>,
) => {
  const isTouching = React.useRef(false);

  return {
    onTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => {
      const stage = stageRef?.current;
      if (!stage) return;

      if (e.evt.touches.length === 1 && isEditing) {
        e.evt.preventDefault();
        setStageDraggable && setStageDraggable(false); // Disable dragging
        isTouching.current = true;

        const pos = stage.getPointerPosition();
        if (!pos) return;
        const scale = stage.scaleX();
        const x = Math.floor((pos.x - stage.x()) / (GRID_SIZE * scale));
        const y = Math.floor((pos.y - stage.y()) / (GRID_SIZE * scale));

        onPixelPaint?.(x, y); // Paint the initial pixel
      } else if (e.evt.touches.length >= 2) {
        setStageDraggable && setStageDraggable(true); // Enable dragging
      }
    },

    onTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => {
      const stage = stageRef?.current;
      if (!stage) return;

      if (e.evt.touches.length === 1 && isEditing && onPixelPaint && isTouching.current) {
        e.evt.preventDefault();
        setStageDraggable && setStageDraggable(false); // Ensure dragging is disabled

        const pos = stage.getPointerPosition();
        if (!pos) return;
        const scale = stage.scaleX();
        const x = Math.floor((pos.x - stage.x()) / (GRID_SIZE * scale));
        const y = Math.floor((pos.y - stage.y()) / (GRID_SIZE * scale));

        onPixelPaint(x, y);
      } else if (e.evt.touches.length >= 2) {
        setStageDraggable && setStageDraggable(true); // Ensure dragging is enabled
        e.evt.preventDefault();

        // Handle zooming (pinch to zoom)
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

        let lastDist = parseFloat(stage.attrs['data-lastDist'] || "0");
        let lastCenter = JSON.parse(stage.attrs['data-lastCenter'] || "{}");

        if (lastDist === 0) {
          lastDist = dist;
          lastCenter = center;
        } else {
          const scaleBy = dist / lastDist;
          const oldScale = stage.scaleX();
          const newScale = oldScale * scaleBy;

          const mousePointTo = {
            x: (center.x - stage.x()) / oldScale,
            y: (center.y - stage.y()) / oldScale,
          };

          stage.scale({ x: newScale, y: newScale });

          const dx = center.x - lastCenter.x;
          const dy = center.y - lastCenter.y;

          const newPos = {
            x: stage.x() + dx - mousePointTo.x * (newScale - oldScale),
            y: stage.y() + dy - mousePointTo.y * (newScale - oldScale),
          };

          stage.position(newPos);
          stage.batchDraw();
        }

        stage.attrs['data-lastDist'] = dist.toString();
        stage.attrs['data-lastCenter'] = JSON.stringify(center);
      }
    },

    onTouchEnd: (e: Konva.KonvaEventObject<TouchEvent>) => {
      isTouching.current = false;
      const stage = stageRef?.current;
      if (stage) {
        stage.attrs['data-lastDist'] = "0";
        stage.attrs['data-lastCenter'] = "{}";
      }

      if (e.evt.touches.length === 0) {
        // No touches remaining
        setStageDraggable && setStageDraggable(!isEditing);
      } else if (e.evt.touches.length === 1 && isEditing) {
        // One touch remains
        setStageDraggable && setStageDraggable(false);
      }
    },
  };
};

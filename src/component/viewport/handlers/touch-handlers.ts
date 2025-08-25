import Konva from "konva";
import React from "react";
import { GRID_SIZE } from "../constants";

export const useTouchHandlers = (
  onPixelPaint?: (x: number, y: number, erase: boolean) => void,
  isEditing?: boolean,
  isDragging?: boolean,
  setStageDraggable?: React.Dispatch<React.SetStateAction<boolean>>,
  stageRef?: React.RefObject<Konva.Stage>,
  onTransform?: () => void,
) => {
  const isTouching = React.useRef(false);
  const lastCenter = React.useRef<{ x: number; y: number } | null>(null);
  const lastDist = React.useRef<number>(0);

  const handlePanning = (e: TouchEvent, stage: Konva.Stage) => {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1] || touch1;
    const center = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };

    if (lastCenter.current) {
      const dx = center.x - lastCenter.current.x;
      const dy = center.y - lastCenter.current.y;
      const newPos = {
        x: stage.x() + dx,
        y: stage.y() + dy,
      };
      stage.position(newPos);
    }

    lastCenter.current = center;
  };

  const handleZooming = (e: TouchEvent, stage: Konva.Stage) => {
    if (e.touches.length !== 2) return;

    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const dist = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY,
    );

    if (lastDist.current === 0) {
      lastDist.current = dist;
      return;
    }

    const scaleBy = dist / lastDist.current;
    const oldScale = stage.scaleX();
    const newScale = oldScale * scaleBy;

    const center = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };

    const mousePointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);

    lastDist.current = dist;
  };

  const handlePainting = (stage: Konva.Stage) => {
    if (!onPixelPaint) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;
    const scale = stage.scaleX();
    const x = Math.floor((pos.x - stage.x()) / (GRID_SIZE * scale));
    const y = Math.floor((pos.y - stage.y()) / (GRID_SIZE * scale));

    onPixelPaint(x, y, false);
  };

  return {
    onTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => {
      const stage = stageRef?.current;
      if (!stage) return;

      e.evt.preventDefault();
      isTouching.current = true;

      if (e.evt.touches.length === 2) {
        setStageDraggable?.(false);
        lastDist.current = 0;
      } else if (e.evt.touches.length === 1) {
        if (isEditing) {
          setStageDraggable?.(false);
          handlePainting(stage);
        } else {
          setStageDraggable?.(true);
        }
      }
    },

    onTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => {
      const stage = stageRef?.current;
      if (!stage) return;

      e.evt.preventDefault();

      if (e.evt.touches.length === 2) {
        setStageDraggable?.(false);
        handlePanning(e.evt, stage);
        handleZooming(e.evt, stage);
        stage.batchDraw();
        onTransform?.();
      } else if (e.evt.touches.length === 1 && isTouching.current) {
        if (isEditing) {
          setStageDraggable?.(false);
          handlePainting(stage);
        } else {
          setStageDraggable?.(true);
          handlePanning(e.evt, stage);
          stage.batchDraw();
          onTransform?.();
        }
      }
    },

    onTouchEnd: () => {
      isTouching.current = false;
      const stage = stageRef?.current;
      if (stage) {
        lastDist.current = 0;
        lastCenter.current = null;
      }

      setStageDraggable?.(false);
      onTransform?.();
    },
  };
};

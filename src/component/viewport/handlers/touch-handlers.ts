import Konva from "konva";
import React from "react";
import { GRID_SIZE } from "../constants";

export const useTouchHandlers = (
  onPixelPaint?: (x: number, y: number) => void,
  isEditing?: boolean,
  setStageDraggable?: React.Dispatch<React.SetStateAction<boolean>>,
  stageRef?: React.RefObject<Konva.Stage>,
  onTransform?: () => void,
) => {
  const isTouching = React.useRef(false);
  const lastCenter = React.useRef<{ x: number; y: number } | null>(null);
  const lastDist = React.useRef<number>(0);
  const lastSingleTouch = React.useRef<{ x: number; y: number } | null>(null);

  const handlePanning = (
    e: TouchEvent,
    stage: Konva.Stage,
    isSingleTouch: boolean,
  ) => {
    let center;
    if (isSingleTouch) {
      const touch = e.touches[0];
      center = { x: touch.clientX, y: touch.clientY };
    } else {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
    }

    const lastPos = isSingleTouch
      ? lastSingleTouch.current
      : lastCenter.current;
    if (lastPos) {
      const dx = center.x - lastPos.x;
      const dy = center.y - lastPos.y;
      const newPos = {
        x: stage.x() + dx,
        y: stage.y() + dy,
      };
      stage.position(newPos);
    }

    if (isSingleTouch) {
      lastSingleTouch.current = center;
    } else {
      lastCenter.current = center;
    }
  };

  const handleZooming = (e: TouchEvent, stage: Konva.Stage) => {
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

    const pointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: center.x - pointTo.x * newScale,
      y: center.y - pointTo.y * newScale,
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

    onPixelPaint(x, y);
  };

  return {
    onTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => {
      const stage = stageRef?.current;
      if (!stage) return;

      if (e.evt.touches.length === 1) {
        if (isEditing) {
          e.evt.preventDefault();
          setStageDraggable?.(false);
          isTouching.current = true;
          handlePainting(stage);
        } else {
          setStageDraggable?.(true);
          lastSingleTouch.current = {
            x: e.evt.touches[0].clientX,
            y: e.evt.touches[0].clientY,
          };
        }
      } else if (e.evt.touches.length === 2) {
        e.evt.preventDefault();
        setStageDraggable?.(true);
        lastDist.current = 0;
        lastCenter.current = null;
      }
    },

    onTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => {
      const stage = stageRef?.current;
      if (!stage) return;

      if (e.evt.touches.length === 1) {
        if (isEditing && isTouching.current) {
          e.evt.preventDefault();
          setStageDraggable?.(false);
          handlePainting(stage);
        } else if (!isEditing) {
          e.evt.preventDefault();
          handlePanning(e.evt, stage, true);
        }
      } else if (e.evt.touches.length === 2) {
        e.evt.preventDefault();
        setStageDraggable?.(true);
        handlePanning(e.evt, stage, false);
        handleZooming(e.evt, stage);
      }

      stage.batchDraw();
      onTransform?.();
    },

    onTouchEnd: (e: Konva.KonvaEventObject<TouchEvent>) => {
      isTouching.current = false;
      const stage = stageRef?.current;
      if (stage) {
        lastDist.current = 0;
        lastCenter.current = null;
        lastSingleTouch.current = null;
      }

      if (
        e.evt.touches.length === 0 ||
        (e.evt.touches.length === 1 && isEditing)
      ) {
        setStageDraggable?.(false);
      }

      onTransform?.();
    },
  };
};

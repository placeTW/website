import { useRef } from "react";
import Konva from "konva";
import { GRID_SIZE } from "../constants";

export const usePanAndZoom = (
  onPixelPaint?: (x: number, y: number) => void,
  isEditing?: boolean
) => {
  const stageRef = useRef<Konva.Stage | null>(null);
  const isPanning = useRef(false);
  const isPainting = useRef(false);
  const initialTouchPos = useRef<{ x: number; y: number } | null>(null);
  const initialStagePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.1;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);
    stage.batchDraw();
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    if (isPainting.current && isEditing && onPixelPaint) {
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const scale = stage.scaleX();
      const x = Math.floor((pointer.x - stage.x()) / (GRID_SIZE * scale));
      const y = Math.floor((pointer.y - stage.y()) / (GRID_SIZE * scale));
      onPixelPaint(x, y);
    }

    if (isPanning.current && initialTouchPos.current) {
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const dx = pointer.x - initialTouchPos.current.x;
      const dy = pointer.y - initialTouchPos.current.y;

      stage.position({
        x: initialStagePos.current.x + dx,
        y: initialStagePos.current.y + dy,
      });
      stage.batchDraw();
    }
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    if (e.evt.button === 0 && isEditing) {
      // Left-click
      isPainting.current = true;
    } else if (e.evt.button === 2) {
      // Right-click
      isPanning.current = true;
      initialTouchPos.current = stage.getPointerPosition(); // Capture initial mouse position
      initialStagePos.current = stage.position(); // Capture initial stage position
    }
  };

  const handleMouseUp = () => {
    isPainting.current = false;
    isPanning.current = false;
  };

  return { stageRef, handleWheel, handleMouseMove, handleMouseDown, handleMouseUp };
};
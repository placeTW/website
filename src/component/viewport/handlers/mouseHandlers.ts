import Konva from "konva";
import { GRID_SIZE } from "../constants";

export const mouseHandlers = (
  onPixelPaint?: (x: number, y: number) => void,
  isEditing?: boolean,
  stageRef?: React.RefObject<Konva.Stage>,
  setHoveredPixel?: React.Dispatch<
    React.SetStateAction<{ x: number; y: number } | null>
  >,
  coordinatesRef?: React.RefObject<HTMLDivElement>,
) => ({
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage || !stageRef?.current) return;

    if (e.evt.button === 0 && isEditing) {
      // Left-click - Start painting
      stage.container().style.cursor = "crosshair";
      const pos = stage.getPointerPosition();
      if (pos) {
        const scale = stage.scaleX();
        const x = Math.floor((pos.x - stage.x()) / (GRID_SIZE * scale));
        const y = Math.floor((pos.y - stage.y()) / (GRID_SIZE * scale));
        onPixelPaint && onPixelPaint(x, y);
      }
    } else if (e.evt.button === 2) {
      // Right-click - Start panning
      stage.container().style.cursor = "grabbing";
      stage.draggable(true);
    }
  },
  onMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage || !stageRef?.current) return;

    // Stop painting or panning
    stage.container().style.cursor = "default";
    stage.draggable(false);
  },
  onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage || !stageRef?.current) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const scale = stage.scaleX();
    const x = Math.floor((pointer.x - stage.x()) / (GRID_SIZE * scale));
    const y = Math.floor((pointer.y - stage.y()) / (GRID_SIZE * scale));
    setHoveredPixel && setHoveredPixel({ x, y });

    if (coordinatesRef?.current) {
      coordinatesRef.current.style.left = `${pointer.x + 10}px`;
      coordinatesRef.current.style.top = `${pointer.y + 10}px`;
    }

    if (!isEditing || !onPixelPaint) return;

    // Continue painting if mouse is down and isEditing is true
    if (e.evt.buttons === 1) {
      const pos = stage.getPointerPosition();
      if (pos) {
        const scale = stage.scaleX();
        const x = Math.floor((pos.x - stage.x()) / (GRID_SIZE * scale));
        const y = Math.floor((pos.y - stage.y()) / (GRID_SIZE * scale));
        onPixelPaint(x, y);
      }
    }
  },
  onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault(); // Prevent default context menu
  },
});

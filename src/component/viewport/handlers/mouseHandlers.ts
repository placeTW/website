import Konva from "konva";
import { GRID_SIZE } from "../constants";

Konva.dragButtons = [0, 2];

export const mouseHandlers = (
  onPixelPaint?: (x: number, y: number) => void,
  isEditing?: boolean,
  stageRef?: React.RefObject<Konva.Stage>,
  setHoveredPixel?: React.Dispatch<
    React.SetStateAction<{ x: number; y: number } | null>
  >,
  coordinatesRef?: React.RefObject<HTMLDivElement>,
  selection?: { x: number; y: number; width: number; height: number } | null,
  setSelection?: React.Dispatch<
    React.SetStateAction<{ x: number; y: number; width: number; height: number } | null>
  >,
  onCopy?: () => void,
  onPaste?: (x: number, y: number) => void,
) => {
  let mousePosition = { x: 0, y: 0 }; // To store the latest mouse position

  return {
    onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage || !stageRef?.current) return;

      if (e.evt.button === 2 && !e.evt.ctrlKey) {
        // Right-click - Start panning (only if Ctrl is not held down)
        stage.container().style.cursor = "grabbing";
        stage.draggable(true); // Enable dragging for panning
      } else if (e.evt.button === 0 && isEditing) {
        const pos = stage.getPointerPosition();
        if (pos) {
          const scale = stage.scaleX();
          const x = Math.floor((pos.x - stage.x()) / (GRID_SIZE * scale));
          const y = Math.floor((pos.y - stage.y()) / (GRID_SIZE * scale));

          if (e.evt.ctrlKey && setSelection) {
            // Start rectangle selection
            setSelection({ x, y, width: 0, height: 0 });
            stage.draggable(false); // Disable dragging for selection
          } else {
            // Start painting
            stage.container().style.cursor = "crosshair";
            stage.draggable(false); // Disable dragging while painting
            onPixelPaint && onPixelPaint(x, y);
          }
        }
      }
    },

    onMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage || !stageRef?.current) return;

      // Stop painting or panning
      stage.container().style.cursor = "default";

      if (!e.evt.ctrlKey) {
        stage.draggable(true); // Re-enable dragging after painting or panning
      }

      // Here we don't clear the selection, allowing it to persist after the mouse is released
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

      mousePosition = { x, y }; // Update the latest mouse position

      if (coordinatesRef?.current) {
        coordinatesRef.current.style.left = `${pointer.x + 10}px`;
        coordinatesRef.current.style.top = `${pointer.y + 10}px`;
      }

      if (!isEditing || !onPixelPaint) return;

      if (e.evt.ctrlKey && selection && setSelection) {
        // Update rectangle selection
        const width = x - selection.x + 1;
        const height = y - selection.y + 1;
        setSelection({ ...selection, width, height });
      } else if (e.evt.buttons === 1) {
        // Continue painting if mouse is down and isEditing is true
        onPixelPaint(x, y);
      }
    },

    onKeyDown: (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "c" && onCopy) {
        onCopy(); // Handle copy
      } else if (e.ctrlKey && e.key === "v" && onPaste) {
        // Use the stored mouse position to handle pasting
        onPaste(mousePosition.x, mousePosition.y); // Handle paste
      }
    },

    onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault(); // Prevent default context menu
    },
  };
};

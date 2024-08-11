import React, { useRef } from 'react';
import Konva from "konva";
import { GRID_SIZE } from "../constants";
import UndoManager from '../../viewport/utils/undo-manager';

Konva.dragButtons = [0, 2];  // Enable dragging with left (0) and right (2) mouse buttons

// Create an instance of UndoManager with a specified limit for undo history
const undoManager = new UndoManager(10); // Adjust the limit value as needed

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
  const mousePosition = useRef({ x: 0, y: 0 }); // To store the latest mouse position
  const isMouseLeftDown = useRef(false); // Track the left mouse button state
  const isSelecting = useRef(false); // Track whether we are in selection mode

  return {
    onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage || !stageRef?.current) return;

      // Check if the left mouse button is down (button === 0)
      if (e.evt.button === 0) {
        isMouseLeftDown.current = true; // Set flag when left mouse button is down

        if (isEditing) {
          const pos = stage.getPointerPosition();
          if (pos) {
            const scale = stage.scaleX();
            const x = Math.floor((pos.x - stage.x()) / (GRID_SIZE * scale));
            const y = Math.floor((pos.y - stage.y()) / (GRID_SIZE * scale));

            if (e.evt.ctrlKey && setSelection) {
              // Start a new rectangle selection
              setSelection({ x, y, width: 0, height: 0 });
              isSelecting.current = true; // Enter selection mode
              stage.draggable(false); // Disable dragging for selection
            } else {
              // Start painting
              stage.container().style.cursor = "crosshair";
              stage.draggable(false); // Disable dragging while painting
              onPixelPaint && onPixelPaint(x, y);
              // Reset the selection when painting
              setSelection && setSelection(null);
            }
          }
        }
      }
    },

    onMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage || !stageRef?.current) return;

      // Check if the left mouse button is released (button === 0)
      if (e.evt.button === 0) {
        isMouseLeftDown.current = false; // Reset flag when left mouse button is released

        // Stop painting or panning
        stage.container().style.cursor = "default";
        isSelecting.current = false; // Exit selection mode

        // Keep the selection in place after mouse up, allowing it to persist
        stage.draggable(true); // Re-enable dragging after painting or panning
      }
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

      mousePosition.current = { x, y }; // Update the latest mouse position

      if (coordinatesRef?.current) {
        coordinatesRef.current.style.left = `${pointer.x + 10}px`;
        coordinatesRef.current.style.top = `${pointer.y + 10}px`;
      }

      if (!isEditing) return;

      // Update selection only if the left mouse button is down, Ctrl is held, and we're in selection mode
      if (isSelecting.current && isMouseLeftDown.current && selection && setSelection) {
        // Update rectangle selection dimensions based on mouse movement
        const width = x - selection.x + 1;
        const height = y - selection.y + 1;
        setSelection({ ...selection, width, height });
      } else if (isMouseLeftDown.current && !e.evt.ctrlKey && onPixelPaint) {
        // Continue painting if the left mouse button is down, not in selection mode, and isEditing is true
        onPixelPaint(x, y);
      }
    },

    onKeyDown: (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "c" && onCopy) {
        onCopy(); // Handle copy
      } else if (e.ctrlKey && e.key === "v" && onPaste) {
        // Use the stored mouse position to handle pasting
        onPaste(mousePosition.current.x, mousePosition.current.y); // Handle paste
      } else if (e.ctrlKey && e.key === "z" && undoManager.hasHistory()) {
        const previousState = undoManager.undo();
        if (previousState) {
          // Perform any additional actions here, like updating the state with the undone pixels
        }
      }
    },

    onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault(); // Prevent default context menu
    },
  };
};

import React, { useRef } from 'react';
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
  const mousePosition = useRef({ x: 0, y: 0 }); // To store the latest mouse position
  const isMouseLeftDown = useRef(false); // New variable to track the left mouse button state
  const isSelecting = useRef(false); // Track whether we are in selection mode

  return {
    onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage || !stageRef?.current) return;

      console.log('Mouse Down Event:', e.evt.button, e.evt.ctrlKey);
      
      // Check if the left mouse button is down (button === 0)
      if (e.evt.button === 0) {
        isMouseLeftDown.current = true; // Set flag when left mouse button is down
        console.log('isMouseLeftDown set to true:', isMouseLeftDown.current);

        if (isEditing) {
          const pos = stage.getPointerPosition();
          if (pos) {
            const scale = stage.scaleX();
            const x = Math.floor((pos.x - stage.x()) / (GRID_SIZE * scale));
            const y = Math.floor((pos.y - stage.y()) / (GRID_SIZE * scale));
            console.log(`Pointer Position: x=${x}, y=${y}`);

            if (e.evt.ctrlKey && setSelection) {
              // Start a new rectangle selection
              setSelection({ x, y, width: 0, height: 0 });
              isSelecting.current = true; // Enter selection mode
              stage.draggable(false); // Disable dragging for selection
              console.log('Started Selection Box');
            } else {
              // Start painting
              stage.container().style.cursor = "crosshair";
              stage.draggable(false); // Disable dragging while painting
              onPixelPaint && onPixelPaint(x, y);
              console.log(`Started Drawing Pixel at x=${x}, y=${y}`);
            }
          }
        }
      }
    },

    onMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage || !stageRef?.current) return;

      console.log('Mouse Up Event:', e.evt.button);
      
      // Check if the left mouse button is released (button === 0)
      if (e.evt.button === 0) {
        isMouseLeftDown.current = false; // Reset flag when left mouse button is released
        console.log('isMouseLeftDown set to false:', isMouseLeftDown.current);

        // Stop painting or panning
        stage.container().style.cursor = "default";
        isSelecting.current = false; // Exit selection mode

        // Keep the selection in place after mouse up, allowing it to persist
        stage.draggable(true); // Re-enable dragging after painting or panning
        console.log('Stopped Drawing/Selection');
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

      console.log('Mouse Move Event:', { x, y, isMouseLeftDown: isMouseLeftDown.current, isEditing, isSelecting: isSelecting.current });

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
        console.log(`Updating Selection Box: width=${width}, height=${height}`);
      } else if (isMouseLeftDown.current && !e.evt.ctrlKey && onPixelPaint) {
        // Continue painting if the left mouse button is down, not in selection mode, and isEditing is true
        onPixelPaint(x, y);
        console.log(`Drawing Pixel at x=${x}, y=${y}`);
      }
    },

    onKeyDown: (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "c" && onCopy) {
        onCopy(); // Handle copy
        console.log('Copy Action Triggered');
      } else if (e.ctrlKey && e.key === "v" && onPaste) {
        // Use the stored mouse position to handle pasting
        onPaste(mousePosition.current.x, mousePosition.current.y); // Handle paste
        console.log('Paste Action Triggered at', mousePosition.current);
      }
    },

    onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault(); // Prevent default context menu
      console.log('Context Menu Prevented');
    },
  };
};

// src/component/viewport/handlers/mouse-handlers.ts

import React, { useRef } from "react";
import Konva from "konva";
import { GRID_SIZE } from "../constants";

Konva.dragButtons = [0, 1, 2]; // Enable dragging with left (0), middle (1), and right (2) mouse buttons

export const useMouseHandlers = (
  onPixelPaint?: (x: number, y: number, erase: boolean) => void,
  isEditing?: boolean,
  stageRef?: React.RefObject<Konva.Stage>,
  setHoveredPixel?: React.Dispatch<
    React.SetStateAction<{ x: number; y: number } | null>
  >,
  coordinatesRef?: React.RefObject<HTMLDivElement>,
  selection?: { x: number; y: number; width: number; height: number } | null,
  setSelection?: React.Dispatch<
    React.SetStateAction<{
      x: number;
      y: number;
      width: number;
      height: number;
    } | null>
  >,
  setStageDraggable?: React.Dispatch<React.SetStateAction<boolean>>,
  selectedTool?: 'paint' | 'erase' | 'select' | 'eyedropper' | 'bucket',
  dragModeDesignId?: number | null,
  onDesignPositionUpdate?: (designId: number, x: number, y: number) => void,
  setDragPreview?: React.Dispatch<React.SetStateAction<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>>,
  designsMap?: Map<number, { id: number; x: number; y: number; pixels: { x: number; y: number; color: string; designId: number }[] }>,
) => {
  const mousePosition = useRef({ x: 0, y: 0 }); // To store the latest mouse position
  const isMouseDown = useRef(false); // Track the mouse state
  const currentButton = useRef<number | null>(null); // Track which button is currently pressed
  const isSelecting = useRef(false); // Track whether we are in selection mode
  const isErasing = useRef(false); // Track whether we are in erasing mode
  const isDraggingDesign = useRef(false); // Track whether we are dragging a design
  const dragStartPosition = useRef({ x: 0, y: 0 }); // Store initial drag position

  return {
    onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage || !stageRef?.current) return;

      // Prevent the default action for the middle mouse button (button === 1)
      if (e.evt.button === 1) {
        e.evt.preventDefault();
      }

      // Check if the left, middle, or right mouse button is down (button === 0, 1, or 2)
      if (e.evt.button === 0 || e.evt.button === 1 || e.evt.button === 2) {
        isMouseDown.current = true; // Set flag when mouse button is down
        currentButton.current = e.evt.button; // Track which button is pressed

        // Handle design dragging mode
        if (dragModeDesignId && e.evt.button === 0) {
          // Left mouse button in drag mode - start dragging the design
          const pos = stage.getPointerPosition();
          if (pos) {
            const scale = stage.scaleX();
            const x = Math.floor((pos.x - stage.x()) / (GRID_SIZE * scale));
            const y = Math.floor((pos.y - stage.y()) / (GRID_SIZE * scale));
            
            // Get design information for preview
            const design = designsMap?.get(dragModeDesignId);
            if (design && setDragPreview) {
              // Calculate design dimensions
              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
              if (design.pixels && design.pixels.length > 0) {
                design.pixels.forEach((pixel) => {
                  minX = Math.min(minX, pixel.x);
                  minY = Math.min(minY, pixel.y);
                  maxX = Math.max(maxX, pixel.x);
                  maxY = Math.max(maxY, pixel.y);
                });
              } else {
                // Default size if no pixels
                minX = 0; minY = 0; maxX = 0; maxY = 0;
              }
              
              const width = maxX - minX + 1;
              const height = maxY - minY + 1;
              
              // Set initial preview at current design position
              setDragPreview({
                x: design.x,
                y: design.y,
                width,
                height
              });
            }
            
            isDraggingDesign.current = true;
            dragStartPosition.current = { x, y };
            setStageDraggable && setStageDraggable(false); // Disable stage dragging while dragging design
            stage.container().style.cursor = "move";
          }
          return; // Don't proceed with other mouse handling when in drag mode with left click
        }

        if (isEditing && e.evt.button !== 1) {
          // Exclude middle mouse button from painting operations
          const pos = stage.getPointerPosition();

          if (e.evt.button === 2) {
            isErasing.current = true; // Set flag when right mouse button is down
          } else {
            isErasing.current = false; // Reset flag when left mouse button is down
          }

          if (pos) {
            const scale = stage.scaleX();
            const x = Math.floor((pos.x - stage.x()) / (GRID_SIZE * scale));
            const y = Math.floor((pos.y - stage.y()) / (GRID_SIZE * scale));

            if ((selectedTool === 'select' || e.evt.ctrlKey) && setSelection) {
              // Start a new rectangle selection when select tool is active or Ctrl+click
              setSelection({ x, y, width: 0, height: 0 });
              isSelecting.current = true; // Enter selection mode
              setStageDraggable && setStageDraggable(false); // Disable dragging for selection
            } else {
              // Start painting
              setStageDraggable && setStageDraggable(false); // Disable dragging while painting
              onPixelPaint && onPixelPaint(x, y, isErasing.current);
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

      // Check if the left, middle, or right mouse button is released (button === 0, 1, or 2)
      if (e.evt.button === 0 || e.evt.button === 1 || e.evt.button === 2) {
        isMouseDown.current = false; // Reset flag when mouse button is released
        currentButton.current = null; // Reset current button tracking
        
        // Handle design drag end
        if (isDraggingDesign.current && e.evt.button === 0 && dragModeDesignId && onDesignPositionUpdate) {
          const pos = stage.getPointerPosition();
          if (pos) {
            const scale = stage.scaleX();
            const endX = Math.floor((pos.x - stage.x()) / (GRID_SIZE * scale));
            const endY = Math.floor((pos.y - stage.y()) / (GRID_SIZE * scale));
            
            // Calculate the delta from drag start
            const deltaX = endX - dragStartPosition.current.x;
            const deltaY = endY - dragStartPosition.current.y;
            
            // Only update if there was actual movement
            if (deltaX !== 0 || deltaY !== 0) {
              onDesignPositionUpdate(dragModeDesignId, deltaX, deltaY);
            }
          }
          
          isDraggingDesign.current = false;
          setStageDraggable && setStageDraggable(true); // Re-enable stage dragging
          stage.container().style.cursor = "crosshair";
          setDragPreview && setDragPreview(null); // Clear drag preview
          return;
        }
        
        // Only handle editing-specific cleanup for non-middle mouse buttons
        if (e.evt.button !== 1) {
          isSelecting.current = false; // Exit selection mode
          isErasing.current = false; // Reset flag when right mouse button is released
          
          // Keep the selection in place after mouse up, allowing it to persist
          setStageDraggable && setStageDraggable(true); // Re-enable dragging after painting or panning
          
          // Set cursor back to crosshair
          stage.container().style.cursor = "crosshair";
        }
      }
    },

    onMouseMove: (() => {
      let lastUpdate = 0;
      let lastHoveredPixel = { x: -1, y: -1 };
      const THROTTLE_MS = 16; // ~60fps
      
      return (e: Konva.KonvaEventObject<MouseEvent>) => {
        const now = performance.now();
        const stage = e.target.getStage();
        if (!stage || !stageRef?.current) return;

        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        
        const scale = stage.scaleX();
        const x = Math.floor((pointer.x - stage.x()) / (GRID_SIZE * scale));
        const y = Math.floor((pointer.y - stage.y()) / (GRID_SIZE * scale));
        
        // Update mouse position immediately for accuracy
        mousePosition.current = { x, y };

        // Throttle expensive operations
        if (now - lastUpdate >= THROTTLE_MS) {
          lastUpdate = now;
          
          // Only update hovered pixel if coordinates actually changed
          if (setHoveredPixel && (lastHoveredPixel.x !== x || lastHoveredPixel.y !== y)) {
            lastHoveredPixel = { x, y };
            setHoveredPixel({ x, y });
          }

          if (coordinatesRef?.current) {
            coordinatesRef.current.style.left = `${pointer.x + 10}px`;
            coordinatesRef.current.style.top = `${pointer.y + 10}px`;
          }
        }

        // Update drag preview during design dragging
        if (isDraggingDesign.current && dragModeDesignId && setDragPreview) {
          const design = designsMap?.get(dragModeDesignId);
          if (design) {
            const deltaX = x - dragStartPosition.current.x;
            const deltaY = y - dragStartPosition.current.y;
            
            // Calculate design dimensions (same as in onMouseDown)
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            if (design.pixels && design.pixels.length > 0) {
              design.pixels.forEach((pixel) => {
                minX = Math.min(minX, pixel.x);
                minY = Math.min(minY, pixel.y);
                maxX = Math.max(maxX, pixel.x);
                maxY = Math.max(maxY, pixel.y);
              });
            } else {
              minX = 0; minY = 0; maxX = 0; maxY = 0;
            }
            
            const width = maxX - minX + 1;
            const height = maxY - minY + 1;
            
            // Update preview position
            setDragPreview({
              x: design.x + deltaX,
              y: design.y + deltaY,
              width,
              height
            });
          }
        }

        if (!isEditing) return;

        // Update selection only if we're in selection mode
        if (isSelecting.current && isMouseDown.current && selection && setSelection) {
          // Update rectangle selection dimensions based on mouse movement
          const width = x - selection.x + 1;
          const height = y - selection.y + 1;
          setSelection({ ...selection, width, height });
        } else if (isMouseDown.current && currentButton.current !== 1 && selectedTool !== 'select' && !e.evt.ctrlKey && onPixelPaint) {
          // Continue painting if non-middle mouse button is down, not using select tool, not in selection mode, and isEditing is true
          onPixelPaint(x, y, isErasing.current);
        }
      };
    })(),

    // Keyboard shortcuts are now handled by the FloatingToolbar via useEditingToolbar hook
    // This avoids conflicts and provides better integration with the editing state

    onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault(); // Prevent default context menu
    },
  };
};

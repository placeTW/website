import {
  Box,
  Flex,
  IconButton,
  Spacer,
  Tab,
  TabList,
  Tabs,
} from "@chakra-ui/react";
import Konva from "konva";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaExpand } from "react-icons/fa";
import { useDesignContext } from "../../context/design-context";
import { Canvas, Pixel } from "../../types/art-tool";
import Viewport from "../viewport/Viewport";
import { CLEAR_ON_DESIGN } from "../viewport/constants";
import { ViewportHandle, ViewportPixel } from "../viewport/types";
import { FloatingToolbar, FloatingToolbarHandle } from './floating-toolbar';
import { ToolType } from './floating-toolbar/sections/ToolSelectionSection';

interface AdvancedViewportProps {
  visibleLayers: Set<number>;
  selectedCanvas: Canvas;
  isEditing?: boolean;
  editDesignId?: number | null;
  canvases?: Canvas[];
  colors?: { Color: string; color_sort: number | null; color_name: string }[];
  editedPixels?: Pixel[];
  setEditedPixels?: React.Dispatch<React.SetStateAction<Pixel[]>>;
  onSelectCanvas?: (canvas: Canvas | null) => void;
  onDesignSelect?: (designId: number) => void;
  onSubmitEdit?: (designName: string) => Promise<void>;
  onCancelEdit?: () => void;
}

const AdvancedViewport = React.forwardRef<
  {
    centerOnDesign: (
      x: number,
      y: number,
      width: number,
      height: number,
    ) => void;
    centerOnCanvas: () => void;
  },
  AdvancedViewportProps
>(
  (
    {
      isEditing = false,
      editDesignId,
      visibleLayers,
      colors = [],
      canvases,
      onSelectCanvas,
      selectedCanvas,
      editedPixels = [],
      setEditedPixels,
      onDesignSelect,
      onSubmitEdit,
      onCancelEdit,
    },
    ref,
  ) => {
    const [pixels, setPixels] = useState<ViewportPixel[]>([]);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedTool, setSelectedTool] = useState<ToolType>('paint');
    const toolbarRef = useRef<FloatingToolbarHandle>(null);
    const [selection, setSelection] = useState<{
      x: number;
      y: number;
      width: number;
      height: number;
    } | null>(null);
    const [selectedTabIndex, setSelectedTabIndex] = useState<number | null>(
      () => {
        if (selectedCanvas && canvases) {
          return canvases.findIndex((c) => c.id === selectedCanvas.id);
        }
        return null;
      },
    );
    const [layerOrder, setLayerOrder] = useState<number[]>([])

    const stageRef = useRef<Konva.Stage>(null);
    const dragInProgress = useRef(false);
    const dragPixels = useRef<ViewportPixel[]>([]);
    const previousVisibleLayersRef = useRef<Set<number>>(visibleLayers);
    const viewportRef = useRef<ViewportHandle>(null);
    
    // Centralized animation frame management to prevent accumulation
    const animationFrameRef = useRef<number | null>(null);
    
    // Cleanup animation frame on unmount
    useEffect(() => {
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, []);

    const { designs } = useDesignContext();
    
    // Get current design for toolbar
    const currentDesign = designs?.find(d => d.id === editDesignId) || null;

    const fetchPixels = useCallback(
      async (layers: number[]) => {
        if (layers.length === 0) return [];

        const fetchedPixels = await Promise.all(
          layers.map(async (layer) => {
            const design = designs?.find((d) => d.id === layer);
            if (design) {
              return design.pixels.map((pixel: Pixel) => ({
                ...pixel,
                x: pixel.x + design.x,
                y: pixel.y + design.y,
                designId: design.id,
              }));
            }
            return [];
          }),
        );

        return fetchedPixels.flat();
      },
      [designs],
    );

    const mergeWithExistingPixels = useCallback(
      (
        basePixels: ViewportPixel[],
        newEditedPixels: ViewportPixel[],
        visibleLayers: number[],
      ) => {
        const pixelMap = new Map<string, ViewportPixel>();

        basePixels.forEach((pixel) => {
          if (visibleLayers.includes(pixel.designId)) {
            pixelMap.set(`${pixel.x}-${pixel.y}-${pixel.designId}`, pixel);
          }
        });

        newEditedPixels.forEach((pixel) => {
          if (visibleLayers.includes(pixel.designId)) {
            if (pixel.color !== CLEAR_ON_DESIGN) {
              pixelMap.set(`${pixel.x}-${pixel.y}-${pixel.designId}`, pixel);
            } else {
              pixelMap.delete(`${pixel.x}-${pixel.y}-${pixel.designId}`);
            }
          }
        });

        return Array.from(pixelMap.values());
      },
      [],
    );

    // Memoized function to check if pixels arrays are different without using JSON.stringify
    const arePixelsChanged = useCallback((oldPixels: ViewportPixel[], newPixels: ViewportPixel[]) => {
      if (oldPixels.length !== newPixels.length) return true;
      
      // Create a fast lookup map for the old pixels
      const oldPixelMap = new Map<string, string>();
      oldPixels.forEach(pixel => {
        const key = `${pixel.x}-${pixel.y}-${pixel.designId}`;
        oldPixelMap.set(key, pixel.color);
      });
      
      // Check if any new pixel is different or missing
      for (const pixel of newPixels) {
        const key = `${pixel.x}-${pixel.y}-${pixel.designId}`;
        if (!oldPixelMap.has(key) || oldPixelMap.get(key) !== pixel.color) {
          return true;
        }
      }
      
      return false;
    }, []);
    
    const recalculatePixels = useCallback(async () => {
      const basePixels = await fetchPixels([...visibleLayers]);
      const mergedPixels = mergeWithExistingPixels(
        basePixels,
        editedPixels ?? [],
        [...visibleLayers],
      );
      
      // Use the optimized comparison function instead of JSON.stringify
      if (arePixelsChanged(pixels, mergedPixels)) {
        setPixels(mergedPixels);
      }
    }, [
      editedPixels,
      visibleLayers,
      fetchPixels,
      pixels,
      mergeWithExistingPixels,
      arePixelsChanged,
    ]);
    
    const schedulePixelRecalculation = useCallback(() => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        recalculatePixels();
        animationFrameRef.current = null;
      });
    }, [recalculatePixels]);

    // Handle color selection from toolbar
    const handleColorSelect = useCallback((color: string) => {
      setSelectedColor(color);
    }, []);

    // Handle tool selection from toolbar
    const handleToolChange = useCallback((tool: ToolType) => {
      setSelectedTool(tool);
    }, []);


    const handlePixelPaint = useCallback(
      (x: number, y: number, erase: boolean) => {
        if (!isEditing || !editDesignId || !setEditedPixels)
          return;

        // For erasing and eyedropper, we don't need a selected color
        const shouldErase = erase || selectedTool === 'erase';
        const isEyedropper = selectedTool === 'eyedropper';
        if (!shouldErase && !isEyedropper && !selectedColor) {
          return;
        }

        // Handle different tools
        if (selectedTool === 'eyedropper') {
          // Find pixel at the clicked coordinates
          const clickedPixel = pixels.find(pixel => 
            pixel.x === x && pixel.y === y && visibleLayers.has(pixel.designId)
          );
          
          if (clickedPixel && clickedPixel.color !== CLEAR_ON_DESIGN) {
            // Set the clicked pixel's color as selected color in both states
            const color = clickedPixel.color;
            
            // Update toolbar state using ref
            if (toolbarRef.current) {
              toolbarRef.current.setSelectedColor(color);
            }
            
            // Also update local state for consistent painting logic
            setSelectedColor(color);
          }
          return;
        }

        if (selectedTool === 'select') {
          // Selection is handled by the viewport directly
          return;
        }
        const newPixel: ViewportPixel = {
          x,
          y,
          color: !shouldErase ? selectedColor! : CLEAR_ON_DESIGN,
          designId: editDesignId,
        };

        setEditedPixels((prevEditedPixels) => {
          const updatedPixels = prevEditedPixels.filter(
            (p) => !(p.x === x && p.y === y && p.designId === editDesignId),
          );
          updatedPixels.push(newPixel);

          schedulePixelRecalculation();
          return updatedPixels;
        });

        if (dragInProgress.current) {
          dragPixels.current.push(newPixel);
        }
      },
      [
        isEditing,
        selectedColor,
        selectedTool,
        editDesignId,
        setEditedPixels,
        schedulePixelRecalculation,
        pixels,
        visibleLayers,
        setSelectedColor,
      ],
    );

    // Copy/paste functionality is now handled by the FloatingToolbar via useEditingToolbar

    const handleSelectCanvas = useCallback(
      (canvas: Canvas | null) => {
        if (onSelectCanvas) {
          onSelectCanvas(canvas);
        }
        setSelectedTabIndex(
          canvas
            ? canvases?.findIndex((c) => c.id === canvas.id) ?? null
            : null,
        );
      },
      [onSelectCanvas, canvases],
    );

    const centerOnDesign = (
      x: number,
      y: number,
      width: number,
      height: number,
    ) => {
      if (viewportRef.current) {
        viewportRef.current.centerOnDesign(x, y, width, height);
      }
    };
    const centerOnCanvas = () => {
      if (viewportRef.current) {
        viewportRef.current.centerOnCanvas();
      }
    };
    React.useImperativeHandle(ref, () => ({
      centerOnDesign,
      centerOnCanvas,
    }));

    useEffect(() => {
      if (selectedCanvas && canvases) {
        const newIndex = canvases.findIndex((c) => c.id === selectedCanvas.id);
        setSelectedTabIndex(newIndex !== -1 ? newIndex : null);
      } else {
        setSelectedTabIndex(null);
      }
    }, [selectedCanvas, canvases]);

    // Helper function to compare Sets without using JSON.stringify
    const areSetsEqual = (a: Set<number>, b: Set<number>): boolean => {
      if (a.size !== b.size) return false;
      for (const item of a) {
        if (!b.has(item)) return false;
      }
      return true;
    };
    
    useEffect(() => {
      const updatePixels = async () => {
        if (!areSetsEqual(previousVisibleLayersRef.current, visibleLayers)) {
          // Create a new Set to avoid reference issues
          previousVisibleLayersRef.current = new Set(visibleLayers);
          await recalculatePixels();
        }
      };
      updatePixels();
    }, [visibleLayers, recalculatePixels]);

    useEffect(() => {
      if (isEditing) {
        recalculatePixels();
      }
    }, [isEditing, recalculatePixels]);

    useEffect(() => {
      if (!editDesignId) {
        setSelection(null);
      }
    }, [editDesignId]);

    useEffect(() => {
      if (!isEditing) {
        if (editedPixels && editedPixels.length > 0 && setEditedPixels) {
          setEditedPixels([]);
        }
        // Reset tool state when editing stops
        setSelectedColor(null);
        setSelectedTool('paint');
        recalculatePixels();
      }
    }, [
      editedPixels,
      isEditing,
      recalculatePixels,
      setEditedPixels,
    ]);

    // Mouse drag handling for painting
    useEffect(() => {
      const handleMouseDown = () => {
        if (isEditing) {
          dragInProgress.current = true;
          dragPixels.current = [];
        }
      };

      const handleMouseUp = () => {
        if (isEditing && dragInProgress.current) {
          if (dragPixels.current.length > 0 && setEditedPixels) {
            setEditedPixels((prevEditedPixels) => {
              const finalPixels = [...prevEditedPixels, ...dragPixels.current];
              return finalPixels;
            });
          }

          dragInProgress.current = false;
          dragPixels.current = [];
        }
      };

      window.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [isEditing, setEditedPixels]);

    useEffect(() => {
      const order: Set<number> = new Set();
      if (editDesignId && isEditing) {
        order.add(editDesignId);
      }
      selectedCanvas.layer_order.filter(i => visibleLayers.has(i)).forEach(i => order.add(i));
      designs.filter(d => visibleLayers.has(d.id)).forEach(i => order.add(i.id));

      setLayerOrder([...order]);
      recalculatePixels();
    }, [editDesignId, isEditing, selectedCanvas, visibleLayers, recalculatePixels, designs])

    return (
      <Box position="relative" height="100%" display="flex" flexDirection="column">
        {/* Canvas tabs and controls */}
        {canvases && (
          <Flex padding={2} borderBottomWidth="1px" borderColor="gray.200">
            <Tabs
              index={selectedTabIndex !== null ? selectedTabIndex : -1}
              onChange={(index) => handleSelectCanvas(canvases[index])}
            >
              <TabList>
                {canvases.map((canvas) => (
                  <Tab key={canvas.id}>{canvas.canvas_name}</Tab>
                ))}
              </TabList>
            </Tabs>
            <Spacer />
            <IconButton
              aria-label="Center on Canvas"
              icon={<FaExpand />}
              onClick={centerOnCanvas}
            />
          </Flex>
        )}
        
        {/* Main viewport area */}
        <Box position="relative" flex="1" overflow="hidden">
          <Viewport
            ref={viewportRef}
            stageRef={stageRef}
            designId={editDesignId}
            pixels={pixels}
            isEditing={isEditing}
            onPixelPaint={handlePixelPaint}
            layerOrder={layerOrder}
            selection={selection}
            setSelection={setSelection}
            onDesignSelect={onDesignSelect}
            selectedTool={selectedTool}
          />
          
          {/* Floating Toolbar positioned at bottom of viewport */}
          <FloatingToolbar
            ref={toolbarRef}
            design={currentDesign}
            editedPixels={editedPixels ?? []}
            setEditedPixels={setEditedPixels || (() => {})}
            onSubmitEdit={onSubmitEdit || (async () => {})}
            onCancelEdit={onCancelEdit || (() => {})}
            isEditing={isEditing}
            colors={colors}
            isVisible={isEditing}
            onColorSelect={handleColorSelect}
            onToolChange={handleToolChange}
            selection={selection}
            pixels={pixels}
            stageRef={stageRef}
          />
        </Box>
      </Box>
    );
  },
);

export default AdvancedViewport;

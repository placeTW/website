import {
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  Spacer,
  Tab,
  TabList,
  Tabs,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import Konva from "konva";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaExpand, FaDownload } from "react-icons/fa";
import { FaPen as FaEdit, FaCheck, FaXmark as FaCancel } from "react-icons/fa6";
import { useDesignContext } from "../../context/design-context";
import { useUserContext } from "../../context/user-context";
import { databaseUpdateCanvasName } from "../../api/supabase/database";
import { Canvas, Pixel } from "../../types/art-tool";
import Viewport from "../viewport/Viewport";
import { CLEAR_ON_DESIGN } from "../viewport/constants";
import { ViewportHandle, ViewportPixel } from "../viewport/types";
import { floodFill } from "../viewport/utils/flood-fill";
import { FloatingToolbar, FloatingToolbarHandle } from './floating-toolbar';
import { ToolType } from './floating-toolbar/sections/ToolSelectionSection';
import { exportCanvasAsPNG } from "../../utils/png-export";

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
  onCanvasUpdate?: (canvas: Canvas) => void;
  dragModeDesignId?: number | null;
  onDesignPositionUpdate?: (designId: number, deltaX: number, deltaY: number) => void;
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
      onCanvasUpdate,
      dragModeDesignId,
      onDesignPositionUpdate,
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const [pixels, setPixels] = useState<ViewportPixel[]>([]);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedTool, setSelectedTool] = useState<ToolType>('paint');
    const [isExporting, setIsExporting] = useState(false);
    const [editingCanvasId, setEditingCanvasId] = useState<number | null>(null);
    const [tempCanvasName, setTempCanvasName] = useState('');
    const toast = useToast();
    const toolbarRef = useRef<FloatingToolbarHandle>(null);
    const canvasNameInputRef = useRef<HTMLInputElement>(null);
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
    const { currentUser } = useUserContext();
    
    // Check if current user is admin (rank A or B)
    const isAdmin = currentUser && ["A", "B"].includes(currentUser.rank);
    
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

    // Canvas name editing functions
    const handleStartCanvasNameEdit = useCallback((canvasId: number, currentName: string) => {
      if (!isAdmin) return; // Prevent non-admin users from editing
      setEditingCanvasId(canvasId);
      setTempCanvasName(currentName);
    }, [isAdmin]);

    const handleConfirmCanvasNameEdit = useCallback(async () => {
      if (!isAdmin || !editingCanvasId || !tempCanvasName.trim()) {
        setEditingCanvasId(null);
        setTempCanvasName('');
        return;
      }

      try {
        const updatedCanvas = await databaseUpdateCanvasName(editingCanvasId, tempCanvasName.trim());
        if (onCanvasUpdate) {
          onCanvasUpdate(updatedCanvas);
        }
        toast({
          title: t("Success"),
          description: t("Canvas name updated successfully"),
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error("Error updating canvas name:", error);
        toast({
          title: t("Error"),
          description: t("Failed to update canvas name"),
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setEditingCanvasId(null);
        setTempCanvasName('');
      }
    }, [isAdmin, editingCanvasId, tempCanvasName, onCanvasUpdate, toast]);

    const handleCancelCanvasNameEdit = useCallback(() => {
      setEditingCanvasId(null);
      setTempCanvasName('');
    }, []);

    const handleCanvasNameKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirmCanvasNameEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelCanvasNameEdit();
      }
    }, [handleConfirmCanvasNameEdit, handleCancelCanvasNameEdit]);

    // Focus input when canvas name editing starts
    useEffect(() => {
      if (editingCanvasId && canvasNameInputRef.current) {
        canvasNameInputRef.current.focus();
        canvasNameInputRef.current.select();
      }
    }, [editingCanvasId]);


    // Handle canvas export
    const handleCanvasExport = useCallback(async () => {
      if (!isAdmin || !designs) return; // Prevent non-admin users from exporting
      
      setIsExporting(true);
      try {
        // Get all designs on the current canvas
        const canvasDesigns = designs.filter(design => design.canvas === selectedCanvas.id);

        if (canvasDesigns.length === 0) {
          toast({
            title: t('Error'),
            description: t('No designs found on this canvas.'),
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        // Use the helper function to export
        await exportCanvasAsPNG(
          canvasDesigns, 
          selectedCanvas.layer_order, 
          selectedCanvas.canvas_name,
          { download: true }
        );

        toast({
          title: t('Success'),
          description: t('Canvas exported successfully as {{filename}}', { 
            filename: `${selectedCanvas.canvas_name}-export-${new Date().toISOString().slice(0, 10)}.png` 
          }),
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

      } catch (error) {
        console.error('Error exporting canvas:', error);
        toast({
          title: t('Error'),
          description: t('An error occurred while exporting the canvas.'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsExporting(false);
      }
    }, [isAdmin, designs, selectedCanvas, toast]);


    const handlePixelPaint = useCallback(
      (x: number, y: number, erase: boolean) => {
        if (!isEditing || !editDesignId || !setEditedPixels)
          return;

        // For erasing, eyedropper, and bucket (has its own color check), we don't need a selected color upfront
        const shouldErase = erase || selectedTool === 'erase';
        const isEyedropper = selectedTool === 'eyedropper';
        const isBucket = selectedTool === 'bucket';
        if (!shouldErase && !isEyedropper && !isBucket && !selectedColor) {
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

        if (selectedTool === 'bucket') {
          // Bucket fill tool - flood fill with selected color
          if (!selectedColor) {
            return; // Need a color selected to fill
          }

          // Get the color at the clicked position
          const clickedPixel = pixels.find(pixel => 
            pixel.x === x && pixel.y === y && visibleLayers.has(pixel.designId)
          );
          const targetColor = clickedPixel?.color || CLEAR_ON_DESIGN;

          // Perform flood fill
          const { filledPixels } = floodFill(
            x, y, 
            selectedColor, 
            targetColor, 
            editDesignId, 
            pixels.filter(p => visibleLayers.has(p.designId))
          );

          if (filledPixels.length > 0) {
            // Add filled pixels to edited pixels
            setEditedPixels && setEditedPixels((prev) => {
              // Remove any existing pixels in the filled area
              const filteredPixels = prev.filter(pixel => {
                return !filledPixels.some(filled => 
                  filled.x === pixel.x && 
                  filled.y === pixel.y && 
                  filled.designId === pixel.designId
                );
              });
              
              return [...filteredPixels, ...filledPixels];
            });
            
            schedulePixelRecalculation();
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
          <Flex padding={2} borderBottomWidth="1px" borderColor="gray.200" alignItems="center">
            <Tabs
              index={selectedTabIndex !== null ? selectedTabIndex : -1}
              onChange={(index) => handleSelectCanvas(canvases[index])}
            >
              <TabList>
                {canvases.map((canvas) => {
                  const isEditing = editingCanvasId === canvas.id;
                  return (
                    <Tab 
                      key={canvas.id}
                      position="relative"
                      _focus={{ boxShadow: "none" }}
                    >
                      {isEditing ? (
                        <Flex align="center" gap={1} onClick={(e) => e.stopPropagation()}>
                          <Input
                            ref={canvasNameInputRef}
                            value={tempCanvasName}
                            onChange={(e) => setTempCanvasName(e.target.value)}
                            onKeyDown={handleCanvasNameKeyDown}
                            size="sm"
                            variant="filled"
                            placeholder={t("Enter canvas name...")}
                            bg="white"
                            _dark={{ bg: 'gray.700' }}
                            width="150px"
                            mr={1}
                          />
                          <Tooltip label={t("Confirm (Enter)")}>
                            <Box
                              as="span"
                              display="inline-flex"
                              alignItems="center"
                              justifyContent="center"
                              w="24px"
                              h="24px"
                              borderRadius="md"
                              bg="green.500"
                              color="white"
                              cursor="pointer"
                              _hover={{ bg: "green.600" }}
                              onClick={handleConfirmCanvasNameEdit}
                              aria-label={t("Confirm name change")}
                            >
                              <FaCheck size="12px" />
                            </Box>
                          </Tooltip>
                          <Tooltip label={t("Cancel (Esc)")}>
                            <Box
                              as="span"
                              display="inline-flex"
                              alignItems="center"
                              justifyContent="center"
                              w="24px"
                              h="24px"
                              borderRadius="md"
                              bg="transparent"
                              color="gray.500"
                              cursor="pointer"
                              _hover={{ bg: "gray.100", color: "gray.700" }}
                              onClick={handleCancelCanvasNameEdit}
                              aria-label={t("Cancel name change")}
                            >
                              <FaCancel size="12px" />
                            </Box>
                          </Tooltip>
                        </Flex>
                      ) : (
                        <Flex align="center" gap={1}>
                          <Box>{canvas.canvas_name}</Box>
                          {isAdmin && (
                            <Tooltip label={t("Edit name")}>
                              <Box
                                as="span"
                                display="inline-flex"
                                alignItems="center"
                                justifyContent="center"
                                w="20px"
                                h="20px"
                                borderRadius="md"
                                bg="transparent"
                                color="gray.500"
                                cursor="pointer"
                                _hover={{ bg: "gray.100", color: "gray.700" }}
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  handleStartCanvasNameEdit(canvas.id, canvas.canvas_name);
                                }}
                                aria-label={t("Edit canvas name")}
                              >
                                <FaEdit size="10px" />
                              </Box>
                            </Tooltip>
                          )}
                        </Flex>
                      )}
                    </Tab>
                  );
                })}
              </TabList>
            </Tabs>

            <Spacer />
            
            {/* Export button - Admin only */}
            {isAdmin && (
              <Button
                leftIcon={<FaDownload />}
                size="sm"
                onClick={handleCanvasExport}
                isLoading={isExporting}
                loadingText={t("Exporting...")}
                mr={2}
              >
                {t("Export PNG")}
              </Button>
            )}
            <Tooltip label={t("Center on Canvas")}>
              <IconButton
                aria-label={t("Center on Canvas")}
                icon={<FaExpand />}
                onClick={centerOnCanvas}
              />
            </Tooltip>
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
            dragModeDesignId={dragModeDesignId}
            onDesignPositionUpdate={onDesignPositionUpdate}
          />
          
          {/* Floating Toolbar positioned at bottom of viewport */}
          {setEditedPixels && onSubmitEdit && onCancelEdit && (
            <FloatingToolbar
            ref={toolbarRef}
            design={currentDesign}
            editedPixels={editedPixels ?? []}
            setEditedPixels={setEditedPixels}
            onSubmitEdit={onSubmitEdit}
            onCancelEdit={onCancelEdit}
            isEditing={isEditing}
            colors={colors}
            isVisible={isEditing}
            onColorSelect={handleColorSelect}
            onToolChange={handleToolChange}
            selection={selection}
            pixels={pixels}
            stageRef={stageRef}
          />
          )}
        </Box>
      </Box>
    );
  },
);

export default AdvancedViewport;

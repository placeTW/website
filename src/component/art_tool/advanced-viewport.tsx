import {
  Box,
  Button,
  Flex,
  Grid,
  IconButton,
  Spacer,
  Tooltip,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import Konva from "konva";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaRepeat } from "react-icons/fa6";
import {
  databaseFetchDesigns,
  removeSupabaseChannel,
  supabase,
} from "../../api/supabase";
import { Canvas, Design, Pixel } from "../../types/art-tool";
import { getTopLeftCoords, offsetPixels } from "../../utils/getTopLeftPixel";
import Viewport from "../viewport/Viewport";
import {
  CLEAR_ON_DESIGN,
  CLEAR_ON_MAIN,
  GRID_SIZE,
} from "../viewport/constants";
import { ViewportPixel } from "../viewport/types";
import { createCheckerboardPattern } from "../viewport/utils";
import UndoManager from "../viewport/utils/undo-manager";

interface AdvancedViewportProps {
  isEditing: boolean;
  editDesignId: number | null;
  visibleLayers: number[];
  onUpdatePixels: (pixels: ViewportPixel[]) => void;
  colors: { Color: string; color_sort: number | null; color_name: string }[];
  canvases: Canvas[];
  onSelectCanvas: (canvas: Canvas | null) => void;
  selectedCanvas: Canvas | null;
  onResetViewport: () => void;
  showCanvasButtons?: boolean;  // Add this prop
}

const AdvancedViewport: React.FC<AdvancedViewportProps> = ({
  isEditing,
  editDesignId,
  visibleLayers,
  onUpdatePixels,
  colors,
  canvases,
  onSelectCanvas,
  selectedCanvas,
  onResetViewport,
  showCanvasButtons = true,  // Default to true if not provided
}) => {
  const [pixels, setPixels] = useState<ViewportPixel[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [editedPixels, setEditedPixels] = useState<ViewportPixel[]>([]);
  const [selection, setSelection] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [copyBuffer, setCopyBuffer] = useState<ViewportPixel[]>([]);

  const stageRef = useRef<Konva.Stage>(null);
  const undoManager = useRef(new UndoManager(100)).current;
  const pixelCache = useRef<Map<number, ViewportPixel[]>>(new Map());
  const dragInProgress = useRef(false);
  const dragPixels = useRef<ViewportPixel[]>([]);
  const previousVisibleLayersRef = useRef<number[]>(visibleLayers);

  const clearOnDesignPattern = createCheckerboardPattern(
    "#eee",
    "#fff",
  ).toDataURL();
  const clearOnMainPattern = createCheckerboardPattern(
    "#fc7e7e",
    "#fff",
  ).toDataURL();

  // Fetch pixels for visible layers and cache them
  const fetchPixels = useCallback(async (layers: number[]) => {
    if (layers.length === 0) return [];

    const cachedLayers = layers.filter((layer) =>
      pixelCache.current.has(layer),
    );
    const layersToFetch = layers.filter(
      (layer) => !cachedLayers.includes(layer),
    );

    if (layersToFetch.length > 0) {
      const designs = await databaseFetchDesigns();
      const fetchedPixels = await Promise.all(
        layersToFetch.map(async (layer) => {
          const design = designs?.find((d) => d.id === layer);
          if (design) {
            const pixels = design.pixels.map((pixel: Pixel) => ({
              ...pixel,
              x: pixel.x + design.x,
              y: pixel.y + design.y,
              designId: design.id,
            }));
            pixelCache.current.set(layer, pixels);
            return pixels;
          }
          return [];
        }),
      );
      return [
        ...cachedLayers.map((layer) => pixelCache.current.get(layer)!),
        ...fetchedPixels,
      ].flat();
    }

    return cachedLayers.map((layer) => pixelCache.current.get(layer)!).flat();
  }, []);

  // Merge newly edited pixels with existing base pixels
  const mergeWithExistingPixels = (
    basePixels: ViewportPixel[],
    newEditedPixels: ViewportPixel[],
  ) => {
    const pixelMap = new Map<string, ViewportPixel>();

    basePixels.forEach((pixel) => {
      pixelMap.set(`${pixel.x}-${pixel.y}-${pixel.designId}`, pixel);
    });

    newEditedPixels.forEach((pixel) => {
      if (pixel.color !== CLEAR_ON_DESIGN) {
        pixelMap.set(`${pixel.x}-${pixel.y}-${pixel.designId}`, pixel);
      } else {
        pixelMap.delete(`${pixel.x}-${pixel.y}-${pixel.designId}`);
      }
    });

    return Array.from(pixelMap.values());
  };

  // Recalculate pixels and update the state
  const recalculatePixels = useCallback(async () => {
    const basePixels = await fetchPixels(visibleLayers);
    const mergedPixels = mergeWithExistingPixels(basePixels, editedPixels);
    if (JSON.stringify(mergedPixels) !== JSON.stringify(pixels)) {
      setPixels(mergedPixels);
      onUpdatePixels(mergedPixels);
    }
  }, [editedPixels, visibleLayers, onUpdatePixels, fetchPixels, pixels]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);

    if (selection && isEditing && editDesignId) {
      const { x, y, width, height } = selection;
      const newPixels: ViewportPixel[] = [];

      for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
          const pixelX = x + i;
          const pixelY = y + j;

          newPixels.push({
            x: pixelX,
            y: pixelY,
            color,
            designId: editDesignId,
          });
        }
      }

      undoManager.addState({ editedPixels: [...editedPixels] });

      setEditedPixels((prevEditedPixels) => {
        const updatedPixels = prevEditedPixels.filter(
          (p) =>
            !(
              p.x >= x &&
              p.x < x + width &&
              p.y >= y &&
              p.y < y + height &&
              p.designId === editDesignId
            ),
        );

        const finalPixels = [...updatedPixels, ...newPixels];
        requestAnimationFrame(() => recalculatePixels());
        return finalPixels;
      });
    }
  };

  const handlePixelPaint = (x: number, y: number) => {
    if (!isEditing || !selectedColor || !editDesignId) return;

    const newPixel: ViewportPixel = {
      x,
      y,
      color: selectedColor,
      designId: editDesignId,
    };

    if (!dragInProgress.current) {
      undoManager.addState({ editedPixels: [...editedPixels] });
    }

    setEditedPixels((prevEditedPixels) => {
      const updatedPixels = prevEditedPixels.filter(
        (p) => !(p.x === x && p.y === y && p.designId === editDesignId),
      );
      updatedPixels.push(newPixel);

      requestAnimationFrame(() => recalculatePixels());
      return updatedPixels;
    });

    if (dragInProgress.current) {
      dragPixels.current.push(newPixel);
    }
  };

  const handleCopy = useCallback(() => {
    if (!selection || !pixels || !editDesignId) return;

    const { x, y, width, height } = selection;

    const selectedPixels = pixels.filter(
      (pixel) =>
        pixel.designId === editDesignId &&
        pixel.x >= x &&
        pixel.x < x + width &&
        pixel.y >= y &&
        pixel.y < y + height,
    );

    const uniquePixels = new Map<string, ViewportPixel>();
    selectedPixels.forEach((pixel) =>
      uniquePixels.set(`${pixel.x}-${pixel.y}`, pixel),
    );

    let finalCopiedPixels = Array.from(uniquePixels.values());

    const topLeftPixel = getTopLeftCoords(finalCopiedPixels);

    finalCopiedPixels = offsetPixels(finalCopiedPixels, topLeftPixel).map(
      (pixel) => ({
        ...pixel,
        designId: -1,
      }),
    );

    setCopyBuffer(finalCopiedPixels);
  }, [selection, pixels, editDesignId]);

  const handlePaste = useCallback(
    (pasteX: number, pasteY: number) => {
      if (!isEditing || !editDesignId || copyBuffer.length === 0) return;

      // Determine the top-left pixel in the copied selection (including empty pixels)
      const { x: minX, y: minY } = getTopLeftCoords(copyBuffer);

      // Calculate the offset needed to position the top-left pixel under the cursor
      const offsetX = pasteX - minX;
      const offsetY = pasteY - minY;

      const pastedPixels = copyBuffer.map((pixel) => ({
        ...pixel,
        x: pixel.x + offsetX,
        y: pixel.y + offsetY,
        designId: editDesignId,
      }));

      undoManager.addState({ editedPixels: [...editedPixels] });

      setEditedPixels((prevEditedPixels) => {
        const updatedPixels = [...prevEditedPixels, ...pastedPixels];
        requestAnimationFrame(() => recalculatePixels());
        return updatedPixels;
      });
    },
    [
      isEditing,
      editDesignId,
      copyBuffer,
      undoManager,
      editedPixels,
      recalculatePixels,
    ],
  );

  useEffect(() => {
    const updatePixels = async () => {
      if (
        JSON.stringify(previousVisibleLayersRef.current) !==
        JSON.stringify(visibleLayers)
      ) {
        previousVisibleLayersRef.current = visibleLayers;
        const newPixels = await fetchPixels(visibleLayers);
        if (JSON.stringify(newPixels) !== JSON.stringify(pixels)) {
          setPixels(newPixels);
        }
      }
    };
    updatePixels();
  }, [visibleLayers, fetchPixels, pixels]);

  useEffect(() => {
    const pixelSubscription = supabase
      .channel("realtime-art_tool_designs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_designs" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updatedDesign = payload.new as Design;
            if (updatedDesign.pixels) {
              const updatedPixels = updatedDesign.pixels.map(
                (pixel: Pixel) => ({
                  ...pixel,
                  x: pixel.x + updatedDesign.x,
                  y: pixel.y + updatedDesign.y,
                  designId: updatedDesign.id,
                }),
              );
              pixelCache.current.set(updatedDesign.id, updatedPixels);
              setPixels((prevPixels) => {
                const pixelMap = new Map<string, ViewportPixel>();
                prevPixels.forEach((pixel) =>
                  pixelMap.set(
                    `${pixel.x}-${pixel.y}-${pixel.designId}`,
                    pixel,
                  ),
                );
                updatedPixels.forEach((pixel: ViewportPixel) =>
                  pixelMap.set(
                    `${pixel.x}-${pixel.y}-${pixel.designId}`,
                    pixel,
                  ),
                );
                const newPixelArray = Array.from(pixelMap.values());
                return JSON.stringify(newPixelArray) !==
                  JSON.stringify(prevPixels)
                  ? newPixelArray
                  : prevPixels;
              });
            }
          }
        },
      )
      .subscribe();

    return () => {
      removeSupabaseChannel(pixelSubscription);
    };
  }, []);

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
      if (editedPixels.length > 0) {
        setEditedPixels([]);
      }
      recalculatePixels();
      undoManager.clearHistory();
    }

    if (stageRef.current) {
      stageRef.current.draggable(true);
    }
  }, [editedPixels.length, isEditing, recalculatePixels, undoManager]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "c") {
        handleCopy();
      } else if (e.ctrlKey && e.key === "v") {
        const stage = stageRef.current?.getStage();
        if (stage) {
          const pointer = stage.getPointerPosition();
          if (pointer) {
            const scale = stage.scaleX();
            const pasteX = Math.floor(
              (pointer.x - stage.x()) / (GRID_SIZE * scale),
            );
            const pasteY = Math.floor(
              (pointer.y - stage.y()) / (GRID_SIZE * scale),
            );
            handlePaste(pasteX, pasteY);
          }
        }
      } else if (e.ctrlKey && e.key === "z" && undoManager.hasHistory()) {
        const previousState = undoManager.undo();
        if (previousState) {
          setEditedPixels(previousState.editedPixels);
          requestAnimationFrame(() => recalculatePixels());
        }
      }
    };

    const handleMouseDown = () => {
      if (isEditing) {
        dragInProgress.current = true;
        dragPixels.current = [];
      }
    };

    const handleMouseUp = () => {
      if (isEditing && dragInProgress.current) {
        if (dragPixels.current.length > 0) {
          setEditedPixels((prevEditedPixels) => {
            const finalPixels = [...prevEditedPixels, ...dragPixels.current];
            return finalPixels;
          });
        }

        dragInProgress.current = false;
        dragPixels.current = [];
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleCopy, handlePaste, isEditing, recalculatePixels, undoManager]);

  const layerOrder: number[] = [];
  if (editDesignId && isEditing) {
    layerOrder.push(editDesignId);
  }
  layerOrder.push(...visibleLayers.filter((layer) => layer !== editDesignId));

  return (
    <Box position="relative" height="100%">
      <Box height="100%">
        {showCanvasButtons && (  // Conditionally render the canvas buttons
          <Flex padding={2}>
            <Wrap direction="row" spacing={2}>
              {canvases.map((canvas) => (
                <WrapItem key={canvas.id}>
                  <Button
                    onClick={() => onSelectCanvas(canvas)}
                    colorScheme="teal"
                    border={
                      canvas.id === selectedCanvas?.id
                        ? "2px solid black"
                        : "1px solid #ccc"
                    }
                  >
                    {canvas.canvas_name}
                  </Button>
                </WrapItem>
              ))}
              <WrapItem>
                <Button onClick={() => onSelectCanvas(null)}>Unassigned</Button>
              </WrapItem>
            </Wrap>
            <Spacer />
            <IconButton
              icon={<FaRepeat />}
              aria-label="Reset viewport"
              onClick={onResetViewport}
            />
          </Flex>
        )}
        <Viewport
          designId={editDesignId}
          pixels={pixels}
          isEditing={isEditing}
          onPixelPaint={handlePixelPaint}
          layerOrder={layerOrder}
          onCopy={handleCopy}
          onPaste={handlePaste}
          selection={selection}
          setSelection={setSelection}
          stageRef={stageRef}
        />
      </Box>

      {isEditing && (
        <Box
          position="absolute"
          bottom="10px"
          left="50%"
          transform="translateX(-50%)"
          zIndex="100"
        >
          <Grid templateColumns={`repeat(${colors.length}, 1fr)`} gap={2}>
            {colors.map((color) => (
              <Tooltip key={color.Color} label={color.color_name}>
                <Box
                  w="30px"
                  h="30px"
                  bg={
                    color.Color === CLEAR_ON_DESIGN
                      ? `url(${clearOnDesignPattern})`
                      : color.Color === CLEAR_ON_MAIN
                      ? `url(${clearOnMainPattern})`
                      : color.Color
                  }
                  border={
                    selectedColor === color.Color
                      ? "2px solid black"
                      : "1px solid #ccc"
                  }
                  cursor="pointer"
                  onClick={() => handleColorSelect(color.Color)}
                />
              </Tooltip>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default AdvancedViewport;

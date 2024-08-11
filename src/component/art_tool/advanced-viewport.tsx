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
import {
  databaseFetchDesigns,
  removeSupabaseChannel,
  supabase,
} from "../../api/supabase";
import { Canvas, Design, Pixel } from "../../types/art-tool";
import Viewport from "../viewport/Viewport";
import {
  CLEAR_ON_DESIGN,
  CLEAR_ON_MAIN,
  GRID_SIZE,
} from "../viewport/constants";
import { ViewportPixel } from "../viewport/types";
import { FaRepeat } from "react-icons/fa6";
import UndoManager from "../viewport/utils/undo-manager";
import { mouseHandlers } from "../viewport/handlers"; // Import mouse handlers

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
}) => {
  const [pixels, setPixels] = useState<ViewportPixel[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [editedPixels, setEditedPixels] = useState<ViewportPixel[]>([]);
  const previousVisibleLayers = useRef<number[]>(visibleLayers);
  const [selection, setSelection] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [copyBuffer, setCopyBuffer] = useState<ViewportPixel[]>([]);
  const stageRef = useRef<Konva.Stage>(null);

  const undoManager = useRef(new UndoManager(10)).current;
  const pixelCache = useRef<Map<number, ViewportPixel[]>>(new Map());
  const dragInProgress = useRef(false);
  const dragPixels = useRef<ViewportPixel[]>([]);

  const createCheckerboardPattern = (
    color1: string,
    color2: string,
  ): HTMLCanvasElement => {
    const size = 20;
    const canvas = document.createElement("canvas");
    canvas.width = size * 2;
    canvas.height = size * 2;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.fillStyle = color1;
      ctx.fillRect(0, 0, size, size);
      ctx.fillRect(size, size, size, size);

      ctx.fillStyle = color2;
      ctx.fillRect(size, 0, size, size);
      ctx.fillRect(0, size, size, size);
    }

    return canvas;
  };

  const clearOnDesignPatternCanvas = createCheckerboardPattern("#eee", "#fff");
  const clearOnMainPatternCanvas = createCheckerboardPattern("#fc7e7e", "#fff");

  const clearOnDesignPattern = clearOnDesignPatternCanvas.toDataURL();
  const clearOnMainPattern = clearOnMainPatternCanvas.toDataURL();

  const fetchPixels = async (layers: number[]) => {
    if (layers.length === 0) {
      return [];
    }

    const cachedLayers = layers.filter((layer) => pixelCache.current.has(layer));
    const layersToFetch = layers.filter((layer) => !cachedLayers.includes(layer));

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
  };

  useEffect(() => {
    const updatePixels = async () => {
      if (JSON.stringify(previousVisibleLayers.current) !== JSON.stringify(visibleLayers)) {
        previousVisibleLayers.current = visibleLayers;
        const newPixels = await fetchPixels(visibleLayers);
        if (JSON.stringify(newPixels) !== JSON.stringify(pixels)) {
          setPixels(newPixels);
        }
      }
    };
    updatePixels();
  }, [visibleLayers]);

  useEffect(() => {
    const pixelSubscription = supabase
      .channel("realtime-art_tool_designs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_designs" },
        (payload) => {
          setPixels((prevPixels) => {
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
                if (JSON.stringify(newPixelArray) !== JSON.stringify(prevPixels)) {
                  return newPixelArray;
                }
                return prevPixels;
              } else {
                console.warn(
                  "updatedDesign.pixels is undefined. Skipping update.",
                );
                return prevPixels;
              }
            } else {
              return prevPixels;
            }
          });
        },
      )
      .subscribe();

    return () => {
      removeSupabaseChannel(pixelSubscription);
    };
  }, []);

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

  const recalculatePixels = useCallback(async () => {
    const basePixels = await fetchPixels(visibleLayers);
    const mergedPixels = mergeWithExistingPixels(basePixels, editedPixels);
    if (JSON.stringify(mergedPixels) !== JSON.stringify(pixels)) {
      setPixels(mergedPixels);
      onUpdatePixels(mergedPixels);
    }
  }, [editedPixels, visibleLayers, onUpdatePixels]);

  useEffect(() => {
    if (isEditing) {
      recalculatePixels();
    }
  }, [editedPixels, isEditing]);

  useEffect(() => {
    if (!editDesignId) {
      setSelection(null);
    }
  }, [editDesignId]);

  const layerOrder: number[] = [];
  if (editDesignId && isEditing) {
    layerOrder.push(editDesignId);
  }
  layerOrder.push(...visibleLayers.filter((layer) => layer !== editDesignId));

  useEffect(() => {
    if (!isEditing) {
      setEditedPixels([]);
      recalculatePixels();
      undoManager.clearHistory();
    }
  }, [isEditing]);

  // Initialize or refresh event handlers when entering edit mode
  useEffect(() => {
    if (isEditing && stageRef.current) {
      const stage = stageRef.current.getStage();

      // Ensure the stage is draggable for panning
      stage.draggable(true);

      // Attach necessary event handlers for panning
      stage.on('contentMousedown', mouseHandlers.handleMouseDown);
      stage.on('contentMouseup', mouseHandlers.handleMouseUp);
      stage.on('contentMousemove', mouseHandlers.handleMouseMove);

      // Prevent default context menu on right-click
      stage.on('contentContextmenu', (e) => {
        e.evt.preventDefault();
      });

      // Force a stage redraw to ensure everything is initialized correctly
      const initialScale = stage.scaleX();
      stage.scale({ x: initialScale * 1.01, y: initialScale * 1.01 });
      stage.batchDraw();
      stage.scale({ x: initialScale, y: initialScale });
      stage.batchDraw();
    }
  }, [isEditing, stageRef.current]);

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

      // Capture the state before applying the color change
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

    // Add the current state to the undo stack before modifying
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

  const handleCopy = useCallback(() => {
    if (selection && pixels && editDesignId) {
      const { x, y, width, height } = selection;

      const selectedPixels = pixels.filter(
        (pixel) =>
          pixel.designId === editDesignId &&
          pixel.x >= x &&
          pixel.y >= y &&
          pixel.x < x + width &&
          pixel.y >= y + height,
      );

      const selectedEditedPixels = editedPixels.filter(
        (pixel) =>
          pixel.designId === editDesignId &&
          pixel.x >= x &&
          pixel.y >= y &&
          pixel.x < x + width &&
          pixel.y >= y + height,
      );

      const combinedPixels = [...selectedPixels, ...selectedEditedPixels];

      const uniquePixels = new Map<string, ViewportPixel>();
      combinedPixels.forEach((pixel) =>
        uniquePixels.set(`${pixel.x}-${pixel.y}`, pixel),
      );

      const finalCopiedPixels = Array.from(uniquePixels.values());

      setCopyBuffer(finalCopiedPixels);
    }
  }, [selection, pixels, editedPixels, editDesignId]);

  const handlePaste = useCallback(
    (pasteX: number, pasteY: number) => {
      if (!isEditing || !editDesignId || copyBuffer.length === 0 || !selection)
        return;

      const { x: selectionX, y: selectionY } = selection;

      const offsetX = pasteX - selectionX;
      const offsetY = pasteY - selectionY;

      const pastedPixels = copyBuffer.map((pixel) => ({
        ...pixel,
        x: pixel.x + offsetX,
        y: pixel.y + offsetY,
        designId: editDesignId,
      }));

      // Capture the current state before pasting
      undoManager.addState({ editedPixels: [...editedPixels] });

      setEditedPixels((prevEditedPixels) => {
        const updatedPixels = [...prevEditedPixels, ...pastedPixels];
        requestAnimationFrame(() => recalculatePixels());
        return updatedPixels;
      });
    },
    [copyBuffer, isEditing, editDesignId, selection, undoManager],
  );

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

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleCopy, handlePaste, undoManager]);

  return (
    <Box position="relative" height="100%">
      <Box height="100%">
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
              <Tooltip
                key={color.Color}
                label={color.color_name}
              >
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

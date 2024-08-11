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

    const designs = await databaseFetchDesigns();

    if (designs) {
      const allVisiblePixels = await Promise.all(
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

      return allVisiblePixels.flat();
    }
    return [];
  };

  useEffect(() => {
    if (
      JSON.stringify(previousVisibleLayers.current) !==
      JSON.stringify(visibleLayers)
    ) {
      previousVisibleLayers.current = visibleLayers;
      fetchPixels(visibleLayers).then((newPixels) => {
        if (JSON.stringify(newPixels) !== JSON.stringify(pixels)) {
          setPixels(newPixels);
        }
      });
    }
  }, [visibleLayers, pixels]);

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
  }, [editedPixels, visibleLayers, onUpdatePixels, pixels]);

  useEffect(() => {
    if (isEditing) {
      recalculatePixels();
    }
  }, [editedPixels, isEditing, recalculatePixels]);

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
  }, [isEditing, recalculatePixels, undoManager]);

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

    undoManager.addState({ editedPixels: [...editedPixels] });

    setEditedPixels((prevEditedPixels) => {
      const updatedPixels = prevEditedPixels.filter(
        (p) => !(p.x === x && p.y === y && p.designId === editDesignId),
      );
      updatedPixels.push(newPixel);
      requestAnimationFrame(() => recalculatePixels());
      return updatedPixels;
    });
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
          pixel.y < y + height,
      );

      const selectedEditedPixels = editedPixels.filter(
        (pixel) =>
          pixel.designId === editDesignId &&
          pixel.x >= x &&
          pixel.y >= y &&
          pixel.x < x + width &&
          pixel.y < y + height,
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

      undoManager.addState({ editedPixels: [...editedPixels] });

      setEditedPixels((prevEditedPixels) => {
        const updatedPixels = [...prevEditedPixels, ...pastedPixels];
        requestAnimationFrame(() => recalculatePixels());
        return updatedPixels;
      });
    },
    [copyBuffer, isEditing, editDesignId, recalculatePixels, selection, undoManager],
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

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleCopy, handlePaste, undoManager, recalculatePixels]);

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

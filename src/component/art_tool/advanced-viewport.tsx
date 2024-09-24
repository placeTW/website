import {
  Box,
  Flex,
  Grid,
  Spacer,
  Tab,
  TabList,
  Tabs,
  Tooltip,
} from "@chakra-ui/react";
import Konva from "konva";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDesignContext } from "../../context/design-context";
import { Canvas, Pixel } from "../../types/art-tool";
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
  visibleLayers: number[];
  selectedCanvas?: Canvas | null;
  isEditing?: boolean;
  editDesignId?: number | null;
  canvases?: Canvas[];
  colors?: { Color: string; color_sort: number | null; color_name: string }[];
  editedPixels?: Pixel[];
  setEditedPixels?: React.Dispatch<React.SetStateAction<Pixel[]>>;
  onSelectCanvas?: (canvas: Canvas | null) => void;
}

const AdvancedViewport: React.FC<AdvancedViewportProps> = ({
  isEditing = false,
  editDesignId,
  visibleLayers,
  colors,
  canvases,
  onSelectCanvas,
  selectedCanvas,
  editedPixels = [],
  setEditedPixels,
}) => {
  const [pixels, setPixels] = useState<ViewportPixel[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selection, setSelection] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [copyBuffer, setCopyBuffer] = useState<{
    pixels: ViewportPixel[];
    selectionTopLeft: { x: number; y: number };
  } | null>(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState<number | null>(
    () => {
      if (selectedCanvas && canvases) {
        return canvases.findIndex((c) => c.id === selectedCanvas.id);
      }
      return null;
    },
  );

  const stageRef = useRef<Konva.Stage>(null);
  const undoManager = useRef(new UndoManager(100)).current;
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

  const { designs } = useDesignContext();

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

  const recalculatePixels = useCallback(async () => {
    const basePixels = await fetchPixels(visibleLayers);
    const mergedPixels = mergeWithExistingPixels(
      basePixels,
      editedPixels ?? [],
      visibleLayers,
    );
    if (JSON.stringify(mergedPixels) !== JSON.stringify(pixels)) {
      setPixels(mergedPixels);
    }
  }, [
    editedPixels,
    visibleLayers,
    fetchPixels,
    pixels,
    mergeWithExistingPixels,
  ]);

  const handleColorSelect = useCallback(
    (color: string) => {
      setSelectedColor(color);

      if (selection && isEditing && editDesignId && setEditedPixels) {
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

        undoManager.addState({ editedPixels: [...(editedPixels ?? [])] });

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
    },
    [
      selection,
      isEditing,
      editDesignId,
      setEditedPixels,
      undoManager,
      editedPixels,
      recalculatePixels,
    ],
  );

  const handlePixelPaint = useCallback(
    (x: number, y: number, erase: boolean) => {
      if (!isEditing || !selectedColor || !editDesignId || !setEditedPixels)
        return;

      const newPixel: ViewportPixel = {
        x,
        y,
        color: !erase ? selectedColor : CLEAR_ON_DESIGN,
        designId: editDesignId,
      };

      if (!dragInProgress.current) {
        undoManager.addState({ editedPixels: [...(editedPixels ?? [])] });
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
    },
    [
      isEditing,
      selectedColor,
      editDesignId,
      setEditedPixels,
      undoManager,
      editedPixels,
      recalculatePixels,
    ],
  );

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

    setCopyBuffer({
      pixels: Array.from(uniquePixels.values()),
      selectionTopLeft: { x, y },
    });
  }, [selection, pixels, editDesignId]);

  const handlePaste = useCallback(
    (pasteX: number, pasteY: number) => {
      if (
        !isEditing ||
        !editDesignId ||
        !copyBuffer ||
        copyBuffer.pixels.length === 0 ||
        !setEditedPixels
      )
        return;

      const { x: selectionX, y: selectionY } = copyBuffer.selectionTopLeft;

      const offsetX = pasteX - selectionX;
      const offsetY = pasteY - selectionY;

      const pastedPixels = copyBuffer.pixels.map((pixel) => ({
        ...pixel,
        x: pixel.x + offsetX,
        y: pixel.y + offsetY,
        designId: editDesignId,
      }));

      undoManager.addState({ editedPixels: [...(editedPixels ?? [])] });

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
      setEditedPixels,
    ],
  );

  const handleSelectCanvas = useCallback(
    (canvas: Canvas | null) => {
      if (onSelectCanvas) {
        onSelectCanvas(canvas);
      }
      setSelectedTabIndex(
        canvas ? canvases?.findIndex((c) => c.id === canvas.id) ?? null : null,
      );
    },
    [onSelectCanvas, canvases],
  );

  useEffect(() => {
    if (selectedCanvas && canvases) {
      const newIndex = canvases.findIndex((c) => c.id === selectedCanvas.id);
      setSelectedTabIndex(newIndex !== -1 ? newIndex : null);
    } else {
      setSelectedTabIndex(null);
    }
  }, [selectedCanvas, canvases]);

  useEffect(() => {
    const updatePixels = async () => {
      if (
        JSON.stringify(previousVisibleLayersRef.current) !==
        JSON.stringify(visibleLayers)
      ) {
        previousVisibleLayersRef.current = visibleLayers;
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
      recalculatePixels();
      undoManager.clearHistory();
    }
  }, [
    editedPixels,
    isEditing,
    recalculatePixels,
    undoManager,
    setEditedPixels,
  ]);

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
        if (previousState && setEditedPixels) {
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

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    handleCopy,
    handlePaste,
    isEditing,
    recalculatePixels,
    setEditedPixels,
    undoManager,
    selectedColor,
  ]);

  const layerOrder: number[] = [];
  if (editDesignId && isEditing) {
    layerOrder.push(editDesignId);
  }
  layerOrder.push(...visibleLayers.filter((layer) => layer !== editDesignId));

  return (
    <Box position="relative" height="100%">
      <Box height="100%">
        {canvases && (
          <Flex padding={2}>
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
          </Flex>
        )}
        <Viewport
          stageRef={stageRef}
          designId={editDesignId}
          pixels={pixels}
          isEditing={isEditing}
          onPixelPaint={handlePixelPaint}
          layerOrder={layerOrder}
          onCopy={handleCopy}
          onPaste={handlePaste}
          selection={selection}
          setSelection={setSelection}
        />
      </Box>

      {isEditing && colors && (
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

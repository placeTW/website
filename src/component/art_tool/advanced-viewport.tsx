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
import { Canvas, Pixel } from "../../types/art-tool";
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

  const clearOnDesignPattern = createCheckerboardPattern(
    "#eee",
    "#fff"
  ).toDataURL();
  const clearOnMainPattern = createCheckerboardPattern(
    "#fc7e7e",
    "#fff"
  ).toDataURL();

  const mergeWithExistingPixels = (
    basePixels: ViewportPixel[],
    newEditedPixels: ViewportPixel[]
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

  const recalculatePixels = useCallback(
    (basePixels: ViewportPixel[]) => {
      const mergedPixels = mergeWithExistingPixels(basePixels, editedPixels);
      if (JSON.stringify(mergedPixels) !== JSON.stringify(pixels)) {
        setPixels(mergedPixels);
        onUpdatePixels(mergedPixels);
      }
    },
    [editedPixels, pixels, onUpdatePixels]
  );

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
            )
        );

        const finalPixels = [...updatedPixels, ...newPixels];
        requestAnimationFrame(() => recalculatePixels(finalPixels));
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
        (p) => !(p.x === x && p.y === y && p.designId === editDesignId)
      );
      updatedPixels.push(newPixel);

      requestAnimationFrame(() => recalculatePixels(updatedPixels));
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
        pixel.y < y + height
    );

    const selectedEditedPixels = editedPixels.filter(
      (pixel) =>
        pixel.designId === editDesignId &&
        pixel.x >= x &&
        pixel.x < x + width &&
        pixel.y >= y &&
        pixel.y < y + height
    );

    const combinedPixels = [...selectedPixels, ...selectedEditedPixels];

    const uniquePixels = new Map<string, ViewportPixel>();
    combinedPixels.forEach((pixel) =>
      uniquePixels.set(`${pixel.x}-${pixel.y}`, pixel)
    );

    let finalCopiedPixels = Array.from(uniquePixels.values());

    const topLeftPixel = getTopLeftCoords(finalCopiedPixels);

    finalCopiedPixels = offsetPixels(finalCopiedPixels, topLeftPixel).map(
      (pixel) => ({
        ...pixel,
        designId: -1,
      })
    );

    setCopyBuffer(finalCopiedPixels);
  }, [selection, pixels, editedPixels, editDesignId]);

  const handlePaste = useCallback(
    (pasteX: number, pasteY: number) => {
      if (!isEditing || !editDesignId || copyBuffer.length === 0) return;

      const pastedPixels = copyBuffer.map((pixel) => ({
        ...pixel,
        x: pixel.x + pasteX,
        y: pixel.y + pasteY,
        designId: editDesignId,
      }));

      undoManager.addState({ editedPixels: [...editedPixels] });

      setEditedPixels((prevEditedPixels) => {
        const updatedPixels = [...prevEditedPixels, ...pastedPixels];
        requestAnimationFrame(() => recalculatePixels(updatedPixels));
        return updatedPixels;
      });
    },
    [isEditing, editDesignId, copyBuffer, undoManager, editedPixels, recalculatePixels]
  );

  useEffect(() => {
    if (isEditing) {
      recalculatePixels(pixels);
    }
  }, [isEditing, recalculatePixels, pixels]);

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
      recalculatePixels(pixels);
      undoManager.clearHistory();
    }

    if (stageRef.current) {
      stageRef.current.draggable(true);
    }
  }, [editedPixels.length, isEditing, recalculatePixels, undoManager, pixels]);

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
              (pointer.x - stage.x()) / (GRID_SIZE * scale)
            );
            const pasteY = Math.floor(
              (pointer.y - stage.y()) / (GRID_SIZE * scale)
            );
            handlePaste(pasteX, pasteY);
          }
        }
      } else if (e.ctrlKey && e.key === "z" && undoManager.hasHistory()) {
        const previousState = undoManager.undo();
        if (previousState) {
          setEditedPixels(previousState.editedPixels);
          requestAnimationFrame(() => recalculatePixels(previousState.editedPixels));
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

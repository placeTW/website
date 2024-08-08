import { Box, Grid, Tooltip } from "@chakra-ui/react";
import Konva from "konva"; // Import Konva
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  databaseFetchDesigns,
  removeSupabaseChannel,
  supabase,
} from "../../api/supabase";
import { Design, Pixel } from "../../types/art-tool";
import Viewport from "../viewport/Viewport";
import {
  CLEAR_ON_DESIGN,
  CLEAR_ON_MAIN,
  GRID_SIZE,
} from "../viewport/constants";
import { ViewportPixel } from "../viewport/types";

interface AdvancedViewportProps {
  isEditing: boolean;
  editDesignId: number | null;
  visibleLayers: number[];
  onUpdatePixels: (pixels: ViewportPixel[]) => void;
  colors: { Color: string; color_sort: number | null; color_name: string }[]; // Include color_name
}

const AdvancedViewport: React.FC<AdvancedViewportProps> = ({
  isEditing,
  editDesignId,
  visibleLayers,
  onUpdatePixels,
  colors,
}) => {
  const [pixels, setPixels] = useState<ViewportPixel[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [editedPixels, setEditedPixels] = useState<ViewportPixel[]>([]);
  const previousVisibleLayers = useRef<number[]>(visibleLayers); // Initialize with visibleLayers
  const [selection, setSelection] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [copyBuffer, setCopyBuffer] = useState<ViewportPixel[]>([]);
  const stageRef = useRef<Konva.Stage>(null); // Define stageRef

  // Function to create a checkerboard pattern as an HTMLCanvasElement
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

  // Generate checkerboard patterns for the special colors
  const clearOnDesignPatternCanvas = createCheckerboardPattern("#eee", "#fff");
  const clearOnMainPatternCanvas = createCheckerboardPattern("#fc7e7e", "#fff"); // Opaque pink and white checkerboard

  const clearOnDesignPattern = clearOnDesignPatternCanvas.toDataURL();
  const clearOnMainPattern = clearOnMainPatternCanvas.toDataURL();

  // Fetch pixels based on visible layers
  useEffect(() => {
    // Check if visibleLayers has actually changed
    if (
      JSON.stringify(previousVisibleLayers.current) !==
      JSON.stringify(visibleLayers)
    ) {
      previousVisibleLayers.current = visibleLayers;

      const fetchPixels = async () => {
        if (visibleLayers.length === 0) {
          setPixels([]);
          return;
        }

        const designs = await databaseFetchDesigns();

        if (designs) {
          const allVisiblePixels = await Promise.all(
            visibleLayers.map(async (layer) => {
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

          setPixels(allVisiblePixels.flat());
        }
      };

      fetchPixels();
    }
  }, [visibleLayers]); // Updated dependencies: only visibleLayers to avoid unnecessary re-renders

  // Real-time subscription to pixel changes
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

                // Merge updatedPixels with existing pixels
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
                return Array.from(pixelMap.values());
              } else {
                console.warn(
                  "updatedDesign.pixels is undefined. Skipping update.",
                );
                return prevPixels;
              }
            } else {
              // Handle other event types like INSERT and DELETE
              return prevPixels;
            }
          });
        },
      )
      .subscribe();

    return () => {
      removeSupabaseChannel(pixelSubscription); // Ensure cleanup
    };
  }, []); // Empty dependency array to run only on mount

  // Merge pixels from different layers with edited pixels for rendering
  useEffect(() => {
    if (isEditing) {
      const pixelMap = new Map<string, ViewportPixel>();

      // Add existing pixels to the map first
      pixels.forEach((pixel) => {
        pixelMap.set(`${pixel.x}-${pixel.y}-${pixel.designId}`, pixel);
      });

      // Overwrite with edited pixels (assuming designName is available)
      editedPixels.forEach((pixel) => {
        if (pixel.color !== CLEAR_ON_DESIGN && editDesignId) {
          pixelMap.set(`${pixel.x}-${pixel.y}-${pixel.designId}`, pixel);
        } else {
          pixelMap.delete(`${pixel.x}-${pixel.y}-${pixel.designId}`);
        }
      });

      // Only set pixels if they have actually changed
      const newPixelsArray = Array.from(pixelMap.values());
      if (JSON.stringify(newPixelsArray) !== JSON.stringify(pixels)) {
        setPixels(newPixelsArray);
      }
    }
  }, [editedPixels, isEditing, editDesignId, pixels]);

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

  // Function to regenerate pixels array from scratch
  const regeneratePixels = useCallback(async () => {
    if (visibleLayers.length === 0) {
      setPixels([]); // No layers, so empty pixels array
      return;
    }

    const designs = await databaseFetchDesigns();

    const allVisiblePixels = await Promise.all(
      visibleLayers.map(async (layer) => {
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

    setPixels(allVisiblePixels.flat());
  }, [visibleLayers]);

  // Clear edited pixels on submission or exit from edit mode
  useEffect(() => {
    if (!isEditing) {
      setEditedPixels([]);
      regeneratePixels();
    }
  }, [isEditing, regeneratePixels]); // Ensure it only runs when editing state changes

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);

    if (selection && isEditing && editDesignId) {
      const { x, y, width, height } = selection;

      // Create an array to hold the new pixels
      const newPixels: ViewportPixel[] = [];

      // Iterate over the selection area
      for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
          const pixelX = x + i;
          const pixelY = y + j;

          // Add new pixel to the array, including CLEAR_ON_DESIGN as a regular color
          newPixels.push({
            x: pixelX,
            y: pixelY,
            color,
            designId: editDesignId,
          });
        }
      }

      // Update the edited pixels with the new fill
      setEditedPixels((prevEditedPixels) => {
        // Filter out any existing pixels in the same positions
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

        // Add the new pixels
        const finalPixels = [...updatedPixels, ...newPixels];
        requestAnimationFrame(() => onUpdatePixels(finalPixels)); // Defer the state update to the next frame
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

    setEditedPixels((prevEditedPixels) => {
      const updatedPixels = prevEditedPixels.filter(
        (p) => !(p.x === x && p.y === y && p.designId === editDesignId),
      );
      updatedPixels.push(newPixel);
      requestAnimationFrame(() => onUpdatePixels(updatedPixels)); // Defer the state update to the next frame
      return updatedPixels;
    });
  };

  // Handle Copy Pixels
  const handleCopy = useCallback(() => {
    if (selection && pixels && editDesignId) {
      const { x, y, width, height } = selection;

      // Filter pixels that are part of the current design layer or added during the current session
      const selectedPixels = pixels.filter(
        (pixel) =>
          pixel.designId === editDesignId && // Only include pixels from the current design layer
          pixel.x >= x &&
          pixel.y >= y &&
          pixel.x < x + width &&
          pixel.y < y + height,
      );

      // Include edited pixels (those added in the current session)
      const selectedEditedPixels = editedPixels.filter(
        (pixel) =>
          pixel.designId === editDesignId && // Ensure these are part of the current design
          pixel.x >= x &&
          pixel.y >= y &&
          pixel.x < x + width &&
          pixel.y < y + height,
      );

      // Combine both arrays, ensuring no duplicates
      const combinedPixels = [...selectedPixels, ...selectedEditedPixels];

      // Remove any duplicates by creating a Map
      const uniquePixels = new Map<string, ViewportPixel>();
      combinedPixels.forEach((pixel) =>
        uniquePixels.set(`${pixel.x}-${pixel.y}`, pixel),
      );

      const finalCopiedPixels = Array.from(uniquePixels.values());

      // Set the copy buffer
      setCopyBuffer(finalCopiedPixels);
    }
  }, [selection, pixels, editedPixels, editDesignId]);

  // Handle Paste Pixels
  const handlePaste = useCallback(
    (pasteX: number, pasteY: number) => {
      if (!isEditing || !editDesignId || copyBuffer.length === 0 || !selection)
        return;

      // Get the top-left corner of the full selection area
      const { x: selectionX, y: selectionY } = selection;

      // Calculate the offset needed to align the top-left corner of the selection with the paste location
      const offsetX = pasteX - selectionX;
      const offsetY = pasteY - selectionY;

      // Apply the offset to all copied pixels
      const pastedPixels = copyBuffer.map((pixel) => ({
        ...pixel,
        x: pixel.x + offsetX,
        y: pixel.y + offsetY,
        designId: editDesignId,
      }));

      setEditedPixels((prevEditedPixels) => {
        const updatedPixels = [...prevEditedPixels, ...pastedPixels];
        requestAnimationFrame(() => onUpdatePixels(updatedPixels)); // Defer the state update to the next frame
        return updatedPixels;
      });
    },
    [copyBuffer, isEditing, editDesignId, onUpdatePixels, selection],
  );

  // Global keydown listener for copy/paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "c") {
        handleCopy();
      } else if (e.ctrlKey && e.key === "v") {
        // Paste at the current cursor position
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleCopy, handlePaste]); // Ensure these functions are included in the dependency array

  return (
    <Box position="relative" height="100%">
      <Box height="100%">
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
          stageRef={stageRef} // Pass stageRef to Viewport
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
                label={color.color_name} // Display color name on hover
                aria-label={`Tooltip for ${color.color_name}`}
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

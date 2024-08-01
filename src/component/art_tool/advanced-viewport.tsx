import React, { useEffect, useState, useRef } from "react";
import { Box, Grid } from "@chakra-ui/react";
import Viewport from "./viewport";
import { supabase } from "../../api/supabase";
import { databaseFetchPixels } from "../../api/supabase/database";

interface Pixel {
  id?: number;
  x: number;
  y: number;
  color: string;
  canvas: string;
}

interface AdvancedViewportProps {
  isEditing: boolean;
  editDesignId: string | null;
  visibleLayers: string[];
  onUpdatePixels: (pixels: Pixel[]) => void;
  designName: string;
  onExitEditMode: () => void; // Prop to notify when exiting edit mode
}

const AdvancedViewport: React.FC<AdvancedViewportProps> = ({
  isEditing,
  editDesignId,
  visibleLayers,
  onUpdatePixels,
  designName,
  onExitEditMode,
}) => {
  const [colors, setColors] = useState<{ Color: string; color_sort: number | null }[]>([]);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [editedPixels, setEditedPixels] = useState<Pixel[]>([]);
  const previousVisibleLayers = useRef<string[]>([]);

  // Fetch colors on mount
  useEffect(() => {
    const fetchColors = async () => {
      const { data, error } = await supabase
        .from("art_tool_colors")
        .select("Color, color_sort")
        .order("color_sort", { ascending: true });
      if (error) {
        console.error("Error fetching colors:", error);
      } else {
        setColors(data);
      }
    };

    fetchColors();

    const colorSubscription = supabase
      .channel("realtime-art_tool_colors")
      .on("postgres_changes", { event: "*", schema: "public", table: "art_tool_colors" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setColors((prevColors) => [...prevColors, payload.new as { Color: string; color_sort: number | null }].sort((a, b) => (a.color_sort ?? 0) - (b.color_sort ?? 0)));
        } else if (payload.eventType === "DELETE") {
          setColors((prevColors) =>
            prevColors.filter((color) => color.Color !== payload.old.Color)
          );
        } else if (payload.eventType === "UPDATE") {
          setColors((prevColors) =>
            prevColors.map((color) =>
              color.Color === payload.old.Color ? payload.new as { Color: string; color_sort: number | null } : color
            ).sort((a, b) => (a.color_sort ?? 0) - (b.color_sort ?? 0))
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(colorSubscription);
    };
  }, []);

  // Fetch pixels based on visible layers
  useEffect(() => {
    const layersToFetch = ["main", ...visibleLayers.filter((layer) => layer !== "main")];

    if (JSON.stringify(previousVisibleLayers.current) !== JSON.stringify(layersToFetch)) {
      previousVisibleLayers.current = layersToFetch;

      const fetchPixels = async () => {
        if (layersToFetch.length === 0) {
          setPixels([]);
          return;
        }

        const allVisiblePixels = await Promise.all(
          layersToFetch.map((layer) => databaseFetchPixels(layer))
        );
        setPixels(allVisiblePixels.flat());
      };

      fetchPixels();
    }
  }, [visibleLayers]);

  // Real-time subscription to pixel changes
  useEffect(() => {
    const pixelSubscription = supabase
      .channel("realtime-art_tool_pixels")
      .on("postgres_changes", { event: "*", schema: "public", table: "art_tool_pixels" }, (payload) => {
        const updatedPixel: Pixel = payload.new;

        setPixels((prevPixels) => {
          const pixelMap = new Map<string, Pixel>();

          // Add existing pixels to the map first
          prevPixels.forEach((pixel) => {
            pixelMap.set(`${pixel.x}-${pixel.y}-${pixel.canvas}`, pixel);
          });

          // Handle the event based on its type
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            pixelMap.set(`${updatedPixel.x}-${updatedPixel.y}-${updatedPixel.canvas}`, updatedPixel);
          } else if (payload.eventType === "DELETE") {
            pixelMap.delete(`${updatedPixel.x}-${updatedPixel.y}-${updatedPixel.canvas}`);
          }

          return Array.from(pixelMap.values());
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(pixelSubscription);
    };
  }, []);

  // Merge pixels from different layers with edited pixels
  useEffect(() => {
    const pixelMap = new Map<string, Pixel>();

    // Add existing pixels to the map first
    pixels.forEach((pixel) => {
      pixelMap.set(`${pixel.x}-${pixel.y}-${pixel.canvas}`, pixel);
    });

    // Overwrite with any edited pixels
    editedPixels.forEach((pixel) => {
      pixelMap.set(`${pixel.x}-${pixel.y}-${pixel.canvas}`, pixel);
    });

    const mergedPixels = Array.from(pixelMap.values());

    setPixels(mergedPixels);
  }, [pixels, editedPixels]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handlePixelPaint = (x: number, y: number) => {
    if (!isEditing || !selectedColor) return;

    const newPixel: Pixel = { x, y, color: selectedColor, canvas: designName };
    const updatedPixels = [...editedPixels, newPixel];

    setEditedPixels(updatedPixels);
    onUpdatePixels(updatedPixels);
  };

  // Clear edited pixels on submission or exit from edit mode
  useEffect(() => {
    if (!isEditing) {
      console.log("Exiting edit mode, clearing editedPixels:", editedPixels); // Log before clearing
      setEditedPixels([]); // Clear the edited pixels array when exiting edit mode

      // Trigger a refetch to update the pixels state with the latest data from the database
      const refetchPixels = async () => {
        const layersToFetch = ["main", ...visibleLayers.filter((layer) => layer !== "main")];
        const allVisiblePixels = await Promise.all(
          layersToFetch.map((layer) => databaseFetchPixels(layer))
        );
        setPixels(allVisiblePixels.flat());
      };

      refetchPixels();
    }
  }, [isEditing, visibleLayers]);

  return (
    <Box position="relative" height="100%">
      <Viewport
        designId={editDesignId}
        pixels={pixels}
        isEditing={isEditing}
        onPixelPaint={handlePixelPaint}
      />

      {isEditing && (
        <Box position="absolute" bottom="10px" left="50%" transform="translateX(-50%)" zIndex="100">
          <Grid templateColumns={`repeat(${colors.length}, 1fr)`} gap={2}>
            {colors.map((color) => (
              <Box
                key={color.Color}
                w="30px"
                h="30px"
                bg={color.Color}
                border={selectedColor === color.Color ? "2px solid black" : "1px solid #ccc"}
                cursor="pointer"
                onClick={() => handleColorSelect(color.Color)}
              />
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default AdvancedViewport;

import React, { useEffect, useState, useRef } from "react";
import { Box, Grid } from "@chakra-ui/react";
import Viewport from "./viewport";
import { supabase } from "../../api/supabase";
import { databaseFetchPixels } from "../../api/supabase/database"; // Ensure this import is here

interface AdvancedViewportProps {
  isEditing: boolean;
  editDesignId: string | null;
  visibleLayers: string[]; // New prop for visible layers
}

// Utility function for deep comparison of arrays
const arraysEqual = (a: any[], b: any[]) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const AdvancedViewport: React.FC<AdvancedViewportProps> = ({ isEditing, editDesignId, visibleLayers }) => {
  const [colors, setColors] = useState<{ Color: string, color_sort: number | null }[]>([]);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const previousVisibleLayers = useRef<string[]>([]); // to keep track of previous visible layers

  useEffect(() => {
    // Fetch initial colors from Supabase and order them by color_sort
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

    // Set up real-time subscription for color changes
    const colorSubscription = supabase
      .channel('realtime-art_tool_colors')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'art_tool_colors' }, (payload) => {
        console.log('Change received!', payload);

        if (payload.eventType === 'INSERT') {
          setColors((prevColors) => [...prevColors, payload.new as { Color: string; color_sort: number | null; }].sort((a, b) => (a.color_sort ?? 0) - (b.color_sort ?? 0)));
        } else if (payload.eventType === 'DELETE') {
          setColors((prevColors) =>
            prevColors.filter((color) => color.Color !== payload.old.Color)
          );
        } else if (payload.eventType === 'UPDATE') {
          setColors((prevColors) =>
            prevColors.map((color) =>
              color.Color === payload.old.Color ? payload.new as { Color: string; color_sort: number | null; } : color
            ).sort((a, b) => (a.color_sort ?? 0) - (b.color_sort ?? 0))
          );
        }
      })
      .subscribe();

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(colorSubscription);
    };
  }, []);

  useEffect(() => {
    // Check if the visible layers have actually changed
    if (arraysEqual(previousVisibleLayers.current, visibleLayers)) {
      return;
    }
    previousVisibleLayers.current = visibleLayers;

    const fetchPixels = async () => {
      if (visibleLayers.length === 0) {
        setPixels([]); // Clear pixels if no layers are visible
        return;
      }

      const allVisiblePixels = await Promise.all(
        visibleLayers.map(layer => databaseFetchPixels(layer))
      );
      setPixels(allVisiblePixels.flat());
    };

    fetchPixels();
  }, [visibleLayers]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    // Do something with the selected color (e.g., update design)
  };

  return (
    <Box position="relative" height="100%">
      <Viewport designId={editDesignId} pixels={pixels} /> {/* Pass pixels directly */}

      {/* Conditionally render the color palette */}
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

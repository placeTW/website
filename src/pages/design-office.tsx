import { Box, Spinner, useToast } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { supabase } from "../api/supabase";
import {
  databaseFetchCanvases,
  databaseFetchColors,
  databaseFetchDesigns,
  removeSupabaseChannel,
  saveEditedPixels,
  uploaDesignThumbnailToSupabase,
} from "../api/supabase/database";
import AdvancedViewport from "../component/art_tool/advanced-viewport";
import CreateDesignButton from "../component/art_tool/create-design-button";
import DesignCardsList from "../component/art_tool/design-cards-list";
import {
  CLEAR_ON_DESIGN,
  CLEAR_ON_MAIN,
} from "../component/viewport/constants";
import { Canvas, Design, Pixel } from "../types/art-tool";
import { createThumbnail } from "../utils/imageUtils";

const DesignOffice: React.FC = () => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [visibleDesigns, setVisibleDesigns] = useState<Design[]>([]);
  const [colors, setColors] = useState<
    { Color: string; color_sort: number | null; color_name: string }[] // Updated type
  >([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesignId, setEditDesignId] = useState<number | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<number[]>([]);
  const [editedPixels, setEditedPixels] = useState<Pixel[]>([]);
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [selectedCanvas, setSelectedCanvas] = useState<Canvas | null>(null);
  const toast = useToast();

  const fetchDesigns = async () => {
    const data = await databaseFetchDesigns();
    if (data) {
      setDesigns(data);
    }
    setLoading(false);
  };

  const fetchColors = async () => {
    try {
      const fetchedColors = await databaseFetchColors();

      const colorsWithNames = fetchedColors.map((color) => ({
        ...color,
        color_name: color.color_name || "Unnamed",
      }));

      const specialColors = [
        {
          Color: CLEAR_ON_DESIGN,
          color_sort: null,
          color_name: "Clear on Design",
        },
        { Color: CLEAR_ON_MAIN, color_sort: null, color_name: "Clear on Main" },
      ];

      setColors([...colorsWithNames, ...specialColors]);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch colors: ${
          (error as Error).message || error
        }`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditStateChange = (
    isEditing: boolean,
    designId: number | null,
  ) => {
    setIsEditing(isEditing);
    setEditDesignId(designId);
  };

  const handleVisibilityChange = (newVisibleLayers: number[]) => {
    setVisibleLayers(newVisibleLayers);
  };

  const handleUpdatePixels = (pixels: Pixel[]) => {
    if (pixels && pixels.length > 0) {
      setEditedPixels(pixels);
    } else {
      setEditedPixels([]); // Ensure state is reset if the array is empty or undefined
    }
  };

  // Function to handle the submission of edited pixels
  const handleSubmitEdit = async () => {
    if (!editDesignId) return;

    const currentDesign = designs.find((d) => d.id === editDesignId);
    if (!currentDesign) return;

    try {
      const existingPixelMap = new Map<string, Pixel>();

      editedPixels.forEach((pixel) => {
        // Ensure we are only handling the current design
        if (pixel.designId === editDesignId) {
          // This check should work now
          if (pixel.color === CLEAR_ON_DESIGN) {
            existingPixelMap.delete(`${pixel.x}-${pixel.y}`);
          } else {
            existingPixelMap.set(`${pixel.x}-${pixel.y}`, {
              ...pixel,
              x: pixel.x - currentDesign.x,
              y: pixel.y - currentDesign.y,
            });
          }
        }
      });

      const mergedPixels = Array.from(existingPixelMap.values()).filter(
        (pixel) => pixel.color !== CLEAR_ON_DESIGN,
      );

      const updatedDesign = await saveEditedPixels(currentDesign, mergedPixels);

      setDesigns((prevDesigns) =>
        prevDesigns.map((d) => (d.id === updatedDesign.id ? updatedDesign : d)),
      );

      const thumbnailBlob = await createThumbnail(updatedDesign.pixels);
      await uploaDesignThumbnailToSupabase(thumbnailBlob, currentDesign);

      toast({
        title: "Changes Saved",
        description: `${currentDesign.design_name} has been updated successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Clear the editedPixels array after submission
      setEditedPixels([]);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save changes: ${
          (error as Error).message || error
        }`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchCanvases = async () => {
    try {
      const fetchedCanvases = await databaseFetchCanvases();
      if (fetchedCanvases) {
        setCanvases(fetchedCanvases);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch canvases: ${
          (error as Error).message || error
        }`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSetDesignCanvas = (designId: number, canvasId: number) => {
    // Update the selectedCanvas state to trigger a re-render of AdvancedViewport
    const updatedCanvas = canvases.find((canvas) => canvas.id === canvasId);
    setSelectedCanvas(updatedCanvas || null);
    console.log(
      `Design ${designId} set to canvas ${selectedCanvas?.canvas_name}`,
    );
  };

  const handleSetCanvas = (canvas: Canvas | null) => {
    let canvasDesigns: Design[] = [];
    if (canvas) {
      canvasDesigns = designs.filter(
        (design) =>
          design.canvas === canvas.id ||
          (isEditing && design.id === editDesignId),
      );
    } else {
      canvasDesigns = designs.filter(
        (design) =>
          design.canvas === null || (isEditing && design.id === editDesignId),
      );
    }

    setSelectedCanvas(canvas);
    setVisibleDesigns(canvasDesigns);
    setVisibleLayers(canvasDesigns.map((design) => design.id));
  };

  const handleResetViewport = () => {
    setVisibleLayers([]);
    setVisibleDesigns(designs);
    setSelectedCanvas(null);
  };

  const handleOnDeleted = (designId: number) => {
    setEditDesignId(null);
    // Remove the design's pixels from the viewport
    setVisibleLayers((prevLayers) => prevLayers.filter((id) => id !== designId));
  };

  useEffect(() => {
    setVisibleDesigns(designs);
  }, [designs]);

  useEffect(() => {
    fetchDesigns();
    fetchColors();
    fetchCanvases();

    const subscription = supabase
      .channel("art_tool_designs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_designs" },
        async () => {
          await fetchDesigns();
        },
      )
      .subscribe();

    return () => {
      removeSupabaseChannel(subscription);
    };
  }, []);

  if (loading) {
    return <Spinner size="xl" />;
  }

  return (
    <Box
      display="grid"
      gridTemplateColumns="1fr 350px"
      height="calc(100vh - 80px)"
      overflow="hidden"
      position="relative"
    >
      <Box border="1px solid #ccc" overflow="hidden">
        <AdvancedViewport
          isEditing={isEditing}
          editDesignId={editDesignId}
          visibleLayers={visibleLayers}
          onUpdatePixels={handleUpdatePixels}
          colors={colors}
          canvases={canvases}
          selectedCanvas={selectedCanvas}
          onSelectCanvas={handleSetCanvas}
          onResetViewport={handleResetViewport}
        />
      </Box>
      <Box overflowY="auto">
        <DesignCardsList
          designs={visibleDesigns}
          visibleLayers={visibleLayers}
          onEditStateChange={handleEditStateChange}
          onVisibilityChange={handleVisibilityChange}
          onSubmitEdit={handleSubmitEdit}
          onSetCanvas={handleSetDesignCanvas}
          onDeleted={handleOnDeleted} // Add this line to pass onDeleted prop
        />
        <Box h="100px" /> {/* Spacer at the bottom */}
      </Box>
      <Box position="absolute" bottom="30px" right="30px" zIndex="1000">
        <CreateDesignButton />
      </Box>
    </Box>
  );
};

export default DesignOffice;

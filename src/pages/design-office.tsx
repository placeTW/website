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
    { Color: string; color_sort: number | null; color_name: string }[]
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
      setVisibleDesigns(data);
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
        {
          Color: CLEAR_ON_MAIN,
          color_sort: null,
          color_name: "Clear on Main",
        },
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

  const handleEditStateChange = (isEditing: boolean, designId: number | null) => {
    setIsEditing(isEditing);
    setEditDesignId(designId);
  };

  const handleVisibilityChange = (newVisibleLayers: number[]) => {
    setVisibleLayers(newVisibleLayers);
  };

  const handleUpdatePixels = (pixels: Pixel[]) => {
    setEditedPixels(pixels);
  };

  const handleSubmitEdit = async () => {
    if (!editDesignId) return;

    const currentDesign = designs.find((d) => d.id === editDesignId);
    if (!currentDesign) return;

    try {
      const existingPixelMap = new Map<string, Pixel>();
      currentDesign.pixels.forEach((pixel) => {
        existingPixelMap.set(`${pixel.x}-${pixel.y}`, pixel);
      });

      editedPixels.forEach((pixel) => {
        if (pixel.color === CLEAR_ON_DESIGN) {
          existingPixelMap.delete(
            `${pixel.x - currentDesign.x}-${pixel.y - currentDesign.y}`
          );
        } else {
          existingPixelMap.set(`${pixel.x}-${pixel.y}`, {
            ...pixel,
            x: pixel.x - currentDesign.x,
            y: pixel.y - currentDesign.y,
          });
        }
      });

      const mergedPixels = Array.from(existingPixelMap.values()).filter(
        (pixel) => pixel.color !== CLEAR_ON_DESIGN
      );

      const updatedDesign = await saveEditedPixels(currentDesign, mergedPixels);

      setDesigns((prevDesigns) =>
        prevDesigns.map((d) => (d.id === updatedDesign.id ? updatedDesign : d))
      );

      const thumbnailBlob = await createThumbnail(mergedPixels);
      await uploaDesignThumbnailToSupabase(thumbnailBlob, currentDesign);

      toast({
        title: "Changes Saved",
        description: `${currentDesign.design_name} has been updated successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

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
    const updatedCanvas = canvases.find((canvas) => canvas.id === canvasId);
    setSelectedCanvas(updatedCanvas || null);
    console.log(
      `Design ${designId} set to canvas ${updatedCanvas?.canvas_name}`
    );
  };

  const handleSetCanvas = (canvas: Canvas | null) => {
    const canvasDesigns = designs.filter(
      (design) =>
        design.canvas === (canvas ? canvas.id : null) ||
        (isEditing && design.id === editDesignId)
    );

    setSelectedCanvas(canvas);
    setVisibleDesigns(canvasDesigns);
    setVisibleLayers(canvasDesigns.map((design) => design.id));
  };

  const handleResetViewport = () => {
    setVisibleLayers([]);
    setVisibleDesigns(designs);
    setSelectedCanvas(null);
  };

  const handleOnDeleted = () => {
    setEditDesignId(null);
  };

  useEffect(() => {
    fetchDesigns();
    fetchColors();
    fetchCanvases();

    const subscription = supabase
      .channel("art_tool_designs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_designs" },
        () => {
          fetchDesigns();
        }
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
          onDeleted={handleOnDeleted}
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

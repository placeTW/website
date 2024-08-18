import { Box, Spinner, useToast } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { supabase } from "../api/supabase";
import {
  databaseFetchCanvases,
  databaseFetchColors,
  databaseFetchDesigns,
  removeSupabaseChannel,
  saveEditedPixels,
  uploadDesignThumbnailToSupabase, // Corrected function name
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
import { offsetPixels } from "../utils/pixelUtils";

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
  const [editedPixels, setEditedPixels] = useState<Pixel[]>([]); // State to track edited pixels
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
    setEditedPixels([]); // Clear the editedPixels array when exiting edit mode
    if (isEditing && designId) {
      setVisibleLayers((prevLayers) => [
        ...prevLayers.filter((id) => id !== designId),
        designId,
      ]);
    }
  };

  const handleVisibilityChange = (newVisibleLayers: number[]) => {
    setVisibleLayers(newVisibleLayers);
  };

  const handleSubmitEdit = async (designName: string) => {
    if (!editDesignId) return;

    const currentDesign = designs.find((d) => d.id === editDesignId);
    if (!currentDesign) return;

    try {
      const newPixels = offsetPixels(editedPixels, {
        x: currentDesign.x,
        y: currentDesign.y,
      });
      const updatedDesign = await saveEditedPixels(currentDesign, newPixels, designName); // Save the designName

      setDesigns((prevDesigns) =>
        prevDesigns.map((d) => (d.id === updatedDesign.id ? updatedDesign : d)),
      );

      const thumbnailBlob = await createThumbnail(updatedDesign.pixels);
      await uploadDesignThumbnailToSupabase(thumbnailBlob, currentDesign);

      toast({
        title: "Changes Saved",
        description: `${designName} has been updated successfully.`,
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
    setVisibleLayers((prevLayers) =>
      prevLayers.filter((id) => id !== designId),
    );
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
          colors={colors}
          canvases={canvases}
          selectedCanvas={selectedCanvas}
          onSelectCanvas={handleSetCanvas}
          onResetViewport={handleResetViewport}
          editedPixels={editedPixels} // Pass editedPixels to AdvancedViewport
          setEditedPixels={setEditedPixels}
        />
      </Box>
      <Box overflowY="auto">
        <DesignCardsList
          designs={visibleDesigns}
          visibleLayers={visibleLayers}
          onEditStateChange={handleEditStateChange}
          onVisibilityChange={handleVisibilityChange}
          onSubmitEdit={handleSubmitEdit} // Pass handleSubmitEdit function
          onSetCanvas={handleSetDesignCanvas}
          onDeleted={handleOnDeleted}
          editedPixels={editedPixels} // Pass editedPixels to DesignCardsList
        />
        <Box h="100px" /> 
      </Box>
      <Box position="absolute" bottom="30px" right="30px" zIndex="1000">
        <CreateDesignButton />
      </Box>
    </Box>
  );
};

export default DesignOffice;

import { Box, Flex, Spinner, useToast } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { supabase } from "../api/supabase";
import {
  databaseFetchDesignsWithUserDetails,
  saveEditedPixels,
  databaseFetchPixels,
  databaseFetchColors,
  uploadThumbnailToSupabase,
  updateDesignThumbnail
} from "../api/supabase/database";
import CreateDesignButton from "../component/art_tool/create-design-button";
import DesignCardsList from "../component/art_tool/design-cards-list";
import AdvancedViewport from "../component/art_tool/advanced-viewport";
import { DesignInfo, Pixel } from "../types/art-tool";
import { createThumbnail } from "../utils/imageUtils";

const DesignOffice: React.FC = () => {
  const [designs, setDesigns] = useState<DesignInfo[]>([]);
  const [colors, setColors] = useState<{ Color: string; color_sort: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesignId, setEditDesignId] = useState<string | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<string[]>([]);
  const [editedPixels, setEditedPixels] = useState<Omit<Pixel, "id">[]>([]);
  const toast = useToast();

  const fetchLayersWithUserDetails = async () => {
    try {
      const data = await databaseFetchDesignsWithUserDetails();
      const formattedData = (data || []).map((item: any) => ({
        id: item.id.toString(),
        design_name: item.design_name,
        created_by: item.created_by,
        handle: item.art_tool_users.handle || "",
        rank: item.art_tool_users.rank || "",
        rank_name: item.art_tool_users.rank_name || "",
        liked_by: item.liked_by,
        design_thumbnail: item.design_thumbnail,
      }));
      setDesigns(formattedData);
    } catch (error) {
      console.error("Error fetching layers with user details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchColors = async () => {
    try {
      const fetchedColors = await databaseFetchColors();

      // Append the special colors on the client-side
      const specialColors = [
        { Color: "ClearOnDesign", color_sort: null },
        { Color: "ClearOnMain", color_sort: null },
      ];

      setColors([...fetchedColors, ...specialColors]);
    } catch (error) {
      console.error("Error fetching colors:", error);
    }
  };

  const handleEditStateChange = (isEditing: boolean, designId: string | null) => {
    setIsEditing(isEditing);
    setEditDesignId(designId);
  };

  const handleVisibilityChange = (newVisibleLayers: string[]) => {
    console.log("Visibility changed:", newVisibleLayers);
    setVisibleLayers(newVisibleLayers);
  };

  const handleUpdatePixels = (pixels: Omit<Pixel, "id">[]) => {
    if (pixels && pixels.length > 0) {
      console.log("Updating editedPixels with:", pixels);
      setEditedPixels(pixels);
    } else {
      console.warn("handleUpdatePixels received undefined or empty pixels array.");
      setEditedPixels([]); // Ensure state is reset if the array is empty or undefined
    }
  };

  // Function to handle the submission of edited pixels
  const handleSubmitEdit = async () => {
    if (!editDesignId) return;

    const currentDesign = designs.find((d) => d.id === editDesignId);
    if (!currentDesign) return;

    try {
      // Step 1: Fetch existing pixels for the design
      const existingPixels = await databaseFetchPixels(currentDesign.design_name);

      // Ensure existingPixels is an array
      let allPixels = [...(existingPixels || []), ...editedPixels];

      // Step 2: Process special colors
      const filteredPixels = allPixels.filter((pixel) => pixel.color !== "ClearOnDesign");

      // Step 3: Save filtered pixels to the database
      await saveEditedPixels(currentDesign.design_name, filteredPixels.map(({ x, y, color, canvas }) => ({ x, y, color, canvas }))); // Exclude `id`

      // Step 4: Generate a thumbnail of the current design with filtered pixels
      const thumbnailBlob = await createThumbnail(filteredPixels);
      const thumbnailUrl = await uploadThumbnailToSupabase(thumbnailBlob, currentDesign.id);

      // Step 5: Update the database with the new thumbnail URL
      await updateDesignThumbnail(currentDesign.id, thumbnailUrl);

      toast({
        title: "Changes Saved",
        description: `${currentDesign.design_name} has been updated successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsEditing(false); // Exit edit mode after submission
    } catch (error: any) {
      console.error("Error saving edited pixels or updating thumbnail:", error);
      toast({
        title: "Error",
        description: `Failed to save changes: ${error.message}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    console.log("DesignOffice rendered with state:", {
      designs,
      loading,
      isEditing,
      editDesignId,
      visibleLayers,
      editedPixels,
    });

    fetchLayersWithUserDetails();
    fetchColors();

    const subscription = supabase
      .channel("art_tool_designs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_designs" },
        () => {
          fetchLayersWithUserDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [editedPixels]);

  if (loading) {
    return <Spinner size="xl" />;
  }

  const currentDesign = designs.find((d) => d.id === editDesignId);

  return (
    <Flex height="calc(100vh - 80px)" position="relative" direction="row">
      <Box flex="1" border="1px solid #ccc">
        <AdvancedViewport 
          isEditing={isEditing} 
          editDesignId={editDesignId} 
          visibleLayers={visibleLayers.length > 0 ? visibleLayers : ["main"]}
          onUpdatePixels={handleUpdatePixels} 
          designName={currentDesign ? currentDesign.design_name : "main"}
          colors={colors}
        />
      </Box>
      <Box w="350px" overflowY="auto">
        <DesignCardsList 
          designs={designs} 
          onEditStateChange={handleEditStateChange}
          onVisibilityChange={handleVisibilityChange}
          onSubmitEdit={handleSubmitEdit} 
        />
        <Box h="100px" />
      </Box>
      <Box position="absolute" bottom="30px" right="30px" zIndex="1000">
        <CreateDesignButton />
      </Box>
    </Flex>
  );
};

export default DesignOffice;

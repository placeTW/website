import { Box, Flex, Spinner, useToast } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { supabase } from "../api/supabase";
import { databaseFetchDesignsWithUserDetails, saveEditedPixels } from "../api/supabase/database";
import CreateDesignButton from "../component/art_tool/create-design-button";
import DesignCardsList from "../component/art_tool/design-cards-list";
import AdvancedViewport from "../component/art_tool/advanced-viewport";
import { DesignInfo, Pixel } from "../types/art-tool";

const DesignOffice: React.FC = () => {
  const [designs, setDesigns] = useState<DesignInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesignId, setEditDesignId] = useState<string | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<string[]>([]);
  const [editedPixels, setEditedPixels] = useState<Pixel[]>([]); // Store edited pixels
  const toast = useToast();

  const fetchLayersWithUserDetails = async () => {
    try {
      const data = await databaseFetchDesignsWithUserDetails();
      const formattedData = data.map((item: any) => ({
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

  const handleEditStateChange = (isEditing: boolean, designId: string | null) => {
    setIsEditing(isEditing);
    setEditDesignId(designId);
  };

  const handleVisibilityChange = (newVisibleLayers: string[]) => {
    console.log("Visibility changed:", newVisibleLayers);
    setVisibleLayers(newVisibleLayers);
  };

  const handleUpdatePixels = (pixels: Pixel[]) => {
    if (pixels && pixels.length > 0) {
      console.log("Updating editedPixels with:", pixels); // Log the pixels being received
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
      if (editedPixels.length > 0) {
        await saveEditedPixels(currentDesign.design_name, editedPixels); // Ensure correct design name
        toast({
          title: "Changes Saved",
          description: `${currentDesign.design_name} has been updated successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setIsEditing(false); // Exit edit mode after submission
      } else {
        console.warn("No pixels to save or pixels array is undefined.");
      }
    } catch (error) {
      console.error("Error saving edited pixels:", error);
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
      editedPixels, // Log current editedPixels state
    });
    
    fetchLayersWithUserDetails();

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
  }, [editedPixels]); // Add editedPixels to dependency array to observe changes

  if (loading) {
    return <Spinner size="xl" />;
  }

  const currentDesign = designs.find((d) => d.id === editDesignId);

  return (
    <Flex height="calc(100vh - 80px)" position="relative" direction="row">
      <Box flex="1" border="1px solid #ccc">
        {currentDesign && (
          <AdvancedViewport 
            isEditing={isEditing} 
            editDesignId={editDesignId} 
            visibleLayers={visibleLayers}
            onUpdatePixels={handleUpdatePixels} // Pass the handler function
            designName={currentDesign.design_name} // Pass the correct design name
          />
        )}
      </Box>
      <Box w="350px" overflowY="auto">
        <DesignCardsList 
          designs={designs} 
          onEditStateChange={handleEditStateChange}
          onVisibilityChange={handleVisibilityChange}
          onSubmitEdit={handleSubmitEdit} // Pass the submit function
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

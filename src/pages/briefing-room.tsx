import React, { useState, useEffect } from "react";
import { Heading, Box, Text, Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useAlertContext } from "../context/alert-context";
import { databaseFetchCanvases, databaseFetchDesigns } from "../api/supabase/database";
import AdvancedViewport from "../component/art_tool/advanced-viewport";
import { Canvas, Design, Pixel } from "../types/art-tool";

const BriefingRoom: React.FC = () => {
  const { t } = useTranslation();
  const { currentAlertData } = useAlertContext();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [selectedCanvas, setSelectedCanvas] = useState<Canvas | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  
  useEffect(() => {
    const fetchCanvasesAndDesigns = async () => {
      if (currentAlertData?.canvas_id) {
        const fetchedCanvases = await databaseFetchCanvases();
        setCanvases(fetchedCanvases || []);
        
        const selected = fetchedCanvases?.find(c => c.id === currentAlertData.canvas_id) || null;
        setSelectedCanvas(selected);

        if (selected) {
          const allDesigns = await databaseFetchDesigns();
          const filteredDesigns = allDesigns?.filter(design => design.canvas === selected.id) || [];
          setDesigns(filteredDesigns);
        }
      }
    };

    fetchCanvasesAndDesigns();
  }, [currentAlertData]);

  const handleUpdatePixels = (updatedPixels: Pixel[]) => {
    // You can add any necessary logic here if you need to do something with the updated pixels
    console.log("Pixels updated:", updatedPixels);
  };

  const handleResetViewport = () => {
    // Handle viewport reset logic here if needed
  };

  return (
    <Flex direction="column" height="100vh">
      {currentAlertData ? (
        <>
          <Box p={4}>
            <Heading as="h3" size="lg" mb={2}>
              {t(`Status: ${currentAlertData.alert_name}`)}
            </Heading>
            {!!currentAlertData.message && <Text mb={4}>{currentAlertData.message}</Text>}
          </Box>
          <Flex flex="1" overflow="hidden">
            {selectedCanvas && (
              <Box flex="1" overflow="hidden">
                <AdvancedViewport
                  isEditing={false}
                  editDesignId={null}
                  visibleLayers={designs.map(design => design.id)}
                  onUpdatePixels={handleUpdatePixels}
                  colors={[]} 
                  canvases={canvases}
                  selectedCanvas={selectedCanvas}
                  onSelectCanvas={setSelectedCanvas}
                  onResetViewport={handleResetViewport}
                  showCanvasButtons={false}  // Hide the canvas buttons in briefing room
                />
              </Box>
            )}
          </Flex>
        </>
      ) : (
        <Box p={4}>
          <Text>{t("No active alert.")}</Text>
        </Box>
      )}
    </Flex>
  );
};

export default BriefingRoom;

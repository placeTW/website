import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  databaseFetchCanvas,
  databaseFetchDesigns,
} from "../api/supabase/database";
import AdvancedViewport from "../component/art_tool/advanced-viewport";
import { useAlertContext } from "../context/alert-context";
import { Design } from "../types/art-tool";

const BriefingRoom: React.FC = () => {
  const { t } = useTranslation();
  const { currentAlertData } = useAlertContext();
  const [designs, setDesigns] = useState<Design[]>([]);

  useEffect(() => {
    const fetchCanvasesAndDesigns = async () => {
      if (currentAlertData?.canvas_id) {
        const currentAlertCanvas = await databaseFetchCanvas(
          currentAlertData.canvas_id,
        );

        if (currentAlertCanvas) {
          const canvasDesigns = await databaseFetchDesigns(
            currentAlertCanvas.id,
          );
          setDesigns(canvasDesigns ?? []);
        }
      }
    };

    fetchCanvasesAndDesigns();
  }, [currentAlertData]);


  return (
    <Flex direction="column" height="100vh">
      {currentAlertData ? (
        <>
          <Box p={4}>
            <Heading as="h3" size="lg" mb={2}>
              {t(`Status: ${currentAlertData.alert_name}`)}
            </Heading>
            {!!currentAlertData.message && (
              <Text mb={4}>{currentAlertData.message}</Text>
            )}
          </Box>
          <Flex flex="1" border="1px solid #ccc" overflow="hidden">
            {designs && (
              <Box flex="1" overflow="hidden">
                <AdvancedViewport
                  visibleLayers={designs.map((design) => design.id)}
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

import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AdvancedViewport from "../component/art_tool/advanced-viewport";
import { useAlertContext } from "../context/alert-context";
import { useDesignContext } from "../context/design-context";
import { Canvas } from "../types/art-tool";

const BriefingRoom: React.FC = () => {
  const { t } = useTranslation();
  const { currentAlertData } = useAlertContext();
  const { designs, canvases } = useDesignContext();
  const [canvas, setCanvas] = useState<Canvas>();

  // Filter designs based on the active alert level's canvas
  const filteredDesigns = useMemo(() => {
    if (!currentAlertData || !currentAlertData.canvas_id) {
      return [];
    }

    const alertCanvas = canvases.find((c) => c.id === currentAlertData.canvas_id);
    setCanvas(alertCanvas)

    return designs.filter(
      (design) => design.canvas === currentAlertData.canvas_id
    );
  }, [currentAlertData, designs]);

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
            {(filteredDesigns.length > 0 && !!canvas) ? (
              <Box flex="1" overflow="hidden">
                <AdvancedViewport
                  selectedCanvas={canvas}
                  visibleLayers={new Set(filteredDesigns.map((design) => design.id))}
                />
              </Box>
            ) : (
              <Box p={4}>
                <Text>{t("No designs available for the current alert.")}</Text>
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

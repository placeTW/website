import React, { useState, useEffect, useRef } from "react";
import { Heading, Box, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import Viewport from "../component/viewport/Viewport";
import { useAlertContext } from "../context/alert-context";
import { databaseFetchDesigns } from "../api/supabase/database";
import Konva from "konva";
import { ViewportPixel } from "../component/viewport/types";
import { Pixel } from "../types/art-tool";

const BriefingRoom: React.FC = () => {
  const { t } = useTranslation();
  const { alertId, currentAlertData } = useAlertContext();
  const [pixels, setPixels] = useState<ViewportPixel[]>([]);
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    const fetchPixels = async () => {
      const designId = 1; // Replace with the actual design ID or name
      const designs = await databaseFetchDesigns();
      if (!designs) {
        setPixels([]);
        return;
      }

      const design = designs.find((d) => d.id === designId);
      if (design) {
        const designPixels = design.pixels.map((pixel: Pixel) => ({
          ...pixel,
          x: pixel.x + design.x,
          y: pixel.y + design.y,
          designId: design.id,
        }));
        setPixels(designPixels);
      } else {
        setPixels([]);
      }
    };

    fetchPixels();
  }, []); // Only runs on mount

  const layerOrder = [1]; // Adjust this based on your requirements

  return (
    <Box>
      {alertId === null ? (
        <Text>{t("Loading...")}</Text>
      ) : currentAlertData ? (
        <Box>
          <Heading as="h3" size="lg" mb={4}>
            {t(`Status: ${currentAlertData.alert_name}`)}
          </Heading>
          {!!currentAlertData.message && <Text mb={4}>{currentAlertData.message}</Text>}
          {currentAlertData.Active && (
            <Viewport 
              designId={1}
              pixels={pixels} 
              layerOrder={layerOrder} 
              stageRef={stageRef} 
            />
          )}
        </Box>
      ) : (
        <Text>
          {t("Invalid alert level:")} {alertId}
        </Text>
      )}
    </Box>
  );
};

export default BriefingRoom;

// briefing-room.tsx
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Viewport from "../component/viewport/Viewport";
import { useAlertContext } from "../context/alert-context";
import { alertLevels, validAlertLevels } from "../definitions/alert-level";
import { databaseFetchDesigns } from "../api/supabase/database";
import { Pixel } from "../types/art-tool";
import Konva from "konva"; // Ensure Konva is imported

const BriefingRoom: React.FC = () => {
  const { t } = useTranslation();
  const { alertLevel, alertMessage } = useAlertContext();
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const stageRef = useRef<Konva.Stage>(null); // Create the stageRef using useRef

  useEffect(() => {
    const fetchPixels = async () => {
      const designId = "someDesignId"; // Replace with the actual design ID or name
      const designs = await databaseFetchDesigns();
      if (!designs) {
        setPixels([]); // Handle the case where designs are not found
        return;
      }

      const design = designs.find((d) => d.id === designId || d.design_name === designId);

      if (design) {
        const designPixels = design.pixels.map((pixel: Pixel) => ({
          ...pixel,
          x: pixel.x + design.x,
          y: pixel.y + design.y,
          canvas: design.design_name, // Add canvas property
        }));
        setPixels(designPixels);
      } else {
        setPixels([]); // Handle the case where the design is not found
      }
    };

    fetchPixels();
  }, []);

  // Provide a default layer order
  const layerOrder = ["main"]; // Adjust this based on your requirements

  return (
    <div>
      {alertLevel === null ? (
        <p>{t("Loading...")}</p>
      ) : validAlertLevels.includes(alertLevel) ? (
        <div>
          <h3>{t(alertLevels.get(alertLevel)?.heading ?? "")}</h3>
          {!!alertLevels.get(alertLevel)?.subheading && (
            <p>{t(alertLevels.get(alertLevel)?.subheading ?? "")}</p>
          )}
          {!!alertMessage && <p>{alertMessage}</p>}
          {alertLevels.get(alertLevel)?.showViewport && (
            <Viewport 
              designId="someDesignId" 
              pixels={pixels} 
              layerOrder={layerOrder} 
              stageRef={stageRef} // Pass the stageRef to Viewport
            />
          )}
        </div>
      ) : (
        <p>
          {t("Invalid alert level:")} {alertLevel}
        </p>
      )}
    </div>
  );
};

export default BriefingRoom;

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Viewport from "../component/art_tool/viewport";
import { useAlertContext } from "../context/alert-context";
import { alertLevels, validAlertLevels } from "../definitions/alert-level";
import { databaseFetchPixels } from "../api/supabase/database";

interface Pixel { 
  id: number;
  x: number;
  y: number;
  color: string;
  canvas: string;
}

const BriefingRoom: React.FC = () => {
  const { t } = useTranslation();
  const { alertLevel, alertMessage } = useAlertContext();
  const [pixels, setPixels] = useState<Pixel[]>([]); 

  useEffect(() => {
    const fetchPixels = async () => {
      const designId = "someDesignId"; 
      const fetchedPixels = await databaseFetchPixels(designId);
      setPixels(fetchedPixels || []); 
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
            <Viewport designId="someDesignId" pixels={pixels} layerOrder={layerOrder} />
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

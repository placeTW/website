import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Viewport from "../component/art_tool/viewport";
import { useAlertContext } from "../context/alert-context";
import { alertLevels, validAlertLevels } from "../definitions/alert-level";
import { databaseFetchPixels } from "../api/supabase/database";

const BriefingRoom: React.FC = () => {
  const { t } = useTranslation();
  const { alertLevel, alertMessage } = useAlertContext();
  const [pixels, setPixels] = useState([]); // State to hold pixel data

  useEffect(() => {
    const fetchPixels = async () => {
      const designId = "someDesignId"; // Replace this with the actual designId logic
      const fetchedPixels = await databaseFetchPixels(designId);
      setPixels(fetchedPixels);
    };

    fetchPixels();
  }, []);

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
            <Viewport designId="someDesignId" pixels={pixels} />
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

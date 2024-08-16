import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Viewport from "../component/viewport/Viewport";
import { useAlertContext } from "../context/alert-context";
import { databaseFetchDesigns, fetchAlertLevels } from "../api/supabase/database";
import Konva from "konva"; // Ensure Konva is imported
import { ViewportPixel } from "../component/viewport/types";
import { Pixel, AlertState } from "../types/art-tool";
import { removeSupabaseChannel, supabase } from "../api/supabase";

const BriefingRoom: React.FC = () => {
  const { t } = useTranslation();
  const { alertId } = useAlertContext();
  const [pixels, setPixels] = useState<ViewportPixel[]>([]);
  const [alertData, setAlertData] = useState<AlertState | null>(null);
  const stageRef = useRef<Konva.Stage>(null); // Create the stageRef using useRef

  useEffect(() => {
    // Fetch the design pixels based on the alert level
    const fetchPixels = async () => {
      const designId = 1; // Replace with the actual design ID or name
      const designs = await databaseFetchDesigns();
      if (!designs) {
        setPixels([]); // Handle the case where designs are not found
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
        setPixels([]); // Handle the case where the design is not found
      }
    };

    fetchPixels();
  }, []);

  useEffect(() => {
    const fetchAlertData = async () => {
      if (alertId !== null) {
        try {
          const alertLevels = await fetchAlertLevels();
          const currentAlert = alertLevels?.find((alert) => alert.alert_id === alertId);
          setAlertData(currentAlert || null);
        } catch (error) {
          console.error("Error fetching alert data:", error);
        }
      }
    };

    fetchAlertData();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel("public:art_tool_alert_state")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_alert_state" },
        (payload) => {
          const updatedAlert = payload.new as AlertState;
          if (updatedAlert.alert_id === alertId) {
            setAlertData(updatedAlert);
          }
        }
      )
      .subscribe();

    return () => {
      // Cleanup subscription
      removeSupabaseChannel(subscription);
    };
  }, [alertId]);

  // Provide a default layer order
  const layerOrder = [1]; // Adjust this based on your requirements

  return (
    <div>
      {alertId === null ? (
        <p>{t("Loading...")}</p>
      ) : alertData ? (
        <div>
          <h3>{t(alertData.alert_name)}</h3>
          {!!alertData.message && <p>{alertData.message}</p>}
          {alertData.Active && (
            <Viewport 
              designId={1}
              pixels={pixels} 
              layerOrder={layerOrder} 
              stageRef={stageRef} // Pass the stageRef to Viewport
            />
          )}
        </div>
      ) : (
        <p>
          {t("Invalid alert level:")} {alertId}
        </p>
      )}
    </div>
  );
};

export default BriefingRoom;

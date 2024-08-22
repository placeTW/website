import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  fetchAlertLevels,
  removeSupabaseChannel,
  supabase,
} from "../api/supabase";
import { AlertState } from "../types/art-tool";

interface AlertContextProps {
  alertLevels: AlertState[] | null;
  currentAlertData: AlertState | null;
  setActiveAlertId: (id: number) => void;
}

// Fetch all alert levels and set the active alert
const fetchAllData = async () => {
  const fetchedAlertLevels = await fetchAlertLevels();
  const activeAlert = fetchedAlertLevels?.find((alert) => alert.Active) || null;

  return {
    alertLevels: fetchedAlertLevels || [],
    currentAlertData: activeAlert,
  };
};

const initialData = await fetchAllData();

const AlertContext = createContext<AlertContextProps>({
  alertLevels: initialData.alertLevels,
  currentAlertData: initialData.currentAlertData,
  setActiveAlertId: () => {}, // Placeholder function
});

export const useAlertContext = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlertContext must be used within an AlertProvider");
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alertLevels, setAlertLevels] = useState(initialData.alertLevels);
  const [currentAlertData, setCurrentAlertData] = useState(
    initialData.currentAlertData,
  );

  const setActiveAlertId = (id: number) => {
    const activeAlert =
      alertLevels?.find((alert) => alert.alert_id === id) || null;
    setCurrentAlertData(activeAlert);
    if (activeAlert) {
      setAlertLevels(
        alertLevels.map((alert) => ({
          ...alert,
          Active: alert.alert_id === id,
        })),
      );
    }
  };

  // Set up the Supabase subscription with logging
  useEffect(() => {
    const updateAlertLevelFromEvent = (payload: any) => {
      const updatedAlert = payload.new as AlertState;
      setAlertLevels((prevAlerts) => {
        const updatedAlerts =
          prevAlerts?.map((alert) =>
            alert.alert_id === updatedAlert.alert_id ? updatedAlert : alert,
          ) || [];

        const activeAlert = updatedAlerts.find((alert) => alert.Active) || null;
        setCurrentAlertData(activeAlert);

        return updatedAlerts;
      });
    };

    const alertSubscription = supabase
      .channel("public:art_tool_alert_state")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_alert_state" },
        updateAlertLevelFromEvent,
      )
      .subscribe();

    return () => {
      removeSupabaseChannel(alertSubscription);
    };
  }, []);

  return (
    <AlertContext.Provider
      value={{ alertLevels, currentAlertData, setActiveAlertId }}
    >
      {children}
    </AlertContext.Provider>
  );
};

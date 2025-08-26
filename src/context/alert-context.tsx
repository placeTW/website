import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

// Utility function to fetch all alert levels and set the active alert
const fetchAllData = async () => {
  const fetchedAlertLevels = await fetchAlertLevels();
  const activeAlert = fetchedAlertLevels?.find((alert) => alert.Active) || null;

  return {
    alertLevels: fetchedAlertLevels || [],
    currentAlertData: activeAlert,
  };
};

// Start with empty data - will be loaded asynchronously
const initialData = {
  alertLevels: [] as AlertState[],
  currentAlertData: null as AlertState | null,
};

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

  // Load initial alert data asynchronously
  useEffect(() => {
    const loadInitialAlertData = async () => {
      try {
        // Only fetch if we don't have alert data yet
        if (alertLevels.length === 0) {
          const data = await fetchAllData();
          setAlertLevels(data.alertLevels);
          setCurrentAlertData(data.currentAlertData);
        }
      } catch (error) {
        console.error('Failed to load initial alert data:', error);
      }
    };

    loadInitialAlertData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setActiveAlertId = useCallback((id: number) => {
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
  }, [alertLevels]);

  // Set up the Supabase subscription with logging
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        "postgres_changes" as "broadcast",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { event: "*", schema: "public", table: "art_tool_alert_state" } as any,
        updateAlertLevelFromEvent,
      )
      .subscribe();

    return () => {
      removeSupabaseChannel(alertSubscription);
    };
  }, []);

  const contextValue = useMemo(() => ({
    alertLevels,
    currentAlertData,
    setActiveAlertId,
  }), [alertLevels, currentAlertData, setActiveAlertId]);

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
    </AlertContext.Provider>
  );
};

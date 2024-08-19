import React, { createContext, useContext, ReactNode, useState } from "react";
import { fetchAlertLevels, supabase } from "../api/supabase";
import { AlertState } from "../types/art-tool";

interface AlertContextProps {
  alertLevels: AlertState[] | null;
  currentAlertData: AlertState | null;
  setActiveAlertId: (id: number) => void; // Added function type
}

// Fetch all alert levels and set the active alert
const fetchAllData = async () => {
  const fetchedAlertLevels = await fetchAlertLevels();
  const activeAlert = fetchedAlertLevels?.find(alert => alert.Active) || null;

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
  const [currentAlertData, setCurrentAlertData] = useState(initialData.currentAlertData);

  const setActiveAlertId = (id: number) => {
    const activeAlert = alertLevels?.find(alert => alert.alert_id === id) || null;
    setCurrentAlertData(activeAlert);
    if (activeAlert) {
      setAlertLevels(alertLevels.map(alert => ({
        ...alert,
        Active: alert.alert_id === id,
      })));
    }
  };

  return (
    <AlertContext.Provider value={{ alertLevels, currentAlertData, setActiveAlertId }}>
      {children}
    </AlertContext.Provider>
  );
};

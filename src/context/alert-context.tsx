import React, { createContext, useContext, ReactNode } from "react";
import { AlertState } from "../types/art-tool";
import { fetchAlertLevels } from "../api/supabase";  // Removed unused import for `supabase`

// Fetch all alert data immediately and make it available to the entire app
const fetchAllAlertData = async () => {
  console.log(`[ALERT-CONTEXT] Fetching all alert data from database`);

  const fetchedAlertLevels = await fetchAlertLevels();

  if (!fetchedAlertLevels) {
    return {
      alertLevels: [],
      currentAlertData: null,
    };
  }

  return {
    alertLevels: fetchedAlertLevels,
    currentAlertData: fetchedAlertLevels.find(alert => alert.Active) || null,
  };
};

// Initialize the data
const initialAlertData = await fetchAllAlertData();
console.log(`[ALERT-CONTEXT] Data fetched:`, initialAlertData);

interface AlertContextProps {
  alertLevels: AlertState[];
  currentAlertData: AlertState | null;
}

// Create the context with initial values
const AlertContext = createContext<AlertContextProps>({
  alertLevels: initialAlertData.alertLevels,
  currentAlertData: initialAlertData.currentAlertData,
});

export const useAlertContext = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlertContext must be used within an AlertContext.Provider");
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  return (
    <AlertContext.Provider value={initialAlertData}>
      {children}
    </AlertContext.Provider>
  );
};

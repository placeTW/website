import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { fetchAlertLevels, removeSupabaseChannel, supabase } from "../api/supabase";
import { useToast } from "@chakra-ui/react";
import { AlertState } from "../types/art-tool";

interface AlertContextType {
  alertId: number | null;
  setActiveAlertId: (id: number) => void;
  alertMessage: string | null;
  alertLevels: AlertState[];
  currentAlertData: AlertState | null;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alertLevels, setAlertLevels] = useState<AlertState[]>([]);
  const [activeAlertId, setActiveAlertIdState] = useState<number | null>(null);
  const [alertMessage, setAlertMessageState] = useState<string | null>(null);
  const [currentAlertData, setCurrentAlertData] = useState<AlertState | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchInitialAlertLevels = async () => {
      try {
        const data = await fetchAlertLevels();
        if (data && data.length > 0) {
          setAlertLevels(data);
          const activeAlert = data.find(alert => alert.Active);
          if (activeAlert) {
            setActiveAlertIdState(activeAlert.alert_id);
            setAlertMessageState(activeAlert.message);
            setCurrentAlertData(activeAlert);
          } else {
            toast({
              title: "No active alert",
              description: "There is currently no active alert level.",
              status: "warning",
              duration: 3000,
              isClosable: true,
            });
          }
        } else {
          toast({
            title: "Error",
            description: "No alert levels found.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error("Error fetching alert levels:", error);
        toast({
          title: "Error",
          description: "Failed to fetch alert levels.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchInitialAlertLevels();

    const updateAlertLevelFromEvent = (payload: any) => {
      const updatedAlert = payload.new as AlertState;
      setAlertLevels((prevAlerts) => {
        const updatedAlerts = prevAlerts.map(alert =>
          alert.alert_id === updatedAlert.alert_id ? updatedAlert : alert
        );
        if (updatedAlert.Active) {
          setActiveAlertIdState(updatedAlert.alert_id);
          setAlertMessageState(updatedAlert.message);
          setCurrentAlertData(updatedAlert);
        }
        return updatedAlerts;
      });
    };

    const alertSubscription = supabase
      .channel("public:art_tool_alert_state")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_alert_state" },
        (payload) => {
          updateAlertLevelFromEvent(payload);
        }
      )
      .subscribe();

    return () => {
      removeSupabaseChannel(alertSubscription);
    };
  }, [toast]);

  const setActiveAlertId = async (id: number) => {
    setActiveAlertIdState(id);
  };

  return (
    <AlertContext.Provider value={{ alertId: activeAlertId, setActiveAlertId, alertMessage, alertLevels, currentAlertData }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlertContext = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlertContext must be used within an AlertProvider");
  }
  return context;
};

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  fetchAlertLevels,
  setActiveAlertLevel,
  removeSupabaseChannel,
  supabase,
} from "../api/supabase";
import { useToast } from "@chakra-ui/react";

interface AlertContextType {
  alertLevel: number | null;
  setAlertLevel: (level: number) => void;
  alertMessage: string | null;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alertLevel, setAlertLevelState] = useState<number | null>(null);
  const [alertMessage, setAlertMessageState] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchAlertLevel = async () => {
      try {
        const data = await fetchAlertLevels();

        if (data && data.length > 0) {
          const activeAlert = data.find(alert => alert.Active);

          if (activeAlert) {
            setAlertLevelState(activeAlert.alert_id);
            setAlertMessageState(activeAlert.message);
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

    fetchAlertLevel();

    const alertSubscription = supabase
      .channel("public:art_tool_alert_state")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_alert_state" },
        () => {
          fetchAlertLevel();
        },
      )
      .subscribe();

    return () => {
      removeSupabaseChannel(alertSubscription);
    };
  }, [toast]);

  const setAlertLevel = async (level: number) => {
    try {
      await setActiveAlertLevel(level);
      setAlertLevelState(level);
    } catch (error) {
      console.error("Error setting alert level:", error);
      toast({
        title: "Error",
        description: "Failed to update alert level",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <AlertContext.Provider value={{ alertLevel, setAlertLevel, alertMessage }}>
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

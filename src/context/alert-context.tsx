import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  databaseFetchAlertLevel,
  databaseUpdateAlertLevel,
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
  const [alertLevel, setAlertLevelState] = useState<number | null>(1);
  const [alertMessage, setAlertMessageState] = useState<string | null>(null);
  const toast = useToast()

  useEffect(() => {
    const fetchAlertLevel = async () => {
      const data = await databaseFetchAlertLevel();
      if (data) {
        setAlertLevelState(data.state);
        setAlertMessageState(data.message);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch alert level",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchAlertLevel();

    const alertSubscription = supabase
      .channel("art_tool_alert_state")
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
  }, []);

  const setAlertLevel = async (level: number) => {
    const response = await databaseUpdateAlertLevel(level);
    if (response) {
      setAlertLevelState(level);
    } else {
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

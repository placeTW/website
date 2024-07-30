import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '../api/supabase';

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

  useEffect(() => {
    const fetchAlertLevel = async () => {
      const { data, error } = await supabase
        .from('art_tool_alert_state')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        console.error('Error fetching alert level:', error);
        return;
      }

      if (data) {
        setAlertLevelState(data.state);
        setAlertMessageState(data.message);
      }
    };

    fetchAlertLevel();

    const alertSubscription = supabase
      .channel('art_tool_alert_state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'art_tool_alert_state' }, () => {
        fetchAlertLevel();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(alertSubscription);
    };
  }, []);

  const setAlertLevel = async (level: number) => {
    const { error } = await supabase
      .from('art_tool_alert_state')
      .update({ state: level })
      .eq('id', 1);

    if (error) {
      console.error('Error updating alert level:', error);
      return;
    }

    setAlertLevelState(level);
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
    throw new Error('useAlertContext must be used within an AlertProvider');
  }
  return context;
};

// src/context/alert-context.tsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../api/supabase';

interface AlertContextType {
  alertLevel: number;
  setAlertLevel: (level: number) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC = ({ children }) => {
  const [alertLevel, setAlertLevelState] = useState<number>(1);

  useEffect(() => {
    const fetchAlertLevel = async () => {
      const { data, error } = await supabase
        .from('art_tool_alert_state')
        .select('Level')
        .eq('Active', true)
        .single();

      if (error) {
        console.error('Error fetching alert level:', error);
        return;
      }

      if (data) {
        setAlertLevelState(data.Level);
      }
    };

    fetchAlertLevel();
  }, []);

  const setAlertLevel = async (level: number) => {
    const { error } = await supabase
      .from('art_tool_alert_state')
      .update({ Active: false })
      .eq('Active', true);

    if (error) {
      console.error('Error deactivating current alert level:', error);
      return;
    }

    const { error: updateError } = await supabase
      .from('art_tool_alert_state')
      .update({ Active: true })
      .eq('Level', level);

    if (updateError) {
      console.error('Error activating new alert level:', updateError);
      return;
    }

    setAlertLevelState(level);
  };

  return (
    <AlertContext.Provider value={{ alertLevel, setAlertLevel }}>
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

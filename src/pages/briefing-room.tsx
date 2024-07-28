import React, { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import AlertLevel1 from '../component/alert-level-1';
import AlertLevel2 from '../component/alert-level-2';
import AlertLevel3 from '../component/alert-level-3';
import AlertLevel4 from '../component/alert-level-4';

interface AlertLevel {
  Level: number;
  Name: string;
  Active: boolean;
}

const BriefingRoom: React.FC = () => {
  const [alertLevels, setAlertLevels] = useState<AlertLevel[]>([]);

  useEffect(() => {
    const fetchAlertLevels = async () => {
      const { data, error } = await supabase.from('art_tool_alert_state').select('*');
      if (error) console.error(error);
      else setAlertLevels(data);
    };

    fetchAlertLevels();

    const alertSubscription = supabase
      .from('art_tool_alert_state')
      .on('*', (payload) => {
        fetchAlertLevels();
      })
      .subscribe();

    return () => {
      supabase.removeSubscription(alertSubscription);
    };
  }, []);

  return (
    <div>
      {alertLevels.map((level) => (
        <div key={level.Level}>
          {level.Level === 1 && <AlertLevel1 />}
          {level.Level === 2 && <AlertLevel2 />}
          {level.Level === 3 && <AlertLevel3 />}
          {level.Level === 4 && <AlertLevel4 />}
        </div>
      ))}
    </div>
  );
};

export default BriefingRoom;

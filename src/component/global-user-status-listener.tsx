import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { UserType } from '../types';

interface GlobalUserStatusListenerProps {
  user: UserType;
  onUserUpdate: (updatedUser: UserType) => void;
}

const GlobalUserStatusListener = ({ user, onUserUpdate }: GlobalUserStatusListenerProps) => {
  const [rankNames, setRankNames] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchRankNames = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData?.session) {
          console.error('Error fetching session:', sessionError);
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-rank-name`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
        });

        if (response.ok) {
          const rankData = await response.json();
          const rankNamesMap: { [key: string]: string } = {};
          rankData.forEach((rank: { rank_id: string; rank_name: string }) => {
            rankNamesMap[rank.rank_id] = rank.rank_name;
          });

          setRankNames(rankNamesMap);
        } else {
          const errorData = await response.json();
          console.error('Error fetching rank names:', errorData.error);
        }
      } catch (error) {
        console.error('Error fetching rank names:', error);
      }
    };

    fetchRankNames();
  }, []);

  useEffect(() => {
    if (!user) return;

    console.log(`Setting up real-time listener for user_id: ${user.user_id}`);

    const channel = supabase.channel('table-db-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'art_tool_users',
        filter: `user_id=eq.${user.user_id}`,
      }, async (payload) => {
        console.log('Real-time update received:', payload);

        const updatedUser = payload.new as UserType;
        updatedUser.rank_name = rankNames[updatedUser.rank] || updatedUser.rank_name;

        console.log('Updated user data:', updatedUser);
        onUserUpdate(updatedUser);
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Removing real-time listener for user_id:', user.user_id);
      supabase.removeChannel(channel);
    };
  }, [user, rankNames, onUserUpdate]);

  return null;
};

export default GlobalUserStatusListener;

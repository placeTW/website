import { useEffect } from 'react';
import { supabase } from '../supabase';
import { UserType } from '../types';

interface GlobalUserStatusListenerProps {
  user: UserType;
  onUserUpdate: (updatedUser: UserType) => void;
}

const GlobalUserStatusListener = ({ user, onUserUpdate }: GlobalUserStatusListenerProps) => {
  useEffect(() => {
    if (!user) return;

    console.log(`Setting up real-time listener for user_id: ${user.user_id}`);

    const channel = supabase.channel('table-db-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'art_tool_users',
        filter: `user_id=eq.${user.user_id}`,
      }, async (payload) => {
        console.log('Real-time update received:', payload);

        const updatedUser = payload.new as UserType;

        // Get the current session to access the JWT token
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.error('User is not authenticated');
          return;
        }

        // Call the edge function to fetch the updated rank name
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-rank-name`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ rank_id: updatedUser.rank }),
        });

        if (response.ok) {
          const rankData = await response.json();
          updatedUser.rank_name = rankData.rank_name;
        } else {
          const errorData = await response.json();
          console.error('Error fetching rank name:', errorData.error);
        }

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
  }, [user, onUserUpdate]);

  return null;
};

export default GlobalUserStatusListener;

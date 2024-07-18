import { useEffect } from 'react';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';

interface GlobalUserStatusListenerProps {
  user: User;
}

const GlobalUserStatusListener = ({ user }: GlobalUserStatusListenerProps) => {
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`public:art_tool_users:user_id=eq.${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'art_tool_users', filter: `user_id=eq.${user.id}` }, (payload: { new: { status: string } }) => {
        if (payload.new.status === 'banned') {
          alert('You have been banned.');
          supabase.auth.signOut();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
};

export default GlobalUserStatusListener;

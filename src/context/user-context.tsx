import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../api/supabase';
import { functionsFetchUsers, functionsGetRankName } from '../api/supabase/functions';
import { authGetSession } from '../api/supabase/auth';
import { RealtimeChannel } from '@supabase/supabase-js';

// Define types for User and Rank
interface UserType {
  user_id: string;
  email: string | null;
  handle: string | null;
  rank: string;
  rank_name: string; // Added to match the Navbar's requirements
}

interface RankType {
  rank_id: string;
  rank_name: string | null;
  can_moderate: string[] | null;
}

// Define the context type
interface UserContextType {
  users: UserType[];
  ranks: RankType[];
  currentUser: UserType | null;
  setCurrentUser: (user: UserType | null) => void; // Added
  logoutUser: () => void; // Added
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Custom hook to use UserContext
const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [ranks, setRanks] = useState<RankType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  // Define a logout function
  const logoutUser = () => {
    setCurrentUser(null);
    console.log('User logged out.');
  };

  useEffect(() => {
    // Function to fetch initial users and ranks
    const fetchData = async () => {
      try {
        const [rankData, userData] = await Promise.all([
          functionsGetRankName(),
          functionsFetchUsers()
        ]);
        setRanks(rankData);
        setUsers(userData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    // Function to fetch the current user based on session
    const fetchCurrentUser = async () => {
      try {
        const { data: sessionData } = await authGetSession();
        if (sessionData.session) {
          const userId = sessionData.session.user.id;
          const userResponse = await supabase
            .from('art_tool_users')
            .select('*')
            .eq('user_id', userId)
            .single();
          if (userResponse.data) {
            setCurrentUser(userResponse.data);
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    // Call fetch functions
    fetchData();
    fetchCurrentUser();

    // Set up subscriptions for users and ranks
    const userSubscription: RealtimeChannel = supabase
      .channel('public:art_tool_users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'art_tool_users' }, payload => {
        if (payload.eventType === 'INSERT') {
          setUsers(prevUsers => [...prevUsers, payload.new as UserType]);
        } else if (payload.eventType === 'UPDATE') {
          setUsers(prevUsers =>
            prevUsers.map(user => (user.user_id === payload.old.user_id ? payload.new as UserType : user))
          );
        } else if (payload.eventType === 'DELETE') {
          setUsers(prevUsers => prevUsers.filter(user => user.user_id !== payload.old.user_id));
        }
      })
      .subscribe();

    const rankSubscription: RealtimeChannel = supabase
      .channel('public:art_tool_ranks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'art_tool_ranks' }, payload => {
        if (payload.eventType === 'INSERT') {
          setRanks(prevRanks => [...prevRanks, payload.new as RankType]);
        } else if (payload.eventType === 'UPDATE') {
          setRanks(prevRanks =>
            prevRanks.map(rank => (rank.rank_id === payload.old.rank_id ? payload.new as RankType : rank))
          );
        } else if (payload.eventType === 'DELETE') {
          setRanks(prevRanks => prevRanks.filter(rank => rank.rank_id !== payload.old.rank_id));
        }
      })
      .subscribe();

    // Cleanup subscriptions on component unmount
    return () => {
      supabase.removeChannel(userSubscription);
      supabase.removeChannel(rankSubscription);
    };
  }, []);

  return (
    <UserContext.Provider value={{ users, ranks, currentUser, setCurrentUser, logoutUser }}>
      {children}
    </UserContext.Provider>
  );
};

export { useUserContext, UserProvider };

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from 'react';
import { supabase } from '../api/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { UserType, RankType } from '../types/users';
import {
  databaseFetchUsers,
  databaseFetchRanks,
  databaseFetchCurrentUser,
  removeSupabaseChannel,
} from '../api/supabase/database';

interface UserContextType {
  users: UserType[];
  ranks: RankType[];
  currentUser: UserType | null;
  setCurrentUser: (user: UserType | null) => void;
  logoutUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [ranks, setRanks] = useState<RankType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  // Create a ref to hold the currentUser value
  const currentUserRef = useRef<UserType | null>(currentUser);

  // Update the ref whenever currentUser changes
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const logoutUser = () => {
    setCurrentUser(null);
    console.log('User logged out.');
  };

  useEffect(() => {
    // Fetch initial users and ranks
    const fetchData = async () => {
      try {
        const [userData, rankData] = await Promise.all([
          databaseFetchUsers(),
          databaseFetchRanks(),
        ]);
        setUsers(userData);
        setRanks(rankData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    // Fetch the current user
    const fetchCurrentUser = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error fetching session:', error);
          return;
        }

        if (session) {
          const userId = session.user.id;
          const userData = await databaseFetchCurrentUser(userId);
          if (userData) {
            setCurrentUser(userData);
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    // Call fetch functions
    fetchData();
    fetchCurrentUser();

    // Set up subscriptions
    const userSubscription: RealtimeChannel = supabase
      .channel('public:art_tool_users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'art_tool_users' },
        (payload) => {
          const currentUserId = currentUserRef.current?.user_id;
          if (payload.eventType === 'INSERT') {
            setUsers((prevUsers) => [...prevUsers, payload.new as UserType]);
          } else if (payload.eventType === 'UPDATE') {
            setUsers((prevUsers) =>
              prevUsers.map((user) =>
                user.user_id === payload.old.user_id ? (payload.new as UserType) : user
              )
            );
            // Update currentUser if it matches
            if (currentUserId && payload.old.user_id === currentUserId) {
              setCurrentUser(payload.new as UserType);
            }
          } else if (payload.eventType === 'DELETE') {
            setUsers((prevUsers) =>
              prevUsers.filter((user) => user.user_id !== payload.old.user_id)
            );
            // Clear currentUser if deleted
            if (currentUserId && payload.old.user_id === currentUserId) {
              setCurrentUser(null);
            }
          }
        }
      )
      .subscribe();

    const rankSubscription: RealtimeChannel = supabase
      .channel('public:art_tool_ranks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'art_tool_ranks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRanks((prevRanks) => [...prevRanks, payload.new as RankType]);
          } else if (payload.eventType === 'UPDATE') {
            setRanks((prevRanks) =>
              prevRanks.map((rank) =>
                rank.rank_id === payload.old.rank_id ? (payload.new as RankType) : rank
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setRanks((prevRanks) =>
              prevRanks.filter((rank) => rank.rank_id !== payload.old.rank_id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on component unmount
    return () => {
      removeSupabaseChannel(userSubscription);
      removeSupabaseChannel(rankSubscription);
    };
  }, []); // Empty dependency array to prevent infinite loops

  return (
    <UserContext.Provider
      value={{ users, ranks, currentUser, setCurrentUser, logoutUser }}
    >
      {children}
    </UserContext.Provider>
  );
};

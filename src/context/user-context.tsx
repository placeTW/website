// src/context/user-context.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { supabase } from '../api/supabase';
import { RealtimeChannel, Session } from '@supabase/supabase-js';
import { UserType, RankType } from '../types/users';
import {
  databaseFetchUsers,
  databaseFetchRanks,
  databaseFetchCurrentUser,
  removeSupabaseChannel,
} from "../api/supabase/database";
import {
  insertNewUser, // Import the updated insertNewUser
} from '../api/supabase/functions'; // Adjust the import path if necessary

// Session cache to prevent multiple API calls
let sessionCache: { session: Session | null; timestamp: number } | null = null;
const SESSION_CACHE_DURATION = 30000; // 30 seconds

// Cached session getter to prevent multiple API calls
async function getCachedSession(): Promise<Session | null> {
  const now = Date.now();
  
  // Return cached session if still valid
  if (sessionCache && (now - sessionCache.timestamp) < SESSION_CACHE_DURATION) {
    console.log('[AUTH] Using cached session');
    return sessionCache.session;
  }
  
  // Fetch new session and cache it
  console.log('[AUTH] Fetching fresh session');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }
    
    // Update cache
    sessionCache = { session, timestamp: now };
    return session;
  } catch (error) {
    console.error('Error in getCachedSession:', error);
    return null;
  }
}

interface UserContextType {
  users: UserType[];
  ranks: RankType[];
  currentUser: UserType | null;
  setCurrentUser: (user: UserType | null) => void;
  logoutUser: () => void;
  getCachedSession: () => Promise<Session | null>;
  isAuthLoading: boolean;
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
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Create a ref to hold the currentUser value
  const currentUserRef = useRef<UserType | null>(currentUser);

  // Update the ref whenever currentUser changes
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const logoutUser = () => {
    setCurrentUser(null);
    setIsAuthLoading(false);
    // Clear session cache on logout
    sessionCache = null;
    console.log('User logged out.');
  };

  // Helper function to get handle
  const getHandle = (user: { 
    app_metadata?: { provider?: string }; 
    user_metadata?: { name?: string; full_name?: string }; 
    email?: string 
  }): string => {
    if (user?.app_metadata?.provider === 'discord') {
      return user.user_metadata?.name || user.user_metadata?.full_name || '';
    } else {
      return user.email
        ? user.email.substring(0, user.email.lastIndexOf('@'))
        : '';
    }
  };

  // Process session and update current user
  const processSession = useCallback(async (session: Session | null) => {
    try {
      if (!session) {
        setCurrentUser(null);
        return;
      }

      const userId = session.user.id;
      let userData = await databaseFetchCurrentUser(userId);

      if (!userData) {
        // User not found, insert new user
        userData = await insertNewUser(
          userId,
          session.user.email || '',
          getHandle(session.user)
        );

        if (!userData) {
          console.error('Error inserting new user.');
          return;
        }
      }

      if (userData.rank === 'F') {
        await supabase.auth.signOut();
        console.error('User has been banned.');
      } else {
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error processing session:', error);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    // Fetch initial users and ranks
    const fetchData = async () => {
      try {
        const [userData, rankData] = await Promise.all([
          databaseFetchUsers(),
          databaseFetchRanks(),
        ]);
        if (mounted) {
          setUsers(userData);
          setRanks(rankData);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    // Initial session check using cached session
    const initializeAuth = async () => {
      try {
        console.log('[AUTH] Initializing authentication');
        const session = await getCachedSession();
        if (mounted) {
          await processSession(session);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    // Set up auth state change listener to handle login/logout efficiently
    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH] Auth state changed:', event);
        
        // Clear cache on auth state changes to ensure fresh data
        sessionCache = null;
        
        if (mounted) {
          // Set loading to true when auth state changes (except for initial_session)
          if (event !== 'INITIAL_SESSION') {
            setIsAuthLoading(true);
          }
          await processSession(session);
        }
      }
    );

    // Initialize data and auth
    fetchData();
    initializeAuth();

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
                user.user_id === payload.old.user_id
                  ? (payload.new as UserType)
                  : user
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
                rank.rank_id === payload.old.rank_id
                  ? (payload.new as RankType)
                  : rank
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
      mounted = false;
      removeSupabaseChannel(userSubscription);
      removeSupabaseChannel(rankSubscription);
      // Remove auth subscription
      if (authSubscription?.subscription) {
        authSubscription.subscription.unsubscribe();
      }
    };
  }, [processSession]); // Include processSession in dependencies

  const contextValue = useMemo(() => ({
    users,
    ranks,
    currentUser,
    setCurrentUser,
    logoutUser,
    getCachedSession,
    isAuthLoading,
  }), [users, ranks, currentUser, isAuthLoading]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

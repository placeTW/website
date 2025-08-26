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

// Session management constants
const SESSION_CACHE_DURATION = 30000; // 30 seconds
const SESSION_TIMEOUT = 3000; // 3 seconds
const AUTH_LOADING_TIMEOUT = 3000; // 3 seconds

// Session cache
let sessionCache: { session: Session | null; timestamp: number } | null = null;

// Utility: Create a promise with timeout
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error(errorMessage)), ms)
  );
  return Promise.race([promise, timeout]);
}

// Cached session getter
async function getCachedSession(): Promise<Session | null> {
  const now = Date.now();
  
  if (sessionCache && (now - sessionCache.timestamp) < SESSION_CACHE_DURATION) {
    console.log('[AUTH] Using cached session');
    return sessionCache.session;
  }
  
  console.log('[AUTH] Fetching fresh session');
  try {
    const { data: { session }, error } = await withTimeout(
      supabase.auth.getSession(),
      SESSION_TIMEOUT,
      'Session fetch timeout'
    );
    
    if (error) throw error;
    
    sessionCache = { session, timestamp: now };
    return session;
  } catch (error) {
    console.error('[AUTH] Session fetch failed:', error);
    sessionCache = null;
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
  
  // Refs for managing auth state and preventing duplicates
  const currentUserRef = useRef<UserType | null>(currentUser);
  const processingRef = useRef<boolean>(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef<boolean>(false);
  const lastProcessedUserIdRef = useRef<string | null>(null);

  // Update user ref when currentUser changes
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Safe loading state setter with automatic timeout protection
  const setLoadingWithTimeout = useCallback((loading: boolean) => {
    setIsAuthLoading(loading);
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    
    if (loading) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('[AUTH] Loading timeout - clearing auth state');
        setIsAuthLoading(false);
        loadingTimeoutRef.current = null;
      }, AUTH_LOADING_TIMEOUT);
    }
  }, []);

  // Logout function
  const logoutUser = useCallback(() => {
    setCurrentUser(null);
    setLoadingWithTimeout(false);
    sessionCache = null;
    console.log('[AUTH] User logged out');
  }, [setLoadingWithTimeout]);

  // Handle tab visibility to validate session
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && currentUserRef.current && !processingRef.current) {
        try {
          console.log('[AUTH] Tab visible - validating session');
          const session = await getCachedSession();
          if (!session && currentUserRef.current) {
            console.log('[AUTH] Invalid session detected - logging out');
            logoutUser();
          }
        } catch (error) {
          console.error('[AUTH] Session validation failed:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [logoutUser]);

  // Extract user handle from auth data
  const getHandle = useCallback((user: { 
    app_metadata?: { provider?: string }; 
    user_metadata?: { name?: string; full_name?: string }; 
    email?: string 
  }): string => {
    if (user?.app_metadata?.provider === 'discord') {
      return user.user_metadata?.name || user.user_metadata?.full_name || '';
    }
    return user.email?.substring(0, user.email.lastIndexOf('@')) || '';
  }, []);

  // Process authentication session
  const processSession = useCallback(async (session: Session | null) => {
    if (processingRef.current) {
      console.log('[AUTH] Already processing, skipping');
      return;
    }

    // Skip if we already processed this user
    if (session?.user.id && session.user.id === lastProcessedUserIdRef.current) {
      console.log('[AUTH] Already processed this user, skipping');
      return;
    }
    
    processingRef.current = true;
    
    try {
      if (!session) {
        console.log('[AUTH] No session - clearing user');
        setCurrentUser(null);
        lastProcessedUserIdRef.current = null;
        return;
      }

      console.log('[AUTH] Processing session for:', session.user.id);
      lastProcessedUserIdRef.current = session.user.id;
      let userData = await databaseFetchCurrentUser(session.user.id);

      // Create user if not found
      if (!userData) {
        console.log('[AUTH] Creating new user');
        userData = await insertNewUser(
          session.user.id,
          session.user.email || '',
          getHandle(session.user)
        );
        if (!userData) throw new Error('Failed to create user');
      }

      // Handle banned users
      if (userData.rank === 'F') {
        console.log('[AUTH] User banned - signing out');
        await supabase.auth.signOut();
        setCurrentUser(null);
        return;
      }

      console.log('[AUTH] User authenticated:', userData.user_id);
      setCurrentUser(userData);
      
    } catch (error) {
      console.error('[AUTH] Session processing failed:', error);
      setCurrentUser(null);
    } finally {
      processingRef.current = false;
      setLoadingWithTimeout(false);
    }
  }, [getHandle, setLoadingWithTimeout]);

  useEffect(() => {
    let mounted = true;
    
    // Initialize data and authentication
    const initialize = async () => {
      if (initializedRef.current) {
        console.log('[AUTH] Already initialized, skipping');
        return;
      }
      
      initializedRef.current = true;
      
      try {
        // Only fetch if we don't have data yet
        if (users.length === 0 || ranks.length === 0) {
          const [userData, rankData] = await Promise.all([
            databaseFetchUsers(),
            databaseFetchRanks(),
          ]);
          
          if (mounted) {
            setUsers(userData);
            setRanks(rankData);
          }
        }
        
        if (mounted) {
          // Initialize auth with timeout protection
          console.log('[AUTH] Initializing authentication');
          setLoadingWithTimeout(true);
          const session = await getCachedSession();
          await processSession(session);
        }
      } catch (error) {
        console.error('[AUTH] Initialization failed:', error);
        if (mounted) setLoadingWithTimeout(false);
      }
    };

    // Handle auth state changes
    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH] State changed:', event);
        sessionCache = null; // Clear cache for fresh data
        
        if (mounted) {
          if (event !== 'INITIAL_SESSION') {
            setLoadingWithTimeout(true);
          }
          await processSession(session);
        }
      }
    );

    // Start initialization
    initialize();

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

    // Cleanup on unmount
    return () => {
      mounted = false;
      processingRef.current = false;
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      removeSupabaseChannel(userSubscription);
      removeSupabaseChannel(rankSubscription);
      authSubscription?.subscription?.unsubscribe();
    };
  }, [processSession, setLoadingWithTimeout]);

  const contextValue = useMemo(() => ({
    users,
    ranks,
    currentUser,
    setCurrentUser,
    logoutUser,
    getCachedSession,
    isAuthLoading,
  }), [users, ranks, currentUser, logoutUser, isAuthLoading]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

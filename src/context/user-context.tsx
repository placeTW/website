import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserType, UserContextProps } from '../types/users'; // Correct import path
import { authSignOut, functionsGetSessionInfo, functionsGetRankName, functionsFetchUsers as supabaseFetchUsers } from '../api/supabase'; // Ensure correct imports
import { useTranslation } from 'react-i18next';

// Initial context state
const UserContext = createContext<UserContextProps>({
  users: [],
  currentUser: null,
  rankNames: {},
  updateUser: () => {},
  logoutUser: () => {},
});

export const useUserContext = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [rankNames, setRankNames] = useState<{ [key: string]: string }>({});
  const [isInitialized, setIsInitialized] = useState(false); // Flag to check initialization

  // Fetch rank names from the server
  const fetchRankNames = useCallback(async () => {
    try {
      const rankData = await functionsGetRankName();
      if (!rankData) return;

      const rankNamesMap: { [key: string]: string } = {};
      rankData.forEach((rank: { rank_id: string; rank_name: string }) => {
        rankNamesMap[rank.rank_id] = rank.rank_name;
      });

      setRankNames(rankNamesMap);
    } catch (error) {
      console.error(t("Error fetching rank names:"), error);
    }
  }, [t]);

  // Fetch users function
  const fetchUsers = useCallback(async () => {
    try {
      const usersData = await supabaseFetchUsers();
      if (!usersData) return;

      const updatedUsers = usersData.map((user: UserType) => ({
        ...user,
        rank_name: rankNames[user.rank] || user.rank,
      }));

      setUsers(updatedUsers);

      const [currentUserId] = await functionsGetSessionInfo();
      if (!currentUserId) return;

      const currentUserData = updatedUsers.find(
        (user: UserType) => user.user_id === currentUserId
      );
      setCurrentUser(currentUserData || null);
    } catch (error) {
      console.error(t("Error fetching users:"), error);
    }
  }, [rankNames, t]);

  // Initialize user status on mount
  useEffect(() => {
    const initializeUserStatus = async () => {
      if (isInitialized) return; // Prevent re-initialization

      try {
        await fetchRankNames();
        await fetchUsers();
        setIsInitialized(true); // Mark as initialized
      } catch (error) {
        console.error("Error initializing user status:", error);
      }
    };

    initializeUserStatus();
  }, [fetchRankNames, fetchUsers, isInitialized]); // Added `isInitialized` to the dependency array

  // Function to update user data
  const updateUser = (updatedUser: UserType) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.user_id === updatedUser.user_id ? updatedUser : user
      )
    );

    setCurrentUser((prevCurrentUser) => {
      if (prevCurrentUser?.user_id === updatedUser.user_id) {
        return updatedUser;
      }
      return prevCurrentUser;
    });
  };

  // Function to logout user
  const logoutUser = () => {
    setCurrentUser(null);
  };

  // Handle user rank bans
  useEffect(() => {
    if (currentUser && currentUser.rank === "F") {
      authSignOut().then(() => {
        alert(t("Your account has been banned."));
        setCurrentUser(null);
      });
    }
  }, [currentUser, t]);

  return (
    <UserContext.Provider value={{ users, currentUser, rankNames, updateUser, logoutUser }}>
      {children}
    </UserContext.Provider>
  );
};

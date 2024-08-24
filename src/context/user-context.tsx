import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserType, UserContextProps } from '../types/users';
import { authSignOut, functionsGetSessionInfo, functionsGetRankName, functionsFetchUsers as supabaseFetchUsers } from '../api/supabase';
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
  const [hasFetchedRankNames, setHasFetchedRankNames] = useState(false);
  const [hasFetchedUsers, setHasFetchedUsers] = useState(false);

  // Fetch rank names from the server
  const fetchRankNames = useCallback(async () => {
    if (hasFetchedRankNames) return;
    try {
      const rankData = await functionsGetRankName();
      if (!rankData) return;

      const rankNamesMap: { [key: string]: string } = {};
      rankData.forEach((rank: { rank_id: string; rank_name: string }) => {
        rankNamesMap[rank.rank_id] = rank.rank_name;
      });

      setRankNames(rankNamesMap);
      setHasFetchedRankNames(true);
    } catch (error) {
      console.error(t("Error fetching rank names:"), error);
    }
  }, [t, hasFetchedRankNames]);

  // Fetch users function
  const fetchUsers = useCallback(async () => {
    if (hasFetchedUsers) return;
    try {
      const usersData = await supabaseFetchUsers();
      if (!usersData) return;

      const updatedUsers = usersData.map((user: UserType) => ({
        ...user,
        rank_name: rankNames[user.rank] || user.rank,
      }));

      setUsers(updatedUsers);

      const currentUserIdArray = await functionsGetSessionInfo();
      if (!currentUserIdArray || currentUserIdArray.length === 0) return;

      const currentUserId = currentUserIdArray[0];
      const currentUserData = updatedUsers.find(
        (user: UserType) => user.user_id === currentUserId
      );
      setCurrentUser(currentUserData || null);
      setHasFetchedUsers(true);
    } catch (error) {
      console.error(t("Error fetching users:"), error);
    }
  }, [rankNames, t, hasFetchedUsers]);

  // Initialize user status on mount
  useEffect(() => {
    const initializeUserStatus = async () => {
      try {
        await fetchRankNames();
        await fetchUsers();
      } catch (error) {
        console.error("Error initializing user status:", error);
      }
    };

    initializeUserStatus();
  }, [fetchRankNames, fetchUsers]);

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

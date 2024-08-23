import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  authSignOut,
  functionsGetRankName,
  functionsGetSessionInfo,
  functionsFetchUsers as supabaseFetchUsers,
} from "../api/supabase";
import { UserContext } from "../context/user-context";
import { UserType } from "../types/users";

const GlobalUserStatusListener = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [rankNames, setRankNames] = useState<{ [key: string]: string }>({});

  const fetchRankNames = useCallback(async () => {
    try {
      const rankData = await functionsGetRankName();

      if (!rankData) {
        return;
      }

      const rankNamesMap: { [key: string]: string } = {};
      rankData.forEach((rank: { rank_id: string; rank_name: string }) => {
        rankNamesMap[rank.rank_id] = rank.rank_name;
      });

      setRankNames(rankNamesMap);
    } catch (error) {
      console.error(t("Error fetching rank names:"), error);
    }
  }, [t]);

  useEffect(() => {
    const initializeUserStatus = async () => {
      try {
        const currentUserIdArray = await functionsGetSessionInfo();

        if (!currentUserIdArray || currentUserIdArray[0] === null) {
          return;
        }

        // Fetch rank names
        const rankData = await functionsGetRankName();
        if (rankData) {
          const rankNamesMap: { [key: string]: string } = {};
          rankData.forEach((rank: { rank_id: string; rank_name: string }) => {
            rankNamesMap[rank.rank_id] = rank.rank_name;
          });
          setRankNames(rankNamesMap);

          // Fetch users with the newly fetched rank names
          await fetchUsers(rankNamesMap);
        }
      } catch (error) {
        console.error("Error initializing user status:", error);
      }
    };

    initializeUserStatus();
  }, []); // Empty dependency array

  // Modify the fetchUsers function to accept rankNames as a parameter
  const fetchUsers = useCallback(
    async (rankNames: { [key: string]: string }) => {
      try {
        const usersData = await supabaseFetchUsers();
        if (!usersData) {
          return;
        }

        const updatedUsers = usersData.map((user: UserType) => ({
          ...user,
          rank_name: rankNames[user.rank] || user.rank,
        }));

        setUsers(updatedUsers);

        const currentUserIdArray = await functionsGetSessionInfo();

        if (!currentUserIdArray || currentUserIdArray.length === 0) {
          return;
        }

        const currentUserId = currentUserIdArray[0];

        const currentUserData = updatedUsers.find(
          (user: UserType) => user.user_id === currentUserId,
        );
        setCurrentUser(currentUserData || null);
      } catch (error) {
        console.error(t("Error fetching users:"), error);
      }
    },
    [t],
  );

  const updateUser = (updatedUser: UserType) => {
    setUsers((prevUsers) => {
      const newUsers = prevUsers.map((user: UserType) =>
        user.user_id === updatedUser.user_id ? updatedUser : user,
      );
      return newUsers;
    });

    setCurrentUser((prevCurrentUser) => {
      if (prevCurrentUser?.user_id === updatedUser.user_id) {
        return updatedUser;
      }
      return prevCurrentUser;
    });
  };

  const logoutUser = () => {
    setCurrentUser(null);
  };

  useEffect(() => {
    if (currentUser && currentUser.rank === "F") {
      authSignOut().then(() => {
        alert(t("Your account has been banned."));
        setCurrentUser(null);
      });
    }
  }, [currentUser, t]);

  return (
    <UserContext.Provider
      value={{ users, currentUser, rankNames, updateUser, logoutUser }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default GlobalUserStatusListener;

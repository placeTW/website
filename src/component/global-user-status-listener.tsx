import { useEffect, useState } from 'react';
import { supabase, functionsGetSessionInfo, functionsGetRankName, functionsFetchUsers as supabaseFetchUsers, authSignOut } from '../api/supabase';
import { UserType } from '../types/users';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../context/user-context';

const GlobalUserStatusListener = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [rankNames, setRankNames] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchRankNames = async () => {
      try {
        const rankData = await functionsGetRankName();

        const rankNamesMap: { [key: string]: string } = {};
        rankData.forEach((rank: { rank_id: string; rank_name: string }) => {
          rankNamesMap[rank.rank_id] = rank.rank_name;
        });

        setRankNames((prevRankNames) => {
          if (JSON.stringify(prevRankNames) !== JSON.stringify(rankNamesMap)) {
            return rankNamesMap;
          }
          return prevRankNames;
        });
      } catch (error) {
        console.error(t('Error fetching rank names:'), error);
      }
    };

    const fetchUsers = async () => {
      try {
        const usersData = await supabaseFetchUsers();
        const updatedUsers = usersData.map((user: UserType) => ({
          ...user,
          rank_name: rankNames[user.rank] || user.rank,
        }));

        setUsers((prevUsers) => {
          if (JSON.stringify(prevUsers) !== JSON.stringify(updatedUsers)) {
            return updatedUsers;
          }
          return prevUsers;
        });

        const [currentUserId, ] = await functionsGetSessionInfo();

        const currentUserData = updatedUsers.find((user: UserType) => user.user_id === currentUserId);
        console.log('Current user data:', currentUserData);
        setCurrentUser((prevCurrentUser) => {
          if (JSON.stringify(prevCurrentUser) !== JSON.stringify(currentUserData)) {
            console.log('Setting current user:', currentUserData);
            return currentUserData || null;
          }
          return prevCurrentUser;
        });
      } catch (error) {
        console.error(t('Error fetching users:'), error);
      }
    };

    fetchRankNames();
    fetchUsers();

    const handleUserUpdate = async (updatedUser: UserType) => {
      console.log('Handling user update:', updatedUser);
      if (updatedUser.rank === 'F') { // Pirate rank_id is 'F'
        console.log('User is banned, signing out...');
        await authSignOut();
        alert(t('Your account has been banned.'));
        setCurrentUser(null);
      }

      setUsers((prevUsers) => {
        const newUsers = prevUsers.map((user: UserType) => (user.user_id === updatedUser.user_id ? updatedUser : user));
        if (JSON.stringify(prevUsers) !== JSON.stringify(newUsers)) {
          return newUsers;
        }
        return prevUsers;
      });

      setCurrentUser((prevCurrentUser) => {
        if (prevCurrentUser?.user_id === updatedUser.user_id) {
          return updatedUser.rank === 'F' ? null : updatedUser;
        }
        return prevCurrentUser;
      });
    };

    const channel = supabase
      .channel('table-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'art_tool_users' }, (payload) => {
        const updatedUser = payload.new as UserType;
        updatedUser.rank_name = rankNames[updatedUser.rank] || updatedUser.rank_name;
        handleUserUpdate(updatedUser);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rankNames, currentUser?.user_id, t]);

  const updateUser = (updatedUser: UserType) => {
    console.log('Updating user:', updatedUser);
    setUsers((prevUsers) => {
      const newUsers = prevUsers.map((user: UserType) => (user.user_id === updatedUser.user_id ? updatedUser : user));
      if (JSON.stringify(prevUsers) !== JSON.stringify(newUsers)) {
        return newUsers;
      }
      return prevUsers;
    });

    setCurrentUser((prevCurrentUser) => {
      if (prevCurrentUser?.user_id === updatedUser.user_id) {
        return updatedUser;
      }
      return prevCurrentUser;
    });
  };

  const logoutUser = () => {
    console.log('Logging out user...');
    setCurrentUser(null);
  };

  useEffect(() => {
    if (currentUser && currentUser.rank === 'F') {
      console.log('Detected banned user after sign-in, logging out...');
      authSignOut().then(() => {
        alert(t('Your account has been banned.'));
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

export default GlobalUserStatusListener;

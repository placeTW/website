import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { UserType } from '../types';
import { useTranslation } from 'react-i18next';

interface UserContextProps {
  users: UserType[];
  currentUser: UserType | null;
  rankNames: { [key: string]: string };
  updateUser: (updatedUser: UserType) => void;
  logoutUser: () => void;
}

const UserContext = createContext<UserContextProps>({
  users: [],
  currentUser: null,
  rankNames: {},
  updateUser: () => {},
  logoutUser: () => {},
});

export const useUserContext = () => useContext(UserContext);

const GlobalUserStatusListener = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [rankNames, setRankNames] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchRankNames = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData?.session) {
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-rank-name`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
        });

        if (response.ok) {
          const rankData = await response.json();
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
        } else {
          const errorData = await response.json();
          console.error(t('Error fetching rank names:'), errorData.error);
        }
      } catch (error) {
        console.error(t('Error fetching rank names:'), error);
      }
    };

    const fetchUsers = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData?.session) {
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
        });

        if (response.ok) {
          const usersData = await response.json();
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

          const currentUserData = updatedUsers.find((user: UserType) => user.user_id === sessionData.session.user.id);
          console.log('Current user data:', currentUserData);
          setCurrentUser((prevCurrentUser) => {
            if (JSON.stringify(prevCurrentUser) !== JSON.stringify(currentUserData)) {
              console.log('Setting current user:', currentUserData);
              return currentUserData || null;
            }
            return prevCurrentUser;
          });
        } else {
          const errorData = await response.json();
          console.error(t('Error fetching users:'), errorData.error);
        }
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
        await supabase.auth.signOut();
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
      supabase.auth.signOut().then(() => {
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

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { UserType } from '../types';

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
          console.error('Error fetching rank names:', errorData.error);
        }
      } catch (error) {
        console.error('Error fetching rank names:', error);
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
          setCurrentUser((prevCurrentUser) => {
            if (JSON.stringify(prevCurrentUser) !== JSON.stringify(currentUserData)) {
              return currentUserData || null;
            }
            return prevCurrentUser;
          });
        } else {
          const errorData = await response.json();
          console.error('Error fetching users:', errorData.error);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchRankNames();
    fetchUsers();

    const channel = supabase
      .channel('table-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'art_tool_users' }, async (payload) => {
        const updatedUser = payload.new as UserType;
        updatedUser.rank_name = rankNames[updatedUser.rank] || updatedUser.rank_name;

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
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rankNames, currentUser?.user_id]);

  const updateUser = (updatedUser: UserType) => {
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
    setCurrentUser(null);
  };

  return (
    <UserContext.Provider value={{ users, currentUser, rankNames, updateUser, logoutUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default GlobalUserStatusListener;

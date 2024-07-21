import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { UserType } from '../types';

interface UserContextProps {
  users: UserType[];
  currentUser: UserType | null;
  rankNames: { [key: string]: string };
  updateUser: (updatedUser: UserType) => void;
}

const UserContext = createContext<UserContextProps>({
  users: [],
  currentUser: null,
  rankNames: {},
  updateUser: () => {},
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
          console.error('Error fetching session:', sessionError);
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

          setRankNames(rankNamesMap);
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
          console.error('Error fetching session:', sessionError);
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
          setUsers(updatedUsers);

          // Set the current user
          const currentUserData = updatedUsers.find((user) => user.user_id === sessionData.session.user.id);
          setCurrentUser(currentUserData || null);
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

        setUsers((prevUsers) =>
          prevUsers.map((user) => (user.user_id === updatedUser.user_id ? updatedUser : user))
        );

        if (updatedUser.user_id === currentUser?.user_id) {
          setCurrentUser(updatedUser);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rankNames, currentUser?.user_id]);

  const updateUser = (updatedUser: UserType) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => (user.user_id === updatedUser.user_id ? updatedUser : user))
    );
    if (updatedUser.user_id === currentUser?.user_id) {
      setCurrentUser(updatedUser);
    }
  };

  return (
    <UserContext.Provider value={{ users, currentUser, rankNames, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default GlobalUserStatusListener;

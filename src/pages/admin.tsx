import { useEffect, useState } from 'react';
import { Box, Heading, Table, Tbody, Td, Th, Thead, Tr, Select } from '@chakra-ui/react';
import { supabase } from '../supabase';  // Ensure the path is correct

interface User {
  user_id: string;
  email: string | null;
  handle: string;
  rank: string;
  rank_name?: string;
}

interface Payload {
  eventType: string; // Adjust from type to eventType
  new: User;
  old: User;
}

const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [moderatableRanks, setModeratableRanks] = useState<string[]>([]);
  const [rankNames, setRankNames] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchRankNames = async (sessionData: any) => {
      console.log("Fetching rank names...");
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-rank-name`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Rank names data:", data);

          const rankNamesMap: { [key: string]: string } = {};
          data.forEach((rank: { rank_id: string; rank_name: string }) => {
            rankNamesMap[rank.rank_id] = rank.rank_name;
          });

          setRankNames(rankNamesMap);
          console.log("Rank Names:", rankNamesMap);
        } else {
          const errorData = await response.json();
          setError(errorData.error);
          console.log("Error fetching rank names:", errorData.error);
        }
      } catch (error) {
        console.error("Fetch rank names error:", error);
        setError('Fetch rank names error');
      }
    };

    const fetchUserRank = async (userId: string, sessionData: any) => {
      console.log(`Fetching user rank for userId: ${userId}`);
      const { data: userData, error: userError } = await supabase
        .from('art_tool_users')
        .select('rank')
        .eq('user_id', userId)
        .single();
      console.log("User rank data:", userData);

      if (userError) {
        setError(userError.message);
        return;
      }

      const { rank } = userData;

      console.log("Fetching moderatable ranks...");
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-can-moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ rank_id: rank }),
      });

      if (response.ok) {
        const data = await response.json();
        setModeratableRanks(data.can_moderate);
        console.log("Moderatable Ranks:", data.can_moderate);
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    };

    const fetchUsers = async () => {
      console.log("Fetching session data...");
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("Session data:", sessionData);

      if (sessionError || !sessionData?.session) {
        setError('Error fetching session');
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching users...");
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Users data:", data);
          if (Array.isArray(data)) {
            const sortedData = sortUsers(data);
            setUsers(sortedData);
            await fetchUserRank(sessionData.session.user.id, sessionData);
            await fetchRankNames(sessionData);
          } else {
            setError('Unexpected response format');
          }
          setLoading(false);
        } else {
          const errorData = await response.json();
          setError(errorData.error);
          setLoading(false);
        }
      } catch (error) {
        console.log("Fetch error:", error);
        setError('Fetch error');
        setLoading(false);
      }
    };

    fetchUsers();

    const channel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'art_tool_users' },
        async (payload: Payload) => {
          console.log("Real-time update received:", payload);
          if (payload.new && payload.new.user_id) {
            setLogs((prevLogs) => [
              ...prevLogs,
              `Change received for user ${payload.new.user_id}: ${JSON.stringify(payload.new)}`,
            ]);

            setUsers((prevUsers) => {
              const updatedUsers = prevUsers.map((user) =>
                user.user_id === payload.new.user_id ? { ...user, ...payload.new } : user
              );
              return sortUsers(updatedUsers); // Sort after updating the users
            });

            // If the logged-in user's rank has changed, update moderatableRanks
            const { data: sessionData } = await supabase.auth.getSession();
            if (payload.new.user_id === sessionData.session.user.id) {
              await fetchUserRank(sessionData.session.user.id, sessionData);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sortUsers = (users: User[]): User[] => {
    return users.sort((a, b) => {
      if (a.rank === b.rank) {
        return (a.email || '').localeCompare(b.email || '');
      }
      return a.rank.localeCompare(b.rank);
    });
  };

  const updateUserRank = async (userId: string, rank: string) => {
    console.log(`Updating user rank for userId: ${userId} to rank: ${rank}`);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log("Session data:", sessionData);

    if (sessionError || !sessionData?.session) {
      setError('Error fetching session');
      return;
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/updateUserStatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify({ userId, rank }),
    });

    if (response.ok) {
      const responseData = await response.json();
      setLogs((prevLogs) => [
        ...prevLogs,
        `Updated user ${userId} to ${rank}: ${JSON.stringify(responseData)}`,
      ]);
      console.log("User rank updated successfully");

      // If the logged-in user's rank has changed, update moderatableRanks
      if (userId === sessionData.session.user.id) {
        await fetchUserRank(userId, sessionData);
      }
    } else {
      const errorData = await response.json();
      setError(errorData.error);
      console.log("Error updating user rank:", errorData);
    }
  };

  const renderTable = () => (
    <Table variant="simple">
      <Thead>
        <Tr>
          <Th>Email</Th>
          <Th>Username</Th>
          <Th>Rank</Th>
        </Tr>
      </Thead>
      <Tbody>
        {users.map((user) => (
          <Tr key={user.user_id}>
            <Td>{user.email}</Td>
            <Td>{user.handle}</Td>
            <Td>
              <Select
                value={user.rank}
                onChange={(e) => updateUserRank(user.user_id, e.target.value)}
              >
                {Object.entries(rankNames).map(([rankId, rankName]) => (
                  <option
                    key={rankId}
                    value={rankId}
                    disabled={!moderatableRanks.includes(rankId) && rankId !== user.rank}
                  >
                    {rankName}
                  </option>
                ))}
              </Select>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Box p={4}>
      <Heading as="h2" size="lg" mb={4}>
        Admin Page
      </Heading>
      {renderTable()}
      <Box mt={4}>
        <Heading as="h3" size="md" mb={2}>
          Logs
        </Heading>
        {logs.map((log, index) => (
          <p key={index}>{log}</p>
        ))}
      </Box>
    </Box>
  );
};

export default AdminPage;

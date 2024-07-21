import { useEffect, useState } from 'react';
import { Box, Heading, Table, Tbody, Td, Th, Thead, Tr, Select } from '@chakra-ui/react';
import { supabase } from '../supabase';
import { useUserContext } from '../component/global-user-status-listener';

const AdminPage = () => {
  const { users, currentUser, rankNames, updateUser } = useUserContext();
  const [moderatableRanks, setModeratableRanks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModeratableRanks = async () => {
      if (!currentUser) return;

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData?.session) {
          console.error('Error fetching session:', sessionError);
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-can-moderate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ rank_id: currentUser.rank }),
        });

        if (response.ok) {
          const data = await response.json();
          setModeratableRanks(data.can_moderate);
        } else {
          const errorData = await response.json();
          setError(errorData.error);
        }
      } catch (error) {
        console.error('Fetch user details error:', error);
        setError('Fetch user details error');
      }
    };

    fetchModeratableRanks();
  }, [currentUser]);

  const updateUserRank = async (userId: string, rank: string) => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
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
      updateUser(responseData); // Update the context with the new user data
    } else {
      const errorData = await response.json();
      setError(errorData.error);
    }
  };

  const sortUsers = (users: UserType[]): UserType[] => {
    return users.sort((a, b) => {
      if (a.rank === b.rank) {
        return (a.email || '').localeCompare(b.email || '');
      }
      return a.rank.localeCompare(b.rank);
    });
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
        {sortUsers(users).map((user) => (
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

  return (
    <Box p={4}>
      <Heading as="h2" size="lg" mb={4}>
        Admin Page
      </Heading>
      {error && <Box mb={4} color="red.500">{error}</Box>}
      {renderTable()}
    </Box>
  );
};

export default AdminPage;

import { useEffect, useState } from 'react';
import { Box, Heading, Table, Tbody, Td, Th, Thead, Tr, Select } from '@chakra-ui/react';
import { functionsFetchCanModerate, functionsUpdateUserStatus } from '../api/supabase';
import { UserType } from '../types/users';  // Ensure this import is present
import { useTranslation } from 'react-i18next';  // Import the useTranslation hook
import { useUserContext } from '../context/user-context';

const AdminPage = () => {
  const { t } = useTranslation();  // Initialize the useTranslation hook
  const { users, currentUser, rankNames, updateUser } = useUserContext();
  const [moderatableRanks, setModeratableRanks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModeratableRanks = async () => {
      if (!currentUser) return;

      try {
        const data = await functionsFetchCanModerate(currentUser.rank);
        setModeratableRanks(data.can_moderate);
      } catch (error) {
        console.error('Fetch user details error:', error);
        setError('Fetch user details error');
      }
    };

    fetchModeratableRanks();
  }, [currentUser]);

  const updateUserRank = async (userId: string, rank: string) => {
    try {
      const responseData = await functionsUpdateUserStatus(userId, rank); // Update the user status
      updateUser(responseData); // Update the context with the new user data
    }
    catch (error) {
      console.error('Update user status error:', error);
      setError('Update user status error');
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
          <Th>{t('User ID')}</Th>
          <Th>{t('Username')}</Th>
          <Th>{t('Rank')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {sortUsers(users).map((user) => (
          <Tr key={user.user_id}>
            <Td>{user.user_id}</Td>
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
        {t('Admin Page')}
      </Heading>
      {error && <Box mb={4} color="red.500">{error}</Box>}
      {renderTable()}
    </Box>
  );
};

export default AdminPage;

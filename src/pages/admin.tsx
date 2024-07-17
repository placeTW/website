import { useEffect, useState } from 'react';
import { Box, Button, Heading, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { supabase } from '../supabase';

const AdminPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        setError('Error fetching users');
        console.error('Error fetching users:', error);
        setLoading(false);
        return;
      }
      setUsers(data.users);
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const promoteToAdmin = async (userId: string) => {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role: 'admin' }
    });
    if (error) {
      setError('Error promoting user');
      console.error('Error promoting user:', error);
    } else {
      setUsers((prevUsers) => 
        prevUsers.map((user) => 
          user.id === userId ? { ...user, user_metadata: { ...user.user_metadata, role: 'admin' } } : user
        )
      );
    }
  };

  const demoteToUser = async (userId: string) => {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role: 'user' }
    });
    if (error) {
      setError('Error demoting user');
      console.error('Error demoting user:', error);
    } else {
      setUsers((prevUsers) => 
        prevUsers.map((user) => 
          user.id === userId ? { ...user, user_metadata: { ...user.user_metadata, role: 'user' } } : user
        )
      );
    }
  };

  const banUser = async (userId: string) => {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { banned_until: new Date(9999, 11, 31).toISOString() } // Set a far future date to ban the user
    });
    if (error) {
      setError('Error banning user');
      console.error('Error banning user:', error);
    } else {
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <Box p={4}>
      <Heading as="h2" size="lg" mb={4}>
        Admin Page
      </Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user) => (
            <Tr key={user.id}>
              <Td>{user.email}</Td>
              <Td>{user.user_metadata?.role || 'user'}</Td>
              <Td>
                {user.user_metadata?.role !== 'admin' && (
                  <Button colorScheme="blue" onClick={() => promoteToAdmin(user.id)} mr={2}>
                    Promote to Admin
                  </Button>
                )}
                {user.user_metadata?.role === 'admin' && (
                  <Button colorScheme="yellow" onClick={() => demoteToUser(user.id)} mr={2}>
                    Demote to User
                  </Button>
                )}
                <Button colorScheme="red" onClick={() => banUser(user.id)}>
                  Ban User
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default AdminPage;

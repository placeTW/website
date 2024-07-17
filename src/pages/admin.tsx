// src/pages/admin.tsx

import { useEffect, useState } from 'react';
import { Box, Button, Heading, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AdminPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData?.session) {
        setError('Error fetching session');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/fetch-users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Fetched users:', data);

          if (data && Array.isArray(data.users)) {
            setUsers(data.users);
          } else {
            console.error('Unexpected response format:', data);
            setError('Unexpected response format');
          }
          setLoading(false);
        } else {
          const errorData = await response.json();
          console.error('Error fetching users:', errorData);
          setError(errorData.error);
          setLoading(false);
        }
      } catch (error) {
        console.error('Fetch error:', error);
        setError('Fetch error');
        setLoading(false);
      }
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

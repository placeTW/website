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
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData?.session) {
        setError('Error fetching session');
        setLoading(false);
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/promoteToAdmin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Promoted user:', data);
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, user_metadata: { ...user.user_metadata, role: 'admin' } } : user
          )
        );
      } else {
        const errorData = await response.json();
        console.error('Error promoting user:', errorData);
        setError(errorData.error);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Fetch error');
    }
  };

  const demoteToUser = async (userId: string) => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData?.session) {
      setError('Error fetching session');
      return;
    }

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/demoteToUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Demoted user:', data);

        if (data && data.user) {
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.id === userId ? { ...user, user_metadata: { ...user.user_metadata, role: 'user' } } : user
            )
          );
        } else {
          console.error('Unexpected response format:', data);
          setError('Unexpected response format');
        }
      } else {
        const errorData = await response.json();
        console.error('Error demoting user:', errorData);
        setError(errorData.error);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Fetch error');
    }
  };
  const banUser = async (userId: string) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
      if (sessionError || !sessionData?.session) {
        setError('Error fetching session');
        return;
      }
  
      const response = await fetch(`${supabaseUrl}/functions/v1/banUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        },
        body: JSON.stringify({ userId })
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Banned user:', data);
  
        if (data && data.user) {
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.id === userId ? { ...user, user_metadata: { ...user.user_metadata, role: 'banned' } } : user
            )
          );
        } else {
          console.error('Unexpected response format:', data);
          setError('Unexpected response format');
        }
      } else {
        const errorData = await response.json();
        console.error('Error banning user:', errorData);
        setError(errorData.error);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Fetch error');
    }
  };
  

  const unbanUser = async (userId: string) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData?.session) {
        setError('Error fetching session');
        setLoading(false);
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/unbanUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Unbanned user:', data);
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, user_metadata: { ...user.user_metadata, role: 'user' } } : user
          )
        );
      } else {
        const errorData = await response.json();
        console.error('Error unbanning user:', errorData);
        setError(errorData.error);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Fetch error');
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
                {user.user_metadata?.role !== 'banned' ? (
                  <Button colorScheme="red" onClick={() => banUser(user.id)}>
                    Ban User
                  </Button>
                ) : (
                  <Button colorScheme="green" onClick={() => unbanUser(user.id)}>
                    Unban User
                  </Button>
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default AdminPage;

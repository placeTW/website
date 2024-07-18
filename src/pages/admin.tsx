import { useEffect, useState } from 'react';
import { Box, Button, Heading, Table, Tbody, Td, Th, Thead, Tr, Text } from '@chakra-ui/react';
import { supabase } from '../supabase';  // Ensure the path is correct
import { useNavigate } from 'react-router-dom';

// Define the type for user objects
interface User {
  user_id: string;
  email: string | null;
  nickname: string;
  status: string;
}

// Define the type for the real-time payload
interface Payload {
  new: User;
}

const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData?.session) {
        setError('Error fetching session');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Fetched users:', data);

          if (Array.isArray(data)) {  // Check if data is an array
            setUsers(data);
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

    const channel = supabase
      .channel('table-db-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'art_tool_users',
      } as any,  // Cast to any to bypass type error temporarily
      (payload: Payload) => {
        console.log('Change received!', payload);
        if (payload.new && payload.new.user_id) {
          setLogs((prevLogs) => [
            ...prevLogs, 
            `Change received for user ${payload.new.user_id}: ${JSON.stringify(payload.new)}`
          ]);

          // Update the specific user in the state
          setUsers((prevUsers) => {
            const updatedUsers = prevUsers.map(user => 
              user.user_id === payload.new.user_id ? { ...user, ...payload.new } : user
            );
            return updatedUsers;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData?.session) {
        setError('Error fetching session');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/updateUserStatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ userId, status })
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log(`Updated user ${userId} to ${status}:`, responseData);
        setLogs((prevLogs) => [
          ...prevLogs, 
          `Updated user ${userId} to ${status}: ${JSON.stringify(responseData)}`
        ]);

        // Manually update the user in the state without refetching
        setUsers((prevUsers) => {
          const updatedUsers = prevUsers.map(user =>
            user.user_id === userId ? { ...user, status } : user
          );
          return updatedUsers;
        });
      } else {
        const errorData = await response.json();
        console.error(`Error updating user to ${status}:`, errorData);
        setError(errorData.error);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Fetch error');
    }
  };

  const renderTable = () => {
    return (
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Email</Th>
            <Th>Nickname</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user) => (
            <Tr key={user.user_id}>
              <Td>{user.email}</Td>
              <Td>{user.nickname}</Td>
              <Td>{user.status}</Td>
              <Td>
                {user.status !== 'admin' && (
                  <Button colorScheme="blue" onClick={() => updateUserStatus(user.user_id, 'admin')} mr={2}>
                    Promote to Admin
                  </Button>
                )}
                {user.status === 'admin' && (
                  <Button colorScheme="yellow" onClick={() => updateUserStatus(user.user_id, 'user')} mr={2}>
                    Demote to User
                  </Button>
                )}
                {user.status !== 'banned' ? (
                  <Button colorScheme="red" onClick={() => updateUserStatus(user.user_id, 'banned')}>
                    Ban User
                  </Button>
                ) : (
                  <Button colorScheme="green" onClick={() => updateUserStatus(user.user_id, 'user')}>
                    Unban User
                  </Button>
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    );
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
      {renderTable()}
      <Box mt={4}>
        <Heading as="h3" size="md" mb={2}>
          Logs
        </Heading>
        {logs.map((log, index) => (
          <Text key={index}>{log}</Text>
        ))}
      </Box>
    </Box>
  );
};

export default AdminPage;

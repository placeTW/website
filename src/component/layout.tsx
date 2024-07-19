import { Box } from "@chakra-ui/react";
import Navbar from "./navbar";
import Footer from "./footer";
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import GlobalUserStatusListener from './global-user-status-listener';
import { UserType } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [artToolUser, setArtToolUser] = useState<UserType | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        return;
      }

      const authUser = sessionData?.session?.user;
      if (!authUser) {
        console.error('No authenticated user found');
        return;
      }

      // Retry logic to fetch user from the edge function
      const maxRetries = 5;
      let attempts = 0;

      while (attempts < maxRetries) {
        console.log(`Attempt ${attempts + 1} to fetch user...`);

        const accessToken = sessionData?.session?.access_token ?? '';

        const response = await fetch(`${supabaseUrl}/functions/v1/fetch-one-user?user_id=${authUser.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('User found:', userData);
          setArtToolUser(userData);
          return;
        } else {
          const errorData = await response.json();
          console.error('Error fetching user data:', errorData);

          if (errorData.error === 'PGRST116') {
            console.log('User not found in art_tool_users, retrying...');
          } else {
            console.error('Unexpected error:', errorData.error);
            return;
          }
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
      }

      console.error('Failed to fetch user after several attempts');
    };

    fetchUser();
  }, []);

  const handleUserUpdate = (updatedUser: UserType) => {
    setArtToolUser(updatedUser);
  };

  return (
    <Box w="100vw">
      <Navbar user={artToolUser} />
      <Box p={4}>{children}</Box>
      <Footer />
      {artToolUser && <GlobalUserStatusListener user={artToolUser} onUserUpdate={handleUserUpdate} />}
    </Box>
  );
};

export default Layout;

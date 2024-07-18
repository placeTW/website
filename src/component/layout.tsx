import { Box } from "@chakra-ui/react";
import Navbar from "./navbar";
import Footer from "./footer";
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';
import GlobalUserStatusListener from './global-user-status-listener';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };

    fetchUser();
  }, []);

  return (
    <Box w="100vw">
      <Navbar />

      <Box p={4}>{children}</Box>

      <Footer />

      {user && <GlobalUserStatusListener user={user} />}
    </Box>
  );
};

export default Layout;

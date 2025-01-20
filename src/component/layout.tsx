// src/component/layout.tsx

import React from "react";
import { Box } from "@chakra-ui/react";
import Footer from "./footer";
import Navbar from "./navbar";
import { UserProvider } from "../context/user-context"; // Correct import for UserProvider

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UserProvider>
      <Box>
        <Navbar />
        <Box p={4}>{children}</Box>
        <Footer />
      </Box>
    </UserProvider>
  );
};

export default Layout;

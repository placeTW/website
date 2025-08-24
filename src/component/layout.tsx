// src/component/layout.tsx

import React from "react";
import { Box } from "@chakra-ui/react";
import Footer from "./footer";
import Navbar from "./navbar";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box>
      <Navbar />
      <Box p={4}>{children}</Box>
      <Footer />
    </Box>
  );
};

export default Layout;

import { Box } from "@chakra-ui/react";
import Footer from "./footer";
import GlobalUserStatusListener from "./global-user-status-listener";
import Navbar from "./navbar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box w="100vw" pt="60px" pb="40px">
      <GlobalUserStatusListener>
        <Navbar />
        <Box p={4} height="calc(100vh - 120px)" overflowY="auto">{children}</Box>
        <Footer />
      </GlobalUserStatusListener>
    </Box>
  );
};

export default Layout;

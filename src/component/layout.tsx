import { Box } from "@chakra-ui/react";
import Navbar from "./navbar";
import Footer from "./footer";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box w="100vw">
      {/* Navbar */}
      <Navbar />

      {/* Rest of the content */}
      <Box p={4}>{children}</Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default Layout;

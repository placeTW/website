import { Box } from "@chakra-ui/react";
import Navbar from "./navbar";
import Footer from "./footer";
import GlobalUserStatusListener from './global-user-status-listener';
import { useTranslation } from 'react-i18next';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();

  return (
    <Box w="100vw">
      <GlobalUserStatusListener>
        <Navbar />
        <Box p={4}>{children}</Box>
        <Footer />
      </GlobalUserStatusListener>
    </Box>
  );
};

export default Layout;

import { Box, Heading } from '@chakra-ui/react';
import ColorPaletteManager from '../component/art_tool/color-palette-manager';
import AlertManage from '../component/art_tool/alert-manage';
import UserManage from '../component/art_tool/user-manage';  // Import the new UserManage component

const AdminPage: React.FC = () => {
  return (
    <Box p={4}>
      <Heading as="h2" size="lg" mb={4}>
        Admin Page
      </Heading>
      <UserManage />  {/* Add the UserManage component */}
      <Box mt={8}>
        <ColorPaletteManager />
      </Box>
      <Box mt={8}>
        <AlertManage />
      </Box>
    </Box>
  );
};

export default AdminPage;

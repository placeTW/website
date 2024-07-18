import { useState, useEffect } from 'react';
import { Box, Flex, Spacer, Heading, Link, Button, Text, Input, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import AuthProviderModal from './auth-provider-modal';
import LanguageSwitcher from './language-switcher';

type UserMetadata = {
  username: string;
  role: string;
};

type UserType = {
  id: string;
  user_metadata: UserMetadata;
};

const Navbar = () => {
  const { t } = useTranslation();
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [username, setUsername] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching user:', error);
        return;
      }
      if (data?.session?.user) {
        const userData = data.session.user;
        let initialUsername = userData.user_metadata?.username;
        if (!initialUsername) {
          initialUsername = userData.email?.split('@')[0] || 'Unknown';
        }
        const userMetadata: UserMetadata = {
          username: initialUsername,
          role: userData.user_metadata?.role || 'user'
        };
        setUser({
          id: userData.id,
          user_metadata: userMetadata
        });
        setUsername(userMetadata.username);
      }
    };
    fetchUser();
  }, []);

  const handleOpenModal = () => {
    setAuthModalOpen(true);
  };

  const handleCloseModal = () => setAuthModalOpen(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const handleSaveUsername = async () => {
    if (user) {
      const { error } = await supabase.auth.updateUser({
        data: { username }
      });
      if (!error) {
        setUser({ ...user, user_metadata: { ...user.user_metadata, username } });
        onClose();
      }
    }
  };

  return (
    <Box bg="blue.500" px={4} py={2}>
      <Flex alignItems="center" maxW="xxl">
        <Heading as="h1" size="lg" color="white">
          PlaceTW
        </Heading>

        <Spacer />

        <Box>
          <Link as={RouterLink} to="/" color="white" mr={4}>
            {t("Home")}
          </Link>
          <Link as={RouterLink} to="/gallery" color="white" mr={4}>
            {t("Gallery")}
          </Link>
          {user && user.user_metadata.role === 'admin' && (
            <Link as={RouterLink} to="/admin" color="white" mr={4}>
              {t('Admin')}
            </Link>
          )}
        </Box>

        <Box>
          <LanguageSwitcher />
        </Box>

        <Box ml={4}>
          {user ? (
            <Flex alignItems="center">
              <Text color="white" mr={2}>
                Hi, {user.user_metadata.username}
              </Text>
              <Button onClick={onOpen} colorScheme="blue" mr={2}>
                {t('Edit Username')}
              </Button>
              <Button onClick={handleLogout} colorScheme="blue">
                {t('Logout')}
              </Button>
            </Flex>
          ) : (
            <Button onClick={handleOpenModal} colorScheme="blue">
              {t('Login')}
            </Button>
          )}
        </Box>
      </Flex>

      <AuthProviderModal isOpen={isAuthModalOpen} onClose={handleCloseModal} authType="login" />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Username</ModalHeader>
          <ModalBody>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleSaveUsername}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Navbar;

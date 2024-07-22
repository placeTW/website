import { useState, useEffect } from 'react';
import {
  Box, Flex, Spacer, Heading, Link, Button, Text, Input, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, updateNickname } from '../api/supabase';
import AuthProviderModal from './auth-provider-modal';
import LanguageSwitcher from './language-switcher';
import { useUserContext } from '../context/user-context';

const Navbar = () => {
  const { currentUser, logoutUser } = useUserContext();
  const { t } = useTranslation();  // Initialize the useTranslation hook
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.handle);
    }
  }, [currentUser]);

  const handleOpenModal = () => {
    setAuthModalOpen(true);
  };

  const handleCloseModal = () => setAuthModalOpen(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logoutUser(); // Update context to reflect the logged-out state
    navigate('/');
  };

  const handleSaveUsername = async () => {
    try {
      if (!currentUser) {
        return;
      }

      await updateNickname(username);

      onClose();
    } catch (error) {
      console.error(t('Error updating username'), error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveUsername();
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
            {t('Home')}
          </Link>
          <Link as={RouterLink} to="/gallery" color="white" mr={4}>
            {t('Gallery')}
          </Link>
          {currentUser && (currentUser.rank === 'A' || currentUser.rank === 'B') && (
            <Link as={RouterLink} to="/admin" color="white" mr={4}>
              {t('Officers')}
            </Link>
          )}
        </Box>

        <Box>
          <LanguageSwitcher />
        </Box>

        <Box ml={4}>
          {currentUser ? (
            <Flex alignItems="center">
              <Text color="white" mr={2}>
                {t('Welcome')}, {currentUser.rank_name} {currentUser.handle}
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
          <ModalHeader>{t('Edit Username')}</ModalHeader>
          <ModalBody>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown} // Handle Enter key press
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleSaveUsername}>
              {t('Save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Navbar;

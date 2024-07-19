import { useState, useEffect } from 'react';
import {
  Box, Flex, Spacer, Heading, Link, Button, Text, Input, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import AuthProviderModal from './auth-provider-modal';
import LanguageSwitcher from './language-switcher';
import { UserType } from '../types'; // Ensure this path is correct

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

interface NavbarProps {
  user: UserType | null;
}

const Navbar = ({ user }: NavbarProps) => {
  const { t } = useTranslation();
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setUsername(user.handle);
    }
  }, [user]);

  const handleOpenModal = () => {
    setAuthModalOpen(true);
  };

  const handleCloseModal = () => setAuthModalOpen(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleSaveUsername = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.user) {
        console.error('Error fetching session:', sessionError);
        return;
      }

      const userId = sessionData.session.user.id;

      const response = await fetch(`${supabaseUrl}/functions/v1/update-nickname`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ userId, handle: username }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      onClose();
    } catch (error) {
      console.error('Error updating username:', error);
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
          {user && (user.rank_name === 'Admiral' || user.rank_name === 'Captain') && (
            <Link as={RouterLink} to="/officers" color="white" mr={4}>
              {t('Officers')}
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
                Welcome, {user.rank_name} {user.handle}
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

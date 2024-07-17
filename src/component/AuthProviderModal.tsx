import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Stack } from '@chakra-ui/react';
import { supabase } from '../supabase';

const AuthProviderModal = ({ isOpen, onClose, authType }: { isOpen: boolean; onClose: () => void; authType: 'login' | 'register' }) => {
  const handleAuth = async (provider: 'google' | 'discord') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{authType === 'register' ? 'Choose Registration Provider' : 'Choose Login Provider'}</ModalHeader>
        <ModalBody>
          <Stack spacing={4}>
            <Button onClick={() => handleAuth('google')} colorScheme="blue">
              {authType === 'register' ? 'Register with Google' : 'Login with Google'}
            </Button>
            <Button onClick={() => handleAuth('discord')} colorScheme="blue">
              {authType === 'register' ? 'Register with Discord' : 'Login with Discord'}
            </Button>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AuthProviderModal;

import React, { useState, useEffect } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Stack } from '@chakra-ui/react';
import { supabase } from '../supabase';
import { Provider } from '@supabase/supabase-js';

interface AuthProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  authType: 'register' | 'login';
}

const AuthProviderModal: React.FC<AuthProviderModalProps> = ({ isOpen, onClose, authType }) => {
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (provider: Provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Error signing in:', error);
      setError('Error signing in');
      return;
    }

    // Redirect the user to the OAuth URL
    window.location.href = data.url;
  };

  useEffect(() => {
    // Check session after redirect
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error fetching session:', error);
        setError('Error fetching session');
        return;
      }

      if (session) {
        const user = session.user;
        if (user.user_metadata.role === 'banned') {
          await supabase.auth.signOut();
          setError('Your account has been banned.');
        } else {
          onClose();
        }
      }
    };

    checkSession();
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{authType === 'register' ? 'Choose Registration Provider' : 'Choose Login Provider'}</ModalHeader>
        <ModalBody>
          <Stack spacing={4}>
            {error && <p style={{ color: 'red' }}>{error}</p>}
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

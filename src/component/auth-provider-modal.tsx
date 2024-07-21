import React, { useState, useEffect } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Stack } from '@chakra-ui/react';
import { supabase } from '../supabase';
import { Provider } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

interface AuthProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  authType: 'register' | 'login';
}

const AuthProviderModal: React.FC<AuthProviderModalProps> = ({ isOpen, onClose, authType }) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (provider: Provider) => {
    console.log(t('Starting authentication with provider:'), provider);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error(t('Error signing in:'), error);
      setError(t('Error signing in'));
      return;
    }

    console.log(t('Authentication data:'), data);

    // Redirect the user to the OAuth URL
    window.location.href = data.url;
  };

  useEffect(() => {
    if (!isOpen) return;

    // Check session after redirect
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error(t('Error fetching session:'), error);
        setError(t('Error fetching session'));
        return;
      }

      if (session) {
        const userId = session.user.id;
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/fetch-one-user?user_id=${userId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
          });

          if (!response.ok) {
            throw new Error(t('Failed to fetch user data'));
          }

          const userData = await response.json();

          if (userData.rank === 'Pirate') {
            await supabase.auth.signOut();
            setError(t('Your account has been banned.'));
          } else {
            onClose();
          }
        } catch (fetchError) {
          console.error(t('Error fetching user from art_tool_users:'), fetchError);
          setError(t('Error fetching user from art_tool_users'));
        }
      }
    };

    checkSession();

    // Subscribe to the 'bans' channel
    const subscription = supabase
      .channel('bans')
      .on('broadcast', { event: 'ban' }, async (payload) => {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (payload?.payload?.userId === userId) {
          await supabase.auth.signOut();
          setError(t('Your account has been banned.'));
        }
      })
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isOpen, onClose, t]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{authType === 'register' ? t('Choose Registration Provider') : t('Choose Login Provider')}</ModalHeader>
        <ModalBody>
          <Stack spacing={4}>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <Button onClick={() => handleAuth('google')} colorScheme="blue">
              {authType === 'register' ? t('Register with Google') : t('Login with Google')}
            </Button>
            <Button onClick={() => handleAuth('discord')} colorScheme="blue">
              {authType === 'register' ? t('Register with Discord') : t('Login with Discord')}
            </Button>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>{t('Close')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AuthProviderModal;

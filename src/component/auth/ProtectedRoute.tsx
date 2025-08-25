// src/component/auth/ProtectedRoute.tsx

import React, { useState } from 'react';
import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useUserContext } from '../../context/user-context';
import AuthProviderModal from '../auth-provider-modal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiresRank?: string[];
}

/**
 * ProtectedRoute component that wraps content requiring authentication
 * Shows login modal or access denied message based on user status
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback,
  requiresRank 
}) => {
  const { t } = useTranslation();
  const { currentUser, isAuthLoading } = useUserContext();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Show loading state while checking authentication
  if (isAuthLoading) {
    return (
      <Box p={8} textAlign="center">
        <Text>{t("Checking authentication...")}</Text>
      </Box>
    );
  }

  // If user is not authenticated and this is a protected route
  if (!currentUser) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <>
        <Box p={8} textAlign="center">
          <VStack spacing={4}>
            <Heading size="lg">{t("Authentication Required")}</Heading>
            <Text>{t("Please log in to access this page.")}</Text>
            <Button colorScheme="blue" onClick={() => setShowLoginModal(true)}>
              {t("Login")}
            </Button>
          </VStack>
        </Box>
        <AuthProviderModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
          authType="login" 
        />
      </>
    );
  }

  // If user is authenticated but doesn't have required rank
  if (requiresRank && !requiresRank.includes(currentUser.rank)) {
    return (
      <Box p={8} textAlign="center">
        <VStack spacing={4}>
          <Heading size="lg" color="red.500">{t("Access Denied")}</Heading>
          <Text>{t("You don't have permission to access this page.")}</Text>
        </VStack>
      </Box>
    );
  }

  // User is authenticated and has proper access
  return <>{children}</>;
};

export default ProtectedRoute;
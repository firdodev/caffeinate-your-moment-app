import { StyleSheet } from 'react-native';
import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/authContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BalanceProvider } from '../utils/balanceContext';
import { LoyaltyProvider } from '../utils/loyaltyContext';

const StackLayout = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/welcome');
      }
    }
  }, [user, loading]);

  return <Stack screenOptions={{ headerShown: false }} />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <BalanceProvider>
        <LoyaltyProvider>
          <GestureHandlerRootView>
            <StackLayout />
          </GestureHandlerRootView>
        </LoyaltyProvider>
      </BalanceProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({});

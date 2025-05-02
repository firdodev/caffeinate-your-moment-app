import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext(null);

const config = {
  domain: 'dev-euksl3e3ndmpypcn.us.auth0.com',
  clientId: '0anEwRAyCg7Dj1u2RnyCaKH6TRpO1kSV',
  audience: 'https://dev-euksl3e3ndmpypcn.us.auth0.com/api/v2/',
  redirectUri: 'exp://localhost:8081'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/welcome');
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);
      const authRequest = new AuthSession.AuthRequest({
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.Token
      });

      const result = await authRequest.promptAsync({
        authorizationEndpoint: `https://${config.domain}/authorize`
      });

      if (result.type === 'success') {
        const userInfo = await fetchUserInfo(result.params.access_token);
        const userData = {
          uid: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name
        };
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        router.replace('/(tabs)');
        return { success: true };
      } else {
        return { success: false, msg: 'Login was cancelled' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, msg: 'An error occurred during login' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async () => {
    try {
      setIsLoading(true);
      const authRequest = new AuthSession.AuthRequest({
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.Token,
        prompt: AuthSession.Prompt.Create
      });

      const result = await authRequest.promptAsync({
        authorizationEndpoint: `https://${config.domain}/authorize`
      });

      if (result.type === 'success') {
        const userInfo = await fetchUserInfo(result.params.access_token);
        const userData = {
          uid: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name
        };
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        router.replace('/(tabs)');
        return { success: true };
      } else {
        return { success: false, msg: 'Registration was cancelled' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, msg: 'An error occurred during registration' };
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserInfo = async accessToken => {
    const response = await fetch(`https://${config.domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return await response.json();
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      router.replace('/(auth)/welcome');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const contextValue = {
    user,
    setUser,
    login,
    register,
    logout,
    isLoading
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be wrapped inside AuthProvider');
  }

  return context;
};

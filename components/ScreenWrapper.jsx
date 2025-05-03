// components/ScreenWrapper.js
import { View, Text, Platform, Dimensions, StatusBar, TouchableOpacity } from 'react-native';
import React from 'react';
import { colors } from '../constants/theme';
import { ArrowLeft } from 'phosphor-react-native';
import { useRouter } from 'expo-router';

const { height } = Dimensions.get('window');

const ScreenWrapper = ({ style, children, showBackButton = false, backRoute = '../' }) => {
  const router = useRouter();
  let paddingTop = Platform.OS == 'ios' ? height * 0.06 : 0; // Reduced paddingTop to accommodate header

  return (
    <View
      style={[
        {
          paddingTop,
          flex: 1,
          backgroundColor: colors.white // Using the white from our updated colors
        },
        style
      ]}
    >
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={colors.primary} // Make status bar match Starbucks green
      />

      {showBackButton && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: paddingTop + 10,
            left: 15,
            zIndex: 100,
            backgroundColor: colors.primary,
            borderRadius: 20,
            padding: 8
          }}
          onPress={() => router.push(backRoute)}
        >
          <ArrowLeft size={24} color={colors.white} weight='bold' />
        </TouchableOpacity>
      )}

      {children}
    </View>
  );
};

export default ScreenWrapper;

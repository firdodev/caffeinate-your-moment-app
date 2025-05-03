// components/ScreenWrapper.js
import { View, Text, Platform, Dimensions, StatusBar } from 'react-native';
import React from 'react';
import { colors } from '../constants/theme';

const { height } = Dimensions.get('window');

const ScreenWrapper = ({ style, children }) => {
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
      {children}
    </View>
  );
};

export default ScreenWrapper;

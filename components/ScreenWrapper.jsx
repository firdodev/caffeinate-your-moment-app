import { View, Text, Platform, Dimensions, StatusBar } from 'react-native';
import React from 'react';
import { colors } from '../constants/theme';

const { height } = Dimensions.get('window');

const ScreenWrapper = ({ style, children }) => {
  let paddingTop = Platform.OS == 'ios' ? height * 0.06 : 50;
  return (
    <View
      style={[
        {
          paddingTop,
          flex: 1,
          backgroundColor: colors.neutral900
        },
        style
      ]}
    >
      <StatusBar barStyle={'light-content'} />
      {children}
    </View>
  );
};

export default ScreenWrapper;

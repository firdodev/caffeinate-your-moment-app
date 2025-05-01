import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import { colors, radius } from '../constants/theme';
import { verticalScale } from '../utils/styling';
import Loading from './Loading';

const Button = ({ style, onPress, loading = false, children }) => {
  if (loading) {
    return (
      <View style={[styles.button, style, { backgroundColor: 'transparent' }]}>
        <Loading />
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius._17,
    borderCurve: 'continuous',
    height: verticalScale(52),
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default Button;

// constants/theme.js
import { scale, verticalScale } from '../utils/styling';

export const colors = {
  // Updated to Starbucks colors
  primary: '#006241', // Starbucks primary green
  primaryLight: '#1E3932', // Starbucks dark green
  primaryDark: '#00482F', // Darker shade of Starbucks green
  secondaryGreen: '#0D8F6F', // Medium green
  accent: '#D4E9E2', // Light mint green
  lightGreen: '#e7f2ee',
  gold: '#CBA258', // Starbucks gold
  text: '#1E3932', // Dark green for most text
  textLight: '#ffffff', // White text
  textLighter: '#f5f5f5', // Off-white text
  white: '#ffffff',
  black: '#000000',
  rose: '#ef4444',
  green: '#006241', // Using Starbucks green as the green color
  neutral50: '#fafafa',
  neutral100: '#f5f5f5',
  neutral200: '#e5e5e5',
  neutral300: '#d4d4d4',
  neutral350: '#CCCCCC',
  neutral400: '#a3a3a3',
  neutral500: '#737373',
  neutral600: '#525252',
  neutral700: '#404040',
  neutral800: '#262626',
  neutral900: '#171717'
};

export const spacingX = {
  _3: scale(3),
  _5: scale(5),
  _7: scale(7),
  _10: scale(10),
  _12: scale(12),
  _15: scale(15),
  _20: scale(20),
  _25: scale(25),
  _30: scale(30),
  _35: scale(35),
  _40: scale(40)
};

export const spacingY = {
  _3: verticalScale(3),
  _5: verticalScale(5),
  _7: verticalScale(7),
  _10: verticalScale(10),
  _12: verticalScale(12),
  _15: verticalScale(15),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _25: verticalScale(25),
  _30: verticalScale(30),
  _35: verticalScale(35),
  _40: verticalScale(40),
  _50: verticalScale(50),
  _60: verticalScale(60)
};

export const radius = {
  _3: verticalScale(3),
  _6: verticalScale(6),
  _10: verticalScale(10),
  _12: verticalScale(12),
  _15: verticalScale(15),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _30: verticalScale(30)
};

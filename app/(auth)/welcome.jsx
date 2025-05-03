// app/(main)/welcome.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, ImageBackground } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import ScreenWrapper from '../../components/ScreenWrapper';
import Typo from '../../components/Typo';
import Button from '../../components/Button';

import { colors, spacingX, spacingY, radius } from '../../constants/theme';
import { verticalScale } from '../../utils/styling';
import tw from 'twrnc';
const { width } = Dimensions.get('window');

const Welcome = () => {
  const router = useRouter();

  return (
    <ScreenWrapper /* ScreenWrapper keeps safe-area etc. */
      style={{ backgroundColor: 'transparent' }} // make sure it's see-through
    >
      <ImageBackground
        source={require('../../assets/images/backg.png')}
        style={styles.backgroundImage}
        resizeMode='cover'
      >
        {/* ===== HEADER ===== */}
        <View style={styles.headerContainer}>
          <View style={styles.headerBg}>
            <View
              style={{
                position: 'absolute',
                width: '100%',
                height: 120,
                backgroundColor: colors.primary,
                top: -120
              }}
            />
            <Svg height={120} width={width} viewBox='0 0 1440 402'>
              <Path
                fill={colors.primary}
                d='M0,288L48,272C96,256,192,224,288,208C384,192,480,192,576,202.7C672,213,768,235,864,218.7C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192V0H0Z'
              />
            </Svg>
          </View>

          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
              <Typo color={colors.white} fontWeight={600}>
                Sign in
              </Typo>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== LOGO ===== */}
        <View style={styles.logoContainer}>
          <Animated.Image
            entering={FadeIn.duration(1000)}
            source={require('../../assets/images/coffees-port.png')}
            style={styles.logo}
            resizeMode='contain'
          />
        </View>

        {/* ===== FOOTER ===== */}
        <View style={styles.footer}>
          <Animated.View entering={FadeInDown.duration(1000).springify().damping(12)} style={{ alignItems: 'center' }}>
            <Typo size={30} fontWeight={800} color={colors.black}>
              Your daily brew,
            </Typo>
            <Typo size={30} fontWeight={800} color={colors.black}>
              reimagined
            </Typo>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(1000).delay(100).springify().damping(12)}
            style={{ alignItems: 'center', gap: 2 }}
          >
            <Typo size={17} color={colors.black}>
              Order coffee, earn rewards, send gift cards,
            </Typo>
            <Typo size={17} color={colors.black}>
              and experience coffee in AR.
            </Typo>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(1000).delay(200).springify().damping(12)}
            style={styles.buttonContainer}
          >
            <Button onPress={() => router.push('/register')} style={tw`bg-white`}>
              <Typo color={colors.black} size={22} fontWeight={600}>
                Get Started
              </Typo>
            </Button>
          </Animated.View>
        </View>
      </ImageBackground>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1 // must fill the wrapper
  },
  container: {
    flex: 1,
    justifyContent: 'space-between'
  },
  headerContainer: {
    height: 120,
    zIndex: 10
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0
  },
  headerContent: {
    paddingTop: spacingY._10,
    paddingHorizontal: spacingX._20,
    alignItems: 'flex-end',
    zIndex: 2
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: {
    width: 500,
    height: 500
  },
  loginButton: {
    marginRight: spacingX._5,
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._8,
    borderRadius: radius._10
  },
  footer: {
    alignItems: 'center',
    paddingTop: verticalScale(30),
    paddingBottom: verticalScale(45),
    gap: spacingY._20,
    shadowColor: 'white',
    shadowOffset: { width: 0, height: -10 },
    elevation: 10,
    shadowRadius: 25,
    shadowOpacity: 0.15
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: spacingX._25
  }
});

export default Welcome;

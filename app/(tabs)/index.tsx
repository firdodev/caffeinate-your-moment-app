// app/(main)/home.tsx

import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { radius, spacingX, spacingY, colors } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import SearchInput from '@/components/SearchInput';
import { Bell, BookmarkSimple, HandWaving } from 'phosphor-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';

const Home: React.FC = () => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    const id = setInterval(() => {
      rotation.value = withSequence(
        withTiming(-20, { duration: 200 }),
        withTiming(20, { duration: 200 }),
        withTiming(0, { duration: 200 })
      );
    }, 3000);
    return () => clearInterval(id);
  }, [rotation]);

  const handStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Typo size={30}>Welcome Back,</Typo>
            <View style={styles.userRow}>
              <Typo size={20}>User</Typo>
              <Animated.View style={handStyle}>
                <HandWaving size={verticalScale(24)} color={colors.primary} weight='duotone' />
              </Animated.View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Bell size={verticalScale(24)} color={colors.text} weight='regular' style={styles.icon} />
            <BookmarkSimple size={verticalScale(24)} color={colors.text} weight='regular' style={styles.icon} />
            <Image
              source={require('@/assets/images/ProfilePlaceholder.png')}
              style={styles.profileImage}
              resizeMode='contain'
            />
          </View>
        </View>

        {/* Search Input */}
        <SearchInput />

        {/* Main Content */}
        <View style={styles.content}>{/* ... */}</View>
      </View>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._20,
    paddingHorizontal: spacingX._20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    flex: 1
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._5
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    marginHorizontal: spacingX._7
  },
  profileImage: {
    width: verticalScale(40),
    height: verticalScale(40),
    borderRadius: radius._20
  },
  content: {
    flex: 1
  }
});

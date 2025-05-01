// @/components/CustomTabs.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Text, Platform, LayoutChangeEvent } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue,
  withTiming,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  Extrapolate
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, Briefcase, CalendarBlank, ChatText, GearSix } from 'phosphor-react-native';
import { colors, spacingX, spacingY, radius } from '../constants/theme';

/* -------------------------------------------------- */
/* ――― Icon map ► add / change routes here ――― */
const TAB_ICONS = {
  index: House,
  Jobs: Briefcase,
  Events: CalendarBlank,
  Community: ChatText,
  Settings: GearSix
};
/* -------------------------------------------------- */

// ICON SIZE CONFIGURATION
const ICON_SIZE = {
  ACTIVE: 36, // Increased from 30 to 36
  INACTIVE: 32 // Increased from 26 to 32
};

const CustomTabs = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const [expandedIndex, setExpandedIndex] = useState < number > state.index;

  // Track when focused tab changes to animate properly
  useEffect(() => {
    setExpandedIndex(state.index);
  }, [state.index]);

  return (
    <View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, spacingY._10)
        }
      ]}
    >
      <View style={styles.wrapper}>
        {state.routes.map((route, idx) => {
          const isFocused = state.index === idx;
          const { options } = descriptors[route.key];

          /* ---------- label & icon ---------- */
          let label = options.tabBarLabel ?? options.title ?? route.name;
          if (route.name === 'index') label = 'Home';
          const Icon = TAB_ICONS[route.name] ?? House;

          return (
            <TabItem
              key={route.key}
              label={label}
              Icon={Icon}
              isFocused={isFocused}
              isExpanded={expandedIndex === idx}
              totalTabs={state.routes.length}
              index={idx}
              onPress={() => {
                const ev = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true
                });
                if (!isFocused && !ev.defaultPrevented) navigation.navigate(route.name);
              }}
              onLongPress={() =>
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key
                })
              }
            />
          );
        })}
      </View>
    </View>
  );
};

/* ────────────────────────────────────────────── */
/*  Single tab button  */
/* ────────────────────────────────────────────── */

const TabItem = ({ label, Icon, isFocused, isExpanded, totalTabs, index, onPress, onLongPress }) => {
  const progress = useSharedValue(isFocused ? 1 : 0);
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    progress.value = withTiming(isFocused ? 1 : 0, { duration: 300 });
  }, [isFocused]);

  // Get text measurement for dynamic sizing
  const onTextLayout = e => {
    if (e.nativeEvent.layout.width > 0) {
      setTextWidth(e.nativeEvent.layout.width);
    }
  };

  /* --- animated container --- */
  const containerStyle = useAnimatedStyle(() => {
    // Calculate minimum width for icon-only, and expanded width for icon + text
    const baseIconWidth = 56; // Increased base width for larger icons
    const expandedWidth = baseIconWidth + textWidth + spacingX._20;

    return {
      flex: interpolate(progress.value, [0, 1], [1, (expandedWidth / baseIconWidth) * 1.2]),
      // Scale the container a bit to make room for expanded items
      transform: [{ scale: interpolate(progress.value, [0, 1], [0.95, 1]) }]
    };
  });

  /* --- animated pill --- */
  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['transparent', colors.neutral800]),
    paddingHorizontal: interpolate(progress.value, [0, 1], [spacingX._10, spacingX._15]),
    // Dynamic width based on text content
    width: progress.value === 1 ? 'auto' : 56 // Increased for larger icons
  }));

  /* --- animated text --- */
  const labelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-6, 0], Extrapolate.CLAMP) }]
  }));

  // Animated icon size
  const iconSizeStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(
            progress.value,
            [0, 1],
            [1, 1.1] // Additional scale effect for active icons
          )
        }
      ]
    };
  });

  return (
    <Animated.View style={[styles.tabContainer, containerStyle]}>
      <Pressable onPress={onPress} onLongPress={onLongPress} style={styles.pressable}>
        <Animated.View style={[styles.pill, pillStyle]}>
          {/* Wrap Icon in Animated.View for additional animations */}
          <Animated.View style={iconSizeStyle}>
            <Icon
              size={isFocused ? ICON_SIZE.ACTIVE : ICON_SIZE.INACTIVE}
              weight={isFocused ? 'fill' : 'regular'}
              color={isFocused ? colors.primary : colors.neutral400}
            />
          </Animated.View>

          <Animated.View style={[styles.labelContainer, labelStyle]}>
            <Text style={styles.label} numberOfLines={1} onLayout={onTextLayout}>
              {label}
            </Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

/* ────────────────────────────────────────────── */
/*  Styles  */
/* ────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacingX._20,
    right: spacingX._20,
    alignItems: 'center'
  },
  wrapper: {
    flexDirection: 'row',
    backgroundColor: colors.neutral900,
    borderRadius: radius._30,
    paddingVertical: spacingY._10, // Increased vertical padding for larger icons
    paddingHorizontal: spacingX._10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center', // Center alignment instead of space-around
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8
      }
    })
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: spacingY._3 // Additional padding for touch target
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius._20,
    paddingVertical: spacingY._5, // Increased for larger icons
    // Ensure minimum width for icon
    minWidth: 56, // Increased to accommodate larger icons
    minHeight: 56 // Added to ensure proper height
  },
  labelContainer: {
    marginLeft: spacingX._10, // Increased margin for better spacing with larger icons
    flexShrink: 1
  },
  label: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20
  }
});

export default CustomTabs;

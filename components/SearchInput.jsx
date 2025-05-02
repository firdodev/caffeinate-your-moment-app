import { StyleSheet, View, TouchableOpacity, Modal, TextInput, Keyboard } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import { colors, radius, spacingX, spacingY } from '../constants/theme';
import { verticalScale } from '../utils/styling';
import Typo from '../components/Typo';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS
} from 'react-native-reanimated';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const FINAL_CIRCLE_SIZE = Math.max(width, height) * 2;

const SearchInput = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });
  const [shouldFocusInput, setShouldFocusInput] = useState(false);
  const inputRef = useRef(null);

  // Reanimated shared values
  const animationProgress = useSharedValue(0);

  // Focus the input when needed
  useEffect(() => {
    if (shouldFocusInput && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [shouldFocusInput]);

  const focusInput = () => {
    setShouldFocusInput(true);
  };

  const resetFocusState = () => {
    setShouldFocusInput(false);
  };

  const handleOpenModal = event => {
    // Get touch coordinates
    const { pageX, pageY } = event.nativeEvent;
    setTouchPosition({ x: pageX, y: pageY });

    // Open modal
    setModalVisible(true);
    resetFocusState();

    // Start animation
    animationProgress.value = 0;
    animationProgress.value = withTiming(1, { duration: 300 }, finished => {
      if (finished) {
        runOnJS(focusInput)();
      }
    });
  };

  const completeModalClose = () => {
    setModalVisible(false);
    setSearchText('');
  };

  const handleCloseModal = () => {
    // Dismiss keyboard first
    Keyboard.dismiss();
    resetFocusState();

    // Reverse animation
    animationProgress.value = withTiming(0, { duration: 300 }, finished => {
      if (finished) {
        runOnJS(completeModalClose)();
      }
    });
  };

  // Circle animated style
  const circleStyle = useAnimatedStyle(() => {
    const scale = animationProgress.value;

    return {
      transform: [{ scale }],
      opacity: 1
    };
  });

  // Content animated style
  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animationProgress.value, [0, 0.5, 1], [0, 0, 1], Extrapolate.CLAMP)
    };
  });

  return (
    <>
      {/* Search Button */}
      <TouchableOpacity style={styles.searchButton} onPress={handleOpenModal} activeOpacity={0.7}>
        <Ionicons name='search' size={verticalScale(20)} color={colors.neutral400} />
        <Typo style={styles.searchButtonText} color={colors.neutral400}>
          Search
        </Typo>
      </TouchableOpacity>

      {/* Search Modal */}
      {modalVisible && (
        <Modal transparent visible={true} animationType='none' onRequestClose={handleCloseModal} statusBarTranslucent>
          <View style={styles.modalContainer}>
            {/* Animated Circle */}
            <Animated.View
              style={[
                styles.animatedCircle,
                circleStyle,
                {
                  left: touchPosition.x - FINAL_CIRCLE_SIZE / 2,
                  top: touchPosition.y - FINAL_CIRCLE_SIZE / 2,
                  width: FINAL_CIRCLE_SIZE,
                  height: FINAL_CIRCLE_SIZE
                }
              ]}
            />

            {/* Search Content */}
            <Animated.View style={[styles.searchContent, contentStyle]}>
              <View style={styles.searchBar}>
                <Ionicons name='search' size={verticalScale(20)} color={colors.white} />
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder='Search'
                  placeholderTextColor={colors.neutral400}
                  value={searchText}
                  onChangeText={setSearchText}
                />
                <TouchableOpacity onPress={handleCloseModal}>
                  <Ionicons name='close' size={verticalScale(22)} color={colors.white} />
                </TouchableOpacity>
              </View>

              {/* Search Results Area */}
              <View style={styles.resultsContainer}>
                {/* Results will go here */}
                {searchText ? (
                  <Typo style={styles.resultsText}>Showing results for "{searchText}"</Typo>
                ) : (
                  <Typo style={styles.emptyText}>Type to search</Typo>
                )}
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  searchButton: {
    flexDirection: 'row',
    height: verticalScale(50),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: radius._17,
    borderCurve: 'continuous',
    paddingHorizontal: spacingX._15,
    gap: spacingX._10,
    marginTop: spacingY._20
  },
  searchButtonText: {
    fontSize: verticalScale(14)
  },
  modalContainer: {
    flex: 1
  },
  animatedCircle: {
    position: 'absolute',
    backgroundColor: colors.neutral800,
    borderRadius: FINAL_CIRCLE_SIZE / 2
  },
  searchContent: {
    flex: 1,
    padding: spacingX._20,
    paddingTop: spacingY._50
  },
  searchBar: {
    flexDirection: 'row',
    height: verticalScale(54),
    backgroundColor: colors.neutral700,
    alignItems: 'center',
    borderRadius: radius._17,
    borderCurve: 'continuous',
    paddingHorizontal: spacingX._15,
    gap: spacingX._10
  },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: verticalScale(14)
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacingY._20
  },
  resultsText: {
    fontSize: verticalScale(16),
    textAlign: 'center'
  },
  emptyText: {
    fontSize: verticalScale(16),
    color: colors.neutral400,
    textAlign: 'center'
  }
});

export default SearchInput;

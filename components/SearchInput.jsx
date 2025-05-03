import { StyleSheet, View, TouchableOpacity, Modal, TextInput, Keyboard, FlatList, Image } from 'react-native';
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
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { addToCart, showAddToCartNotification } from '../utils/cartUtils';

const { width, height } = Dimensions.get('window');
const FINAL_CIRCLE_SIZE = Math.max(width, height) * 2;

const SearchInput = ({ placeholder = 'Search here...' }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });
  const [shouldFocusInput, setShouldFocusInput] = useState(false);
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const inputRef = useRef(null);

  // Reanimated shared values
  const animationProgress = useSharedValue(0);

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const items = [];
        querySnapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        setProducts(items);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

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
    const { pageX, pageY } = event.nativeEvent;
    setTouchPosition({ x: pageX, y: pageY });
    setModalVisible(true);
    resetFocusState();
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
    Keyboard.dismiss();
    resetFocusState();
    animationProgress.value = withTiming(0, { duration: 300 }, finished => {
      if (finished) {
        runOnJS(completeModalClose)();
      }
    });
  };

  const handleQuantity = (id, delta) => {
    setQuantities(q => ({ ...q, [id]: Math.max(1, (q[id] || 1) + delta) }));
  };

  const handleAddToOrder = async item => {
    const quantity = quantities[item.id] || 1;
    try {
      const result = await addToCart(item, quantity);
      if (result.success) {
        showAddToCartNotification(item, quantity);
        setQuantities(q => ({ ...q, [item.id]: 1 }));
      } else {
        alert('Failed to add item to cart. Please try again.');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const filteredProducts = products.filter(item => item.name.toLowerCase().includes(searchText.toLowerCase()));

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productImageWrapper}>
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      </View>
      <Typo style={styles.productName}>{item.name}</Typo>
      <Typo style={styles.productPrice}>${item.price?.toFixed(2)}</Typo>
      <TouchableOpacity style={styles.addButton} onPress={() => handleAddToOrder(item)}>
        <Ionicons name='add' size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

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
      <TouchableOpacity style={styles.searchButton} onPress={handleOpenModal} activeOpacity={0.7}>
        <Ionicons name='search' size={verticalScale(20)} color={colors.secondaryGreen} />
        <Typo style={styles.searchButtonText} color={colors.neutral400}>
          {placeholder}
        </Typo>
      </TouchableOpacity>

      {modalVisible && (
        <Modal transparent visible={true} animationType='none' onRequestClose={handleCloseModal} statusBarTranslucent>
          <View style={styles.modalContainer}>
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

            <Animated.View style={[styles.searchContent, contentStyle]}>
              <View style={styles.searchBar}>
                <Ionicons name='search' size={verticalScale(20)} color={colors.secondaryGreen} />
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder='Search products...'
                  placeholderTextColor={colors.neutral400}
                  value={searchText}
                  onChangeText={setSearchText}
                />
                <TouchableOpacity onPress={handleCloseModal}>
                  <Ionicons name='close' size={verticalScale(22)} color={colors.secondaryGreen} />
                </TouchableOpacity>
              </View>

              <View style={styles.resultsContainer}>
                {searchText ? (
                  <FlatList
                    data={filteredProducts}
                    renderItem={renderProduct}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.productsList}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <Typo style={styles.emptyText}>Type to search products</Typo>
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
    borderColor: colors.lightGreen,
    borderRadius: radius._17,
    borderCurve: 'continuous',
    paddingHorizontal: spacingX._15,
    gap: spacingX._10,
    marginTop: spacingY._20,
    backgroundColor: colors.lightGreen
  },
  searchButtonText: {
    fontSize: verticalScale(14)
  },
  modalContainer: {
    flex: 1
  },
  animatedCircle: {
    position: 'absolute',
    backgroundColor: colors.primaryDark,
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
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    borderRadius: radius._17,
    borderCurve: 'continuous',
    paddingHorizontal: spacingX._15,
    gap: spacingX._10
  },
  input: {
    flex: 1,
    color: colors.black,
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
    textAlign: 'center',
    color: colors.white
  },
  emptyText: {
    fontSize: verticalScale(16),
    color: colors.white,
    textAlign: 'center'
  },
  productsList: {
    paddingBottom: spacingY._20,
    paddingHorizontal: spacingX._10
  },
  productCard: {
    backgroundColor: colors.lightGreen,
    borderRadius: 30,
    borderEndStartRadius: 80,
    borderEndEndRadius: 80,
    padding: 16,
    width: width / 2 - 30,
    alignItems: 'center',
    marginTop: 50,
    height: 180,
    marginHorizontal: spacingX._5
  },
  productImageWrapper: {
    position: 'absolute',
    top: -50,
    zIndex: 2,
    alignItems: 'center',
    width: '100%'
  },
  productImage: {
    width: 100,
    height: 100,
    padding: 0,
    margin: 0,
    marginBottom: 8,
    transform: [{ rotateZ: '-9deg' }]
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.black,
    marginBottom: 4,
    marginTop: 50,
    textAlign: 'center'
  },
  productPrice: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 20
  },
  addButton: {
    backgroundColor: colors.black,
    padding: 8,
    borderRadius: 12,
    marginTop: 8
  }
});

export default SearchInput;

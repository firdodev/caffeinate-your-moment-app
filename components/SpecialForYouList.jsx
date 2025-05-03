/**
 * SpecialForYouList.jsx
 *
 *  ▸ keeps your big 150-px primary circle exactly the same
 *  ▸ puts 5 things inside it, all on the left/bottom quadrant:
 *        • arrow icon at 210°
 *        • plain circle at 240°
 *        • arrow-in-ring UI at 270°
 *        • NEW circle 30° before 210 → 180°
 *        • NEW circle 30° after 270 → 300°
 *
 *  ◂ icons are from phosphor-react-native
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Image, TouchableOpacity, Text, Animated, Easing, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { colors } from '../constants/theme';
import { ArrowLeft, ArrowRight } from 'phosphor-react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import Trapezium from './Trapezium';
import { addToCart, showAddToCartNotification } from '../utils/cartUtils';

const SpecialForYouList = () => {
  const RING_SIZE = 90; // ⌀ of the "orbit" ring for the right arrow
  const DOT_SIZE = 90; // ⌀ of the small solid circles
  const ICON_SIZE = 24; // size of both arrow icons
  const INNER_FACTOR = 0.8;
  const IMAGE_SIZE = 110; // Size for product images
  const ACTIVE_INDICATOR_SIZE = DOT_SIZE + 16; // Size for active product indicator

  const [products, setProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [layout, setLayout] = useState(null); // { width, height }
  const [isLoading, setIsLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const activeIndicatorAnim = useRef(new Animated.Value(1)).current;

  // Preload images
  const imageCache = useRef({}).current;

  // Fetch products from Firebase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const querySnapshot = await getDocs(collection(db, 'products'));
        const items = [];
        querySnapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setProducts(items);

        // Preload first set of images
        if (items.length > 0) {
          preloadImages(items.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Animate active indicator on mount and after transitions
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(activeIndicatorAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease)
        }),
        Animated.timing(activeIndicatorAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease)
        })
      ])
    ).start();
  }, []);

  // Preload images function
  const preloadImages = productsToPreload => {
    productsToPreload.forEach(product => {
      if (product?.imageUrl && !imageCache[product.imageUrl]) {
        Image.prefetch(product.imageUrl)
          .then(() => {
            imageCache[product.imageUrl] = true;
          })
          .catch(err => {
            console.error('Error preloading image:', err);
          });
      }
    });
  };

  // Animation sequence for navigation
  const animateNavigation = (direction, callback) => {
    setNavigating(true);

    // Determine new index
    const newIndex =
      direction === 'next'
        ? currentIndex === products.length - 1
          ? 0
          : currentIndex + 1
        : currentIndex === 0
        ? products.length - 1
        : currentIndex - 1;

    // Preload images for new view
    const preloadIndices = [0, 1, 2].map(i => (newIndex + i) % products.length);
    preloadImages(preloadIndices.map(idx => products[idx]));

    // Run animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }),
      Animated.timing(rotateAnim, {
        toValue: direction === 'next' ? 1 : -1,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      })
    ]).start(() => {
      // Update state after animation out
      callback(newIndex);

      // Animate back in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease)
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease)
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease)
        })
      ]).start(() => {
        setNavigating(false);
      });
    });
  };

  // Handle navigation
  const handlePrevious = () => {
    if (products.length > 0 && !navigating && !isLoading) {
      animateNavigation('prev', newIndex => setCurrentIndex(newIndex));
    }
  };

  const handleNext = () => {
    if (products.length > 0 && !navigating && !isLoading) {
      animateNavigation('next', newIndex => setCurrentIndex(newIndex));
    }
  };

  // Get the products to display in circles
  const getProductsForDisplay = () => {
    if (products.length === 0) return [];

    // Get 3 products starting from currentIndex
    const result = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % products.length;
      result.push(products[index]);
    }
    return result;
  };

  // Get active product (middle one)
  const getActiveProduct = () => {
    if (products.length === 0) return null;
    const displayProducts = getProductsForDisplay();
    return displayProducts.length > 1 ? displayProducts[1] : null;
  };

  //                  angle°     what we render there
  const items = [
    { angle: 190, type: 'arrowLeft' },
    { angle: 210, type: 'circle', index: 0 }, // left circle
    { angle: 240, type: 'circle', index: 1, isActive: true }, // middle circle (active)
    { angle: 270, type: 'circle', index: 2 }, // right circle
    { angle: 290, type: 'arrowRight' } // arrow right
  ];

  const renderCircleBackground = ({ left, top, size, isActive }) => {
    if (isActive) {
      return (
        <>
          {/* Active indicator ring with subtle animation */}
          <Animated.View
            style={[
              tw`absolute rounded-full border-2 border-[${colors.secondaryGreen}]`,
              {
                left: left - 8,
                top: top - 8,
                width: ACTIVE_INDICATOR_SIZE,
                height: ACTIVE_INDICATOR_SIZE,
                transform: [{ scale: activeIndicatorAnim }],
                opacity: 0.8
              }
            ]}
          />
          {/* Base circle */}
          <View
            style={[
              tw`absolute rounded-full`,
              {
                left,
                top,
                width: size,
                height: size,
                backgroundColor: colors.secondaryGreen
              }
            ]}
          />
        </>
      );
    }

    return (
      <View
        style={[
          tw`absolute rounded-full`,
          {
            left,
            top,
            width: size,
            height: size,
            backgroundColor: colors.secondaryGreen,
            opacity: 0.7 // Non-active circles are slightly transparent
          }
        ]}
      />
    );
  };

  const renderProductImage = (product, { left, top, isActive }) => {
    if (!product?.imageUrl) return null;

    return (
      <Animated.View
        style={[
          tw`absolute items-center justify-center`,
          {
            left: left, // Shift left to center the larger image
            top: top - 20, // Position image above the circle
            zIndex: isActive ? 20 : 10, // Active product is on top
            width: IMAGE_SIZE - 20,
            height: IMAGE_SIZE - 20,
            opacity: fadeAnim,
            transform: [
              {
                scale: isActive
                  ? scaleAnim.interpolate({
                      inputRange: [0.95, 1],
                      outputRange: [0.95, 1.05]
                    })
                  : scaleAnim
              },
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: ['8deg', '-15deg', '-38deg']
                })
              }
            ]
          }
        ]}
      >
        <Image
          source={{ uri: product.imageUrl }}
          style={{
            width: IMAGE_SIZE,
            height: IMAGE_SIZE
          }}
          resizeMode='contain'
        />
      </Animated.View>
    );
  };

  // Product info bar for the active product
  const renderProductInfoBar = () => {
    const activeProduct = getActiveProduct();
    if (!activeProduct) return null;
    return (
      <Animated.View
        style={[
          tw` absolute bg-[${colors.secondaryGreen}] px-4 py-2 rounded-lg top-[35] left-50 z-30`,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Text style={tw`text-white font-bold text-lg`}>{activeProduct.name}</Text>
        <Text style={tw`text-white font-medium`}>${activeProduct.price?.toFixed(2)}</Text>
      </Animated.View>
    );
  };

  const renderItem = ({ angle, type, index, isActive }, idx) => {
    const rad = (angle * Math.PI) / 180;
    const R = layout.width / 2; // radius of big circle
    const orbit = R * INNER_FACTOR;
    const center = { x: R, y: R };

    // choose footprint for each element
    const size = type === 'arrowRight' ? RING_SIZE : type === 'circle' ? DOT_SIZE : ICON_SIZE;
    const left = center.x + orbit * Math.cos(rad) - size / 2;
    const top = center.y + orbit * Math.sin(rad) - size / 2;

    const displayProducts = getProductsForDisplay();

    switch (type) {
      case 'arrowLeft':
        return (
          <TouchableOpacity key={idx} onPress={handlePrevious} activeOpacity={0.7} disabled={navigating || isLoading}>
            <Animated.View
              style={{
                opacity: navigating ? 0.5 : 1,
                transform: [{ scale: navigating ? 0.95 : 1 }]
              }}
            >
              <ArrowLeft
                size={ICON_SIZE}
                weight='bold'
                color={colors.secondaryGreen}
                style={[tw`absolute`, { left, top }, { transform: [{ rotate: '-70deg' }] }]}
              />
            </Animated.View>
          </TouchableOpacity>
        );

      case 'arrowRight':
        return (
          <TouchableOpacity
            key={idx}
            onPress={handleNext}
            activeOpacity={0.7}
            disabled={navigating || isLoading}
            style={[
              tw`absolute items-center justify-center`,
              {
                left,
                top,
                width: RING_SIZE,
                height: RING_SIZE,
                transform: [{ rotate: '20deg' }]
              }
            ]}
          >
            <Animated.View
              style={{
                opacity: navigating ? 0.5 : 1,
                transform: [{ scale: navigating ? 0.95 : 1 }]
              }}
            >
              <ArrowRight size={ICON_SIZE} weight='bold' color={colors.secondaryGreen} />
            </Animated.View>
          </TouchableOpacity>
        );

      default: // circle with product image
        const product = displayProducts.length > index ? displayProducts[index] : null;
        return (
          <View key={idx}>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }}
            >
              {renderCircleBackground({ left, top, size, isActive })}
            </Animated.View>
            {product && renderProductImage(product, { left, top, isActive })}
          </View>
        );
    }
  };

  // Quantity control handlers
  const handleDecrease = () => {
    setQuantity(q => (q > 1 ? q - 1 : 1));
  };

  const handleIncrease = () => {
    setQuantity(q => q + 1);
  };

  const handleAddToOrder = async () => {
    const activeProduct = getActiveProduct();
    if (!activeProduct) return;

    try {
      const result = await addToCart(activeProduct, quantity);
      if (result.success) {
        showAddToCartNotification(activeProduct, quantity);
        // Reset quantity after adding to cart
        setQuantity(1);
      } else {
        alert('Failed to add item to cart. Please try again.');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <View
      style={[tw`relative bg-[${colors.primary}] w-150 h-150 rounded-full left-[-6.5]`]}
      onLayout={e => setLayout(e.nativeEvent.layout)}
    >
      {isLoading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size='large' color={colors.secondaryGreen} />
        </View>
      ) : (
        <>
          {layout && items.map(renderItem)}
          {renderProductInfoBar()}
        </>
      )}

      <View style={tw`w-full flex items-center justify-center h-full`}>
        <View style={[tw`items-center justify-center`, { position: 'relative', minHeight: 50 }]}>
          <Trapezium styles={tw`z-30 top-[-2]`} color='white' width={30} height={7} radius={5} />
          {/* Quantity control centered in Trapezium */}
          <View
            style={[tw`absolute left-[-18] top-[-1] bottom-0 items-center justify-center`, { height: 40, zIndex: 40 }]}
          >
            <View style={tw`flex-row items-center rounded-full px-3 py-1`}>
              <TouchableOpacity onPress={handleDecrease} style={tw`px-2`}>
                <Text style={tw`text-2xl font-bold text-[${colors.secondaryGreen}]`}>-</Text>
              </TouchableOpacity>
              <Text style={tw`text-xl font-bold text-[${colors.secondaryGreen}] mx-2`}>{quantity}</Text>
              <TouchableOpacity onPress={handleIncrease} style={tw`px-2`}>
                <Text style={tw`text-2xl font-bold text-[${colors.secondaryGreen}]`}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={handleAddToOrder}>
          <Trapezium />
          <Text style={tw`text-white font-bold text-xl top-[-24] left-[-8]`}>Add to order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SpecialForYouList;

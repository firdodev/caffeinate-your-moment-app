import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { router } from 'expo-router';

const CART_STORAGE_KEY = '@art_coffee_cart';

/**
 * Get the current cart from storage
 * @returns {Promise<Array>} Array of cart items
 */
export const getCart = async () => {
  try {
    const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
    return storedCart ? JSON.parse(storedCart) : [];
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    return [];
  }
};

/**
 * Save the cart to storage
 * @param {Array} cart Array of cart items
 * @returns {Promise<boolean>} Success status
 */
export const saveCart = async cart => {
  try {
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    return true;
  } catch (error) {
    console.error('Error saving cart to storage:', error);
    return false;
  }
};

/**
 * Add an item to the cart
 * @param {Object} product Product to add
 * @param {number} quantity Quantity to add
 * @returns {Promise<Object>} Updated cart and success status
 */
export const addToCart = async (product, quantity = 1) => {
  try {
    const currentCart = await getCart();

    // Check if product already exists in cart
    const existingItemIndex = currentCart.findIndex(item => item.id === product.id);

    let updatedCart;
    if (existingItemIndex > -1) {
      // Update quantity of existing item
      updatedCart = currentCart.map((item, index) => {
        if (index === existingItemIndex) {
          return { ...item, quantity: item.quantity + quantity };
        }
        return item;
      });
    } else {
      // Add new item with quantity
      updatedCart = [...currentCart, { ...product, quantity }];
    }

    const success = await saveCart(updatedCart);

    return {
      success,
      cart: updatedCart,
      message: `Added ${quantity} ${product.name} to cart`
    };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return { success: false, cart: await getCart(), message: 'Failed to add to cart' };
  }
};

/**
 * Update quantity of an item in the cart
 * @param {string} id Product ID
 * @param {number} delta Change in quantity (positive or negative)
 * @returns {Promise<Object>} Updated cart and success status
 */
export const updateQuantity = async (id, delta) => {
  try {
    const currentCart = await getCart();

    // Find item and update quantity, ensuring minimum of 1
    const updatedCart = currentCart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });

    const success = await saveCart(updatedCart);

    return { success, cart: updatedCart };
  } catch (error) {
    console.error('Error updating cart quantity:', error);
    return { success: false, cart: await getCart() };
  }
};

/**
 * Remove an item from the cart
 * @param {string} id Product ID
 * @returns {Promise<Object>} Updated cart and success status
 */
export const removeFromCart = async id => {
  try {
    const currentCart = await getCart();
    const updatedCart = currentCart.filter(item => item.id !== id);

    const success = await saveCart(updatedCart);

    return { success, cart: updatedCart };
  } catch (error) {
    console.error('Error removing from cart:', error);
    return { success: false, cart: await getCart() };
  }
};

/**
 * Clear all items from the cart
 * @returns {Promise<boolean>} Success status
 */
export const clearCart = async () => {
  try {
    await AsyncStorage.removeItem(CART_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
};

/**
 * Calculate the total price of items in the cart
 * @param {Array} cart Array of cart items
 * @returns {number} Total price
 */
export const calculateTotal = cart => {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

/**
 * Display a notification when adding to cart
 * @param {Object} product Product that was added
 * @param {number} quantity Quantity added
 */
export const showAddToCartNotification = (product, quantity) => {
  Alert.alert('Added to Cart', `${quantity} × ${product.name} added to your cart.`, [
    { text: 'Continue Shopping', style: 'cancel' },
    { text: 'View Cart', onPress: () => navigateToCart() }
  ]);
};

/**
 * Navigate to the cart using Expo Router
 */
export const navigateToCart = () => {
  router.push('/Cart');
};

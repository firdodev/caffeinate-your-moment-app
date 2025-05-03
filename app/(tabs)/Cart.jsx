import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Alert,
  TextInput,
  ScrollView
} from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from 'twrnc';
import {
  ShoppingCartSimple,
  Plus,
  Minus,
  TrashSimple,
  Bank,
  ArrowRight,
  Money,
  Receipt,
  ShoppingBag,
  Wallet,
  CreditCard
} from 'phosphor-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import Typo from '../../components/Typo';
import { colors, spacingX, spacingY, radius } from '../../constants/theme';
import Trapezium from '../../components/Trapezium';
import { getCart, updateQuantity, removeFromCart, calculateTotal } from '../../utils/cartUtils';
import { collection, getDocs, addDoc, doc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getAuth } from 'firebase/auth';
import { getUserBalance, updateUserBalance } from '../../utils/giftCardUtils';
import { getSavedCards } from '../../utils/cardUtils';
import { useBalance } from '../../utils/balanceContext';
import { checkInUserWithOrder } from '../../utils/loyaltyUtils';

const { width } = Dimensions.get('window');

const Cart = () => {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCardPayment, setShowCardPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [orderType, setOrderType] = useState('pickup');
  const [deliveryLocation, setDeliveryLocation] = useState({
    address: '',
    city: ''
  });
  const auth = getAuth();
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  const checkoutHeight = useSharedValue(0);
  const checkoutOpacity = useSharedValue(0);
  const cardPaymentHeight = useSharedValue(0);
  const cardPaymentOpacity = useSharedValue(0);
  const cartScale = useSharedValue(1);
  const cartOpacity = useSharedValue(1);

  const { balance, refreshBalance } = useBalance();

  useEffect(() => {
    const loadCart = async () => {
      try {
        const cart = await getCart();
        setCartItems(cart);
      } catch (error) {
        console.error('Error loading cart from storage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
    const interval = setInterval(loadCart, 1000); // Check for updates every second

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Load saved cards when component mounts
    const loadSavedCards = async () => {
      try {
        if (auth.currentUser) {
          const cards = await getSavedCards();
          setSavedCards(cards);
        }
      } catch (error) {
        console.error('Error loading saved cards:', error);
      }
    };

    loadSavedCards();
  }, [auth.currentUser]);

  const handleUpdateQuantity = async (id, delta) => {
    try {
      const result = await updateQuantity(id, delta);
      if (result.success) {
        setCartItems(result.cart);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoveItem = async id => {
    try {
      const result = await removeFromCart(id);
      if (result.success) {
        setCartItems(result.cart);
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checking out.');
      return;
    }

    // Animate checkout panel
    checkoutHeight.value = withSpring(500, { damping: 12, stiffness: 90 });
    checkoutOpacity.value = withTiming(1, { duration: 300 });
    cartScale.value = withTiming(0.95, { duration: 300 });
    cartOpacity.value = withTiming(0.7, { duration: 300 });
    setShowCheckout(true);
  };

  const closeCheckout = () => {
    checkoutHeight.value = withSpring(0);
    checkoutOpacity.value = withTiming(0);
    cardPaymentHeight.value = withSpring(0);
    cardPaymentOpacity.value = withTiming(0);
    cartScale.value = withTiming(1);
    cartOpacity.value = withTiming(1);
    setShowCheckout(false);
    setShowCardPayment(false);
    setPaymentMethod(null);
    setOrderType('pickup');
  };

  const openCardPayment = () => {
    cardPaymentHeight.value = withSpring(400, { damping: 12, stiffness: 90 });
    cardPaymentOpacity.value = withTiming(1, { duration: 300 });
  };

  const closeCardPayment = () => {
    cardPaymentHeight.value = withSpring(0);
    cardPaymentOpacity.value = withTiming(0);
  };

  const handleBalancePayment = async () => {
    const total = calculateTotal(cartItems) + (orderType === 'delivery' ? 2 : 0);

    if (balance < total) {
      Alert.alert('Insufficient Balance', "You don't have enough balance to complete this purchase.");
      return;
    }

    try {
      // Update user balance
      await updateUserBalance(balance - total);
      // Refresh balance instead of setting it manually
      refreshBalance();

      // Create order
      const orderId = Date.now().toString();
      const orderData = {
        id: orderId,
        customerName: auth.currentUser?.displayName || 'User',
        customerId: auth.currentUser?.uid || 'anonymous',
        customerEmail: auth.currentUser?.email || 'anonymous',
        products: cartItems,
        total: total,
        status: 'pending',
        createdAt: new Date().toISOString(),
        orderType: orderType,
        paymentMethod: 'balance',
        ...(orderType === 'delivery' && { deliveryLocation })
      };

      // Save order to orders collection
      const ordersRef = collection(db, 'orders');
      const newOrderRef = await addDoc(ordersRef, orderData);

      // Update order with its document ID
      const updatedOrderData = {
        ...orderData,
        id: newOrderRef.id
      };
      await updateDoc(newOrderRef, { id: newOrderRef.id });

      // If user is logged in, save order to user's orders collection
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          await setDoc(userRef, {
            name: auth.currentUser.displayName || 'User',
            email: auth.currentUser.email,
            orders: [updatedOrderData]
          });
        } else {
          await updateDoc(userRef, {
            orders: arrayUnion(updatedOrderData)
          });
        }

        // Add loyalty checkin for the day
        await checkInUserWithOrder(newOrderRef.id);
      }

      Alert.alert('Order Confirmed', 'Your order has been placed successfully and paid with your balance.', [
        {
          text: 'OK',
          onPress: async () => {
            setCartItems([]);
            await AsyncStorage.removeItem('@art_coffee_cart');
            closeCheckout();
          }
        }
      ]);
    } catch (error) {
      console.error('Error processing balance payment:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    }
  };

  const handleCardPayment = async () => {
    if (!selectedCard) {
      Alert.alert('Payment Error', 'Please select a card to complete the payment.');
      return;
    }

    try {
      // Create order
      const orderId = Date.now().toString();
      const total = calculateTotal(cartItems) + (orderType === 'delivery' ? 2 : 0);

      const orderData = {
        id: orderId,
        customerName: auth.currentUser?.displayName || 'User',
        customerId: auth.currentUser?.uid || 'anonymous',
        customerEmail: auth.currentUser?.email || 'anonymous',
        products: cartItems,
        total: total,
        status: 'pending',
        createdAt: new Date().toISOString(),
        orderType: orderType,
        paymentMethod: 'card',
        cardDetails: {
          cardId: selectedCard.id,
          lastFourDigits: selectedCard.lastFourDigits,
          cardType: selectedCard.cardType
        },
        ...(orderType === 'delivery' && { deliveryLocation })
      };

      // Save order to orders collection
      const ordersRef = collection(db, 'orders');
      const newOrderRef = await addDoc(ordersRef, orderData);

      // Update order with its document ID
      const updatedOrderData = {
        ...orderData,
        id: newOrderRef.id
      };
      await updateDoc(newOrderRef, { id: newOrderRef.id });

      // If user is logged in, save order to user's orders collection
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          await setDoc(userRef, {
            name: auth.currentUser.displayName || 'User',
            email: auth.currentUser.email,
            orders: [updatedOrderData]
          });
        } else {
          await updateDoc(userRef, {
            orders: arrayUnion(updatedOrderData)
          });
        }

        // Add loyalty checkin for the day
        await checkInUserWithOrder(newOrderRef.id);
      }

      Alert.alert(
        'Order Confirmed',
        `Your order has been placed successfully and paid with your card ending in ${selectedCard.lastFourDigits}.`,
        [
          {
            text: 'OK',
            onPress: async () => {
              setCartItems([]);
              await AsyncStorage.removeItem('@art_coffee_cart');
              closeCheckout();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error processing card payment:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    }
  };

  const confirmOrder = async () => {
    if (!paymentMethod) {
      Alert.alert('Payment Method', 'Please select a payment method to continue.');
      return;
    }

    if (orderType === 'delivery' && (!deliveryLocation.address || !deliveryLocation.city)) {
      Alert.alert('Delivery Information', 'Please provide complete delivery address.');
      return;
    }

    try {
      // Generate unique order ID
      const orderId = Date.now().toString();

      const orderData = {
        id: orderId,
        customerName: auth.currentUser?.displayName || 'User',
        customerId: auth.currentUser?.uid || 'anonymous',
        customerEmail: auth.currentUser?.email || 'anonymous',
        products: cartItems,
        total: calculateTotal(cartItems) + (orderType === 'delivery' ? 2 : 0),
        status: 'pending',
        createdAt: new Date().toISOString(),
        orderType: orderType,
        paymentMethod: paymentMethod,
        ...(orderType === 'delivery' && { deliveryLocation })
      };

      // Save order to orders collection
      const ordersRef = collection(db, 'orders');
      const newOrderRef = await addDoc(ordersRef, orderData);

      // Update order with its document ID
      const updatedOrderData = {
        ...orderData,
        id: newOrderRef.id
      };
      await updateDoc(newOrderRef, { id: newOrderRef.id });

      // If user is logged in, save order to user's orders collection
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);

        // Check if user document exists, if not create it
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            name: auth.currentUser.displayName || 'User',
            email: auth.currentUser.email,
            orders: [updatedOrderData]
          });
        } else {
          // Add order to user's orders array
          await updateDoc(userRef, {
            orders: arrayUnion(updatedOrderData)
          });
        }

        // Add loyalty checkin for the day
        await checkInUserWithOrder(newOrderRef.id);
      }

      Alert.alert(
        'Order Confirmed',
        `Your order has been placed successfully. You will pay ${
          paymentMethod === 'bank' ? 'via bank transfer' : 'with cash on delivery'
        }.`,
        [
          {
            text: 'OK',
            onPress: async () => {
              // Clear cart after successful order
              setCartItems([]);
              await AsyncStorage.removeItem('@art_coffee_cart');
              closeCheckout();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    }
  };

  const renderCartItem = ({ item }) => (
    <Animated.View
      style={[
        styles.cartItem,
        {
          transform: [{ scale: cartScale }],
          opacity: cartOpacity
        }
      ]}
    >
      <View style={styles.cartItemImageContainer}>
        <Image source={{ uri: item.imageUrl }} style={styles.cartItemImage} />
      </View>

      <View style={styles.cartItemDetails}>
        <Typo style={styles.cartItemName}>{item.name}</Typo>
        <Typo style={styles.cartItemPrice}>${item.price.toFixed(2)}</Typo>

        <View style={styles.cartItemActions}>
          <TouchableOpacity style={styles.quantityButton} onPress={() => handleUpdateQuantity(item.id, -1)}>
            <Minus size={16} color={colors.white} weight='bold' />
          </TouchableOpacity>

          <Typo style={styles.quantityText}>{item.quantity}</Typo>

          <TouchableOpacity style={styles.quantityButton} onPress={() => handleUpdateQuantity(item.id, 1)}>
            <Plus size={16} color={colors.white} weight='bold' />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quantityButton, { backgroundColor: colors.rose }]}
            onPress={() => handleRemoveItem(item.id)}
          >
            <TrashSimple size={16} color={colors.white} weight='bold' />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cartItemTotal}>
        <Typo style={styles.cartItemTotalText}>${(item.price * item.quantity).toFixed(2)}</Typo>
      </View>
    </Animated.View>
  );

  const checkoutAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: checkoutHeight.value,
      opacity: checkoutOpacity.value
    };
  });

  const cartAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cartScale.value }],
      opacity: cartOpacity.value
    };
  });

  const cardPaymentAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: cardPaymentHeight.value,
      opacity: cardPaymentOpacity.value
    };
  });

  const EmptyCart = () => (
    <View style={styles.emptyCart}>
      <ShoppingCartSimple size={80} color={colors.neutral300} weight='light' />
      <Typo style={styles.emptyCartText}>Your cart is empty</Typo>
      <TouchableOpacity style={styles.browseButton} onPress={() => router.push('./')}>
        <ShoppingBag size={20} color={colors.white} weight='bold' style={styles.browseIcon} />
        <Typo style={styles.browseButtonText}>Browse Products</Typo>
      </TouchableOpacity>
    </View>
  );

  // Curved Header Background
  const CartHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerBg}>
        <View style={tw`absolute w-full h-30 bg-[${colors.primary}] top-[-20]`}></View>
        <Svg xmlns='http://www.w3.org/2000/svg' height={120} width={width} viewBox={`0 0 1440 402`}>
          <Path
            fill={colors.primary}
            fillOpacity='1'
            d='M0,288L48,272C96,256,192,224,288,208C384,192,480,192,576,202.7C672,213,768,235,864,218.7C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z'
          ></Path>
        </Svg>
      </View>
      <View style={styles.headerContent}>
        <View style={styles.cartIconContainer}>
          <ShoppingCartSimple size={30} color={colors.white} weight='bold' />
        </View>
        <Typo style={styles.headerTitle}>My Cart</Typo>
      </View>
    </View>
  );

  // Card selection component
  const CardItem = ({ card, isSelected, onSelect }) => (
    <TouchableOpacity style={[styles.cardItem, isSelected && styles.selectedCardItem]} onPress={() => onSelect(card)}>
      <View style={styles.cardTypeContainer}>
        <Typo style={styles.cardType}>{card.cardType}</Typo>
      </View>
      <Typo style={styles.cardNumber}>{card.cardNumber}</Typo>
      <View style={styles.cardDetails}>
        <Typo style={styles.cardholderName}>{card.cardholderName}</Typo>
        <Typo style={styles.expiryDate}>{card.expiryDate}</Typo>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper showBackButton={true} backRoute='./'>
      <CartHeader />

      <Animated.View style={[styles.container, cartAnimatedStyle]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Typo style={styles.loadingText}>Loading cart...</Typo>
          </View>
        ) : cartItems.length === 0 ? (
          <EmptyCart />
        ) : (
          <>
            <FlatList
              data={cartItems}
              keyExtractor={item => item.id}
              renderItem={renderCartItem}
              contentContainerStyle={styles.cartList}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.cartSummary}>
              <View style={styles.totalContainer}>
                <Typo style={styles.totalLabel}>Total:</Typo>
                <Typo style={styles.totalAmount}>${calculateTotal(cartItems).toFixed(2)}</Typo>
              </View>

              <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                <Typo style={styles.checkoutButtonText}>Checkout</Typo>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.View>

      {/* Checkout Panel */}
      <Animated.View style={[styles.checkoutPanel, checkoutAnimatedStyle]}>
        <View style={styles.checkoutHeader}>
          <Typo style={styles.checkoutTitle}>Order Details</Typo>
          <TouchableOpacity onPress={closeCheckout}>
            <Typo style={styles.closeButton}>×</Typo>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.checkoutContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.checkoutContentContainer}
        >
          <View style={styles.orderTypeContainer}>
            <Typo style={styles.orderTypeTitle}>Order Type</Typo>
            <View style={styles.orderTypeOptions}>
              <TouchableOpacity
                style={[styles.orderTypeOption, orderType === 'pickup' && styles.selectedOrderType]}
                onPress={() => setOrderType('pickup')}
              >
                <Typo style={[styles.orderTypeText, orderType === 'pickup' && styles.selectedOrderTypeText]}>
                  Pickup
                </Typo>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.orderTypeOption, orderType === 'delivery' && styles.selectedOrderType]}
                onPress={() => setOrderType('delivery')}
              >
                <Typo style={[styles.orderTypeText, orderType === 'delivery' && styles.selectedOrderTypeText]}>
                  Delivery
                </Typo>
              </TouchableOpacity>
            </View>
          </View>

          {orderType === 'delivery' && (
            <View style={styles.deliveryForm}>
              <Typo style={styles.deliveryTitle}>Delivery Address</Typo>
              <View style={styles.inputContainer}>
                <Typo style={styles.inputLabel}>Address</Typo>
                <TextInput
                  style={styles.input}
                  value={deliveryLocation.address}
                  onChangeText={text => setDeliveryLocation(prev => ({ ...prev, address: text }))}
                  placeholder='Enter your address'
                />
              </View>
              <View style={styles.inputContainer}>
                <Typo style={styles.inputLabel}>City</Typo>
                <TextInput
                  style={styles.input}
                  value={deliveryLocation.city}
                  onChangeText={text => setDeliveryLocation(prev => ({ ...prev, city: text }))}
                  placeholder='Enter your city'
                />
              </View>
            </View>
          )}

          <View style={styles.paymentOptions}>
            <Typo style={styles.paymentTitle}>Select Payment Method</Typo>
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'bank' && styles.selectedPayment]}
              onPress={() => {
                setPaymentMethod('bank');
                openCardPayment();
              }}
            >
              <Bank size={24} color={paymentMethod === 'bank' ? colors.white : colors.text} weight='bold' />
              <Typo style={[styles.paymentText, paymentMethod === 'bank' && styles.selectedPaymentText]}>
                Bank Transfer
              </Typo>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'cash' && styles.selectedPayment]}
              onPress={() => setPaymentMethod('cash')}
            >
              <Money size={24} color={paymentMethod === 'cash' ? colors.white : colors.text} weight='bold' />
              <Typo style={[styles.paymentText, paymentMethod === 'cash' && styles.selectedPaymentText]}>
                Cash on Delivery
              </Typo>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'balance' && styles.selectedPayment]}
              onPress={() => setPaymentMethod('balance')}
            >
              <Wallet size={24} color={paymentMethod === 'balance' ? colors.white : colors.text} weight='bold' />
              <Typo style={[styles.paymentText, paymentMethod === 'balance' && styles.selectedPaymentText]}>
                Balance (${balance.toFixed(2)})
              </Typo>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'card' && styles.selectedPayment]}
              onPress={() => setPaymentMethod('card')}
            >
              <CreditCard size={24} color={paymentMethod === 'card' ? colors.white : colors.text} weight='bold' />
              <Typo style={[styles.paymentText, paymentMethod === 'card' && styles.selectedPaymentText]}>
                Saved Cards
              </Typo>
            </TouchableOpacity>
          </View>

          {/* Add Card Selection Section when card payment is selected */}
          {paymentMethod === 'card' && (
            <View style={styles.savedCardsSection}>
              {savedCards.length > 0 ? (
                <View style={styles.cardsList}>
                  {savedCards.map(card => (
                    <CardItem
                      key={card.id}
                      card={card}
                      isSelected={selectedCard && selectedCard.id === card.id}
                      onSelect={setSelectedCard}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.noCardsMessage}>
                  <CreditCard size={40} color={colors.neutral300} weight='light' />
                  <Typo style={styles.noCardsText}>No saved cards found</Typo>
                  <TouchableOpacity style={styles.addCardButton} onPress={() => router.push('./Profile')}>
                    <Typo style={styles.addCardButtonText}>Add a Card</Typo>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View style={styles.checkoutSummary}>
            <View style={styles.summaryRow}>
              <Typo style={styles.summaryLabel}>Subtotal:</Typo>
              <Typo style={styles.summaryValue}>${calculateTotal(cartItems).toFixed(2)}</Typo>
            </View>

            {orderType === 'delivery' && (
              <View style={styles.summaryRow}>
                <Typo style={styles.summaryLabel}>Delivery:</Typo>
                <Typo style={styles.summaryValue}>$2.00</Typo>
              </View>
            )}

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Typo style={styles.totalLabel}>Grand Total:</Typo>
              <Typo style={styles.grandTotal}>
                ${(calculateTotal(cartItems) + (orderType === 'delivery' ? 2 : 0)).toFixed(2)}
              </Typo>
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={
            paymentMethod === 'balance'
              ? handleBalancePayment
              : paymentMethod === 'card'
              ? handleCardPayment
              : confirmOrder
          }
        >
          <Typo style={styles.confirmButtonText}>
            {paymentMethod === 'balance'
              ? 'Pay with Balance'
              : paymentMethod === 'card'
              ? 'Pay with Card'
              : 'Confirm Order'}
          </Typo>
          <ArrowRight size={18} color={colors.white} weight='bold' />
        </TouchableOpacity>
      </Animated.View>

      {/* Card Payment Panel */}
      <Animated.View style={[styles.cardPaymentPanel, cardPaymentAnimatedStyle]}>
        <View style={styles.cardPaymentHeader}>
          <Typo style={styles.cardPaymentTitle}>Card Details</Typo>
          <TouchableOpacity onPress={closeCardPayment}>
            <Typo style={styles.closeButton}>×</Typo>
          </TouchableOpacity>
        </View>

        <View style={styles.cardForm}>
          <View style={styles.inputContainer}>
            <Typo style={styles.inputLabel}>Card Number</Typo>
            <TextInput style={styles.input} placeholder='1234 5678 9012 3456' keyboardType='numeric' />
          </View>

          <View style={styles.cardDetailsRow}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <Typo style={styles.inputLabel}>Expiry Date</Typo>
              <TextInput style={styles.input} placeholder='MM/YY' keyboardType='numeric' />
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Typo style={styles.inputLabel}>CVV</Typo>
              <TextInput style={styles.input} placeholder='123' keyboardType='numeric' secureTextEntry />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Typo style={styles.inputLabel}>Cardholder Name</Typo>
            <TextInput style={styles.input} placeholder='John Doe' />
          </View>
        </View>

        <TouchableOpacity style={styles.payButton} onPress={confirmOrder}>
          <Typo style={styles.payButtonText}>
            Pay ${(calculateTotal(cartItems) + (orderType === 'delivery' ? 2 : 0)).toFixed(2)}
          </Typo>
        </TouchableOpacity>
      </Animated.View>
    </ScreenWrapper>
  );
};

export default Cart;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20
  },
  // Header styles
  headerContainer: {
    position: 'relative',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacingY._10,
    zIndex: 2
  },
  cartIconContainer: {
    backgroundColor: colors.secondaryGreen,
    borderRadius: radius._20,
    padding: 10,
    marginRight: spacingX._10
  },
  headerTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold'
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: colors.neutral500
  },
  // Empty cart styles
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80
  },
  emptyCartText: {
    fontSize: 18,
    color: colors.neutral500,
    marginTop: spacingY._15,
    marginBottom: spacingY._20
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._10,
    borderRadius: radius._10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  browseIcon: {
    marginRight: 8
  },
  browseButtonText: {
    color: colors.white,
    fontWeight: 'bold'
  },
  // Cart item styles
  cartList: {
    paddingTop: spacingY._15,
    paddingBottom: 120 // Extra space for the summary section
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.lightGreen,
    borderRadius: radius._15,
    marginBottom: spacingY._15,
    padding: 15,
    alignItems: 'center'
  },
  cartItemImageContainer: {
    width: 70,
    height: 70,
    borderRadius: radius._15,
    overflow: 'hidden',
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cartItemImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain'
  },
  cartItemDetails: {
    flex: 1,
    marginLeft: spacingX._10
  },
  cartItemName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4
  },
  cartItemPrice: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  quantityButton: {
    backgroundColor: colors.secondaryGreen,
    width: 28,
    height: 28,
    borderRadius: radius._6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  quantityText: {
    fontWeight: 'bold',
    marginHorizontal: spacingX._5
  },
  cartItemTotal: {
    paddingLeft: spacingX._10,
    alignItems: 'flex-end'
  },
  cartItemTotalText: {
    fontWeight: 'bold',
    color: colors.secondaryGreen,
    fontSize: 17
  },
  // Cart summary styles
  cartSummary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._15,
    paddingBottom: spacingY._25,
    borderTopLeftRadius: radius._20,
    borderTopRightRadius: radius._20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._15
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    borderRadius: radius._10,
    paddingVertical: spacingY._12,
    alignItems: 'center'
  },
  checkoutButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16
  },
  // Checkout panel styles
  checkoutPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius._20,
    borderTopRightRadius: radius._20,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 100,
    maxHeight: '80%'
  },
  checkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._15
  },
  checkoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: spacingX._10,
    flex: 1
  },
  closeButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neutral500
  },
  orderTypeContainer: {
    marginBottom: spacingY._20
  },
  orderTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacingY._10
  },
  orderTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  orderTypeOption: {
    flex: 1,
    backgroundColor: colors.lightGreen,
    borderRadius: radius._10,
    padding: 15,
    marginHorizontal: 5
  },
  selectedOrderType: {
    backgroundColor: colors.primary
  },
  orderTypeText: {
    textAlign: 'center',
    color: colors.text,
    fontWeight: '500'
  },
  selectedOrderTypeText: {
    color: colors.white
  },
  deliveryForm: {
    marginBottom: spacingY._20
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacingY._10
  },
  inputContainer: {
    marginBottom: spacingY._10
  },
  inputLabel: {
    fontSize: 14,
    color: colors.neutral600,
    marginBottom: 5
  },
  input: {
    backgroundColor: colors.lightGreen,
    borderRadius: radius._10,
    padding: 12,
    fontSize: 16
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cardPaymentPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius._20,
    borderTopRightRadius: radius._20,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 101
  },
  cardPaymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._15
  },
  cardPaymentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: spacingX._10,
    flex: 1
  },
  cardForm: {
    marginBottom: spacingY._20
  },
  payButton: {
    backgroundColor: colors.primary,
    borderRadius: radius._10,
    paddingVertical: spacingY._12,
    alignItems: 'center'
  },
  payButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16
  },
  paymentOptions: {
    marginBottom: spacingY._20
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacingY._10
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGreen,
    borderRadius: radius._10,
    padding: 15,
    marginBottom: spacingY._10
  },
  selectedPayment: {
    backgroundColor: colors.primary
  },
  paymentText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    marginLeft: spacingX._10
  },
  selectedPaymentText: {
    color: colors.white
  },
  checkoutSummary: {
    backgroundColor: colors.lightGreen,
    borderRadius: radius._10,
    padding: 15,
    marginBottom: spacingY._20
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  summaryLabel: {
    color: colors.neutral600
  },
  summaryValue: {
    fontWeight: '500'
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.neutral300,
    marginVertical: 10
  },
  grandTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: radius._10,
    paddingVertical: spacingY._12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacingY._10
  },
  confirmButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: spacingX._10
  },
  checkoutContent: {
    flex: 1
  },
  checkoutContentContainer: {
    paddingBottom: spacingY._20
  },
  // Saved Cards styles
  savedCardsSection: {
    marginTop: spacingY._15
  },
  cardsList: {
    marginBottom: spacingY._15
  },
  cardItem: {
    backgroundColor: colors.lightGreen,
    borderRadius: radius._10,
    padding: spacingX._15,
    marginBottom: spacingY._10
  },
  selectedCardItem: {
    backgroundColor: colors.secondaryGreen,
    borderWidth: 2,
    borderColor: colors.primary
  },
  cardTypeContainer: {
    marginBottom: 4
  },
  cardType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondaryGreen
  },
  cardNumber: {
    fontSize: 16,
    color: colors.text,
    letterSpacing: 1,
    marginBottom: 8
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cardholderName: {
    fontSize: 14,
    color: colors.neutral600
  },
  expiryDate: {
    fontSize: 14,
    color: colors.neutral600
  },
  noCardsMessage: {
    alignItems: 'center',
    padding: spacingY._20,
    backgroundColor: colors.lightGreen,
    borderRadius: radius._10
  },
  noCardsText: {
    fontSize: 14,
    color: colors.neutral500,
    marginTop: spacingY._10,
    marginBottom: spacingY._10
  },
  addCardButton: {
    backgroundColor: colors.primary,
    borderRadius: radius._10,
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._8
  },
  addCardButtonText: {
    color: colors.white,
    fontWeight: 'bold'
  }
});

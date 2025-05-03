import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import React, { useEffect, useState } from 'react';
import ScreenWrapper from '../../components/ScreenWrapper';
import { colors, spacingX, spacingY, radius } from '../../constants/theme';
import Typo from '../../components/Typo';
import Svg, { Path, Circle } from 'react-native-svg';
import { getAuth, signOut, updateProfile } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  User,
  SignOut,
  Receipt,
  Coffee,
  ShoppingBag,
  Package,
  Clock,
  ArrowRight,
  Camera,
  Gift,
  Wallet,
  TrashSimple,
  CreditCard,
  Bank,
  PlusCircle,
  Trash,
  Plus,
  Trophy,
  Check,
  X
} from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing } from 'react-native-reanimated';
import { updateProfileImage } from '../../utils/imageUtils';
import { getUserBalance, redeemGiftCard, updateUserBalance } from '../../utils/giftCardUtils';
import {
  getSavedCards,
  saveCard,
  deleteCard,
  validateCardNumber,
  validateExpiryDate,
  formatCardNumber,
  getCardType
} from '../../utils/cardUtils';
import { useBalance } from '../../utils/balanceContext';
import { useLoyalty } from '../../utils/loyaltyContext';
import { getDaysInMonth } from '../../utils/loyaltyUtils';

const { width, height } = Dimensions.get('window');

const StatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'completed':
        return colors.primary;
      case 'preparing':
        return '#FFA500'; // Orange
      case 'delivering':
        return '#0088FF'; // Blue
      case 'pending':
      default:
        return '#FF5733'; // Red-Orange
    }
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
      <Typo style={styles.statusText}>{status}</Typo>
    </View>
  );
};

const OrderItem = ({ order, onPress, isExpanded }) => {
  const date = new Date(order.createdAt);
  const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })}`;

  // Function to display payment method in a readable way
  const getPaymentMethodDisplay = (method, cardDetails) => {
    switch (method) {
      case 'bank':
        return 'Bank Transfer';
      case 'cash':
        return 'Cash on Delivery';
      case 'balance':
        return 'Balance Payment';
      case 'card':
        if (cardDetails) {
          return `${cardDetails.cardType} card ending in ${cardDetails.lastFourDigits}`;
        }
        return 'Card Payment';
      default:
        return 'Unknown Payment Method';
    }
  };

  return (
    <Animated.View style={styles.orderCard}>
      <TouchableOpacity onPress={() => onPress(order.id)} activeOpacity={0.9}>
        <View style={styles.orderHeader}>
          <View>
            <Typo style={styles.orderTitle}>Order #{order.id.slice(-6)}</Typo>
            <Typo style={styles.orderDate}>{formattedDate}</Typo>
          </View>
          <View style={styles.orderHeaderRight}>
            <StatusBadge status={order.status} />
            <Typo style={styles.orderTotal}>${order.total.toFixed(2)}</Typo>
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.orderDetails}>
          <View style={styles.orderInfoRow}>
            <Typo style={styles.orderInfoLabel}>Order Type:</Typo>
            <Typo style={styles.orderInfoValue}>{order.orderType}</Typo>
          </View>
          <View style={styles.orderInfoRow}>
            <Typo style={styles.orderInfoLabel}>Payment Method:</Typo>
            <Typo style={styles.orderInfoValue}>{getPaymentMethodDisplay(order.paymentMethod, order.cardDetails)}</Typo>
          </View>

          {order.orderType === 'delivery' && (
            <View style={styles.deliveryAddressContainer}>
              <Typo style={styles.deliveryAddressTitle}>Delivery Address:</Typo>
              <Typo style={styles.deliveryAddressText}>
                {order.deliveryLocation.address}, {order.deliveryLocation.city}
              </Typo>
            </View>
          )}

          <View style={styles.productListHeader}>
            <Typo style={styles.productListTitle}>Products</Typo>
          </View>

          {order.products.map(product => (
            <View key={product.id} style={styles.productItem}>
              <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
              <View style={styles.productDetails}>
                <Typo style={styles.productName}>{product.name}</Typo>
                <Typo style={styles.productPrice}>
                  ${product.price.toFixed(2)} x {product.quantity}
                </Typo>
              </View>
              <Typo style={styles.productTotal}>${(product.price * product.quantity).toFixed(2)}</Typo>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const ProfileMenuOption = ({ icon, title, onPress, color = colors.primary }) => (
  <TouchableOpacity style={styles.menuOption} onPress={onPress}>
    <View style={[styles.menuIconContainer, { backgroundColor: color + '20' }]}>{icon}</View>
    <View style={styles.menuTextContainer}>
      <Typo style={styles.menuTitle}>{title}</Typo>
    </View>
    <ArrowRight size={20} color={colors.neutral400} />
  </TouchableOpacity>
);

const Profile = () => {
  const auth = getAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [showGiftCardDrawer, setShowGiftCardDrawer] = useState(false);
  const [showBalanceDrawer, setShowBalanceDrawer] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [savedCards, setSavedCards] = useState([]);
  const [showCardDrawer, setShowCardDrawer] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: ''
  });
  const [cardErrors, setCardErrors] = useState({});
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const { balance, refreshBalance } = useBalance();
  const [showLoyaltyDrawer, setShowLoyaltyDrawer] = useState(false);

  // Loyalty program state
  const {
    loading: loyaltyLoading,
    loyaltyProgram,
    userCheckins,
    currentMonth,
    hasCheckedInToday,
    getCompletionPercentage,
    getDaysRemainingForReward,
    hasEarnedReward,
    refreshLoyaltyData
  } = useLoyalty();

  // Animation values for loyalty drawer
  const loyaltyDrawerHeight = useSharedValue(0);
  const loyaltyDrawerOpacity = useSharedValue(0);

  // Animation values
  const profileScale = useSharedValue(1);
  const profileOpacity = useSharedValue(1);
  const ordersHeight = useSharedValue(0);
  const ordersOpacity = useSharedValue(0);

  // Animation values for drawers
  const giftCardDrawerHeight = useSharedValue(0);
  const giftCardDrawerOpacity = useSharedValue(0);
  const balanceDrawerHeight = useSharedValue(0);
  const balanceDrawerOpacity = useSharedValue(0);
  const cardDrawerHeight = useSharedValue(0);
  const cardDrawerOpacity = useSharedValue(0);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    // Get user profile
    const fetchUserProfile = async () => {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        } else {
          setUserProfile({
            name: auth.currentUser.displayName || 'User',
            email: auth.currentUser.email,
            photoURL: auth.currentUser.photoURL
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();

    // Set up real-time listener for orders
    const ordersQuery = query(collection(db, 'orders'), where('customerId', '==', auth.currentUser.uid));

    const unsubscribe = onSnapshot(
      ordersQuery,
      snapshot => {
        const ordersList = [];
        snapshot.forEach(doc => {
          ordersList.push({ ...doc.data(), id: doc.id });
        });

        // Sort orders by date (newest first)
        ordersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(ordersList);
        setLoading(false);
      },
      error => {
        console.error('Error fetching orders:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser]);

  useEffect(() => {
    // Load saved cards when component mounts
    const loadSavedCards = async () => {
      try {
        const cards = await getSavedCards();
        setSavedCards(cards);
      } catch (error) {
        console.error('Error loading saved cards:', error);
      }
    };

    if (auth.currentUser) {
      loadSavedCards();
    }
  }, [auth.currentUser]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('@art_coffee_cart');
      router.replace('./');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileImageUpdate = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to update your profile image');
      return;
    }

    try {
      setIsUploadingImage(true);

      const result = await updateProfileImage();

      if (result.success) {
        // Update local state
        setUserProfile(prev => ({
          ...prev,
          photoURL: result.photoURL
        }));

        // Update the auth profile to ensure it's updated everywhere
        await updateProfile(auth.currentUser, {
          photoURL: result.photoURL
        });

        Alert.alert('Success', 'Profile image updated successfully');
      } else {
        if (result.error) {
          Alert.alert('Error', result.error);
        }
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      Alert.alert('Error', 'Failed to update profile image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const toggleOrderExpansion = orderId => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const toggleShowAllOrders = () => {
    if (showAllOrders) {
      // Animate closing all orders view
      ordersHeight.value = withSpring(0);
      ordersOpacity.value = withTiming(0);
      profileScale.value = withTiming(1);
      profileOpacity.value = withTiming(1);
      setShowAllOrders(false);
    } else {
      // Animate opening all orders view
      ordersHeight.value = withSpring(500);
      ordersOpacity.value = withTiming(1);
      profileScale.value = withTiming(0.95);
      profileOpacity.value = withTiming(0.7);
      setShowAllOrders(true);
    }
  };

  const ordersAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: ordersHeight.value,
      opacity: ordersOpacity.value
    };
  });

  const profileAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: profileScale.value }],
      opacity: profileOpacity.value
    };
  });

  const handleRedeemGiftCard = async () => {
    if (!giftCardCode.trim()) {
      Alert.alert('Error', 'Please enter a gift card code');
      return;
    }

    try {
      const result = await redeemGiftCard(giftCardCode.trim());
      Alert.alert('Success', `Successfully redeemed gift card! Added $${result.amount} to your balance.`);
      setGiftCardCode('');
      setShowGiftCardDrawer(false);
      refreshBalance();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAddBalance = async () => {
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedCard) {
      Alert.alert('Error', 'Please select a card to add balance');
      return;
    }

    try {
      const currentBalance = await getUserBalance();
      await updateUserBalance(currentBalance + amount);
      refreshBalance();
      setBalanceAmount('');
      setSelectedCard(null);
      setShowBalanceDrawer(false);
      Alert.alert(
        'Success',
        `Successfully added $${amount.toFixed(2)} to your balance using your ${selectedCard.cardType} card ending in ${
          selectedCard.lastFourDigits
        }`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add balance. Please try again.');
    }
  };

  const openGiftCardDrawer = () => {
    Keyboard.dismiss();
    giftCardDrawerHeight.value = withSpring(height * 0.9, {
      damping: 15,
      stiffness: 120,
      mass: 1,
      overshootClamping: false
    });
    giftCardDrawerOpacity.value = withSpring(1, {
      damping: 20,
      stiffness: 100
    });
    profileScale.value = withSpring(0.95, {
      damping: 20,
      stiffness: 150
    });
    profileOpacity.value = withSpring(0.7, {
      damping: 20,
      stiffness: 120
    });
    setShowGiftCardDrawer(true);
  };

  const closeGiftCardDrawer = () => {
    Keyboard.dismiss();
    giftCardDrawerHeight.value = withSpring(0, {
      damping: 15,
      stiffness: 120,
      velocity: -10
    });
    giftCardDrawerOpacity.value = withSpring(0, {
      damping: 20,
      stiffness: 100
    });
    profileScale.value = withSpring(1, {
      damping: 20,
      stiffness: 150
    });
    profileOpacity.value = withSpring(1, {
      damping: 20,
      stiffness: 120
    });
    setTimeout(() => {
      setShowGiftCardDrawer(false);
    }, 300);
  };

  const openBalanceDrawer = () => {
    Keyboard.dismiss();
    balanceDrawerHeight.value = withSpring(height * 0.9, {
      damping: 15,
      stiffness: 120,
      mass: 1,
      overshootClamping: false
    });
    balanceDrawerOpacity.value = withSpring(1, {
      damping: 20,
      stiffness: 100
    });
    profileScale.value = withSpring(0.95, {
      damping: 20,
      stiffness: 150
    });
    profileOpacity.value = withSpring(0.7, {
      damping: 20,
      stiffness: 120
    });
    setShowBalanceDrawer(true);
  };

  const closeBalanceDrawer = () => {
    Keyboard.dismiss();
    balanceDrawerHeight.value = withSpring(0, {
      damping: 15,
      stiffness: 120,
      velocity: -10
    });
    balanceDrawerOpacity.value = withSpring(0, {
      damping: 20,
      stiffness: 100
    });
    profileScale.value = withSpring(1, {
      damping: 20,
      stiffness: 150
    });
    profileOpacity.value = withSpring(1, {
      damping: 20,
      stiffness: 120
    });
    setTimeout(() => {
      setShowBalanceDrawer(false);
      setBalanceAmount('');
      setSelectedCard(null);
    }, 300);
  };

  const openCardDrawer = () => {
    Keyboard.dismiss();
    cardDrawerHeight.value = withSpring(height * 0.9, {
      damping: 15,
      stiffness: 120,
      mass: 1,
      overshootClamping: false
    });
    cardDrawerOpacity.value = withSpring(1, {
      damping: 20,
      stiffness: 100
    });
    profileScale.value = withSpring(0.95, {
      damping: 20,
      stiffness: 150
    });
    profileOpacity.value = withSpring(0.7, {
      damping: 20,
      stiffness: 120
    });
    setShowCardDrawer(true);
  };

  const closeCardDrawer = () => {
    Keyboard.dismiss();
    cardDrawerHeight.value = withSpring(0, {
      damping: 15,
      stiffness: 120,
      velocity: -10
    });
    cardDrawerOpacity.value = withSpring(0, {
      damping: 20,
      stiffness: 100
    });
    profileScale.value = withSpring(1, {
      damping: 20,
      stiffness: 150
    });
    profileOpacity.value = withSpring(1, {
      damping: 20,
      stiffness: 120
    });
    setTimeout(() => {
      setShowCardDrawer(false);
      // Reset form
      setNewCard({
        cardNumber: '',
        cardholderName: '',
        expiryDate: '',
        cvv: ''
      });
      setCardErrors({});
      setIsAddingCard(false);
    }, 300);
  };

  const cardDrawerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: cardDrawerHeight.value,
      opacity: cardDrawerOpacity.value
    };
  });

  const loyaltyDrawerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: loyaltyDrawerHeight.value,
      opacity: loyaltyDrawerOpacity.value
    };
  });

  const openLoyaltyDrawer = () => {
    Keyboard.dismiss();
    loyaltyDrawerHeight.value = withSpring(height * 0.9, {
      damping: 15,
      stiffness: 120,
      mass: 1,
      overshootClamping: false
    });
    loyaltyDrawerOpacity.value = withSpring(1, {
      damping: 20,
      stiffness: 100
    });
    profileScale.value = withSpring(0.95, {
      damping: 20,
      stiffness: 150
    });
    profileOpacity.value = withSpring(0.7, {
      damping: 20,
      stiffness: 120
    });
    setShowLoyaltyDrawer(true);
  };

  const closeLoyaltyDrawer = () => {
    Keyboard.dismiss();
    loyaltyDrawerHeight.value = withSpring(0, {
      damping: 15,
      stiffness: 120,
      velocity: -10
    });
    loyaltyDrawerOpacity.value = withSpring(0, {
      damping: 20,
      stiffness: 100
    });
    profileScale.value = withSpring(1, {
      damping: 20,
      stiffness: 150
    });
    profileOpacity.value = withSpring(1, {
      damping: 20,
      stiffness: 120
    });
    setTimeout(() => {
      setShowLoyaltyDrawer(false);
    }, 300);
  };

  const handleCardNumberChange = text => {
    // Format card number with spaces
    const formattedText = formatCardNumber(text);
    setNewCard({ ...newCard, cardNumber: formattedText });
  };

  const handleExpiryDateChange = text => {
    // Format expiry date with slash
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;

    if (cleaned.length > 2) {
      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }

    setNewCard({ ...newCard, expiryDate: formatted });
  };

  const validateCard = () => {
    const errors = {};

    if (!validateCardNumber(newCard.cardNumber.replace(/\s/g, ''))) {
      errors.cardNumber = 'Invalid card number';
    }

    if (!newCard.cardholderName.trim()) {
      errors.cardholderName = 'Cardholder name is required';
    }

    if (!validateExpiryDate(newCard.expiryDate)) {
      errors.expiryDate = 'Invalid expiry date';
    }

    if (!newCard.cvv || !/^\d{3,4}$/.test(newCard.cvv)) {
      errors.cvv = 'Invalid CVV';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCard = async () => {
    if (!validateCard()) {
      return;
    }

    try {
      setIsAddingCard(true);

      const cardData = {
        cardNumber: newCard.cardNumber.replace(/\s/g, ''),
        cardholderName: newCard.cardholderName.trim(),
        expiryDate: newCard.expiryDate
      };

      const result = await saveCard(cardData);

      // Update the local state with the new card
      setSavedCards([...savedCards, result]);

      // Reset form and close drawer
      setNewCard({
        cardNumber: '',
        cardholderName: '',
        expiryDate: '',
        cvv: ''
      });

      Alert.alert('Success', 'Your card has been saved successfully');
      closeCardDrawer();
    } catch (error) {
      Alert.alert('Error', 'Failed to save card. Please try again.');
    } finally {
      setIsAddingCard(false);
    }
  };

  const handleDeleteCard = async cardId => {
    try {
      await deleteCard(cardId);
      // Update local state
      setSavedCards(savedCards.filter(card => card.id !== cardId));
      Alert.alert('Success', 'Card has been removed');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete card. Please try again.');
    }
  };

  // Card Item Component
  const CardItem = ({ card, onDelete }) => (
    <View style={styles.cardItem}>
      <View style={styles.cardContent}>
        <View style={styles.cardTypeContainer}>
          <Typo style={styles.cardType}>{card.cardType}</Typo>
        </View>

        <Typo style={styles.cardNumber}>{card.cardNumber}</Typo>

        <View style={styles.cardDetails}>
          <Typo style={styles.cardholderName}>{card.cardholderName}</Typo>
          <Typo style={styles.expiryDate}>{card.expiryDate}</Typo>
        </View>
      </View>

      <TouchableOpacity style={styles.deleteCardButton} onPress={() => onDelete(card.id)}>
        <Trash size={20} color={colors.rose} weight='bold' />
      </TouchableOpacity>
    </View>
  );

  // Card selection component for the balance drawer
  const BalanceCardItem = ({ card, isSelected, onSelect }) => (
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

  const ProfileHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerBg}>
        <View
          style={{ position: 'absolute', width: '100%', height: 120, backgroundColor: colors.primary, top: -120 }}
        ></View>
        <Svg xmlns='http://www.w3.org/2000/svg' height={120} width={width} viewBox='0 0 1440 402'>
          <Path
            fill={colors.primary}
            fillOpacity='1'
            d='M0,288L48,272C96,256,192,224,288,208C384,192,480,192,576,202.7C672,213,768,235,864,218.7C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z'
          ></Path>
        </Svg>
      </View>
      <View style={styles.headerContent}>
        <View style={styles.profileIconContainer}>
          <User size={30} color={colors.white} weight='bold' />
        </View>
        <Typo style={styles.headerTitle}>Profile</Typo>
      </View>
    </View>
  );

  const giftCardDrawerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: giftCardDrawerHeight.value,
      opacity: giftCardDrawerOpacity.value
    };
  });

  const balanceDrawerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: balanceDrawerHeight.value,
      opacity: balanceDrawerOpacity.value
    };
  });

  return (
    <ScreenWrapper showBackButton={true} backRoute='./'>
      <ProfileHeader />

      {!auth.currentUser ? (
        <View style={styles.loginPrompt}>
          <User size={80} color={colors.neutral300} weight='light' />
          <Typo style={styles.loginPromptText}>Please log in to view your profile</Typo>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
            <Typo style={styles.loginButtonText}>Log In</Typo>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.container}>
          <Animated.ScrollView
            style={[styles.contentContainer, profileAnimatedStyle]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <TouchableOpacity
                  style={styles.profileImageContainer}
                  onPress={handleProfileImageUpdate}
                  disabled={isUploadingImage}
                >
                  <Image
                    source={{
                      uri:
                        userProfile?.photoURL ||
                        'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541'
                    }}
                    style={styles.profileImage}
                  />
                  {isUploadingImage ? (
                    <View style={styles.imageUploadOverlay}>
                      <ActivityIndicator size='small' color={colors.white} />
                    </View>
                  ) : (
                    <View style={styles.cameraIconContainer}>
                      <Camera size={18} color={colors.white} weight='bold' />
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.profileInfo}>
                  <Typo style={styles.profileName}>{userProfile?.username}</Typo>
                  <Typo style={styles.profileEmail}>{userProfile?.email}</Typo>
                  <View style={styles.balanceInfo}>
                    <Wallet size={16} color={colors.secondaryGreen} weight='bold' />
                    <Typo style={styles.balanceText}>Balance: ${balance.toFixed(2)}</Typo>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.menuSection}>
              <ProfileMenuOption
                icon={<Receipt size={22} color={colors.primary} weight='bold' />}
                title='My Orders'
                onPress={toggleShowAllOrders}
              />
              <ProfileMenuOption
                icon={<Trophy size={22} color={colors.primary} weight='bold' />}
                title='Loyalty Program'
                onPress={openLoyaltyDrawer}
              />
              <ProfileMenuOption
                icon={<Wallet size={22} color={colors.primary} weight='bold' />}
                title='Add Balance'
                onPress={openBalanceDrawer}
              />
              <ProfileMenuOption
                icon={<Gift size={22} color={colors.primary} weight='bold' />}
                title='Redeem Gift Card'
                onPress={openGiftCardDrawer}
              />
              <ProfileMenuOption
                icon={<CreditCard size={22} color={colors.primary} weight='bold' />}
                title='Payment Cards'
                onPress={openCardDrawer}
              />
              <ProfileMenuOption
                icon={<SignOut size={22} color={colors.rose} weight='bold' />}
                title='Sign Out'
                onPress={handleSignOut}
                color={colors.rose}
              />
            </View>

            <View style={styles.recentOrdersSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Clock size={22} color={colors.primary} weight='bold' />
                  <Typo style={styles.sectionTitle}>Recent Orders</Typo>
                </View>

                {orders.length > 0 && (
                  <TouchableOpacity onPress={toggleShowAllOrders}>
                    <Typo style={styles.seeAllText}>See All</Typo>
                  </TouchableOpacity>
                )}
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <Typo style={styles.loadingText}>Loading orders...</Typo>
                </View>
              ) : orders.length === 0 ? (
                <View style={styles.emptyOrdersContainer}>
                  <Package size={60} color={colors.neutral300} weight='light' />
                  <Typo style={styles.emptyOrdersText}>You haven't placed any orders yet</Typo>
                  <TouchableOpacity style={styles.browseButton} onPress={() => router.push('./Menu')}>
                    <ShoppingBag size={20} color={colors.white} weight='bold' />
                    <Typo style={styles.browseButtonText}>Browse Menu</Typo>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.ordersList}>
                  {orders.slice(0, 2).map(order => (
                    <OrderItem
                      key={order.id}
                      order={order}
                      onPress={toggleOrderExpansion}
                      isExpanded={expandedOrderId === order.id}
                    />
                  ))}
                </View>
              )}
            </View>
          </Animated.ScrollView>

          {/* All Orders Panel */}
          <Animated.View style={[styles.allOrdersPanel, ordersAnimatedStyle]}>
            <View style={styles.allOrdersHeader}>
              <Typo style={styles.allOrdersTitle}>My Orders</Typo>
              <TouchableOpacity onPress={toggleShowAllOrders}>
                <Typo style={styles.closeButton}>×</Typo>
              </TouchableOpacity>
            </View>

            <FlatList
              data={orders}
              keyExtractor={order => order.id}
              renderItem={({ item }) => (
                <OrderItem order={item} onPress={toggleOrderExpansion} isExpanded={expandedOrderId === item.id} />
              )}
              contentContainerStyle={styles.allOrdersList}
              showsVerticalScrollIndicator={false}
            />
          </Animated.View>

          {/* Balance Drawer */}
          {showBalanceDrawer && (
            <View style={styles.drawerContainer}>
              <Animated.View style={[styles.allOrdersPanel, balanceDrawerAnimatedStyle]}>
                <View style={styles.allOrdersHeader}>
                  <Typo style={styles.allOrdersTitle}>Add Balance</Typo>
                  <TouchableOpacity onPress={closeBalanceDrawer}>
                    <Typo style={styles.closeButton}>×</Typo>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.drawerScrollContent}
                  contentContainerStyle={styles.drawerContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps='handled'
                >
                  <View style={styles.balanceInfo}>
                    <Wallet size={32} color={colors.primary} weight='bold' />
                    <Typo style={styles.currentBalance}>Current Balance: ${balance.toFixed(2)}</Typo>
                  </View>

                  <View style={styles.inputContainer}>
                    <Typo style={styles.inputLabel}>Amount to Add</Typo>
                    <TextInput
                      style={styles.input}
                      placeholder='Enter amount'
                      value={balanceAmount}
                      onChangeText={setBalanceAmount}
                      keyboardType='numeric'
                      placeholderTextColor={colors.neutral400}
                    />
                  </View>

                  <View style={styles.cardSelectionSection}>
                    <Typo style={styles.cardSelectionTitle}>Select a Card</Typo>

                    {savedCards.length > 0 ? (
                      <View style={styles.cardsList}>
                        {savedCards.map(card => (
                          <BalanceCardItem
                            key={card.id}
                            card={card}
                            isSelected={selectedCard && selectedCard.id === card.id}
                            onSelect={setSelectedCard}
                          />
                        ))}
                      </View>
                    ) : (
                      <View style={styles.noCardsContainer}>
                        <CreditCard size={40} color={colors.neutral300} weight='light' />
                        <Typo style={styles.noCardsText}>No saved cards</Typo>
                        <TouchableOpacity
                          style={styles.addCardButton}
                          onPress={() => {
                            closeBalanceDrawer();
                            setTimeout(() => openCardDrawer(), 300);
                          }}
                        >
                          <Typo style={styles.addCardButtonText}>Add a Card</Typo>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.confirmButton, (!balanceAmount || !selectedCard) && styles.disabledButton]}
                    onPress={handleAddBalance}
                    disabled={!balanceAmount || !selectedCard}
                  >
                    <Typo style={styles.confirmButtonText}>Add Balance</Typo>
                    <ArrowRight size={18} color={colors.white} weight='bold' />
                  </TouchableOpacity>
                </ScrollView>
              </Animated.View>
            </View>
          )}

          {/* Gift Card Redemption Drawer */}
          {showGiftCardDrawer && (
            <View style={styles.drawerContainer}>
              <Animated.View style={[styles.allOrdersPanel, giftCardDrawerAnimatedStyle]}>
                <View style={styles.allOrdersHeader}>
                  <Typo style={styles.allOrdersTitle}>Redeem Gift Card</Typo>
                  <TouchableOpacity onPress={closeGiftCardDrawer}>
                    <Typo style={styles.closeButton}>×</Typo>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.drawerScrollContent}
                  contentContainerStyle={styles.drawerContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps='handled'
                >
                  <View style={styles.balanceInfo}>
                    <Gift size={32} color={colors.primary} weight='bold' />
                    <Typo style={styles.currentBalance}>Current Balance: ${balance.toFixed(2)}</Typo>
                  </View>

                  <View style={styles.inputContainer}>
                    <Typo style={styles.inputLabel}>Gift Card Code</Typo>
                    <TextInput
                      style={styles.input}
                      placeholder='Enter gift card code'
                      value={giftCardCode}
                      onChangeText={setGiftCardCode}
                      autoCapitalize='characters'
                      placeholderTextColor={colors.neutral400}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.confirmButton, !giftCardCode && styles.disabledButton]}
                    onPress={handleRedeemGiftCard}
                    disabled={!giftCardCode}
                  >
                    <Typo style={styles.confirmButtonText}>Redeem Gift Card</Typo>
                    <ArrowRight size={18} color={colors.white} weight='bold' />
                  </TouchableOpacity>
                </ScrollView>
              </Animated.View>
            </View>
          )}

          {/* Card Management Drawer */}
          {showCardDrawer && (
            <View style={styles.drawerContainer}>
              <Animated.View style={[styles.allOrdersPanel, cardDrawerAnimatedStyle]}>
                <View style={styles.allOrdersHeader}>
                  <Typo style={styles.allOrdersTitle}>Payment Cards</Typo>
                  <TouchableOpacity onPress={closeCardDrawer}>
                    <Typo style={styles.closeButton}>×</Typo>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.drawerScrollContent}
                  contentContainerStyle={styles.allOrdersList}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps='handled'
                >
                  {!isAddingCard ? (
                    <>
                      {savedCards.length > 0 ? (
                        <View style={styles.cardsContainer}>
                          {savedCards.map(card => (
                            <CardItem key={card.id} card={card} onDelete={handleDeleteCard} />
                          ))}
                        </View>
                      ) : (
                        <View style={styles.noCardsContainer}>
                          <CreditCard size={60} color={colors.neutral300} weight='light' />
                          <Typo style={styles.noCardsText}>No saved cards</Typo>
                        </View>
                      )}

                      <TouchableOpacity style={styles.confirmButton} onPress={() => setIsAddingCard(true)}>
                        <Typo style={styles.confirmButtonText}>Add New Card</Typo>
                        <Plus size={18} color={colors.white} weight='bold' />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={styles.addCardForm}>
                      <View style={styles.formSection}>
                        <Typo style={styles.formSectionTitle}>Card Information</Typo>

                        <View style={styles.inputContainer}>
                          <Typo style={styles.inputLabel}>Card Number</Typo>
                          <TextInput
                            style={[styles.input, cardErrors.cardNumber && styles.inputError]}
                            placeholder='1234 5678 9012 3456'
                            value={newCard.cardNumber}
                            onChangeText={handleCardNumberChange}
                            keyboardType='numeric'
                            maxLength={19} // 16 digits + 3 spaces
                            placeholderTextColor={colors.neutral400}
                          />
                          {cardErrors.cardNumber && <Typo style={styles.errorText}>{cardErrors.cardNumber}</Typo>}
                        </View>

                        <View style={styles.inputContainer}>
                          <Typo style={styles.inputLabel}>Cardholder Name</Typo>
                          <TextInput
                            style={[styles.input, cardErrors.cardholderName && styles.inputError]}
                            placeholder='John Doe'
                            value={newCard.cardholderName}
                            onChangeText={text => setNewCard({ ...newCard, cardholderName: text })}
                            placeholderTextColor={colors.neutral400}
                          />
                          {cardErrors.cardholderName && (
                            <Typo style={styles.errorText}>{cardErrors.cardholderName}</Typo>
                          )}
                        </View>

                        <View style={styles.rowInputs}>
                          <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                            <Typo style={styles.inputLabel}>Expiry Date</Typo>
                            <TextInput
                              style={[styles.input, cardErrors.expiryDate && styles.inputError]}
                              placeholder='MM/YY'
                              value={newCard.expiryDate}
                              onChangeText={handleExpiryDateChange}
                              keyboardType='numeric'
                              maxLength={5}
                              placeholderTextColor={colors.neutral400}
                            />
                            {cardErrors.expiryDate && <Typo style={styles.errorText}>{cardErrors.expiryDate}</Typo>}
                          </View>

                          <View style={[styles.inputContainer, { flex: 1 }]}>
                            <Typo style={styles.inputLabel}>CVV</Typo>
                            <TextInput
                              style={[styles.input, cardErrors.cvv && styles.inputError]}
                              placeholder='123'
                              value={newCard.cvv}
                              onChangeText={text => setNewCard({ ...newCard, cvv: text })}
                              keyboardType='numeric'
                              maxLength={4}
                              secureTextEntry
                              placeholderTextColor={colors.neutral400}
                            />
                            {cardErrors.cvv && <Typo style={styles.errorText}>{cardErrors.cvv}</Typo>}
                          </View>
                        </View>

                        <View style={styles.formButtons}>
                          <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAddingCard(false)}>
                            <Typo style={styles.cancelButtonText}>Cancel</Typo>
                          </TouchableOpacity>

                          <TouchableOpacity style={styles.confirmButton} onPress={handleSaveCard}>
                            <Typo style={styles.confirmButtonText}>Save Card</Typo>
                            <ArrowRight size={18} color={colors.white} weight='bold' />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </Animated.View>
            </View>
          )}

          {/* Loyalty Program Drawer */}
          {showLoyaltyDrawer && (
            <View style={styles.drawerContainer}>
              <Animated.View style={[styles.allOrdersPanel, loyaltyDrawerAnimatedStyle]}>
                <View style={styles.allOrdersHeader}>
                  <Typo style={styles.allOrdersTitle}>Monthly Loyalty Program</Typo>
                  <TouchableOpacity onPress={closeLoyaltyDrawer}>
                    <Typo style={styles.closeButton}>×</Typo>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.drawerScrollContent}
                  contentContainerStyle={styles.drawerContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps='handled'
                >
                  {loyaltyLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size='large' color={colors.primary} />
                      <Typo style={styles.loadingText}>Loading loyalty program...</Typo>
                    </View>
                  ) : !loyaltyProgram ? (
                    <View style={styles.noLoyaltyContainer}>
                      <Trophy size={60} color={colors.neutral300} weight='light' />
                      <Typo style={styles.noLoyaltyText}>Loyalty program is not available at the moment</Typo>
                    </View>
                  ) : (
                    <>
                      <View style={styles.loyaltyHeader}>
                        <Trophy size={32} color={colors.primary} weight='bold' />
                        <Typo style={styles.loyaltyTitle}>
                          Check-in for {loyaltyProgram.daysRequiredForReward} days this month
                        </Typo>
                        <Typo style={styles.loyaltySubtitle}>
                          {hasEarnedReward()
                            ? 'Congratulations! You earned the reward.'
                            : `${getDaysRemainingForReward()} days remaining to earn your reward`}
                        </Typo>
                      </View>

                      <View style={styles.progressBarContainer}>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${getCompletionPercentage()}%` }]} />
                        </View>
                        <Typo style={styles.progressText}>
                          {userCheckins.length}/{loyaltyProgram.daysRequiredForReward} days
                        </Typo>
                      </View>

                      {/* Loyalty Calendar */}
                      <View style={styles.loyaltyCalendarContainer}>
                        <Typo style={styles.calendarTitle}>
                          {new Date().toLocaleString('default', { month: 'long' })} Check-ins
                        </Typo>
                        <View style={styles.calendarGrid}>
                          {getDaysInMonth().map(day => {
                            const isCheckedIn = userCheckins.includes(day);
                            const isFutureDay = day > new Date().getDate();

                            return (
                              <View key={day} style={styles.calendarDay}>
                                <View
                                  style={[
                                    styles.dayCircle,
                                    isCheckedIn && styles.checkedInDay,
                                    isFutureDay && styles.futureDay
                                  ]}
                                >
                                  {isCheckedIn ? (
                                    <Check size={16} color={colors.white} weight='bold' />
                                  ) : isFutureDay ? (
                                    <Typo style={styles.futureDayText}>{day}</Typo>
                                  ) : (
                                    <X size={16} color={colors.rose} weight='bold' />
                                  )}
                                </View>
                                <Typo style={styles.dayNumber}>{day}</Typo>
                              </View>
                            );
                          })}
                        </View>
                      </View>

                      {/* Reward Details */}
                      <View style={styles.rewardContainer}>
                        <Typo style={styles.rewardTitle}>Your Reward</Typo>
                        <View style={styles.rewardCard}>
                          <Gift size={24} color={colors.primary} weight='bold' />
                          <Typo style={styles.rewardDescription}>{loyaltyProgram.reward}</Typo>
                        </View>

                        {hasEarnedReward() && (
                          <View style={styles.rewardEarnedContainer}>
                            <Trophy size={32} color={colors.primary} weight='bold' />
                            <Typo style={styles.rewardEarnedText}>
                              Congratulations! Show this to the barista to claim your reward.
                            </Typo>
                          </View>
                        )}
                      </View>
                    </>
                  )}
                </ScrollView>
              </Animated.View>
            </View>
          )}
        </View>
      )}
    </ScreenWrapper>
  );
};

export default Profile;

const styles = StyleSheet.create({
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
  profileIconContainer: {
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
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacingX._20
  },
  scrollContent: {
    paddingBottom: spacingY._40
  },
  // Login prompt styles
  loginPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacingY._50,
    flex: 1
  },
  loginPromptText: {
    fontSize: 16,
    color: colors.neutral500,
    marginTop: spacingY._15,
    marginBottom: spacingY._20
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacingX._25,
    paddingVertical: spacingY._12,
    borderRadius: radius._10
  },
  loginButtonText: {
    color: colors.white,
    fontWeight: 'bold'
  },
  // Profile card styles
  profileCard: {
    backgroundColor: colors.lightGreen,
    borderRadius: radius._15,
    padding: spacingX._15,
    marginTop: spacingY._15,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  profileImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.primary
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.secondaryGreen,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white
  },
  imageUploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileInfo: {
    marginLeft: spacingX._15,
    flex: 1
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4
  },
  profileEmail: {
    fontSize: 14,
    color: colors.neutral600
  },
  // Menu section styles
  menuSection: {
    backgroundColor: colors.lightGreen,
    borderRadius: radius._15,
    marginTop: spacingY._15,
    padding: spacingX._5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius._10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacingX._12
  },
  menuTextContainer: {
    flex: 1
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text
  },
  // Recent orders section
  recentOrdersSection: {
    marginTop: spacingY._15
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacingY._10
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: spacingX._8
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500'
  },
  // Loading styles
  loadingContainer: {
    padding: spacingY._30,
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: colors.neutral500
  },
  // Empty orders styles
  emptyOrdersContainer: {
    alignItems: 'center',
    padding: spacingY._30,
    backgroundColor: colors.lightGreen,
    borderRadius: radius._15
  },
  emptyOrdersText: {
    fontSize: 16,
    color: colors.neutral500,
    marginTop: spacingY._15,
    marginBottom: spacingY._20,
    textAlign: 'center'
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._10,
    borderRadius: radius._10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  browseButtonText: {
    color: colors.white,
    marginLeft: spacingX._8,
    fontWeight: 'bold'
  },
  // Orders list styles
  ordersList: {
    marginBottom: spacingY._15
  },
  orderCard: {
    backgroundColor: colors.lightGreen,
    borderRadius: radius._15,
    marginBottom: spacingY._15,
    padding: spacingX._15,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text
  },
  orderDate: {
    fontSize: 12,
    color: colors.neutral600,
    marginTop: 2
  },
  orderHeaderRight: {
    alignItems: 'flex-end'
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 4
  },
  statusBadge: {
    paddingHorizontal: spacingX._8,
    paddingVertical: 2,
    borderRadius: radius._10
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  // Order details styles
  orderDetails: {
    marginTop: spacingY._15,
    paddingTop: spacingY._15,
    borderTopWidth: 1,
    borderTopColor: colors.neutral200
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  orderInfoLabel: {
    color: colors.neutral600,
    fontSize: 14
  },
  orderInfoValue: {
    fontWeight: '500',
    fontSize: 14
  },
  deliveryAddressContainer: {
    backgroundColor: colors.white,
    borderRadius: radius._10,
    padding: spacingX._10,
    marginTop: spacingY._8,
    marginBottom: spacingY._10
  },
  deliveryAddressTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4
  },
  deliveryAddressText: {
    fontSize: 13,
    color: colors.neutral600
  },
  productListHeader: {
    marginVertical: spacingY._8
  },
  productListTitle: {
    fontSize: 15,
    fontWeight: 'bold'
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._10,
    backgroundColor: colors.white,
    padding: 8,
    borderRadius: radius._10
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: radius._8,
    backgroundColor: colors.accent
  },
  productDetails: {
    flex: 1,
    marginLeft: spacingX._10
  },
  productName: {
    fontSize: 14,
    fontWeight: '500'
  },
  productPrice: {
    fontSize: 12,
    color: colors.neutral600
  },
  productTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.secondaryGreen
  },
  // All Orders Panel styles
  allOrdersPanel: {
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
  allOrdersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._15
  },
  allOrdersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: spacingX._10,
    flex: 1
  },
  closeButton: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.neutral500
  },
  allOrdersList: {
    paddingBottom: spacingY._20
  },
  drawerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-end',
    zIndex: 100
  },
  drawerScrollContent: {
    flex: 1
  },
  drawerContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 50 : 20
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacingY._20,
    paddingTop: spacingY._10
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  balanceText: {
    fontSize: 14,
    color: colors.secondaryGreen,
    fontWeight: 'bold',
    marginLeft: 4
  },
  inputContainer: {
    marginBottom: spacingY._20
  },
  inputLabel: {
    fontSize: 14,
    color: colors.neutral600,
    marginBottom: spacingY._5
  },
  input: {
    backgroundColor: colors.lightGreen,
    borderRadius: radius._10,
    padding: spacingX._15,
    fontSize: 16,
    color: colors.text
  },
  redeemButton: {
    backgroundColor: colors.primary,
    borderRadius: radius._10,
    padding: spacingX._15,
    alignItems: 'center',
    marginTop: 'auto'
  },
  redeemButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold'
  },
  addButton: {
    backgroundColor: colors.secondaryGreen,
    borderRadius: radius._10,
    padding: spacingX._15,
    alignItems: 'center',
    marginTop: 'auto'
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold'
  },
  // Card Item styles
  cardsContainer: {
    marginBottom: spacingY._20
  },
  cardItem: {
    backgroundColor: colors.lightGreen,
    borderRadius: radius._10,
    padding: spacingX._15,
    marginBottom: spacingY._15,
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardContent: {
    flex: 1
  },
  cardTypeContainer: {
    marginBottom: 8
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
  deleteCardButton: {
    padding: 10
  },

  // Add Card Button styles
  noCardsContainer: {
    alignItems: 'center',
    padding: spacingY._30,
    marginBottom: spacingY._20
  },
  noCardsText: {
    fontSize: 16,
    color: colors.neutral500,
    marginTop: spacingY._15
  },
  addCardButton: {
    backgroundColor: colors.primary,
    borderRadius: radius._10,
    padding: spacingX._15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto'
  },
  addCardButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: spacingX._10
  },

  // Add Card Form styles
  addCardForm: {
    flex: 1
  },
  formSection: {
    marginBottom: spacingY._20
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacingY._15
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.rose
  },
  errorText: {
    color: colors.rose,
    fontSize: 12,
    marginTop: 4
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacingY._20
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.neutral200,
    borderRadius: radius._10,
    padding: spacingX._15,
    alignItems: 'center',
    marginRight: 10
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold'
  },
  saveCardButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius._10,
    padding: spacingX._15,
    alignItems: 'center'
  },
  saveCardButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold'
  },
  cardSelectionSection: {
    marginTop: spacingY._20,
    marginBottom: spacingY._20
  },
  cardSelectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacingY._10
  },
  cardsList: {
    marginBottom: spacingY._10
  },
  disabledButton: {
    backgroundColor: colors.neutral400,
    opacity: 0.7
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
  selectedCardItem: {
    backgroundColor: colors.neutral200
  },
  loyaltyHeader: {
    alignItems: 'center',
    marginBottom: spacingY._20
  },
  loyaltyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacingY._10,
    marginBottom: 4,
    textAlign: 'center'
  },
  loyaltySubtitle: {
    fontSize: 14,
    color: colors.neutral600,
    textAlign: 'center'
  },
  progressBarContainer: {
    marginBottom: spacingY._20
  },
  progressBar: {
    backgroundColor: colors.neutral200,
    borderRadius: radius._10,
    height: 20,
    marginBottom: 8
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: radius._10,
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center'
  },
  loyaltyCalendarContainer: {
    marginBottom: spacingY._20
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacingY._15
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.lightGreen,
    padding: spacingX._10,
    borderRadius: radius._10
  },
  calendarDay: {
    width: '14.28%',
    alignItems: 'center',
    marginBottom: spacingY._15
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral300
  },
  checkedInDay: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  futureDay: {
    backgroundColor: colors.neutral100,
    borderColor: colors.neutral200
  },
  dayNumber: {
    fontSize: 12,
    color: colors.neutral600,
    marginTop: 4
  },
  futureDayText: {
    fontSize: 14,
    color: colors.neutral400
  },
  rewardContainer: {
    marginTop: spacingY._10,
    marginBottom: spacingY._20
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacingY._10
  },
  rewardCard: {
    backgroundColor: colors.lightGreen,
    padding: spacingX._15,
    borderRadius: radius._10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  rewardDescription: {
    fontSize: 16,
    color: colors.text,
    marginLeft: spacingX._10,
    flex: 1
  },
  rewardEarnedContainer: {
    backgroundColor: colors.lightGreen,
    borderRadius: radius._10,
    padding: spacingX._15,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacingY._15,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed'
  },
  rewardEarnedText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: spacingX._10,
    flex: 1
  },
  noLoyaltyContainer: {
    alignItems: 'center',
    padding: spacingY._30
  },
  noLoyaltyText: {
    fontSize: 16,
    color: colors.neutral500,
    marginTop: spacingY._15,
    textAlign: 'center'
  }
});

import { StyleSheet, View, TouchableOpacity, FlatList, Image, Dimensions, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import {
  Coffee,
  Plus,
  Minus,
  ShoppingCart,
  MagnifyingGlass // 🔄 correct Phosphor icon name
} from 'phosphor-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import ScreenWrapper from '../../components/ScreenWrapper';
import Typo from '../../components/Typo';
import { colors, spacingX, spacingY, radius } from '../../constants/theme';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { addToCart, showAddToCartNotification } from '../../utils/cartUtils';

const { width } = Dimensions.get('window');

const Menu = () => {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState({});

  const menuScale = useSharedValue(1);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const items = [];
        querySnapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        setMenuItems(items);
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const handleQuantity = (id, delta) => setQuantities(q => ({ ...q, [id]: Math.max(1, (q[id] || 1) + delta) }));

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

  const filteredMenuItems = menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuCard}>
      <View style={styles.menuImageWrapper}>
        <Image source={{ uri: item.imageUrl }} style={styles.menuImage} />
      </View>
      <Typo style={styles.menuName}>{item.name}</Typo>
      <Typo style={styles.menuPrice}>${item.price?.toFixed(2)}</Typo>
      <TouchableOpacity style={tw`bg-black p-1 rounded-xl top-1 mb-[-20]`} onPress={() => handleAddToOrder(item)}>
        <Plus color='white' size={20} weight='bold' />
      </TouchableOpacity>
    </View>
  );

  const MenuHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerBg}>
        <View style={tw`absolute w-full h-30 bg-[${colors.primary}] top-[-20]`} />
        <Svg xmlns='http://www.w3.org/2000/svg' height={120} width={width} viewBox='0 0 1440 402'>
          <Path
            fill={colors.primary}
            fillOpacity='1'
            d='M0,288L48,272C96,256,192,224,288,208C384,192,480,192,576,202.7C672,213,768,235,864,218.7C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192L1440,0 0 0Z'
          />
        </Svg>
      </View>
      <View style={styles.headerContent}>
        <View style={styles.menuIconContainer}>
          <Coffee size={30} color={colors.white} weight='bold' />
        </View>
        <Typo style={styles.headerTitle}>Menu</Typo>
      </View>
    </View>
  );

  return (
    <ScreenWrapper showBackButton backRoute='./'>
      <MenuHeader />

      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <MagnifyingGlass /* 🔄 updated icon */
            size={20}
            color={colors.neutral500}
            weight='bold'
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder='Search menu items...'
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Typo style={styles.loadingText}>Loading menu...</Typo>
          </View>
        ) : filteredMenuItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Typo style={styles.emptyText}>No items found</Typo>
          </View>
        ) : (
          <FlatList
            key={'grid'}
            data={filteredMenuItems}
            renderItem={renderMenuItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.menuList}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.columnWrapper}
          />
        )}
      </View>
    </ScreenWrapper>
  );
};

export default Menu;

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
  menuIconContainer: {
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
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGreen,
    borderRadius: radius._15,
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._10,
    marginTop: spacingY._15,
    marginBottom: spacingY._20
  },
  searchIcon: {
    marginRight: spacingX._10
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text
  },
  // Loading and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: colors.neutral500
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: colors.neutral500
  },
  // Menu list styles
  menuList: {
    paddingBottom: spacingY._20
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 70
  },
  menuCard: {
    backgroundColor: colors.lightGreen,
    borderRadius: 30,
    borderEndStartRadius: 80,
    borderEndEndRadius: 80,
    padding: 16,
    width: width / 2 - 30,
    alignItems: 'center',
    marginTop: 50,
    height: 180
  },
  menuImageWrapper: {
    position: 'absolute',
    top: -50,
    zIndex: 2,
    alignItems: 'center',
    width: '100%'
  },
  menuImage: {
    width: 100,
    height: 100,
    padding: 0,
    margin: 0,
    marginBottom: 8,
    transform: [{ rotateZ: '-9deg' }]
  },
  menuName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.black,
    marginBottom: 4,
    marginTop: 50,
    textAlign: 'center'
  },
  menuPrice: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 20
  }
});

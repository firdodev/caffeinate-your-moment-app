// app/(main)/home.tsx
import tw from 'twrnc';

import React, { useEffect, useState, useCallback } from 'react';
import { Image, StyleSheet, View, Text, ScrollView, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Typo from '../../components/Typo';
import { radius, spacingX, spacingY, colors } from '../../constants/theme';
import { verticalScale } from '../../utils/styling';
import SearchInput from '../../components/SearchInput';
import { Bell, Plus, HandWaving, ShoppingCart, List, X } from 'phosphor-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  runOnJS
} from 'react-native-reanimated';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Available categories for the tabs
const categories = [
  { id: 'coffee', name: 'Coffee' },
  { id: 'tea', name: 'Tea' },
  { id: 'pastries', name: 'Pastries' },
  { id: 'snacks', name: 'Snacks' },
  { id: 'desserts', name: 'Desserts' }
];

const Header = ({ menuOpen, toggleMenu, activeCategory, setActiveCategory }) => {
  // Animation values
  const menuAnimation = useSharedValue(0);
  const iconRotation = useSharedValue(0);

  // Update animation when menu state changes
  useEffect(() => {
    if (menuOpen) {
      menuAnimation.value = withSpring(1, { damping: 12, stiffness: 90 });
      iconRotation.value = withTiming(1, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    } else {
      menuAnimation.value = withTiming(0, { duration: 250, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
      iconRotation.value = withTiming(0, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    }
  }, [menuOpen]);

  // Animated styles for the menu background
  const menuBgStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: interpolate(menuAnimation.value, [0, 1], [1, 15]) }],
      opacity: interpolate(menuAnimation.value, [0, 0.5, 1], [1, 0.8, 1])
    };
  });

  // Animated styles for the menu content
  const menuContentStyle = useAnimatedStyle(() => {
    return {
      opacity: menuAnimation.value,
      transform: [
        { translateY: interpolate(menuAnimation.value, [0, 1], [-20, 0]) },
        { scale: interpolate(menuAnimation.value, [0, 1], [0.8, 1]) }
      ],
      display: menuAnimation.value === 0 ? 'none' : 'flex'
    };
  });

  // Animated styles for icon transformation
  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${interpolate(iconRotation.value, [0, 1], [0, 45])}deg` }]
    };
  });

  // Handle category selection
  const handleCategorySelect = categoryId => {
    setActiveCategory(categoryId);
    toggleMenu();
  };

  return (
    <View style={styles.headerContainer}>
      {/* Curved Background */}
      <View style={styles.headerBg}>
        <View style={tw`absolute w-full h-30 bg-[${colors.primary}] top-[-20]`}></View>
        <Svg xmlns='http://www.w3.org/2000/svg' height={200} width={width} viewBox={`0 0 1440 402`}>
          <Path
            fill={colors.primary}
            fill-opacity='1'
            d='M0,288L48,272C96,256,192,224,288,208C384,192,480,192,576,202.7C672,213,768,235,864,218.7C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z'
          ></Path>
        </Svg>
      </View>

      {/* Content layered on top of the curved background */}
      <View style={styles.headerContent}>
        <View style={styles.headerRow}>
          {/* Profile Image */}
          <TouchableOpacity>
            <Image source={{ uri: 'https://i.pravatar.cc/100' }} style={styles.profileImage} />
          </TouchableOpacity>

          {/* Category Menu Button */}
          <TouchableOpacity style={styles.iconContainer_listicon} onPress={toggleMenu}>
            <Animated.View style={[styles.menuButtonBackground, menuBgStyle]} />
            <Animated.View style={iconStyle}>
              {menuOpen ? (
                <X size={24} color={colors.white} weight='bold' />
              ) : (
                <List size={24} color={colors.white} weight='bold' />
              )}
            </Animated.View>

            {/* Category Menu Items */}
            <Animated.View style={[styles.categoryMenuContainer, menuContentStyle]}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryItem, activeCategory === category.id && styles.activeCategoryItem]}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <Text style={[styles.categoryText, activeCategory === category.id && styles.activeCategoryText]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </TouchableOpacity>

          {/* Icons */}
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconContainer}>
              <Bell size={24} color={colors.white} weight='bold' />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconContainer}>
              <ShoppingCart size={24} color={colors.white} weight='bold' />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const Home = () => {
  const rotation = useSharedValue(0);
  const [menu, setMenu] = useState([]);
  const [special, setSpecial] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('coffee');
  const [filteredMenu, setFilteredMenu] = useState([]);

  // Toggle menu state
  const toggleMenu = useCallback(() => {
    setMenuOpen(prev => !prev);
  }, []);

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

  useEffect(() => {
    // Fetch menu items from Firestore
    const fetchMenu = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const items = [];
        querySnapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setMenu(items);
        // For 'Special for you', just pick first 3 for now
        setSpecial(items.slice(0, 3));
      } catch (error) {
        console.error('Error fetching menu items:', error);
      }
    };
    fetchMenu();
  }, []);

  // Filter menu based on active category
  useEffect(() => {
    if (menu.length > 0) {
      // In a real app, you'd filter by category. For now, let's simulate it
      // Assume each item has a 'category' field
      const filtered = menu.filter(
        item =>
          // If you don't have category in your data yet,
          // this will show all items for 'coffee' and none for others
          item.category === activeCategory || activeCategory === 'coffee'
      );
      setFilteredMenu(filtered.length > 0 ? filtered : menu.slice(0, 3));
    }
  }, [activeCategory, menu]);

  const handleQuantity = (id, delta) => {
    setQuantities(q => ({ ...q, [id]: Math.max(1, (q[id] || 1) + delta) }));
  };

  const handleAddToOrder = item => {
    // TODO: Integrate with Firestore orders
    alert(`Added ${quantities[item.id] || 1} x ${item.name} to order!`);
  };

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuCard}>
      <View style={styles.menuImageWrapper}>
        <Image source={{ uri: item.imageUrl }} style={styles.menuImage} />
      </View>
      <Text style={styles.menuName}>{item.name}</Text>
      <Text style={styles.menuPrice}>${item.price?.toFixed(2)}</Text>
      <TouchableOpacity style={tw`bg-black p-1 rounded-xl top-1 mb-[-20]`} onPress={() => handleAddToOrder(item)}>
        <Plus color='white' style={tw`font-bold`} />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWrapper>
      <Header
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.greeting}>
          <View style={styles.userRow}>
            <Animated.View style={handStyle}>
              <HandWaving size={24} color={colors.primary} weight='fill' />
            </Animated.View>
            <Typo variant='title'>Good Morning</Typo>
          </View>
          <Typo variant='body' style={styles.greetingSubtitle}>
            Let's order fresh {activeCategory}
          </Typo>
        </View>

        <SearchInput placeholder={`Search ${activeCategory}...`} />

        {/* Special For You Section */}
        <View style={styles.sectionHeader}>
          <Typo variant='title' style={styles.sectionTitle}>
            Special for you
          </Typo>
          <TouchableOpacity>
            <Typo variant='caption' style={styles.viewAll}>
              View All
            </Typo>
          </TouchableOpacity>
        </View>

        {special.length > 0 ? (
          <FlatList
            data={special}
            renderItem={renderMenuItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.menuList}
          />
        ) : (
          <View style={tw`py-4`}>
            <Typo variant='body'>Loading special items...</Typo>
          </View>
        )}

        {/* Menu Section */}
        <View style={styles.sectionHeader}>
          <Typo variant='title' style={styles.sectionTitle}>
            {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Menu
          </Typo>
          <TouchableOpacity>
            <Typo variant='caption' style={styles.viewAll}>
              View All
            </Typo>
          </TouchableOpacity>
        </View>

        {filteredMenu.length > 0 ? (
          <FlatList
            data={filteredMenu}
            renderItem={renderMenuItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.menuList}
          />
        ) : (
          <View style={tw`py-4`}>
            <Typo variant='body'>No {activeCategory} items found</Typo>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default Home;

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
    paddingTop: spacingY._10,
    paddingHorizontal: spacingX._20,
    zIndex: 2
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  profileImage: {
    width: verticalScale(60),
    height: verticalScale(60),
    borderRadius: radius._30,
    borderWidth: 2,
    borderColor: colors.white
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconContainer: {
    marginLeft: spacingX._15
  },
  iconContainer_listicon: {
    marginLeft: spacingX._15,
    backgroundColor: colors.secondaryGreen,
    padding: 10,
    borderRadius: 13,
    borderEndStartRadius: 20,
    borderEndEndRadius: 20,
    position: 'relative',
    zIndex: 20,
    overflow: 'visible'
  },
  // Menu button animation styles
  menuButtonBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.secondaryGreen,
    borderRadius: 13,
    borderEndStartRadius: 20,
    borderEndEndRadius: 20,
    zIndex: -1
  },
  categoryMenuContainer: {
    position: 'absolute',
    top: 60,
    left: -100,
    width: 250,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 100
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 5
  },
  activeCategoryItem: {
    backgroundColor: colors.primary
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black
  },
  activeCategoryText: {
    color: colors.white
  },

  // Original styles
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20
  },
  greeting: {
    marginTop: spacingY._10,
    marginBottom: spacingY._15
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._5,
    marginBottom: spacingY._5
  },
  greetingSubtitle: {
    color: colors.neutral500
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacingY._20,
    marginBottom: spacingY._10
  },
  sectionTitle: {
    color: colors.black,
    fontSize: 20,
    fontWeight: 'bold'
  },
  viewAll: {
    color: colors.primary,
    fontSize: 14
  },
  menuList: {
    paddingBottom: spacingY._10
  },
  menuCard: {
    backgroundColor: colors.lightGreen,
    borderRadius: 30,
    borderEndStartRadius: 80,
    borderEndEndRadius: 80,
    marginRight: 16,
    padding: 16,
    width: 180,
    alignItems: 'center',
    marginTop: 50
  },
  menuImageWrapper: {
    position: 'absolute',
    top: -37,
    zIndex: 2,
    alignItems: 'center',
    width: '100%'
  },
  menuImage: {
    width: 120,
    height: 120,
    padding: 0,
    margin: 0,
    marginBottom: 8,
    transform: 'rotateZ(-9deg)'
  },
  menuName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.black,
    marginBottom: 4,
    marginTop: 50
  },
  menuPrice: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 20
  },
  menuActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  qtyBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginHorizontal: 4
  },
  qtyText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: 'bold'
  },
  addBtn: {
    backgroundColor: colors.primary,
    padding: 10,
    top: 5
  },
  addBtnText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16
  }
});

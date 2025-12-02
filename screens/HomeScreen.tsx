import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, Image, TextInput, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Category } from '../types';
import { categoryImages } from '../data/categoryImages';

const { width, width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (width - 32) / 2; // 2 Spalten mit 12px Padding auf jeder Seite + 8px Abstand zwischen Karten

interface HomeScreenProps {
  categories: Category[];
  onCategoryPress: (category: Category) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFavoritesPress?: () => void;
  onCartPress?: () => void;
  onShoppingListPress?: () => void;
  onChatPress?: () => void;
  onOffersPress?: () => void;
  onOrderHistoryPress?: () => void;
  onSalesAppPress?: () => void;
  favoritesCount?: number;
  cartCount?: number;
  shoppingListCount?: number;
  onHeaderCartPress?: () => void;
  onSearchFocus?: () => void;
  isProductListOpen?: boolean;
}

// Memoized Category Item Component
const CategoryItem = React.memo(({ 
  category, 
  onPress 
}: { 
  category: Category; 
  onPress: (category: Category) => void;
}) => {
  const categoryImage = categoryImages[category.csvFile];
  
  return (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => onPress(category)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {categoryImage ? (
          <Image
            source={categoryImage}
            style={styles.categoryImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.categoryImagePlaceholder}>
            <Ionicons name="grid" size={40} color="#ccc" />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradientOverlay}
        >
          <Text style={styles.categoryName} numberOfLines={2}>
            {category.name}
          </Text>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
});

export default function HomeScreen({ 
  categories, 
  onCategoryPress, 
  searchQuery, 
  onSearchChange,
  onFavoritesPress,
  onCartPress,
  onShoppingListPress,
  onChatPress,
  onOffersPress,
  onOrderHistoryPress,
  onSalesAppPress,
  favoritesCount = 0,
  cartCount = 0,
  shoppingListCount = 0,
  onHeaderCartPress,
  onSearchFocus,
  isProductListOpen = false,
}: HomeScreenProps) {
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarTranslateX = useRef(new Animated.Value(-SCREEN_WIDTH * 0.8)).current;
  const sidebarOverlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showSidebar) {
      Animated.parallel([
        Animated.spring(sidebarTranslateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 10,
        }),
        Animated.timing(sidebarOverlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(sidebarTranslateX, {
          toValue: -SCREEN_WIDTH * 0.8,
          useNativeDriver: true,
          tension: 50,
          friction: 10,
        }),
        Animated.timing(sidebarOverlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showSidebar]);

  const closeSidebar = () => {
    setShowSidebar(false);
  };

  const renderCategoryItem = useCallback(({ item }: { item: Category }) => (
    <CategoryItem category={item} onPress={onCategoryPress} />
  ), [onCategoryPress]);

  const keyExtractor = useCallback((item: Category) => item.id, []);

  const ListHeader = useMemo(() => (
    <>
      {/* KartellDeals Sektion */}
      <TouchableOpacity 
        style={styles.dealsContainer}
        onPress={onOffersPress}
        activeOpacity={0.8}
      >
        <Image
          source={require('../assets/events/KartellDeals.jpeg')}
          style={styles.dealsImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Schnellzugriff</Text>
      <View style={styles.quickAccessContainer}>
        <TouchableOpacity 
          style={styles.quickAccessItem}
          onPress={onFavoritesPress}
          activeOpacity={0.7}
        >
          <View style={styles.quickAccessIconContainer}>
            <Ionicons name="heart" size={28} color="#FF3B30" />
          </View>
          <Text style={styles.quickAccessLabel}>Favoriten</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAccessItem}
          onPress={onShoppingListPress}
          activeOpacity={0.7}
        >
          <View style={styles.quickAccessIconContainer}>
            <Ionicons name="list" size={28} color="#2E2C55" />
          </View>
          <Text style={styles.quickAccessLabel}>Einkaufsliste</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Artikel</Text>
    </>
  ), [onFavoritesPress, onCartPress, cartCount]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView style={styles.safeAreaTop}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setShowSidebar(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={28} color="#2E2C55" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <View style={styles.logoTextContainer}>
                <Text style={styles.logoText}>TRINKKARTELL</Text>
                <Text style={styles.taglineText}>
                  IMMER <Text style={styles.taglineBold}>DURSTIG.</Text>
                </Text>
              </View>
            </View>
            {onHeaderCartPress && (
              <TouchableOpacity 
                style={styles.cartButton}
                onPress={onHeaderCartPress}
                activeOpacity={0.7}
              >
                <Ionicons name="cart" size={28} color="#2E2C55" />
                {cartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Produkt suchen..."
                placeholderTextColor="#777"
                value={searchQuery}
                onChangeText={onSearchChange}
                onFocus={onSearchFocus}
                editable={true}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={styles.gridContainer}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
      />
      <TouchableOpacity 
        style={styles.chatButton}
        onPress={() => {
          if (onChatPress) {
            onChatPress();
          }
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="chatbubble" size={24} color="#2E2C55" />
      </TouchableOpacity>
      
      {/* Sidebar Overlay */}
      {showSidebar && (
      <>
        <Animated.View 
          style={[
            styles.sidebarOverlay,
            {
              opacity: sidebarOverlayOpacity,
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.sidebarOverlayTouchable}
            activeOpacity={1}
            onPress={closeSidebar}
          />
        </Animated.View>
        <Animated.View 
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: sidebarTranslateX }],
            }
          ]}
        >
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Menü</Text>
            <TouchableOpacity 
              onPress={closeSidebar}
              style={styles.sidebarCloseButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#2E2C55" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.sidebarContent}>
              <TouchableOpacity 
                style={styles.sidebarItem}
                onPress={() => {
                  closeSidebar();
                  if (onOrderHistoryPress) {
                    onOrderHistoryPress();
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={24} color="#2E2C55" />
                <Text style={styles.sidebarItemText}>Bestellhistorie</Text>
              </TouchableOpacity>
            
              <TouchableOpacity 
                style={styles.sidebarItem}
                onPress={() => {
                  closeSidebar();
                  if (onSalesAppPress) {
                    onSalesAppPress();
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="business-outline" size={24} color="#2E2C55" />
                <Text style={styles.sidebarItemText}>Zur Vertriebsapp</Text>
              </TouchableOpacity>
          </View>
          
          <View style={styles.sidebarFooter}>
            <TouchableOpacity 
              style={styles.sidebarItem}
              onPress={() => {
                closeSidebar();
                // TODO: Navigate to settings
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={24} color="#2E2C55" />
              <Text style={styles.sidebarItemText}>Einstellungen</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </>
    )}
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeAreaTop: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    position: 'relative',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  logoTextContainer: {
    alignItems: 'flex-end',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E2C55',
    fontFamily: 'Georgia',
  },
  taglineText: {
    fontSize: 14,
    color: '#2E2C55',
    fontFamily: 'Georgia',
    marginTop: 2,
  },
  taglineBold: {
    fontWeight: 'bold',
  },
  searchContainer: {
    width: '90%',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    borderWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#2E2C55',
    padding: 0,
  },
  cartButton: {
    position: 'absolute',
    right: 0,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: 55,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E2C55',
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  quickAccessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  quickAccessItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: (width - 32) / 2 - 4,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  quickAccessIconContainer: {
    marginBottom: 8,
  },
  quickAccessLabel: {
    fontSize: 14,
    color: '#2E2C55',
    fontWeight: '500',
  },
  quickAccessBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  quickAccessBadgeFavorites: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#999',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  quickAccessBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    width: CARD_WIDTH,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    resizeMode: 'cover',
  },
  categoryImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 10,
    justifyContent: 'flex-end',
  },
  categoryName: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  chatButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#2E2C55',
  },
  dealsContainer: {
    marginBottom: 24,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  dealsImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  menuButton: {
    position: 'absolute',
    left: 20,
    padding: 4,
    zIndex: 10,
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  sidebarOverlayTouchable: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 0.8,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2E2C55',
  },
  sidebarCloseButton: {
    padding: 4,
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 20,
  },
  sidebarFooter: {
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 20,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sidebarItemText: {
    fontSize: 16,
    color: '#2E2C55',
    marginLeft: 16,
    fontWeight: '500',
  },
});


import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, Image, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Category } from '../types';
import { categoryImages } from '../data/categoryImages';

const { width } = Dimensions.get('window');
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
  favoritesCount = 0,
  cartCount = 0,
  shoppingListCount = 0,
  onHeaderCartPress,
  onSearchFocus,
  isProductListOpen = false,
}: HomeScreenProps) {

  const renderCategoryItem = useCallback(({ item }: { item: Category }) => (
    <CategoryItem category={item} onPress={onCategoryPress} />
  ), [onCategoryPress]);

  const keyExtractor = useCallback((item: Category) => item.id, []);

  const ListHeader = useMemo(() => (
    <>
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
            <Ionicons name="bag" size={28} color="#2E2C55" />
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
});

